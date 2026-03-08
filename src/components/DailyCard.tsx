import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Check, Minus, Plus, Trash2, Pencil, ChevronLeft, ChevronRight, Save, Meh, Frown, Smile, Laugh, Angry } from 'lucide-react';
import { Habit, HabitCompletion, Theme, DailyNote, Task, DayData } from '../types';
import { isCompleted as checkCompleted } from '../utils/stats';
import { generateUUID } from '../utils/uuid';
import { isHabitActiveOnDate } from '../utils/habitActivity';
import { motion } from 'framer-motion';

interface DailyCardProps {
    date: Date;
    habits: Habit[];
    completions: HabitCompletion;
    theme: Theme;
    toggleCompletion: (habitId: string, dateKey: string) => void;
    toggleHabitInactive: (habitId: string, dateKey: string) => void;
    isHabitInactive: (habitId: string, dateKey: string) => boolean;
    notes: DailyNote;
    updateNote: (dateKey: string, data: Partial<DayData>) => void;
    onShareClick: (data: {
        date: Date;
        dayName: string;
        dateString: string;
        completedCount: number;
        totalCount: number;
        progress: number;
    }) => void;
    onPrev?: () => void;
    onNext?: () => void;
    onDateClick?: (date: Date) => void;
    defaultFlipped?: boolean;
    onJournalClick?: () => void;
    startOfWeek?: 'monday' | 'sunday';
    useGlobalTaskToggle?: boolean;
    globalTaskMode?: boolean;
    onGlobalTaskModeToggle?: () => void;
    fitParentHeight?: boolean;
}

export const DailyCard: React.FC<DailyCardProps & { combinedView?: boolean }> = ({
    date,
    habits,
    completions,
    theme,
    toggleCompletion,
    toggleHabitInactive,
    isHabitInactive,
    notes,
    updateNote,
    onShareClick,
    onPrev,
    onNext,
    onDateClick,
    defaultFlipped = false,
    onJournalClick,
    combinedView = false,
    startOfWeek = 'monday',
    useGlobalTaskToggle = false,
    globalTaskMode,
    onGlobalTaskModeToggle,
    fitParentHeight = false,
}) => {
    const { t, i18n } = useTranslation();
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingTaskText, setEditingTaskText] = useState('');
    const [isFlipped, setIsFlipped] = useState(defaultFlipped);
    const [showTasksView, setShowTasksView] = useState(false);
    const taskInputRef = useRef<HTMLInputElement>(null);
    const dailyHabitsRef = useRef<HTMLDivElement>(null);
    const tasksRef = useRef<HTMLDivElement>(null);
    const journalRef = useRef<HTMLDivElement>(null);
    const longPressTimerRef = useRef<number | null>(null);
    const longPressTriggeredRef = useRef(false);

    useEffect(() => {
        // Helper: smooth-scroll animator per element. Stores state on element.
        const scheduleSmoothScroll = (el: HTMLElement, targetScrollTop: number) => {
            const maxScroll = el.scrollHeight - el.clientHeight;
            if (targetScrollTop < 0) targetScrollTop = 0;
            if (targetScrollTop > maxScroll) targetScrollTop = maxScroll;

            const state = (el as any).__smoothScroll ||= { raf: null as number | null, target: el.scrollTop };
            state.target = targetScrollTop;
            if (state.raf) return;

            const step = () => {
                const cur = el.scrollTop;
                const to = state.target;
                const diff = to - cur;
                const delta = diff * 0.22;

                if (Math.abs(diff) < 0.5) {
                    el.scrollTop = to;
                    state.raf = null;
                    return;
                }

                el.scrollTop = cur + delta;
                state.raf = requestAnimationFrame(step) as unknown as number;
            };

            state.raf = requestAnimationFrame(step) as unknown as number;
        };

        const handleWheel = (e: WheelEvent) => {
            const target = e.currentTarget as HTMLElement;
            const isScrollable = target.scrollHeight > target.clientHeight + 1;
            if (!isScrollable) return;

            const maxScroll = target.scrollHeight - target.clientHeight;
            const oldScrollTop = target.scrollTop;
            let newScrollTop = oldScrollTop + e.deltaY;
            if (newScrollTop < 0) newScrollTop = 0;
            if (newScrollTop > maxScroll) newScrollTop = maxScroll;

            if (newScrollTop !== oldScrollTop) {
                e.preventDefault();
                e.stopPropagation();
                scheduleSmoothScroll(target, newScrollTop);
            }
        };

        const refs = [dailyHabitsRef, tasksRef, journalRef];

        refs.forEach(ref => {
            if (ref.current) {
                ref.current.addEventListener('wheel', handleWheel, { passive: false });
            }
        });

        return () => {
            refs.forEach(ref => {
                const el = ref.current;
                if (el) {
                    el.removeEventListener('wheel', handleWheel);
                    const s = (el as any).__smoothScroll;
                    if (s && s.raf) cancelAnimationFrame(s.raf);
                    (el as any).__smoothScroll = null;
                }
            });
        };
    }, []);

    useEffect(() => {
        setIsFlipped(defaultFlipped);
    }, [defaultFlipped]);

    const dayName = date.toLocaleDateString(i18n.language, { weekday: 'long' });
    const dateString = date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' });
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isToday = date.toDateString() === new Date().toDateString();

    useEffect(() => {
        if (typeof globalTaskMode === 'boolean') {
            setShowTasksView(globalTaskMode);
            return;
        }
        setShowTasksView(false);
    }, [dateKey, globalTaskMode]);

    useEffect(() => {
        // Prevent journal face from flashing when exiting tasks view.
        if (showTasksView) {
            setIsFlipped(false);
        }
    }, [showTasksView]);

    const getDayData = (): DayData => {
        const data = notes[dateKey];
        if (!data) return { tasks: [] };
        if (Array.isArray(data)) return { tasks: data };
        if ('tasks' in data) return data;
        return { tasks: [] };
    };

    const dayData = getDayData();

    const [mood, setMood] = useState<number | undefined>(dayData.mood);
    const [journal, setJournal] = useState(dayData.journal || '');

    useEffect(() => {
        setMood(dayData.mood);
        setJournal(dayData.journal || '');
    }, [dateKey, dayData.mood, dayData.journal]);

    // Lazy save effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // Only save if the state differs from the prop (DB) state
            const currentJournal = journal || '';
            const propJournal = dayData.journal || '';

            if (mood !== dayData.mood || currentJournal !== propJournal) {
                updateNote(dateKey, { mood, journal });
            }
        }, 1500);

        return () => clearTimeout(timeoutId);
    }, [mood, journal, dayData.mood, dayData.journal, dateKey, updateNote]);

    const handleSaveJournal = () => {
        updateNote(dateKey, { mood, journal });
        setShowTasksView(false);
        if (!combinedView) {
            if (onJournalClick) {
                onJournalClick();
            } else {
                setIsFlipped(false);
            }
        }
    };

    const openTasksView = () => {
        if (useGlobalTaskToggle && onGlobalTaskModeToggle) {
            if (!showTasksView) onGlobalTaskModeToggle();
            return;
        }
        setShowTasksView(true);
    };

    const openJournalView = () => {
        setShowTasksView(false);
        if (onJournalClick) {
            onJournalClick();
        } else {
            setIsFlipped(true);
        }
    };

    const visibleHabitsForDate = habits.filter(h => isHabitActiveOnDate(h, date));
    const dailyHabits = visibleHabitsForDate.filter(h => !h.weeklyTarget);

    const getDayProgress = () => {
        const activeDailyHabits = dailyHabits.filter(h => !isHabitInactive(h.id, dateKey));
        if (activeDailyHabits.length === 0) return 0;
        const monthIdx = date.getMonth();
        const day = date.getDate();
        const year = date.getFullYear();
        let doneCount = 0;
        activeDailyHabits.forEach(h => {
            if (checkCompleted(h.id, day, completions, monthIdx, year)) {
                doneCount++;
            }
        });
        return (doneCount / activeDailyHabits.length) * 100;
    };

    const actualProgress = getDayProgress();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setProgress(actualProgress);
        }, 0);
        return () => clearTimeout(timer);
    }, [actualProgress]);

    const completedHabitsCount = visibleHabitsForDate.reduce((acc, h) => {
        if (isHabitInactive(h.id, dateKey)) return acc;
        const doneToday = checkCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear());
        return doneToday ? acc + 1 : acc;
    }, 0);
    const totalHabitsCount = visibleHabitsForDate.filter(h => !isHabitInactive(h.id, dateKey)).length;
    const totalTasksCount = (dayData.tasks || []).length;
    const completedTasksCount = (dayData.tasks || []).filter(task => task.completed).length;
    const hasJournalEntry = Boolean((dayData.journal || '').trim());
    const hasMoodTracked = typeof mood === 'number';

    const clearLongPress = () => {
        if (longPressTimerRef.current) {
            window.clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const startLongPress = (habitId: string) => {
        clearLongPress();
        longPressTimerRef.current = window.setTimeout(() => {
            longPressTriggeredRef.current = true;
            toggleHabitInactive(habitId, dateKey);
        }, 450);
    };

    const handleFinishEditing = (taskId: string) => {
        const currentTasks = dayData.tasks || [];
        const task = currentTasks.find(t => t.id === taskId);
        if (!task) {
            setEditingTaskId(null);
            return;
        }

        const trimmedText = editingTaskText.trim();

        if (!trimmedText) {
            updateNote(dateKey, { tasks: currentTasks.filter(t => t.id !== taskId) });
            setEditingTaskId(null);
            return;
        }

        const isDuplicate = currentTasks.some(t =>
            t.id !== taskId &&
            t.text.trim().toLowerCase() === trimmedText.toLowerCase()
        );

        if (isDuplicate) {
            if (!task.text) {
                updateNote(dateKey, { tasks: currentTasks.filter(t => t.id !== taskId) });
            }
            setEditingTaskId(null);
            return;
        }

        const newTasks = currentTasks.map(t =>
            t.id === taskId ? { ...t, text: trimmedText } : t
        );
        updateNote(dateKey, { tasks: newTasks });
        setEditingTaskId(null);
    };

    const addNewTask = (openPanel: boolean = false) => {
        const currentTasks = dayData.tasks || [];
        const newTask: Task = { id: generateUUID(), text: '', completed: false };
        updateNote(dateKey, { tasks: [...currentTasks, newTask] });
        setEditingTaskId(newTask.id);
        setEditingTaskText('');
        if (openPanel) setShowTasksView(true);
    };

    const MOODS = [
        { value: 1, icon: Angry, label: t('dailyCard.moods.veryBad'), color: '#ef4444', tooltip: t('dailyCard.moods.veryBad') },
        { value: 2, icon: Frown, label: t('dailyCard.moods.bad'), color: '#f97316', tooltip: t('dailyCard.moods.bad') },
        { value: 3, icon: Meh, label: t('dailyCard.moods.neutral'), color: '#eab308', tooltip: t('dailyCard.moods.neutral') },
        { value: 4, icon: Smile, label: t('dailyCard.moods.good'), color: '#84cc16', tooltip: t('dailyCard.moods.good') },
        { value: 5, icon: Laugh, label: t('dailyCard.moods.veryGood'), color: '#10b981', tooltip: t('dailyCard.moods.veryGood') },
    ];
    const selectedMood = MOODS.find(m => m.value === mood);
    const MoodStatusIcon = selectedMood?.icon || Meh;

    const FrontFace = (
        <div
            className={`relative w-full h-full bg-white neo-border neo-shadow rounded-2xl overflow-hidden flex flex-col font-sans ${isToday ? 'ring-2 ring-black ring-offset-0' : ''}`}
        >
            {/* Header */}
            <div
                className={`p-3 text-center border-b-[2px] border-black relative ${onDateClick && !combinedView ? 'cursor-pointer' : ''}`}
                style={{ backgroundColor: isToday ? theme.primary : theme.secondary }}
                onClick={() => {
                    if (onDateClick && !combinedView) onDateClick(date);
                }}
            >
                {onPrev && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPrev();
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-white hover:bg-white/20 rounded transition-colors"
                    >
                        <ChevronLeft size={20} strokeWidth={3} />
                    </button>
                )}

                <h3 className="text-white font-black uppercase tracking-tighter text-lg leading-tight">{dayName}</h3>
                <p className="text-white/80 font-bold text-[10px] tracking-widest">{dateString}</p>

                {onNext && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onNext();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white hover:bg-white/20 rounded transition-colors"
                    >
                        <ChevronRight size={20} strokeWidth={3} />
                    </button>
                )}
            </div>

            {/* Progress Circle */}
            <div className="py-1.5 px-4 flex flex-col items-center justify-center border-b border-stone-100">
                <div className="relative w-24 h-24">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-stone-100"
                        />
                        <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - progress / 100)}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                            style={{ color: isToday ? theme.primary : theme.secondary }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-black">{Math.round(progress)}%</span>
                    </div>
                </div>
            </div>

            <div
                className={`${combinedView ? 'flex-1 overflow-y-auto' : 'flex-1 min-h-0 overflow-y-auto'}`}
                style={combinedView ? { WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' } : { WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
            >
            {/* Habits List */}
            <div className="py-1 px-3 bg-stone-50/50 flex flex-col border-b border-stone-100">
                <div className="flex items-center justify-between mb-1 pb-1 border-b border-black/5 flex-shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Habits</span>
                    <span className="text-[10px] font-black text-stone-400">{completedHabitsCount}/{totalHabitsCount}</span>
                </div>
                <div
                    ref={dailyHabitsRef}
                    className={`space-y-1 pr-1 touch-pan-y ${combinedView ? '' : 'md:scroll-container'}`}
                    style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}
                >
                    {visibleHabitsForDate.length > 0 ? visibleHabitsForDate.map(habit => {
                        const done = checkCompleted(habit.id, date.getDate(), completions, date.getMonth(), date.getFullYear());
                        const inactive = isHabitInactive(habit.id, dateKey);
                        let weekCompletions = 0;
                        let goalMet = false;

                        if (habit.weeklyTarget) {
                            const today = date;
                            const day = today.getDay();

                            let diff;
                            if (startOfWeek === 'monday') {
                                diff = today.getDate() - day + (day === 0 ? -6 : 1);
                            } else {
                                diff = today.getDate() - day;
                            }

                            const startDay = new Date(today.getFullYear(), today.getMonth(), diff);
                            for (let i = 0; i < 7; i++) {
                                const d = new Date(startDay);
                                d.setDate(startDay.getDate() + i);
                                const dKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                if (isHabitInactive(habit.id, dKey)) continue;
                                if (checkCompleted(habit.id, d.getDate(), completions, d.getMonth(), d.getFullYear())) {
                                    weekCompletions++;
                                }
                            }
                            goalMet = weekCompletions >= habit.weeklyTarget;
                        }

                        return (
                            <div
                                key={habit.id}
                                onClick={() => {
                                    if (longPressTriggeredRef.current) {
                                        longPressTriggeredRef.current = false;
                                        return;
                                    }
                                    toggleCompletion(habit.id, dateKey);
                                }}
                                onMouseDown={() => startLongPress(habit.id)}
                                onMouseUp={clearLongPress}
                                onMouseLeave={clearLongPress}
                                onTouchStart={() => startLongPress(habit.id)}
                                onTouchEnd={clearLongPress}
                                onTouchCancel={clearLongPress}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    clearLongPress();
                                    toggleHabitInactive(habit.id, dateKey);
                                }}
                                className="flex items-center justify-between group cursor-pointer hover:bg-black/5 rounded p-1 -mx-1 transition-colors"
                            >
                                <div className="flex items-center flex-1 min-w-0">
                                    <span className={`text-[11px] font-bold truncate ${inactive ? 'text-amber-700' : (done ? 'text-stone-400 line-through' : 'text-stone-700')}`}>
                                        {habit.name || t('dailyCard.untitled')}
                                    </span>
                                    {habit.weeklyTarget && (
                                        <span className={`ml-1 text-[9px] px-1 py-0 border-[1px] font-black uppercase tracking-tighter ${goalMet ? 'bg-black text-white border-black' : 'bg-stone-50 text-stone-400 border-stone-200'}`}>
                                            {weekCompletions}/{habit.weeklyTarget}
                                        </span>
                                    )}
                                </div>
                                <div
                                    className={`w-4 h-4 border-2 border-black flex items-center justify-center transition-all ${inactive ? 'bg-amber-300 text-amber-900 border-amber-700' : (done ? 'bg-black text-white' : 'bg-white')}`}
                                >
                                    {inactive ? <Minus size={10} strokeWidth={4} /> : (done && <Check size={10} strokeWidth={4} />)}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="text-[9px] text-stone-300 italic py-1">{t('dailyCard.noDailyHabits')}</div>
                    )}
                </div>
            </div>
            </div>
            {!combinedView && (
                <div
                    className="mt-auto border-t-2 border-black flex flex-col"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const data = e.dataTransfer.getData('application/json');
                        if (!data) return;
                        const { taskId, sourceDateKey } = JSON.parse(data);
                        if (sourceDateKey === dateKey) return;

                        const getSourceData = (): DayData => {
                            const d = notes[sourceDateKey];
                            if (Array.isArray(d)) return { tasks: d };
                            if (d && 'tasks' in d) return d;
                            return { tasks: [] };
                        };
                        const sourceData = getSourceData();
                        const sourceTasks = sourceData.tasks || [];
                        const targetTasks = dayData.tasks || [];

                        const taskToMove = sourceTasks.find(t => t.id === taskId);
                        if (!taskToMove) return;

                        updateNote(sourceDateKey, { tasks: sourceTasks.filter(t => t.id !== taskId) });
                        updateNote(dateKey, { tasks: [...targetTasks, taskToMove] });
                    }}
                >
                <div
                    ref={tasksRef}
                    className="p-2 md:overflow-y-auto md:max-h-[88px] pr-1 md:scroll-container touch-pan-y"
                    style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}
                >
                    <div className="grid grid-cols-3 gap-1">
                        <button
                            onClick={openTasksView}
                            className={`text-[8px] font-black uppercase tracking-wide py-1 px-1 rounded border transition-colors ${totalTasksCount > 0 ? 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50' : 'bg-stone-100 border-stone-300 text-stone-500 hover:bg-stone-200'}`}
                            title="Open tasks"
                        >
                            {totalTasksCount > 0 ? `${completedTasksCount}/${totalTasksCount} Tasks` : 'Add Tasks'}
                        </button>
                        <button
                            onClick={openJournalView}
                            className={`py-1 px-1 rounded border text-center transition-colors flex items-center justify-center ${hasJournalEntry ? 'bg-green-100 text-green-800 border-green-400 hover:bg-green-200' : 'bg-stone-100 text-stone-400 border-stone-300 hover:bg-stone-200'}`}
                            title="Open journal"
                        >
                            <BookOpen size={14} strokeWidth={2.8} />
                        </button>
                        <button
                            onClick={openJournalView}
                            className={`${hasMoodTracked ? 'p-0 border-0 bg-transparent text-black hover:opacity-80' : 'py-1 px-1 rounded border text-center bg-stone-100 text-stone-400 border-stone-300 hover:bg-stone-200'} transition-colors flex items-center justify-center`}
                            title="Open mood/journal"
                        >
                            {hasMoodTracked ? (
                                <span className="flex items-center justify-center">
                                    <MoodStatusIcon size={18} strokeWidth={2.8} className="text-black" fill={selectedMood?.color} />
                                </span>
                            ) : (
                                <Meh size={16} strokeWidth={2.8} />
                            )}
                        </button>
                    </div>
                </div>
                </div>
            )}
        </div>
    );

    const TasksFace = (
        <div
            className={`relative w-full h-full bg-white neo-border neo-shadow rounded-2xl overflow-hidden flex flex-col font-sans ${isToday && !combinedView ? 'ring-2 ring-black ring-offset-0' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                const data = e.dataTransfer.getData('application/json');
                if (!data) return;
                const { taskId, sourceDateKey } = JSON.parse(data);
                if (sourceDateKey === dateKey) return;

                const getSourceData = (): DayData => {
                    const d = notes[sourceDateKey];
                    if (Array.isArray(d)) return { tasks: d };
                    if (d && 'tasks' in d) return d;
                    return { tasks: [] };
                };
                const sourceData = getSourceData();
                const sourceTasks = sourceData.tasks || [];
                const targetTasks = dayData.tasks || [];
                const taskToMove = sourceTasks.find(t => t.id === taskId);
                if (!taskToMove) return;

                updateNote(sourceDateKey, { tasks: sourceTasks.filter(t => t.id !== taskId) });
                updateNote(dateKey, { tasks: [...targetTasks, taskToMove] });
            }}
        >
            <div className="p-3 text-center border-b-[2px] border-black relative" style={{ backgroundColor: isToday ? theme.primary : theme.secondary }}>
                {!combinedView && (
                    <button
                        onClick={() => {
                            if (useGlobalTaskToggle && onGlobalTaskModeToggle) {
                                onGlobalTaskModeToggle();
                            } else {
                                setShowTasksView(false);
                            }
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-white hover:bg-white/20 rounded transition-colors"
                        title="Back"
                    >
                        <ChevronLeft size={20} strokeWidth={3} />
                    </button>
                )}
                <h3 className="text-white font-black uppercase tracking-tighter text-lg leading-tight">{t('dailyCard.tasks')}</h3>
                <p className="text-white/80 font-bold text-[10px] tracking-widest">{dateString}</p>
            </div>

            <div className="p-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between gap-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-stone-600">
                    {(dayData.tasks || []).length} tasks
                </div>
                <button
                    onClick={() => addNewTask(false)}
                    className="inline-flex items-center gap-1 px-2 py-1 border border-black bg-white text-[10px] font-black uppercase tracking-widest hover:bg-stone-100 transition-colors"
                >
                    <Plus size={10} strokeWidth={3} />
                    Add
                </button>
            </div>

            <div
                ref={tasksRef}
                className="p-3 space-y-2 flex-1 overflow-y-auto scroll-container touch-pan-y"
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}
            >
                {(dayData.tasks || []).map((task) => (
                    <div
                        key={task.id}
                        draggable={editingTaskId !== task.id}
                        onDragStart={(e) => {
                            e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id, sourceDateKey: dateKey }));
                            e.dataTransfer.effectAllowed = 'move';
                        }}
                        className={`flex items-start gap-2 group bg-white border border-transparent hover:border-stone-200 p-2 rounded shadow-sm hover:shadow-md transition-all ${editingTaskId === task.id ? 'ring-2 ring-black' : 'cursor-move'}`}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const currentTasks = dayData.tasks || [];
                                const newTasks = currentTasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t);
                                updateNote(dateKey, { tasks: newTasks });
                            }}
                            className="p-2 -m-2 flex-shrink-0 flex items-center justify-center focus:outline-none"
                        >
                            <div className={`w-3 h-3 border border-black flex items-center justify-center transition-all ${task.completed ? 'bg-black text-white' : 'bg-white hover:bg-stone-100'}`}>
                                {task.completed && <Check size={8} strokeWidth={4} />}
                            </div>
                        </button>

                        {editingTaskId === task.id ? (
                            <input
                                ref={taskInputRef}
                                type="text"
                                value={editingTaskText}
                                onChange={(e) => setEditingTaskText(e.target.value)}
                                onBlur={() => handleFinishEditing(task.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleFinishEditing(task.id);
                                }}
                                className="w-full text-[11px] font-medium bg-transparent outline-none leading-tight border-none p-0 focus:ring-0 text-stone-800"
                                autoFocus
                            />
                        ) : (
                            <span
                                className={`flex-1 text-[11px] font-medium leading-tight break-all ${task.completed ? 'text-stone-400 line-through' : 'text-stone-800'}`}
                                onDoubleClick={() => {
                                    setEditingTaskId(task.id);
                                    setEditingTaskText(task.text);
                                }}
                            >
                                {task.text}
                            </span>
                        )}

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => {
                                    setEditingTaskId(task.id);
                                    setEditingTaskText(task.text);
                                }}
                                className="text-stone-400 hover:text-black transition-colors"
                                title={t('dailyCard.editTask')}
                            >
                                <Pencil size={10} />
                            </button>
                            <button
                                onClick={() => {
                                    const currentTasks = dayData.tasks || [];
                                    const newTasks = currentTasks.filter(t => t.id !== task.id);
                                    updateNote(dateKey, { tasks: newTasks });
                                }}
                                className="text-stone-400 hover:text-red-500 transition-colors"
                                title={t('dailyCard.deleteTask')}
                            >
                                <Trash2 size={10} />
                            </button>
                        </div>
                    </div>
                ))}
                {(!dayData.tasks || dayData.tasks.length === 0) && (
                    <div className="text-[10px] text-stone-400 text-center py-4 italic">
                        No Tasks Today
                    </div>
                )}
            </div>
        </div>
    );

    const JournalFace = (
        <div
            className={`relative w-full h-full bg-white neo-border neo-shadow rounded-2xl overflow-hidden flex flex-col font-sans ${isToday && !combinedView ? 'ring-2 ring-black ring-offset-0' : ''}`}
        >
            {/* Header (Matching style) */}
            <div className="p-3 text-center border-b-[2px] border-black relative" style={{ backgroundColor: isToday ? theme.primary : theme.secondary }}>
                {!combinedView && (
                    <button
                        onClick={handleSaveJournal}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-white hover:bg-white/20 rounded transition-colors"
                        title="Save & Back"
                    >
                        <ChevronLeft size={20} strokeWidth={3} />
                    </button>
                )}

                <h3 className="text-white font-black uppercase tracking-tighter text-lg leading-tight">{t('dailyCard.journal')}</h3>
                <p className="text-white/80 font-bold text-[10px] tracking-widest">{dateString}</p>
            </div>

            <div
                ref={journalRef}
                className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto scroll-container touch-pan-y"
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}
            >
                {/* Mood Selector */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-600 block text-center">{t('dailyCard.mood')}</label>
                    <div className="grid grid-cols-5 gap-1 px-2">
                        {MOODS.map((m) => {
                            const isSelected = mood === m.value;
                            const Icon = m.icon;
                            return (
                                <button
                                    key={m.value}
                                    onClick={() => setMood(m.value)}
                                    title={m.tooltip}
                                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all ${isSelected ? 'bg-stone-100 scale-105 shadow-inner' : 'hover:bg-stone-50 hover:scale-105'
                                        }`}
                                >
                                    <div
                                        className="p-1.5 rounded-full transition-all"
                                        style={{ opacity: isSelected ? 1 : 0.55 }}
                                    >
                                        <Icon size={18} strokeWidth={isSelected ? 2.8 : 2} className="text-black" fill={m.color} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Journal Textarea */}
                <div className="flex-1 flex flex-col gap-2 min-h-0">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-600 block text-center">{t('dailyCard.notes')}</label>
                    <textarea
                        value={journal}
                        onChange={(e) => setJournal(e.target.value)}
                        placeholder={t('dailyCard.journalPlaceholder')}
                        className="w-full flex-1 p-3 bg-stone-50 border-2 border-transparent focus:border-black rounded-xl resize-none text-xs leading-relaxed text-stone-900 placeholder:text-stone-300 outline-none transition-all font-medium"
                    />
                </div>

                <div className="flex-shrink-0">
                    <button
                        onClick={handleSaveJournal}
                        className="w-full py-2 bg-black text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-stone-800 transition-transform active:scale-95 flex items-center justify-center gap-2"
                        style={{ backgroundColor: theme.primary }}
                    >
                        <Save size={12} />
                        {combinedView ? 'Save' : t('dailyCard.saveEntry')}
                    </button>
                </div>
            </div>
        </div>
    );

    if (combinedView) {
        return (
            <motion.div
                key={dateKey}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.48, ease: 'easeOut' }}
                className="w-full h-[600px] grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                <motion.div
                    initial={{ opacity: 0, x: 95, y: 10, scale: 0.84 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.62, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10"
                >
                    {JournalFace}
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 14 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-20"
                >
                    {FrontFace}
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: -95, y: 10, scale: 0.84 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.62, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10"
                >
                    {TasksFace}
                </motion.div>
            </motion.div>
        );
    }

    return (
        <div
            className={`relative w-full group ${fitParentHeight ? 'h-full min-h-0' : 'h-[clamp(420px,56svh,720px)] md:h-[clamp(460px,60svh,760px)]'}`}
            style={{ perspective: '1000px' }}
        >
            <div
                className={`relative w-full h-full transition-transform duration-700`}
                style={{ transformStyle: 'preserve-3d', transform: (isFlipped || showTasksView) ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
                {/* --- FRONT FACE --- */}
                <div style={{ backfaceVisibility: 'hidden' }} className="relative w-full h-full">
                    {FrontFace}
                </div>

                {/* --- BACK FACE (JOURNAL / TASKS) --- */}
                <div
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    className="absolute inset-0"
                >
                    {showTasksView ? TasksFace : JournalFace}
                </div>
            </div>
        </div>
    );
};
