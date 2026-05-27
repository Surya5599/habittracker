import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Trophy, Zap, AlertTriangle, BookOpen } from 'lucide-react';
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

    const cardCls = "border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden";
    const cardHeaderCls = "flex items-center gap-2 px-4 py-2.5 border-b-[3px] border-black bg-stone-950";

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

            <div className="bg-white neo-border neo-shadow overflow-hidden">
                {/* Panel header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b-[3px] border-black bg-stone-950">
                    <Sparkles size={12} strokeWidth={3} className="text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{t('annualUi.story.title')}</span>
                </div>

                <div className="p-4">
                    {!story.focused || !story.annualSummary ? (
                        <div className="flex items-center justify-center py-16 text-stone-300 italic text-sm">{t('annualUi.story.noSignificantOutcomes')}</div>
                    ) : (
                        <div className="flex flex-col gap-4">

                            {/* Year in review */}
                            <div className={cardCls}>
                                <div className={cardHeaderCls}>
                                    <Zap size={11} strokeWidth={3} className="text-white" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Year in review</span>
                                </div>
                                <div className="p-5">
                                    <div className="h-1 w-12 mb-4" style={{ backgroundColor: theme.primary }} />
                                    <p className="text-base leading-relaxed font-bold text-stone-900">
                                        <FormattedText text={story.annualSummary.review} highlightColor={theme.secondary} />
                                    </p>
                                </div>
                            </div>

                            {/* What defined + attention + full story */}
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
                                <div className={cardCls}>
                                    <div className={cardHeaderCls}>
                                        <Sparkles size={11} strokeWidth={3} className="text-white" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white">What defined the year</span>
                                    </div>
                                    <div className="p-5 space-y-3">
                                        {story.annualSummary.defining.map((point, idx) => (
                                            <div key={idx} className="flex gap-3">
                                                <div className="mt-1.5 w-1.5 h-1.5 shrink-0" style={{ backgroundColor: theme.primary }} />
                                                <p className="text-sm leading-relaxed font-bold text-stone-800">
                                                    <FormattedText text={point} highlightColor={theme.secondary} />
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div className={cardCls}>
                                        <div className="flex items-center gap-2 px-4 py-2.5 border-b-[3px] border-black bg-amber-400">
                                            <AlertTriangle size={11} strokeWidth={3} className="text-black" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-black">What needs attention</span>
                                        </div>
                                        <div className="p-4 bg-amber-50">
                                            <p className="text-sm leading-relaxed font-bold text-amber-900">
                                                <FormattedText text={story.annualSummary.attention} highlightColor={theme.secondary} />
                                            </p>
                                        </div>
                                    </div>

                                    <div className={cardCls}>
                                        <div className="flex items-center gap-2 px-4 py-2.5 border-b-[3px] border-black bg-stone-100">
                                            <BookOpen size={11} strokeWidth={3} className="text-black" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-black">{t('annualUi.story.fullStory')}</span>
                                        </div>
                                        <div className="p-4 space-y-1.5 text-sm leading-relaxed text-stone-700">
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

                            {/* Bottom stat cards */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className={cardCls}>
                                    <div className="h-1.5 w-full" style={{ backgroundColor: theme.primary }} />
                                    <div className="p-4">
                                        <div className="text-[8px] font-black uppercase tracking-[0.28em] text-stone-400 mb-3">Strongest habit</div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 border-[3px] border-black bg-black">
                                                <Trophy size={14} className="text-white" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-stone-900 leading-tight">{story.annualSummary.support.strongestHabit?.name || t('annualUi.story.firstHabit')}</div>
                                                <div className="text-[11px] font-bold text-stone-400 mt-0.5">
                                                    {Math.round(story.annualSummary.support.strongestHabit?.completed || 0)} completions
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={cardCls}>
                                    <div className="h-1.5 w-full" style={{ backgroundColor: theme.secondary }} />
                                    <div className="p-4">
                                        <div className="text-[8px] font-black uppercase tracking-[0.28em] text-stone-400 mb-2">Rhythm</div>
                                        <div className="text-sm font-black text-stone-900">{story.annualSummary.support.rhythmLabel}</div>
                                        <div className="text-[11px] font-bold text-stone-400 mt-1">
                                            {Math.max(annualStats.weekdayRate || 0, annualStats.weekendRate || 0).toFixed(0)}% at your strongest
                                        </div>
                                    </div>
                                </div>

                                <div className={cardCls}>
                                    <div className="h-1.5 w-full bg-stone-900" />
                                    <div className="p-4">
                                        <div className="text-[8px] font-black uppercase tracking-[0.28em] text-stone-400 mb-2">Best stretch</div>
                                        <div className="text-sm font-black text-stone-900">
                                            {story.annualSummary.support.strongestMonth?.month || 'Still emerging'}
                                        </div>
                                        <div className="text-[11px] font-bold text-stone-400 mt-1">
                                            {story.annualSummary.support.strongestMonth?.rate
                                                ? `${Math.round(story.annualSummary.support.strongestMonth.rate)}% completion`
                                                : story.annualSummary.support.momentumLabel}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
