import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Check, Edit2, GripVertical } from 'lucide-react';
import { Habit } from '../types';
import { Reorder, useDragControls } from 'framer-motion';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editFrequency, setEditFrequency] = useState<number[] | undefined>(undefined);
    const [editWeeklyTarget, setEditWeeklyTarget] = useState<number | undefined>(undefined);
    const [frequencyType, setFrequencyType] = useState<'fixed' | 'flexible'>('fixed');
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && listRef.current) {
            // Scroll to bottom if needed or just focus something?
        }
    }, [isOpen]);

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
            // scroll to bottom
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
                updates.frequency = undefined; // Clear fixed frequency if switching to flexible
            } else {
                updates.frequency = editFrequency;
                updates.weeklyTarget = undefined; // Clear weekly target if switching to fixed
            }
            updateHabit(id, updates);
        }
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        if (confirm(t('habitManager.deleteConfirm'))) {
            await removeHabit(id);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 pt-20 md:pt-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b-[2px] border-black flex items-center justify-between bg-white">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-black">{t('habitManager.title')}</h2>
                    <button onClick={onClose} className="border-2 border-transparent hover:border-black p-1 transition-all hover:bg-stone-100">
                        <X size={20} className="text-black" />
                    </button>
                </div>

                <div ref={listRef} className="flex-1 overflow-y-auto p-4">
                    {habits.length === 0 ? (
                        <div className="text-center py-8 text-stone-400 text-xs font-medium uppercase tracking-wider">
                            {t('habitManager.noHabits')}
                        </div>
                    ) : (
                        <Reorder.Group
                            axis="y"
                            values={habits}
                            onReorder={reorderHabits}
                            className="space-y-3"
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

                <div className="p-4 border-t-[2px] border-black bg-stone-50">
                    <button
                        onClick={handleAdd}
                        className="w-full py-3 bg-black text-white text-xs font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_gray] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_gray] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={16} strokeWidth={3} />
                        {t('habitManager.addHabit')}
                    </button>
                    <p className="text-[10px] text-center text-stone-500 mt-3 font-bold uppercase tracking-wide">
                        {t('habitManager.dragToReorder')}
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
    const { t } = useTranslation();
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
            className="group flex items-center justify-between p-3 bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                    onPointerDown={(e) => controls.start(e)}
                    className="p-1 px-2 cursor-grab active:cursor-grabbing text-stone-300 hover:text-black hover:bg-stone-50 rounded transition-all"
                >
                    <GripVertical size={16} strokeWidth={2.5} />
                </button>
                <div className="w-4 h-4 rounded-full shrink-0 border-2 border-black" style={{ backgroundColor: habit.color || themePrimary }}></div>

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
                            className="w-full bg-white border-2 border-black px-2 py-1 text-sm font-bold text-black outline-none focus:ring-0 focus:bg-stone-50"
                            placeholder={t('habitManager.habitNamePlaceholder')}
                        />
                        <div className="flex flex-col gap-3">
                            <div className="flex border-2 border-black divide-x-2 divide-black self-start overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <button
                                    onClick={() => setFrequencyType('fixed')}
                                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors ${frequencyType === 'fixed' ? 'bg-black text-white' : 'bg-white text-black hover:bg-stone-50'}`}
                                >
                                    {t('habitManager.fixed')}
                                </button>
                                <button
                                    onClick={() => setFrequencyType('flexible')}
                                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors ${frequencyType === 'flexible' ? 'bg-black text-white' : 'bg-white text-black hover:bg-stone-50'}`}
                                >
                                    {t('habitManager.flexible')}
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
                                                    ? 'bg-black text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                                    : 'bg-white text-stone-300 border-stone-200 hover:border-stone-400'
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
                                            className="flex-1 accent-black h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-xs font-black min-w-[2.5rem] text-center border-2 border-black bg-stone-50 px-1 py-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                            {editWeeklyTarget || 3}x
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-bold text-stone-500 uppercase tracking-tight">{t('habitManager.timesPerWeek')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <span
                        onClick={() => startEditing(habit)}
                        className="flex-1 text-sm font-bold text-black truncate cursor-pointer hover:underline decoration-2 underline-offset-2"
                    >
                        {habit.name || t('habitManager.untitled')}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => editingId === habit.id ? saveEdit(habit.id) : startEditing(habit)}
                    className="p-1.5 text-black hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-all"
                    title="Edit Name"
                >
                    {editingId === habit.id ? <Check size={14} strokeWidth={3} /> : <Edit2 size={14} strokeWidth={3} />}
                </button>
                <button
                    onClick={() => handleDelete(habit.id)}
                    className="p-1.5 text-black hover:bg-red-500 hover:text-white border-2 border-transparent hover:border-black transition-all"
                    title="Delete Habit"
                >
                    <Trash2 size={14} strokeWidth={3} />
                </button>
            </div>
        </Reorder.Item>
    );
};
