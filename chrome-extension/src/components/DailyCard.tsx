import React, { useState, useRef, useEffect } from 'react';
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

// Read the most recent entry's text from string | JournalEntry[].
// Showing only the latest entry preserves the multi-entry structure on web
// while giving the extension a single editable text field.
const getJournalText = (journal: string | JournalEntry[] | undefined): string => {
    if (!journal) return '';
    if (typeof journal === 'string') return journal;
    if (journal.length === 0) return '';
    return journal[journal.length - 1].text;
};

// Build the value to save: update the last entry in place (preserving earlier
// entries written from web), or create a fresh single-entry array.
const buildJournalUpdate = (
    existing: string | JournalEntry[] | undefined,
    newText: string,
    newId: string
): JournalEntry[] => {
    if (!existing || typeof existing === 'string' || existing.length === 0) {
        return [{ id: newId, text: newText, createdAt: Date.now() }];
    }
    const entries = [...existing];
    entries[entries.length - 1] = { ...entries[entries.length - 1], text: newText };
    return entries;
};

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
    const [journalDraft, setJournalDraft] = useState('');
    const [moodDraft, setMoodDraft] = useState<number | undefined>(undefined);
    const taskInputRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        setJournalDraft(getJournalText(dayData.journal));
        setMoodDraft(dayData.mood);
    }, [dateKey]);

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

    // Journal
    const activeMood = MOODS.find(m => m.value === dayData.mood);
    const hasJournalEntry = !!(getJournalText(dayData.journal).trim());

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

    const handleSaveJournal = () => {
        updateNote(dateKey, {
            mood: moodDraft,
            journal: buildJournalUpdate(dayData.journal, journalDraft, generateUUID()),
        });
    };

    const addTask = () => {
        const newTask: Task = { id: generateUUID(), text: '', completed: false };
        updateNote(dateKey, { tasks: [...tasks, newTask] });
        setEditingTaskId(newTask.id);
        setEditingTaskText('');
    };

    // Smooth scroll for content area
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const handleWheel = (e: WheelEvent) => {
            if (el.scrollHeight <= el.clientHeight + 1) return;
            e.preventDefault();
            e.stopPropagation();
            el.scrollTop += e.deltaY;
        };
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
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
                <span className="text-[9px] font-black text-white">{Math.round(progress)}%</span>
            </div>
        </div>
    );

    // ── Large progress ring (large: below header) ──
    const LargeRing = (
        <div className="flex justify-center pt-3 pb-2 bg-white border-b border-stone-100 flex-shrink-0">
            <div className="relative w-[110px] h-[110px]">
                <svg className="w-full h-full -rotate-90">
                    <circle cx="55" cy="55" r="44" stroke="rgba(0,0,0,0.06)" strokeWidth="10" fill="transparent" />
                    <circle cx="55" cy="55" r="44" stroke={theme.secondary} strokeWidth="10" fill="transparent"
                        strokeDasharray={2 * Math.PI * 44}
                        strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
                        strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-stone-800">{Math.round(progress)}%</span>
                </div>
            </div>
        </div>
    );

    // ── Status / Tab row pinned at bottom ──
    const StatusBar = (
        <div className="flex flex-col border-t-[2px] border-black bg-white flex-shrink-0">
        <div className="grid grid-cols-3">
            <button
                onClick={() => setActiveTab('habits')}
                className={`py-2 px-1 flex flex-col items-center justify-center border-r border-black transition-colors ${activeTab === 'habits' ? 'bg-stone-100' : 'hover:bg-stone-50'}`}
            >
                <span className="text-[8px] font-black uppercase tracking-wider text-stone-500">My Habits</span>
                <span className="text-[10px] font-black text-stone-700 mt-0.5">{completedCount}/{totalCount}</span>
            </button>
            <button
                onClick={() => setActiveTab('tasks')}
                className={`py-2 px-1 flex flex-col items-center justify-center border-r border-black transition-colors ${activeTab === 'tasks' ? 'bg-stone-100' : 'hover:bg-stone-50'}`}
            >
                <span className="text-[8px] font-black uppercase tracking-wider text-stone-500">Tasks</span>
                <span className="text-[10px] font-black text-stone-700 mt-0.5">
                    {tasks.length > 0 ? `${completedTasksCount}/${tasks.length}` : '+'}
                </span>
            </button>
            <button
                onClick={() => setActiveTab('journal')}
                className={`py-2 px-1 flex flex-col items-center justify-center transition-colors ${activeTab === 'journal' ? 'bg-stone-100' : 'hover:bg-stone-50'}`}
            >
                <span className="text-[8px] font-black uppercase tracking-wider text-stone-500">Journal</span>
                <div className="mt-0.5">
                    {activeMood
                        ? <activeMood.icon size={14} strokeWidth={2.5} style={{ color: activeMood.color }} />
                        : <BookOpen size={14} strokeWidth={2.5} className={hasJournalEntry ? 'text-green-600' : 'text-stone-400'} />
                    }
                </div>
            </button>
        </div>
        <div className="flex justify-center py-1 border-t border-stone-100">
            <a href="https://habicard.com/privacy" target="_blank" rel="noopener noreferrer"
                className="text-[8px] text-stone-300 hover:text-stone-500 uppercase tracking-widest font-bold transition-colors">
                Privacy Policy
            </a>
        </div>
        </div>
    );

    // ── Habits view ──
    const HabitsView = (
        <>
            <div className="flex-1 min-h-0 overflow-y-auto" ref={contentRef} style={{ overscrollBehavior: 'contain' }}>
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
                                className="flex items-center justify-between cursor-pointer hover:bg-black/5 rounded px-1 py-1.5 -mx-1 transition-colors">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                                    <span className={`text-[11px] font-bold truncate ${done ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                                        {habit.name || 'Untitled'}
                                    </span>
                                    {habit.weeklyTarget && (
                                        <span className={`text-[8px] px-1 border font-black flex-shrink-0 ${goalMet ? 'bg-black text-white border-black' : 'bg-stone-50 text-stone-400 border-stone-200'}`}>
                                            {weekCount}/{habit.weeklyTarget}wk
                                        </span>
                                    )}
                                </div>
                                <div className={`w-4 h-4 border-2 border-black flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-black text-white' : 'bg-white'}`}>
                                    {done && <Check size={10} strokeWidth={4} />}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="text-[9px] text-stone-300 text-center py-4 italic">No habits due today</div>
                    )}
                </div>
            </div>

            {/* Share strip — only when all done */}
            {totalCount > 0 && completedCount === totalCount && (
                <button
                    onClick={() => onShareClick({ date, dayName, dateString, completedCount, totalCount, progress: actualProgress })}
                    className="w-full p-2.5 bg-black text-white font-black uppercase tracking-widest text-[10px] hover:bg-stone-800 transition-all flex items-center justify-center gap-2 border-t border-black flex-shrink-0"
                >
                    <Share2 size={12} />
                    Share Achievement
                </button>
            )}
        </>
    );

    // ── Tasks view ──
    const TasksView = (
        <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5" style={{ overscrollBehavior: 'contain' }}>
            <div onClick={addTask}
                className="flex items-center gap-2 p-1.5 border border-dashed border-stone-200 rounded cursor-pointer hover:border-stone-400 transition-colors">
                <Plus size={10} strokeWidth={3} className="text-stone-300 flex-shrink-0" />
                <span className="text-[10px] text-stone-300 font-medium">Add a task...</span>
            </div>
            {tasks.map(task => (
                <div key={task.id}
                    className={`flex items-start gap-2 group bg-white border p-1.5 rounded transition-all ${editingTaskId === task.id ? 'border-black' : 'border-stone-100 hover:border-stone-200'}`}>
                    <button onClick={() => updateNote(dateKey, { tasks: tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t) })}
                        className="flex-shrink-0 mt-0.5">
                        <div className={`w-3 h-3 border border-black flex items-center justify-center transition-all ${task.completed ? 'bg-black text-white' : 'bg-white hover:bg-stone-100'}`}>
                            {task.completed && <Check size={8} strokeWidth={4} />}
                        </div>
                    </button>
                    {editingTaskId === task.id ? (
                        <input ref={taskInputRef} type="text" value={editingTaskText}
                            onChange={(e) => setEditingTaskText(e.target.value)}
                            onBlur={() => handleFinishEditing(task.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleFinishEditing(task.id); }}
                            className="flex-1 text-[10px] font-medium bg-transparent outline-none text-stone-800 min-w-0"
                            autoFocus />
                    ) : (
                        <span onDoubleClick={() => { setEditingTaskId(task.id); setEditingTaskText(task.text); }}
                            className={`flex-1 text-[10px] font-medium break-words min-w-0 ${task.completed ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                            {task.text || <span className="italic text-stone-300">empty</span>}
                        </span>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => { setEditingTaskId(task.id); setEditingTaskText(task.text); }} className="text-stone-400 hover:text-black"><Pencil size={9} /></button>
                        <button onClick={() => updateNote(dateKey, { tasks: tasks.filter(t => t.id !== task.id) })} className="text-stone-400 hover:text-red-500"><Trash2 size={9} /></button>
                    </div>
                </div>
            ))}
        </div>
    );

    // ── Journal view ──
    const JournalView = (
        <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 p-3" style={{ overscrollBehavior: 'contain' }}>
            <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 block mb-1.5">Mood</label>
                <div className="grid grid-cols-5 gap-1">
                    {MOODS.map(m => {
                        const isSelected = moodDraft === m.value;
                        const Icon = m.icon;
                        return (
                            <button key={m.value} onClick={() => setMoodDraft(isSelected ? undefined : m.value)}
                                title={m.tooltip}
                                className={`flex items-center justify-center p-2 rounded-lg transition-all ${isSelected ? 'scale-110' : 'hover:bg-stone-50 hover:scale-105'}`}
                                style={{ backgroundColor: isSelected ? m.color + '25' : undefined }}>
                                <Icon size={18} strokeWidth={isSelected ? 2.5 : 2}
                                    style={{ color: isSelected ? m.color : '#d1d5db' }} />
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 block mb-1.5">Notes</label>
                <textarea value={journalDraft} onChange={(e) => setJournalDraft(e.target.value)}
                    placeholder="Write about today..."
                    className="flex-1 min-h-[80px] p-2.5 bg-stone-50 border-2 border-transparent focus:border-black rounded-xl resize-none text-[11px] leading-relaxed placeholder:text-stone-300 outline-none font-medium" />
            </div>
            <button onClick={handleSaveJournal}
                className="w-full py-2 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 flex-shrink-0 hover:opacity-80 transition-opacity"
                style={{ backgroundColor: theme.primary }}>
                <Save size={11} /> Save Entry
            </button>
        </div>
    );

    return (
        <div className={`relative w-full bg-white overflow-hidden flex flex-col font-sans border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${cardStyle === 'large' ? 'h-[540px]' : 'h-[460px]'}`}>

            {/* Header */}
            <div className="border-b-[2px] border-black flex-shrink-0"
                style={{ backgroundColor: isToday ? theme.primary : theme.secondary }}>
                <div className={`w-full grid items-center py-2 ${cardStyle === 'compact'
                    ? 'grid-cols-[28px_minmax(0,1fr)_48px_28px]'
                    : 'grid-cols-[28px_minmax(0,1fr)_28px]'}`}>
                    <button onClick={onPrev} className="flex items-center justify-center p-1 text-white hover:bg-white/20 rounded transition-colors">
                        <ChevronLeft size={18} strokeWidth={3} />
                    </button>

                    <div className="text-left pl-1 min-w-0 overflow-hidden">
                        <h3 className="text-white font-black tracking-tight text-sm leading-tight truncate">{dayName}</h3>
                        <div className="relative">
                            <button onClick={() => setShowDatePicker(!showDatePicker)}
                                className="text-white/80 font-bold text-[9px] tracking-wide hover:text-white transition-colors truncate block">
                                {dateString}
                            </button>
                            {onDateSelect && (
                                <WeekPicker isOpen={showDatePicker} onClose={() => setShowDatePicker(false)}
                                    currentDate={date} onWeekSelect={onDateSelect} themePrimary={theme.primary} />
                            )}
                        </div>
                    </div>

                    {cardStyle === 'compact' && SmallRing}

                    <button onClick={onNext} className="flex items-center justify-center p-1 text-white hover:bg-white/20 rounded transition-colors">
                        <ChevronRight size={18} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Action strip — analytics, habits, settings */}
            {headerActions && (
                <div className="flex items-center justify-end gap-1 px-2 py-1 border-b border-black/10 flex-shrink-0"
                    style={{ backgroundColor: (isToday ? theme.primary : theme.secondary) + 'dd' }}>
                    {headerActions}
                </div>
            )}

            {/* Large ring — only in large mode */}
            {cardStyle === 'large' && LargeRing}

            {/* Content — flex-1, switches by active tab */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {activeTab === 'habits'  && HabitsView}
                {activeTab === 'tasks'   && TasksView}
                {activeTab === 'journal' && JournalView}
            </div>

            {/* Status bar — pinned at bottom */}
            {StatusBar}
        </div>
    );
};
