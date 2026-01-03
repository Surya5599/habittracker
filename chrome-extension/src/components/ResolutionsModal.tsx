import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, Target, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { MonthlyGoal } from '../types';
import { generateUUID } from '../utils/uuid';

interface ResolutionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentResolutions: MonthlyGoal[];
    onSave: (resolutions: MonthlyGoal[]) => void;
    year: number;
}

export const ResolutionsModal: React.FC<ResolutionsModalProps> = ({
    isOpen,
    onClose,
    currentResolutions,
    onSave,
    year
}) => {
    // State now stores full objects to track locked status
    const [resolutions, setResolutions] = useState<{ text: string, locked: boolean }[]>(
        Array(5).fill({ text: '', locked: false })
    );

    const [pendingLockIdx, setPendingLockIdx] = useState<number | null>(null);

    // Close tooltip when clicking outside - handled by global click listener or just simple "cancel" button
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as Element).closest('.lock-tooltip-container') && !(e.target as Element).closest('.lock-trigger-btn')) {
                setPendingLockIdx(null);
            }
        };
        if (pendingLockIdx !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [pendingLockIdx]);

    useEffect(() => {
        if (isOpen) {
            const initialRes = Array(5).fill({ text: '', locked: false }).map(() => ({ text: '', locked: false }));
            if (currentResolutions && currentResolutions.length > 0) {
                currentResolutions.slice(0, 5).forEach((res, idx) => {
                    initialRes[idx] = { text: res.text, locked: res.locked || false };
                });
            }
            setResolutions(initialRes);
        }
    }, [isOpen, currentResolutions]);

    if (!isOpen) return null;

    const handleSave = () => {
        const newGoals: MonthlyGoal[] = resolutions.map((res, idx) => {
            const existing = currentResolutions[idx];
            return {
                id: existing ? existing.id : generateUUID(),
                text: res.text,
                completed: existing ? existing.completed : false,
                locked: res.locked
            };
        }).filter(r => r.text.trim() !== '');

        onSave(newGoals);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md flex flex-col relative animate-in slide-in-from-bottom-4 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-stone-400 hover:text-black transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6 border-b border-stone-100 bg-stone-50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-sm border border-amber-200">
                            <Sparkles size={20} />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-tight">{year} Resolutions</h2>
                    </div>
                    <p className="text-sm text-stone-500 font-medium leading-relaxed">
                        Define your 5 core pillars for {year}. These are not just tasks, but the identity you are building. Keep them actionable and meaningful.
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    {resolutions.map((res, idx) => (
                        <div key={idx} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase text-stone-400 tracking-wider flex items-center gap-1.5">
                                    <Target size={10} /> Resolution #{idx + 1}
                                </label>
                                {res.text.trim() && (
                                    <div className="relative">
                                        <button
                                            onClick={() => {
                                                if (res.locked) return;
                                                setPendingLockIdx(pendingLockIdx === idx ? null : idx);
                                            }}
                                            className={`lock-trigger-btn text-[10px] uppercase font-bold flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${res.locked ? 'text-amber-600 bg-amber-50 cursor-default' : 'text-stone-300 hover:text-black hover:bg-stone-100'}`}
                                            title={res.locked ? "Locked for the year" : "Lock this resolution"}
                                        >
                                            {res.locked ? <Lock size={10} /> : <Unlock size={10} />}
                                            {res.locked ? 'Locked' : 'Lock'}
                                        </button>

                                        {/* Integrated Tooltip Confirmation */}
                                        {pendingLockIdx === idx && (
                                            <div className="lock-tooltip-container absolute bottom-full right-0 mb-2 w-64 bg-black text-white p-4 rounded-sm shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                                                <div className="absolute bottom-[-6px] right-3 w-3 h-3 bg-black rotate-45"></div>
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="p-1.5 bg-amber-500/20 text-amber-500 rounded-sm shrink-0">
                                                        <AlertTriangle size={16} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm uppercase tracking-wide text-amber-500 mb-1">Lock of Promise</h4>
                                                        <p className="text-[11px] leading-relaxed text-stone-300">
                                                            Are you sure? This resolution will be <strong>locked until the end of the year</strong>. This is a promise to yourself that cannot be edited.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 justify-end">
                                                    <button
                                                        onClick={() => setPendingLockIdx(null)}
                                                        className="px-3 py-1.5 text-[10px] font-bold uppercase text-stone-400 hover:text-white transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const newRes = [...resolutions];
                                                            newRes[idx] = { ...newRes[idx], locked: true };
                                                            setResolutions(newRes);
                                                            setPendingLockIdx(null);
                                                        }}
                                                        className="bg-amber-500 text-black px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-amber-400 transition-colors"
                                                    >
                                                        Yes, Lock It
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={res.text}
                                    onChange={(e) => {
                                        if (res.locked) return;
                                        const newRes = [...resolutions];
                                        newRes[idx] = { ...newRes[idx], text: e.target.value };
                                        setResolutions(newRes);
                                    }}
                                    disabled={res.locked}
                                    placeholder={`Enter resolution #${idx + 1}...`}
                                    className={`w-full border p-3 text-sm font-bold transition-all rounded-sm ${res.locked
                                        ? 'bg-amber-50/50 border-amber-200 text-stone-600 italic select-none'
                                        : 'bg-stone-50 border-stone-200 text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-200'
                                        }`}
                                />
                                {res.locked && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500/50 pointer-events-none">
                                        <Lock size={14} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-black text-white px-6 py-3 font-black uppercase text-sm tracking-wider hover:bg-stone-800 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                    >
                        <Save size={16} /> Save Resolutions
                    </button>
                </div>
            </div>
        </div>
    );
};
