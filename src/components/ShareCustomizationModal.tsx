import React, { useState } from 'react';
import { X, Share2 } from 'lucide-react';

export interface ColorScheme {
    name: string;
    primary: string;
    secondary: string;
    gradient?: boolean;
}

export const COLOR_SCHEMES: ColorScheme[] = [
    { name: 'Classic', primary: '#000000', secondary: '#000000' },
    { name: 'Vibrant', primary: '#8B5CF6', secondary: '#EC4899', gradient: true },
    { name: 'Energy', primary: '#F59E0B', secondary: '#EF4444', gradient: true },
    { name: 'Ocean', primary: '#3B82F6', secondary: '#06B6D4', gradient: true },
    { name: 'Forest', primary: '#10B981', secondary: '#059669', gradient: true },
];

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
    const [selectedColorScheme, setSelectedColorScheme] = useState<ColorScheme>(COLOR_SCHEMES[0]);
    const [selectedMessage, setSelectedMessage] = useState<string>(MOTIVATIONAL_MESSAGES[0]);

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
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {COLOR_SCHEMES.map((scheme) => (
                                <button
                                    key={scheme.name}
                                    onClick={() => setSelectedColorScheme(scheme)}
                                    className={`border-[2px] border-black p-3 transition-all ${selectedColorScheme.name === scheme.name
                                        ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                                        : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
                                        }`}
                                >
                                    <div
                                        className="w-full h-16 mb-2 border-[2px] border-black"
                                        style={{
                                            background: scheme.gradient
                                                ? `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary})`
                                                : scheme.primary
                                        }}
                                    />
                                    <span className="text-[10px] font-black uppercase tracking-tight">{scheme.name}</span>
                                </button>
                            ))}
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
                        <div className="bg-stone-100 p-4 border-[2px] border-black">
                            {/* Mini share card preview */}
                            <div className="bg-white border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-xs mx-auto">
                                {/* Header */}
                                <div
                                    className="p-4 border-b-[2px] border-black"
                                    style={{
                                        background: selectedColorScheme.gradient
                                            ? `linear-gradient(135deg, ${selectedColorScheme.primary}, ${selectedColorScheme.secondary})`
                                            : selectedColorScheme.primary
                                    }}
                                >
                                    <div className="text-white font-black text-sm uppercase tracking-widest text-center">MONDAY</div>
                                    <div className="text-white/80 font-bold text-[8px] tracking-widest text-center mt-1">01.01.2025</div>
                                </div>

                                {/* Progress Circle */}
                                <div className="p-6 flex flex-col items-center bg-stone-50/50">
                                    <div className="relative w-20 h-20">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="40"
                                                cy="40"
                                                r="32"
                                                stroke="#f0f0f0"
                                                strokeWidth="6"
                                                fill="transparent"
                                            />
                                            <circle
                                                cx="40"
                                                cy="40"
                                                r="32"
                                                stroke={selectedColorScheme.gradient ? selectedColorScheme.primary : selectedColorScheme.primary}
                                                strokeWidth="6"
                                                fill="transparent"
                                                strokeDasharray={2 * Math.PI * 32}
                                                strokeDashoffset={2 * Math.PI * 32 * 0.25}
                                                strokeLinecap="round"
                                                style={{
                                                    stroke: selectedColorScheme.gradient
                                                        ? `url(#previewGradient)`
                                                        : selectedColorScheme.primary
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
                                            <span className="text-lg font-black">100%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="px-4 pb-3 text-center bg-stone-50/50">
                                    <div className="text-xs font-black uppercase mb-1">5/5 HABITS</div>
                                    <div
                                        className="text-sm font-black uppercase"
                                        style={{
                                            background: selectedColorScheme.gradient
                                                ? `linear-gradient(135deg, ${selectedColorScheme.primary}, ${selectedColorScheme.secondary})`
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
                                <div className="px-4 pb-4 text-center bg-stone-50/50">
                                    <div className="text-xs font-black uppercase text-stone-600">{selectedMessage}</div>
                                </div>

                                {/* Footer */}
                                <div className="border-t-[2px] border-black p-2 bg-white">
                                    <div className="text-[8px] font-black uppercase text-stone-400 text-center tracking-widest">HABIT TRACKER</div>
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
