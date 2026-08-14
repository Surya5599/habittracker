import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Check, Edit2, GripVertical } from 'lucide-react';
import { Habit } from '../types';
import { Reorder, useDragControls } from 'framer-motion';

interface HabitManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    habits: Habit[];
    addHabit: (themePrimary: string) => Promise<string | null>;
    updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
    removeHabit: (id: string) => Promise<void>;
    reorderHabits: (newHabits: Habit[]) => Promise<void>;
    themePrimary: string;
}

export const HabitManagerModal: React.FC<HabitManagerModalProps> = ({
    isOpen,
    onClose,
    habits,
    addHabit,
    updateHabit,
    removeHabit,
    reorderHabits,
    themePrimary
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editFrequency, setEditFrequency] = useState<number[] | undefined>(undefined);
    const [editWeeklyTarget, setEditWeeklyTarget] = useState<number | undefined>(undefined);
    const [frequencyType, setFrequencyType] = useState<'fixed' | 'flexible'>('fixed');
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingId]);

    const handleAdd = async () => {
        const newId = await addHabit(themePrimary);
        if (newId) {
            setEditingId(newId);
            setEditName('');
            setEditFrequency(undefined);
            setEditWeeklyTarget(undefined);
            setFrequencyType('fixed');
            setTimeout(() => {
                if (listRef.current) {
                    listRef.current.scrollTop = listRef.current.scrollHeight;
                }
            }, 100);
        }
    };

    const startEditing = (habit: Habit) => {
        setEditingId(habit.id);
        setEditName(habit.name);
        setEditFrequency(habit.frequency);
        setEditWeeklyTarget(habit.weeklyTarget);
        setFrequencyType(habit.weeklyTarget ? 'flexible' : 'fixed');
    };

    const saveEdit = (id: string) => {
        if (editName.trim()) {
            const updates: Partial<Habit> = { name: editName };
            if (frequencyType === 'flexible') {
                updates.weeklyTarget = editWeeklyTarget || 3;
                updates.frequency = undefined;
            } else {
                updates.frequency = editFrequency;
                updates.weeklyTarget = undefined;
            }
            updateHabit(id, updates);
        }
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this habit? You will lose all its historical data.')) {
            await removeHabit(id);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface border-2 border-edge-strong shadow-neo w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b-2 border-edge-strong flex items-center justify-between bg-surface">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-ink-strong">Habits</h2>
                    <button onClick={onClose} className="border-2 border-transparent hover:border-edge-strong p-1 transition-all hover:bg-surface-strong">
                        <X size={20} className="text-ink-strong" />
                    </button>
                </div>

                <div ref={listRef} className="flex-1 overflow-y-auto p-4">
                    {habits.length === 0 ? (
                        <div className="text-center py-8 text-ink-subtle text-xs font-medium uppercase tracking-wider">
                            No habits yet. Start by adding one!
                        </div>
                    ) : (
                        <Reorder.Group
                            axis="y"
                            values={habits}
                            onReorder={reorderHabits}
                            className="space-y-2"
                        >
                            {habits.map(habit => (
                                <HabitItem
                                    key={habit.id}
                                    habit={habit}
                                    editingId={editingId}
                                    editName={editName}
                                    setEditName={setEditName}
                                    frequencyType={frequencyType}
                                    setFrequencyType={setFrequencyType}
                                    editFrequency={editFrequency}
                                    setEditFrequency={setEditFrequency}
                                    editWeeklyTarget={editWeeklyTarget}
                                    setEditWeeklyTarget={setEditWeeklyTarget}
                                    inputRef={inputRef}
                                    saveEdit={saveEdit}
                                    startEditing={startEditing}
                                    handleDelete={handleDelete}
                                    themePrimary={themePrimary}
                                />
                            ))}
                        </Reorder.Group>
                    )}
                </div>

                <div className="p-4 border-t-2 border-edge-strong bg-surface-muted">
                    <button
                        onClick={handleAdd}
                        className="w-full py-3 bg-surface-inverse text-ink-inverse text-xs font-black uppercase tracking-widest border-2 border-edge-strong shadow-[4px_4px_0px_0px_gray] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_gray] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={16} strokeWidth={3} />
                        Add New Habit
                    </button>
                    <p className="text-[10px] text-center text-ink-muted mt-3 font-bold uppercase tracking-wide">
                        Drag habits to reorder them.
                    </p>
                </div>
            </div>
        </div>
    );
};

interface HabitItemProps {
    habit: Habit;
    editingId: string | null;
    editName: string;
    setEditName: (val: string) => void;
    frequencyType: 'fixed' | 'flexible';
    setFrequencyType: (val: 'fixed' | 'flexible') => void;
    editFrequency: number[] | undefined;
    setEditFrequency: (val: number[] | undefined) => void;
    editWeeklyTarget: number | undefined;
    setEditWeeklyTarget: (val: number | undefined) => void;
    inputRef: React.RefObject<HTMLInputElement>;
    saveEdit: (id: string) => void;
    startEditing: (habit: Habit) => void;
    handleDelete: (id: string) => void;
    themePrimary: string;
}

const HabitItem: React.FC<HabitItemProps> = ({
    habit,
    editingId,
    editName,
    setEditName,
    frequencyType,
    setFrequencyType,
    editFrequency,
    setEditFrequency,
    editWeeklyTarget,
    setEditWeeklyTarget,
    inputRef,
    saveEdit,
    startEditing,
    handleDelete,
    themePrimary
}) => {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={habit}
            dragListener={false}
            dragControls={controls}
            whileDrag={{
                scale: 1.02,
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                zIndex: 50
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="group flex items-center justify-between p-2 bg-surface border-2 border-edge-strong shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                    onPointerDown={(e) => controls.start(e)}
                    className="p-1 px-1.5 cursor-grab active:cursor-grabbing text-ink-dim hover:text-ink-strong hover:bg-surface-muted rounded transition-all"
                >
                    <GripVertical size={14} strokeWidth={2.5} />
                </button>
                <div className="w-4 h-4 rounded-full shrink-0 border-2 border-edge-strong" style={{ backgroundColor: habit.color || themePrimary }}></div>

                {editingId === habit.id ? (
                    <div className="flex-1 flex flex-col gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    saveEdit(habit.id);
                                }
                            }}
                            className="w-full bg-surface border-2 border-edge-strong px-2 py-1 text-sm font-bold text-ink-strong outline-none focus:ring-0 focus:bg-surface-muted"
                            placeholder="Habit name"
                        />
                        <div className="flex flex-col gap-3">
                            <div className="flex border-2 border-edge-strong divide-x-2 divide-edge-strong self-start overflow-hidden shadow-neo-sm">
                                <button
                                    onClick={() => setFrequencyType('fixed')}
                                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors ${frequencyType === 'fixed' ? 'bg-surface-inverse text-ink-inverse' : 'bg-surface text-ink-strong hover:bg-surface-muted'}`}
                                >
                                    Fixed
                                </button>
                                <button
                                    onClick={() => setFrequencyType('flexible')}
                                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors ${frequencyType === 'flexible' ? 'bg-surface-inverse text-ink-inverse' : 'bg-surface text-ink-strong hover:bg-surface-muted'}`}
                                >
                                    Flexible
                                </button>
                            </div>

                            {frequencyType === 'fixed' ? (
                                <div className="flex gap-1">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                                        const isSelected = !editFrequency || editFrequency.includes(i);
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    if (!editFrequency) {
                                                        const all = [0, 1, 2, 3, 4, 5, 6];
                                                        setEditFrequency(all.filter(d => d !== i));
                                                    } else {
                                                        if (editFrequency.includes(i)) {
                                                            const next = editFrequency.filter(d => d !== i);
                                                            setEditFrequency(next.length === 7 ? undefined : next);
                                                        } else {
                                                            const next = [...editFrequency, i].sort();
                                                            setEditFrequency(next.length === 7 ? undefined : next);
                                                        }
                                                    }
                                                }}
                                                className={`w-6 h-6 flex items-center justify-center text-[10px] font-black border-2 transition-all ${isSelected
                                                    ? 'bg-surface-inverse text-ink-inverse border-edge-strong shadow-neo-sm'
                                                    : 'bg-surface text-ink-dim border-edge hover:border-edge-muted'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="range"
                                            min="1"
                                            max="7"
                                            value={editWeeklyTarget || 3}
                                            onChange={(e) => setEditWeeklyTarget(parseInt(e.target.value))}
                                            className="flex-1 accent-black h-1 bg-edge rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-xs font-black min-w-[2.5rem] text-center border-2 border-edge-strong bg-surface-muted px-1 py-1 shadow-neo-sm">
                                            {editWeeklyTarget || 3}x
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-bold text-ink-muted uppercase tracking-tight">Times per week</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <span
                        onClick={() => startEditing(habit)}
                        className="flex-1 text-sm font-bold text-ink-strong truncate cursor-pointer hover:underline decoration-2 underline-offset-2"
                    >
                        {habit.name || 'Untitled Habit'}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => editingId === habit.id ? saveEdit(habit.id) : startEditing(habit)}
                    className="p-1 text-ink-strong hover:bg-surface-inverse hover:text-ink-inverse border-2 border-transparent hover:border-edge-strong transition-all"
                    title="Edit Name"
                >
                    {editingId === habit.id ? <Check size={12} strokeWidth={3} /> : <Edit2 size={12} strokeWidth={3} />}
                </button>
                <button
                    onClick={() => handleDelete(habit.id)}
                    className="p-1 text-ink-strong hover:bg-red-500 hover:text-ink-inverse border-2 border-transparent hover:border-edge-strong transition-all"
                    title="Delete Habit"
                >
                    <Trash2 size={12} strokeWidth={3} />
                </button>
            </div>
        </Reorder.Item>
    );
};
