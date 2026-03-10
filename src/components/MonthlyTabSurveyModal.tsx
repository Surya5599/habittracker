import React, { useState } from 'react';
import { X, BarChart2 } from 'lucide-react';

interface MonthlyTabSurveyModalProps {
    isOpen: boolean;
    submitting?: boolean;
    onClose: () => void;
    onSubmit: (payload: { answer: 'often' | 'sometimes' | 'never' }) => Promise<void> | void;
}

const OPTIONS: Array<{ id: 'often' | 'sometimes' | 'never'; title: string; subtitle: string }> = [
    { id: 'often', title: 'Often', subtitle: 'I use it regularly.' },
    { id: 'sometimes', title: 'Sometimes', subtitle: 'I check it now and then.' },
    { id: 'never', title: 'Never', subtitle: 'I do not use it.' }
];

export const MonthlyTabSurveyModal: React.FC<MonthlyTabSurveyModalProps> = ({
    isOpen,
    submitting = false,
    onClose,
    onSubmit
}) => {
    const [selectedAnswer, setSelectedAnswer] = useState<'often' | 'sometimes' | 'never' | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!selectedAnswer || submitting) return;
        await onSubmit({
            answer: selectedAnswer
        });
        setSelectedAnswer(null);
    };

    const handleClose = () => {
        if (submitting) return;
        setSelectedAnswer(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-3 sm:items-center sm:p-4 bg-black/35 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col">
                <div className="flex items-start justify-between gap-3 border-b-2 border-black bg-stone-50 p-3">
                    <div className="min-w-0">
                        <div className="mb-2 inline-flex h-7 w-7 items-center justify-center border-2 border-black bg-amber-100 text-black">
                            <BarChart2 size={16} strokeWidth={2.8} />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-tight text-black">Quick Survey</h2>
                        <p className="mt-1 text-xs font-semibold leading-snug text-stone-600">
                            Do you use the monthly tab?
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded border-2 border-transparent p-1 text-black transition-colors hover:border-black hover:bg-white"
                        disabled={submitting}
                    >
                        <X size={18} strokeWidth={3} />
                    </button>
                </div>

                <div className="p-3 space-y-2">
                        {OPTIONS.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setSelectedAnswer(option.id)}
                                className={`w-full border-2 p-2.5 text-left transition-all ${selectedAnswer === option.id
                                    ? 'border-black bg-black text-white shadow-[3px_3px_0px_0px_rgba(251,191,36,1)]'
                                    : 'border-stone-200 bg-white text-stone-700 hover:border-black hover:bg-stone-50'
                                    }`}
                            >
                                <div className="text-xs font-black uppercase tracking-wide">{option.title}</div>
                                <div className={`mt-1 text-[11px] font-semibold ${selectedAnswer === option.id ? 'text-white/80' : 'text-stone-500'}`}>
                                    {option.subtitle}
                                </div>
                            </button>
                        ))}
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-stone-200 bg-white p-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="w-full border-2 border-black bg-white py-2 text-[10px] font-black uppercase tracking-widest text-black transition-colors hover:bg-stone-50 disabled:opacity-50"
                    >
                        Skip
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!selectedAnswer || submitting}
                        className="w-full border-2 border-black bg-black py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0px_0px_rgba(251,191,36,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(251,191,36,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-50 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none"
                    >
                        {submitting ? 'Saving...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};
