import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Habit, HabitCompletion, Theme, DailyNote, Task, DayData } from '../types';
import { generateShareCard, shareCard } from '../utils/shareCardGenerator';
import { ShareCustomizationModal, ColorScheme } from './ShareCustomizationModal';
import { DailyCard } from './DailyCard';

interface WeeklyViewProps {
    habits: Habit[];
    completions: HabitCompletion;
    currentYear: number;
    weekOffset: number;
    theme: Theme;
    toggleCompletion: (habitId: string, dateKey: string) => void;
    toggleHabitInactive: (habitId: string, dateKey: string) => void;
    isHabitInactive: (habitId: string, dateKey: string) => boolean;
    notes: DailyNote;
    updateNote: (dateKey: string, data: Partial<DayData>) => void;
    addHabit: () => void;
    setSelectedDateForCard: (date: Date | null, flipped?: boolean) => void;
    startOfWeek: 'monday' | 'sunday';
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
    habits,
    completions,
    currentYear,
    weekOffset,
    theme,
    toggleCompletion,
    toggleHabitInactive,
    isHabitInactive,
    notes,
    updateNote,
    addHabit,
    setSelectedDateForCard,
    startOfWeek,
}) => {
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareData, setShareData] = useState<{
        date: Date;
        dayName: string;
        dateString: string;
        completedCount: number;
        totalCount: number;
        progress: number;
    } | null>(null);

    // Mobile navigation state
    const [mobileDayIndex, setMobileDayIndex] = useState(0);

    // Task view toggle state (applies to all weekly cards)
    const [showTasksForWeek, setShowTasksForWeek] = useState(false);
    const [showJournalForWeek, setShowJournalForWeek] = useState(false);

    // To detect mobile view and set initial day
    useEffect(() => {
        // Set to current day of week (0-6) initially
        // Note: getDay() returns 0 for Sunday. 
        // Our lists usually start Monday? 
        // The getWeekDates function generates Mon-Sun.
        // Let's match the current day to the generated dates.
        const today = new Date();
        const day = today.getDay(); // 0 is Sunday, 1 is Monday...
        // If week starts on Monday (1):
        // Mon(1) -> 0
        // Tue(2) -> 1
        // ...
        // Sun(0) -> 6

        // If week starts on Sunday (0):
        // Sun(0) -> 0
        // Mon(1) -> 1
        // ...

        let adjustedIndex;
        if (startOfWeek === 'monday') {
            adjustedIndex = day === 0 ? 6 : day - 1;
        } else {
            adjustedIndex = day;
        }
        setMobileDayIndex(Math.max(0, Math.min(6, adjustedIndex)));
    }, [startOfWeek]);
    // ^ Only run on mount. If weekOffset changes, maybe reset? 
    // Ideally we stay on the same "relative" day index when switching weeks.

    // Calculate the dates for the current week (starting Monday)
    const getWeekDates = () => {
        const today = new Date();
        const day = today.getDay();

        let diff;
        if (startOfWeek === 'monday') {
            diff = today.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7);
        } else {
            diff = today.getDate() - day + (weekOffset * 7);
        }

        const startOfCurrentWeek = new Date(today.getFullYear(), today.getMonth(), diff);
        const startDay = startOfCurrentWeek; // Rename for clarity, it's either Mon or Sun

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startDay);
            date.setDate(startDay.getDate() + i);
            return date;
        });
    };

    const weekDates = getWeekDates();

    const handleShareClick = (data: { date: Date, dayName: string, dateString: string, completedCount: number, totalCount: number, progress: number }) => {
        setShareData(data);
        setShareModalOpen(true);
    };

    const handleShareConfirm = async (colorScheme: ColorScheme, message: string) => {
        if (!shareData) return;

        try {
            const blob = await generateShareCard({
                dayName: shareData.dayName,
                dateString: shareData.dateString,
                completedCount: shareData.completedCount,
                totalCount: shareData.totalCount,
                progress: shareData.progress,
                theme,
                colorScheme,
                message
            });
            await shareCard(blob, shareData.dayName);
        } catch (error) {
            console.error('Failed to share:', error);
        }
    };

    const handlePrevDay = () => {
        setMobileDayIndex(prev => (prev > 0 ? prev - 1 : 6)); // Wrap around or stop? User said "switch days", usually wrapping is nice or stopping. 
        // Let's wrap around for better UX: Mon <- prev -> Sun
        // Actually, if I go left from Monday, I might expect previous week? 
        // But simply switching index is safer. wrapping:
        // setMobileDayIndex(prev => (prev - 1 + 7) % 7);
    };

    const handleNextDay = () => {
        setMobileDayIndex(prev => (prev < 6 ? prev + 1 : 0));
        // setMobileDayIndex(prev => (prev + 1) % 7);
    };

    const toggleTasksForWeek = () => {
        setShowTasksForWeek(prev => {
            const next = !prev;
            if (next) setShowJournalForWeek(false);
            return next;
        });
    };

    const toggleJournalForWeek = () => {
        setShowJournalForWeek(prev => {
            const next = !prev;
            if (next) setShowTasksForWeek(false);
            return next;
        });
    };

    return (
        <div className="h-full min-h-0 p-1">
            {/* Desktop View (Grid) */}
            <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-7 gap-4 h-full auto-rows-fr">
                {weekDates.map((date) => (
                    <DailyCard
                        key={date.toISOString()}
                        date={date}
                        habits={habits.filter(h => h.weeklyTarget || !h.frequency || h.frequency.includes(date.getDay()))}
                        completions={completions}
                        theme={theme}
                        toggleCompletion={toggleCompletion}
                        toggleHabitInactive={toggleHabitInactive}
                        isHabitInactive={isHabitInactive}
                        notes={notes}
                        updateNote={updateNote}
                        onShareClick={handleShareClick}
                        onDateClick={(selectedDate) => setSelectedDateForCard(selectedDate, false)}
                        defaultFlipped={showJournalForWeek}
                        onJournalClick={toggleJournalForWeek}
                        useGlobalTaskToggle={true}
                        globalTaskMode={showTasksForWeek}
                        onGlobalTaskModeToggle={toggleTasksForWeek}
                        startOfWeek={startOfWeek}
                        fitParentHeight={true}
                    />
                ))}
            </div>

            {/* Mobile View (Day Switcher) */}
            <div className="md:hidden flex flex-col gap-4 h-full min-h-0">
                <div className="w-full flex-1 min-h-0">
                    <DailyCard
                        key={weekDates[mobileDayIndex].toISOString()}
                        date={weekDates[mobileDayIndex]}
                        habits={habits.filter(h => !h.frequency || h.frequency.includes(weekDates[mobileDayIndex].getDay()))}
                        completions={completions}
                        theme={theme}
                        toggleCompletion={toggleCompletion}
                        toggleHabitInactive={toggleHabitInactive}
                        isHabitInactive={isHabitInactive}
                        notes={notes}
                        updateNote={updateNote}
                        onShareClick={handleShareClick}
                        onDateClick={(selectedDate) => setSelectedDateForCard(selectedDate, false)}
                        onPrev={handlePrevDay}
                        onNext={handleNextDay}
                        defaultFlipped={showJournalForWeek}
                        onJournalClick={toggleJournalForWeek}
                        useGlobalTaskToggle={true}
                        globalTaskMode={showTasksForWeek}
                        onGlobalTaskModeToggle={toggleTasksForWeek}
                        startOfWeek={startOfWeek}
                        fitParentHeight={true}
                    />
                </div>
            </div>

            <ShareCustomizationModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                onShare={handleShareConfirm}
            />
        </div>
    );
};
