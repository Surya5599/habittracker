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
                <div className="shrink-0 grid grid-cols-[1fr_1fr_1.2fr_auto] items-stretch gap-px rounded-2xl overflow-hidden border-2 border-edge-strong bg-black/10 shadow-neo">
                    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-gradient-to-br from-white to-[#fff7ef]">
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-ink-subtle">Week</span>
                        <span className="text-lg font-black leading-none" style={{ color: theme.primary }}>{weeklySummary.weekPct}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-gradient-to-br from-white to-[#f6fbf6]">
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-ink-subtle">Done</span>
                        <span className="text-lg font-black leading-none text-ink-strong">{weeklySummary.totalDone}<span className="text-ink-dim text-xs">/{weeklySummary.totalPossible}</span></span>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-gradient-to-br from-white to-[#f2f0fb]">
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-ink-subtle">Best Day</span>
                        <span className="text-lg font-black leading-none text-ink-strong">{weeklySummary.bestDayLabel || '—'}<span className="text-ink-dim text-xs ml-1">{weeklySummary.bestDayPct >= 0 ? ` ${weeklySummary.bestDayPct}%` : ''}</span></span>
                    </div>
                    {/* Mini day bars */}
                    <div className="flex items-end gap-px px-3 py-2 bg-gradient-to-br from-white to-[#fafafa]">
                        {weeklySummary.dayStats.map((d, i) => (
                            <div key={i} className="flex flex-col items-center gap-0.5">
                                <div className="w-4 h-6 rounded overflow-hidden bg-surface-strong flex items-end border border-edge-strong/5">
                                    <div
                                        className="w-full rounded transition-all duration-500"
                                        style={{
                                            height: d.pct >= 0 ? `${d.pct}%` : '0%',
                                            backgroundColor: d.pct >= 100 ? 'var(--status-complete)' : 'var(--status-done)',
                                            opacity: d.pct >= 100 ? 1 : 0.8,
                                        }}
                                    />
                                </div>
                                <span className="text-[8px] font-black tracking-wide text-ink-subtle">{d.label}</span>
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
                                className="p-1 rounded hover:bg-surface-strong text-ink-subtle hover:text-ink-strong transition-colors"
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
                                                ? 'bg-theme-primary text-theme-ink'
                                                : isToday
                                                ? 'bg-edge text-ink-strong'
                                                : 'text-ink-subtle hover:text-ink-strong hover:bg-surface-strong'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                            <button
                                onClick={handleNextDay}
                                className="p-1 rounded hover:bg-surface-strong text-ink-subtle hover:text-ink-strong transition-colors"
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
                                            isToday ? 'bg-theme-primary text-theme-ink' : 'text-ink-subtle'
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
