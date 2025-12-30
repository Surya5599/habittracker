import React from 'react';
import { Check, Plus, Share2, Trash2, GripVertical, Pencil } from 'lucide-react';
import { Habit, HabitCompletion, Theme, DailyNote, Task } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { isCompleted as checkCompleted } from '../utils/stats';
import { generateShareCard, shareCard } from '../utils/shareCardGenerator';
import { ShareCustomizationModal, ColorScheme } from './ShareCustomizationModal';

interface WeeklyViewProps {
    habits: Habit[];
    completions: HabitCompletion;
    currentYear: number;
    weekOffset: number;
    theme: Theme;
    toggleCompletion: (habitId: string, dateKey: string) => void;
    notes: DailyNote;
    updateNote: (dateKey: string, tasks: Task[]) => void;
    addHabit: () => void;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
    habits,
    completions,
    currentYear,
    weekOffset,
    theme,
    toggleCompletion,
    notes,
    updateNote,
    addHabit,
}) => {
    const [shareModalOpen, setShareModalOpen] = React.useState(false);
    const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
    const [editingTaskText, setEditingTaskText] = React.useState('');
    const taskInputRef = React.useRef<HTMLInputElement>(null);
    const [shareData, setShareData] = React.useState<{
        date: Date;
        dayName: string;
        dateString: string;
        completedCount: number;
        totalCount: number;
        progress: number;
    } | null>(null);

    // Calculate the dates for the current week (starting Monday)
    const getWeekDates = () => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7); // adjust when day is sunday and add offset
        const monday = new Date(today.getFullYear(), today.getMonth(), diff);

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            return date;
        });
    };

    const weekDates = getWeekDates();

    const getDayProgress = (date: Date) => {
        if (habits.length === 0) return 0;
        const monthIdx = date.getMonth();
        const day = date.getDate();
        const year = date.getFullYear();
        let doneCount = 0;
        habits.forEach(h => {
            if (checkCompleted(h.id, day, completions, monthIdx, year)) {
                doneCount++;
            }
        });
        return (doneCount / habits.length) * 100;
    };

    const handleShareClick = (date: Date, dayName: string, dateString: string, completedCount: number, totalCount: number, progress: number) => {
        setShareData({ date, dayName, dateString, completedCount, totalCount, progress });
        setShareModalOpen(true);
    };

    const handleShareConfirm = async (colorScheme: ColorScheme, message: string) => {
        if (!shareData) return;

        try {
            const blob = await generateShareCard({
                dayName: shareData.dayName,
                dateString: shareData.dateString,
                completedCount: shareData.completedCount,
                totalCount: shareData.totalCount,
                progress: shareData.progress,
                theme,
                colorScheme,
                message
            });
            await shareCard(blob, shareData.dayName);
        } catch (error) {
            console.error('Failed to share:', error);
        }
    };

    const handleFinishEditing = (taskId: string, dateKey: string) => {
        const currentTasks = (notes[dateKey] as Task[]) || [];
        const task = currentTasks.find(t => t.id === taskId);
        if (!task) {
            setEditingTaskId(null);
            return;
        }

        const trimmedText = editingTaskText.trim();

        // 1. Remove if empty
        if (!trimmedText) {
            updateNote(dateKey, currentTasks.filter(t => t.id !== taskId));
            setEditingTaskId(null);
            return;
        }

        // 2. Check for duplicates (exclude self)
        const isDuplicate = currentTasks.some(t =>
            t.id !== taskId &&
            t.text.trim().toLowerCase() === trimmedText.toLowerCase()
        );

        if (isDuplicate) {
            // If it was a new item (currently empty in store), remove it
            if (!task.text) {
                updateNote(dateKey, currentTasks.filter(t => t.id !== taskId));
            }
            // If it was existing, we effectively revert by not updating 'notes'
            // just clear validation state
            setEditingTaskId(null);
            return;
        }

        // 3. Valid update
        const newTasks = currentTasks.map(t =>
            t.id === taskId ? { ...t, text: trimmedText } : t
        );
        updateNote(dateKey, newTasks);
        setEditingTaskId(null);
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {weekDates.map((date, index) => {
                    const dayName = DAYS_OF_WEEK[date.getDay()];
                    const dateString = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
                    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    const progress = getDayProgress(date);
                    const isToday = date.toDateString() === new Date().toDateString();

                    const completedCount = habits.reduce((acc, h) =>
                        acc + (checkCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear()) ? 1 : 0), 0);
                    const totalCount = habits.length;

                    return (
                        <div key={dateKey} className={`border-[2px] border-black bg-white flex flex-col overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 ${isToday ? 'ring-2 ring-black ring-offset-2' : ''}`}>
                            {/* Header */}
                            <div className="p-3 text-center border-b-[2px] border-black" style={{ backgroundColor: isToday ? theme.secondary : theme.primary }}>
                                <h3 className="text-white font-black uppercase tracking-tighter text-lg leading-tight">{dayName}</h3>
                                <p className="text-white/80 font-bold text-[10px] tracking-widest">{dateString}</p>
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
                                            className="transition-all duration-500 ease-out"
                                            style={{ color: isToday ? theme.secondary : theme.primary }}
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
                                            <div key={habit.id} className="flex items-center justify-between group">
                                                <span className={`text-[11px] font-bold truncate flex-1 ${done ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                                                    {habit.name || 'Untitled'}
                                                </span>
                                                <button
                                                    onClick={() => toggleCompletion(habit.id, dateKey)}
                                                    className={`w-4 h-4 border-2 border-black flex items-center justify-center transition-all ${done ? 'bg-black text-white' : 'bg-white hover:bg-stone-100'}`}
                                                >
                                                    {done && <Check size={10} strokeWidth={4} />}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {completedCount === totalCount && totalCount > 0 ? (
                                <div className="border-t border-black flex-shrink-0">
                                    <button
                                        onClick={() => handleShareClick(date, dayName, dateString, completedCount, totalCount, progress)}
                                        className="w-full p-3 bg-black text-white font-black uppercase tracking-widest text-[11px] hover:bg-stone-800 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <Share2 size={14} className="group-hover:scale-110 transition-transform" />
                                        Share Achievement
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 text-center text-[9px] font-black uppercase tracking-tight border-t border-black flex-shrink-0">
                                    <div className="p-1 px-2 border-r border-black" style={{ backgroundColor: (isToday ? theme.secondary : theme.primary) + '20' }}>
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
                                    if (sourceDateKey === dateKey) return; // Dropped on same day

                                    const sourceTasks = (notes[sourceDateKey] as Task[]) || [];
                                    const targetTasks = (notes[dateKey] as Task[]) || [];

                                    const taskToMove = sourceTasks.find(t => t.id === taskId);
                                    if (!taskToMove) return;

                                    // Remove from source and add to target
                                    updateNote(sourceDateKey, sourceTasks.filter(t => t.id !== taskId));
                                    updateNote(dateKey, [...targetTasks, taskToMove]);
                                }}
                            >
                                <div className="p-2 bg-stone-100 border-b-2 border-black text-[9px] font-black uppercase tracking-widest text-stone-500 flex items-center justify-between sticky top-0 z-10 flex-shrink-0">
                                    <span>Tasks</span>
                                    <button
                                        onClick={() => {
                                            const currentTasks = (notes[dateKey] as Task[]) || [];
                                            const newTask: Task = { id: crypto.randomUUID(), text: '', completed: false };
                                            updateNote(dateKey, [...currentTasks, newTask]);
                                            setEditingTaskId(newTask.id);
                                            setEditingTaskText('');
                                        }}
                                        className="hover:bg-stone-200 p-0.5 rounded transition-colors"
                                    >
                                        <Plus size={12} strokeWidth={3} />
                                    </button>
                                </div>
                                <div className="p-2 space-y-2 overflow-y-auto max-h-[160px] pr-1">
                                    {((notes[dateKey] as Task[]) || []).map((task) => (
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
                                                onClick={() => {
                                                    const currentTasks = (notes[dateKey] as Task[]) || [];
                                                    const newTasks = currentTasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t);
                                                    updateNote(dateKey, newTasks);
                                                }}
                                                className={`mt-0.5 w-3 h-3 border border-black flex items-center justify-center transition-all flex-shrink-0 ${task.completed ? 'bg-black text-white' : 'bg-white hover:bg-stone-100'}`}
                                            >
                                                {task.completed && <Check size={8} strokeWidth={4} />}
                                            </button>

                                            {editingTaskId === task.id ? (
                                                <input
                                                    ref={taskInputRef}
                                                    type="text"
                                                    value={editingTaskText}
                                                    onChange={(e) => setEditingTaskText(e.target.value)}
                                                    onBlur={() => handleFinishEditing(task.id, dateKey)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleFinishEditing(task.id, dateKey);
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
                                                        const currentTasks = (notes[dateKey] as Task[]) || [];
                                                        const newTasks = currentTasks.filter(t => t.id !== task.id);
                                                        updateNote(dateKey, newTasks);
                                                    }}
                                                    className="text-stone-400 hover:text-red-500 transition-colors"
                                                    title="Delete task"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!notes[dateKey] || (notes[dateKey] as Task[]).length === 0) && (
                                        <div className="text-[9px] text-stone-300 text-center py-2 italic cursor-pointer" onClick={() => {
                                            const currentTasks = (notes[dateKey] as Task[]) || [];
                                            const newTask: Task = { id: crypto.randomUUID(), text: '', completed: false };
                                            updateNote(dateKey, [...currentTasks, newTask]);
                                            setEditingTaskId(newTask.id);
                                            setEditingTaskText('');
                                        }}>
                                            Click + to add a task
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <ShareCustomizationModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                onShare={handleShareConfirm}
            />
        </>
    );
};
