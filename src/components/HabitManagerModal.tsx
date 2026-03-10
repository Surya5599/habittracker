import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Check, Edit2, GripVertical, Archive, RotateCcw, ChevronUp, MoreHorizontal } from 'lucide-react';
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
    autoAddOnOpen?: boolean;
    onAutoAddHandled?: () => void;
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
    themePrimary,
    autoAddOnOpen = false,
    onAutoAddHandled
}) => {
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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

    useEffect(() => {
        if (!isOpen || !autoAddOnOpen) return;

        const run = async () => {
            await handleAdd();
            onAutoAddHandled?.();
        };

        run();
    }, [isOpen, autoAddOnOpen]);

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
        setOpenMenuId(null);
    };

    const handleCloseModal = async () => {
        const unnamedHabits = habits.filter(h => !h.name.trim());
        if (unnamedHabits.length > 0) {
            await Promise.all(unnamedHabits.map(h => removeHabit(h.id)));
        }
        onClose();
    };

    if (!isOpen) return null;

    const visibleHabits = habits.filter(h => showArchived ? h.archivedAt : !h.archivedAt);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-2 pt-4 sm:p-4 sm:pt-8 md:pt-16 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden flex flex-col min-h-0 max-h-[calc(100svh-1rem)] sm:max-h-[calc(100svh-2rem)] md:max-h-[88vh] animate-in zoom-in-95 duration-200">
                <div className="p-3 border-b-[2px] border-black flex items-center justify-between gap-2 bg-white">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-black">{t('habitManager.title')}</h2>
                        <p className="mt-1 hidden sm:block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                            Review habits first, expand a card only when you want to edit.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsReorderMode(prev => !prev)}
                            className={`px-2 py-1 text-[10px] font-black uppercase tracking-wide border-2 transition-all ${isReorderMode ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-stone-100'}`}
                        >
                            {isReorderMode ? 'Done' : 'Reorder'}
                        </button>
                        <button onClick={handleCloseModal} className="border-2 border-transparent hover:border-black p-1 transition-all hover:bg-stone-100">
                            <X size={20} className="text-black" />
                        </button>
                    </div>
                </div>

                <div className="px-3 py-2 border-b-[2px] border-black grid grid-cols-2 gap-2 bg-stone-50">
                    <button
                        onClick={() => setShowArchived(false)}
                        className={`w-full min-w-0 h-8 sm:h-9 px-2 text-[8px] sm:text-[10px] leading-tight text-center font-black uppercase tracking-normal sm:tracking-wide border-2 transition-all ${!showArchived ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]' : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'}`}
                    >
                        Active Habits ({activeHabitsCount})
                    </button>
                    <button
                        onClick={() => setShowArchived(true)}
                        className={`w-full min-w-0 h-8 sm:h-9 px-2 text-[8px] sm:text-[10px] leading-tight text-center font-black uppercase tracking-normal sm:tracking-wide border-2 transition-all ${showArchived ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]' : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'}`}
                    >
                        Archived ({archivedHabitsCount})
                    </button>
                </div>

                <div
                    ref={listRef}
                    className="flex-1 min-h-0 overflow-y-auto p-3 touch-pan-y"
                    style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}
                >
                    {visibleHabits.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-5 py-10 text-center">
                            <p className="text-sm font-black uppercase tracking-widest text-stone-700">
                                {showArchived ? 'No archived habits yet' : 'Start with one habit'}
                            </p>
                            <p className="mt-2 text-sm font-medium text-stone-500">
                                {showArchived
                                    ? 'Archived habits will appear here when you want to bring them back.'
                                    : 'Create a habit, pick a rhythm, and adjust the details only when you need them.'}
                            </p>
                        </div>
                    ) : (
                        <Reorder.Group
                            axis="y"
                            values={visibleHabits}
                            onReorder={reorderHabits}
                            className="space-y-2"
                            style={{ touchAction: 'pan-y' }}
                        >
                            {visibleHabits.map(habit => (
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
                                        openMenuId={openMenuId}
                                        setOpenMenuId={setOpenMenuId}
                                        themePrimary={themePrimary}
                                        toggleArchiveHabit={toggleArchiveHabit}
                                        isArchived={!!habit.archivedAt}
                                        isReorderMode={isReorderMode}
                                    />
                                ))}
                        </Reorder.Group>
                    )}
                </div>

                <div className="p-2.5 border-t-[2px] border-black bg-stone-50">
                    <button
                        onClick={handleAdd}
                        className="w-full py-2.5 bg-black text-white text-[11px] font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_gray] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_gray] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
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
    openMenuId: string | null;
    setOpenMenuId: (id: string | null) => void;
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

const getHabitTypeLabel = (habit: Habit) => {
    return habit.weeklyTarget ? 'Flexible target' : 'Fixed schedule';
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
    openMenuId,
    setOpenMenuId,
    themePrimary,
    toggleArchiveHabit,
    isArchived,
    isReorderMode
}) => {
    const { t } = useTranslation();
    const controls = useDragControls();
    const isEditing = editingId === habit.id;
    const isMenuOpen = openMenuId === habit.id;

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
            className="group relative rounded-2xl border-[2px] border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
            {isReorderMode ? (
                <div className="flex items-center gap-3 px-3 py-2.5">
                    <button
                        onPointerDown={(e) => controls.start(e)}
                        className="cursor-grab active:cursor-grabbing rounded p-1 text-stone-400 transition-colors hover:bg-stone-50 hover:text-black"
                        title="Drag to reorder"
                    >
                        <GripVertical size={16} strokeWidth={2.5} />
                    </button>
                    <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-black" style={{ backgroundColor: habit.color || themePrimary }}></div>
                    <span className="truncate text-sm font-black uppercase tracking-wide text-black">
                        {habit.name || t('habitManager.untitled')}
                    </span>
                </div>
            ) : (
            <div className="flex items-center gap-2 p-2">
                <button
                    onPointerDown={(e) => {
                        if (isReorderMode) controls.start(e);
                    }}
                    className={`p-1 px-1 rounded transition-all ${isReorderMode ? 'cursor-grab active:cursor-grabbing text-stone-300 hover:text-black hover:bg-stone-50' : 'cursor-default text-stone-200'}`}
                    title={isReorderMode ? 'Drag to reorder' : 'Enable reorder mode first'}
                >
                    <GripVertical size={15} strokeWidth={2.5} />
                </button>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 shrink-0 rounded-full border-2 border-black" style={{ backgroundColor: habit.color || themePrimary }}></div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="truncate text-sm sm:text-base font-black text-black">
                                    {habit.name || t('habitManager.untitled')}
                                </span>
                                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${isArchived ? 'border-stone-300 bg-stone-100 text-stone-500' : 'border-black bg-stone-50 text-black'}`}>
                                    {isArchived ? 'Archived' : 'Active'}
                                </span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                                <span className="rounded-full bg-stone-100 px-2 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-stone-600">
                                    {getHabitTypeLabel(habit)}
                                </span>
                                <span className="rounded-full bg-stone-100 px-2 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-stone-600">
                                    {getHabitFrequencyLabel(habit)}
                                </span>
                            </div>
                            {!!habit.description?.trim() && !isEditing && (
                                <p className="mt-1 line-clamp-1 text-[10px] leading-relaxed text-stone-600">
                                    {habit.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                        {isEditing ? (
                            <button
                                onClick={() => saveEdit(habit.id)}
                                className="inline-flex items-center gap-1 rounded-full border-2 border-black px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-black transition-colors hover:bg-stone-100"
                                title="Save habit"
                            >
                                <Check size={12} strokeWidth={3} />
                                Save
                            </button>
                        ) : (
                            <div />
                        )}
                    </div>

                    {confirmDeleteId === habit.id && (
                        <div className="mt-3 rounded-xl border-2 border-black bg-stone-50 p-3">
                            <p className="text-[10px] font-black uppercase tracking-wide text-black mb-2">
                                Delete this habit?
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleDelete(habit.id)}
                                    className="border-2 border-black bg-black text-white py-2 text-[10px] font-black uppercase tracking-wide hover:bg-stone-800 transition-colors"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="border-2 border-black bg-white text-black py-2 text-[10px] font-black uppercase tracking-wide hover:bg-stone-100 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {isEditing && (
                        <div className="mt-3 rounded-t-2xl border-t-2 border-dashed border-stone-300 pt-3">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-[11px] font-black uppercase tracking-widest text-stone-500">
                                    Edit habit details
                                </p>
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-stone-500 hover:text-black"
                                >
                                    Collapse
                                    <ChevronUp size={12} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-2.5">
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
                            className="w-full bg-white border-2 border-black px-2 py-1 text-[13px] sm:text-sm font-bold text-black outline-none focus:ring-0 focus:bg-stone-50"
                            placeholder={t('habitManager.habitNamePlaceholder')}
                        />
                        <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full bg-white border-2 border-black px-2 py-1.5 text-xs font-medium text-black outline-none focus:ring-0 focus:bg-stone-50 resize-y min-h-[44px]"
                            placeholder={t('habitManager.habitDescriptionPlaceholder', { defaultValue: 'Optional description' })}
                        />
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {HABIT_COLOR_OPTIONS.map((color) => (
                                        <button
                                            key={`${habit.id}-color-${color}`}
                                            type="button"
                                            onClick={() => setEditColor(color)}
                                            className={`w-6 h-6 rounded-full border-2 ${editColor === color ? 'border-black scale-110' : 'border-stone-300'}`}
                                            style={{ backgroundColor: color }}
                                            aria-label={`Set habit color ${color}`}
                                        />
                                    ))}
                                </div>
                                <div className="flex flex-col gap-2.5">
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
                                                        className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] font-black border-2 transition-all ${isSelected
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

                                <button
                                    onClick={() => saveEdit(habit.id)}
                                    className="mt-1 inline-flex items-center justify-center gap-2 self-start rounded-full border-2 border-black bg-black px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-stone-800"
                                >
                                    <Check size={12} strokeWidth={3} />
                                    Save habit
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative self-center">
                    <button
                        onClick={() => {
                            setConfirmDeleteId(null);
                            setOpenMenuId(isMenuOpen ? null : habit.id);
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-stone-300 p-1.5 text-stone-600 transition-colors hover:bg-stone-100 hover:text-black"
                        title="More actions"
                    >
                        <MoreHorizontal size={15} strokeWidth={2.5} />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 top-full z-20 mt-2 min-w-[150px] rounded-xl border-2 border-black bg-white p-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                            {!isEditing && (
                                <button
                                    onClick={() => {
                                        startEditing(habit);
                                        setOpenMenuId(null);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] font-black uppercase tracking-wide text-black transition-colors hover:bg-stone-100"
                                >
                                    <Edit2 size={12} strokeWidth={2.5} />
                                    Edit
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    toggleArchiveHabit(habit.id, !isArchived);
                                    setOpenMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] font-black uppercase tracking-wide text-black transition-colors hover:bg-stone-100"
                            >
                                {isArchived ? <RotateCcw size={12} strokeWidth={2.5} /> : <Archive size={12} strokeWidth={2.5} />}
                                {isArchived ? 'Restore' : 'Archive'}
                            </button>
                            <button
                                onClick={() => {
                                    setConfirmDeleteId(confirmDeleteId === habit.id ? null : habit.id);
                                    setOpenMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] font-black uppercase tracking-wide text-rose-600 transition-colors hover:bg-rose-50"
                            >
                                <Trash2 size={12} strokeWidth={2.5} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>

            </div>
            )}
        </Reorder.Item>
    );
};
