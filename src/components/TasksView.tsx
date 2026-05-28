import React, { useState, useMemo, useRef } from 'react';
import { X, Plus, CalendarPlus, Check, Search, Inbox } from 'lucide-react';
import { DailyNote, DayData, Task, Theme } from '../types';

interface TaskWithSource extends Task {
    fromDate: string | null;
}

interface TasksViewProps {
    notes: DailyNote;
    updateNote: (dateKey: string, data: Partial<DayData>) => void;
    theme: Theme;
    onClose: () => void;
}

const TaskRow: React.FC<{
    task: TaskWithSource;
    theme: Theme;
    onComplete: (task: TaskWithSource) => void;
    onDelete: (task: TaskWithSource) => void;
    onAssign: () => void;
}> = ({ task, theme, onComplete, onDelete, onAssign }) => {
    const [done, setDone] = useState(false);

    const handleComplete = () => {
        setDone(true);
        setTimeout(() => onComplete(task), 350);
    };

    return (
        <div className={`flex items-center gap-3 py-3.5 transition-opacity duration-300 ${done ? 'opacity-0' : 'opacity-100'}`}>
            <button
                onClick={handleComplete}
                className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                style={{ borderColor: theme.primary, backgroundColor: done ? theme.primary : undefined }}
                title="Mark done"
            >
                {done && <Check size={10} strokeWidth={3} color="white" />}
            </button>
            <span className={`flex-1 text-sm font-medium text-stone-800 leading-snug ${done ? 'line-through text-stone-400' : ''}`}>
                {task.text}
            </span>
            <button
                onClick={onAssign}
                className="p-1.5 rounded-lg transition-colors hover:opacity-80 shrink-0"
                style={{ backgroundColor: theme.primary + '18' }}
                title="Assign to date"
            >
                <CalendarPlus size={13} style={{ color: theme.primary }} />
            </button>
            <button
                onClick={() => onDelete(task)}
                className="p-1 text-stone-300 hover:text-stone-500 transition-colors shrink-0"
                title="Delete"
            >
                <X size={14} />
            </button>
        </div>
    );
};

export const TasksView: React.FC<TasksViewProps> = ({ notes, updateNote, theme, onClose }) => {
    const [newText, setNewText] = useState('');
    const [schedulingTask, setSchedulingTask] = useState<TaskWithSource | null>(null);
    const [assignDate, setAssignDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const todayStr = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }, []);

    const backlogTasks = notes['__backlog__']?.tasks || [];

    const overdueTasks = useMemo(() => {
        const result: TaskWithSource[] = [];
        (Object.entries(notes) as [string, DayData][]).forEach(([key, data]) => {
            if (key === '__backlog__' || key >= todayStr) return;
            (data?.tasks || []).filter(t => !t.completed).forEach(t => {
                result.push({ ...t, fromDate: key });
            });
        });
        return result.sort((a, b) => (b.fromDate || '').localeCompare(a.fromDate || ''));
    }, [notes, todayStr]);

    const overdueGroups = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const groups: Record<string, TaskWithSource[]> = {};
        overdueTasks
            .filter(t => !q || t.text.toLowerCase().includes(q))
            .forEach(task => {
                const key = task.fromDate!;
                if (!groups[key]) groups[key] = [];
                groups[key].push(task);
            });
        return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
    }, [overdueTasks, searchQuery]);

    const manualBacklog = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const seen = new Set<string>();
        return backlogTasks.filter(t => {
            if (t.completed || seen.has(t.id)) return false;
            seen.add(t.id);
            if (q && !t.text.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [backlogTasks, searchQuery]);

    const totalCount = overdueTasks.length + (backlogTasks.filter(t => !t.completed).length);

    const handleAddTask = () => {
        if (!newText.trim()) return;
        const task: Task = { id: Date.now().toString(), text: newText.trim(), completed: false };
        updateNote('__backlog__', { tasks: [...backlogTasks, task] });
        setNewText('');
        inputRef.current?.focus();
    };

    const handleComplete = (task: TaskWithSource) => {
        if (task.fromDate) {
            const dateTasks = notes[task.fromDate]?.tasks || [];
            updateNote(task.fromDate, {
                tasks: dateTasks.map(t => t.id === task.id ? { ...t, completed: true } : t),
            });
        } else {
            updateNote('__backlog__', {
                tasks: backlogTasks.map(t => t.id === task.id ? { ...t, completed: true } : t),
            });
        }
    };

    const handleDelete = (task: TaskWithSource) => {
        if (task.fromDate) {
            const dateTasks = notes[task.fromDate]?.tasks || [];
            updateNote(task.fromDate, { tasks: dateTasks.filter(t => t.id !== task.id) });
        } else {
            updateNote('__backlog__', { tasks: backlogTasks.filter(t => t.id !== task.id) });
        }
    };

    const handleMoveToDate = () => {
        if (!schedulingTask || !assignDate) return;
        const existing = notes[assignDate]?.tasks || [];
        const { fromDate, ...taskData } = schedulingTask;
        updateNote(assignDate, { tasks: [...existing, { ...taskData, completed: false }] });
        if (fromDate) {
            const dateTasks = notes[fromDate]?.tasks || [];
            updateNote(fromDate, { tasks: dateTasks.filter(t => t.id !== schedulingTask.id) });
        } else {
            updateNote('__backlog__', { tasks: backlogTasks.filter(t => t.id !== schedulingTask.id) });
        }
        setSchedulingTask(null);
        setAssignDate('');
    };

    const toggleSearch = () => {
        setSearchOpen(prev => {
            if (prev) setSearchQuery('');
            else setTimeout(() => searchRef.current?.focus(), 50);
            return !prev;
        });
    };

    return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden bg-white">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b-[3px] border-black bg-white shrink-0">
                <Inbox size={15} style={{ color: theme.primary }} />
                <h2 className="flex-1 text-base font-black uppercase tracking-tight text-black">Tasks</h2>
                {totalCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-black bg-black text-white">{totalCount}</span>
                )}
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 border-2 border-stone-200 focus-within:border-black bg-stone-50 transition-colors">
                    <Search size={12} className="text-stone-400 shrink-0" />
                    <input
                        ref={searchRef}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search…"
                        className="text-[11px] font-medium text-stone-700 placeholder:text-stone-300 outline-none bg-transparent w-24"
                    />
                    {searchQuery && <button onClick={() => setSearchQuery('')} className="text-stone-300 hover:text-stone-600"><X size={10} /></button>}
                </div>
                <button
                    onClick={toggleSearch}
                    className={`sm:hidden p-1.5 border-2 transition-all ${searchQuery || searchOpen ? 'bg-black text-white border-black' : 'border-stone-200 text-stone-400 hover:border-black hover:text-black'}`}
                >
                    <Search size={12} />
                </button>
                <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-black hover:bg-stone-100 rounded transition-colors">
                    <X size={16} />
                </button>
            </div>

            {searchOpen && (
                <div className="sm:hidden px-4 py-2 border-b-2 border-black bg-stone-50 shrink-0">
                    <div className="flex items-center gap-2">
                        <Search size={12} className="text-stone-400 shrink-0" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search tasks..."
                            className="flex-1 text-sm font-medium text-stone-800 placeholder:text-stone-400 bg-transparent outline-none"
                        />
                        {searchQuery && <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-black"><X size={12} /></button>}
                    </div>
                </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-stone-50">
                <div className="p-3 flex flex-col gap-3 pb-4">

                    {/* Overdue groups */}
                    {overdueGroups.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 px-1">Overdue</span>
                            {overdueGroups.map(([dateKey, tasks]) => {
                                const dateLabel = new Date(dateKey + 'T00:00:00').toLocaleDateString([], {
                                    weekday: 'short', month: 'short', day: 'numeric',
                                });
                                return (
                                    <div key={dateKey} className="overflow-hidden rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white">
                                        <div className="px-4 py-2 border-b-2 border-black bg-orange-50">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">{dateLabel}</span>
                                        </div>
                                        <div className="px-4 divide-y divide-stone-100">
                                            {tasks.map(task => (
                                                <TaskRow
                                                    key={`overdue-${dateKey}-${task.id}`}
                                                    task={task}
                                                    theme={theme}
                                                    onComplete={handleComplete}
                                                    onDelete={handleDelete}
                                                    onAssign={() => { setSchedulingTask(task); setAssignDate(todayStr); }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Backlog */}
                    <div className="overflow-hidden rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white">
                        <div className="px-4 py-2 border-b-2 border-black bg-stone-100">
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Backlog</span>
                        </div>
                        <div className="px-4 divide-y divide-stone-100">
                            {manualBacklog.length === 0 ? (
                                <p className="text-xs italic py-5 text-center text-stone-300">
                                    {searchQuery ? 'No matching tasks' : 'Nothing in the backlog — add something below'}
                                </p>
                            ) : (
                                manualBacklog.map(task => (
                                    <TaskRow
                                        key={`backlog-${task.id}`}
                                        task={{ ...task, fromDate: null }}
                                        theme={theme}
                                        onComplete={handleComplete}
                                        onDelete={handleDelete}
                                        onAssign={() => { setSchedulingTask({ ...task, fromDate: null }); setAssignDate(todayStr); }}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t-[3px] border-black shrink-0 p-3 bg-white">
                <div className="flex items-end gap-3">
                    <input
                        ref={inputRef}
                        value={newText}
                        onChange={e => setNewText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                        placeholder="Add to backlog..."
                        className="flex-1 text-sm font-medium text-stone-800 placeholder:text-stone-300 bg-transparent outline-none border-b-2 border-stone-200 focus:border-black pb-1 transition-colors"
                    />
                    <button
                        onClick={handleAddTask}
                        disabled={!newText.trim()}
                        className="px-3 py-1.5 rounded-lg bg-black text-white text-[10px] font-black uppercase tracking-wide disabled:opacity-25 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center gap-1.5"
                    >
                        <Plus size={12} strokeWidth={3} />
                        Add
                    </button>
                </div>
            </div>

            {/* Assign-to-date modal */}
            {schedulingTask && (
                <div
                    className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/30 p-4"
                    onClick={() => setSchedulingTask(null)}
                >
                    <div
                        className="bg-white neo-border rounded-2xl p-5 w-full max-w-sm flex flex-col gap-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black uppercase tracking-wide">Assign to date</span>
                            <button
                                onClick={() => setSchedulingTask(null)}
                                className="p-1 text-stone-400 hover:text-stone-700 transition-colors"
                            >
                                <X size={15} />
                            </button>
                        </div>
                        <p className="text-xs text-stone-500 truncate border border-stone-100 rounded-lg px-3 py-2 bg-stone-50">
                            "{schedulingTask.text}"
                        </p>
                        <input
                            type="date"
                            value={assignDate}
                            min={todayStr}
                            max={`${new Date().getFullYear() + 2}-12-31`}
                            onChange={e => {
                                const val = e.target.value;
                                const year = val.split('-')[0];
                                if (year && year.length <= 4) setAssignDate(val);
                            }}
                            className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm font-medium"
                        />
                        <button
                            onClick={handleMoveToDate}
                            disabled={!assignDate}
                            className="w-full py-2.5 rounded-lg bg-black text-white text-sm font-black uppercase tracking-wide disabled:opacity-30 transition-opacity"
                        >
                            Move to date
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
