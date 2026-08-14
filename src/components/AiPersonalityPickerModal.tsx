import React from 'react';
import { Bot } from 'lucide-react';
import { AI_COACH_PERSONALITIES, AiCoachPersonality, personalityAvatarUrl } from '../utils/aiCoachPrompt';

interface AiPersonalityPickerModalProps {
    isOpen: boolean;
    onSelect: (personality: AiCoachPersonality) => void;
    themePrimary: string;
}

export const AiPersonalityPickerModal: React.FC<AiPersonalityPickerModalProps> = ({ isOpen, onSelect, themePrimary }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-dialog flex items-center justify-center bg-scrim p-3 backdrop-blur-sm">
            <div
                className="bg-surface neo-border shadow-neo rounded-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                style={{ maxHeight: 'min(85vh, 640px)' }}
            >
                <div className="h-[3px]" style={{ backgroundColor: themePrimary }} />
                <div className="px-4 py-3 border-b-2 border-edge-strong flex items-center gap-2 shrink-0">
                    <Bot size={16} />
                    <div>
                        <p className="text-sm font-black uppercase tracking-wide">Which coach today?</p>
                        <p className="text-[10px] font-medium text-ink-muted">Same insights, different tone. You'll be asked again tomorrow.</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                    {AI_COACH_PERSONALITIES.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => onSelect(p.id)}
                            className="flex items-start gap-3 p-3 rounded-xl border-2 border-edge-strong text-left bg-surface hover:bg-surface-muted transition-all duration-100 active:translate-x-[1px] active:translate-y-[1px]"
                            style={{ boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}
                        >
                            <img
                                src={personalityAvatarUrl(p.id)}
                                alt={p.label}
                                className="w-12 h-12 rounded-full border-2 border-edge-strong shrink-0 bg-surface-strong"
                                loading="lazy"
                            />
                            <div className="min-w-0">
                                <span className="text-[12px] font-black text-ink-strong">{p.label}</span>
                                <p className="text-[11px] text-ink mt-1 leading-snug">{p.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
