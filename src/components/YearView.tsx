import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, CalendarDays, CheckCheck, Flame, Grid3X3, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Theme } from '../types';
import { MONTHS } from '../constants';
import { YearRetroModal } from './YearRetroModal';

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
        activeDays?: number;
        activeHabitsCount?: number;
        maxStreak: number;
        strongestMonth?: { month?: string; rate?: number } | null;
        momentum?: string;
        monthlySummaries: MonthSummary[];
    };
}

const MONTH_LABELS = MONTHS.map((month) => month.slice(0, 3).toUpperCase());

const getMomentumCopy = (t: any, momentum?: string) => {
    if (momentum === 'ascending') return { label: t('annualUi.yearView.buildingMomentum'), icon: TrendingUp, tone: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
    if (momentum === 'descending') return { label: t('annualUi.yearView.needsRecovery'), icon: TrendingDown, tone: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' };
    return { label: t('annualUi.yearView.holdingSteady'), icon: Minus, tone: 'text-stone-700', bg: 'bg-stone-50 border-stone-200' };
};

const formatDelta = (t: any, delta: number) => {
    if (Math.abs(delta) < 0.5) return t('annualUi.yearView.flat');
    return t('annualUi.yearView.deltaPoints', { value: `${delta > 0 ? '+' : ''}${Math.round(delta)}` });
};

const YearView: React.FC<YearViewProps> = ({ theme, currentYear, annualStats, startOfWeek, onDayClick, onOpenMonth }) => {
    const { t } = useTranslation();
    const [isRetroModalOpen, setIsRetroModalOpen] = useState(false);
    const strongestMonth = annualStats.strongestMonth?.month || t('annualUi.yearView.noPeakYet');
    const strongestRate = annualStats.strongestMonth?.rate || 0;
    const roundedTotalCompletions = Math.round(annualStats.totalCompletions || 0);
    const momentumCopy = getMomentumCopy(t, annualStats.momentum);
    const MomentumIcon = momentumCopy.icon;

    return (
        <div className="bg-white neo-border neo-shadow rounded-2xl p-5 flex flex-col h-full relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-stone-100">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.28em] text-stone-400 block mb-1">{t('annualUi.yearView.label')}</span>
                    <h4 className="font-black uppercase text-lg sm:text-xl tracking-tight leading-tight">{t('annualUi.yearView.inReview', { year: currentYear })}</h4>
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

            <div className="relative z-10 mt-4 grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-4 items-start">
                <section className="min-w-0 space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                        <div className="rounded-2xl border p-3 lg:col-span-1" style={{ borderColor: `${theme.secondary}55`, backgroundColor: `${theme.secondary}18`, color: '#1c1917' }}>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 block">{t('annualUi.yearView.overall')}</span>
                            <span className="text-3xl font-black leading-none mt-2 block" style={{ color: theme.secondary }}>
                                {Math.round(annualStats.consistencyRate)}%
                            </span>
                            <span className="text-[11px] font-bold text-stone-400">{t('annualUi.yearView.followThrough')}</span>
                        </div>
                        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 block">{t('annualUi.yearView.completions')}</span>
                            <span className="text-2xl font-black leading-none mt-2 block">{roundedTotalCompletions}</span>
                            <span className="text-[11px] font-bold text-stone-500">{t('annualUi.yearView.whatYouDid')}</span>
                        </div>
                        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 block">{t('annualUi.yearView.activeDays')}</span>
                            <span className="text-2xl font-black leading-none mt-2 block">{annualStats.activeDays || 0}</span>
                            <span className="text-[11px] font-bold text-stone-500">{t('annualUi.yearView.daysWithActivity')}</span>
                        </div>
                        <div className="rounded-2xl border border-stone-200 bg-white p-3">
                            <div className="flex items-center gap-2 text-stone-500">
                                <CalendarDays size={13} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t('annualUi.yearView.peakMonth')}</span>
                            </div>
                            <span className="text-sm font-black uppercase mt-2 block truncate">{strongestMonth}</span>
                            <span className="text-[11px] font-bold text-stone-500">{t('annualUi.yearView.percentCompletion', { percent: Math.round(strongestRate) })}</span>
                        </div>
                        <div className="rounded-2xl border border-stone-200 bg-white p-3">
                            <div className="flex items-center gap-2 text-stone-500">
                                <Activity size={13} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t('annualUi.yearView.habitsInPlay')}</span>
                            </div>
                            <span className="text-sm font-black uppercase mt-2 block">{t('annualUi.yearView.reliableCount', { count: annualStats.activeHabitsCount || 0 })}</span>
                            <span className="text-[11px] font-bold text-stone-500">{t('annualUi.yearView.repeatFollowThrough')}</span>
                        </div>
                    </div>

                    <div className="rounded-[22px] border p-4 overflow-hidden relative" style={{ borderColor: `${theme.primary}66`, background: `linear-gradient(135deg, ${theme.primary}18 0%, ${theme.secondary}14 100%)`, color: '#1c1917' }}>
                        <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: theme.primary }} />
                        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-3 items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: theme.secondary }}>
                                    <Flame size={15} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400 block">{t('annualUi.yearView.howYouDid')}</span>
                                    <span className="text-sm font-black uppercase">{t('annualUi.yearView.yearQuality')}</span>
                                </div>
                            </div>
                            <div className="min-w-0">
                                <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: `${theme.primary}22` }}>
                                    <div
                                        className="h-full rounded-full transition-[width] duration-700"
                                        style={{ width: `${Math.min(100, Math.max(0, annualStats.consistencyRate))}%`, backgroundColor: theme.secondary }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] font-bold text-stone-500 whitespace-nowrap">
                                <span>{t('annualUi.yearView.streakDays', { count: annualStats.maxStreak })}</span>
                                <span>{t('annualUi.yearView.doneCount', { count: roundedTotalCompletions })}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="min-w-0 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">{t('annualUi.yearView.monthOverMonth')}</p>
                            <p className="text-sm font-black uppercase">{t('annualUi.yearView.quickMonthScan')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-3 gap-2">
                        {annualStats.monthlySummaries.map((summary, idx) => {
                            const displayRate = summary.isCurrentMonth ? (summary.proRatedRate || summary.rate || 0) : (summary.rate || 0);
                            const barWidth = Math.max(displayRate, summary.isFutureMonth ? 10 : 4);
                            const delta = summary.delta || 0;
                            const isPositive = delta > 0.5;
                            const isNegative = delta < -0.5;
                            const monthLabel = MONTH_LABELS[idx] || summary.month.slice(0, 3).toUpperCase();
                            const statusLabel = summary.isFutureMonth
                                ? t('annualUi.yearView.upcoming')
                                : summary.isCurrentMonth
                                    ? t('annualUi.yearView.liveMonth')
                                    : summary.signal || t('annualUi.yearView.closed');

                            return (
                                <button
                                    key={summary.month}
                                    onClick={() => onOpenMonth(idx)}
                                    className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3 text-left transition-colors"
                                    style={{ borderColor: `${theme.primary}22` }}
                                >
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

                                    <div className="h-2.5 rounded-full bg-white border overflow-hidden" style={{ borderColor: `${theme.primary}22` }}>
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
                </section>
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
