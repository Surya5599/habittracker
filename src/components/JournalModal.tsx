import React, { useState, useEffect } from 'react';
import { X, Save, Meh, Frown, Smile, Laugh, Star } from 'lucide-react';
import { DayData, Theme } from '../types';

interface JournalModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    initialData: DayData;
    onSave: (data: Partial<DayData>) => void;
    theme: Theme;
}

export const JournalModal: React.FC<JournalModalProps> = ({
    isOpen,
    onClose,
    date,
    initialData,
    onSave,
    theme,
}) => {
    const [mood, setMood] = useState<number | undefined>(initialData.mood);
    const [journal, setJournal] = useState(initialData.journal || '');

    useEffect(() => {
        if (isOpen) {
            setMood(initialData.mood);
            setJournal(initialData.journal || '');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({ mood, journal });
        onClose();
    };

    const MOODS = [
        { value: 1, icon: Frown, label: 'Rough', color: '#ef4444' },     // Red
        { value: 2, icon: Meh, label: 'Okay', color: '#f59e0b' },       // Amber
        { value: 3, icon: Smile, label: 'Good', color: '#84cc16' },     // Lime
        { value: 4, icon: Laugh, label: 'Great', color: '#10b981' },    // Green
        { value: 5, icon: Star, label: 'Amazing', color: '#8b5cf6' },   // Purple
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-stone-500">Daily Journal</h3>
                        <p className="text-xl font-black">{date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8 overflow-y-auto">
                    {/* Mood Selector */}
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-stone-400">How did today go?</label>
                        <div className="flex justify-between gap-1">
                            {MOODS.map((m) => {
                                const isSelected = mood === m.value;
                                const Icon = m.icon;
                                return (
                                    <button
                                        key={m.value}
                                        onClick={() => setMood(m.value)}
                                        className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${isSelected ? 'bg-stone-100 scale-110 shadow-inner' : 'hover:bg-stone-50 hover:scale-105'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-full transition-colors ${isSelected ? 'text-white' : 'text-stone-300'}`}
                                            style={{ backgroundColor: isSelected ? m.color : 'transparent' }}>
                                            <Icon size={24} strokeWidth={isSelected ? 2.5 : 2} />
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-stone-800' : 'text-stone-300'}`}>
                                            {m.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Journal Entry */}
                    <div className="space-y-3 flex-1">
                        <label className="text-xs font-black uppercase tracking-widest text-stone-400">Notes & Reflections</label>
                        <textarea
                            value={journal}
                            onChange={(e) => setJournal(e.target.value)}
                            placeholder="Write about your day..."
                            className="w-full h-40 p-4 bg-stone-50 border-2 border-transparent focus:border-black rounded-xl resize-none text-sm leading-relaxed placeholder:text-stone-300 outline-none transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-stone-100 flex justify-end gap-2 bg-stone-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-stone-500 hover:bg-stone-200 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-stone-800 transition-transform active:scale-95 flex items-center gap-2"
                        style={{ backgroundColor: theme.primary }}
                    >
                        <Save size={14} />
                        Save Entry
                    </button>
                </div>
            </div>
        </div>
    );
};
