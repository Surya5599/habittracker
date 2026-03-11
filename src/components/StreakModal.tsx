import React, { useState } from 'react';
import { X, Flame, Trophy, Award, Zap, CalendarCheck2, CheckCircle2, Star } from 'lucide-react';
import { Habit, Theme } from '../types';

interface StreakModalProps {
    isOpen: boolean;
    onClose: () => void;
    habits: Habit[];
    topHabits: any[]; // From annualStats.topHabits
    theme: Theme;
    globalCurrentStreak: number;
    globalMaxStreak: number;
    annualStats: any;
}

type AchievementCard = {
    id: string;
    title: string;
    description: string;
    detail: string;
    unlocked: boolean;
    tier: 'core' | 'rare' | 'elite' | 'legend';
    progress: number;
    progressLabel: string;
    communityRate?: number | null;
    icon: 'calendar' | 'check' | 'flame' | 'star' | 'award';
};

const TIER_STYLES = {
    core: {
        surface: 'bg-[#eef7ff] text-[#154c79] border-[#b8d8f4]',
        badge: 'bg-[#dcefff] text-[#154c79]',
        label: 'Core'
    },
    rare: {
        surface: 'bg-[#f3efff] text-[#4b2a7b] border-[#d7c7ff]',
        badge: 'bg-[#e6ddff] text-[#4b2a7b]',
        label: 'Rare'
    },
    elite: {
        surface: 'bg-[#fff2df] text-[#8a4b00] border-[#f9d6a3]',
        badge: 'bg-[#ffe7c2] text-[#8a4b00]',
        label: 'Elite'
    },
    legend: {
        surface: 'bg-[#ffe8eb] text-[#8d1832] border-[#f5b9c6]',
        badge: 'bg-[#ffd4dc] text-[#8d1832]',
        label: 'Legend'
    }
} as const;

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export const buildAchievements = (annualStats: any, topHabits: any[], globalMaxStreak: number, globalCurrentStreak: number): AchievementCard[] => {
    const monthlySummaries = annualStats.monthlySummaries || [];
    const perfectDays = monthlySummaries.reduce((sum: number, month: any) => sum + (month.perfectDays || 0), 0);
    const completedMonths = monthlySummaries.filter((month: any) => !month.isFutureMonth);
    const loggedMonths = completedMonths.filter((month: any) => (month.completed || 0) > 0).length;
    const perfectMonths = completedMonths.filter((month: any) => (month.rate || 0) >= 99.5 && (month.total || 0) > 0).length;
    const perfectWeeks = completedMonths.reduce((sum: number, month: any) => {
        const rates = month.weeklyRates || [];
        return sum + rates.filter((rate: number) => rate >= 99.5).length;
    }, 0);
    const months80 = completedMonths.filter((month: any) => (month.rate || 0) >= 80).length;
    const months90 = completedMonths.filter((month: any) => (month.rate || 0) >= 90).length;
    const eliteHabits = topHabits.filter((habit: any) => (habit.rate || 0) >= 80).length;
    const perfectHabitCount = topHabits.filter((habit: any) => (habit.rate || 0) >= 95 && (habit.completed || 0) >= 10).length;
    const totalHabitsLogged = annualStats.loggedHabitsCount || 0;
    const activeDays = annualStats.activeDays || 0;
    const loggedDays = annualStats.loggedDaysCount || 0;
    const trackableDays = annualStats.trackableDaysCount || 0;
    const consistencyRate = annualStats.consistencyRate || 0;
    const longestHabitStreak = Math.max(0, ...topHabits.map((habit: any) => habit.maxStreak || 0));
    const strongestMonthRate = annualStats.strongestMonth?.rate || 0;

    return [
        {
            id: 'first-perfect-day',
            title: 'Perfect Day',
            description: 'Complete every habit due on a single day.',
            detail: `${perfectDays} perfect days logged`,
            unlocked: perfectDays >= 1,
            tier: 'core',
            progress: clampPercent((perfectDays / 1) * 100),
            progressLabel: `${Math.min(perfectDays, 1)} / 1 day`,
            icon: 'check'
        },
        {
            id: 'ten-perfect-days',
            title: 'Clean Sheet',
            description: 'Log 10 perfect days in a year.',
            detail: `${perfectDays} perfect days this year`,
            unlocked: perfectDays >= 10,
            tier: 'rare',
            progress: clampPercent((perfectDays / 10) * 100),
            progressLabel: `${Math.min(perfectDays, 10)} / 10 days`,
            icon: 'check'
        },
        {
            id: 'perfect-week',
            title: 'Perfect Week',
            description: 'Finish a full week at 100%.',
            detail: `${perfectWeeks} perfect weeks found`,
            unlocked: perfectWeeks >= 1,
            tier: 'rare',
            progress: clampPercent((perfectWeeks / 1) * 100),
            progressLabel: `${Math.min(perfectWeeks, 1)} / 1 week`,
            icon: 'calendar'
        },
        {
            id: 'perfect-month',
            title: 'Perfect Month',
            description: 'Close an entire month without a miss.',
            detail: `${perfectMonths} perfect months`,
            unlocked: perfectMonths >= 1,
            tier: 'elite',
            progress: clampPercent((perfectMonths / 1) * 100),
            progressLabel: `${Math.min(perfectMonths, 1)} / 1 month`,
            icon: 'calendar'
        },
        {
            id: 'perfect-year',
            title: 'Perfect Year',
            description: 'Hold 100% consistency across the whole year.',
            detail: `${Math.round(consistencyRate)}% year consistency`,
            unlocked: consistencyRate >= 99.5 && trackableDays >= 300,
            tier: 'legend',
            progress: clampPercent(consistencyRate),
            progressLabel: `${Math.round(consistencyRate)} / 100%`,
            icon: 'award'
        },
        {
            id: 'eighty-year',
            title: '80% Year',
            description: 'Log at least 80% follow-through across the year.',
            detail: `${Math.round(consistencyRate)}% yearly follow-through`,
            unlocked: consistencyRate >= 80,
            tier: 'elite',
            progress: clampPercent((consistencyRate / 80) * 100),
            progressLabel: `${Math.round(Math.min(consistencyRate, 80))} / 80%`,
            icon: 'star'
        },
        {
            id: 'ninety-year',
            title: '90% Year',
            description: 'Keep your yearly consistency above 90%.',
            detail: `${Math.round(consistencyRate)}% yearly follow-through`,
            unlocked: consistencyRate >= 90,
            tier: 'legend',
            progress: clampPercent((consistencyRate / 90) * 100),
            progressLabel: `${Math.round(Math.min(consistencyRate, 90))} / 90%`,
            icon: 'star'
        },
        {
            id: 'log-80-days',
            title: '80% of the Year',
            description: 'Show up on at least 80% of trackable days.',
            detail: `${loggedDays} of ${trackableDays} days logged`,
            unlocked: trackableDays > 0 && (loggedDays / trackableDays) >= 0.8,
            tier: 'elite',
            progress: clampPercent(trackableDays > 0 ? (loggedDays / (trackableDays * 0.8)) * 100 : 0),
            progressLabel: `${loggedDays} / ${Math.max(1, Math.ceil(trackableDays * 0.8))} days`,
            icon: 'calendar'
        },
        {
            id: 'century-club',
            title: 'Century Club',
            description: 'Log 100 active days in a single year.',
            detail: `${activeDays} active days`,
            unlocked: activeDays >= 100,
            tier: 'core',
            progress: clampPercent((activeDays / 100) * 100),
            progressLabel: `${Math.min(activeDays, 100)} / 100 days`,
            icon: 'flame'
        },
        {
            id: 'double-century',
            title: 'Double Century',
            description: 'Log 200 active days in a year.',
            detail: `${activeDays} active days`,
            unlocked: activeDays >= 200,
            tier: 'rare',
            progress: clampPercent((activeDays / 200) * 100),
            progressLabel: `${Math.min(activeDays, 200)} / 200 days`,
            icon: 'flame'
        },
        {
            id: 'month-machine',
            title: 'Month Machine',
            description: 'Finish 6 months at 80% or better.',
            detail: `${months80} months above 80%`,
            unlocked: months80 >= 6,
            tier: 'rare',
            progress: clampPercent((months80 / 6) * 100),
            progressLabel: `${Math.min(months80, 6)} / 6 months`,
            icon: 'calendar'
        },
        {
            id: 'golden-calendar',
            title: 'Golden Calendar',
            description: 'Finish 12 months at 90% or better.',
            detail: `${months90} months above 90%`,
            unlocked: months90 >= 12,
            tier: 'legend',
            progress: clampPercent((months90 / 12) * 100),
            progressLabel: `${Math.min(months90, 12)} / 12 months`,
            icon: 'calendar'
        },
        {
            id: 'thirty-streak',
            title: '30 Day Run',
            description: 'Reach a 30 day streak.',
            detail: `${globalMaxStreak} day best streak`,
            unlocked: globalMaxStreak >= 30,
            tier: 'core',
            progress: clampPercent((globalMaxStreak / 30) * 100),
            progressLabel: `${Math.min(globalMaxStreak, 30)} / 30 days`,
            icon: 'flame'
        },
        {
            id: 'hundred-streak',
            title: '100 Day Run',
            description: 'Reach a 100 day streak.',
            detail: `${globalMaxStreak} day best streak`,
            unlocked: globalMaxStreak >= 100,
            tier: 'elite',
            progress: clampPercent((globalMaxStreak / 100) * 100),
            progressLabel: `${Math.min(globalMaxStreak, 100)} / 100 days`,
            icon: 'flame'
        },
        {
            id: 'year-streak',
            title: '365 Day Run',
            description: 'Hold a full year streak without breaking.',
            detail: `${globalMaxStreak} day best streak`,
            unlocked: globalMaxStreak >= 365,
            tier: 'legend',
            progress: clampPercent((globalMaxStreak / 365) * 100),
            progressLabel: `${Math.min(globalMaxStreak, 365)} / 365 days`,
            icon: 'award'
        },
        {
            id: 'hot-start',
            title: 'Hot Start',
            description: 'Build a live streak of 14 days right now.',
            detail: `${globalCurrentStreak} current streak`,
            unlocked: globalCurrentStreak >= 14,
            tier: 'core',
            progress: clampPercent((globalCurrentStreak / 14) * 100),
            progressLabel: `${Math.min(globalCurrentStreak, 14)} / 14 days`,
            icon: 'flame'
        },
        {
            id: 'habit-squad',
            title: 'Habit Squad',
            description: 'Keep 3 habits above 80% completion.',
            detail: `${eliteHabits} habits above 80%`,
            unlocked: eliteHabits >= 3,
            tier: 'rare',
            progress: clampPercent((eliteHabits / 3) * 100),
            progressLabel: `${Math.min(eliteHabits, 3)} / 3 habits`,
            icon: 'star'
        },
        {
            id: 'precision-stack',
            title: 'Precision Stack',
            description: 'Keep 2 habits above 95% completion.',
            detail: `${perfectHabitCount} habits above 95%`,
            unlocked: perfectHabitCount >= 2,
            tier: 'elite',
            progress: clampPercent((perfectHabitCount / 2) * 100),
            progressLabel: `${Math.min(perfectHabitCount, 2)} / 2 habits`,
            icon: 'check'
        },
        {
            id: 'full-roster',
            title: 'Full Roster',
            description: 'Log activity on 10 different habits in a year.',
            detail: `${totalHabitsLogged} habits logged this year`,
            unlocked: totalHabitsLogged >= 10,
            tier: 'rare',
            progress: clampPercent((totalHabitsLogged / 10) * 100),
            progressLabel: `${Math.min(totalHabitsLogged, 10)} / 10 habits`,
            icon: 'star'
        },
        {
            id: 'peak-month',
            title: 'Peak Month',
            description: 'Hit 95% in your best month.',
            detail: `${Math.round(strongestMonthRate)}% strongest month`,
            unlocked: strongestMonthRate >= 95,
            tier: 'elite',
            progress: clampPercent((strongestMonthRate / 95) * 100),
            progressLabel: `${Math.round(Math.min(strongestMonthRate, 95))} / 95%`,
            icon: 'award'
        },
        {
            id: 'all-season',
            title: 'All Season',
            description: 'Log something in every completed month.',
            detail: `${loggedMonths} of ${completedMonths.length} months active`,
            unlocked: completedMonths.length > 0 && loggedMonths === completedMonths.length,
            tier: 'rare',
            progress: clampPercent(completedMonths.length > 0 ? (loggedMonths / completedMonths.length) * 100 : 0),
            progressLabel: `${loggedMonths} / ${completedMonths.length || 1} months`,
            icon: 'calendar'
        },
    ];
};

const AchievementGlyph: React.FC<{ icon: AchievementCard['icon']; unlocked: boolean; theme: Theme }> = ({ icon, unlocked, theme }) => {
    const color = unlocked ? '#1e293b' : '#78716c';
    const accent = unlocked ? theme.secondary : '#d6d3d1';
    if (icon === 'calendar') {
        return (
            <div className="relative h-[34px] w-[34px]">
                <div className="absolute inset-0 rounded-[10px] border border-slate-300/80 bg-white shadow-[0_5px_14px_rgba(15,23,42,0.12)]" />
                <div className="absolute inset-x-0 top-0 h-[10px] rounded-t-[10px] border-b border-slate-200/90" style={{ background: `linear-gradient(180deg, ${accent} 0%, #bfdbfe 100%)` }} />
                <div className="absolute left-[6px] top-[3px] h-[6px] w-[6px] rounded-full bg-gradient-to-b from-slate-100 to-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.35)]" />
                <div className="absolute right-[6px] top-[3px] h-[6px] w-[6px] rounded-full bg-gradient-to-b from-slate-100 to-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.35)]" />
                <div className="absolute inset-x-[7px] bottom-[7px] top-[14px] grid grid-cols-3 gap-[2px]">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="rounded-[2px] bg-stone-200" />
                    ))}
                </div>
                <div className="absolute bottom-[4px] right-[4px] flex h-[13px] w-[13px] items-center justify-center rounded-[4px] border border-emerald-300 bg-gradient-to-b from-emerald-300 to-emerald-500 shadow-[0_2px_4px_rgba(16,185,129,0.35)]">
                    <CheckCircle2 size={8} strokeWidth={3} className="text-black" />
                </div>
            </div>
        );
    }
    if (icon === 'flame') {
        return <Flame size={26} strokeWidth={2.4} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" style={{ color, fill: accent }} />;
    }
    if (icon === 'star') {
        return <Star size={26} strokeWidth={2.2} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" style={{ color, fill: accent }} />;
    }
    if (icon === 'award') {
        return <Award size={26} strokeWidth={2.2} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" style={{ color, fill: accent }} />;
    }
    return <CheckCircle2 size={26} strokeWidth={2.4} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" style={{ color, fill: accent }} />;
};

export const StreakModal: React.FC<StreakModalProps> = ({
    isOpen,
    onClose,
    habits,
    topHabits,
    theme,
    globalCurrentStreak,
    globalMaxStreak,
    annualStats
}) => {
    const [activeTab, setActiveTab] = useState<'streaks' | 'badges'>('streaks');

    if (!isOpen) return null;

    const longestHabitStreak = Math.max(0, ...topHabits.map((habit) => habit.maxStreak || 0));
    const bestCurrentHabitStreak = Math.max(0, ...topHabits.map((habit) => habit.currentStreak || 0));
    const achievements = buildAchievements(annualStats, topHabits, globalMaxStreak, globalCurrentStreak);
    const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked);
    const nextAchievement = achievements
        .filter((achievement) => !achievement.unlocked)
        .sort((a, b) => b.progress - a.progress)[0] || null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white w-full max-w-4xl neo-border neo-shadow-lg rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b-2 border-black flex items-center justify-between relative" style={{ backgroundColor: theme.primary }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl neo-border shadow-sm">
                            <Flame size={24} className="text-orange-500 fill-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-tight">Streak Master</h2>
                            <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Your consistency records</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/10 rounded-full transition-colors text-white"
                    >
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Global Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                            type="button"
                            onClick={() => setActiveTab('streaks')}
                            className={`bg-orange-50 border-2 border-orange-200 p-6 rounded-2xl flex items-center justify-between text-left transition-all ${activeTab === 'streaks' ? 'ring-2 ring-black' : 'hover:-translate-y-0.5'}`}
                        >
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">Total Streak</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-orange-600">{globalCurrentStreak}</span>
                                    <span className="text-xs font-black text-orange-400">DAYS</span>
                                </div>
                            </div>
                            <Flame size={48} className="text-orange-200 fill-orange-200" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('streaks')}
                            className={`bg-amber-50 border-2 border-amber-200 p-6 rounded-2xl flex items-center justify-between text-left transition-all ${activeTab === 'streaks' ? 'ring-2 ring-black' : 'hover:-translate-y-0.5'}`}
                        >
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">Best Ever</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-amber-600">{globalMaxStreak}</span>
                                    <span className="text-xs font-black text-amber-400">DAYS</span>
                                </div>
                            </div>
                            <Trophy size={48} className="text-amber-200 fill-amber-200" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('badges')}
                            className={`bg-violet-50 border-2 border-violet-200 p-6 rounded-2xl flex items-center justify-between text-left transition-all ${activeTab === 'badges' ? 'ring-2 ring-black' : 'hover:-translate-y-0.5'}`}
                        >
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-1">Badges</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-violet-600">{unlockedAchievements.length}</span>
                                    <span className="text-xs font-black text-violet-400">OF {achievements.length}</span>
                                </div>
                            </div>
                            <Award size={48} className="text-violet-200" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="inline-flex rounded-2xl border-2 border-stone-200 bg-stone-50 p-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('streaks')}
                                className={`rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition-colors ${activeTab === 'streaks' ? 'bg-white text-black shadow-sm border border-stone-200' : 'text-stone-500'}`}
                            >
                                Streaks
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('badges')}
                                className={`rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition-colors ${activeTab === 'badges' ? 'bg-white text-black shadow-sm border border-stone-200' : 'text-stone-500'}`}
                            >
                                Badges
                            </button>
                        </div>

                        {activeTab === 'badges' && (
                            <div className="w-full max-w-md rounded-2xl border-2 border-stone-100 bg-white p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">Next Goal Target</p>
                                {nextAchievement ? (
                                    <>
                                        <p className="mt-2 text-xl font-black text-stone-900">{nextAchievement.title}</p>
                                        <p className="mt-1 text-sm font-bold text-stone-500">{nextAchievement.description}</p>
                                        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-stone-100">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${nextAchievement.progress}%`, backgroundColor: theme.primary }}
                                            />
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-stone-500">
                                            <span>{nextAchievement.progressLabel}</span>
                                            <span>{nextAchievement.detail}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="mt-2 text-xl font-black text-stone-900">All goals cleared</p>
                                        <p className="mt-1 text-sm font-bold text-stone-500">You have unlocked every streak badge target.</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {activeTab === 'streaks' ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap size={14} className="text-stone-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">All Your Streaks</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {topHabits.map((habit) => (
                                    <div key={habit.id} className="bg-stone-50 border-2 border-stone-100 p-4 rounded-2xl group hover:border-black transition-all flex flex-col justify-between">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex flex-col max-w-[60%]">
                                                <span className="text-sm font-black text-stone-800 group-hover:text-black transition-colors truncate" title={habit.name}>{habit.name}</span>
                                                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-tight mt-0.5">{habit.badge}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                                                <Flame size={14} className="fill-orange-600" />
                                                <span className="text-lg font-black leading-none">{habit.currentStreak}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-stone-400 uppercase tracking-tighter">Personal Best</span>
                                                    <span className="text-xs font-black text-stone-600">{habit.maxStreak} Days</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[8px] font-black text-stone-400 uppercase tracking-tighter">Total Hits</span>
                                                    <span className="text-xs font-black text-stone-600">{habit.completed}</span>
                                                </div>
                                            </div>

                                            <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full transition-all duration-1000"
                                                    style={{
                                                        width: `${Math.min(100, (habit.currentStreak / (habit.maxStreak || 1)) * 100)}%`,
                                                        backgroundColor: theme.primary
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Award size={14} className="text-stone-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Achievements</span>
                            </div>

                            <div className="rounded-[28px] border-[3px] border-black bg-white p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.12)]">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">Unlocked Badges</p>
                                        <p className="mt-1 text-lg font-black text-stone-900">{unlockedAchievements.length} / {achievements.length} collected</p>
                                    </div>
                                    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-right">
                                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-stone-400">Best Habit Streak</p>
                                        <p className="text-sm font-black text-stone-900">{longestHabitStreak} days</p>
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                    {achievements.map((achievement) => {
                                        const unlocked = achievement.unlocked;
                                        const tier = TIER_STYLES[achievement.tier];
                                        return (
                                            <button
                                                type="button"
                                                key={achievement.id}
                                                className="group flex flex-col items-center text-center"
                                            >
                                                    <div
                                                        className={`relative flex h-[96px] w-[96px] items-center justify-center transition-transform duration-200 group-hover:scale-[1.03] ${unlocked ? '' : 'grayscale opacity-80'}`}
                                                    >
                                                        <div
                                                            className="absolute inset-0 rounded-full"
                                                            style={unlocked ? {
                                                                background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.9) 10%, #f8fafc 12%, #cbd5e1 18%, ${theme.primary} 52%, ${theme.secondary} 76%, #475569 100%)`,
                                                                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.75), inset 0 -10px 18px rgba(15,23,42,0.18), 0 14px 28px rgba(15,23,42,0.25)'
                                                            } : {
                                                                background: 'radial-gradient(circle at 32% 28%, #fafaf9 0%, #e7e5e4 12%, #d6d3d1 18%, #a8a29e 58%, #57534e 100%)',
                                                                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -10px 18px rgba(15,23,42,0.12), 0 12px 24px rgba(15,23,42,0.18)'
                                                            }}
                                                        />
                                                        <div className="absolute inset-[3px] rounded-full border border-white/80" />
                                                        <div className="absolute inset-[8px] rounded-full border border-slate-200/80 bg-gradient-to-b from-white via-[#f8fafc] to-slate-100 shadow-[inset_0_6px_10px_rgba(255,255,255,0.8)]" />
                                                        <div className="absolute left-[12px] bottom-[20px] text-[#d4af37] opacity-90">✦</div>
                                                        <div className="absolute right-[12px] top-[18px] text-[#d4af37] opacity-85">✦</div>
                                                        <div className="absolute bottom-[11px] left-1/2 z-10 min-h-[28px] w-[82px] -translate-x-1/2 rounded-[14px] border border-slate-300 bg-gradient-to-b from-white to-slate-100 px-2 py-1 shadow-[0_8px_14px_rgba(15,23,42,0.14)]" />
                                                        <div className="absolute bottom-[14px] left-1/2 z-20 flex min-h-[22px] w-[76px] -translate-x-1/2 items-center justify-center text-center text-[6px] font-black uppercase leading-[1.05] tracking-[0.04em] text-slate-900">
                                                            <span className="line-clamp-2 break-words">{achievement.title}</span>
                                                        </div>
                                                        <div className="absolute left-1/2 top-[38px] z-20 flex h-[42px] w-[42px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[14px] border border-slate-300 bg-gradient-to-b from-white to-slate-100 shadow-[0_10px_18px_rgba(15,23,42,0.12)]">
                                                            <AchievementGlyph icon={achievement.icon} unlocked={unlocked} theme={theme} />
                                                        </div>
                                                        <div className="absolute right-[15px] top-[15px] h-[7px] w-[7px] rounded-full bg-gradient-to-b from-[#fef08a] to-[#facc15] shadow-[0_1px_2px_rgba(250,204,21,0.35)]" />
                                                        <div className={`absolute -bottom-1 left-1/2 h-5 min-w-[52px] -translate-x-1/2 rounded-full border px-2 text-[8px] font-black uppercase tracking-[0.18em] leading-[18px] ${unlocked ? `${tier.badge} border-black/10` : 'border-stone-200 bg-stone-100 text-stone-500'}`}>
                                                            {tier.label}
                                                        </div>
                                                    </div>
                                                    <p className={`mt-4 text-[13px] font-black leading-tight ${unlocked ? 'text-stone-900' : 'text-stone-500'}`}>{achievement.title}</p>
                                                    <p className="mt-1 text-[10px] font-bold leading-tight text-stone-400">{achievement.detail}</p>
                                                    <div className="mt-3 h-1.5 w-full max-w-[112px] overflow-hidden rounded-full bg-stone-200">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-700"
                                                            style={{ width: `${achievement.progress}%`, backgroundColor: unlocked ? theme.secondary : '#78716c' }}
                                                        />
                                                    </div>
                                                    <div className="mt-2 flex min-h-8 items-center justify-center text-[9px] font-black uppercase tracking-[0.14em] text-stone-400">
                                                        <span>{unlocked ? 'Unlocked' : achievement.progressLabel}</span>
                                                    </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Tip */}
                <div className="p-4 bg-stone-50 border-t-2 border-black text-center">
                    <p className="text-[10px] font-bold text-stone-500 italic">
                        "Your future is found in your daily routine."
                    </p>
                </div>
            </div>
        </div>
    );
};
