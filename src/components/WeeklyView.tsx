import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    cardStyle: 'compact' | 'large';
    singleCardMode?: boolean;
    weekProgress?: { completed: number; total: number; percentage: number };
    weeklyStats?: { count: number; displayDay: string }[];
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
    cardStyle,
    singleCardMode = false,
    weekProgress,
    weeklyStats,
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


    // Shared card mode state (applies to all weekly cards)
    const [weekViewMode, setWeekViewMode] = useState<'habits' | 'tasks' | 'journal'>('habits');

    useEffect(() => {
        const today = new Date();
        const day = today.getDay();
        let adjustedIndex: number;
        if (startOfWeek === 'monday') {
            adjustedIndex = day === 0 ? 6 : day - 1;
        } else {
            adjustedIndex = day;
        }
        setMobileDayIndex(Math.max(0, Math.min(6, adjustedIndex)));
    }, [startOfWeek]);


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

    const todayString = new Date().toDateString();

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

    const handlePrevDay = () => setMobileDayIndex(prev => (prev > 0 ? prev - 1 : 6));
    const handleNextDay = () => setMobileDayIndex(prev => (prev < 6 ? prev + 1 : 0));

    const dayLabels = weekDates.map(d =>
        d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2).toUpperCase()
    );

    // Build per-day bar chart data from weeklyStats prop (authoritative from useHabitStats)
    const weeklySummary = (() => {
        // authoritative totals from useHabitStats
        const totalDone = weekProgress?.completed ?? 0;
        const totalPossible = weekProgress?.total ?? 0;
        const weekPct = weekProgress ? Math.round(weekProgress.percentage) : 0;

        // per-day stats — daily habits only (no weeklyTarget), matching DailyCard circle badge
        let bestDayPct = -1, bestDayLabel = '';
        const dayStats = weekDates.map((date, i) => {
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const dailyHabits = habits.filter(h =>
                !h.weeklyTarget && (!h.frequency || h.frequency.includes(date.getDay())) && !isHabitInactive(h.id, dateKey)
            );
            const possible = dailyHabits.length;
            const done = dailyHabits.filter(h => completions[h.id]?.[dateKey]).length;
            const pct = possible > 0 ? Math.min(100, Math.round((done / possible) * 100)) : -1;
            if (pct > bestDayPct) { bestDayPct = pct; bestDayLabel = dayLabels[i]; }
            return { pct, label: dayLabels[i] };
        });

        return { totalDone, totalPossible, weekPct, bestDayLabel, bestDayPct, dayStats };
    })();

    return (
        <div className="h-full min-h-0 p-2">
            {/* Desktop View */}
            <motion.div
                className="hidden md:flex flex-col h-full min-h-0 gap-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
            >
                {/* Weekly summary strip */}
                <div className="shrink-0 flex items-stretch gap-px rounded-xl overflow-hidden border-2 border-black">
                    <div className="flex-1 flex flex-col items-center justify-center py-2 px-3 bg-white gap-0.5">
                        <span className="text-[8px] font-black uppercase tracking-wider text-stone-400">Week</span>
                        <span className="text-base font-black leading-none" style={{ color: theme.primary }}>{weeklySummary.weekPct}%</span>
                    </div>
                    <div className="w-px bg-black/10" />
                    <div className="flex-1 flex flex-col items-center justify-center py-2 px-3 bg-white gap-0.5">
                        <span className="text-[8px] font-black uppercase tracking-wider text-stone-400">Done</span>
                        <span className="text-base font-black leading-none text-stone-800">{weeklySummary.totalDone}<span className="text-stone-300 text-xs">/{weeklySummary.totalPossible}</span></span>
                    </div>
                    <div className="w-px bg-black/10" />
                    <div className="flex-1 flex flex-col items-center justify-center py-2 px-3 bg-white gap-0.5">
                        <span className="text-[8px] font-black uppercase tracking-wider text-stone-400">Best Day</span>
                        <span className="text-base font-black leading-none text-stone-800">{weeklySummary.bestDayLabel || '—'}<span className="text-stone-300 text-xs ml-0.5">{weeklySummary.bestDayPct >= 0 ? ` ${weeklySummary.bestDayPct}%` : ''}</span></span>
                    </div>
                    <div className="w-px bg-black/10" />
                    {/* Mini day bars */}
                    <div className="flex items-end gap-px px-3 py-2 bg-white">
                        {weeklySummary.dayStats.map((d, i) => (
                            <div key={i} className="flex flex-col items-center gap-0.5">
                                <div className="w-4 h-6 rounded-sm overflow-hidden bg-stone-100 flex items-end">
                                    <div
                                        className="w-full rounded-sm transition-all duration-500"
                                        style={{
                                            height: d.pct >= 0 ? `${d.pct}%` : '0%',
                                            backgroundColor: d.pct >= 100 ? theme.primary : theme.secondary,
                                            opacity: d.pct >= 100 ? 1 : 0.8,
                                        }}
                                    />
                                </div>
                                <span className="text-[7px] font-black text-stone-300">{d.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {singleCardMode ? (
                    <>
                        {/* Single-card pip strip with prev/next */}
                        <div className="flex items-center justify-center gap-1 px-1">
                            <button
                                onClick={handlePrevDay}
                                className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-black transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            {dayLabels.map((label, i) => {
                                const isToday = weekDates[i].toDateString() === todayString;
                                const isActive = i === mobileDayIndex;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setMobileDayIndex(i)}
                                        className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${
                                            isActive
                                                ? 'bg-black text-white'
                                                : isToday
                                                ? 'bg-stone-200 text-black'
                                                : 'text-stone-400 hover:text-black hover:bg-stone-100'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                            <button
                                onClick={handleNextDay}
                                className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-black transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>

                        {/* Single card */}
                        <div className="flex-1 min-h-0 flex justify-center">
                        <div className="min-h-0 h-full" style={{ width: 'min(100%, 340px)' }}>
                            <DailyCard
                                key={weekDates[mobileDayIndex].toISOString()}
                                date={weekDates[mobileDayIndex]}
                                habits={habits.filter(h => h.weeklyTarget || !h.frequency || h.frequency.includes(weekDates[mobileDayIndex].getDay()))}
                                completions={completions}
                                theme={theme}
                                toggleCompletion={toggleCompletion}
                                toggleHabitInactive={toggleHabitInactive}
                                isHabitInactive={isHabitInactive}
                                notes={notes}
                                updateNote={updateNote}
                                onShareClick={handleShareClick}
                                onDateClick={(selectedDate) => setSelectedDateForCard(selectedDate, false)}
                                globalViewMode={weekViewMode}
                                onGlobalViewModeChange={setWeekViewMode}
                                startOfWeek={startOfWeek}
                                fitParentHeight={true}
                                cardStyle={cardStyle}
                            />
                        </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Day pip strip */}
                        <div className="flex items-center justify-center gap-1.5 px-1">
                            {dayLabels.map((label, i) => {
                                const isToday = weekDates[i].toDateString() === todayString;
                                return (
                                    <div
                                        key={i}
                                        className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                            isToday ? 'bg-black text-white' : 'text-stone-400'
                                        }`}
                                    >
                                        {label}
                                    </div>
                                );
                            })}
                        </div>

                        {/* 7 cards */}
                        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden px-1 pb-[2px]">
                            <div
                                className="grid gap-1.5 h-full min-h-0 items-stretch"
                                style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
                            >
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
                                        globalViewMode={weekViewMode}
                                        onGlobalViewModeChange={setWeekViewMode}
                                        startOfWeek={startOfWeek}
                                        fitParentHeight={true}
                                        cardStyle={cardStyle}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </motion.div>

            {/* Mobile View (Day Switcher) */}
            <div className="md:hidden flex flex-col gap-4 pb-2">
                <div className="w-full">
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
                        globalViewMode={weekViewMode}
                        onGlobalViewModeChange={setWeekViewMode}
                        startOfWeek={startOfWeek}
                        fitParentHeight={false}
                        cardStyle={cardStyle}
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
