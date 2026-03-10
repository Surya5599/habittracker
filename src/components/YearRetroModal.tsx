import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Angry, ExternalLink, Frown, Laugh, Meh, Smile, Sparkles, X } from 'lucide-react';
import { RetroGrid } from './RetroGrid';
import { Theme } from '../types';

interface MonthSummary {
    month: string;
    completed: number;
    total: number;
    rate: number;
    proRatedRate?: number;
    days?: any[];
    topHabit?: { name?: string } | null;
    signal?: string;
    isCurrentMonth?: boolean;
    isFutureMonth?: boolean;
}

interface YearRetroModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: Theme;
    currentYear: number;
    monthlySummaries: MonthSummary[];
    startOfWeek: 'monday' | 'sunday';
    onDayClick: (monthIndex: number, day: number) => void;
    onOpenMonth: (monthIndex: number) => void;
}

export const YearRetroModal: React.FC<YearRetroModalProps> = ({
    isOpen,
    onClose,
    theme,
    currentYear,
    monthlySummaries,
    startOfWeek,
    onDayClick,
    onOpenMonth
}) => {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<'habits' | 'mood'>('habits');
    const moodMeta = useMemo(() => ({
        1: { label: t('annualUi.yearRetro.moods.angry'), icon: Angry, tone: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
        2: { label: t('annualUi.yearRetro.moods.low'), icon: Frown, tone: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
        3: { label: t('annualUi.yearRetro.moods.neutral'), icon: Meh, tone: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
        4: { label: t('annualUi.yearRetro.moods.good'), icon: Smile, tone: 'text-lime-700', bg: 'bg-lime-50 border-lime-200' },
        5: { label: t('annualUi.yearRetro.moods.great'), icon: Laugh, tone: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    }), [t]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-[1400px] max-h-[92vh] overflow-hidden flex flex-col relative animate-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-stone-400 hover:text-black transition-colors z-10"
                    aria-label={t('annualUi.yearRetro.closeAria')}
                >
                    <X size={22} />
                </button>

                <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-stone-100 bg-stone-50">
                    <div className="flex items-start justify-between gap-3 pr-8">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl text-white" style={{ backgroundColor: theme.primary }}>
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">{t('annualUi.yearRetro.title', { year: currentYear })}</h2>
                                <p className="text-sm text-stone-500 font-medium mt-1">
                                    {t('annualUi.yearRetro.description')}
                                </p>
                            </div>
                        </div>
                        <div className="p-2 rounded-xl text-white" style={{ backgroundColor: theme.primary }}>
                            <div className="flex bg-white/15 p-1 rounded-xl border border-white/20">
                                <button
                                    onClick={() => setViewMode('habits')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.16em] transition-colors ${viewMode === 'habits' ? 'bg-white text-black' : 'text-white/80'}`}
                                >
                                    {t('annualUi.yearRetro.habits')}
                                </button>
                                <button
                                    onClick={() => setViewMode('mood')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.16em] transition-colors ${viewMode === 'mood' ? 'bg-white text-black' : 'text-white/80'}`}
                                >
                                    {t('annualUi.yearRetro.moodsLabel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {monthlySummaries.map((summary, idx) => {
                            const displayRate = summary.isCurrentMonth ? (summary.proRatedRate || summary.rate || 0) : (summary.rate || 0);
                            const status = summary.isFutureMonth ? t('annualUi.yearRetro.upcomingMonth') : summary.signal || (summary.isCurrentMonth ? t('annualUi.yearRetro.liveMonth') : t('annualUi.yearRetro.completedMonth'));
                            const moodCounts = (summary.days || []).reduce((acc: Record<number, number>, day: any) => {
                                if (day?.mood) acc[day.mood] = (acc[day.mood] || 0) + 1;
                                return acc;
                            }, {});
                            const topMoodEntry = Object.entries(moodCounts).sort((a, b) => Number(b[1]) - Number(a[1]) || Number(b[0]) - Number(a[0]))[0];
                            const topMoodValue = topMoodEntry ? Number(topMoodEntry[0]) : null;
                            const topMoodCount = topMoodEntry ? Number(topMoodEntry[1]) : 0;
                            const moodConfig = topMoodValue ? moodMeta[topMoodValue as keyof typeof moodMeta] : null;
                            const MoodIcon = moodConfig?.icon;

                            return (
                                <div key={summary.month} className="rounded-[24px] border border-stone-200 bg-gradient-to-b from-white to-stone-50 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">{summary.month} {currentYear}</p>
                                            {viewMode === 'habits' ? (
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className="inline-flex items-center rounded-full bg-stone-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white">
                                                        {t('annualUi.yearRetro.percentDone', { percent: Math.round(displayRate) })}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-stone-500">{t('annualUi.yearRetro.logsCount', { completed: summary.completed, total: Math.round(summary.total) })}</span>
                                                </div>
                                            ) : moodConfig && MoodIcon ? (
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${moodConfig.bg} ${moodConfig.tone}`}>
                                                        <MoodIcon size={12} />
                                                        {moodConfig.label}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-stone-500">{topMoodCount} logs</span>
                                                </div>
                                            ) : (
                                                <p className="text-sm font-black uppercase mt-1 text-stone-400">{t('annualUi.yearRetro.noMoodLogsYet')}</p>
                                            )}
                                            <p className="text-[11px] font-bold text-stone-500 mt-1">{status}</p>
                                        </div>
                                        <button
                                            onClick={() => onOpenMonth(idx)}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-stone-600 hover:text-black hover:border-black transition-colors"
                                        >
                                            {t('annualUi.yearRetro.open')}
                                            <ExternalLink size={12} />
                                        </button>
                                    </div>

                                    <RetroGrid
                                        days={summary.days || []}
                                        viewMode={viewMode}
                                        monthIndex={idx}
                                        year={currentYear}
                                        onDayClick={(day) => onDayClick(idx, day)}
                                        startOfWeek={startOfWeek}
                                        variant="modal"
                                    />

                                    <div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-bold text-stone-500">
                                        {viewMode === 'habits' ? (
                                            <>
                                                <span>{t('annualUi.yearRetro.doneCount', { completed: summary.completed, total: Math.round(summary.total) })}</span>
                                                <span className="truncate text-right">{summary.topHabit?.name ? t('annualUi.yearRetro.topHabit', { name: summary.topHabit.name }) : t('annualUi.yearRetro.noTopHabitYet')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{t('annualUi.yearRetro.moodThisMonth')}</span>
                                                <span className="truncate text-right">
                                                    {moodConfig ? t('annualUi.yearRetro.moodWithCount', { mood: moodConfig.label, count: topMoodCount }) : t('annualUi.yearRetro.noMoodYet')}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
