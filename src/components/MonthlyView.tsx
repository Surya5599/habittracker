import React from 'react';
import { Plus, Trash2, Save, Check } from 'lucide-react';
import { Habit, HabitCompletion, Theme } from '../types';
import { DAYS_OF_WEEK_SHORT } from '../constants';
import { getHabitMonthStats, isCompleted as checkCompleted } from '../utils/stats';

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
    addHabit: () => void;
    toggleCompletion: (habitId: string, dateKey: string) => void;
    updateHabitNameState: (id: string, name: string) => void;
    updateHabitGoalState: (id: string, goal: string) => void;
    handleHabitBlur: (habit: Habit) => void;
    setEditingHabitId: (id: string | null) => void;
    setEditingGoalId: (id: string | null) => void;
    removeHabit: (id: string) => void;
    isDayFullyCompleted: (day: number) => boolean;
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
    addHabit,
    toggleCompletion,
    updateHabitNameState,
    updateHabitGoalState,
    handleHabitBlur,
    setEditingHabitId,
    setEditingGoalId,
    removeHabit,
    isDayFullyCompleted,
}) => {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-9 border border-stone-200 bg-white flex flex-col overflow-hidden">
                    <div className="text-stone-700 text-[11px] font-black uppercase py-1 tracking-widest grid grid-cols-5 md:grid-cols-9 transition-colors duration-500" style={{ backgroundColor: theme.secondary + '40' }}>
                        <span className="col-span-2 px-4 hidden md:block">Weekly Overview</span>
                        <div className="col-span-9 md:col-span-7 flex">{weeks.map((_, i) => (<span key={i} className="flex-1 text-center border-l border-stone-200/30 font-black">W{i + 1}</span>))}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-9 h-auto md:h-[220px] min-h-[220px]">
                        <div className="hidden md:col-span-2 border-r border-stone-100 md:flex flex-col text-[9px] font-black uppercase text-stone-500">
                            <div className="flex-1 flex items-center px-2 border-b border-stone-50" title="Weekly completion percentage - shows how many habits were completed out of total possible">
                                <span className="cursor-help">Global Progress</span>
                            </div>
                            <div className="flex-1 flex items-center px-2 border-b border-stone-50" title="Completed habits / Total possible for the week">
                                <span className="cursor-help">Score</span>
                            </div>
                            <div className="flex-1 flex items-center px-2" title="Daily completion bars - hover to see details">
                                <span className="cursor-help">Weekly Activity</span>
                            </div>
                        </div>
                        <div className="col-span-9 md:col-span-7 flex overflow-x-auto min-h-[220px]">
                            {weeks.map((week, wIndex) => {
                                const weekTotal = week.reduce((acc, day) => {
                                    let dc = 0; habits.forEach(h => { if (checkCompleted(h.id, day, completions, currentMonthIndex, currentYear)) dc++; }); return acc + dc;
                                }, 0);
                                const weekMax = week.length * (habits.length || 1);
                                const weekPerc = weekMax > 0 ? (weekTotal / weekMax) * 100 : 0;
                                return (
                                    <div key={wIndex} className="flex-1 min-w-[80px] border-r border-stone-100 flex flex-col">
                                        <div className="flex-1 flex flex-col items-center justify-center p-2 border-b border-stone-50">
                                            <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden"><div className="h-full transition-all duration-300" style={{ width: `${weekPerc}%`, backgroundColor: theme.secondary }} /></div>
                                            <span className="text-[10px] font-black mt-1">{weekPerc.toFixed(0)}%</span>
                                        </div>
                                        <div className="flex-1 flex items-center justify-center border-b border-stone-50 py-1"><span className="text-[11px] font-black">{weekTotal}/{weekMax}</span></div>
                                        <div className="flex-1 p-2 flex items-end justify-between gap-0.5 h-20 md:h-auto group/week">
                                            {week.map(day => {
                                                let dc = 0; habits.forEach(h => { if (checkCompleted(h.id, day, completions, currentMonthIndex, currentYear)) dc++; });
                                                const hRatio = dc / (habits.length || 1);
                                                const isAllDone = habits.length > 0 && dc === habits.length;
                                                return <div key={day} className="flex-1 relative group/bar" style={{ height: `${Math.max(2, hRatio * 100)}%`, backgroundColor: isAllDone ? theme.primary : theme.secondary }} title={`Day ${day}: ${dc}/${habits.length} habits completed`}>
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-black text-white text-[7px] font-black rounded opacity-0 invisible group-hover/bar:opacity-100 group-hover/bar:visible transition-all whitespace-nowrap z-10">
                                                        {dc}/{habits.length}
                                                    </div>
                                                </div>;
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="md:col-span-3 border border-stone-200 bg-white flex flex-col overflow-hidden min-h-[220px]">
                    <div className="text-stone-700 text-[11px] font-black uppercase py-1 text-center tracking-widest" style={{ backgroundColor: theme.primary + '30' }} title="Top performing habits ranked by completion days this month">
                        Top 10 This Month
                    </div>
                    <div className="p-2 space-y-1.5 flex-1 overflow-y-auto overflow-x-hidden min-h-[190px]">
                        {topHabitsThisMonth.map((h, i) => {
                            const stats = h.stats;
                            const p = h.percentage;
                            return (
                                <div key={h.id} className="flex items-center justify-between text-[10px] font-black animate-in fade-in slide-in-from-right-1 py-0.5">
                                    <div className="flex gap-2 items-center"><span className="text-stone-300 w-3">{i + 1}</span><span className="truncate w-32 sm:w-40 md:w-36">{h.name || 'Untitled'}</span></div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-stone-400 font-mono" title={`Completed ${stats.completed} days this month`}>{stats.completed} {stats.completed === 1 ? 'day' : 'days'}</span>
                                        <div className="w-8 h-1 bg-stone-100 rounded-full overflow-hidden"><div className="h-full transition-all duration-500" style={{ width: `${p}%`, backgroundColor: theme.primary }} /></div>
                                    </div>
                                </div>
                            );
                        })}
                        {topHabitsThisMonth.length === 0 && (
                            <div className="h-full flex items-center justify-center text-[11px] font-black text-stone-400 uppercase italic">No logged activity</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="border border-stone-200 bg-white flex flex-col overflow-hidden relative w-full">
                <div className="overflow-x-auto w-full">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-widest text-stone-700" style={{ backgroundColor: theme.secondary + '40' }}>
                                <th className="p-2 border-r border-stone-200 text-left min-w-[150px] sm:min-w-[180px] sticky left-0 z-40" style={{ backgroundColor: theme.secondary + '40' }}>
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.preventDefault(); addHabit(); }} className="p-0.5 px-1 bg-white hover:bg-stone-100 rounded shadow-sm border border-stone-200 font-black flex items-center transition-all active:scale-95" style={{ color: theme.secondary }} title="Add new habit">
                                            <Plus size={10} strokeWidth={4} />
                                        </button>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-700">Habits</span>
                                    </div>
                                </th>
                                <th className="p-1 border-r border-stone-200 w-12 text-center font-black">Goal</th>
                                {weeks.map((week, i) => (<th key={i} colSpan={week.length} className="p-1 border-r border-stone-200 text-center font-black">Week {i + 1}</th>))}
                                <th colSpan={2} className="p-1 text-center bg-[#f0f0f0] border-l border-stone-200 font-black">Monthly Summary</th>
                            </tr>
                            <tr className="bg-[#f9f2f2] text-[9px] font-black uppercase text-stone-500">
                                <th className="p-1 border-r border-stone-200 sticky left-0 z-40 bg-[#f9f2f2]"></th><th className="p-1 border-r border-stone-200"></th>
                                {monthDates.map(day => {
                                    const isToday = day === new Date().getDate() && currentMonthIndex === new Date().getMonth() && currentYear === new Date().getFullYear();
                                    const isFull = isDayFullyCompleted(day);
                                    return (
                                        <th key={day}
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
                            {habits.map((habit) => {
                                const habitStats = getHabitMonthStats(habit.id, completions, currentMonthIndex, currentYear);
                                const perc = (habitStats.completed / habitStats.totalDays) * 100;
                                const isEditingName = editingHabitId === habit.id;
                                const isEditingGoal = editingGoalId === habit.id;
                                return (
                                    <tr key={habit.id} className="hover:bg-stone-50 transition-colors group">
                                        <td className="p-1.5 px-3 border-r border-stone-200 text-[11px] font-black text-stone-700 flex items-center justify-between gap-2 sticky left-0 z-20 bg-white group-hover:bg-stone-50">
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
                                            <div className={`flex items-center gap-1 transition-opacity ${isEditingName ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><button onClick={(e) => { e.stopPropagation(); removeHabit(habit.id); }} className="p-1 text-stone-300 hover:text-red-500 rounded transition-colors"><Trash2 size={12} /></button></div>
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
                                            const isToday = day === new Date().getDate() && currentMonthIndex === new Date().getMonth() && currentYear === new Date().getFullYear();
                                            const isFull = isDayFullyCompleted(day);
                                            return (
                                                <td key={day}
                                                    className={`p-0.5 border-r border-stone-50 transition-colors duration-300`}
                                                    style={{ backgroundColor: isToday ? theme.primary + '15' : (isFull ? theme.primary + '20' : undefined) }}
                                                >
                                                    <button onClick={() => toggleCompletion(habit.id, dateKey)} className={`w-full aspect-square flex items-center justify-center border transition-all duration-200 ${done ? 'text-white shadow-sm' : 'bg-white border-stone-200 shadow-none'} hover:border-black`} style={{ backgroundColor: done ? theme.secondary : undefined, borderColor: done ? theme.secondary : undefined }}>{done && <Check size={10} strokeWidth={4} />}</button>
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
            </div>
        </>
    );
};
