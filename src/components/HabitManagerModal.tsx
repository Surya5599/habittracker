import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Check, Edit2, GripVertical, Archive, RotateCcw } from 'lucide-react';
import { Habit } from '../types';
import { Reorder, useDragControls } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const HABIT_COLOR_OPTIONS = ['#8da18d', '#5b8a8a', '#b28d6c', '#8d8da1', '#5a7a5a', '#d4a89f', '#b8a8d4', '#8fa8c9', '#d4a8a8', '#a8d4c9', '#c9b88f', '#a88fa8', '#2d2d2d'];

interface HabitManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    habits: Habit[];
    addHabit: (themePrimary: string) => Promise<string | null>;
    updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
    removeHabit: (id: string) => Promise<void>;
    reorderHabits: (newHabits: Habit[]) => Promise<void>;
    toggleArchiveHabit: (id: string, archive: boolean) => Promise<void>;
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
    toggleArchiveHabit,
    themePrimary
}) => {
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editColor, setEditColor] = useState(themePrimary);
    const [editFrequency, setEditFrequency] = useState<number[] | undefined>(undefined);
    const [editWeeklyTarget, setEditWeeklyTarget] = useState<number | undefined>(undefined);
    const [frequencyType, setFrequencyType] = useState<'fixed' | 'flexible'>('fixed');
    const [isReorderMode, setIsReorderMode] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const activeHabitsCount = habits.filter(h => !h.archivedAt).length;
    const archivedHabitsCount = habits.filter(h => !!h.archivedAt).length;

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

    const normalizeHabitName = (name: string) => name.trim().toLowerCase();
    const hasDuplicateName = (name: string, habitId?: string) => {
        const normalized = normalizeHabitName(name);
        if (!normalized) return false;
        return habits.some(h => h.id !== habitId && normalizeHabitName(h.name) === normalized);
    };

    const handleAdd = async () => {
        if (habits.some(h => !h.name.trim())) {
            toast.error('Please enter a name for your new habit first');
            return;
        }
        setShowArchived(false);
        const newId = await addHabit(themePrimary);
        if (newId) {
            setEditingId(newId);
            setEditName('');
            setEditDescription('');
            setEditColor(themePrimary);
            setEditFrequency(undefined);
            setEditWeeklyTarget(undefined);
            setFrequencyType('fixed');
            setIsReorderMode(false);
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
        setEditDescription(habit.description || '');
        setEditColor(habit.color || themePrimary);
        setEditFrequency(habit.frequency);
        setEditWeeklyTarget(habit.weeklyTarget);
        setFrequencyType(habit.weeklyTarget ? 'flexible' : 'fixed');
    };

    const saveEdit = async (id: string) => {
        const trimmedName = editName.trim();
        if (!trimmedName) {
            toast.error('Habit name is required');
            return;
        }
        if (hasDuplicateName(trimmedName, id)) {
            toast.error('A habit with this name already exists');
            return;
        }
        const updates: Partial<Habit> = {
            name: trimmedName,
            description: editDescription.trim(),
            color: editColor
        };
        if (frequencyType === 'flexible') {
            updates.weeklyTarget = editWeeklyTarget || 3;
            updates.frequency = undefined; // Clear fixed frequency if switching to flexible
        } else {
            updates.frequency = editFrequency;
            updates.weeklyTarget = undefined; // Clear weekly target if switching to fixed
        }
        await updateHabit(id, updates);
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        await removeHabit(id);
        setConfirmDeleteId(null);
    };

    const handleCloseModal = async () => {
        const unnamedHabits = habits.filter(h => !h.name.trim());
        if (unnamedHabits.length > 0) {
            await Promise.all(unnamedHabits.map(h => removeHabit(h.id)));
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 md:pt-20 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b-[2px] border-black flex items-center justify-between gap-2 bg-white">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-black">{t('habitManager.title')}</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsReorderMode(prev => !prev)}
                            className={`px-2 py-1 text-[10px] font-black uppercase tracking-wide border-2 transition-all ${isReorderMode ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-stone-100'}`}
                        >
                            Reorder {isReorderMode ? 'On' : 'Off'}
                        </button>
                        <button onClick={handleCloseModal} className="border-2 border-transparent hover:border-black p-1 transition-all hover:bg-stone-100">
                            <X size={20} className="text-black" />
                        </button>
                    </div>
                </div>

                <div className="px-4 py-2 border-b-[2px] border-black grid grid-cols-2 gap-2 bg-stone-50">
                    <button
                        onClick={() => setShowArchived(false)}
                        className={`w-full min-w-0 h-9 px-2 text-[8px] sm:text-[10px] leading-tight text-center font-black uppercase tracking-normal sm:tracking-wide border-2 transition-all ${!showArchived ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]' : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'}`}
                    >
                        Active Habits ({activeHabitsCount})
                    </button>
                    <button
                        onClick={() => setShowArchived(true)}
                        className={`w-full min-w-0 h-9 px-2 text-[8px] sm:text-[10px] leading-tight text-center font-black uppercase tracking-normal sm:tracking-wide border-2 transition-all ${showArchived ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]' : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'}`}
                    >
                        Archived ({archivedHabitsCount})
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
                            className="space-y-2"
                        >
                            {habits
                                .filter(h => showArchived ? h.archivedAt : !h.archivedAt)
                                .map(habit => (
                                    <HabitItem
                                        key={habit.id}
                                        habit={habit}
                                        editingId={editingId}
                                        editName={editName}
                                        setEditName={setEditName}
                                        editDescription={editDescription}
                                        setEditDescription={setEditDescription}
                                        editColor={editColor}
                                        setEditColor={setEditColor}
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
                                        confirmDeleteId={confirmDeleteId}
                                        setConfirmDeleteId={setConfirmDeleteId}
                                        themePrimary={themePrimary}
                                        toggleArchiveHabit={toggleArchiveHabit}
                                        isArchived={!!habit.archivedAt}
                                        isReorderMode={isReorderMode}
                                    />
                                ))}
                        </Reorder.Group>
                    )}
                </div>

                <div className="p-3 border-t-[2px] border-black bg-stone-50">
                    <button
                        onClick={handleAdd}
                        className="w-full py-3 mb-2 bg-black text-white text-xs font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_gray] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_gray] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={16} strokeWidth={3} />
                        {t('habitManager.addHabit')}
                    </button>
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
    editDescription: string;
    setEditDescription: (val: string) => void;
    editColor: string;
    setEditColor: (val: string) => void;
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
    confirmDeleteId: string | null;
    setConfirmDeleteId: (id: string | null) => void;
    themePrimary: string;
    toggleArchiveHabit: (id: string, archive: boolean) => Promise<void>;
    isArchived: boolean;
    isReorderMode: boolean;
}

const getHabitFrequencyLabel = (habit: Habit) => {
    if (habit.weeklyTarget) return `${habit.weeklyTarget}x/week`;
    if (!habit.frequency || habit.frequency.length === 7) return 'Every day';
    if (habit.frequency.length === 5 && [1, 2, 3, 4, 5].every(day => habit.frequency?.includes(day))) return 'Weekdays';
    if (habit.frequency.length === 2 && habit.frequency.includes(0) && habit.frequency.includes(6)) return 'Weekend';
    return `${habit.frequency.length} days/week`;
};

const HabitItem: React.FC<HabitItemProps> = ({
    habit,
    editingId,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    editColor,
    setEditColor,
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
    confirmDeleteId,
    setConfirmDeleteId,
    themePrimary,
    toggleArchiveHabit,
    isArchived,
    isReorderMode
}) => {
    const { t } = useTranslation();
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={habit}
            drag={isReorderMode ? 'y' : false}
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
                    onPointerDown={(e) => {
                        if (isReorderMode) controls.start(e);
                    }}
                    className={`p-1 px-2 rounded transition-all ${isReorderMode ? 'cursor-grab active:cursor-grabbing text-stone-300 hover:text-black hover:bg-stone-50' : 'cursor-default text-stone-200'}`}
                    title={isReorderMode ? 'Drag to reorder' : 'Enable reorder mode first'}
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
                        <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full bg-white border-2 border-black px-2 py-1.5 text-xs font-medium text-black outline-none focus:ring-0 focus:bg-stone-50 resize-y min-h-[58px]"
                            placeholder={t('habitManager.habitDescriptionPlaceholder', { defaultValue: 'Optional description' })}
                        />
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {HABIT_COLOR_OPTIONS.map((color) => (
                                <button
                                    key={`${habit.id}-color-${color}`}
                                    type="button"
                                    onClick={() => setEditColor(color)}
                                    className={`w-5 h-5 rounded-full border-2 ${editColor === color ? 'border-black scale-110' : 'border-stone-300'}`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Set habit color ${color}`}
                                />
                            ))}
                        </div>
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
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => startEditing(habit)}>
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-bold text-black truncate hover:underline decoration-2 underline-offset-2">
                                {habit.name || t('habitManager.untitled')}
                            </span>
                            <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide border border-black bg-stone-50">
                                {isArchived ? 'Archived' : 'Active'}
                            </span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500 truncate">
                            {getHabitFrequencyLabel(habit)}
                        </p>
                        {!!habit.description?.trim() && (
                            <p className="text-[11px] text-stone-600 line-clamp-2 mt-1">
                                {habit.description}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="relative flex items-center gap-1 ml-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                {confirmDeleteId === habit.id && (
                    <div className="absolute bottom-full right-0 mb-2 w-44 border-2 border-black bg-white p-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] z-20">
                        <p className="text-[10px] font-black uppercase tracking-wide text-black mb-2">
                            Delete this habit?
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                            <button
                                onClick={() => handleDelete(habit.id)}
                                className="border-2 border-black bg-black text-white py-1 text-[10px] font-black uppercase tracking-wide hover:bg-stone-800 transition-colors"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="border-2 border-black bg-white text-black py-1 text-[10px] font-black uppercase tracking-wide hover:bg-stone-100 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => editingId === habit.id ? saveEdit(habit.id) : startEditing(habit)}
                    className="p-1.5 text-black hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-all"
                    title="Edit Name"
                >
                    {editingId === habit.id ? <Check size={14} strokeWidth={3} /> : <Edit2 size={14} strokeWidth={3} />}
                </button>
                <button
                    onClick={() => setConfirmDeleteId(confirmDeleteId === habit.id ? null : habit.id)}
                    className="p-1.5 text-black hover:bg-red-500 hover:text-white border-2 border-transparent hover:border-black transition-all"
                    title="Delete Habit"
                >
                    <Trash2 size={14} strokeWidth={3} />
                </button>
                {/* Archive Button */}
                <button
                    onClick={() => toggleArchiveHabit(habit.id, !isArchived)}
                    className="p-1.5 text-black hover:bg-stone-500 hover:text-white border-2 border-transparent hover:border-black transition-all"
                    title={isArchived ? "Unarchive Habit" : "Archive Habit"}
                >
                    {isArchived ? <RotateCcw size={14} strokeWidth={3} /> : <Archive size={14} strokeWidth={3} />}
                </button>
            </div>
        </Reorder.Item>
    );
};
