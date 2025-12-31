import React, { useState } from 'react';
import { X, Share2, ChevronDown } from 'lucide-react';
import { THEMES } from '../constants';

export interface ColorScheme {
    name: string;
    primary: string;
    secondary: string;
    gradient?: boolean;
}

export const MOTIVATIONAL_MESSAGES = [
    '🔥 CRUSHING IT!',
    '💪 UNSTOPPABLE!',
    '⚡ ON FIRE!',
    '🎯 PERFECT DAY!',
    '✨ LEGENDARY!',
    '🚀 BEAST MODE!',
    '💎 FLAWLESS!',
    '🏆 CHAMPION!',
];

interface ShareCustomizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onShare: (colorScheme: ColorScheme, message: string) => void;
}

export const ShareCustomizationModal: React.FC<ShareCustomizationModalProps> = ({
    isOpen,
    onClose,
    onShare,
}) => {
    const [selectedColorScheme, setSelectedColorScheme] = useState<ColorScheme>(THEMES[0]);

    // Initialize with a random message
    const [selectedMessage, setSelectedMessage] = useState<string>(() => {
        const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
        return MOTIVATIONAL_MESSAGES[randomIndex];
    });

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    if (!isOpen) return null;

    const handleShare = () => {
        onShare(selectedColorScheme, selectedMessage);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-black text-white p-4 flex items-center justify-between border-b-[3px] border-black">
                    <div className="flex items-center gap-2">
                        <Share2 size={20} />
                        <h2 className="font-black uppercase tracking-widest text-sm">Customize Share Card</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:bg-white/20 p-1 rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Color Schemes */}
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3">Color Scheme</h3>
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full bg-white border-[2px] border-black px-4 py-3 flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-5 h-5 border border-black"
                                        style={{
                                            backgroundColor: selectedColorScheme.primary
                                        }}
                                    />
                                    <span className="text-xs font-black uppercase tracking-widest">{selectedColorScheme.name.split(' & ')[0]}</span>
                                </div>
                                <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                    <div className="absolute top-full left-0 right-0 z-20 bg-white border-[2px] border-black border-t-0 max-h-60 overflow-y-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        {THEMES.map((scheme) => (
                                            <button
                                                key={scheme.name}
                                                onClick={() => {
                                                    setSelectedColorScheme(scheme);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-0"
                                            >
                                                <div
                                                    className="w-5 h-5 border border-black flex-shrink-0"
                                                    style={{
                                                        backgroundColor: scheme.primary
                                                    }}
                                                />
                                                <span className="text-xs font-black uppercase tracking-widest text-left">{scheme.name.split(' & ')[0]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Motivational Messages */}
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3">Motivational Message</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {MOTIVATIONAL_MESSAGES.map((message) => (
                                <button
                                    key={message}
                                    onClick={() => setSelectedMessage(message)}
                                    className={`border-[2px] border-black px-3 py-2 text-[11px] font-black uppercase tracking-tight transition-all ${selectedMessage === message
                                        ? 'bg-black text-white shadow-none translate-y-0.5'
                                        : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
                                        }`}
                                >
                                    {message}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="border-t-[2px] border-stone-200 pt-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3">Preview</h3>
                        <div className="bg-stone-100 p-4 border-[2px] border-black flex justify-center">
                            {/* Share card preview - Scaled down version of generated card */}
                            <div className="bg-white border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-[240px] aspect-[800/1120] relative flex flex-col font-sans">
                                {/* Header */}
                                <div
                                    className="h-[40px] border-b-[2px] border-black flex flex-col items-center justify-center -space-y-0.5"
                                    style={{
                                        background: selectedColorScheme.gradient
                                            ? `linear-gradient(90deg, ${selectedColorScheme.primary}, ${selectedColorScheme.secondary})`
                                            : selectedColorScheme.primary
                                    }}
                                >
                                    {/* Using Arial to match canvas */}
                                    <div className="text-white font-bold text-[16px] uppercase tracking-wider" style={{ fontFamily: 'Arial' }}>MONDAY</div>
                                    <div className="text-white/80 font-bold text-[8px] tracking-widest" style={{ fontFamily: 'Arial' }}>01.01.2025</div>
                                </div>

                                {/* Body */}
                                <div className="flex-1 flex flex-col items-center pt-8">
                                    {/* Circle */}
                                    <div className="relative w-[80px] h-[80px] mb-8">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="40"
                                                cy="40"
                                                r="34"
                                                stroke="#f0f0f0"
                                                strokeWidth="6"
                                                fill="transparent"
                                            />
                                            <circle
                                                cx="40"
                                                cy="40"
                                                r="34"
                                                stroke={selectedColorScheme.primary}
                                                strokeWidth="6"
                                                fill="transparent"
                                                strokeDasharray={2 * Math.PI * 34}
                                                strokeDashoffset={2 * Math.PI * 34 * 0} // 100%
                                                strokeLinecap="round"
                                                style={{
                                                    stroke: selectedColorScheme.gradient ? 'url(#previewGradient)' : selectedColorScheme.primary
                                                }}
                                            />
                                            {selectedColorScheme.gradient && (
                                                <defs>
                                                    <linearGradient id="previewGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor={selectedColorScheme.primary} />
                                                        <stop offset="100%" stopColor={selectedColorScheme.secondary} />
                                                    </linearGradient>
                                                </defs>
                                            )}
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-xl font-bold" style={{ fontFamily: 'Arial' }}>100%</span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="text-center font-bold" style={{ fontFamily: 'Arial' }}>
                                        <div className="text-[10px] mb-1">5/5 HABITS</div>
                                        <div
                                            className="text-[12px] uppercase"
                                            style={{
                                                background: selectedColorScheme.gradient
                                                    ? `linear-gradient(90deg, ${selectedColorScheme.primary}, ${selectedColorScheme.secondary})`
                                                    : selectedColorScheme.primary,
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: selectedColorScheme.gradient ? 'transparent' : selectedColorScheme.primary,
                                                backgroundClip: 'text'
                                            }}
                                        >
                                            COMPLETED
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div className="mt-6 px-4 text-center">
                                        <div className="text-[11px] font-bold text-[#444] uppercase leading-tight" style={{ fontFamily: 'Arial' }}>{selectedMessage}</div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="absolute bottom-4 left-0 right-0 text-center">
                                    <div className="text-[7px] font-bold uppercase text-[#999999] tracking-widest" style={{ fontFamily: 'Arial' }}>HABICARD</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t-[3px] border-black p-4 flex gap-3 bg-stone-50">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border-[2px] border-black bg-white text-black font-black uppercase tracking-widest text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex-1 px-4 py-3 border-[2px] border-black bg-black text-white font-black uppercase tracking-widest text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        <Share2 size={14} />
                        Share Now
                    </button>
                </div>
            </div>
        </div>
    );
};
