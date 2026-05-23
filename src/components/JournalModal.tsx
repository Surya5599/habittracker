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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="neo-border neo-shadow bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-5 py-4 border-b-[3px] border-black flex items-center justify-between" style={{ backgroundColor: theme.primary }}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">Daily Journal</p>
                        <h3 className="font-serif text-xl font-black text-white leading-tight mt-0.5">
                            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full border-2 border-white/40 text-white hover:bg-white/20 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-6 overflow-y-auto">
                    {/* Mood Selector */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">How did today go?</label>
                        <div className="flex justify-between gap-1.5">
                            {MOODS.map((m) => {
                                const isSelected = mood === m.value;
                                const Icon = m.icon;
                                return (
                                    <button
                                        key={m.value}
                                        onClick={() => setMood(m.value)}
                                        className={`flex-1 flex flex-col items-center gap-2 py-3 transition-all border-2 rounded-xl ${isSelected ? 'border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5' : 'border-stone-200 hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]'}`}
                                        style={isSelected ? { backgroundColor: m.color + '22' } : {}}
                                    >
                                        <div className={`p-1.5 rounded-full transition-colors ${isSelected ? 'text-white' : 'text-stone-300'}`}
                                            style={{ backgroundColor: isSelected ? m.color : 'transparent' }}>
                                            <Icon size={22} strokeWidth={isSelected ? 2.5 : 2} />
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-wider ${isSelected ? 'text-stone-800' : 'text-stone-300'}`}>
                                            {m.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Journal Entry */}
                    <div className="space-y-2 flex-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">Notes & Reflections</label>
                        <textarea
                            value={journal}
                            onChange={(e) => setJournal(e.target.value)}
                            placeholder="Write about your day..."
                            className="w-full h-40 p-4 bg-stone-50 border-2 border-stone-200 focus:border-black rounded-xl resize-none text-sm leading-relaxed placeholder:text-stone-300 outline-none transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t-[3px] border-black flex justify-end gap-2 bg-stone-50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-stone-500 border-2 border-stone-200 hover:border-black rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2.5 text-white text-[11px] font-black uppercase tracking-widest border-2 border-black rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 flex items-center gap-2"
                        style={{ backgroundColor: theme.primary }}
                    >
                        <Save size={13} />
                        Save Entry
                    </button>
                </div>
            </div>
        </div>
    );
};
