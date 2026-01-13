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
    notes: DailyNote;
    updateNote: (dateKey: string, data: Partial<DayData>) => void;
    addHabit: () => void;
    setSelectedDateForCard: (date: Date | null, flipped?: boolean) => void;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
    habits,
    completions,
    currentYear,
    weekOffset,
    theme,
    toggleCompletion,
    notes,
    updateNote,
    addHabit,
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

    // Journal view toggle state
    const [showJournalView, setShowJournalView] = useState(false);

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
        const adjustedIndex = day === 0 ? 6 : day - 1;
        setMobileDayIndex(Math.max(0, Math.min(6, adjustedIndex)));
    }, []);
    // ^ Only run on mount. If weekOffset changes, maybe reset? 
    // Ideally we stay on the same "relative" day index when switching weeks.

    // Calculate the dates for the current week (starting Monday)
    const getWeekDates = () => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7); // adjust when day is sunday and add offset
        const monday = new Date(today.getFullYear(), today.getMonth(), diff);

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
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

    const handleJournalClick = () => {
        setShowJournalView(!showJournalView);
    };

    return (
        <>
            {/* Desktop View (Grid) */}
            <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-7 gap-4">
                {weekDates.map((date) => (
                    <DailyCard
                        key={date.toISOString()}
                        date={date}
                        habits={habits.filter(h => h.weeklyTarget || !h.frequency || h.frequency.includes(date.getDay()))}
                        completions={completions}
                        theme={theme}
                        toggleCompletion={toggleCompletion}
                        notes={notes}
                        updateNote={updateNote}
                        onShareClick={handleShareClick}
                        defaultFlipped={showJournalView}
                        onJournalClick={handleJournalClick}
                    />
                ))}
            </div>

            {/* Mobile View (Day Switcher) */}
            <div className="md:hidden flex flex-col gap-4 min-h-full">
                <div className="w-full">
                    <DailyCard
                        key={weekDates[mobileDayIndex].toISOString()}
                        date={weekDates[mobileDayIndex]}
                        habits={habits.filter(h => !h.frequency || h.frequency.includes(weekDates[mobileDayIndex].getDay()))}
                        completions={completions}
                        theme={theme}
                        toggleCompletion={toggleCompletion}
                        notes={notes}
                        updateNote={updateNote}
                        onShareClick={handleShareClick}
                        onPrev={handlePrevDay}
                        onNext={handleNextDay}
                        defaultFlipped={showJournalView}
                        onJournalClick={handleJournalClick}
                    />
                </div>
            </div>

            <ShareCustomizationModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                onShare={handleShareConfirm}
            />
        </>
    );
};
