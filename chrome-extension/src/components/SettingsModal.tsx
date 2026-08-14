import React, { useState } from 'react';
import { X, Settings, Check } from 'lucide-react';
import { THEMES } from '../constants';
import { Theme } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTheme: Theme;
    onSelectTheme: (theme: Theme) => void;
    cardStyle: 'compact' | 'large';
    onCardStyleChange: (style: 'compact' | 'large') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    currentTheme,
    onSelectTheme,
    cardStyle,
    onCardStyleChange,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-scrim flex items-center justify-center z-dropdown p-4" onClick={onClose}>
            <div
                className="bg-surface border-3 border-edge-strong shadow-neo-lg max-w-sm w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-surface-inverse text-ink-inverse p-4 flex items-center justify-between border-b-3 border-edge-strong">
                    <div className="flex items-center gap-2">
                        <Settings size={20} />
                        <h2 className="font-black uppercase tracking-widest text-sm">Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:bg-surface/20 p-1 rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Card View */}
                    <div className="mb-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-ink-muted mb-3">Card View</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {(['compact', 'large'] as const).map((style) => (
                                <button
                                    key={style}
                                    onClick={() => onCardStyleChange(style)}
                                    className={`px-4 py-3 flex flex-col items-center gap-1 border-2 transition-all ${cardStyle === style
                                        ? 'border-edge-strong bg-surface-muted shadow-neo-sm translate-x-[2px] translate-y-[2px]'
                                        : 'border-edge hover:border-edge-strong hover:shadow-neo-sm hover:-translate-y-0.5'
                                    }`}
                                >
                                    {/* Mini preview */}
                                    <div className="w-10 h-7 border border-edge-muted rounded overflow-hidden flex flex-col">
                                        <div className="h-2 bg-surface-inverse-hover w-full" />
                                        {style === 'compact' ? (
                                            <div className="flex-1 flex items-center px-1 gap-0.5">
                                                <div className="flex-1 h-0.5 bg-edge rounded" />
                                                <div className="w-2.5 h-2.5 rounded-full border border-edge-muted" />
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center">
                                                <div className="w-3 h-3 rounded-full border border-edge-muted" />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${cardStyle === style ? 'text-ink-strong' : 'text-ink-muted'}`}>
                                        {style}
                                    </span>
                                    {cardStyle === style && <Check size={12} className="text-ink-strong" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-ink-muted mb-3">Theme Selection</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {THEMES.map((theme) => (
                                <button
                                    key={theme.name}
                                    onClick={() => onSelectTheme(theme)}
                                    className={`w-full px-4 py-3 flex items-center justify-between border-2 transition-all ${currentTheme.name === theme.name
                                        ? 'border-edge-strong bg-surface-muted shadow-neo-sm translate-x-[2px] translate-y-[2px]'
                                        : 'border-edge hover:border-edge-strong hover:shadow-neo-sm hover:-translate-y-0.5'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-6 h-6 border border-edge-strong rounded-full"
                                            style={{
                                                background: `linear-gradient(45deg, ${theme.primary} 50%, ${theme.secondary} 50%)`
                                            }}
                                        />
                                        <span className={`text-xs font-black uppercase tracking-widest ${currentTheme.name === theme.name ? 'text-ink-strong' : 'text-ink'}`}>
                                            {theme.name}
                                        </span>
                                    </div>
                                    {currentTheme.name === theme.name && (
                                        <Check size={16} className="text-ink-strong" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t-3 border-edge-strong p-4 bg-surface-muted">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 border-2 border-edge-strong bg-surface-inverse text-ink-inverse font-black uppercase tracking-widest text-xs shadow-neo-sm hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        Done
                    </button>
                    <div className="mt-4 text-center">
                        <a
                            href="https://habicard.com/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-ink-muted hover:text-ink-strong underline uppercase tracking-widest font-bold"
                        >
                            Privacy Policy
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
