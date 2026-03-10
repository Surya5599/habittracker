import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, RefreshCw, Trophy, Zap } from 'lucide-react';
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
    const loggedDaysCount = annualStats.loggedDaysCount || 0;
    const trackableDaysCount = annualStats.trackableDaysCount || 0;
    const loggedHabitsCount = annualStats.loggedHabitsCount || 0;
    const totalHabitsInYear = annualStats.totalHabitsInYear || 0;
    const mostLoggedHabit = annualStats.mostLoggedHabit;
    const weakestHabit = annualStats.weakestHabit;

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
                <div className="flex items-center gap-2 mb-3 border-b border-stone-100 pb-2">
                    <div className="p-1 bg-amber-100 text-amber-600 rounded"><Sparkles size={14} /></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('annualUi.story.title')}</span>
                </div>

                {(() => {
                    const today = new Date();
                    const monthsElapsed = currentYear === today.getFullYear() ? today.getMonth() + 1 : 12;
                    const story = buildAnnualStory(annualStats, t, monthsElapsed);
                    if (!story.focused) {
                        return <div className="flex-1 flex items-center justify-center text-stone-300 italic text-sm">{t('annualUi.story.noSignificantOutcomes')}</div>;
                    }

                    return (
                        <div className="flex-1 flex flex-col justify-between py-2 overflow-y-auto pr-1 custom-scrollbar">
                            <div className="space-y-5">
                                <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-stone-100 text-black rounded-lg"><Zap size={14} strokeWidth={2.5} /></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{t('annualUi.story.identitySummary')}</span>
                                    </div>

                                    <div>
                                        <span className="text-[8px] font-black uppercase text-stone-300 tracking-[0.2em] mb-1.5 block">{t('annualUi.story.primaryIdentity')}</span>
                                        <div className="flex flex-wrap items-baseline gap-2">
                                            <span className="text-2xl font-black italic tracking-tighter" style={{ color: theme.primary }}>
                                                {annualStats.consistencyRate >= 80 ? t('annualUi.story.identities.architect') :
                                                    annualStats.consistencyRate >= 60 ? t('annualUi.story.identities.builder') :
                                                        annualStats.consistencyRate >= 40 ? t('annualUi.story.identities.explorer') : t('annualUi.story.identities.novice')}
                                            </span>
                                            <span className="text-[10px] font-bold text-stone-400 capitalize">
                                                {t('annualUi.story.followThrough', { percent: annualStats.consistencyRate.toFixed(0) })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[8px] font-black uppercase text-stone-300 tracking-[0.2em] mb-1.5 block">{t('annualUi.story.signatureStrength')}</span>
                                            <div className="space-y-1">
                                                <span className="text-xs font-black uppercase block leading-none">
                                                    {annualStats.weekdayRate! >= annualStats.weekendRate! ? t('annualUi.story.weekdayRhythm') : t('annualUi.story.weekendWarrior')}
                                                </span>
                                                <span className="text-[10px] font-bold text-stone-400">
                                                    {t('annualUi.story.percentConsistency', { percent: Math.max(annualStats.weekdayRate || 0, annualStats.weekendRate || 0).toFixed(0) })}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black uppercase text-stone-300 tracking-[0.2em] mb-1.5 block">{t('annualUi.story.mainChallenge')}</span>
                                            <div className="space-y-1">
                                                <span className="text-xs font-black uppercase block leading-none text-rose-500">
                                                    {annualStats.weekdayRate! < annualStats.weekendRate! ? t('annualUi.story.weekdays') : t('annualUi.story.weekends')}
                                                </span>
                                                <span className="text-[10px] font-bold text-stone-400">
                                                    {t('annualUi.story.percentCompletion', { percent: Math.min(annualStats.weekdayRate || 0, annualStats.weekendRate || 0).toFixed(0) })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-stone-100">
                                        <span className="text-[8px] font-black uppercase text-stone-300 tracking-[0.2em] mb-1.5 block">{t('annualUi.story.proudestAchievement')}</span>
                                        <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                                            <div className="p-2 bg-white rounded-lg shadow-sm neo-border flex items-center justify-center">
                                                <Trophy size={14} className="text-amber-500" />
                                            </div>
                                            <div>
                                                <span className="text-[11px] font-black uppercase block leading-none truncate w-40">
                                                    {annualStats.topHabits?.[0]?.name || t('annualUi.story.firstHabit')}
                                                </span>
                                                <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-1 block">
                                                    {t('annualUi.story.dayPeakStreak', { count: annualStats.maxStreak })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-3">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">{t('annualUi.story.fullStory')}</span>
                                    </div>

                                    <div className="space-y-2 text-sm leading-relaxed">
                                        <p>
                                            {t('annualUi.story.loggedDays', { logged: loggedDaysCount, total: trackableDaysCount })}
                                        </p>
                                        <p>
                                            {t('annualUi.story.loggedHabits', { logged: loggedHabitsCount, total: totalHabitsInYear })}
                                        </p>
                                        {mostLoggedHabit && (
                                            <p>
                                                {t('annualUi.story.mostLoggedHabit', { name: mostLoggedHabit.name, completed: mostLoggedHabit.completed, rate: Math.round(mostLoggedHabit.rate) })}
                                            </p>
                                        )}
                                        {weakestHabit && weakestHabit.total > 0 && (
                                            <p>
                                                {t('annualUi.story.fellShortHabit', { name: weakestHabit.name, completed: weakestHabit.completed, total: Math.round(weakestHabit.total), rate: Math.round(weakestHabit.rate) })}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {story.sections.map((section, idx) => {
                                    const content = (
                                        <FormattedText
                                            text={section.text}
                                            highlightColor={theme.secondary}
                                            className={section.type === 'consistency' ? 'italic' : section.type === 'experimental' ? 'text-indigo-800' : section.type === 'fading' ? 'text-amber-800' : section.type === 'neglected' ? 'text-rose-800' : ''}
                                        />
                                    );

                                    if (section.type === 'momentum' || section.type === 'rhythm') {
                                        return (
                                            <p key={idx} className="text-sm leading-relaxed">
                                                {content}
                                            </p>
                                        );
                                    }

                                    if (section.type === 'experimental') {
                                        return (
                                            <div key={idx} className="p-3 bg-indigo-50 border-l-4 border-indigo-400 text-xs rounded-r-lg">
                                                <span className="font-black uppercase block mb-1 text-indigo-800">{t('annualUi.story.curiosityGrowth')}</span>
                                                {content}
                                            </div>
                                        );
                                    }

                                    if (section.type === 'fading') {
                                        return (
                                            <div key={idx} className="p-3 bg-amber-50 border-l-4 border-amber-400 text-xs rounded-r-lg">
                                                <span className="font-black uppercase block mb-1 text-amber-800">{t('annualUi.story.fadingHabitAlert')}</span>
                                                {content}
                                            </div>
                                        );
                                    }

                                    if (section.type === 'consistency') {
                                        return (
                                            <div key={idx} className="p-3 bg-stone-50 border-l-4 border-black italic text-xs leading-relaxed">
                                                {content}
                                            </div>
                                        );
                                    }

                                    if (section.type === 'neglected') {
                                        return (
                                            <div key={idx} className="flex items-start gap-3 p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                                                <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg"><RefreshCw size={14} /></div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">{t('annualUi.story.reflections')}</span>
                                                    <p className="text-xs leading-tight">
                                                        {content}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return null;
                                })}
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div >
    );
};
