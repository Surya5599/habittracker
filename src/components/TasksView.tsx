import React, { useState, useMemo, useRef } from 'react';
import { X, Plus, CalendarPlus, Check, Search, Inbox, Trash2 } from 'lucide-react';
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
        <div
            className={`group/task flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-control transition-all duration-300 hover:bg-theme-primary-faint ${done ? 'opacity-0' : 'opacity-100'}`}
        >
            <button
                onClick={handleComplete}
                aria-label={`Mark "${task.text}" done`}
                className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all hover:scale-110 border-edge-muted hover:border-theme-primary"
                style={done ? { borderColor: theme.primary, backgroundColor: theme.primary } : undefined}
            >
                <Check
                    size={10}
                    strokeWidth={3.5}
                    className={done ? 'opacity-100' : 'opacity-0 group-hover/task:opacity-30'}
                    style={{ color: done ? 'var(--theme-primary-ink)' : theme.primary }}
                />
            </button>

            <span className={`flex-1 text-sm text-ink-strong leading-snug ${done ? 'line-through text-ink-subtle' : ''}`}>
                {task.text}
            </span>

            {/* actions stay quiet until the row is engaged */}
            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/task:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                    onClick={onAssign}
                    aria-label="Schedule this task"
                    className="p-1.5 rounded-control transition-colors hover:bg-theme-primary-soft"
                    title="Schedule"
                >
                    <CalendarPlus size={13} style={{ color: theme.primary }} />
                </button>
                <button
                    onClick={() => onDelete(task)}
                    aria-label="Delete this task"
                    className="p-1.5 rounded-control text-ink-dim hover:text-missed hover:bg-missed-tint transition-colors"
                    title="Delete"
                >
                    <X size={13} />
                </button>
            </div>
        </div>
    );
};

export const TasksView: React.FC<TasksViewProps> = ({ notes, updateNote, theme, onClose }) => {
    const [newText, setNewText] = useState('');
    const [schedulingTask, setSchedulingTask] = useState<TaskWithSource | null>(null);
    const [assignDate, setAssignDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    // bulk delete is irreversible, so it asks once in place rather than firing
    // straight off a single click
    const [confirmClearOverdue, setConfirmClearOverdue] = useState(false);
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
    const visibleOverdueCount = overdueGroups.reduce((n, [, tasks]) => n + tasks.length, 0);

    // Derived rather than an effect: if the list empties underneath a pending
    // confirmation the prompt just stops showing, no setState during render.
    const clearArmed = confirmClearOverdue && visibleOverdueCount > 0;

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

    /**
     * Clear every overdue task currently listed. Grouped by date and written once
     * per date: calling the single-task delete in a loop would read a stale
     * `notes` for each call and the later writes would resurrect earlier ones.
     * Completed tasks on those dates are kept — they are history, not overdue.
     */
    const handleClearOverdue = () => {
        overdueGroups.forEach(([dateKey, tasks]) => {
            const removing = new Set(tasks.map(t => t.id));
            const remaining = (notes[dateKey]?.tasks || []).filter(t => !removing.has(t.id));
            updateNote(dateKey, { tasks: remaining });
        });
        setConfirmClearOverdue(false);
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
        <div className="flex flex-col h-full min-h-0 overflow-hidden bg-surface">
            {/* Header */}
            <div className="h-1 shrink-0" style={{ backgroundColor: theme.primary }} />
            <div className="flex items-center gap-2.5 px-4 py-3 border-b-3 border-edge-strong bg-surface shrink-0">
                <span
                    className="w-7 h-7 rounded-control flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--theme-primary-soft)' }}
                >
                    <Inbox size={14} style={{ color: theme.primary }} />
                </span>
                <div className="flex-1 min-w-0">
                    <h2 className="text-base font-black uppercase tracking-tight text-ink-strong leading-none">Tasks</h2>
                    <p className="text-[10px] text-ink-subtle leading-tight mt-1">
                        {totalCount === 0 ? 'All clear' : `${totalCount} open${overdueTasks.length ? ` · ${overdueTasks.length} overdue` : ''}`}
                    </p>
                </div>
                {totalCount > 0 && (
                    <span
                        className="px-2 py-1 rounded-chip text-[10px] font-black tabular-nums"
                        style={{ backgroundColor: theme.primary, color: '#ffffff' }}
                    >
                        {totalCount}
                    </span>
                )}
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-control border-2 border-edge focus-within:border-theme-primary bg-surface-muted transition-colors">
                    <Search size={12} className="text-ink-subtle shrink-0" />
                    <input
                        ref={searchRef}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search…"
                        className="text-[11px] font-medium text-ink placeholder:text-ink-dim outline-none bg-transparent w-24"
                    />
                    {searchQuery && <button onClick={() => setSearchQuery('')} className="text-ink-dim hover:text-ink"><X size={10} /></button>}
                </div>
                <button
                    onClick={toggleSearch}
                    className={`sm:hidden p-1.5 border-2 transition-all ${searchQuery || searchOpen ? 'bg-theme-primary text-white border-edge-strong' : 'border-edge text-ink-subtle hover:border-edge-strong hover:text-ink-strong'}`}
                >
                    <Search size={12} />
                </button>
                <button onClick={onClose} className="p-1.5 text-ink-subtle hover:text-ink-strong hover:bg-surface-strong rounded transition-colors">
                    <X size={16} />
                </button>
            </div>

            {searchOpen && (
                <div className="sm:hidden px-4 py-2 border-b-2 border-edge-strong bg-surface-muted shrink-0">
                    <div className="flex items-center gap-2">
                        <Search size={12} className="text-ink-subtle shrink-0" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search tasks..."
                            className="flex-1 text-sm font-medium text-ink-strong placeholder:text-ink-subtle bg-transparent outline-none"
                        />
                        {searchQuery && <button onClick={() => setSearchQuery('')} className="text-ink-subtle hover:text-ink-strong"><X size={12} /></button>}
                    </div>
                </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-surface-muted">
                <div className="p-3 flex flex-col gap-3 pb-4">

                    {/* Overdue groups */}
                    {overdueGroups.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2 px-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-warning">
                                    Overdue
                                </span>
                                {clearArmed ? (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-ink-muted">
                                            Clear {visibleOverdueCount}{searchQuery ? ' matching' : ''}?
                                        </span>
                                        <button
                                            onClick={handleClearOverdue}
                                            className="px-2 py-1 rounded-control text-[10px] font-black uppercase tracking-wide bg-missed text-ink-inverse hover:opacity-90 transition-opacity"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            onClick={() => setConfirmClearOverdue(false)}
                                            className="px-2 py-1 rounded-control text-[10px] font-bold uppercase tracking-wide text-ink-muted hover:text-ink-strong transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmClearOverdue(true)}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-control text-[10px] font-bold uppercase tracking-wide text-ink-muted hover:text-missed hover:bg-missed-tint transition-colors"
                                        title="Delete every overdue task listed below"
                                    >
                                        <Trash2 size={11} />
                                        Clear all past
                                    </button>
                                )}
                            </div>
                            {overdueGroups.map(([dateKey, tasks]) => {
                                const dateLabel = new Date(dateKey + 'T00:00:00').toLocaleDateString([], {
                                    weekday: 'short', month: 'short', day: 'numeric',
                                });
                                return (
                                    <div key={dateKey} className="overflow-hidden rounded-card border-2 border-edge-strong shadow-neo bg-surface">
                                        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b-2 border-edge-strong bg-warning-faint">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-warning">{dateLabel}</span>
                                            <span className="text-[10px] font-bold text-ink-subtle tabular-nums">{tasks.length}</span>
                                        </div>
                                        <div className="px-3 py-1 divide-y divide-edge-subtle">
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
                    <div className="overflow-hidden rounded-card border-2 border-edge-strong shadow-neo bg-surface">
                        <div
                            className="flex items-center justify-between gap-2 px-4 py-2 border-b-2 border-edge-strong"
                            style={{ backgroundColor: 'var(--theme-primary-faint)' }}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-ink-muted">Backlog</span>
                            {manualBacklog.length > 0 && (
                                <span className="text-[10px] font-bold text-ink-subtle tabular-nums">{manualBacklog.length}</span>
                            )}
                        </div>
                        <div className="px-3 py-1 divide-y divide-edge-subtle">
                            {manualBacklog.length === 0 ? (
                                <div className="py-8 flex flex-col items-center gap-2 text-center">
                                    <span
                                        className="w-9 h-9 rounded-chip flex items-center justify-center"
                                        style={{ backgroundColor: 'var(--theme-primary-soft)' }}
                                    >
                                        <Inbox size={16} style={{ color: theme.primary }} />
                                    </span>
                                    <p className="text-xs text-ink-muted max-w-[24ch] leading-relaxed">
                                        {searchQuery
                                            ? 'No tasks match that search.'
                                            : 'Your backlog is empty. Anything you add below stays here until you give it a date.'}
                                    </p>
                                </div>
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
            <div className="border-t-3 border-edge-strong shrink-0 p-3 bg-surface">
                <div className="flex items-end gap-3">
                    <input
                        ref={inputRef}
                        value={newText}
                        onChange={e => setNewText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                        placeholder="Add to backlog..."
                        className="flex-1 text-sm text-ink-strong placeholder:text-ink-dim bg-transparent outline-none border-b-2 border-edge focus:border-theme-primary pb-1.5 transition-colors"
                    />
                    <button
                        onClick={handleAddTask}
                        disabled={!newText.trim()}
                        style={{ backgroundColor: theme.primary, color: '#ffffff' }}
                        className="px-3.5 py-2 rounded-control text-[10px] font-black uppercase tracking-wide disabled:opacity-25 shadow-neo-sm hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none active:translate-y-[2px] active:translate-x-[2px] transition-all flex items-center gap-1.5 shrink-0"
                    >
                        <Plus size={12} strokeWidth={3} />
                        Add
                    </button>
                </div>
            </div>

            {/* Assign-to-date modal */}
            {schedulingTask && (
                <div
                    className="fixed inset-0 z-sheet flex items-end sm:items-center justify-center bg-scrim p-4"
                    onClick={() => setSchedulingTask(null)}
                >
                    <div
                        className="bg-surface neo-border rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black uppercase tracking-wide">Assign to date</span>
                            <button
                                onClick={() => setSchedulingTask(null)}
                                className="p-1 text-ink-subtle hover:text-ink transition-colors"
                            >
                                <X size={15} />
                            </button>
                        </div>
                        <p className="text-xs text-ink-muted truncate border border-edge-subtle rounded-lg px-3 py-2 bg-surface-muted">
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
                            className="w-full border-2 border-edge-strong rounded-control px-3 py-2 text-sm focus:border-theme-primary outline-none transition-colors"
                        />
                        <button
                            onClick={handleMoveToDate}
                            disabled={!assignDate}
                            style={{ backgroundColor: theme.primary, color: '#ffffff' }}
                            className="w-full py-2.5 rounded-control text-sm font-black uppercase tracking-wide disabled:opacity-30 transition-opacity"
                        >
                            Move to date
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
