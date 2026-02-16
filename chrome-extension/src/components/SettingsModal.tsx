import React, { useState } from 'react';
import { X, Settings, Check } from 'lucide-react';
import { THEMES } from '../constants';
import { Theme } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTheme: Theme;
    onSelectTheme: (theme: Theme) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    currentTheme,
    onSelectTheme,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div
                className="bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-black text-white p-4 flex items-center justify-between border-b-[3px] border-black">
                    <div className="flex items-center gap-2">
                        <Settings size={20} />
                        <h2 className="font-black uppercase tracking-widest text-sm">Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:bg-white/20 p-1 rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3">Theme Selection</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {THEMES.map((theme) => (
                                <button
                                    key={theme.name}
                                    onClick={() => onSelectTheme(theme)}
                                    className={`w-full px-4 py-3 flex items-center justify-between border-[2px] transition-all ${currentTheme.name === theme.name
                                        ? 'border-black bg-stone-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[2px] translate-y-[2px]'
                                        : 'border-stone-200 hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-6 h-6 border border-black rounded-full"
                                            style={{
                                                background: `linear-gradient(45deg, ${theme.primary} 50%, ${theme.secondary} 50%)`
                                            }}
                                        />
                                        <span className={`text-xs font-black uppercase tracking-widest ${currentTheme.name === theme.name ? 'text-black' : 'text-stone-600'}`}>
                                            {theme.name}
                                        </span>
                                    </div>
                                    {currentTheme.name === theme.name && (
                                        <Check size={16} className="text-black" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t-[3px] border-black p-4 bg-stone-50">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 border-[2px] border-black bg-black text-white font-black uppercase tracking-widest text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        Done
                    </button>
                    <div className="mt-4 text-center">
                        <a
                            href="https://habicard.com/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-stone-500 hover:text-black underline uppercase tracking-widest font-bold"
                        >
                            Privacy Policy
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
