import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Check, Edit2 } from 'lucide-react';
import { Habit } from '../types';

interface HabitManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    habits: Habit[];
    addHabit: (themePrimary: string) => Promise<string>;
    updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
    removeHabit: (id: string) => Promise<void>;
    themePrimary: string;
}

export const HabitManagerModal: React.FC<HabitManagerModalProps> = ({
    isOpen,
    onClose,
    habits,
    addHabit,
    updateHabit,
    removeHabit,
    themePrimary
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
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
        setEditingId(newId);
        setEditName('');
        // scroll to bottom
        setTimeout(() => {
            if (listRef.current) {
                listRef.current.scrollTop = listRef.current.scrollHeight;
            }
        }, 100);
    };

    const startEditing = (habit: Habit) => {
        setEditingId(habit.id);
        setEditName(habit.name);
    };

    const saveEdit = (id: string) => {
        if (editName.trim()) {
            updateHabit(id, { name: editName });
        }
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this habit? All history will be lost.')) {
            await removeHabit(id);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b-[2px] border-black flex items-center justify-between bg-white">
                    <h2 className="text-lg font-black uppercase tracking-tighter text-black">My Habits</h2>
                    <button onClick={onClose} className="border-2 border-transparent hover:border-black p-1 transition-all hover:bg-stone-100">
                        <X size={20} className="text-black" />
                    </button>
                </div>

                <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                    {habits.length === 0 && (
                        <div className="text-center py-8 text-stone-400 text-xs font-medium uppercase tracking-wider">
                            No habits yet. Start by adding one!
                        </div>
                    )}

                    {habits.map(habit => (
                        <div key={habit.id} className="group flex items-center justify-between p-3 bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-4 h-4 rounded-full shrink-0 border-2 border-black" style={{ backgroundColor: habit.color || themePrimary }}></div>

                                {editingId === habit.id ? (
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={() => saveEdit(habit.id)}
                                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(habit.id)}
                                        className="flex-1 bg-white border-2 border-black px-2 py-1 text-sm font-bold text-black outline-none focus:ring-0 focus:bg-stone-50"
                                        placeholder="Habit name"
                                    />
                                ) : (
                                    <span
                                        onClick={() => startEditing(habit)}
                                        className="flex-1 text-sm font-bold text-black truncate cursor-pointer hover:underline decoration-2 underline-offset-2"
                                    >
                                        {habit.name || 'Untitled Habit'}
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
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t-[2px] border-black bg-stone-50">
                    <button
                        onClick={handleAdd}
                        className="w-full py-3 bg-black text-white text-xs font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_gray] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_gray] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={16} strokeWidth={3} />
                        Add New Habit
                    </button>
                    <p className="text-[10px] text-center text-stone-500 mt-3 font-bold uppercase tracking-wide">
                        Habits will appear in your Weekly, Monthly and Dashboard views.
                    </p>
                </div>
            </div>
        </div>
    );
};
