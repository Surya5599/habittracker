
const ADMIN_EMAILS = ['knowheredeveloper@gmail.com']; // Replace with actual admin emails

import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Bug, Send, Clock, ChevronRight, User, Shield, Reply } from 'lucide-react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { Feedback, FeedbackReply } from '../types';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
    userEmail?: string;
    hasUnreadFeedback?: boolean;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, userId, userEmail, hasUnreadFeedback }) => {
    const [activeTab, setActiveTab] = useState<'new' | 'history' | 'admin'>('new');
    const [type, setType] = useState<'bug' | 'suggestion'>('bug');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // History & Thread State
    const [history, setHistory] = useState<Feedback[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedThread, setSelectedThread] = useState<Feedback | null>(null);
    const [replyContent, setReplyContent] = useState('');

    const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail);
    const threadEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset state on open
            setActiveTab('new');
            setSelectedThread(null);
            fetchHistory();
        }
    }, [isOpen, userId]);

    // Add this to auto-scroll when opening a thread or sending a reply
    useEffect(() => {
        if (selectedThread && threadEndRef.current) {
            threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedThread?.replies, selectedThread]);


    const fetchHistory = async () => {
        if (!userId) return;
        setLoadingHistory(true);
        try {
            // If admin and in admin tab, fetch all. Else fetch user's.
            // Actually, we'll handle admin fetch separately when tab changes
            const { data, error } = await supabase
                .from('feedback')
                .select(`
                    *,
                    replies:feedback_replies(*)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Sort replies
            const sorted = data?.map(item => ({
                ...item,
                replies: item.replies?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            })) || [];

            setHistory(sorted);
        } catch (err: any) {
            console.error('Error fetching history:', err);
            // Show error to user, helpful if table doesn't exist
            toast.error(`Failed to load history: ${err.message || 'Unknown error'}`);
        } finally {
            setLoadingHistory(false);
        }
    };


    const fetchAdminInbox = async () => {
        if (!isAdmin) return;
        setLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('feedback')
                .select(`
                    *,
                    replies:feedback_replies(*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const sorted = data?.map(item => ({
                ...item,
                replies: item.replies?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            })) || [];

            setHistory(sorted);
        } catch (err) {
            console.error('Error fetching admin inbox:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleTabChange = (tab: 'new' | 'history' | 'admin') => {
        setActiveTab(tab);
        setSelectedThread(null);
        if (tab === 'history') {
            fetchHistory();
        } else if (tab === 'admin') {
            fetchAdminInbox();
        }
    };

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
                    status: 'open',
                    metadata: {
                        url: window.location.href,
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    }
                });

            if (error) throw error;

            toast.success('Thank you for your feedback!');
            setContent('');
            // Switch to history to show it's submitted
            setActiveTab('history');
            fetchHistory();
        } catch (err) {
            console.error('Error submitting feedback:', err);
            toast.error('Failed to submit feedback. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim() || !selectedThread) return;
        if (!userId) {
            toast.error('You must be logged in to reply.');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('feedback_replies')
                .insert({
                    feedback_id: selectedThread.id,
                    user_id: userId,
                    content: replyContent,
                    is_admin_reply: isAdmin
                });

            if (error) throw error;

            // Optimistic update
            const newReply: FeedbackReply = {
                id: 'temp-' + Date.now(),
                feedback_id: selectedThread.id,
                user_id: userId,
                content: replyContent,
                created_at: new Date().toISOString(),
                is_admin_reply: !!isAdmin
            };

            const updatedThread = {
                ...selectedThread,
                replies: [...(selectedThread.replies || []), newReply]
            };

            // Update local state
            setSelectedThread(updatedThread);
            setHistory(prev => prev.map(f => f.id === selectedThread.id ? updatedThread : f));
            setReplyContent('');

            // Also update status if admin replying
            if (isAdmin && selectedThread.status === 'open') {
                await supabase.from('feedback').update({ status: 'replied' }).eq('id', selectedThread.id);
            }

        } catch (err) {
            console.error('Error sending reply:', err);
            toast.error('Failed to send reply.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white neo-border neo-shadow w-full max-w-md h-[500px] flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-2 border-black bg-stone-50 shrink-0">
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

                {/* Tabs */}
                {userId && !selectedThread && (
                    <div className="flex border-b-2 border-black bg-stone-100 shrink-0">
                        <button
                            onClick={() => handleTabChange('new')}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'new' ? 'bg-white text-black border-b-2 border-black -mb-0.5' : 'text-stone-500 hover:text-black'}`}
                        >
                            New Post
                        </button>
                        <button
                            onClick={() => handleTabChange('history')}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors relative ${activeTab === 'history' ? 'bg-white text-black border-b-2 border-black -mb-0.5' : 'text-stone-500 hover:text-black'}`}
                        >
                            My History
                            {hasUnreadFeedback && (
                                <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => handleTabChange('admin')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'admin' ? 'bg-black text-white' : 'text-stone-500 hover:text-black'}`}
                            >
                                Admin Inbox
                            </button>
                        )}
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative flex flex-col">

                    {/* NEW FEEDBACK FORM */}
                    {activeTab === 'new' && !selectedThread && (
                        <form onSubmit={handleSubmit} className="p-4 space-y-4 flex flex-col h-full overflow-y-auto">
                            {!userId && (
                                <div className="p-3 bg-amber-50 border-l-4 border-amber-400 text-xs text-amber-800 font-medium">
                                    Note: You are submitting as a guest. You won't be able to see replies unless you sign in.
                                </div>
                            )}
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

                            <div className="flex-1 min-h-0 flex flex-col">
                                <label className="text-[10px] font-black uppercase text-stone-500 mb-2 block">Your Message</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={type === 'bug' ? "Describe clinical details of the bug..." : "Tell us what feature you'd like to see!"}
                                    className="w-full flex-1 p-3 neo-border focus:ring-0 focus:outline-none text-sm font-medium resize-none placeholder:text-stone-300 min-h-[100px]"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-black text-white neo-border neo-shadow font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none shrink-0"
                            >
                                {submitting ? 'Submitting...' : 'Send Feedback'}
                                <Send size={14} />
                            </button>
                        </form>
                    )}

                    {/* HISTORY LIST */}
                    {(activeTab === 'history' || activeTab === 'admin') && !selectedThread && (
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {!userId && activeTab === 'history' ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                    <User size={32} className="text-stone-300 mb-2" />
                                    <p className="text-sm font-bold text-stone-600">Guest Mode</p>
                                    <p className="text-xs text-stone-400 max-w-[200px] mt-1">
                                        Sign in to view your feedback history and receive replies.
                                    </p>
                                </div>
                            ) : loadingHistory ? (
                                <div className="flex items-center justify-center h-full text-stone-400 text-xs italic">Loading...</div>
                            ) : history.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-stone-400 text-xs italic">No feedback history found.</div>
                            ) : (
                                history.map(item => {
                                    // Check if this item has a new reply
                                    const latestReply = item.replies && item.replies.length > 0 ? item.replies[item.replies.length - 1] : null;
                                    const lastReadTime = parseInt(localStorage.getItem('habit_feedback_last_read') || '0');
                                    const hasNewReply = latestReply && latestReply.is_admin_reply && new Date(latestReply.created_at).getTime() > lastReadTime;

                                    return (
                                        <div key={item.id} onClick={() => setSelectedThread(item)} className="p-3 bg-white neo-border hover:bg-stone-50 cursor-pointer transition-colors group relative">
                                            {hasNewReply && (
                                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse z-10" title="New Reply" />
                                            )}
                                            <div className="flex items-start justify-between mb-1">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 border border-black ${item.type === 'bug' ? 'bg-rose-100 text-rose-800' : 'bg-sky-100 text-sky-800'}`}>
                                                    {item.type}
                                                </span>
                                                <span className="text-[10px] text-stone-400 font-bold">{new Date(item.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm font-medium text-stone-800 line-clamp-2 leading-snug">{item.content}</p>
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-stone-200">
                                                <div className="flex items-center gap-1.5">
                                                    {item.status === 'replied' && <span className="text-[9px] font-bold uppercase text-green-600 flex items-center gap-1"><Reply size={10} /> HabiCard Replied</span>}
                                                    {item.status === 'open' && <span className="text-[9px] font-bold uppercase text-stone-400">Open</span>}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-stone-400 group-hover:text-black transition-colors">
                                                    <span>View Thread</span>
                                                    <ChevronRight size={12} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* THREAD VIEW */}
                    {selectedThread && (
                        <div className="flex flex-col h-full bg-stone-50">
                            <div className="p-2 border-b border-stone-200 bg-white flex items-center gap-2 shrink-0">
                                <button onClick={() => setSelectedThread(null)} className="p-1 hover:bg-stone-100 rounded">
                                    <ChevronRight size={18} className="rotate-180" />
                                </button>
                                <span className="text-xs font-bold uppercase tracking-wide">Thread</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {/* Original Post */}
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center shrink-0 border border-black">
                                        <User size={14} className="text-stone-500" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xs font-black">You</span>
                                            <span className="text-[10px] text-stone-400">{new Date(selectedThread.created_at).toLocaleString()}</span>
                                        </div>
                                        <div className="bg-white p-3 neo-border rounded-tl-none text-sm text-stone-800 leading-relaxed shadow-sm">
                                            {selectedThread.content}
                                        </div>
                                    </div>
                                </div>

                                {/* Replies */}
                                {selectedThread.replies?.map(reply => (
                                    <div key={reply.id} className={`flex gap-3 ${reply.is_admin_reply ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-black ${reply.is_admin_reply ? 'bg-black text-white' : 'bg-stone-200 text-stone-500'}`}>
                                            {reply.is_admin_reply ? <Shield size={14} /> : <User size={14} />}
                                        </div>
                                        <div className={`flex-1 space-y-1 flex flex-col ${reply.is_admin_reply ? 'items-end' : 'items-start'}`}>
                                            <div className={`flex items-baseline gap-2 ${reply.is_admin_reply ? 'flex-row-reverse' : ''}`}>
                                                <span className="text-xs font-black">{reply.is_admin_reply ? 'HabiCard' : 'You'}</span>
                                                <span className="text-[10px] text-stone-400">{new Date(reply.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className={`p-3 neo-border text-sm leading-relaxed shadow-sm max-w-[90%] ${reply.is_admin_reply
                                                ? 'bg-stone-900 text-white rounded-tr-none'
                                                : 'bg-white text-stone-800 rounded-tl-none'
                                                }`}>
                                                {reply.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={threadEndRef} />
                            </div>

                            {/* Reply Input */}
                            <form onSubmit={handleReply} className="p-3 bg-white border-t border-stone-200 shrink-0 flex gap-2">
                                <input
                                    type="text"
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder={isAdmin ? "Reply as Admin..." : "Write a reply..."}
                                    className="flex-1 bg-stone-100 border-none rounded-lg px-3 text-sm focus:ring-1 focus:ring-black outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!replyContent.trim() || submitting}
                                    className="p-2 bg-black text-white rounded-lg disabled:opacity-50 hover:bg-stone-800 transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
