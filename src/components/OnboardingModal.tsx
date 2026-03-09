import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Theme, Habit, HabitCompletion, DailyNote, DayData } from '../types';
import { THEMES } from '../constants';
import { Check, Globe, Palette, CalendarDays, BookOpen, ListTodo, BarChart3, ArrowDown } from 'lucide-react';
import { DailyCard } from './DailyCard';
import { useTranslation } from 'react-i18next';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTheme: Theme;
    onThemeChange: (theme: Theme) => void;
    initialLanguage: string;
    onLanguageChange: (lang: string) => void | Promise<void>;
    initialStartOfWeek: 'monday' | 'sunday';
    onStartOfWeekChange: (val: 'monday' | 'sunday') => void | Promise<void>;
    onCreateFirstHabit: (payload: {
        name: string;
        description: string;
        color: string;
        frequency: number[] | undefined;
        weeklyTarget: number | undefined;
    }) => void | Promise<void>;
    username?: string;
}

type Panel = 'habits' | 'journal' | 'tasks';

const LANGUAGES = [
    { id: 'en', label: 'English' },
    { id: 'es', label: 'Español' },
    { id: 'fr', label: 'Français' },
    { id: 'de', label: 'Deutsch' },
    { id: 'it', label: 'Italiano' },
    { id: 'pt', label: 'Português' },
    { id: 'ja', label: '日本語' },
    { id: 'ko', label: '한국어' },
    { id: 'zh', label: '中文' }
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
    isOpen,
    onClose,
    initialTheme,
    onThemeChange,
    initialLanguage,
    onLanguageChange,
    initialStartOfWeek,
    onStartOfWeekChange,
    onCreateFirstHabit,
    username
}) => {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);

    const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage || 'en');
    const [selectedTheme, setSelectedTheme] = useState<Theme>(initialTheme);
    const [selectedStartOfWeek, setSelectedStartOfWeek] = useState<'monday' | 'sunday'>(initialStartOfWeek || 'monday');

    const [habitName, setHabitName] = useState('');
    const [habitDescription, setHabitDescription] = useState('');
    const [habitFrequencyType, setHabitFrequencyType] = useState<'fixed' | 'flexible'>('fixed');
    const [habitFrequency, setHabitFrequency] = useState<number[] | undefined>(undefined);
    const [habitWeeklyTarget, setHabitWeeklyTarget] = useState(3);
    const [firstHabitCreated, setFirstHabitCreated] = useState(false);

    const [tutorialHabits, setTutorialHabits] = useState<Habit[]>([]);
    const [tutorialCompletions, setTutorialCompletions] = useState<HabitCompletion>({});
    const [tutorialNotes, setTutorialNotes] = useState<DailyNote>({});
    const [tutorialViewMode, setTutorialViewMode] = useState<Panel>('habits');

    const [didCompleteHabit, setDidCompleteHabit] = useState(false);
    const [didSkipHabit, setDidSkipHabit] = useState(false);
    const [didUncheckHabit, setDidUncheckHabit] = useState(false);
    const [step4Phase, setStep4Phase] = useState<'need_done' | 'need_skip' | 'need_uncheck' | 'complete'>('need_done');
    const [journalSavedClicked, setJournalSavedClicked] = useState(false);
    const [analyticsPreviewSeen, setAnalyticsPreviewSeen] = useState(false);
    const [arrowPosition, setArrowPosition] = useState<{ left: number; top: number } | null>(null);
    const cardFrameRef = useRef<HTMLDivElement | null>(null);

    const totalSteps = 10;
    const hintClass = 'inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-black bg-amber-100 text-black';
    const settingsNote = t('onboarding.settingsNote');

    const steps = useMemo(() => ([
        { title: t('onboarding.steps.language.title'), subtitle: t('onboarding.steps.language.subtitle') },
        { title: t('onboarding.steps.theme.title'), subtitle: t('onboarding.steps.theme.subtitle') },
        { title: t('onboarding.steps.startOfWeek.title'), subtitle: t('onboarding.steps.startOfWeek.subtitle') },
        { title: t('onboarding.steps.firstHabit.title'), subtitle: t('onboarding.steps.firstHabit.subtitle') },
        { title: t('onboarding.steps.dailyCard.title'), subtitle: t('onboarding.steps.dailyCard.subtitle') },
        { title: t('onboarding.steps.openJournal.title'), subtitle: t('onboarding.steps.openJournal.subtitle') },
        { title: t('onboarding.steps.saveJournal.title'), subtitle: t('onboarding.steps.saveJournal.subtitle') },
        { title: t('onboarding.steps.openTasks.title'), subtitle: t('onboarding.steps.openTasks.subtitle') },
        { title: t('onboarding.steps.taskFlow.title'), subtitle: t('onboarding.steps.taskFlow.subtitle') },
        { title: t('onboarding.steps.analytics.title'), subtitle: t('onboarding.steps.analytics.subtitle') }
    ]), [t]);

    const tutorialDate = useMemo(() => new Date(), []);
    const tutorialDateKey = useMemo(() => {
        const y = tutorialDate.getFullYear();
        const m = String(tutorialDate.getMonth() + 1).padStart(2, '0');
        const d = String(tutorialDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, [tutorialDate]);

    const tutorialDayData: DayData = useMemo(() => {
        const existing = tutorialNotes[tutorialDateKey];
        if (!existing) return { tasks: [] };
        if (Array.isArray(existing)) return { tasks: existing };
        return existing;
    }, [tutorialNotes, tutorialDateKey]);

    useEffect(() => {
        if (!isOpen) return;

        setStep(0);
        setSelectedLanguage(initialLanguage || 'en');
        setSelectedTheme(initialTheme);
        setSelectedStartOfWeek(initialStartOfWeek || 'monday');
        setHabitName('');
        setHabitDescription('');
        setHabitFrequencyType('fixed');
        setHabitFrequency(undefined);
        setHabitWeeklyTarget(3);
        setFirstHabitCreated(false);
        setTutorialHabits([]);
        setTutorialCompletions({});
        setTutorialNotes({});
        setTutorialViewMode('habits');
        setDidCompleteHabit(false);
        setDidSkipHabit(false);
        setDidUncheckHabit(false);
        setStep4Phase('need_done');
        setJournalSavedClicked(false);
        setAnalyticsPreviewSeen(false);
        setArrowPosition(null);
    }, [isOpen]);

    const applyLanguage = async (lang: string) => {
        setSelectedLanguage(lang);
        await onLanguageChange(lang);
    };

    const applyTheme = (theme: Theme) => {
        setSelectedTheme(theme);
        onThemeChange(theme);
    };

    const applyStartOfWeek = async (value: 'monday' | 'sunday') => {
        setSelectedStartOfWeek(value);
        await onStartOfWeekChange(value);
    };

    const toggleCompletion = (habitId: string, dateKey: string) => {
        setTutorialCompletions(prev => {
            const current = prev[habitId]?.[dateKey] || false;
            const next = !current;

            if (next && step4Phase === 'need_done') {
                setDidCompleteHabit(true);
                setStep4Phase('need_skip');
            } else if (!next && step4Phase === 'need_uncheck') {
                setDidUncheckHabit(true);
                setStep4Phase('complete');
            }

            return {
                ...prev,
                [habitId]: {
                    ...(prev[habitId] || {}),
                    [dateKey]: next
                }
            };
        });
    };

    const toggleHabitInactive = (habitId: string, dateKey: string) => {
        setTutorialNotes(prev => {
            const currentRaw = prev[dateKey];
            const current = Array.isArray(currentRaw)
                ? { tasks: currentRaw }
                : (currentRaw || { tasks: [] });
            const inactive = new Set(current.inactiveHabits || []);
            const wasInactive = inactive.has(habitId);
            if (wasInactive) {
                inactive.delete(habitId);
            } else {
                inactive.add(habitId);
                if (step4Phase === 'need_skip') {
                    setDidSkipHabit(true);
                    setStep4Phase('need_uncheck');
                }
            }
            return {
                ...prev,
                [dateKey]: {
                    ...current,
                    inactiveHabits: Array.from(inactive)
                }
            };
        });
    };

    const isHabitInactive = (habitId: string, dateKey: string) => {
        const currentRaw = tutorialNotes[dateKey];
        const current = Array.isArray(currentRaw)
            ? { tasks: currentRaw }
            : (currentRaw || { tasks: [] });
        return (current.inactiveHabits || []).includes(habitId);
    };

    const updateNote = (dateKey: string, data: Partial<DayData>) => {
        setTutorialNotes(prev => {
            const currentRaw = prev[dateKey];
            const current = Array.isArray(currentRaw)
                ? { tasks: currentRaw }
                : (currentRaw || { tasks: [] });
            return {
                ...prev,
                [dateKey]: {
                    ...current,
                    ...data
                }
            };
        });
    };

    const hasJournalMood = typeof tutorialDayData.mood === 'number';
    const hasJournalText = !!(tutorialDayData.journal || '').trim();
    const hasTask = (tutorialDayData.tasks || []).length > 0;
    const hasNamedTask = (tutorialDayData.tasks || []).some(task => !!task.text?.trim());
    const hasCompletedTask = (tutorialDayData.tasks || []).some(task => task.completed && !!task.text?.trim());

    const canProceed = (() => {
        switch (step) {
            case 0:
                return !!selectedLanguage;
            case 1:
                return !!selectedTheme;
            case 2:
                return !!selectedStartOfWeek;
            case 3:
                return !!habitName.trim();
            case 4:
                return step4Phase === 'complete';
            case 5:
                return tutorialViewMode === 'journal';
            case 6:
                return hasJournalMood && hasJournalText && journalSavedClicked;
            case 7:
                return tutorialViewMode === 'tasks';
            case 8:
                return hasTask && hasNamedTask && hasCompletedTask;
            case 9:
                return analyticsPreviewSeen;
            default:
                return false;
        }
    })();

    const getAnchorIdForStep = () => {
        if (step === 4) return 'habit-checkbox';
        if (step === 5) return 'status-journal';
        if (step === 6) {
            if (!hasJournalMood) return 'journal-moods';
            if (!hasJournalText) return 'journal-input';
            return 'journal-save';
        }
        if (step === 7) return 'status-tasks';
        if (step === 8) {
            if (!hasTask) return 'task-add';
            if (!hasNamedTask) return 'task-input';
            return 'task-checkbox';
        }
        return null;
    };

    useEffect(() => {
        if (step < 4 || step > 8) {
            setArrowPosition(null);
            return;
        }

        const placeArrow = () => {
            const frame = cardFrameRef.current;
            if (!frame) return;
            const anchorId = getAnchorIdForStep();
            if (!anchorId) return;

            const anchor = frame.querySelector(`[data-onboarding=\"${anchorId}\"]`) as HTMLElement | null;
            if (!anchor) {
                setArrowPosition(null);
                return;
            }

            const frameRect = frame.getBoundingClientRect();
            const anchorRect = anchor.getBoundingClientRect();
            const left = (anchorRect.left - frameRect.left) + (anchorRect.width / 2);
            const top = Math.max(10, (anchorRect.top - frameRect.top) - 54);
            setArrowPosition({ left, top });
        };

        const raf = window.requestAnimationFrame(placeArrow);
        window.addEventListener('resize', placeArrow);

        return () => {
            window.cancelAnimationFrame(raf);
            window.removeEventListener('resize', placeArrow);
        };
    }, [step, tutorialViewMode, didCompleteHabit, didSkipHabit, didUncheckHabit, hasJournalMood, hasJournalText, hasTask, hasCompletedTask, tutorialCompletions, tutorialNotes]);

    useEffect(() => {
        if (step !== 5) return;
        if (tutorialViewMode !== 'journal') return;

        const timer = window.setTimeout(() => {
            setStep(prev => (prev === 5 ? 6 : prev));
        }, 320);

        return () => window.clearTimeout(timer);
    }, [step, tutorialViewMode]);

    useEffect(() => {
        if (step !== 6) return;
        if (!(hasJournalMood && hasJournalText && journalSavedClicked)) return;

        const timer = window.setTimeout(() => {
            setStep(prev => (prev === 6 ? 7 : prev));
        }, 320);

        return () => window.clearTimeout(timer);
    }, [step, hasJournalMood, hasJournalText, journalSavedClicked]);

    useEffect(() => {
        if (step !== 7) return;
        if (tutorialViewMode !== 'tasks') return;

        const timer = window.setTimeout(() => {
            setStep(prev => (prev === 7 ? 8 : prev));
        }, 320);

        return () => window.clearTimeout(timer);
    }, [step, tutorialViewMode]);

    const handleNext = async () => {
        if (!canProceed) return;

        if (step === 3 && !firstHabitCreated) {
            const tutorialHabit: Habit = {
                id: 'tutorial-habit',
                name: habitName.trim(),
                description: habitDescription.trim(),
                type: habitFrequencyType === 'flexible' ? 'weekly' : 'daily',
                color: selectedTheme.primary,
                goal: 100,
                frequency: habitFrequencyType === 'fixed' ? habitFrequency : undefined,
                weeklyTarget: habitFrequencyType === 'flexible' ? habitWeeklyTarget : undefined
            };
            setTutorialHabits([tutorialHabit]);
            setTutorialCompletions({});
            setTutorialNotes({ [tutorialDateKey]: { tasks: [] } });
            setTutorialViewMode('habits');

            await onCreateFirstHabit({
                name: habitName.trim(),
                description: habitDescription.trim(),
                color: selectedTheme.primary,
                frequency: habitFrequencyType === 'fixed' ? habitFrequency : undefined,
                weeklyTarget: habitFrequencyType === 'flexible' ? habitWeeklyTarget : undefined
            });

            setFirstHabitCreated(true);
        }

        if (step >= totalSteps - 1) {
            onClose();
            return;
        }

        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (step === 0) return;
        setStep(prev => prev - 1);
    };

    const handleSkip = () => {
        if (step >= totalSteps - 1) {
            onClose();
            return;
        }
        setStep(prev => prev + 1);
    };

    const renderStepBody = () => {
        if (step === 0) {
            return (
                <div className="space-y-2">
                    <div className={hintClass}>{t('onboarding.hints.clickLanguage')}</div>
                    <p className="text-[11px] font-semibold text-stone-500">{settingsNote}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.id}
                                onClick={() => applyLanguage(lang.id)}
                                className={`border-2 px-3 py-2 text-sm font-bold ${selectedLanguage === lang.id ? 'border-black bg-black text-white' : 'border-stone-300 bg-white text-black'}`}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        if (step === 1) {
            return (
                <div className="space-y-2">
                    <div className={hintClass}>{t('onboarding.hints.clickTheme')}</div>
                    <p className="text-[11px] font-semibold text-stone-500">{settingsNote}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {THEMES.map(theme => (
                            <button
                                key={theme.name}
                                onClick={() => applyTheme(theme)}
                                className={`border-2 p-2 text-left ${selectedTheme.name === theme.name ? 'border-black bg-stone-100' : 'border-stone-300 bg-white text-black'}`}
                            >
                                <div className="flex gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: theme.primary }} />
                                    <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: theme.secondary }} />
                                </div>
                                <p className="text-[11px] font-bold">{theme.name}</p>
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        if (step === 2) {
            return (
                <div className="space-y-2">
                    <div className={hintClass}>{t('onboarding.hints.clickStartDay')}</div>
                    <p className="text-[11px] font-semibold text-stone-500">{settingsNote}</p>
                    <div className="grid grid-cols-2 gap-2 max-w-sm">
                        <button
                            onClick={() => applyStartOfWeek('monday')}
                            className={`border-2 px-3 py-3 text-sm font-black ${selectedStartOfWeek === 'monday' ? 'border-black bg-black text-white' : 'border-stone-300 bg-white text-black'}`}
                        >
                            {t('onboarding.days.monday')}
                        </button>
                        <button
                            onClick={() => applyStartOfWeek('sunday')}
                            className={`border-2 px-3 py-3 text-sm font-black ${selectedStartOfWeek === 'sunday' ? 'border-black bg-black text-white' : 'border-stone-300 bg-white text-black'}`}
                        >
                            {t('onboarding.days.sunday')}
                        </button>
                    </div>
                </div>
            );
        }

        if (step === 3) {
            return (
                <div className="border-2 border-black bg-white p-3 space-y-3 max-w-xl">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-black" style={{ backgroundColor: selectedTheme.primary }} />
                        <p className="text-xs font-black uppercase tracking-wider">{t('common.myHabits')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="px-3 py-1 border-2 border-black bg-black text-white text-[10px] font-black uppercase tracking-widest"
                        >
                            {t('common.myHabits')}
                        </button>
                        <p className="text-[11px] font-semibold text-stone-600">{t('onboarding.manageHabitsHint')}</p>
                    </div>
                    <div className={hintClass}>{t('onboarding.hints.typeHabitName')}</div>
                    <input
                        value={habitName}
                        onChange={(e) => setHabitName(e.target.value)}
                        placeholder={t('habitManager.habitNamePlaceholder')}
                        className={`w-full border-2 px-3 py-2 text-sm font-semibold ${habitName.trim() ? 'border-black' : 'border-amber-500 animate-pulse'}`}
                    />
                    <textarea
                        value={habitDescription}
                        onChange={(e) => setHabitDescription(e.target.value)}
                        placeholder={t('onboarding.optionalDescription')}
                        className="w-full border-2 border-black px-3 py-2 text-sm min-h-[70px]"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                        <button
                            type="button"
                            onClick={() => setHabitFrequencyType('fixed')}
                            className={`p-2 border-2 text-left transition-colors ${habitFrequencyType === 'fixed' ? 'border-black bg-black text-white' : 'border-black bg-white text-black hover:bg-stone-50'}`}
                        >
                            <p className="text-[11px] font-black uppercase tracking-widest">{t('habitManager.fixed')}</p>
                            <p className={`text-[10px] font-semibold mt-1 ${habitFrequencyType === 'fixed' ? 'text-white/90' : 'text-stone-600'}`}>
                                {t('onboarding.fixedDescription')}
                            </p>
                        </button>
                        <button
                            type="button"
                            onClick={() => setHabitFrequencyType('flexible')}
                            className={`p-2 border-2 text-left transition-colors ${habitFrequencyType === 'flexible' ? 'border-black bg-black text-white' : 'border-black bg-white text-black hover:bg-stone-50'}`}
                        >
                            <p className="text-[11px] font-black uppercase tracking-widest">{t('habitManager.flexible')}</p>
                            <p className={`text-[10px] font-semibold mt-1 ${habitFrequencyType === 'flexible' ? 'text-white/90' : 'text-stone-600'}`}>
                                {t('onboarding.flexibleDescription')}
                            </p>
                        </button>
                    </div>
                    {habitFrequencyType === 'fixed' ? (
                        <div className="flex gap-1">
                            {[
                                t('onboarding.daysShort.su'),
                                t('onboarding.daysShort.mo'),
                                t('onboarding.daysShort.tu'),
                                t('onboarding.daysShort.we'),
                                t('onboarding.daysShort.th'),
                                t('onboarding.daysShort.fr'),
                                t('onboarding.daysShort.sa')
                            ].map((day, i) => {
                                const isSelected = !habitFrequency || habitFrequency.includes(i);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (!habitFrequency) {
                                                const all = [0, 1, 2, 3, 4, 5, 6];
                                                setHabitFrequency(all.filter(d => d !== i));
                                            } else if (habitFrequency.includes(i)) {
                                                const next = habitFrequency.filter(d => d !== i);
                                                setHabitFrequency(next.length === 7 ? undefined : next);
                                            } else {
                                                const next = [...habitFrequency, i].sort();
                                                setHabitFrequency(next.length === 7 ? undefined : next);
                                            }
                                        }}
                                        className={`w-7 h-7 flex items-center justify-center text-[10px] font-black border-2 transition-all ${isSelected ? 'bg-black text-white border-black' : 'bg-white text-stone-300 border-stone-200 hover:border-stone-400'}`}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1.5 w-full max-w-xs">
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min="1"
                                    max="7"
                                    value={habitWeeklyTarget}
                                    onChange={(e) => setHabitWeeklyTarget(parseInt(e.target.value))}
                                    className="flex-1 accent-black h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-xs font-black min-w-[2.5rem] text-center border-2 border-black bg-stone-50 px-1 py-0.5">
                                    {habitWeeklyTarget}x
                                </span>
                            </div>
                            <span className="text-[9px] font-bold text-stone-500 uppercase tracking-tight">{t('habitManager.timesPerWeek')}</span>
                        </div>
                    )}
                </div>
            );
        }

        if (step === 9) {
            return (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="border-2 border-black bg-white p-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-stone-500 mb-2">{t('onboarding.analytics.consistencyRing')}</p>
                            <div className="h-24 border border-stone-200 bg-stone-50 flex items-center justify-center">
                                <div className="w-14 h-14 rounded-full border-[6px] border-black border-t-transparent" />
                            </div>
                        </div>
                        <div className="border-2 border-black bg-white p-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-stone-500 mb-2">{t('onboarding.analytics.weeklyTrend')}</p>
                            <div className="h-24 border border-stone-200 bg-stone-50 p-2 flex items-end gap-1.5">
                                {[32, 48, 26, 60, 52, 68, 74].map((h, idx) => (
                                    <div key={idx} className="flex-1 bg-black/80" style={{ height: `${h}%` }} />
                                ))}
                            </div>
                        </div>
                        <div className="border-2 border-black bg-white p-3 md:col-span-2">
                            <p className="text-[10px] font-black uppercase tracking-wider text-stone-500 mb-2">{t('onboarding.analytics.habitBreakdown')}</p>
                            <div className="space-y-2">
                                {[
                                    [t('onboarding.analytics.sample.reading'), 82],
                                    [t('onboarding.analytics.sample.workout'), 64],
                                    [t('onboarding.analytics.sample.journal'), 71]
                                ].map(([label, val]) => (
                                    <div key={String(label)}>
                                        <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                                            <span>{label}</span>
                                            <span>{val}%</span>
                                        </div>
                                        <div className="h-2 border border-black bg-stone-100">
                                            <div className="h-full bg-black" style={{ width: `${val}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="pt-1">
                        <button
                            onClick={() => setAnalyticsPreviewSeen(true)}
                            className={`px-4 py-2 border-2 border-black text-xs font-black uppercase tracking-widest ${analyticsPreviewSeen ? 'bg-black text-white' : 'bg-white text-black'}`}
                        >
                            {analyticsPreviewSeen ? t('onboarding.analytics.previewViewed') : t('onboarding.analytics.markSeen')}
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {step === 4 && (
                    <div className="border-2 border-black bg-amber-50 px-2 py-1.5 text-[10px] font-bold text-stone-700 leading-snug">
                        {t('onboarding.step4Explanation')}
                    </div>
                )}
                {step === 5 && <div className={`${hintClass} animate-pulse`}>{t('onboarding.hints.clickJournal')}</div>}
                {step === 6 && (
                    <div className="space-y-1.5">
                        <div className={`${hintClass} ${hasJournalMood ? '' : 'animate-pulse'}`}>{t('onboarding.hints.selectMood')}</div>
                        <div className={`${hintClass} ${hasJournalText ? '' : 'animate-pulse'}`}>{t('onboarding.hints.typeJournal')}</div>
                        <div className={`${hintClass} ${hasJournalMood && hasJournalText ? '' : 'animate-pulse'}`}>{t('onboarding.hints.clickSave')}</div>
                    </div>
                )}
                {step === 7 && <div className={`${hintClass} animate-pulse`}>{t('onboarding.hints.clickTasks')}</div>}
                {step === 8 && (
                    <div className="space-y-1.5">
                        <div className={`${hintClass} ${hasTask ? '' : 'animate-pulse'}`}>{t('onboarding.hints.clickNewTask')}</div>
                        <div className={`${hintClass} ${hasNamedTask ? '' : 'animate-pulse'}`}>{t('onboarding.hints.giveTaskName')}</div>
                        <div className={`${hintClass} ${hasCompletedTask ? '' : 'animate-pulse'}`}>{t('onboarding.hints.checkItOff')}</div>
                    </div>
                )}

                <div className={`border-2 border-black bg-stone-100 p-2 overflow-hidden ${step >= 4 && !canProceed ? 'ring-2 ring-amber-400' : ''}`}>
                    <div ref={cardFrameRef} className="relative max-w-[280px] sm:max-w-[340px] mx-auto h-[330px] sm:h-[420px]">
                        <div className="w-full h-full origin-top scale-[0.84] sm:scale-[0.92]">
                            <DailyCard
                                date={tutorialDate}
                                habits={tutorialHabits}
                                completions={tutorialCompletions}
                                theme={selectedTheme}
                                toggleCompletion={toggleCompletion}
                                toggleHabitInactive={toggleHabitInactive}
                                isHabitInactive={isHabitInactive}
                                notes={tutorialNotes}
                                updateNote={updateNote}
                                onShareClick={() => { }}
                                startOfWeek={selectedStartOfWeek}
                                globalViewMode={tutorialViewMode}
                                onGlobalViewModeChange={(mode) => setTutorialViewMode(mode)}
                                fitParentHeight
                                onJournalSaveClick={() => setJournalSavedClicked(true)}
                            />
                        </div>
                        {step >= 4 && step <= 8 && arrowPosition && (
                            <div
                                className="absolute z-20 pointer-events-none"
                                style={{ left: arrowPosition.left, top: arrowPosition.top, transform: 'translateX(-50%)' }}
                            >
                                <div className="flex flex-col items-center gap-1 animate-bounce">
                                    <div className="border-2 border-black bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                                        {step === 4 && !didCompleteHabit && t('onboarding.hints.clickCheckbox')}
                                        {step === 4 && step4Phase === 'need_skip' && t('onboarding.hints.rightClickLongPress')}
                                        {step === 4 && step4Phase === 'need_uncheck' && t('onboarding.hints.clickAgain')}
                                        {step === 4 && didCompleteHabit && didSkipHabit && didUncheckHabit && t('onboarding.hints.great')}
                                        {step === 5 && t('onboarding.hints.clickJournal')}
                                        {step === 6 && !hasJournalMood && t('onboarding.hints.pickMood')}
                                        {step === 6 && hasJournalMood && !hasJournalText && t('onboarding.hints.typeJournalSave')}
                                        {step === 6 && hasJournalMood && hasJournalText && t('onboarding.hints.great')}
                                        {step === 7 && t('onboarding.hints.clickTasks')}
                                        {step === 8 && !hasTask && t('onboarding.hints.clickNewTask')}
                                        {step === 8 && hasTask && !hasNamedTask && t('onboarding.hints.giveTaskName')}
                                        {step === 8 && hasTask && hasNamedTask && !hasCompletedTask && t('onboarding.hints.checkItOff')}
                                        {step === 8 && hasTask && hasNamedTask && hasCompletedTask && t('onboarding.hints.great')}
                                    </div>
                                    <ArrowDown size={18} className="text-black" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {step === 4 && (
                    <div className="text-[11px] text-stone-600 space-y-1">
                        <p>{didCompleteHabit ? t('onboarding.progress.completedDone') : t('onboarding.progress.completedPending')}</p>
                        <p>{didSkipHabit ? t('onboarding.progress.skippedDone') : t('onboarding.progress.skippedPending')}</p>
                        <p>{didUncheckHabit ? t('onboarding.progress.uncheckedDone') : t('onboarding.progress.uncheckedPending')}</p>
                    </div>
                )}
            </div>
        );
    };

    const StepIcon = (() => {
        if (step === 0) return Globe;
        if (step === 1) return Palette;
        if (step === 2) return CalendarDays;
        if (step >= 5 && step <= 6) return BookOpen;
        if (step >= 7 && step <= 8) return ListTodo;
        if (step === 9) return BarChart3;
        return Check;
    })();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
            <div className="bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] w-full max-w-2xl h-[min(90vh,760px)] overflow-hidden flex flex-col">
                <div className="p-4 border-b-2 border-black bg-stone-50 shrink-0">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 border-2 border-black bg-white flex items-center justify-center">
                                <StepIcon size={15} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{t('onboarding.getStarted')}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{t('onboarding.stepOf', { current: step + 1, total: totalSteps })}</span>
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight">{steps[step].title}</h2>
                    <p className="text-sm text-stone-600">{steps[step].subtitle}</p>
                    {!!username && <p className="text-[11px] text-stone-400 mt-1">{username}</p>}
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {renderStepBody()}
                </div>

                <div className="p-4 border-t-2 border-black bg-stone-50 flex items-center justify-between shrink-0">
                    <button
                        onClick={handleBack}
                        disabled={step === 0}
                        className="px-4 py-2 border-2 border-black bg-white text-xs font-black uppercase tracking-widest disabled:opacity-40"
                    >
                        {t('onboarding.back')}
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSkip}
                            className="px-4 py-2 border-2 border-black bg-white text-xs font-black uppercase tracking-widest"
                        >
                            {t('onboarding.skip')}
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={!canProceed}
                            className="px-5 py-2 border-2 border-black bg-black text-white text-xs font-black uppercase tracking-widest disabled:opacity-40"
                        >
                            {step === totalSteps - 1 ? t('onboarding.finish') : t('onboarding.next')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
