import React from 'react';
import { Bot, AlertTriangle } from 'lucide-react';

interface AiDisclaimerModalProps {
    isOpen: boolean;
    onAccept: () => void;
    themePrimary: string;
}

export const AiDisclaimerModal: React.FC<AiDisclaimerModalProps> = ({ isOpen, onAccept, themePrimary }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm">
            <div
                className="bg-white neo-border neo-shadow rounded-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            >
                <div className="h-[3px]" style={{ backgroundColor: themePrimary }} />
                <div className="px-4 py-3 border-b-[2px] border-black flex items-center gap-2 shrink-0">
                    <Bot size={16} />
                    <p className="text-sm font-black uppercase tracking-wide">Before you chat with AI Coach</p>
                </div>

                <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-2 p-2.5 rounded-lg border-2 border-amber-300 bg-amber-50">
                        <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-medium text-amber-800 leading-snug">
                            AI Coach can occasionally get things wrong, be slow, or be temporarily unavailable —
                            it's a fun nudge, not professional advice.
                        </p>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-snug">
                        Your habit names, completion history, and chat messages are sent to a third-party AI
                        service to generate responses. Don't share anything sensitive in the chat.
                    </p>
                    <button
                        onClick={onAccept}
                        className="mt-1 w-full py-2.5 rounded-xl border-2 border-black text-sm font-black uppercase tracking-wide text-white transition-all duration-100 active:translate-x-[1px] active:translate-y-[1px]"
                        style={{ backgroundColor: themePrimary, boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}
                    >
                        I understand, continue
                    </button>
                </div>
            </div>
        </div>
    );
};
