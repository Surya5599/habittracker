import React, { useEffect, useRef, useState } from 'react';
import { Check, Minus, Laugh, Smile, Meh, Frown, Angry, BookOpen } from 'lucide-react';
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
    toggleCompletion: (habitId: string, dateKey: string) => void;
    toggleHabitInactive: (habitId: string, dateKey: string) => void;
    isHabitInactive: (habitId: string, dateKey: string) => boolean;
    removeHabit: (id: string) => void;
    isDayFullyCompleted: (day: number) => boolean;
    isModalOpen?: boolean;
    notes: DailyNote;
    updateNote: (dateKey: string, data: Partial<DayData>) => void;
    setSelectedDateForCard: (date: Date | null, flipped?: boolean) => void;
    statsOpen?: boolean;
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
    toggleCompletion,
    toggleHabitInactive,
    isHabitInactive,
    removeHabit,
    isDayFullyCompleted,
    isModalOpen,
    notes,
    updateNote,
    setSelectedDateForCard,
    statsOpen = false,
}) => {
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
        const rawJournal = dayNote.journal;
        const journalText = Array.isArray(rawJournal)
            ? rawJournal.map((e: any) => (typeof e === 'string' ? e : e?.text || '')).join('')
            : String(rawJournal || '');
        const hasJournal = Boolean(journalText.trim().length > 0);

        return hasMood || hasJournal ? count + 1 : count;
    }, 0);
    const moodMissedDays = Math.max(0, moodTrackableDays - moodLoggedDays);
    const moodLoggedPercentage = moodTrackableDays > 0 ? (moodLoggedDays / moodTrackableDays) * 100 : 0;

    const todayRef = useRef<HTMLTableHeaderCellElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const longPressTimerRef = useRef<number | null>(null);
    const longPressTriggeredRef = useRef(false);

    const scrollToToday = (behavior: ScrollBehavior = 'auto') => {
        if (todayRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const element = todayRef.current;
            const scrollLeft = element.offsetLeft - (container.clientWidth / 2) + (element.clientWidth / 2) - 50;
            container.scrollTo({ left: scrollLeft, behavior });
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => scrollToToday('auto'), 100);
        return () => clearTimeout(timer);
    }, [currentMonthIndex, currentYear]);

    useEffect(() => {
        if (!statsOpen) return;
        // Wait for the lg:pr-[50%] layout transition (200ms) to finish before computing scroll
        const timer = setTimeout(() => scrollToToday('smooth'), 300);
        return () => clearTimeout(timer);
    }, [statsOpen]);

    return (
        <>
            <div className={`p-2 ${statsOpen ? 'pr-4' : ''} min-h-full flex flex-col`}>
            <div className={`border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col overflow-hidden relative w-full flex-1 rounded-2xl transition-opacity duration-300 ${isModalOpen ? 'opacity-30 pointer-events-none grayscale-[0.5]' : 'opacity-100'}`}>
                <div ref={scrollContainerRef} className="overflow-x-auto w-full flex-1">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="text-[10px] font-black uppercase text-stone-700" style={{ backgroundColor: theme.secondary + '40' }}>
                                <th className="p-2 border-r border-stone-200 text-left sticky left-0 z-40 font-black" style={{ backgroundColor: '#f0efed', width: 250, minWidth: 250 }}>
                                    <span className="text-xs font-black uppercase tracking-widest text-stone-700">Habits</span>
                                </th>
                                {monthDates.map(day => {
                                    const isToday = day === new Date().getDate() && currentMonthIndex === new Date().getMonth() && currentYear === new Date().getFullYear();
                                    const isFull = isDayFullyCompleted(day);
                                    return (
                                        <th key={day}
                                            ref={isToday ? todayRef : null}
                                            className={`p-1 border-r border-stone-100 min-w-[28px] text-center transition-colors duration-300 ${isToday ? 'z-10 font-black border-[3px] border-black' : ''}`}
                                            style={{
                                                backgroundColor: isToday ? theme.primary : (isFull ? theme.primary + '30' : undefined),
                                                color: isToday ? 'white' : undefined
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-black text-[10px]">{DAYS_OF_WEEK_SHORT[new Date(currentYear, currentMonthIndex, day).getDay()][0]}</span>
                                                <span className={`font-black text-sm ${isToday ? '' : 'text-stone-600'}`}>{day}</span>
                                            </div>
                                        </th>
                                    );
                                })}
                                {!statsOpen && <th className="p-1 border-l border-stone-100 bg-stone-100 min-w-[100px] text-center text-stone-700 font-black">Done / Miss</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {/* Daily Mood Row */}
                            <tr className="group hover:bg-stone-50 transition-colors" style={{ height: '32px' }}>
                                <td className="p-0 pl-3 sticky left-0 z-10 border-r border-[#e5e5e5] group-hover:bg-stone-100 transition-colors h-[32px]" style={{ backgroundColor: '#fafaf9' }}>
                                    <div className="flex items-center h-full">
                                        <span className="text-xs font-bold text-stone-900 truncate pl-2">Mood</span>
                                    </div>
                                </td>
                                {monthDates.map(day => {
                                    const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const dayNote = notes ? notes[dateKey] : undefined;
                                    const moodValue = dayNote ? (Array.isArray(dayNote) ? undefined : dayNote.mood) : undefined;
                                    const rawJ = dayNote && !Array.isArray(dayNote) ? dayNote.journal : undefined;
                                    const journalStr = Array.isArray(rawJ) ? rawJ.map((e: any) => (typeof e === 'string' ? e : e?.text || '')).join('') : String(rawJ || '');
                                    const hasJournal = journalStr.trim().length > 0;

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
                                {!statsOpen && <td className="p-0 border-l border-stone-100 bg-[#fcfcfc]" />}
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
                                return (
                                    <tr key={habit.id} className="hover:bg-stone-50 transition-colors group" style={{ height: 32 }}>
                                        <td className="p-0 border-r border-stone-200 text-sm font-bold text-stone-700 sticky left-0 z-30 group-hover:bg-stone-100 transition-colors border-l-4" style={{ borderLeftColor: habit.color || theme.secondary, backgroundColor: '#fafaf9', width: 250, minWidth: 250, maxWidth: 250, height: 32 }}>
                                            <div className="flex items-center gap-2 px-2 h-full">
                                                <span className="break-words flex-1 leading-tight">{habit.name || 'Untitled Habit'}</span>
                                            </div>
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
                                                    <td key={day} className="p-0.5 border-r border-stone-50 bg-[#e5e5e5]/30" style={{ height: 32 }}>
                                                        <div className="w-5 h-5 mx-auto flex items-center justify-center border-2 border-stone-200 bg-stone-100 text-stone-300 text-[10px] font-black select-none">/</div>
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={day}
                                                    className={`p-0.5 border-r border-stone-50 transition-colors duration-300`}
                                                    style={{ height: 32, backgroundColor: isToday ? theme.primary + '15' : (isFull ? theme.primary + '20' : undefined) }}
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
                                                        className={`w-5 h-5 mx-auto flex items-center justify-center border-2 transition-all duration-200 ${inactive ? 'text-amber-900 bg-amber-300 border-amber-700' : (done ? 'text-white border-black' : 'bg-white border-black hover:bg-stone-100')}`}
                                                        style={{ backgroundColor: inactive ? undefined : (done ? theme.secondary : undefined) }}
                                                    >
                                                        {inactive ? <Minus size={10} strokeWidth={4} /> : (done && <Check size={10} strokeWidth={4} />)}
                                                    </button>
                                                </td>
                                            );
                                        })}

                                        {!statsOpen && (
                                            <td className="p-0 border-l border-stone-100 bg-[#fcfcfc]" style={{ height: 32 }}>
                                                <div className="grid grid-cols-2 text-center text-[11px] font-black uppercase tracking-tight h-full">
                                                    <div className="p-1 px-2 border-r border-stone-200" style={{ backgroundColor: theme.secondary + '20' }}>
                                                        <span className="text-stone-500 block">Done</span>
                                                        <span className="text-sm font-black leading-none">{habitStats.completed}</span>
                                                    </div>
                                                    <div className="p-1 px-2" style={{ backgroundColor: '#f0f0f0' }}>
                                                        <span className="text-stone-500 block">Miss</span>
                                                        <span className="text-sm font-black leading-none text-rose-400">{habitStats.missed}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>
        </>
    );
};
