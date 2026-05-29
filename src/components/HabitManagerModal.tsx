import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Check, Edit2, GripVertical, Archive, RotateCcw, MoreHorizontal, Search } from 'lucide-react';
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
    const [editWeeklyTarget, setEditWeeklyTarget] = useState<number>(3);
    const [editFreqMode, setEditFreqMode] = useState<'everyday' | 'weekdays' | 'weekends' | 'custom' | 'flexible'>('everyday');
    const [editCustomDays, setEditCustomDays] = useState<number[]>([0,1,2,3,4,5,6]);
    const [isReorderMode, setIsReorderMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);

    // Quick-add form state
    const [isQuickAdding, setIsQuickAdding] = useState(false);
    const [quickName, setQuickName] = useState('');
    const [quickColor, setQuickColor] = useState(themePrimary);
    const [quickFreqMode, setQuickFreqMode] = useState<'everyday' | 'weekdays' | 'weekends' | 'custom' | 'flexible'>('everyday');
    const [quickCustomDays, setQuickCustomDays] = useState<number[]>([0,1,2,3,4,5,6]);
    const [quickWeeklyTarget, setQuickWeeklyTarget] = useState(3);

    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const quickNameRef = useRef<HTMLInputElement>(null);
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

    const openQuickAdd = () => {
        setShowArchived(false);
        setIsReorderMode(false);
        const autoColor = HABIT_COLOR_OPTIONS[habits.filter(h => !h.archivedAt).length % HABIT_COLOR_OPTIONS.length];
        setQuickColor(autoColor);
        setQuickName('');
        setQuickFreqMode('everyday');
        setQuickCustomDays([0,1,2,3,4,5,6]);
        setQuickWeeklyTarget(3);
        setIsQuickAdding(true);
        setTimeout(() => {
            quickNameRef.current?.focus();
            if (listRef.current) listRef.current.scrollTop = 0;
        }, 50);
    };

    const handleAdd = () => openQuickAdd();

    const handleQuickSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const name = quickName.trim();
        if (!name) return;
        if (hasDuplicateName(name)) { toast.error('A habit with this name already exists'); return; }

        let frequency: number[] | undefined;
        let weeklyTarget: number | undefined;
        if (quickFreqMode === 'weekdays') frequency = [1,2,3,4,5];
        else if (quickFreqMode === 'weekends') frequency = [0,6];
        else if (quickFreqMode === 'custom') frequency = quickCustomDays.length === 7 ? undefined : [...quickCustomDays].sort((a,b) => a-b);
        else if (quickFreqMode === 'flexible') { weeklyTarget = quickWeeklyTarget; }

        const newId = await addHabit(quickColor);
        if (newId) await updateHabit(newId, { name, color: quickColor, frequency, weeklyTarget });
        setIsQuickAdding(false);
    };

    const handleQuickCancel = () => setIsQuickAdding(false);

    useEffect(() => {
        if (!isOpen || !autoAddOnOpen) return;
        openQuickAdd();
        onAutoAddHandled?.();
    }, [isOpen, autoAddOnOpen]);

    const startEditing = (habit: Habit) => {
        setEditingId(habit.id);
        setEditName(habit.name);
        setEditDescription(habit.description || '');
        setEditColor(habit.color || themePrimary);
        if (habit.weeklyTarget) {
            setEditFreqMode('flexible');
            setEditWeeklyTarget(habit.weeklyTarget);
            setEditCustomDays([0,1,2,3,4,5,6]);
        } else if (!habit.frequency || habit.frequency.length === 7) {
            setEditFreqMode('everyday');
            setEditCustomDays([0,1,2,3,4,5,6]);
        } else if (habit.frequency.length === 5 && [1,2,3,4,5].every(d => habit.frequency!.includes(d))) {
            setEditFreqMode('weekdays');
            setEditCustomDays([1,2,3,4,5]);
        } else if (habit.frequency.length === 2 && habit.frequency.includes(0) && habit.frequency.includes(6)) {
            setEditFreqMode('weekends');
            setEditCustomDays([0,6]);
        } else {
            setEditFreqMode('custom');
            setEditCustomDays(habit.frequency);
        }
    };

    const saveEdit = async (id: string) => {
        const trimmedName = editName.trim();
        if (!trimmedName) { toast.error('Habit name is required'); return; }
        if (hasDuplicateName(trimmedName, id)) { toast.error('A habit with this name already exists'); return; }

        let frequency: number[] | undefined;
        let weeklyTarget: number | undefined;
        if (editFreqMode === 'weekdays') frequency = [1,2,3,4,5];
        else if (editFreqMode === 'weekends') frequency = [0,6];
        else if (editFreqMode === 'custom') frequency = editCustomDays.length === 7 ? undefined : [...editCustomDays].sort((a,b) => a-b);
        else if (editFreqMode === 'flexible') weeklyTarget = editWeeklyTarget;

        await updateHabit(id, { name: trimmedName, description: editDescription.trim(), color: editColor, frequency, weeklyTarget });
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

    const visibleHabits = habits.filter(h => {
        if (showArchived ? !h.archivedAt : h.archivedAt) return false;
        if (!searchQuery.trim()) return true;
        return (h.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden flex flex-col min-h-0 max-h-[calc(100svh-1.5rem)] animate-in zoom-in-95 duration-200 bg-white">
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b-[3px] border-black bg-white shrink-0">
                    <h2 className="flex-1 text-base font-black uppercase tracking-tight text-black">Habits</h2>
                    <span className="px-2 py-0.5 text-[10px] font-black bg-black text-white">{activeHabitsCount}</span>
                    {/* Inline search (sm+) */}
                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 border-2 border-stone-200 focus-within:border-black bg-stone-50 transition-colors">
                        <Search size={12} className="text-stone-400 shrink-0" />
                        <input
                            ref={searchInputRef}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search…"
                            className="text-[11px] font-medium text-stone-700 placeholder:text-stone-300 outline-none bg-transparent w-24"
                        />
                        {searchQuery && <button onClick={() => setSearchQuery('')} className="text-stone-300 hover:text-stone-600"><X size={10} /></button>}
                    </div>
                    {/* Mobile search toggle */}
                    <button
                        onClick={() => {
                            setSearchOpen(prev => {
                                if (prev) setSearchQuery('');
                                else setTimeout(() => searchInputRef.current?.focus(), 50);
                                return !prev;
                            });
                        }}
                        className={`sm:hidden p-1.5 border-2 transition-all ${searchQuery || searchOpen ? 'bg-black text-white border-black' : 'border-stone-200 text-stone-400 hover:border-black hover:text-black'}`}
                    >
                        <Search size={12} />
                    </button>
                    {/* Reorder toggle */}
                    <button
                        onClick={() => setIsReorderMode(prev => !prev)}
                        className={`px-2 py-1 text-[10px] font-black uppercase tracking-wide border-2 border-black transition-all ${isReorderMode ? 'bg-black text-white' : 'bg-white text-black hover:bg-stone-100'}`}
                    >
                        {isReorderMode ? 'Done' : 'Reorder'}
                    </button>
                    <button onClick={handleCloseModal} className="p-1.5 text-stone-400 hover:text-black hover:bg-stone-100 rounded transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Mobile search bar */}
                {searchOpen && (
                    <div className="sm:hidden px-4 py-2 border-b-2 border-black bg-stone-50 shrink-0">
                        <div className="flex items-center gap-2">
                            <Search size={12} className="text-stone-400 shrink-0" />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search habits..."
                                className="flex-1 text-sm font-medium text-stone-800 placeholder:text-stone-400 bg-transparent outline-none"
                            />
                            {searchQuery && <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-black"><X size={12} /></button>}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="px-3 py-2 border-b-[3px] border-black grid grid-cols-2 gap-2 bg-stone-100 shrink-0">
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

                {/* Scrollable content */}
                <div
                    ref={listRef}
                    className="flex-1 min-h-0 overflow-y-auto p-3 touch-pan-y bg-stone-50"
                    style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}
                >
                    {/* Quick-add form */}
                    {isQuickAdding && (
                        <form onSubmit={handleQuickSubmit} className="mb-3 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 flex flex-col gap-3">
                            <input
                                ref={quickNameRef}
                                value={quickName}
                                onChange={e => setQuickName(e.target.value.slice(0, 40))}
                                placeholder="What habit do you want to build?"
                                className="w-full border-2 border-black px-3 py-2 text-sm font-bold text-black outline-none focus:bg-stone-50 placeholder:text-stone-300"
                            />

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">How often?</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {([
                                        { key: 'everyday', label: 'Every day' },
                                        { key: 'weekdays', label: 'Weekdays' },
                                        { key: 'weekends', label: 'Weekends' },
                                        { key: 'custom',   label: 'Custom' },
                                        { key: 'flexible', label: '×/week' },
                                    ] as const).map(({ key, label }) => (
                                        <button key={key} type="button" onClick={() => setQuickFreqMode(key)}
                                            className={`px-3 py-1 text-[10px] font-black uppercase tracking-wide border-2 transition-all ${quickFreqMode === key ? 'bg-black text-white border-black' : 'bg-white text-stone-600 border-stone-300 hover:border-stone-600'}`}
                                        >{label}</button>
                                    ))}
                                </div>

                                {quickFreqMode === 'custom' && (
                                    <div className="flex gap-1 mt-1">
                                        {['S','M','T','W','T','F','S'].map((day, i) => {
                                            const sel = quickCustomDays.includes(i);
                                            return (
                                                <button key={i} type="button"
                                                    onClick={() => setQuickCustomDays(prev => sel ? prev.filter(d => d !== i) : [...prev, i])}
                                                    className={`w-7 h-7 text-[10px] font-black border-2 transition-all ${sel ? 'bg-black text-white border-black' : 'bg-white text-stone-300 border-stone-200 hover:border-stone-400'}`}
                                                >{day}</button>
                                            );
                                        })}
                                    </div>
                                )}

                                {quickFreqMode === 'flexible' && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <input type="range" min="1" max="7" value={quickWeeklyTarget}
                                            onChange={e => setQuickWeeklyTarget(parseInt(e.target.value))}
                                            className="flex-1 accent-black h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-xs font-black border-2 border-black bg-stone-50 px-1.5 py-0.5 min-w-[2.5rem] text-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                            {quickWeeklyTarget}×
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Color</span>
                                <div className="flex gap-1.5 flex-wrap">
                                    {HABIT_COLOR_OPTIONS.map(c => (
                                        <button key={c} type="button" onClick={() => setQuickColor(c)}
                                            className="w-5 h-5 rounded-full border-2 transition-all"
                                            style={{ backgroundColor: c, borderColor: quickColor === c ? 'black' : c, transform: quickColor === c ? 'scale(1.2)' : 'scale(1)' }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button type="submit" disabled={!quickName.trim()}
                                    className="flex-1 py-2 bg-black text-white text-[11px] font-black uppercase tracking-widest border-2 border-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-800 transition-colors"
                                    style={{ boxShadow: quickName.trim() ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none' }}
                                >Add Habit</button>
                                <button type="button" onClick={handleQuickCancel}
                                    className="px-4 py-2 text-[11px] font-black uppercase tracking-wide border-2 border-stone-300 text-stone-600 hover:border-stone-600 transition-colors"
                                >Cancel</button>
                            </div>
                        </form>
                    )}

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
                                        setEditingId={setEditingId}
                                        editName={editName}
                                        setEditName={setEditName}
                                        editDescription={editDescription}
                                        setEditDescription={setEditDescription}
                                        editColor={editColor}
                                        setEditColor={setEditColor}
                                        editFreqMode={editFreqMode}
                                        setEditFreqMode={setEditFreqMode}
                                        editCustomDays={editCustomDays}
                                        setEditCustomDays={setEditCustomDays}
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

                {/* Footer */}
                <div className="border-t-[3px] border-black shrink-0 p-3 bg-white">
                    <button
                        onClick={handleAdd}
                        className="w-full py-2.5 bg-black text-white text-[11px] font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
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
    setEditingId: (id: string | null) => void;
    editName: string;
    setEditName: (val: string) => void;
    editDescription: string;
    setEditDescription: (val: string) => void;
    editColor: string;
    setEditColor: (val: string) => void;
    editFreqMode: 'everyday' | 'weekdays' | 'weekends' | 'custom' | 'flexible';
    setEditFreqMode: (val: 'everyday' | 'weekdays' | 'weekends' | 'custom' | 'flexible') => void;
    editCustomDays: number[];
    setEditCustomDays: (val: number[]) => void;
    editWeeklyTarget: number;
    setEditWeeklyTarget: (val: number) => void;
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


const HabitItem: React.FC<HabitItemProps> = ({
    habit,
    editingId,
    setEditingId,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    editColor,
    setEditColor,
    editFreqMode,
    setEditFreqMode,
    editCustomDays,
    setEditCustomDays,
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
            className="group relative border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white"
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
            ) : isEditing ? (
                /* ── Edit mode: same card as quick-add, no header repetition ── */
                <div className="p-3 flex flex-col gap-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value.slice(0, 40))}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveEdit(habit.id); } }}
                        maxLength={40}
                        className="w-full border-2 border-black px-3 py-2 text-sm font-bold text-black outline-none focus:bg-stone-50 placeholder:text-stone-300"
                        placeholder={t('habitManager.habitNamePlaceholder')}
                    />
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">How often?</span>
                        <div className="flex flex-wrap gap-1.5">
                            {([
                                { key: 'everyday', label: 'Every day' },
                                { key: 'weekdays', label: 'Weekdays' },
                                { key: 'weekends', label: 'Weekends' },
                                { key: 'custom',   label: 'Custom' },
                                { key: 'flexible', label: '×/week' },
                            ] as const).map(({ key, label }) => (
                                <button key={key} type="button" onClick={() => setEditFreqMode(key)}
                                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-wide border-2 transition-all ${editFreqMode === key ? 'bg-black text-white border-black' : 'bg-white text-stone-600 border-stone-300 hover:border-stone-600'}`}
                                >{label}</button>
                            ))}
                        </div>
                        {editFreqMode === 'custom' && (
                            <div className="flex gap-1 mt-1">
                                {['S','M','T','W','T','F','S'].map((day, i) => {
                                    const sel = editCustomDays.includes(i);
                                    return (
                                        <button key={i} type="button"
                                            onClick={() => setEditCustomDays(sel ? editCustomDays.filter(d => d !== i) : [...editCustomDays, i])}
                                            className={`w-7 h-7 text-[10px] font-black border-2 transition-all ${sel ? 'bg-black text-white border-black' : 'bg-white text-stone-300 border-stone-200 hover:border-stone-400'}`}
                                        >{day}</button>
                                    );
                                })}
                            </div>
                        )}
                        {editFreqMode === 'flexible' && (
                            <div className="flex items-center gap-2 mt-1">
                                <input type="range" min="1" max="7" value={editWeeklyTarget}
                                    onChange={e => setEditWeeklyTarget(parseInt(e.target.value))}
                                    className="flex-1 accent-black h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-xs font-black border-2 border-black bg-stone-50 px-1.5 py-0.5 min-w-[2.5rem] text-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                    {editWeeklyTarget}×
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Color</span>
                        <div className="flex gap-1.5 flex-wrap">
                            {HABIT_COLOR_OPTIONS.map(c => (
                                <button key={`${habit.id}-${c}`} type="button" onClick={() => setEditColor(c)}
                                    className="w-5 h-5 rounded-full border-2 transition-all"
                                    style={{ backgroundColor: c, borderColor: editColor === c ? 'black' : c, transform: editColor === c ? 'scale(1.2)' : 'scale(1)' }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => saveEdit(habit.id)}
                            className="flex-1 py-2 bg-black text-white text-[11px] font-black uppercase tracking-widest border-2 border-black hover:bg-stone-800 transition-colors"
                            style={{ boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)' }}
                        >Save</button>
                        <button onClick={() => setEditingId(null)}
                            className="px-4 py-2 text-[11px] font-black uppercase tracking-wide border-2 border-stone-300 text-stone-600 hover:border-stone-600 transition-colors"
                        >Cancel</button>
                    </div>
                </div>
            ) : (
                /* ── Normal row ── */
                <div className="flex items-center gap-2 p-2">
                    <div className="cursor-default text-stone-200 p-1 px-1">
                        <GripVertical size={15} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 shrink-0 rounded-full border-2 border-black" style={{ backgroundColor: habit.color || themePrimary }} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="truncate text-sm sm:text-base font-black text-black">
                                        {habit.name || t('habitManager.untitled')}
                                    </span>
                                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${isArchived ? 'border-stone-300 bg-stone-100 text-stone-500' : 'border-black bg-stone-50 text-black'}`}>
                                        {isArchived ? 'Archived' : 'Active'}
                                    </span>
                                </div>
                                <div className="mt-1">
                                    <span className="rounded-full bg-stone-100 px-2 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-stone-600">
                                        {getHabitFrequencyLabel(habit)}
                                    </span>
                                </div>
                                {!!habit.description?.trim() && (
                                    <p className="mt-1 line-clamp-1 text-[10px] leading-relaxed text-stone-600">{habit.description}</p>
                                )}
                            </div>
                        </div>
                        {confirmDeleteId === habit.id && (
                            <div className="mt-3 rounded-xl border-2 border-black bg-stone-50 p-3">
                                <p className="text-[10px] font-black uppercase tracking-wide text-black mb-2">Delete this habit?</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleDelete(habit.id)}
                                        className="border-2 border-black bg-black text-white py-2 text-[10px] font-black uppercase tracking-wide hover:bg-stone-800 transition-colors"
                                    >Delete</button>
                                    <button onClick={() => setConfirmDeleteId(null)}
                                        className="border-2 border-black bg-white text-black py-2 text-[10px] font-black uppercase tracking-wide hover:bg-stone-100 transition-colors"
                                    >Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="relative self-center">
                        <button
                            onClick={() => { setConfirmDeleteId(null); setOpenMenuId(isMenuOpen ? null : habit.id); }}
                            className="inline-flex items-center justify-center rounded-full border border-stone-300 p-1.5 text-stone-600 transition-colors hover:bg-stone-100 hover:text-black"
                            title="More actions"
                        >
                            <MoreHorizontal size={15} strokeWidth={2.5} />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 top-full z-20 mt-2 min-w-[150px] rounded-xl border-2 border-black bg-white p-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                <button
                                    onClick={() => { startEditing(habit); setOpenMenuId(null); }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] font-black uppercase tracking-wide text-black transition-colors hover:bg-stone-100"
                                >
                                    <Edit2 size={12} strokeWidth={2.5} />Edit
                                </button>
                                <button
                                    onClick={() => { toggleArchiveHabit(habit.id, !isArchived); setOpenMenuId(null); }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] font-black uppercase tracking-wide text-black transition-colors hover:bg-stone-100"
                                >
                                    {isArchived ? <RotateCcw size={12} strokeWidth={2.5} /> : <Archive size={12} strokeWidth={2.5} />}
                                    {isArchived ? 'Restore' : 'Archive'}
                                </button>
                                <button
                                    onClick={() => { setConfirmDeleteId(confirmDeleteId === habit.id ? null : habit.id); setOpenMenuId(null); }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] font-black uppercase tracking-wide text-rose-600 transition-colors hover:bg-rose-50"
                                >
                                    <Trash2 size={12} strokeWidth={2.5} />Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Reorder.Item>
    );
};
