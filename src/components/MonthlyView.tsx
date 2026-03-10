import React, { useEffect, useRef, useState } from 'react';
import { Save, Check, Minus, Laugh, Smile, Meh, Frown, Angry, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { CircularProgress } from './CircularProgress';
import { Habit, HabitCompletion, Theme, DailyNote, DayData } from '../types';
import { DAYS_OF_WEEK_SHORT } from '../constants';
import { getHabitMonthStats, isCompleted as checkCompleted } from '../utils/stats';
import { DailyCard } from './DailyCard';
import { isHabitActiveOnDate, isHabitManuallyInactive } from '../utils/habitActivity';

interface MonthlyViewProps {
    habits: Habit[];
    completions: HabitCompletion;
    currentMonthIndex: number;
    currentYear: number;
    theme: Theme;
    weeks: number[][];
    monthDates: number[];
    topHabitsThisMonth: (Habit & { stats: any; percentage: number })[];
    editingHabitId: string | null;
    editingGoalId: string | null;
    inputRef: React.RefObject<HTMLInputElement>;
    goalInputRef: React.RefObject<HTMLInputElement>;
    toggleCompletion: (habitId: string, dateKey: string) => void;
    toggleHabitInactive: (habitId: string, dateKey: string) => void;
    isHabitInactive: (habitId: string, dateKey: string) => boolean;
    updateHabitNameState: (id: string, name: string) => void;
    updateHabitGoalState: (id: string, goal: string) => void;
    handleHabitBlur: (habit: Habit) => void;
    setEditingHabitId: (id: string | null) => void;
    setEditingGoalId: (id: string | null) => void;
    removeHabit: (id: string) => void;
    isDayFullyCompleted: (day: number) => boolean;
    isModalOpen?: boolean;
    notes: DailyNote;
    updateNote: (dateKey: string, data: Partial<DayData>) => void;
    setSelectedDateForCard: (date: Date | null, flipped?: boolean) => void;
}

export const MonthlyView: React.FC<MonthlyViewProps> = ({
    habits,
    completions,
    currentMonthIndex,
    currentYear,
    theme,
    weeks,
    monthDates,
    topHabitsThisMonth,
    editingHabitId,
    editingGoalId,
    inputRef,
    goalInputRef,
    toggleCompletion,
    toggleHabitInactive,
    isHabitInactive,
    updateHabitNameState,
    updateHabitGoalState,
    handleHabitBlur,
    setEditingHabitId,
    setEditingGoalId,
    removeHabit,
    isDayFullyCompleted,
    isModalOpen,
    notes,
    updateNote,
    setSelectedDateForCard,
}) => {
    const [showTopHabits, setShowTopHabits] = useState(false);
    const visibleHabits = habits.filter(h =>
        monthDates.some(day => isHabitActiveOnDate(h, new Date(currentYear, currentMonthIndex, day)))
    );
    const today = new Date();
    const isCurrentMonth = currentYear === today.getFullYear() && currentMonthIndex === today.getMonth();
    const moodTrackableDays = isCurrentMonth
        ? monthDates.filter(day => day <= today.getDate()).length
        : monthDates.length;
    const moodLoggedDays = monthDates.reduce((count, day) => {
        const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayNote = notes ? notes[dateKey] : undefined;

        if (!dayNote || Array.isArray(dayNote)) return count;

        const hasMood = typeof dayNote.mood === 'number';
        const hasJournal = Boolean(dayNote.journal && dayNote.journal.trim().length > 0);

        return hasMood || hasJournal ? count + 1 : count;
    }, 0);
    const moodMissedDays = Math.max(0, moodTrackableDays - moodLoggedDays);
    const moodLoggedPercentage = moodTrackableDays > 0 ? (moodLoggedDays / moodTrackableDays) * 100 : 0;

    const tableScrollRef = useRef<HTMLDivElement>(null);
    const todayRef = useRef<HTMLTableHeaderCellElement>(null);
    const weeksScrollRef = useRef<HTMLDivElement>(null);
    const currentWeekRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const longPressTimerRef = useRef<number | null>(null);
    const longPressTriggeredRef = useRef(false);

    useEffect(() => {
        // Scroll main table to today
        if (todayRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const element = todayRef.current;

            // Add a small timeout to ensure layout is fully rendered
            setTimeout(() => {
                const scrollLeft = element.offsetLeft - (container.clientWidth / 2) + (element.clientWidth / 2) - 50; // -50 to account for sticky column on mobile
                container.scrollTo({ left: scrollLeft, behavior: 'auto' });
            }, 100);
        }

        // Scroll top chart to current week
        if (currentWeekRef.current) {
            currentWeekRef.current.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
        }
    }, [currentMonthIndex, currentYear]);

    return (
        <>
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="rounded-2xl border border-stone-200 bg-white p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Weekly Snapshot</p>
                                <h4 className="mt-1 text-base font-black uppercase tracking-tight text-stone-900">Month pacing by week</h4>
                            </div>
                            <div className="hidden text-[10px] font-black uppercase tracking-[0.18em] text-stone-400 md:block">
                                {weeks.length} checkpoints
                            </div>
                        </div>

                        <div ref={weeksScrollRef} className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                            {weeks.map((week, wIndex) => {
                                const weekTotal = habits.reduce((acc, h) => {
                                    let hWeekDone = 0;
                                    let activeDays = 0;

                                    week.forEach(day => {
                                        const dayDate = new Date(currentYear, currentMonthIndex, day);
                                        const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        const inactive = !isHabitActiveOnDate(h, dayDate) || isHabitManuallyInactive(notes, dateKey, h.id);
                                        if (inactive) return;

                                        activeDays++;
                                        if (h.weeklyTarget) {
                                            if (checkCompleted(h.id, day, completions, currentMonthIndex, currentYear)) hWeekDone++;
                                        } else {
                                            const isDue = !h.frequency || h.frequency.includes(dayDate.getDay());
                                            if (isDue && checkCompleted(h.id, day, completions, currentMonthIndex, currentYear)) hWeekDone++;
                                        }
                                    });

                                    if (h.weeklyTarget) {
                                        const activeCap = (h.weeklyTarget / 7) * activeDays;
                                        return acc + Math.min(hWeekDone, activeCap);
                                    }

                                    return acc + hWeekDone;
                                }, 0);

                                const weekMax = habits.reduce((acc, h) => {
                                    let activeDays = 0;
                                    let hPossible = 0;

                                    week.forEach(day => {
                                        const dayDate = new Date(currentYear, currentMonthIndex, day);
                                        const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        const inactive = !isHabitActiveOnDate(h, dayDate) || isHabitManuallyInactive(notes, dateKey, h.id);
                                        if (inactive) return;

                                        activeDays++;
                                        if (!h.weeklyTarget && (!h.frequency || h.frequency.includes(dayDate.getDay()))) hPossible++;
                                    });

                                    if (h.weeklyTarget) {
                                        return acc + ((h.weeklyTarget / 7) * activeDays);
                                    }

                                    return acc + hPossible;
                                }, 0);

                                const weekPerc = weekMax > 0 ? (weekTotal / weekMax) * 100 : 0;
                                const weekTotalLabel = String(Math.round(weekTotal));
                                const weekMaxLabel = String(Math.round(weekMax));
                                const isCurrentWeek = week.includes(new Date().getDate()) && currentMonthIndex === new Date().getMonth() && currentYear === new Date().getFullYear();
                                const startDate = new Date(currentYear, currentMonthIndex, week[0]);
                                const endDate = new Date(currentYear, currentMonthIndex, week[week.length - 1]);

                                return (
                                    <div
                                        key={wIndex}
                                        ref={isCurrentWeek ? currentWeekRef : null}
                                        className={`rounded-2xl border p-3 transition-colors ${isCurrentWeek ? 'border-stone-900 bg-stone-50' : 'border-stone-200 bg-white'}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Week {wIndex + 1}</p>
                                                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-stone-600">
                                                    {startDate.toLocaleString('default', { month: 'short' })} {String(startDate.getDate()).padStart(2, '0')} - {String(endDate.getDate()).padStart(2, '0')}
                                                </p>
                                            </div>
                                            <CircularProgress
                                                percentage={weekPerc}
                                                size={58}
                                                strokeWidth={7}
                                                color={theme.secondary}
                                                trackColor={theme.secondary + '20'}
                                                textClassName="text-sm"
                                            />
                                        </div>
                                        <div className="mt-3 flex items-end justify-between gap-3">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">Completed</p>
                                                <p className="mt-1 text-2xl font-black leading-none text-stone-900">{weekTotalLabel}<span className="ml-1 text-sm text-stone-300">/ {weekMaxLabel}</span></p>
                                            </div>
                                            <div className="flex h-10 items-end gap-1">
                                                {week.map(day => {
                                                    const dayDate = new Date(currentYear, currentMonthIndex, day);
                                                    const dayIndex = dayDate.getDay();
                                                    const dueHabits = habits.filter(h => {
                                                        if (h.weeklyTarget) return false;
                                                        if (!(!h.frequency || h.frequency.includes(dayIndex))) return false;
                                                        if (!isHabitActiveOnDate(h, dayDate)) return false;
                                                        const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                        return !isHabitManuallyInactive(notes, dateKey, h.id);
                                                    });
                                                    let dc = 0;
                                                    dueHabits.forEach(h => {
                                                        if (checkCompleted(h.id, day, completions, currentMonthIndex, currentYear)) dc++;
                                                    });

                                                    const hRatio = dueHabits.length > 0 ? dc / dueHabits.length : 0;
                                                    return (
                                                        <div
                                                            key={day}
                                                            className="w-2 rounded-full"
                                                            style={{
                                                                height: `${Math.max(6, hRatio * 40)}px`,
                                                                backgroundColor: hRatio === 1 && dueHabits.length > 0 ? theme.primary : theme.secondary + '80'
                                                            }}
                                                            title={`Day ${day}: ${dc}/${dueHabits.length}`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-2xl border border-stone-200 bg-white p-4">
                            <button
                                onClick={() => setShowTopHabits(prev => !prev)}
                                className="flex w-full items-center justify-between gap-3 text-left"
                            >
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Ranking</p>
                                    <h4 className="mt-1 text-base font-black uppercase tracking-tight text-stone-900">Top habits this month</h4>
                                </div>
                                {showTopHabits ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
                            </button>

                            {showTopHabits && (
                                <div className="mt-4 space-y-2">
                                    {topHabitsThisMonth.map((h, i) => {
                                        const stats = h.stats;
                                        const p = h.percentage;
                                        return (
                                            <div key={h.id} className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-2">
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-300">#{i + 1}</p>
                                                    <p className="truncate text-sm font-black uppercase text-stone-800">{h.name || 'Untitled'}</p>
                                                </div>
                                                <div className="min-w-[84px]">
                                                    <p className="text-right text-xs font-black text-stone-500">{stats.completed} days</p>
                                                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-200">
                                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p}%`, backgroundColor: theme.primary }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {topHabitsThisMonth.length === 0 && (
                                        <div className="rounded-xl bg-stone-50 px-3 py-6 text-center text-[11px] font-black uppercase italic text-stone-400">
                                            No logged activity
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Grid Guide</p>
                            <div className="mt-3 space-y-2 text-sm font-medium text-stone-600">
                                <p><span className="font-black text-stone-900">Click</span> a square to mark completion.</p>
                                <p><span className="font-black text-stone-900">Long press</span> to mark a habit inactive for that day.</p>
                                <p><span className="font-black text-stone-900">Click Mood</span> to jump into the journal side of the daily card.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`border border-stone-200 bg-white flex flex-col overflow-hidden relative w-full rounded-2xl transition-opacity duration-300 ${isModalOpen ? 'opacity-30 pointer-events-none grayscale-[0.5]' : 'opacity-100'}`}>
                <div ref={scrollContainerRef} className="overflow-x-auto w-full">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-widest text-stone-700" style={{ backgroundColor: theme.secondary + '40' }}>
                                <th className="p-2 border-r border-stone-200 text-left min-w-[100px] sm:min-w-[180px] sticky left-0 z-20 bg-stone-50" style={{ backgroundImage: isModalOpen ? 'none' : `linear-gradient(${theme.secondary}40, ${theme.secondary}40)` }}>
                                    <div className="flex items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-700">Habits</span>
                                    </div>
                                </th>
                                <th className="p-1 border-r border-stone-200 w-12 text-center font-black">Goal</th>
                                {weeks.map((week, i) => (<th key={i} colSpan={week.length} className="p-1 border-r border-stone-200 text-center font-black">Week {i + 1}</th>))}
                                <th colSpan={2} className="p-1 text-center bg-[#f0f0f0] border-l border-stone-200 font-black">Monthly Summary</th>
                            </tr>
                            <tr className="bg-stone-100 text-[9px] font-black uppercase text-stone-500">
                                <th className="p-1 border-r border-stone-200 sticky left-0 z-40 bg-stone-100"></th><th className="p-1 border-r border-stone-200"></th>
                                {monthDates.map(day => {
                                    const isToday = day === new Date().getDate() && currentMonthIndex === new Date().getMonth() && currentYear === new Date().getFullYear();
                                    const isFull = isDayFullyCompleted(day);
                                    return (
                                        <th key={day}
                                            ref={isToday ? todayRef : null}
                                            className={`p-1 border-r border-stone-100 min-w-[28px] text-center transition-colors duration-300 ${isToday ? 'z-10 font-black' : ''}`}
                                            style={{
                                                backgroundColor: isToday ? theme.primary : (isFull ? theme.primary + '30' : undefined),
                                                color: isToday ? 'white' : undefined
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-black">{DAYS_OF_WEEK_SHORT[new Date(currentYear, currentMonthIndex, day).getDay()][0]}</span>
                                                <span className={`font-black ${isToday ? 'scale-110' : 'text-stone-600'}`}>{day}</span>
                                            </div>
                                        </th>
                                    );
                                })}
                                <th className="p-1 border-l border-stone-200 bg-stone-100 min-w-[85px] text-center text-stone-700 font-black">Success %</th>
                                <th className="p-1 border-l border-stone-100 bg-stone-100 min-w-[100px] text-center text-stone-700 font-black">Monthly Done</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {/* Daily Mood Row */}
                            <tr className="group hover:bg-stone-50 transition-colors" style={{ height: '32px' }}>
                                <td className="p-0 pl-3 sticky left-0 z-10 bg-stone-50 border-r border-[#e5e5e5] group-hover:bg-stone-100 transition-colors h-[32px]">
                                    <div className="flex items-center h-full">
                                        <span className="text-[10px] font-bold text-stone-900 truncate pl-2">Mood</span>
                                    </div>
                                </td>
                                <td className="p-0 border-r border-stone-200"></td>
                                {monthDates.map(day => {
                                    const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const dayNote = notes ? notes[dateKey] : undefined;
                                    const moodValue = dayNote ? (Array.isArray(dayNote) ? undefined : dayNote.mood) : undefined;
                                    const hasJournal = dayNote && !Array.isArray(dayNote) && dayNote.journal && dayNote.journal.trim().length > 0;

                                    const MOOD_CONFIG = {
                                        1: { icon: Angry, color: '#ef4444' },
                                        2: { icon: Frown, color: '#f97316' },
                                        3: { icon: Meh, color: '#eab308' },
                                        4: { icon: Smile, color: '#84cc16' },
                                        5: { icon: Laugh, color: '#10b981' },
                                    };

                                    // @ts-ignore
                                    const activeConfig = moodValue ? MOOD_CONFIG[moodValue] : null;
                                    const Icon = activeConfig?.icon;

                                    return (
                                        <td
                                            key={day}
                                            onClick={() => setSelectedDateForCard(new Date(currentYear, currentMonthIndex, day), true)}
                                            className="p-0 border-r border-stone-100 bg-white hover:bg-stone-50 transition-colors cursor-pointer group/cell relative"
                                            style={{ height: '32px' }}
                                        >
                                            <div className="w-full h-full flex items-center justify-center">
                                                {Icon ? (
                                                    <div className="transition-all hover:scale-110 filter drop-shadow-sm">
                                                        <Icon size={14} style={{ fill: activeConfig.color, color: '#44403c', strokeWidth: 2 }} />
                                                    </div>
                                                ) : hasJournal ? (
                                                    <div className="text-black transition-colors" title="Read Journal">
                                                        <BookOpen size={12} />
                                                    </div>
                                                ) : (
                                                    <div className="text-stone-300 hover:text-stone-400 transition-colors" title="Log Mood/Journal">
                                                        <BookOpen size={12} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                                <td className="p-1 px-3 border-l border-stone-200 bg-[#fcfcfc] text-center">
                                    <div className="flex items-center justify-center gap-1.5 h-full">
                                        <span className="text-[11px] font-black w-6 text-right" style={{ color: theme.secondary }}>{moodLoggedPercentage.toFixed(0)}%</span>
                                        <div className="hidden sm:flex w-12 bg-stone-100 h-2 gap-0.5 rounded-sm overflow-hidden">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-full flex-1 transition-all duration-500 ${moodLoggedPercentage >= (i + 1) * 20 ? '' : 'bg-transparent'}`}
                                                    style={{ backgroundColor: moodLoggedPercentage >= (i + 1) * 20 ? theme.secondary : undefined }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-0 border-l border-stone-100 bg-[#fcfcfc]">
                                    <div className="grid grid-cols-2 text-center text-[9px] font-black uppercase tracking-tight h-full">
                                        <div className="p-1 px-2 border-r border-stone-200" style={{ backgroundColor: theme.secondary + '20' }}>
                                            <span className="text-stone-500 block">Done</span>
                                            <span className="text-lg leading-none">{moodLoggedDays}</span>
                                        </div>
                                        <div className="p-1 px-2" style={{ backgroundColor: '#f0f0f0' }}>
                                            <span className="text-stone-500 block">Miss</span>
                                            <span className="text-lg leading-none text-rose-400">{moodMissedDays}</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            {visibleHabits.map((habit) => {
                                const habitStats = getHabitMonthStats(
                                    habit.id,
                                    completions,
                                    currentMonthIndex,
                                    currentYear,
                                    habit.frequency,
                                    (dateKey) => {
                                        const [y, m, d] = dateKey.split('-').map(Number);
                                        const date = new Date(y, m - 1, d);
                                        return !isHabitActiveOnDate(habit, date) || isHabitManuallyInactive(notes, dateKey, habit.id);
                                    }
                                );
                                const perc = (habitStats.completed / habitStats.totalDays) * 100;
                                const isEditingName = editingHabitId === habit.id;
                                const isEditingGoal = editingGoalId === habit.id;
                                return (
                                    <tr key={habit.id} className="hover:bg-stone-50 transition-colors group">
                                        <td className="p-0 border-r border-stone-200 text-[11px] font-bold text-stone-700 sticky left-0 z-30 bg-stone-50 group-hover:bg-stone-100 transition-colors">
                                            <div className="flex items-center justify-between gap-2 p-1.5 px-3 h-full transition-colors">
                                                {isEditingName ? (
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <input
                                                            ref={inputRef}
                                                            type="text"
                                                            value={habit.name}
                                                            onChange={(e) => updateHabitNameState(habit.id, e.target.value)}
                                                            onBlur={() => handleHabitBlur(habit)}
                                                            onKeyDown={(e) => { if (e.key === 'Enter') handleHabitBlur(habit); }}
                                                            className="bg-transparent border-b-2 outline-none flex-1 text-[11px] font-black py-0.5 w-20"
                                                            style={{ borderColor: theme.secondary }}
                                                        />
                                                        <button onClick={() => handleHabitBlur(habit)} style={{ color: theme.secondary }}><Save size={14} /></button>
                                                    </div>
                                                ) : (
                                                    <span className="truncate flex-1 cursor-pointer hover:underline" onClick={() => setEditingHabitId(habit.id)} title="Click to rename">{habit.name || 'Untitled Habit'}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-1 border-r border-stone-200 text-center text-[10px] font-black text-stone-600 group-hover:bg-stone-100 transition-colors">
                                            {isEditingGoal ? (
                                                <input
                                                    ref={goalInputRef}
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={habit.goal}
                                                    onChange={(e) => updateHabitGoalState(habit.id, e.target.value)}
                                                    onBlur={() => handleHabitBlur(habit)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleHabitBlur(habit); }}
                                                    className="w-full text-center bg-transparent border-b-2 outline-none font-black text-[10px]"
                                                    style={{ borderColor: theme.secondary }}
                                                />
                                            ) : (
                                                <span
                                                    onClick={() => setEditingGoalId(habit.id)}
                                                    className="cursor-pointer hover:underline hover:text-stone-600 transition-colors"
                                                >
                                                    {habit.goal}%
                                                </span>
                                            )}
                                        </td>
                                        {monthDates.map(day => {
                                            const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                            const done = checkCompleted(habit.id, day, completions, currentMonthIndex, currentYear);
                                            const inactive = isHabitInactive(habit.id, dateKey);
                                            const isToday = day === new Date().getDate() && currentMonthIndex === new Date().getMonth() && currentYear === new Date().getFullYear();
                                            const isFull = isDayFullyCompleted(day);

                                            // Check frequency
                                            const dayDate = new Date(currentYear, currentMonthIndex, day);
                                            const isDue = (!habit.frequency || habit.frequency.includes(dayDate.getDay())) && isHabitActiveOnDate(habit, dayDate);

                                            if (!isDue) {
                                                return (
                                                    <td key={day} className="p-0.5 border-r border-stone-50 bg-[#e5e5e5]/30"></td>
                                                );
                                            }

                                            return (
                                                <td key={day}
                                                    className={`p-0.5 border-r border-stone-50 transition-colors duration-300`}
                                                    style={{ backgroundColor: isToday ? theme.primary + '15' : (isFull ? theme.primary + '20' : undefined) }}
                                                >
                                                    <button
                                                        onClick={() => {
                                                            if (longPressTriggeredRef.current) {
                                                                longPressTriggeredRef.current = false;
                                                                return;
                                                            }
                                                            toggleCompletion(habit.id, dateKey);
                                                        }}
                                                        onMouseDown={() => {
                                                            if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
                                                            longPressTimerRef.current = window.setTimeout(() => {
                                                                longPressTriggeredRef.current = true;
                                                                toggleHabitInactive(habit.id, dateKey);
                                                            }, 450);
                                                        }}
                                                        onMouseUp={() => {
                                                            if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
                                                            longPressTimerRef.current = null;
                                                        }}
                                                        onMouseLeave={() => {
                                                            if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
                                                            longPressTimerRef.current = null;
                                                        }}
                                                        onTouchStart={() => {
                                                            if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
                                                            longPressTimerRef.current = window.setTimeout(() => {
                                                                longPressTriggeredRef.current = true;
                                                                toggleHabitInactive(habit.id, dateKey);
                                                            }, 450);
                                                        }}
                                                        onTouchEnd={() => {
                                                            if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
                                                            longPressTimerRef.current = null;
                                                        }}
                                                        onTouchCancel={() => {
                                                            if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
                                                            longPressTimerRef.current = null;
                                                        }}
                                                        onContextMenu={(e) => {
                                                            e.preventDefault();
                                                            if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
                                                            longPressTimerRef.current = null;
                                                            toggleHabitInactive(habit.id, dateKey);
                                                        }}
                                                        className={`w-full aspect-square flex items-center justify-center border transition-all duration-200 ${inactive ? 'text-amber-900 bg-amber-300 border-amber-700' : (done ? 'text-white shadow-sm' : 'bg-white border-stone-200 shadow-none')} hover:border-black`}
                                                        style={{ backgroundColor: inactive ? undefined : (done ? theme.secondary : undefined), borderColor: inactive ? undefined : (done ? theme.secondary : undefined) }}
                                                    >
                                                        {inactive ? <Minus size={10} strokeWidth={4} /> : (done && <Check size={10} strokeWidth={4} />)}
                                                    </button>
                                                </td>
                                            );
                                        })}

                                        <td className="p-1 px-3 border-l border-stone-200 bg-[#fcfcfc] text-center">
                                            <div className="flex items-center justify-center gap-1.5 h-full">
                                                <span className="text-[11px] font-black w-6 text-right" style={{ color: theme.secondary }}>{perc.toFixed(0)}%</span>
                                                <div className="hidden sm:flex w-12 bg-stone-100 h-2 gap-0.5 rounded-sm overflow-hidden">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <div key={i} className={`h-full flex-1 transition-all duration-500 ${perc >= (i + 1) * 20 ? '' : 'bg-transparent'}`} style={{ backgroundColor: perc >= (i + 1) * 20 ? theme.secondary : undefined }} />
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-0 border-l border-stone-100 bg-[#fcfcfc]">
                                            <div className="grid grid-cols-2 text-center text-[9px] font-black uppercase tracking-tight h-full">
                                                <div className="p-1 px-2 border-r border-stone-200" style={{ backgroundColor: theme.secondary + '20' }}>
                                                    <span className="text-stone-500 block">Done</span>
                                                    <span className="text-lg leading-none">{habitStats.completed}</span>
                                                </div>
                                                <div className="p-1 px-2" style={{ backgroundColor: '#f0f0f0' }}>
                                                    <span className="text-stone-500 block">Miss</span>
                                                    <span className="text-lg leading-none text-rose-400">{habitStats.missed}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div >
        </>
    );
};
