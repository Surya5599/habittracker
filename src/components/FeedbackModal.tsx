import React, { useState } from 'react';
import { X, MessageSquare, Bug, Send } from 'lucide-react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, userId }) => {
    const [type, setType] = useState<'bug' | 'suggestion'>('bug');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            toast.error('Please enter your feedback');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('feedback')
                .insert({
                    user_id: userId || null,
                    type,
                    content,
                    metadata: {
                        url: window.location.href,
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    }
                });

            if (error) throw error;

            toast.success('Thank you for your feedback!');
            setContent('');
            onClose();
        } catch (err) {
            console.error('Error submitting feedback:', err);
            toast.error('Failed to submit feedback. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white neo-border neo-shadow w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b-2 border-black bg-stone-50">
                    <div className="flex items-center gap-2">
                        <MessageSquare size={18} className="text-black" />
                        <h2 className="text-lg font-black uppercase tracking-tight">Feedback</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-stone-200 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-stone-500 mb-2 block">Feedback Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setType('bug')}
                                className={`flex items-center justify-center gap-2 py-2 neo-border transition-all ${type === 'bug' ? 'bg-black text-white' : 'bg-white text-stone-600 hover:border-stone-400'}`}
                            >
                                <Bug size={14} />
                                <span className="text-xs font-bold uppercase">Bug Report</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('suggestion')}
                                className={`flex items-center justify-center gap-2 py-2 neo-border transition-all ${type === 'suggestion' ? 'bg-black text-white' : 'bg-white text-stone-600 hover:border-stone-400'}`}
                            >
                                <MessageSquare size={14} />
                                <span className="text-xs font-bold uppercase">Suggestion</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-stone-500 mb-2 block">Your Message</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={type === 'bug' ? "Describe clinical details of the bug..." : "Tell us what feature you'd like to see!"}
                            className="w-full h-32 p-3 neo-border focus:ring-0 focus:outline-none text-sm font-medium resize-none placeholder:text-stone-300"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-black text-white neo-border neo-shadow font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {submitting ? 'Submitting...' : 'Send Feedback'}
                        <Send size={14} />
                    </button>
                </form>
            </div>
        </div>
    );
};
