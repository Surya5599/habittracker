import React, { useState, useRef, useEffect } from 'react';
import { Check, Plus, Share2, Trash2, Pencil, ChevronLeft, ChevronRight, BookOpen, X, Save, Meh, Frown, Smile, Laugh, Star, Angry } from 'lucide-react';
import { Habit, HabitCompletion, Theme, DailyNote, Task, DayData } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { isCompleted as checkCompleted } from '../utils/stats';
import { generateUUID } from '../utils/uuid';

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
    defaultFlipped?: boolean;
}

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
    defaultFlipped = false,
}) => {
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingTaskText, setEditingTaskText] = useState('');
    const [isFlipped, setIsFlipped] = useState(defaultFlipped);
    const taskInputRef = useRef<HTMLInputElement>(null);

    const dayName = DAYS_OF_WEEK[date.getDay()];
    const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isToday = date.toDateString() === new Date().toDateString();

    const getDayData = (): DayData => {
        const data = notes[dateKey];
        if (!data) return { tasks: [] };
        if (Array.isArray(data)) return { tasks: data };
        if ('tasks' in data) return data;
        return { tasks: [] }; // Fallback
    };

    const dayData = getDayData();

    // Local state for Journal/Mood (synced with date transition)
    const [mood, setMood] = useState<number | undefined>(dayData.mood);
    const [journal, setJournal] = useState(dayData.journal || '');

    useEffect(() => {
        setMood(dayData.mood);
        setJournal(dayData.journal || '');
    }, [dateKey, dayData.mood, dayData.journal]);

    const handleSaveJournal = () => {
        updateNote(dateKey, { mood, journal });
        setIsFlipped(false);
    };

    const getDayProgress = (d: Date) => {
        if (habits.length === 0) return 0;
        const monthIdx = d.getMonth();
        const day = d.getDate();
        const year = d.getFullYear();
        let doneCount = 0;
        habits.forEach(h => {
            if (checkCompleted(h.id, day, completions, monthIdx, year)) {
                doneCount++;
            }
        });
        return (doneCount / habits.length) * 100;
    };

    const actualProgress = getDayProgress(date);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setProgress(actualProgress);
        }, 0);
        return () => clearTimeout(timer);
    }, [actualProgress]);

    const completedCount = habits.reduce((acc, h) =>
        acc + (checkCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear()) ? 1 : 0), 0);
    const totalCount = habits.length;

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

    const MOODS = [
        { value: 1, icon: Angry, label: 'Very Bad', color: '#ef4444', tooltip: 'Very Bad' },
        { value: 2, icon: Frown, label: 'Bad', color: '#f97316', tooltip: 'Bad' },
        { value: 3, icon: Meh, label: 'Neutral', color: '#eab308', tooltip: 'Neutral' },
        { value: 4, icon: Smile, label: 'Good', color: '#3b82f6', tooltip: 'Good' },
        { value: 5, icon: Laugh, label: 'Very Good', color: '#10b981', tooltip: 'Very Good' },
    ];

    return (
        <div className="relative w-full h-full group" style={{ perspective: '1000px' }}>
            <div
                className={`relative w-full h-full transition-transform duration-700`}
                style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
                {/* --- FRONT FACE --- */}
                <div
                    className={`relative w-full h-full bg-white neo-border neo-shadow rounded-2xl overflow-hidden flex flex-col font-sans ${isToday ? 'ring-2 ring-black ring-offset-2' : ''}`}
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    {/* Header */}
                    <div className="p-3 text-center border-b-[2px] border-black relative" style={{ backgroundColor: isToday ? theme.primary : theme.secondary }}>
                        {onPrev && (
                            <button
                                onClick={onPrev}
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-white hover:bg-white/20 rounded transition-colors"
                            >
                                <ChevronLeft size={20} strokeWidth={3} />
                            </button>
                        )}

                        <h3 className="text-white font-black uppercase tracking-tighter text-lg leading-tight">{dayName}</h3>
                        <p className="text-white/80 font-bold text-[10px] tracking-widest">{dateString}</p>

                        {onNext && (
                            <button
                                onClick={onNext}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white hover:bg-white/20 rounded transition-colors"
                            >
                                <ChevronRight size={20} strokeWidth={3} />
                            </button>
                        )}
                    </div>

                    {/* Progress Circle */}
                    <div className="p-4 flex flex-col items-center justify-center border-b border-stone-100">
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

                    {/* Daily Habits List */}
                    <div className="p-3 bg-stone-50/50 flex flex-col">
                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-black/5 flex-shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Daily Habits</span>
                        </div>
                        <div className="space-y-1 overflow-y-auto max-h-[150px] pr-1">
                            {habits.map(habit => {
                                const done = checkCompleted(habit.id, date.getDate(), completions, date.getMonth(), date.getFullYear());
                                return (
                                    <div
                                        key={habit.id}
                                        onClick={() => toggleCompletion(habit.id, dateKey)}
                                        className="flex items-center justify-between group cursor-pointer hover:bg-black/5 rounded p-1 -mx-1 transition-colors"
                                    >
                                        <span className={`text-[11px] font-bold truncate flex-1 ${done ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                                            {habit.name || 'Untitled'}
                                        </span>
                                        <div
                                            className={`w-4 h-4 border-2 border-black flex items-center justify-center transition-all ${done ? 'bg-black text-white' : 'bg-white'}`}
                                        >
                                            {done && <Check size={10} strokeWidth={4} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {completedCount === totalCount && totalCount > 0 ? (
                        <div className="border-t border-black flex-shrink-0">
                            <button
                                onClick={() => onShareClick({ date, dayName, dateString, completedCount, totalCount, progress: actualProgress })}
                                className="w-full p-3 bg-black text-white font-black uppercase tracking-widest text-[11px] hover:bg-stone-800 transition-all flex items-center justify-center gap-2 group"
                            >
                                <Share2 size={14} className="group-hover:scale-110 transition-transform" />
                                Share Achievement
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 text-center text-[9px] font-black uppercase tracking-tight border-t border-black flex-shrink-0">
                            <div className="p-1 px-2 border-r border-black" style={{ backgroundColor: (isToday ? theme.primary : theme.secondary) + '20' }}>
                                <span className="text-stone-500 block">Habits Maintained</span>
                                <span className="text-lg leading-none">{completedCount}</span>
                            </div>
                            <div className="p-1 px-2" style={{ backgroundColor: '#f0f0f0' }}>
                                <span className="text-stone-500 block">To Build</span>
                                <span className="text-lg leading-none">{totalCount - completedCount}</span>
                            </div>
                        </div>
                    )}

                    {/* Tasks */}
                    <div
                        className="border-t-2 border-black flex flex-col min-h-[90px]"
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
                        <div className="p-2 bg-stone-100 border-b-2 border-black text-[9px] font-black uppercase tracking-widest text-stone-500 flex items-center justify-center relative flex-shrink-0 group/header">
                            <span>Tasks</span>

                            {/* Journal Trigger */}
                            {(() => {
                                const activeMood = MOODS.find(m => m.value === dayData.mood);
                                return (
                                    <button
                                        onClick={() => setIsFlipped(true)}
                                        className={`absolute left-2 p-1.5 rounded transition-colors ${activeMood ? '' : (dayData.journal ? 'text-black bg-stone-200' : 'text-stone-400 hover:text-black hover:bg-stone-200')}`}
                                        title={activeMood ? activeMood.tooltip : "Daily Journal & Mood"}
                                    >
                                        {activeMood ? <activeMood.icon size={16} fill={activeMood.color} className="text-stone-700" /> : <BookOpen size={12} strokeWidth={3} />}
                                    </button>
                                );
                            })()}

                            <button
                                onClick={() => {
                                    const currentTasks = dayData.tasks || [];
                                    const newTask: Task = { id: generateUUID(), text: '', completed: false };
                                    updateNote(dateKey, { tasks: [...currentTasks, newTask] });
                                    setEditingTaskId(newTask.id);
                                    setEditingTaskText('');
                                }}
                                className="absolute right-2 hover:bg-stone-200 p-1.5 rounded transition-colors"
                            >
                                <Plus size={12} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="p-2 space-y-2 overflow-y-auto max-h-[160px] pr-1">
                            {(dayData.tasks || []).map((task) => (
                                <div
                                    key={task.id}
                                    draggable={editingTaskId !== task.id}
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id, sourceDateKey: dateKey }));
                                        e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    className={`flex items-start gap-2 group bg-white border border-transparent hover:border-stone-200 p-1 rounded shadow-sm hover:shadow-md transition-all ${editingTaskId === task.id ? 'ring-2 ring-black' : 'cursor-move'}`}
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
                                                if (e.key === 'Enter') {
                                                    handleFinishEditing(task.id);
                                                }
                                            }}
                                            className="w-full text-[10px] font-medium bg-transparent outline-none leading-tight border-none p-0 focus:ring-0 text-stone-800"
                                            autoFocus
                                        />
                                    ) : (
                                        <span
                                            className={`flex-1 text-[10px] font-medium leading-tight break-all ${task.completed ? 'text-stone-400 line-through' : 'text-stone-800'}`}
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
                                            title="Edit task"
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
                                            title="Delete task"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!dayData.tasks || dayData.tasks.length === 0) && (
                                <div className="text-[9px] text-stone-300 text-center py-2 italic cursor-pointer" onClick={() => {
                                    const currentTasks = dayData.tasks || [];
                                    const newTask: Task = { id: generateUUID(), text: '', completed: false };
                                    updateNote(dateKey, { tasks: [...currentTasks, newTask] });
                                    setEditingTaskId(newTask.id);
                                    setEditingTaskText('');
                                }}>
                                    Click + to add a task
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- BACK FACE (JOURNAL) --- */}
                <div
                    className={`absolute inset-0 w-full h-full bg-white neo-border neo-shadow rounded-2xl overflow-hidden flex flex-col font-sans ${isToday ? 'ring-2 ring-black ring-offset-2' : ''}`}
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    {/* Header (Matching style) */}
                    <div className="p-3 text-center border-b-[2px] border-black relative" style={{ backgroundColor: isToday ? theme.primary : theme.secondary }}>
                        <button
                            onClick={handleSaveJournal}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-white hover:bg-white/20 rounded transition-colors"
                            title="Save & Back"
                        >
                            <ChevronLeft size={20} strokeWidth={3} />
                        </button>

                        <h3 className="text-white font-black uppercase tracking-tighter text-lg leading-tight">Journal</h3>
                        <p className="text-white/80 font-bold text-[10px] tracking-widest">{dateString}</p>
                    </div>

                    <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
                        {/* Mood Selector */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block text-center">Mood</label>
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
                                            <div className={`p-1.5 rounded-full transition-colors ${isSelected ? 'text-white' : 'text-stone-300'}`}
                                                style={{ backgroundColor: isSelected ? m.color : 'transparent' }}>
                                                <Icon size={18} strokeWidth={isSelected ? 2.5 : 2} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Journal Textarea */}
                        <div className="flex-1 flex flex-col gap-2 min-h-0">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block text-center">Notes</label>
                            <textarea
                                value={journal}
                                onChange={(e) => setJournal(e.target.value)}
                                placeholder="Write regarding today..."
                                className="w-full flex-1 p-3 bg-stone-50 border-2 border-transparent focus:border-black rounded-xl resize-none text-xs leading-relaxed placeholder:text-stone-300 outline-none transition-all font-medium"
                            />
                        </div>

                        <div className="flex-shrink-0">
                            <button
                                onClick={handleSaveJournal}
                                className="w-full py-2 bg-black text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-stone-800 transition-transform active:scale-95 flex items-center justify-center gap-2"
                                style={{ backgroundColor: theme.primary }}
                            >
                                <Save size={12} />
                                Save Entry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
