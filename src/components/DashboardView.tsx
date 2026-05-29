import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Trophy, Zap } from 'lucide-react';
import YearView from './YearView';
import { FormattedText } from './FormattedText';
import { Habit, Theme } from '../types';
import { buildAnnualStory } from '../utils/storyGenerator';

interface DashboardViewProps {
    annualStats: {
        totalCompletions: number;
        totalPossible: number;
        monthlySummaries: any[];
        topHabits: any[];
        maxStreak: number;
        strongestMonth: any;
        consistencyRate: number;
        activeDays?: number;
        activeHabitsCount?: number;
        momentum?: string;
        storyVariant?: string;
        fadingHabit?: any;
        longestHabitStreak?: any;
        weekdayRate?: number;
        weekendRate?: number;
        loggedDaysCount?: number;
        trackableDaysCount?: number;
        loggedHabitsCount?: number;
        totalHabitsInYear?: number;
        mostLoggedHabit?: any;
        weakestHabit?: any;
        allTopHabits?: any[];
        streakMilestones?: { name: string; length: number; startDate: string | null; endDate: string | null }[];
    };
    habits: Habit[];
    theme: Theme;
    currentYear: number;
    setCurrentMonthIndex: (idx: number) => void;
    setView: (view: 'monthly' | 'dashboard') => void;
    setSelectedDateForCard: (date: Date | null, flipped?: boolean) => void;
    startOfWeek: 'monday' | 'sunday';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
    annualStats,
    habits,
    theme,
    currentYear,
    setCurrentMonthIndex,
    setView,
    setSelectedDateForCard,
    startOfWeek,
}) => {
    const { t } = useTranslation();
    const today = new Date();
    const monthsElapsed = currentYear === today.getFullYear() ? today.getMonth() + 1 : 12;
    const story = buildAnnualStory(annualStats, t, monthsElapsed);
    const loggedDaysCount = annualStats.loggedDaysCount || 0;
    const trackableDaysCount = annualStats.trackableDaysCount || 0;
    const loggedHabitsCount = annualStats.loggedHabitsCount || 0;
    const totalHabitsInYear = annualStats.totalHabitsInYear || 0;
    const mostLoggedHabit = annualStats.mostLoggedHabit;
    const weakestHabit = annualStats.weakestHabit;

    const card = "rounded-2xl border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white";

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 w-full">
            <YearView
                theme={theme}
                currentYear={currentYear}
                annualStats={annualStats}
                startOfWeek={startOfWeek}
                onDayClick={(monthIndex, day) => setSelectedDateForCard(new Date(currentYear, monthIndex, day), false)}
                onOpenMonth={(monthIndex) => {
                    setCurrentMonthIndex(monthIndex);
                    setView('monthly');
                }}
            />

            <div className="p-4 bg-white neo-border neo-shadow rounded-2xl flex flex-col min-h-[220px]">
                <div className="flex items-center gap-2 mb-4 border-b-[3px] border-black pb-3">
                    <div className="p-1 bg-amber-100 text-amber-600 rounded"><Sparkles size={14} /></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('annualUi.story.title')}</span>
                </div>

                {!story.focused || !story.annualSummary ? (
                    <div className="flex-1 flex items-center justify-center text-stone-300 italic text-sm">{t('annualUi.story.noSignificantOutcomes')}</div>
                ) : (
                    <div className="flex-1 flex flex-col gap-5 py-2">
                        <div className={`${card} p-5 space-y-4`}>
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-stone-100 text-black rounded-lg"><Zap size={14} strokeWidth={2.5} /></div>
                                <span className="font-serif text-[10px] font-black uppercase tracking-widest text-stone-500">Year in review</span>
                            </div>
                            <p className="text-base leading-relaxed font-bold text-stone-900">
                                <FormattedText text={story.annualSummary.review} highlightColor={theme.secondary} />
                            </p>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
                            <div className={`${card} p-5 space-y-4`}>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg"><Sparkles size={14} strokeWidth={2.5} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">What defined the year</span>
                                </div>
                                <div className="space-y-3">
                                    {story.annualSummary.defining.map((point, idx) => (
                                        <p key={idx} className="text-sm leading-relaxed font-bold text-stone-800">
                                            <FormattedText text={point} highlightColor={theme.secondary} />
                                        </p>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className={`${card} p-5 space-y-3`} style={{ backgroundColor: 'var(--card-bg, #fffbeb)' }}>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-700">What needs attention</div>
                                    <p className="text-sm leading-relaxed font-bold text-amber-900">
                                        <FormattedText text={story.annualSummary.attention} highlightColor={theme.secondary} />
                                    </p>
                                </div>

                                <div className={`${card} p-5 space-y-3`} style={{ backgroundColor: '#fafafa' }}>
                                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">{t('annualUi.story.fullStory')}</div>
                                    <div className="space-y-2 text-sm leading-relaxed text-stone-700">
                                        <p>{t('annualUi.story.loggedDays', { logged: loggedDaysCount, total: trackableDaysCount })}</p>
                                        <p>{t('annualUi.story.loggedHabits', { logged: loggedHabitsCount, total: totalHabitsInYear })}</p>
                                        {mostLoggedHabit && (
                                            <p>{t('annualUi.story.mostLoggedHabit', { name: mostLoggedHabit.name, completed: mostLoggedHabit.completed, rate: Math.round(mostLoggedHabit.rate) })}</p>
                                        )}
                                        {weakestHabit && weakestHabit.total > 0 && (
                                            <p>{t('annualUi.story.fellShortHabit', { name: weakestHabit.name, completed: weakestHabit.completed, total: Math.round(weakestHabit.total), rate: Math.round(weakestHabit.rate) })}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className={`${card} p-4`}>
                                <div className="text-[8px] font-black uppercase tracking-[0.22em] text-stone-400">Strongest habit</div>
                                <div className="mt-2 flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                                        <Trophy size={16} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-stone-900">{story.annualSummary.support.strongestHabit?.name || t('annualUi.story.firstHabit')}</div>
                                        <div className="text-[11px] font-bold text-stone-500">
                                            {Math.round(story.annualSummary.support.strongestHabit?.completed || 0)} completions
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`${card} p-4`}>
                                <div className="text-[8px] font-black uppercase tracking-[0.22em] text-stone-400">Rhythm</div>
                                <div className="mt-2 text-sm font-black text-stone-900">{story.annualSummary.support.rhythmLabel}</div>
                                <div className="text-[11px] font-bold text-stone-500 mt-1">
                                    {Math.max(annualStats.weekdayRate || 0, annualStats.weekendRate || 0).toFixed(0)}% at your strongest
                                </div>
                            </div>

                            <div className={`${card} p-4`}>
                                <div className="text-[8px] font-black uppercase tracking-[0.22em] text-stone-400">Best stretch</div>
                                <div className="mt-2 text-sm font-black text-stone-900">
                                    {story.annualSummary.support.strongestMonth?.month || 'Still emerging'}
                                </div>
                                <div className="text-[11px] font-bold text-stone-500 mt-1">
                                    {story.annualSummary.support.strongestMonth?.rate
                                        ? `${Math.round(story.annualSummary.support.strongestMonth.rate)}% completion`
                                        : story.annualSummary.support.momentumLabel}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
