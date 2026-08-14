import React, { useMemo, useState, useEffect } from 'react';
import { X, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface WhatsNewSlide {
    id: string;
    title: string;
    description: string;
    image?: React.ReactNode;
    bullets?: string[];
}

interface FeatureAnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    slides: WhatsNewSlide[];
    headerTitle?: string;
    headerDescription?: string;
    onFinish?: () => void;
}

export const FeatureAnnouncementModal: React.FC<FeatureAnnouncementModalProps> = ({
    isOpen,
    onClose,
    slides,
    headerTitle = "What's New",
    headerDescription = "Latest improvements and features.",
    onFinish
}) => {
    if (!isOpen) return null;
    const [activeIndex, setActiveIndex] = useState(0);
    const totalSlides = slides.length;

    useEffect(() => {
        if (isOpen) setActiveIndex(0);
    }, [isOpen]);

    const activeSlide = useMemo(() => slides[activeIndex], [slides, activeIndex]);
    const isLast = activeIndex === totalSlides - 1;

    const handleNext = () => {
        if (isLast) {
            onFinish?.();
            onClose();
            return;
        }
        setActiveIndex(prev => Math.min(prev + 1, totalSlides - 1));
    };

    const handlePrev = () => setActiveIndex(prev => Math.max(prev - 1, 0));
    const modalSizeClass = 'max-w-xl h-[min(92vh,780px)]';

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-scrim backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`bg-surface border-3 border-edge-strong shadow-neo rounded-modal w-full ${modalSizeClass} flex flex-col relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300`}>
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-ink-strong hover:bg-surface-strong p-1 border-2 border-transparent hover:border-edge-strong transition-all z-10"
                >
                    <X size={20} strokeWidth={3} />
                </button>

                <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="p-3 pb-1">
                        <div className="w-7 h-7 bg-amber-100 border-2 border-edge-strong flex items-center justify-center mb-2 text-amber-600">
                            <Sparkles size={14} strokeWidth={3} />
                        </div>

                        <div className="inline-block px-2 py-1 bg-surface-inverse text-ink-inverse text-[9px] font-black uppercase tracking-widest mb-2">
                            New Update • {activeIndex + 1}/{Math.max(totalSlides, 1)}
                        </div>

                        <h2 className="text-sm font-black uppercase leading-none mb-1 tracking-wide">
                            {headerTitle}
                        </h2>

                        <p className="text-[11px] font-semibold text-ink leading-snug">
                            {headerDescription}
                        </p>
                    </div>

                    <div className="px-4 pt-1">
                        <div className="border border-edge-muted bg-surface-muted p-3">
                            <h3 className="text-base font-black uppercase tracking-tight text-ink-strong">{activeSlide?.title}</h3>
                            <p className="mt-1.5 text-sm font-semibold text-ink leading-snug">{activeSlide?.description}</p>
                            {activeSlide?.bullets && activeSlide.bullets.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                    {activeSlide.bullets.map((bullet, idx) => (
                                        <li key={`${activeSlide.id}-bullet-${idx}`} className="text-xs font-semibold text-ink flex items-start gap-2">
                                            <span className="mt-1 inline-block w-1.5 h-1.5 bg-ink-muted rounded-full" />
                                            <span>{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {activeSlide?.image && (
                        <div className="px-4 py-2">
                            {activeSlide.image}
                        </div>
                    )}
                </div>

                <div className="p-4 pt-2 flex flex-col gap-2 border-t border-edge shrink-0 bg-surface">
                    <div className="flex items-center justify-center gap-1">
                        {slides.map((slide, idx) => (
                            <button
                                key={slide.id}
                                onClick={() => setActiveIndex(idx)}
                                className={`h-1.5 rounded-full transition-all ${idx === activeIndex ? 'w-6 bg-surface-inverse' : 'w-2 bg-surface-sunken hover:bg-ink-muted'}`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-[1fr_1fr] gap-2">
                        <button
                            onClick={handlePrev}
                            disabled={activeIndex === 0}
                            className="w-full py-2.5 bg-surface text-ink-strong text-[11px] font-black uppercase tracking-widest border-2 border-edge-strong hover:bg-surface-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <button
                            onClick={handleNext}
                            className="w-full py-2.5 bg-surface-inverse text-ink-inverse text-[11px] font-black uppercase tracking-widest border-2 border-edge-strong shadow-neo-accent hover:shadow-[1px_1px_0px_0px_rgba(251,191,36,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-1.5 group"
                        >
                            {isLast ? 'Done' : 'Next'} {isLast ? <Sparkles size={14} /> : <ChevronRight size={14} />}
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            onFinish?.();
                            onClose();
                        }}
                        className="w-full py-2.5 bg-surface text-ink-strong text-[11px] font-black uppercase tracking-widest border-2 border-edge-strong hover:bg-surface-muted transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
