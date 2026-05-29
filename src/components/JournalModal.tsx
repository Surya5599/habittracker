import React, { useState, useEffect } from 'react';
import { X, Save, Meh, Frown, Smile, Laugh, Star, BookOpen } from 'lucide-react';
import { DayData, Theme } from '../types';

interface JournalModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    initialData: DayData;
    onSave: (data: Partial<DayData>) => void;
    theme: Theme;
}

const normalizeJournal = (j: DayData['journal']): string => {
    if (!j) return '';
    if (Array.isArray(j)) return j.map((e: any) => (typeof e === 'string' ? e : e?.text || '')).filter(Boolean).join('\n\n');
    return String(j);
};

const LINE_HEIGHT = 28; // px — matches leading-7 (1.75rem ≈ 28px at 16px base)
const RULED_LINES = `repeating-linear-gradient(
    to bottom,
    transparent,
    transparent ${LINE_HEIGHT - 1}px,
    #e2ddd6 ${LINE_HEIGHT - 1}px,
    #e2ddd6 ${LINE_HEIGHT}px
)`;

export const JournalModal: React.FC<JournalModalProps> = ({
    isOpen,
    onClose,
    date,
    initialData,
    onSave,
    theme,
}) => {
    const [mood, setMood] = useState<number | undefined>(initialData.mood);
    const [journal, setJournal] = useState(() => normalizeJournal(initialData.journal));

    useEffect(() => {
        if (isOpen) {
            setMood(initialData.mood);
            setJournal(normalizeJournal(initialData.journal));
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({ mood, journal });
        onClose();
    };

    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateLabel = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const MOODS = [
        { value: 1, icon: Frown,  label: 'Rough',   color: '#ef4444' },
        { value: 2, icon: Meh,    label: 'Okay',    color: '#f59e0b' },
        { value: 3, icon: Smile,  label: 'Good',    color: '#84cc16' },
        { value: 4, icon: Laugh,  label: 'Great',   color: '#10b981' },
        { value: 5, icon: Star,   label: 'Amazing', color: '#8b5cf6' },
    ];

    const selectedMood = MOODS.find(m => m.value === mood);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="neo-border neo-shadow w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
                style={{ backgroundColor: 'var(--card-bg-soft, #fdfdf8)', borderRadius: '4px' }}
            >
                {/* Page header — cream with ruled underline */}
                <div className="relative flex items-start justify-between px-6 pt-5 pb-0" style={{ backgroundColor: 'var(--card-bg-soft, #fdfdf8)' }}>
                    {/* Left margin line */}
                    <div className="absolute left-14 top-0 bottom-0 w-px" style={{ backgroundColor: theme.primary + '55' }} />

                    {/* BookOpen icon in margin */}
                    <div className="w-8 shrink-0 flex items-start justify-center pt-1 mr-0 z-10">
                        <BookOpen size={15} style={{ color: theme.primary }} strokeWidth={2} />
                    </div>

                    {/* Date header */}
                    <div className="flex-1 pl-4 pb-3 border-b-2 border-stone-200">
                        <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-stone-400">{dayName}</p>
                        <h3 className="font-serif text-2xl font-black text-stone-800 leading-tight mt-0.5">{dateLabel}</h3>
                        {selectedMood && (
                            <span
                                className="inline-flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: selectedMood.color + '22', color: selectedMood.color }}
                            >
                                {selectedMood.label}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="ml-3 mt-1 p-1.5 rounded-full text-stone-400 hover:text-black hover:bg-stone-100 transition-colors shrink-0"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--card-bg-soft, #fdfdf8)' }}>
                    {/* Mood row */}
                    <div className="relative flex items-center px-6 py-3 border-b border-stone-200">
                        <div className="absolute left-14 top-0 bottom-0 w-px" style={{ backgroundColor: theme.primary + '55' }} />
                        <div className="w-8 shrink-0 mr-0">
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-300 text-center leading-tight">Mood</p>
                        </div>
                        <div className="flex gap-2 pl-4">
                            {MOODS.map((m) => {
                                const isSelected = mood === m.value;
                                const Icon = m.icon;
                                return (
                                    <button
                                        key={m.value}
                                        onClick={() => setMood(isSelected ? undefined : m.value)}
                                        title={m.label}
                                        className={`flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl border-2 transition-all ${
                                            isSelected
                                                ? 'border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                                                : 'border-stone-200 hover:border-stone-400'
                                        }`}
                                        style={isSelected ? { backgroundColor: m.color + '18' } : {}}
                                    >
                                        <Icon
                                            size={20}
                                            strokeWidth={isSelected ? 2.5 : 1.8}
                                            style={{ color: isSelected ? m.color : '#d4cfc9' }}
                                        />
                                        <span
                                            className="text-[8px] font-black uppercase tracking-wider leading-none"
                                            style={{ color: isSelected ? '#1c1917' : '#d4cfc9' }}
                                        >
                                            {m.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Ruled writing area */}
                    <div className="relative">
                        {/* Margin line continues */}
                        <div className="absolute left-14 top-0 bottom-0 w-px z-10" style={{ backgroundColor: theme.primary + '55' }} />

                        {/* Line number gutter */}
                        <div className="absolute left-0 top-0 bottom-0 w-14 flex flex-col pt-[14px]" aria-hidden>
                            {Array.from({ length: 14 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="text-right pr-3 text-[9px] font-mono text-stone-300 select-none shrink-0"
                                    style={{ height: `${LINE_HEIGHT}px`, lineHeight: `${LINE_HEIGHT}px` }}
                                >
                                    {i + 1}
                                </div>
                            ))}
                        </div>

                        <textarea
                            value={journal}
                            onChange={(e) => setJournal(e.target.value)}
                            placeholder="Write about your day…"
                            autoFocus
                            className="w-full pl-[72px] pr-5 pt-[14px] pb-8 resize-none outline-none font-serif text-[15px] text-stone-800 placeholder:text-stone-300"
                            style={{
                                backgroundColor: 'transparent',
                                backgroundImage: RULED_LINES,
                                backgroundPositionY: '20px',
                                lineHeight: `${LINE_HEIGHT}px`,
                                minHeight: `${LINE_HEIGHT * 14 + 14}px`,
                                caretColor: theme.primary,
                            }}
                            rows={14}
                        />
                    </div>
                </div>

                {/* Footer — ruled line + stamp-style save */}
                <div
                    className="flex items-center justify-between px-6 py-3 border-t-2 border-stone-200"
                    style={{ backgroundColor: 'var(--card-bg-soft, #fdfdf8)' }}
                >
                    <p className="text-[9px] font-bold text-stone-300 uppercase tracking-widest">
                        {journal.trim().split(/\s+/).filter(Boolean).length} words
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-black transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-1.5 px-4 py-2 text-white text-[10px] font-black uppercase tracking-widest border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all"
                            style={{ backgroundColor: theme.primary }}
                        >
                            <Save size={12} strokeWidth={3} />
                            Save entry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
