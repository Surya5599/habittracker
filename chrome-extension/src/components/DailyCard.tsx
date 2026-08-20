import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, Trash2, Pencil, ChevronLeft, ChevronRight, BookOpen, Save, Meh, Frown, Smile, Laugh, Angry, Share2 } from 'lucide-react';
import { Habit, HabitCompletion, Theme, DailyNote, Task, DayData, JournalEntry } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { isCompleted as checkCompleted } from '../utils/stats';
import { generateUUID } from '../utils/uuid';
import { WeekPicker } from './DateSelectors';

interface DailyCardProps {
    date: Date;
    habits: Habit[];
    completions: HabitCompletion;
    theme: Theme;
    toggleCompletion: (habitId: string, dateKey: string) => void;
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
    onDateSelect?: (date: Date) => void;
    removeHabit?: (id: string) => void;
    editingHabitId?: string | null;
    setEditingHabitId?: (id: string | null) => void;
    addHabit?: () => Promise<string | null>;
    cardStyle?: 'compact' | 'large';
    headerActions?: React.ReactNode;
}

const parseJournalEntries = (j: string | JournalEntry[] | undefined): JournalEntry[] => {
    if (!j) return [];
    if (Array.isArray(j)) return j.filter(e => e.text);
    if (typeof j === 'string' && j.trim()) return [{ id: '1', text: j, createdAt: Date.now() }];
    return [];
};

const formatEntryTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const MOODS = [
    { value: 1, icon: Angry,  color: '#ef4444', tooltip: 'Very Bad'  },
    { value: 2, icon: Frown,  color: '#f97316', tooltip: 'Bad'       },
    { value: 3, icon: Meh,    color: '#eab308', tooltip: 'Neutral'   },
    { value: 4, icon: Smile,  color: '#84cc16', tooltip: 'Good'      },
    { value: 5, icon: Laugh,  color: '#10b981', tooltip: 'Very Good' },
];

type Tab = 'habits' | 'tasks' | 'journal';

export const DailyCard: React.FC<DailyCardProps> = ({
    date,
    habits,
    completions,
    theme,
    toggleCompletion,
    notes,
    updateNote,
    onShareClick,
    onPrev,
    onNext,
    onDateSelect,
    cardStyle = 'large',
    headerActions,
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('habits');
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingTaskText, setEditingTaskText] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const taskInputRef = useRef<HTMLInputElement>(null);
    const habitsRef = useRef<HTMLDivElement>(null);
    const tasksRef = useRef<HTMLDivElement>(null);
    const journalRef = useRef<HTMLDivElement>(null);

    const dayName = DAYS_OF_WEEK[date.getDay()];
    const dayNameShort = dayName.slice(0, 3);
    const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isToday = date.toDateString() === new Date().toDateString();

    const getDayData = (): DayData => {
        const data = notes[dateKey];
        if (!data) return { tasks: [] };
        if (Array.isArray(data)) return { tasks: data };
        if ('tasks' in data) return data;
        return { tasks: [] };
    };
    const dayData = getDayData();

    // ── Journal — full multi-entry parity with web (add/edit/delete, per-entry mood) ──
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => parseJournalEntries(dayData.journal));
    const [isAddingEntry, setIsAddingEntry] = useState(false);
    const [newEntryText, setNewEntryText] = useState('');
    const [newEntryMood, setNewEntryMood] = useState<number | undefined>(undefined);
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [editingEntryText, setEditingEntryText] = useState('');
    const [editingEntryMood, setEditingEntryMood] = useState<number | undefined>(undefined);

    useEffect(() => {
        setJournalEntries(parseJournalEntries(dayData.journal));
        setIsAddingEntry(false);
        setEditingEntryId(null);
    }, [dateKey]);

    const saveEntries = (updated: JournalEntry[]) => {
        const latestMood = [...updated].reverse().find(e => e.mood)?.mood ?? dayData.mood;
        updateNote(dateKey, { journal: updated, mood: latestMood });
    };

    const handleAddEntry = () => {
        if (!newEntryText.trim()) return;
        const entry: JournalEntry = { id: generateUUID(), text: newEntryText.trim(), mood: newEntryMood, createdAt: Date.now() };
        const updated = [...journalEntries, entry];
        setJournalEntries(updated);
        setIsAddingEntry(false);
        setNewEntryText('');
        setNewEntryMood(undefined);
        saveEntries(updated);
    };

    const handleUpdateEntry = (id: string) => {
        if (!editingEntryText.trim()) return;
        const updated = journalEntries.map(e => e.id === id ? { ...e, text: editingEntryText, mood: editingEntryMood } : e);
        setJournalEntries(updated);
        setEditingEntryId(null);
        setEditingEntryText('');
        setEditingEntryMood(undefined);
        saveEntries(updated);
    };

    const handleDeleteEntry = (id: string) => {
        const updated = journalEntries.filter(e => e.id !== id);
        setJournalEntries(updated);
        saveEntries(updated);
    };

    useEffect(() => {
        if (isAddingEntry && journalRef.current) {
            setTimeout(() => {
                journalRef.current!.scrollTo({ top: journalRef.current!.scrollHeight, behavior: 'smooth' });
            }, 50);
        }
    }, [isAddingEntry]);

    // Progress
    const allHabits = habits;
    const totalCount = allHabits.length;
    const completedCount = allHabits.reduce((acc, h) =>
        checkCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear()) ? acc + 1 : acc, 0);
    const actualProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setProgress(actualProgress), 0);
        return () => clearTimeout(t);
    }, [actualProgress]);

    // Tasks
    const tasks = dayData.tasks || [];
    const completedTasksCount = tasks.filter(t => t.completed).length;
    const openTasksCount = tasks.length - completedTasksCount;

    // Journal status (for the tab bar icon)
    const activeMood = MOODS.find(m => m.value === dayData.mood);
    const hasJournalEntry = journalEntries.some(e => e.text.trim());

    const handleFinishEditing = (taskId: string) => {
        const currentTasks = dayData.tasks || [];
        const task = currentTasks.find(t => t.id === taskId);
        if (!task) { setEditingTaskId(null); return; }
        const trimmed = editingTaskText.trim();
        if (!trimmed) {
            updateNote(dateKey, { tasks: currentTasks.filter(t => t.id !== taskId) });
        } else {
            updateNote(dateKey, { tasks: currentTasks.map(t => t.id === taskId ? { ...t, text: trimmed } : t) });
        }
        setEditingTaskId(null);
    };

    const addTask = () => {
        const newTask: Task = { id: generateUUID(), text: '', completed: false };
        updateNote(dateKey, { tasks: [...tasks, newTask] });
        setEditingTaskId(newTask.id);
        setEditingTaskText('');
    };

    // Smooth scroll for whichever face is currently visible
    useEffect(() => {
        const refs = [habitsRef, tasksRef, journalRef];
        const handleWheel = (e: WheelEvent) => {
            const el = e.currentTarget as HTMLElement;
            if (el.scrollHeight <= el.clientHeight + 1) return;
            e.preventDefault();
            e.stopPropagation();
            el.scrollTop += e.deltaY;
        };
        refs.forEach(ref => ref.current?.addEventListener('wheel', handleWheel, { passive: false }));
        return () => refs.forEach(ref => ref.current?.removeEventListener('wheel', handleWheel));
    }, [activeTab]);

    // ── Small progress ring (compact: inside header) ──
    const SmallRing = (
        <div className="relative w-11 h-11 flex-shrink-0">
            <svg className="w-full h-full -rotate-90">
                <circle cx="22" cy="22" r="17" stroke="rgba(255,255,255,0.3)" strokeWidth="4" fill="transparent" />
                <circle cx="22" cy="22" r="17" stroke="white" strokeWidth="4" fill="transparent"
                    strokeDasharray={2 * Math.PI * 17}
                    strokeDashoffset={2 * Math.PI * 17 * (1 - progress / 100)}
                    strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-black text-ink-inverse">{Math.round(progress)}%</span>
            </div>
        </div>
    );

    // ── Large progress ring (large: below header) — matches web's LargeProgressPanel ──
    const LargeRing = (
        <div className="px-4 pt-1 pb-0 bg-surface border-b border-edge-subtle flex-shrink-0">
            <div className="mx-auto w-[128px] h-[128px] relative">
                <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="44" stroke="rgba(0,0,0,0.06)" strokeWidth="10" fill="transparent" />
                    <circle cx="64" cy="64" r="44" stroke={theme.secondary} strokeWidth="10" fill="transparent"
                        strokeDasharray={2 * Math.PI * 44}
                        strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
                        strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-ink-strong">{Math.round(progress)}%</span>
                </div>
            </div>
        </div>
    );

    // ── Status / Tab row — embedded in every face, exactly like web's shared StatusBar ──
    const StatusBar = (
        <div className="flex flex-col border-t-2 border-edge-strong flex-shrink-0" style={{ backgroundColor: 'var(--theme-secondary-faint)' }}>
        <div className="grid grid-cols-3">
            <button
                onClick={() => setActiveTab('habits')}
                className={`py-2 px-1 flex flex-col items-center justify-center border-r border-edge-strong transition-colors ${activeTab === 'habits' ? 'bg-surface-strong' : 'hover:bg-surface-muted'}`}
            >
                <span className="text-[8px] font-black uppercase tracking-wider text-ink-muted">My Habits</span>
                <span className="text-[10px] font-black text-ink mt-0.5">{completedCount}/{totalCount}</span>
            </button>
            <button
                onClick={() => setActiveTab('tasks')}
                className={`py-2 px-1 flex flex-col items-center justify-center border-r border-edge-strong transition-colors ${activeTab === 'tasks' ? 'bg-surface-strong' : 'hover:bg-surface-muted'}`}
            >
                <span className="text-[8px] font-black uppercase tracking-wider text-ink-muted">Tasks</span>
                <span className="text-[10px] font-black text-ink mt-0.5">
                    {tasks.length > 0 ? `${completedTasksCount}/${tasks.length}` : '+'}
                </span>
            </button>
            <button
                onClick={() => setActiveTab('journal')}
                className={`py-2 px-1 flex flex-col items-center justify-center transition-colors ${activeTab === 'journal' ? 'bg-surface-strong' : 'hover:bg-surface-muted'}`}
            >
                <span className="text-[8px] font-black uppercase tracking-wider text-ink-muted">Journal</span>
                <div className="mt-0.5">
                    {activeMood
                        ? <activeMood.icon size={14} strokeWidth={2.5} style={{ color: activeMood.color }} />
                        : <BookOpen size={14} strokeWidth={2.5} className={hasJournalEntry ? 'text-green-600' : 'text-ink-subtle'} />
                    }
                </div>
            </button>
        </div>
        <div className="flex justify-center py-1 border-t border-edge-subtle">
            <a href="https://habicard.com/privacy" target="_blank" rel="noopener noreferrer"
                className="text-[8px] text-ink-dim hover:text-ink-muted uppercase tracking-widest font-bold transition-colors">
                Privacy Policy
            </a>
        </div>
        </div>
    );

    // ── FRONT FACE — Habits ──
    const FrontFace = (
        <div className="relative w-full h-full neo-border shadow-neo rounded-2xl overflow-hidden flex flex-col font-sans bg-surface">
            <div className="border-b-2 border-edge-strong flex-shrink-0" style={{ backgroundColor: isToday ? theme.primary : theme.secondary }}>
                <div className={`w-full grid items-center py-2 ${cardStyle === 'compact'
                    ? 'grid-cols-[28px_minmax(0,1fr)_48px_28px]'
                    : 'grid-cols-[28px_minmax(0,1fr)_28px]'}`}>
                    <button onClick={onPrev} className="flex items-center justify-center p-1 text-ink-inverse hover:bg-surface/20 rounded transition-colors">
                        <ChevronLeft size={18} strokeWidth={3} />
                    </button>

                    <div className="text-left pl-1 min-w-0 overflow-hidden">
                        <h3 className="text-ink-inverse font-black tracking-tight text-sm leading-tight truncate">{dayName}</h3>
                        <div className="relative">
                            <button onClick={() => setShowDatePicker(!showDatePicker)}
                                className="text-ink-inverse/80 font-bold text-[9px] tracking-wide hover:text-ink-inverse transition-colors truncate block">
                                {dateString}
                            </button>
                            {onDateSelect && (
                                <WeekPicker isOpen={showDatePicker} onClose={() => setShowDatePicker(false)}
                                    currentDate={date} onWeekSelect={onDateSelect} themePrimary={theme.primary} />
                            )}
                        </div>
                    </div>

                    {cardStyle === 'compact' && SmallRing}

                    <button onClick={onNext} className="flex items-center justify-center p-1 text-ink-inverse hover:bg-surface/20 rounded transition-colors">
                        <ChevronRight size={18} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {headerActions && (
                <div className="flex items-center justify-end gap-1 px-2 py-1 border-b border-edge-strong/10 flex-shrink-0"
                    style={{ backgroundColor: (isToday ? theme.primary : theme.secondary) + 'dd' }}>
                    {headerActions}
                </div>
            )}

            {cardStyle === 'large' && LargeRing}

            <div ref={habitsRef} className="flex-1 min-h-0 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
                <div className="py-1 px-3">
                    {allHabits.length > 0 ? allHabits.map(habit => {
                        const done = checkCompleted(habit.id, date.getDate(), completions, date.getMonth(), date.getFullYear());
                        const today = date;
                        const day = today.getDay();
                        const diff = today.getDate() - (day === 0 ? 6 : day - 1);
                        const monday = new Date(today.getFullYear(), today.getMonth(), diff);
                        let weekCount = 0;
                        if (habit.weeklyTarget) {
                            for (let i = 0; i < 7; i++) {
                                const d = new Date(monday);
                                d.setDate(monday.getDate() + i);
                                if (checkCompleted(habit.id, d.getDate(), completions, d.getMonth(), d.getFullYear())) weekCount++;
                            }
                        }
                        const goalMet = habit.weeklyTarget ? weekCount >= habit.weeklyTarget : false;
                        return (
                            <div key={habit.id} onClick={() => toggleCompletion(habit.id, dateKey)}
                                className="flex items-center justify-between cursor-pointer hover:bg-black/5 rounded-lg px-1.5 -mx-1.5 py-1.5 transition-all">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                                    <div
                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{ backgroundColor: habit.color || '#d1d5db', opacity: done ? 0.35 : 1 }}
                                    />
                                    <span className={`text-[11px] font-bold truncate ${done ? 'text-ink-subtle line-through' : 'text-ink'}`}>
                                        {habit.name || 'Untitled'}
                                    </span>
                                    {habit.weeklyTarget && (
                                        <span className={`text-[8px] px-1 border font-black flex-shrink-0 ${goalMet ? 'bg-theme-primary text-white border-edge-strong' : 'bg-surface-muted text-ink-subtle border-edge'}`}>
                                            {weekCount}/{habit.weeklyTarget}wk
                                        </span>
                                    )}
                                </div>
                                <motion.div
                                    animate={{ scale: done ? [1, 1.25, 1] : 1 }}
                                    transition={{ duration: 0.18 }}
                                    className={`w-5 h-5 border-2 border-edge-strong flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-done text-ink-strong' : 'bg-surface'}`}
                                >
                                    {done && <Check size={11} strokeWidth={4} />}
                                </motion.div>
                            </div>
                        );
                    }) : (
                        <div className="text-[9px] text-ink-dim text-center py-4 italic">No habits due today</div>
                    )}
                </div>
            </div>

            {totalCount > 0 && completedCount === totalCount && (
                <button
                    onClick={() => onShareClick({ date, dayName, dateString, completedCount, totalCount, progress: actualProgress })}
                    className="w-full p-2.5 bg-surface-inverse text-ink-inverse font-black uppercase tracking-widest text-[10px] hover:bg-surface-inverse-hover transition-all flex items-center justify-center gap-2 border-t border-edge-strong flex-shrink-0"
                >
                    <Share2 size={12} />
                    Share Achievement
                </button>
            )}

            {StatusBar}
        </div>
    );

    // Shared prev/next mini header used by the Tasks/Journal back faces — matches web's
    // TasksFace/JournalFace header (centered title + chevrons, no date-picker/headerActions).
    const BackFaceHeader = (
        <div className="p-3 text-center border-b-2 border-edge-strong relative flex-shrink-0" style={{ backgroundColor: isToday ? theme.primary : theme.secondary }}>
            {onPrev && (
                <button onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-ink-inverse hover:bg-surface/20 rounded transition-colors">
                    <ChevronLeft size={20} strokeWidth={3} />
                </button>
            )}
            <h3 className="text-ink-inverse font-black tracking-tight text-sm leading-tight">{dayName}</h3>
            <p className="text-ink-inverse/80 font-bold text-[9px] tracking-wide whitespace-nowrap">{dateString}</p>
            {onNext && (
                <button onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-inverse hover:bg-surface/20 rounded transition-colors">
                    <ChevronRight size={20} strokeWidth={3} />
                </button>
            )}
        </div>
    );

    // ── BACK FACE — Tasks ──
    const TasksFace = (
        <div className="relative w-full h-full neo-border shadow-neo rounded-2xl overflow-hidden flex flex-col font-sans bg-surface">
            {BackFaceHeader}

            <div className="p-2 border-b-2 border-edge-strong bg-surface-muted flex items-center justify-between gap-2 flex-shrink-0">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-subtle">Tasks</p>
                    <p className="mt-1 text-sm font-black text-ink-strong">
                        {tasks.length > 0 ? `${openTasksCount} open of ${tasks.length}` : 'No tasks yet'}
                    </p>
                </div>
                <button onClick={addTask}
                    className="inline-flex items-center gap-1 px-2 py-1 border border-edge-strong bg-surface text-[9px] font-black uppercase tracking-wide hover:bg-surface-strong transition-colors">
                    <Plus size={9} strokeWidth={3} />
                    Add
                </button>
            </div>

            <div ref={tasksRef} className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5" style={{ overscrollBehavior: 'contain' }}>
                {tasks.map(task => (
                    <motion.div key={task.id}
                        animate={{
                            backgroundColor: task.completed ? '#f0fdf4' : '#ffffff',
                            borderColor: task.completed ? '#86efac' : 'rgba(0,0,0,0)',
                            boxShadow: task.completed ? '0 0 0 1px rgba(34,197,94,0.25)' : 'none',
                        }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className={`flex items-start gap-2 group border p-1.5 rounded shadow-neo-sm transition-all ${editingTaskId === task.id ? 'ring-2 ring-ring border-edge-strong' : 'border-edge-subtle hover:border-edge'}`}>
                        <button onClick={() => updateNote(dateKey, { tasks: tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t) })}
                            className="flex-shrink-0 mt-0.5">
                            <motion.div
                                animate={{ scale: task.completed ? [1, 1.25, 1] : 1 }}
                                transition={{ duration: 0.18 }}
                                className={`w-5 h-5 rounded border-2 border-edge-strong flex items-center justify-center transition-colors duration-300 ${task.completed ? 'bg-done border-done text-ink-strong' : 'bg-surface hover:bg-surface-strong'}`}>
                                {task.completed && <Check size={10} strokeWidth={3.2} />}
                            </motion.div>
                        </button>
                        {editingTaskId === task.id ? (
                            <input ref={taskInputRef} type="text" value={editingTaskText}
                                onChange={(e) => setEditingTaskText(e.target.value)}
                                onBlur={() => handleFinishEditing(task.id)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleFinishEditing(task.id); }}
                                className="flex-1 text-[11px] font-medium bg-transparent outline-none text-ink-strong min-w-0"
                                autoFocus />
                        ) : (
                            <span onDoubleClick={() => { setEditingTaskId(task.id); setEditingTaskText(task.text); }}
                                className={`flex-1 text-[11px] font-medium break-words min-w-0 ${task.completed ? 'text-ink-subtle line-through' : 'text-ink-strong'}`}>
                                {task.text || <span className="italic text-ink-dim">empty</span>}
                            </span>
                        )}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => { setEditingTaskId(task.id); setEditingTaskText(task.text); }} className="text-ink-subtle hover:text-ink-strong"><Pencil size={11} /></button>
                            <button onClick={() => updateNote(dateKey, { tasks: tasks.filter(t => t.id !== task.id) })} className="text-ink-subtle hover:text-red-500"><Trash2 size={11} /></button>
                        </div>
                    </motion.div>
                ))}
                {tasks.length === 0 && (
                    <div className="text-[10px] text-ink-subtle text-center py-4 italic">No tasks for today</div>
                )}
            </div>

            {StatusBar}
        </div>
    );

    // ── BACK FACE — Journal (full multi-entry parity with web) ──
    const JournalFace = (
        <div className="relative w-full h-full neo-border shadow-neo rounded-2xl overflow-hidden flex flex-col font-sans bg-surface">
            {BackFaceHeader}

            <div ref={journalRef} className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2 " style={{ overscrollBehavior: 'contain' }}>
                {journalEntries.length === 0 && !isAddingEntry && (
                    <p className="text-center text-[9px] font-black uppercase tracking-widest text-ink-dim py-4">No entries yet</p>
                )}

                {journalEntries.map(entry => {
                    const entryMoodObj = MOODS.find(m => m.value === entry.mood);
                    const EntryMoodIcon = entryMoodObj?.icon;
                    const isEditing = editingEntryId === entry.id;
                    return (
                        <div key={entry.id} className={`border-2 rounded-xl overflow-hidden ${isEditing ? 'border-edge-strong' : 'border-edge'}`}>
                            {isEditing ? (
                                <>
                                    <textarea
                                        value={editingEntryText}
                                        onChange={e => setEditingEntryText(e.target.value)}
                                        autoFocus
                                        className="w-full px-2.5 pt-2.5 pb-1.5 text-[11px] text-ink-strong resize-none outline-none bg-surface leading-relaxed"
                                        style={{ minHeight: 64 }}
                                    />
                                    <div className="flex items-center justify-between gap-1 px-1.5 py-1 border-t border-edge">
                                        {MOODS.map(m => {
                                            const Icon = m.icon;
                                            const sel = editingEntryMood === m.value;
                                            return (
                                                <button key={m.value} onClick={() => setEditingEntryMood(sel ? undefined : m.value)}
                                                    className={`flex-1 flex items-center justify-center py-1 rounded-lg border-2 transition-all ${sel ? 'border-edge-strong' : 'border-transparent'}`}
                                                    style={sel ? { backgroundColor: m.color + '18' } : {}}>
                                                    <Icon size={14} strokeWidth={sel ? 2.5 : 1.8} style={{ color: sel ? m.color : '#d4cfc9' }} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-edge">
                                        <button onClick={() => { setEditingEntryId(null); setEditingEntryText(''); setEditingEntryMood(undefined); }}
                                            className="text-[8px] font-black uppercase tracking-widest text-ink-subtle hover:text-ink-strong transition-colors">Cancel</button>
                                        <button onClick={() => handleUpdateEntry(entry.id)}
                                            className="flex items-center gap-1 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-ink-inverse border-2 border-edge-strong shadow-neo-sm transition-all"
                                            style={{ backgroundColor: theme.primary }}>
                                            <Save size={9} strokeWidth={3} /> Save
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {EntryMoodIcon && entryMoodObj && (
                                        <div className="px-2.5 py-1 border-b border-edge">
                                            <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                                                style={{ backgroundColor: entryMoodObj.color + '18', color: entryMoodObj.color }}>
                                                <EntryMoodIcon size={10} strokeWidth={2.5} />
                                                {entryMoodObj.tooltip}
                                            </span>
                                        </div>
                                    )}
                                    <p className="px-2.5 py-2 text-[11px] text-ink leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                                    <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-edge">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-ink-dim">{formatEntryTime(entry.createdAt)}</span>
                                        <div className="flex items-center gap-2.5">
                                            <button onClick={() => { setEditingEntryId(entry.id); setEditingEntryText(entry.text); setEditingEntryMood(entry.mood); }}
                                                className="text-ink-dim hover:text-ink transition-colors"><Pencil size={11} /></button>
                                            <button onClick={() => handleDeleteEntry(entry.id)}
                                                className="text-ink-dim hover:text-red-500 transition-colors"><Trash2 size={11} /></button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}

                {isAddingEntry ? (
                    <div className="border-2 border-edge-strong rounded-xl overflow-hidden">
                        <textarea
                            value={newEntryText}
                            onChange={e => setNewEntryText(e.target.value)}
                            placeholder="Write about your day…"
                            autoFocus
                            className="w-full px-2.5 pt-2.5 pb-1.5 text-[11px] text-ink-strong placeholder:text-ink-dim resize-none outline-none bg-surface leading-relaxed"
                            style={{ minHeight: 80 }}
                        />
                        <div className="flex items-center justify-between gap-1 px-1.5 py-1 border-t border-edge">
                            {MOODS.map(m => {
                                const Icon = m.icon;
                                const sel = newEntryMood === m.value;
                                return (
                                    <button key={m.value} onClick={() => setNewEntryMood(sel ? undefined : m.value)}
                                        className={`flex-1 flex items-center justify-center py-1 rounded-lg border-2 transition-all ${sel ? 'border-edge-strong' : 'border-transparent'}`}
                                        style={sel ? { backgroundColor: m.color + '18' } : {}}>
                                        <Icon size={14} strokeWidth={sel ? 2.5 : 1.8} style={{ color: sel ? m.color : '#d4cfc9' }} />
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-edge">
                            <button onClick={() => { setIsAddingEntry(false); setNewEntryText(''); setNewEntryMood(undefined); }}
                                className="text-[8px] font-black uppercase tracking-widest text-ink-subtle hover:text-ink-strong transition-colors">Cancel</button>
                            <button onClick={handleAddEntry}
                                className="flex items-center gap-1 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-ink-inverse border-2 border-edge-strong shadow-neo-sm transition-all"
                                style={{ backgroundColor: theme.primary }}>
                                <Save size={9} strokeWidth={3} /> Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAddingEntry(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed text-ink-subtle hover:text-ink transition-colors"
                        style={{ borderColor: theme.primary + '60', color: theme.primary }}
                    >
                        <Plus size={12} strokeWidth={2.5} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Add entry</span>
                    </button>
                )}
            </div>

            {StatusBar}
        </div>
    );

    const flipped = activeTab !== 'habits';

    return (
        <div className={`relative w-full ${cardStyle === 'large' ? 'h-[540px]' : 'h-[460px]'}`} style={{ perspective: '1200px' }}>
            <div
                className="relative w-full h-full transition-transform duration-700"
                style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
                <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', pointerEvents: flipped ? 'none' : 'auto' }}>
                    {FrontFace}
                </div>
                <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: flipped ? 'auto' : 'none' }}>
                    {activeTab === 'tasks' ? TasksFace : JournalFace}
                </div>
            </div>
        </div>
    );
};
