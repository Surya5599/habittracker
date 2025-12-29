import React from 'react';
import { Trophy, Zap, Target, Award, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Habit, Theme, MonthStats } from '../types';
import { MONTHS } from '../constants';

interface DashboardViewProps {
    annualStats: {
        totalCompletions: number;
        totalPossible: number;
        monthlySummaries: any[];
        topHabits: any[];
        maxStreak: number;
        strongestMonth: any;
        consistencyRate: number;
    };
    habits: Habit[];
    theme: Theme;
    currentYear: number;
    setCurrentMonthIndex: (idx: number) => void;
    setView: (view: 'monthly' | 'dashboard') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
    annualStats,
    habits,
    theme,
    currentYear,
    setCurrentMonthIndex,
    setView,
}) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy size={48} className="text-black" />
                    </div>
                    <span className="text-[11px] font-black uppercase text-stone-400 tracking-[0.2em] mb-3 border-b border-stone-100 pb-1 flex items-center gap-2">
                        <Zap size={14} className="text-amber-500" /> {currentYear} Scorecard
                    </span>

                    <div className="space-y-4">
                        <div className="space-y-2 mt-2">
                            <div className="bg-stone-50 border border-stone-200 p-2 rounded-sm" title="Total habits completed this year">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider">Annual Done</span>
                                    <span className="text-lg font-black" style={{ color: theme.primary }}>{annualStats.totalCompletions}</span>
                                </div>
                                <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                                    <div className="h-full transition-all duration-300" style={{ width: `${annualStats.consistencyRate}%`, backgroundColor: theme.primary }} />
                                </div>
                            </div>
                            <div className="bg-stone-50 border border-stone-200 p-2 rounded-sm" title="Percentage of annual habits completed">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider">Goal Rate</span>
                                    <span className="text-lg font-black" style={{ color: theme.secondary }}>{annualStats.consistencyRate.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                                    <div className="h-full transition-all duration-300" style={{ width: `${annualStats.consistencyRate}%`, backgroundColor: theme.secondary }} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="flex flex-col" title="Percentage of all possible habit completions achieved this year">
                                <span className="text-[8px] font-black uppercase text-stone-400 cursor-help">Consistency</span>
                                <span className="text-lg font-black">{annualStats.consistencyRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase text-stone-400">Max Streak</span>
                                <span className="text-lg font-black text-amber-600">{annualStats.maxStreak} Days</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-stone-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Trophy size={12} className="text-amber-500" />
                                    <span className="text-[8px] font-black uppercase text-stone-400">Strongest Month</span>
                                </div>
                                <span className="text-[11px] font-black px-2 py-1 bg-amber-50 border border-amber-200 rounded" style={{ color: theme.primary }}>
                                    {annualStats.strongestMonth?.month} ({annualStats.strongestMonth?.rate.toFixed(0)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-3 p-4 border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col min-h-[220px]">
                    <div className="flex items-center gap-2 mb-3 border-b border-stone-100 pb-2">
                        <div className="p-1 bg-amber-100 text-amber-600 rounded"><Target size={14} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Yearly Identity: Habit Outcomes</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 overflow-y-auto">
                        {annualStats.topHabits.length > 0 ? annualStats.topHabits.map((h, i) => (
                            <div key={h.id} className="flex flex-col relative group">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-black truncate max-w-[120px] uppercase">{h.name || 'Untitled'}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-bold text-stone-400">{h.startRate.toFixed(0)}%</span>
                                        {h.endRate > h.startRate ? (
                                            <TrendingUp size={10} className="text-emerald-500" />
                                        ) : h.endRate < h.startRate ? (
                                            <TrendingDown size={10} className="text-rose-500" />
                                        ) : (
                                            <ArrowRight size={8} className="text-stone-300" />
                                        )}
                                        <span className="text-[11px] font-black" style={{ color: h.endRate > h.startRate ? '#10b981' : (h.endRate < h.startRate ? '#f43f5e' : theme.primary) }}>{h.endRate.toFixed(0)}%</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`px-1.5 py-0.5 rounded-sm border text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 ${h.badge === "Most Consistent" ? "bg-amber-50 border-amber-200 text-amber-700" :
                                        h.badge === "Highest Growth" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                                            "bg-stone-100 border-stone-200 text-stone-500"
                                        }`}>
                                        <Award size={8} className={h.badge === "Most Consistent" ? "text-amber-500" : "text-current"} />
                                        {h.badge}
                                    </div>
                                </div>

                                <div className="w-full bg-stone-100 h-2 flex gap-0.5 rounded-sm overflow-hidden">
                                    {Array.from({ length: 10 }).map((_, j) => (
                                        <div key={j} className="h-full flex-1 transition-all duration-500" style={{ backgroundColor: h.rate >= (j + 1) * 10 ? theme.primary : '#f0f0f0' }} />
                                    ))}
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-3 text-center text-stone-300 py-4 italic text-sm">No significant habit outcomes for this year yet.</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 w-full">
                {MONTHS.map((m, idx) => {
                    const monthSummary = annualStats.monthlySummaries[idx];
                    const rate = monthSummary.rate;
                    const signal = monthSummary.signal;
                    const delta = monthSummary.delta;

                    return (
                        <div key={m} className="border-[2px] border-black p-4 bg-white hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group flex flex-col h-[300px] relative overflow-hidden">
                            <div className="flex items-center justify-between mb-4 border-b border-black pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { value: rate },
                                                        { value: 100 - rate }
                                                    ]}
                                                    innerRadius={10}
                                                    outerRadius={14}
                                                    paddingAngle={0}
                                                    dataKey="value"
                                                    startAngle={90}
                                                    endAngle={-270}
                                                    isAnimationActive={true}
                                                >
                                                    <Cell fill={theme.primary} stroke="none" />
                                                    <Cell fill="#f0f0f0" stroke="none" />
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest">{m}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {delta !== 0 && (
                                        <div className={`flex items-center px-1.5 py-0.5 rounded-sm text-[8px] font-black ${delta > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                            {delta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                            <span className="ml-0.5">{Math.abs(delta).toFixed(0)}%</span>
                                        </div>
                                    )}
                                    <span className="text-xs font-black" style={{ color: theme.primary }}>{rate.toFixed(0)}%</span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4">


                                <div className="space-y-2">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase text-stone-400 mb-0.5 tracking-tighter">Top Performer</span>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase truncate max-w-[100px]">
                                                {monthSummary.topHabit ? monthSummary.topHabit.name : 'None'}
                                            </span>
                                            {monthSummary.topHabit && (
                                                <span className="text-[10px] font-black" style={{ color: theme.primary }}>
                                                    {(monthSummary.topHabit.rate * 100).toFixed(0)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t border-stone-200 mt-2 pt-2">
                                        <div className="grid grid-cols-2 text-center text-[9px] font-black uppercase tracking-tight border border-stone-200 rounded overflow-hidden">
                                            <div className="p-2 border-r border-stone-200" style={{ backgroundColor: theme.primary + '20' }}>
                                                <span className="text-stone-500 block mb-1">Active Days</span>
                                                <span className="text-xl leading-none">{monthSummary.consistency.toFixed(0)}%</span>
                                            </div>
                                            <div className="p-2" style={{ backgroundColor: '#f0f0f0' }}>
                                                <span className="text-stone-500 block mb-1">Max Streak</span>
                                                <span className="text-xl leading-none text-amber-600">{monthSummary.maxStreak}d</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {signal && (
                                    <div className="absolute top-12 right-0 rotate-12 opacity-5 pointer-events-none select-none">
                                        <span className="text-xl font-black uppercase italic whitespace-nowrap">{signal}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto pt-3 flex gap-2 mb-1">
                                <button
                                    onClick={() => { setCurrentMonthIndex(idx); setView('monthly'); }}
                                    className="flex-1 py-1.5 bg-black text-white text-[9px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                                >
                                    Focus
                                </button>
                                {signal && (
                                    <div className="p-1.5 border border-stone-200 bg-stone-50 rounded flex items-center justify-center group/tip relative">
                                        <Zap size={10} className="text-amber-500" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-24 p-1.5 bg-black text-white text-[8px] font-black uppercase text-center rounded opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-10">
                                            {signal}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
