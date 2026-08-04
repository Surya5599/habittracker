import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, ChevronLeft, GripVertical, Archive, RotateCcw, MoreHorizontal, Search, Check } from 'lucide-react';
import { Habit } from '../types';
import { Reorder, useDragControls } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { toDateKey } from '../utils/habitActivity';

const HABIT_COLOR_OPTIONS = ['#8da18d', '#5b8a8a', '#b28d6c', '#8d8da1', '#5a7a5a', '#d4a89f', '#b8a8d4', '#8fa8c9', '#d4a8a8', '#a8d4c9', '#c9b88f', '#a88fa8', '#2d2d2d'];

// Picks a legible checkmark color for a given swatch background.
const isLightColor = (hex: string): boolean => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150;
};

type FreqMode = 'everyday' | 'weekdays' | 'weekends' | 'custom' | 'flexible';

// Reduces a createdAt value (plain 'YYYY-MM-DD' or full ISO timestamp) to the
// local calendar day, for populating a <input type="date">.
const toStartDateInputValue = (createdAt?: string): string => {
    if (!createdAt) return toDateKey(new Date());
    if (createdAt.includes('T')) return toDateKey(new Date(createdAt));
    return createdAt;
};

const freqModeFromHabit = (habit: Habit): { mode: FreqMode; customDays: number[] } => {
    if (habit.weeklyTarget) return { mode: 'flexible', customDays: [0, 1, 2, 3, 4, 5, 6] };
    if (!habit.frequency || habit.frequency.length === 7) return { mode: 'everyday', customDays: [0, 1, 2, 3, 4, 5, 6] };
    if (habit.frequency.length === 5 && [1, 2, 3, 4, 5].every(d => habit.frequency!.includes(d))) return { mode: 'weekdays', customDays: [1, 2, 3, 4, 5] };
    if (habit.frequency.length === 2 && habit.frequency.includes(0) && habit.frequency.includes(6)) return { mode: 'weekends', customDays: [0, 6] };
    return { mode: 'custom', customDays: habit.frequency };
};

const getHabitFrequencyLabel = (habit: Habit) => {
    if (habit.weeklyTarget) return `${habit.weeklyTarget}x/week`;
    if (!habit.frequency || habit.frequency.length === 7) return 'Every day';
    if (habit.frequency.length === 5 && [1, 2, 3, 4, 5].every(day => habit.frequency?.includes(day))) return 'Weekdays';
    if (habit.frequency.length === 2 && habit.frequency.includes(0) && habit.frequency.includes(6)) return 'Weekend';
    return `${habit.frequency.length} days/week`;
};

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
    const [showArchived, setShowArchived] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [isReorderMode, setIsReorderMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

    // The single form used for both editing an existing habit and creating a new one.
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formTarget, setFormTarget] = useState('');
    const [formStartDate, setFormStartDate] = useState('');
    const [formColor, setFormColor] = useState(themePrimary);
    const [formFreqMode, setFormFreqMode] = useState<FreqMode>('everyday');
    const [formCustomDays, setFormCustomDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
    const [formWeeklyTarget, setFormWeeklyTarget] = useState<number>(3);
    const [formArchived, setFormArchived] = useState(false);

    const nameInputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const activeHabitsCount = habits.filter(h => !h.archivedAt).length;
    const archivedHabitsCount = habits.filter(h => !!h.archivedAt).length;
    const selectedHabit = habits.find(h => h.id === selectedId) || null;

    const normalizeHabitName = (name: string) => name.trim().toLowerCase();
    const hasDuplicateName = (name: string, habitId?: string) => {
        const normalized = normalizeHabitName(name);
        if (!normalized) return false;
        return habits.some(h => h.id !== habitId && normalizeHabitName(h.name) === normalized);
    };

    const loadHabitIntoForm = (habit: Habit) => {
        const { mode, customDays } = freqModeFromHabit(habit);
        setFormName(habit.name);
        setFormDescription(habit.description || '');
        setFormTarget(habit.target || '');
        setFormStartDate(toStartDateInputValue(habit.createdAt));
        setFormColor(habit.color || themePrimary);
        setFormFreqMode(mode);
        setFormCustomDays(customDays);
        if (habit.weeklyTarget) setFormWeeklyTarget(habit.weeklyTarget);
        setFormArchived(!!habit.archivedAt);
    };

    const selectHabit = (habit: Habit) => {
        setIsAdding(false);
        setSelectedId(habit.id);
        loadHabitIntoForm(habit);
        setMobileView('detail');
    };

    const startAdding = () => {
        setShowArchived(false);
        setIsReorderMode(false);
        setIsAdding(true);
        setSelectedId(null);
        const autoColor = HABIT_COLOR_OPTIONS[habits.filter(h => !h.archivedAt).length % HABIT_COLOR_OPTIONS.length];
        setFormName('');
        setFormDescription('');
        setFormTarget('');
        setFormStartDate(toDateKey(new Date()));
        setFormColor(autoColor);
        setFormFreqMode('everyday');
        setFormCustomDays([0, 1, 2, 3, 4, 5, 6]);
        setFormWeeklyTarget(3);
        setFormArchived(false);
        setMobileView('detail');
        setTimeout(() => nameInputRef.current?.focus(), 50);
    };

    useEffect(() => {
        if (!isOpen) return;
        if (!autoAddOnOpen) return;
        startAdding();
        onAutoAddHandled?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, autoAddOnOpen]);

    // Default to the first active habit so the detail panel isn't empty on open.
    useEffect(() => {
        if (!isOpen || isAdding || selectedId || autoAddOnOpen) return;
        const first = habits.find(h => !h.archivedAt);
        if (first) selectHabit(first);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const buildFrequencyFields = () => {
        let frequency: number[] | undefined;
        let weeklyTarget: number | undefined;
        if (formFreqMode === 'weekdays') frequency = [1, 2, 3, 4, 5];
        else if (formFreqMode === 'weekends') frequency = [0, 6];
        else if (formFreqMode === 'custom') frequency = formCustomDays.length === 7 ? undefined : [...formCustomDays].sort((a, b) => a - b);
        else if (formFreqMode === 'flexible') weeklyTarget = formWeeklyTarget;
        return { frequency, weeklyTarget };
    };

    const handleSave = async () => {
        const trimmedName = formName.trim();
        if (!trimmedName) { toast.error('Habit name is required'); return; }
        if (hasDuplicateName(trimmedName, selectedId || undefined)) { toast.error('A habit with this name already exists'); return; }

        const { frequency, weeklyTarget } = buildFrequencyFields();

        if (isAdding) {
            const newId = await addHabit(formColor);
            if (newId) {
                await updateHabit(newId, {
                    name: trimmedName,
                    description: formDescription.trim() || undefined,
                    target: formTarget.trim() || undefined,
                    color: formColor,
                    frequency,
                    weeklyTarget,
                    createdAt: formStartDate || undefined
                });
                setIsAdding(false);
                setSelectedId(newId);
            }
            return;
        }

        if (!selectedId) return;
        await updateHabit(selectedId, {
            name: trimmedName,
            description: formDescription.trim(),
            target: formTarget.trim() || undefined,
            color: formColor,
            frequency,
            weeklyTarget,
            createdAt: formStartDate || undefined
        });
        if (formArchived !== !!selectedHabit?.archivedAt) {
            await toggleArchiveHabit(selectedId, formArchived);
        }
        toast.success('Habit saved');
    };

    const handleCancel = () => {
        if (isAdding) {
            setIsAdding(false);
            const first = habits.find(h => !h.archivedAt);
            if (first) selectHabit(first);
            else setSelectedId(null);
            return;
        }
        if (selectedHabit) loadHabitIntoForm(selectedHabit);
    };

    const handleDelete = async (id: string) => {
        await removeHabit(id);
        setConfirmDeleteId(null);
        setOpenMenuId(null);
        if (selectedId === id) {
            setSelectedId(null);
            const next = habits.find(h => h.id !== id && !h.archivedAt);
            if (next) selectHabit(next);
        }
    };

    const handleCloseModal = async () => {
        onClose();
    };

    if (!isOpen) return null;

    const visibleHabits = habits.filter(h => {
        if (showArchived ? !h.archivedAt : h.archivedAt) return false;
        if (!searchQuery.trim()) return true;
        return (h.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

    const primaryFreqButtons: { key: FreqMode; label: string }[] = [
        { key: 'everyday', label: 'Every day' },
        { key: 'weekdays', label: 'Weekdays' },
        { key: 'weekends', label: 'Weekends' },
    ];
    const isMoreFreqMode = formFreqMode === 'custom' || formFreqMode === 'flexible';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-6xl overflow-hidden flex flex-col min-h-0 max-h-[calc(100svh-1.5rem)] animate-in zoom-in-95 duration-200 bg-white">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b-[3px] border-black bg-white shrink-0">
                <h2 className="flex-1 text-base font-black uppercase tracking-tight text-black">Habits</h2>
                <span className="px-2 py-0.5 text-[10px] font-black bg-black text-white">{activeHabitsCount}</span>
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

            <div className="flex-1 min-h-0 flex overflow-hidden">
                {/* Left sidebar: habit list */}
                <div className={`${mobileView === 'detail' ? 'hidden' : 'flex'} lg:flex flex-col w-full lg:w-[300px] shrink-0 border-r-[3px] border-black bg-stone-50 min-h-0`}>
                    <div className="px-3 py-2 border-b-2 border-black grid grid-cols-2 gap-2 bg-stone-100 shrink-0">
                        <button
                            onClick={() => setShowArchived(false)}
                            className={`w-full min-w-0 h-8 px-2 text-[9px] leading-tight text-center font-black uppercase tracking-normal border-2 transition-all ${!showArchived ? 'bg-black text-white border-black' : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'}`}
                        >
                            Active Habits ({activeHabitsCount})
                        </button>
                        <button
                            onClick={() => setShowArchived(true)}
                            className={`w-full min-w-0 h-8 px-2 text-[9px] leading-tight text-center font-black uppercase tracking-normal border-2 transition-all ${showArchived ? 'bg-black text-white border-black' : 'bg-white text-stone-400 border-stone-200 hover:border-black hover:text-black'}`}
                        >
                            Archived ({archivedHabitsCount})
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto p-3 touch-pan-y" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
                        {visibleHabits.length === 0 ? (
                            <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white px-4 py-8 text-center">
                                <p className="text-sm font-black uppercase tracking-widest text-stone-700">
                                    {showArchived ? 'No archived habits yet' : 'Start with one habit'}
                                </p>
                            </div>
                        ) : (
                            <Reorder.Group
                                axis="y"
                                values={visibleHabits}
                                onReorder={reorderHabits}
                                className="flex flex-col border-2 border-black bg-white"
                                style={{ touchAction: 'pan-y' }}
                            >
                                {visibleHabits.map(habit => (
                                    <HabitRow
                                        key={habit.id}
                                        habit={habit}
                                        isSelected={selectedId === habit.id && !isAdding}
                                        isArchived={!!habit.archivedAt}
                                        isReorderMode={isReorderMode}
                                        themePrimary={themePrimary}
                                        onSelect={() => selectHabit(habit)}
                                        openMenuId={openMenuId}
                                        setOpenMenuId={setOpenMenuId}
                                        confirmDeleteId={confirmDeleteId}
                                        setConfirmDeleteId={setConfirmDeleteId}
                                        toggleArchiveHabit={toggleArchiveHabit}
                                        handleDelete={handleDelete}
                                    />
                                ))}
                            </Reorder.Group>
                        )}
                    </div>

                    <div className="border-t-[3px] border-black shrink-0 p-3 bg-white">
                        <button
                            onClick={startAdding}
                            className="w-full py-2.5 bg-black text-white text-[11px] font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={16} strokeWidth={3} />
                            {t('habitManager.addHabit')}
                        </button>
                    </div>
                </div>

                {/* Middle: edit panel */}
                <div className={`${mobileView === 'list' ? 'hidden' : 'flex'} lg:flex flex-1 min-h-0 overflow-y-auto`}>
                    {!isAdding && !selectedHabit ? (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <p className="text-sm font-medium text-stone-400">Select a habit on the left, or add a new one.</p>
                        </div>
                    ) : (
                        <div className="flex-1 p-4 sm:p-6 flex flex-col gap-3 max-w-3xl">
                            <button
                                onClick={() => setMobileView('list')}
                                className="lg:hidden flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-stone-500 hover:text-black"
                            >
                                <ChevronLeft size={14} strokeWidth={3} /> Back to habits
                            </button>

                            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                                {isAdding ? 'New habit' : <>Editing: <span>{selectedHabit?.name || 'Untitled'}</span></>}
                            </h2>

                            {/* ── Details ── */}
                            <div className="flex flex-col gap-3 rounded-lg bg-stone-50 p-3">
                                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Details</span>
                                <input
                                    ref={nameInputRef}
                                    type="text"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value.slice(0, 40))}
                                    maxLength={40}
                                    placeholder={t('habitManager.habitNamePlaceholder')}
                                    className="w-full border-2 border-black px-3 py-2 text-sm font-bold text-black outline-none focus:bg-white placeholder:text-stone-300"
                                />
                                <textarea
                                    value={formDescription}
                                    onChange={e => setFormDescription(e.target.value.slice(0, 200))}
                                    rows={2}
                                    maxLength={200}
                                    className="w-full border-2 border-black px-3 py-2 text-sm text-black outline-none focus:bg-white placeholder:text-stone-300 resize-none"
                                    placeholder="Description (optional)"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={formTarget}
                                        onChange={e => setFormTarget(e.target.value.slice(0, 60))}
                                        maxLength={60}
                                        placeholder="Target (optional): e.g., 20 mins"
                                        className="w-full border-2 border-black px-3 py-2 text-sm text-black outline-none focus:bg-white placeholder:text-stone-300"
                                    />
                                    <input
                                        type="date"
                                        value={formStartDate}
                                        max={toDateKey(new Date())}
                                        onChange={e => setFormStartDate(e.target.value)}
                                        className="w-full border-2 border-black px-3 py-2 text-sm font-bold text-black outline-none focus:bg-white"
                                    />
                                </div>
                            </div>

                            {/* ── Schedule ── */}
                            <div className="flex flex-col gap-1.5 rounded-lg bg-stone-50 p-3">
                                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Schedule</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {primaryFreqButtons.map(({ key, label }) => (
                                        <button key={key} type="button" onClick={() => setFormFreqMode(key)}
                                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wide border-2 transition-all ${formFreqMode === key ? 'bg-black text-white border-black' : 'bg-white text-stone-600 border-stone-300 hover:border-stone-600'}`}
                                        >{label}</button>
                                    ))}
                                    <select
                                        value={isMoreFreqMode ? formFreqMode : ''}
                                        onChange={e => setFormFreqMode(e.target.value as FreqMode)}
                                        className={`px-2 py-1.5 text-[10px] font-black uppercase tracking-wide border-2 transition-all outline-none ${isMoreFreqMode ? 'bg-black text-white border-black' : 'bg-white text-stone-600 border-stone-300 hover:border-stone-600'}`}
                                    >
                                        <option value="" disabled hidden>More…</option>
                                        <option value="custom">Custom</option>
                                        <option value="flexible">×/week</option>
                                    </select>
                                </div>
                                {formFreqMode === 'custom' && (
                                    <div className="flex gap-1 mt-1">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                                            const sel = formCustomDays.includes(i);
                                            return (
                                                <button key={i} type="button"
                                                    onClick={() => setFormCustomDays(prev => sel ? prev.filter(d => d !== i) : [...prev, i])}
                                                    className={`w-7 h-7 text-[10px] font-black border-2 transition-all ${sel ? 'bg-black text-white border-black' : 'bg-white text-stone-300 border-stone-200 hover:border-stone-400'}`}
                                                >{day}</button>
                                            );
                                        })}
                                    </div>
                                )}
                                {formFreqMode === 'flexible' && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <input type="range" min="1" max="7" value={formWeeklyTarget}
                                            onChange={e => setFormWeeklyTarget(parseInt(e.target.value))}
                                            className="flex-1 accent-black h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-xs font-black border-2 border-black bg-white px-1.5 py-0.5 min-w-[2.5rem] text-center">
                                            {formWeeklyTarget}×
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* ── Appearance ── */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 rounded-lg bg-stone-50 p-3">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Appearance</span>
                                    <div className="flex gap-1 flex-wrap">
                                        {HABIT_COLOR_OPTIONS.map(c => {
                                            const selected = formColor === c;
                                            return (
                                                <button key={c} type="button" onClick={() => setFormColor(c)}
                                                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                                    style={{ backgroundColor: c }}
                                                >
                                                    {selected && <Check size={12} strokeWidth={3} className={isLightColor(c) ? 'text-black' : 'text-white'} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {!isAdding && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Status</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormArchived(prev => !prev)}
                                                className={`relative w-11 h-6 border-2 border-black transition-colors ${formArchived ? 'bg-white' : 'bg-black'}`}
                                                aria-label="Toggle habit active/archived"
                                            >
                                                <span
                                                    className={`absolute top-0.5 left-0.5 h-4 w-4 border-2 border-black bg-white transition-transform ${formArchived ? 'translate-x-5 bg-stone-200' : 'translate-x-0 bg-white'}`}
                                                />
                                            </button>
                                            <span className={`text-[10px] font-black uppercase tracking-wide ${!formArchived ? 'text-black' : 'text-stone-400'}`}>Active</span>
                                            <span className={`text-[10px] font-black uppercase tracking-wide ${formArchived ? 'text-black' : 'text-stone-400'}`}>Archived</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 mt-5">
                                <button onClick={handleSave}
                                    className="flex-1 py-2.5 bg-black text-white text-[11px] font-black uppercase tracking-widest border-2 border-black hover:bg-stone-800 transition-colors"
                                    style={{ boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)' }}
                                >Save</button>
                                <button onClick={handleCancel}
                                    className="px-6 py-2.5 text-[11px] font-black uppercase tracking-wide border-2 border-stone-300 text-stone-600 hover:border-stone-600 transition-colors"
                                >Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </div>
    );
};

interface HabitRowProps {
    habit: Habit;
    isSelected: boolean;
    isArchived: boolean;
    isReorderMode: boolean;
    themePrimary: string;
    onSelect: () => void;
    openMenuId: string | null;
    setOpenMenuId: (id: string | null) => void;
    confirmDeleteId: string | null;
    setConfirmDeleteId: (id: string | null) => void;
    toggleArchiveHabit: (id: string, archive: boolean) => Promise<void>;
    handleDelete: (id: string) => void;
}

const HabitRow: React.FC<HabitRowProps> = ({
    habit,
    isSelected,
    isArchived,
    isReorderMode,
    themePrimary,
    onSelect,
    openMenuId,
    setOpenMenuId,
    confirmDeleteId,
    setConfirmDeleteId,
    toggleArchiveHabit,
    handleDelete
}) => {
    const { t } = useTranslation();
    const controls = useDragControls();
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
            className={`group relative border-b border-stone-200 last:border-b-0 transition-colors ${isSelected ? 'bg-stone-100' : 'bg-white hover:bg-stone-50'}`}
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
                <button onClick={onSelect} className="w-full flex items-center gap-2 px-3 py-2.5 text-left">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 shrink-0 rounded-full border-2 border-black" style={{ backgroundColor: habit.color || themePrimary }} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="truncate text-sm font-black text-black">
                                        {habit.name || t('habitManager.untitled')}
                                    </span>
                                    {isArchived && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-stone-400 shrink-0" title="Archived" />
                                    )}
                                </div>
                                <span className="block text-[10px] font-bold uppercase tracking-wide text-stone-400">
                                    {getHabitFrequencyLabel(habit)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="relative self-center" onClick={e => e.stopPropagation()}>
                        <span
                            role="button"
                            onClick={() => { setConfirmDeleteId(null); setOpenMenuId(isMenuOpen ? null : habit.id); }}
                            className="inline-flex items-center justify-center rounded-full border-2 border-black bg-white p-1.5 text-black transition-colors hover:bg-stone-100"
                            title="More actions"
                        >
                            <MoreHorizontal size={15} strokeWidth={2.5} />
                        </span>
                        {isMenuOpen && (
                            <div className="absolute right-0 top-full z-20 mt-2 min-w-[150px] rounded-xl border-2 border-black bg-white p-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
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
                </button>
            )}
            {confirmDeleteId === habit.id && (
                <div className="border-t-2 border-black bg-stone-50 p-3">
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
        </Reorder.Item>
    );
};
