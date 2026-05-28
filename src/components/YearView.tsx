import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, CalendarDays, CheckCheck, Flame, Grid3X3, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Theme } from '../types';
import { MONTHS } from '../constants';
import { YearRetroModal } from './YearRetroModal';
import { buildAnnualStory } from '../utils/storyGenerator';
import { FormattedText } from './FormattedText';

interface MonthSummary {
    month: string;
    completed: number;
    total: number;
    rate: number;
    proRatedRate?: number;
    delta?: number;
    signal?: string;
    isFutureMonth?: boolean;
    isCurrentMonth?: boolean;
    days?: any[];
    topHabit?: { name?: string } | null;
    perfectDays?: number;
}

interface TopHabit {
    id: string;
    name: string;
    completed: number;
    total: number;
    rate: number;
    badge?: string;
    startRate?: number;
    endRate?: number;
    isFading?: boolean;
    maxStreak?: number;
    currentStreak?: number;
    lastCompletedDate?: string;
    streakStart?: string | null;
    streakEnd?: string | null;
}

interface YearViewProps {
    theme: Theme;
    currentYear: number;
    startOfWeek: 'monday' | 'sunday';
    onDayClick: (monthIndex: number, day: number) => void;
    onOpenMonth: (monthIndex: number) => void;
    annualStats: {
        consistencyRate: number;
        totalCompletions: number;
        totalPossible?: number;
        activeDays?: number;
        activeHabitsCount?: number;
        maxStreak: number;
        currentStreak?: number;
        strongestMonth?: { month?: string; rate?: number } | null;
        momentum?: string;
        monthlySummaries: MonthSummary[];
        topHabits?: TopHabit[];
        allTopHabits?: TopHabit[];
        longestHabitStreak?: { name?: string; maxStreak?: number; streakStart?: string | null; streakEnd?: string | null } | null;
        mostLoggedHabit?: { name?: string; completed?: number } | null;
        weekdayRate?: number;
        weekendRate?: number;
        fadingHabit?: { name?: string } | null;
        totalHabitsInYear?: number;
        loggedDaysCount?: number;
        weeklyRates?: number[];
        streakMilestones?: { name: string; length: number; startDate: string | null; endDate: string | null }[];
    };
}

const getMomentumCopy = (t: any, momentum?: string) => {
    if (momentum === 'ascending') return { label: t('annualUi.yearView.buildingMomentum'), icon: TrendingUp, tone: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
    if (momentum === 'descending') return { label: t('annualUi.yearView.needsRecovery'), icon: TrendingDown, tone: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' };
    return { label: t('annualUi.yearView.holdingSteady'), icon: Minus, tone: 'text-stone-700', bg: 'bg-stone-50 border-stone-200' };
};

const formatDelta = (t: any, delta: number) => {
    if (Math.abs(delta) < 0.5) return t('annualUi.yearView.flat');
    return t('annualUi.yearView.deltaPoints', { value: `${delta > 0 ? '+' : ''}${Math.round(delta)}` });
};

const getLocalizedMonthName = (t: any, month?: string, short = false) => {
    if (!month) return '';
    const monthIndex = MONTHS.findIndex((entry) => entry.toLowerCase() === month.toLowerCase());
    if (monthIndex === -1) return month;
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
    const translated = t(`common.months.${monthKeys[monthIndex]}`);
    return short ? translated.slice(0, 3).toUpperCase() : translated;
};

const getLocalizedSignal = (t: any, signal?: string) => {
    if (!signal) return '';
    if (signal === 'Best focus month') return t('annualUi.yearView.bestFocusMonth');
    if (signal === 'Burnout dip') return t('annualUi.yearView.burnoutDip');
    if (signal === 'Rebound month') return t('annualUi.yearView.reboundMonth');
    return signal;
};

const formatStreakDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const [, m, d] = dateStr.split('-').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[m - 1]} ${d}`;
};

const REFLECTION_PROMPTS = [
    'What habit changed your life most this year?',
    'What habit wasn\'t worth the effort?',
    'What became easier as the year went on?',
    'What do you want to continue into next year?',
    'What identity did you build through your habits?',
];

const YearView: React.FC<YearViewProps> = ({ theme, currentYear, annualStats, startOfWeek, onDayClick, onOpenMonth }) => {
    const { t } = useTranslation();
    const [isRetroModalOpen, setIsRetroModalOpen] = useState(false);
    const [openPromptIdx, setOpenPromptIdx] = useState<number | null>(null);
    const strongestMonth = annualStats.strongestMonth?.month
        ? getLocalizedMonthName(t, annualStats.strongestMonth.month)
        : t('annualUi.yearView.noPeakYet');
    const strongestRate = annualStats.strongestMonth?.rate || 0;
    const roundedTotalCompletions = Math.round(annualStats.totalCompletions || 0);
    const momentumCopy = getMomentumCopy(t, annualStats.momentum);
    const MomentumIcon = momentumCopy.icon;

    // AI narrative
    const today = new Date();
    const monthsElapsed = currentYear === today.getFullYear() ? today.getMonth() + 1 : 12;
    const annualStory = buildAnnualStory(annualStats as any, t, monthsElapsed);

    // Reflection prompts unlock in the last 15 days of the year
    const yearEnd = new Date(currentYear, 11, 31);
    const daysUntilYearEnd = Math.ceil((yearEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const reflectionUnlocked = currentYear < today.getFullYear() || daysUntilYearEnd <= 15;

    // Total days in the year (always full year — 365 or 366)
    const totalDaysInYear = (currentYear % 4 === 0 && (currentYear % 100 !== 0 || currentYear % 400 === 0)) ? 366 : 365;

    // KPI: total perfect days
    const totalPerfectDays = annualStats.monthlySummaries.reduce((sum, m) => sum + (m.perfectDays || 0), 0);

    // Beginning vs End
    const q1Months = annualStats.monthlySummaries.slice(0, 3).filter(m => !m.isFutureMonth && m.total > 0);
    const q4Months = annualStats.monthlySummaries.slice(9, 12).filter(m => !m.isFutureMonth && m.total > 0);
    const q1Rate = q1Months.length > 0 ? Math.round(q1Months.reduce((s, m) => s + m.rate, 0) / q1Months.length) : null;
    const q4Rate = q4Months.length > 0 ? Math.round(q4Months.reduce((s, m) => s + m.rate, 0) / q4Months.length) : null;
    const q4Start = new Date(currentYear, 9, 1); // Oct 1
    const daysUntilQ4 = Math.ceil((q4Start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const q1LoggedDays = annualStats.monthlySummaries.slice(0, 3).reduce((s, m) => s + (m.days?.filter((d: any) => d.habitsCompleted > 0).length || 0), 0);
    const q4LoggedDays = annualStats.monthlySummaries.slice(9, 12).reduce((s, m) => s + (m.days?.filter((d: any) => d.habitsCompleted > 0).length || 0), 0);

    // Best / worst month
    const nonFutureMonths = annualStats.monthlySummaries.filter(m => !m.isFutureMonth && m.total > 0);
    const bestMonth = nonFutureMonths.length > 0 ? nonFutureMonths.reduce((a, b) => a.rate >= b.rate ? a : b) : null;
    const worstMonth = nonFutureMonths.length > 1 ? nonFutureMonths.reduce((a, b) => a.rate <= b.rate ? a : b) : null;

    // Consistency rankings
    const allHabits = annualStats.allTopHabits || annualStats.topHabits || [];
    const significantHabits = allHabits.filter(h => h.total >= 20);
    const topConsistent = significantHabits.slice(0, 5);
    const bottomConsistent = [...significantHabits].reverse().slice(0, 5).filter(h => h.rate < 70);

    // Streak milestones
    const streakMilestones = annualStats.streakMilestones || [];

    // Achievement milestones
    const achievementMilestones: { label: string; value: string; sub?: string }[] = [];
    if (roundedTotalCompletions >= 1000) achievementMilestones.push({ label: '🏆 1,000 Completions', value: `${roundedTotalCompletions.toLocaleString()}`, sub: 'total completions' });
    else if (roundedTotalCompletions >= 500) achievementMilestones.push({ label: '⚡ 500 Completions', value: `${roundedTotalCompletions.toLocaleString()}`, sub: 'total completions' });
    else if (roundedTotalCompletions >= 100) achievementMilestones.push({ label: '✓ 100 Completions', value: `${roundedTotalCompletions.toLocaleString()}`, sub: 'total completions' });
    if (annualStats.maxStreak >= 30) achievementMilestones.push({ label: '🔥 30-Day Streak', value: `${annualStats.maxStreak}`, sub: 'day best streak' });
    if (totalPerfectDays >= 10) achievementMilestones.push({ label: '⭐ Perfect Days', value: `${totalPerfectDays}`, sub: 'days with 100%' });
    const loggedDays = annualStats.loggedDaysCount || 0;
    if (loggedDays >= 200) achievementMilestones.push({ label: '📅 200 Active Days', value: `${loggedDays}`, sub: 'days logged' });
    else if (loggedDays >= 100) achievementMilestones.push({ label: '📅 100 Active Days', value: `${loggedDays}`, sub: 'days logged' });

    return (
        <div className="bg-white neo-border neo-shadow rounded-2xl p-5 flex flex-col relative overflow-hidden">
            {/* Section 1 — Header */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-stone-100">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.28em] text-stone-400 block mb-1">{t('annualUi.yearView.label')}</span>
                    <h4 className="font-serif font-black uppercase text-xl sm:text-2xl tracking-tight leading-tight">{t('annualUi.yearView.inReview', { year: currentYear })}</h4>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${momentumCopy.bg}`}>
                        <MomentumIcon size={13} className={momentumCopy.tone} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.16em] ${momentumCopy.tone}`}>{momentumCopy.label}</span>
                    </div>
                    <button
                        onClick={() => setIsRetroModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-stone-600 hover:text-black hover:border-black transition-colors"
                    >
                        <Grid3X3 size={12} />
                        {t('annualUi.yearView.openGrids')}
                    </button>
                </div>
            </div>

            <div className="relative z-10 mt-4 space-y-5">

                {/* Section 2 — Hero sentence */}
                <div className="rounded-2xl p-4 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: theme.secondary + '18' }}>
                    <p className="text-lg sm:text-xl font-black leading-snug text-stone-900">
                        You completed{' '}
                        <span className="text-2xl sm:text-3xl" style={{ color: theme.primary }}>{roundedTotalCompletions.toLocaleString()}</span>
                        {' '}habits across{' '}
                        <span style={{ color: theme.primary }}>{annualStats.loggedDaysCount || 0}</span>
                        <span className="text-stone-400 font-bold">/{totalDaysInYear}</span>
                        {' '}active days.
                    </p>
                    {annualStory.annualSummary?.review ? (
                        <p className="mt-2 text-sm font-medium text-stone-600 leading-relaxed italic">
                            "<FormattedText text={annualStory.annualSummary.review} highlightColor={theme.primary} />"
                        </p>
                    ) : strongestMonth ? (
                        <p className="mt-2 text-sm font-medium text-stone-500 leading-relaxed">
                            Strongest month: {strongestMonth} at {Math.round(strongestRate)}% · {Math.round(annualStats.consistencyRate)}% overall follow-through
                        </p>
                    ) : null}
                </div>

                {/* Section 3 — KPI strip */}
                <div className="overflow-x-auto">
                    <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
                        {[
                            { label: 'Follow-through', value: `${Math.round(annualStats.consistencyRate)}%`, accent: true, icon: Activity },
                            { label: 'Completions', value: roundedTotalCompletions.toLocaleString(), icon: CheckCheck },
                            { label: 'Active days', value: `${annualStats.loggedDaysCount || 0}/${totalDaysInYear}`, icon: CalendarDays },
                            { label: 'Best streak', value: `${annualStats.maxStreak}d`, icon: Flame },
                            { label: 'Habits tracked', value: annualStats.totalHabitsInYear || 0, icon: Activity },
                            { label: 'Perfect days', value: totalPerfectDays, icon: CheckCheck },
                        ].map((tile, i) => (
                            <div
                                key={i}
                                className="rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 bg-white text-center min-w-[90px]"
                                style={i === 0 ? { backgroundColor: theme.secondary + '18' } : undefined}
                            >
                                <span
                                    className="text-xl font-black leading-none block"
                                    style={i === 0 ? { color: theme.secondary } : undefined}
                                >
                                    {tile.value}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400 block mt-1">{tile.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 4 — Consistency Rankings */}
                {significantHabits.length > 0 && (
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-3">Habit Rankings</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Most consistent */}
                            <div className="rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 bg-white">
                                <p className="text-[9px] font-black uppercase tracking-wider text-emerald-500 mb-2">Most Consistent</p>
                                <div className="space-y-1.5">
                                    {topConsistent.map((h, i) => (
                                        <div key={h.id} className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-stone-300 w-3 shrink-0">{i + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="text-xs font-black truncate">{h.name}</span>
                                                    <span className="text-xs font-black shrink-0" style={{ color: theme.primary }}>{Math.round(h.rate)}%</span>
                                                </div>
                                                <div className="h-1 rounded-full bg-stone-100 mt-0.5 overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, h.rate)}%`, backgroundColor: theme.primary }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Least consistent */}
                            {bottomConsistent.length > 0 && (
                                <div className="rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 bg-white">
                                    <p className="text-[9px] font-black uppercase tracking-wider text-rose-400 mb-2">Needs Attention</p>
                                    <div className="space-y-1.5">
                                        {bottomConsistent.map((h, i) => (
                                            <div key={h.id} className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-stone-300 w-3 shrink-0">{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="text-xs font-black truncate">{h.name}</span>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <span className="text-xs font-black text-rose-500">{Math.round(h.rate)}%</span>
                                                            {h.isFading && <TrendingDown size={10} className="text-rose-400" />}
                                                        </div>
                                                    </div>
                                                    <div className="h-1 rounded-full bg-stone-100 mt-0.5 overflow-hidden">
                                                        <div className="h-full rounded-full bg-rose-300" style={{ width: `${Math.min(100, h.rate)}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Section 5 — Streak Milestones + Achievements */}
                {(streakMilestones.length > 0 || achievementMilestones.length > 0 || annualStats.longestHabitStreak?.name) && (
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-3">Milestones & Streaks</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Top streak milestones */}
                            {streakMilestones.map((s, i) => (
                                <div key={i} className="rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 bg-white">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black uppercase tracking-wider text-amber-500">
                                                {i === 0 ? '🔥 Best Streak' : `Streak #${i + 1}`}
                                            </p>
                                            <p className="text-sm font-black truncate mt-0.5">{s.name}</p>
                                            {s.startDate && s.endDate && (
                                                <p className="text-[10px] font-bold text-stone-400 mt-0.5">
                                                    {formatStreakDate(s.startDate)} → {formatStreakDate(s.endDate)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-xl font-black leading-none" style={{ color: theme.primary }}>{s.length}</p>
                                            <p className="text-[9px] font-black text-stone-400 uppercase">days</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* Achievement milestone cards */}
                            {achievementMilestones.map((a, i) => (
                                <div key={i} className="rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3" style={{ backgroundColor: theme.secondary + '12' }}>
                                    <p className="text-[9px] font-black uppercase tracking-wider text-stone-500">{a.label}</p>
                                    <p className="text-xl font-black leading-none mt-1" style={{ color: theme.primary }}>{a.value}</p>
                                    {a.sub && <p className="text-[9px] font-bold text-stone-400 uppercase mt-0.5">{a.sub}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section 6 — Two columns: Anchor habits + Beginning vs End */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Top habits */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Top Habits</p>
                        <div className="grid grid-cols-1 gap-2">
                            {annualStats.topHabits && annualStats.topHabits[0] && (
                                <div className="rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 bg-white">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black uppercase tracking-wider text-stone-400">Anchor Habit</p>
                                            <p className="text-sm font-black truncate mt-0.5">{annualStats.topHabits[0].name}</p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-lg font-black leading-none" style={{ color: theme.primary }}>{Math.round(annualStats.topHabits[0].rate)}%</p>
                                            {annualStats.topHabits[0].badge && (
                                                <p className="text-[9px] font-black text-stone-400 uppercase">{annualStats.topHabits[0].badge}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {annualStats.mostLoggedHabit?.name && (
                                <div className="rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 bg-white">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black uppercase tracking-wider text-stone-400">Most Logged</p>
                                            <p className="text-sm font-black truncate mt-0.5">{annualStats.mostLoggedHabit.name}</p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-lg font-black leading-none">{annualStats.mostLoggedHabit.completed || 0}</p>
                                            <p className="text-[9px] font-black text-stone-400 uppercase">times</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {annualStats.fadingHabit?.name && (
                                <div className="rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 bg-rose-50">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black uppercase tracking-wider text-rose-400">Needs Revival</p>
                                            <p className="text-sm font-black truncate mt-0.5 text-rose-700">{annualStats.fadingHabit.name}</p>
                                        </div>
                                        <TrendingDown size={16} className="shrink-0 text-rose-400 mt-1" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Beginning vs End (right) */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Beginning vs End</p>
                        <div className="rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-4 bg-white">
                            {q1Rate !== null || q4Rate !== null ? (
                                <div className="flex items-center justify-center gap-4">
                                    <div className="text-center">
                                        <p className="text-[9px] font-black uppercase tracking-wider text-stone-400">Q1 Avg</p>
                                        <p className="text-3xl font-black leading-none mt-1">{q1Rate ?? '—'}%</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        {q1Rate !== null && q4Rate !== null ? (
                                            q4Rate > q1Rate ? (
                                                <TrendingUp size={20} className="text-emerald-500" />
                                            ) : q4Rate < q1Rate ? (
                                                <TrendingDown size={20} className="text-rose-500" />
                                            ) : (
                                                <Minus size={20} className="text-stone-400" />
                                            )
                                        ) : (
                                            <Minus size={20} className="text-stone-400" />
                                        )}
                                        <p className="text-[8px] font-black uppercase text-stone-400">
                                            {q1Rate !== null && q4Rate !== null
                                                ? q4Rate > q1Rate ? 'Stronger' : q4Rate < q1Rate ? 'Faded' : 'Steady'
                                                : ''}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-black uppercase tracking-wider text-stone-400">Q4 Avg</p>
                                        <p className="text-3xl font-black leading-none mt-1">{q4Rate ?? '—'}%</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-1">
                                    {q1Rate === null && daysUntilQ4 > 0 ? (
                                        <>
                                            <p className="text-sm font-black text-stone-500">Q4 unlocks in {daysUntilQ4} days</p>
                                            <p className="text-[11px] font-medium text-stone-400">
                                                {q1LoggedDays > 0 ? `${q1LoggedDays} days logged in Q1` : 'No Q1 data logged'} · Q4 starts Oct 1
                                            </p>
                                        </>
                                    ) : q1Rate === null ? (
                                        <>
                                            <p className="text-sm font-black text-stone-500">{q4LoggedDays} Q4 days logged</p>
                                            <p className="text-[11px] font-medium text-stone-400">No Q1 data — log habits Jan–Mar to compare</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-black text-stone-500">{q1LoggedDays} Q1 days logged</p>
                                            <p className="text-[11px] font-medium text-stone-400">Q4 starts Oct 1 — {daysUntilQ4 > 0 ? `${daysUntilQ4} days away` : 'log habits Oct–Dec to compare'}</p>
                                        </>
                                    )}
                                </div>
                            )}
                            {(annualStats.weekdayRate !== undefined || annualStats.weekendRate !== undefined) && (
                                <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-stone-100">
                                    <div className="text-center">
                                        <p className="text-[9px] font-black uppercase text-stone-400">Weekdays</p>
                                        <p className="text-lg font-black leading-none">{Math.round(annualStats.weekdayRate ?? 0)}%</p>
                                    </div>
                                    <div className="text-stone-200 text-lg">|</div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-black uppercase text-stone-400">Weekends</p>
                                        <p className="text-lg font-black leading-none">{Math.round(annualStats.weekendRate ?? 0)}%</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 7 — Month-by-month grid */}
                <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">{t('annualUi.yearView.monthOverMonth')}</p>
                            <p className="text-sm font-black uppercase">{t('annualUi.yearView.quickMonthScan')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-2">
                        {annualStats.monthlySummaries.map((summary, idx) => {
                            const displayRate = summary.isCurrentMonth ? (summary.proRatedRate || summary.rate || 0) : (summary.rate || 0);
                            const barWidth = Math.max(displayRate, summary.isFutureMonth ? 10 : 4);
                            const delta = summary.delta || 0;
                            const isPositive = delta > 0.5;
                            const isNegative = delta < -0.5;
                            const monthLabel = getLocalizedMonthName(t, summary.month, true) || summary.month.slice(0, 3).toUpperCase();
                            const localizedSignal = getLocalizedSignal(t, summary.signal);
                            const statusLabel = summary.isFutureMonth
                                ? t('annualUi.yearView.upcoming')
                                : summary.isCurrentMonth
                                    ? t('annualUi.yearView.liveMonth')
                                    : localizedSignal || t('annualUi.yearView.closed');

                            const isBestMonth = bestMonth && summary.month === bestMonth.month && !summary.isFutureMonth;
                            const isWorstMonth = worstMonth && summary.month === worstMonth.month && !summary.isFutureMonth && nonFutureMonths.length > 1;

                            return (
                                <button
                                    key={summary.month}
                                    onClick={() => onOpenMonth(idx)}
                                    className="rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden"
                                    style={
                                        isBestMonth
                                            ? { backgroundColor: theme.primary + '20' }
                                            : isWorstMonth
                                                ? { backgroundColor: '#fee2e2' }
                                                : { backgroundColor: '#ffffff' }
                                    }
                                >
                                    {isBestMonth && (
                                        <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase tracking-wide px-1 py-0.5 rounded" style={{ backgroundColor: theme.primary, color: '#fff' }}>PEAK</span>
                                    )}
                                    {isWorstMonth && !isBestMonth && (
                                        <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase tracking-wide px-1 py-0.5 rounded bg-rose-400 text-white">LOW</span>
                                    )}
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em]">{monthLabel}</p>
                                            <p className="text-[10px] font-bold text-stone-500 truncate">{statusLabel}</p>
                                        </div>
                                        <div className={`text-right ${isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-stone-500'}`}>
                                            <p className="text-sm font-black leading-none">{Math.round(displayRate)}%</p>
                                            <p className="text-[10px] font-bold">{summary.isFutureMonth ? t('annualUi.yearView.upcoming') : formatDelta(t, delta)}</p>
                                        </div>
                                    </div>

                                    <div className="h-2.5 rounded-full bg-stone-100 border border-stone-200 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-[width] duration-700"
                                            style={{
                                                width: `${Math.min(100, barWidth)}%`,
                                                backgroundColor: summary.isFutureMonth ? '#d6d3d1' : isNegative ? theme.secondary : theme.primary
                                            }}
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Section 8 — Reflection Prompts */}
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-3">Year-End Reflection</p>
                    {reflectionUnlocked ? (
                        <div className="space-y-2">
                            {REFLECTION_PROMPTS.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => setOpenPromptIdx(openPromptIdx === i ? null : i)}
                                    className="w-full text-left rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 bg-white hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-stone-700">{prompt}</p>
                                        <span className="shrink-0 text-stone-300 text-lg leading-none">{openPromptIdx === i ? '−' : '+'}</span>
                                    </div>
                                    {openPromptIdx === i && (
                                        <textarea
                                            className="mt-2 w-full text-sm text-stone-700 bg-stone-50 rounded-xl p-2 border border-stone-200 resize-none focus:outline-none focus:border-stone-400 font-medium"
                                            rows={3}
                                            placeholder="Write your reflection…"
                                            onClick={e => e.stopPropagation()}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border-[3px] border-dashed border-stone-300 p-5 flex flex-col items-center gap-2 text-center">
                            <span className="text-2xl">🔒</span>
                            <p className="text-sm font-black text-stone-500">Unlocks in {daysUntilYearEnd} days</p>
                            <p className="text-[11px] font-medium text-stone-400">Year-end reflection opens on Dec 17 — come back then to close out the year.</p>
                        </div>
                    )}
                </div>

            </div>

            <div className="absolute -top-14 -right-14 w-36 h-36 rounded-full opacity-[0.07] pointer-events-none" style={{ backgroundColor: theme.primary }} />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full opacity-[0.05] pointer-events-none" style={{ backgroundColor: theme.secondary }} />

            <YearRetroModal
                isOpen={isRetroModalOpen}
                onClose={() => setIsRetroModalOpen(false)}
                theme={theme}
                currentYear={currentYear}
                monthlySummaries={annualStats.monthlySummaries}
                startOfWeek={startOfWeek}
                onDayClick={(monthIndex, day) => {
                    onDayClick(monthIndex, day);
                    setIsRetroModalOpen(false);
                }}
                onOpenMonth={(monthIndex) => {
                    onOpenMonth(monthIndex);
                    setIsRetroModalOpen(false);
                }}
            />
        </div>
    );
};

export default YearView;
