import React from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';

interface FeatureAnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    image?: React.ReactNode;
}

export const FeatureAnnouncementModal: React.FC<FeatureAnnouncementModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    actionLabel,
    onAction,
    image
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm flex flex-col relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-black hover:bg-stone-100 p-1 border-2 border-transparent hover:border-black transition-all z-10"
                >
                    <X size={20} strokeWidth={3} />
                </button>

                <div className="p-6 pb-2">
                    <div className="w-12 h-12 bg-amber-100 border-2 border-black flex items-center justify-center mb-4 text-amber-600 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <Sparkles size={24} strokeWidth={3} />
                    </div>

                    <div className="inline-block px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-widest mb-3">
                        New Update
                    </div>

                    <h2 className="text-2xl font-black uppercase leading-none mb-3 tracking-tight">
                        {title}
                    </h2>

                    <p className="text-sm font-medium text-stone-600 leading-relaxed border-l-4 border-amber-300 pl-3">
                        {description}
                    </p>
                </div>

                {image && (
                    <div className="px-6 py-2">
                        {image}
                    </div>
                )}

                <div className="p-6 pt-4 flex flex-col gap-3">
                    {onAction && actionLabel && (
                        <button
                            onClick={onAction}
                            className="w-full py-3 bg-black text-white text-xs font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(251,191,36,1)] hover:shadow-[2px_2px_0px_0px_rgba(251,191,36,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 group"
                        >
                            {actionLabel} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className={`w-full py-3 bg-white text-black text-xs font-black uppercase tracking-widest border-2 border-black hover:bg-stone-50 transition-colors ${!onAction ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none' : ''}`}
                    >
                        {onAction ? 'Maybe Later' : 'Got it!'}
                    </button>
                </div>
            </div>
        </div>
    );
};
