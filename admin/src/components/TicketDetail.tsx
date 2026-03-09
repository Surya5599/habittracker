import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import type { Feedback, FeedbackAttachment, FeedbackReply } from '../types';
import { X, Send, User, Shield, CheckCircle, ExternalLink, ImagePlus } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TicketDetailProps {
    feedback: Feedback;
    onClose: () => void;
    onStatusChange: (id: string, status: Feedback['status']) => void;
}

const FEEDBACK_ATTACHMENTS_BUCKET = 'feedback-attachments';
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 3;

interface PendingAttachment {
    file: File;
    previewUrl: string;
}

const sanitizeFileName = (name: string) =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9.-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'image';

const releasePendingAttachments = (pendingAttachments: PendingAttachment[]) => {
    pendingAttachments.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl));
};

const getReplyAttachments = (reply?: FeedbackReply | null): FeedbackAttachment[] => {
    if (!reply?.metadata?.attachments || !Array.isArray(reply.metadata.attachments)) return [];
    return reply.metadata.attachments.filter((attachment: FeedbackAttachment | null) => {
        return !!attachment?.url && !!attachment?.path;
    });
};

export const TicketDetail: React.FC<TicketDetailProps> = ({ feedback, onClose, onStatusChange }) => {
    const [replies, setReplies] = useState<FeedbackReply[]>([]);
    const [replyContent, setReplyContent] = useState('');
    const [replyAttachments, setReplyAttachments] = useState<PendingAttachment[]>([]);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const replyAttachmentsRef = useRef<PendingAttachment[]>([]);

    useEffect(() => {
        fetchReplies();
        markAsRead(); // Optional: Logic to mark as read if we had that field
    }, [feedback.id]);

    useEffect(() => {
        replyAttachmentsRef.current = replyAttachments;
    }, [replyAttachments]);

    useEffect(() => {
        return () => {
            releasePendingAttachments(replyAttachmentsRef.current);
        };
    }, []);

    const fetchReplies = async () => {
        const { data, error } = await supabase
            .from('feedback_replies')
            .select('*')
            .eq('feedback_id', feedback.id)
            .order('created_at', { ascending: true });

        if (error) {
            toast.error('Failed to load replies');
        } else {
            setReplies(data || []);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    const markAsRead = async () => {
        // Placeholder if we implemented 'read' status
    };

    const handleAttachmentSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        const availableSlots = Math.max(0, MAX_ATTACHMENTS - replyAttachments.length);
        if (availableSlots === 0) {
            toast.error(`You can attach up to ${MAX_ATTACHMENTS} images.`);
            e.target.value = '';
            return;
        }

        const nextAttachments: PendingAttachment[] = [];

        selectedFiles.slice(0, availableSlots).forEach((file) => {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image.`);
                return;
            }
            if (file.size > MAX_ATTACHMENT_SIZE) {
                toast.error(`${file.name} is larger than 5 MB.`);
                return;
            }

            nextAttachments.push({
                file,
                previewUrl: URL.createObjectURL(file)
            });
        });

        if (selectedFiles.length > availableSlots) {
            toast.error(`Only ${MAX_ATTACHMENTS} images can be attached.`);
        }

        if (nextAttachments.length > 0) {
            setReplyAttachments((prev) => [...prev, ...nextAttachments]);
        }

        e.target.value = '';
    };

    const removeAttachment = (index: number) => {
        setReplyAttachments((prev) => {
            const target = prev[index];
            if (target) URL.revokeObjectURL(target.previewUrl);
            return prev.filter((_, currentIndex) => currentIndex !== index);
        });
    };

    const uploadPendingAttachments = async () => {
        const uploadedAttachments: FeedbackAttachment[] = [];

        for (const attachment of replyAttachments) {
            const objectPath = `admin-replies/${feedback.id}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(attachment.file.name)}`;
            const { error: uploadError } = await supabase
                .storage
                .from(FEEDBACK_ATTACHMENTS_BUCKET)
                .upload(objectPath, attachment.file, {
                    cacheControl: '3600',
                    contentType: attachment.file.type,
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase
                .storage
                .from(FEEDBACK_ATTACHMENTS_BUCKET)
                .getPublicUrl(objectPath);

            uploadedAttachments.push({
                path: objectPath,
                url: publicUrlData.publicUrl,
                name: attachment.file.name,
                size: attachment.file.size,
                mimeType: attachment.file.type
            });
        }

        return uploadedAttachments;
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim() && replyAttachments.length === 0) return;

        setSending(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const uploadedAttachments = await uploadPendingAttachments();

            const { error } = await supabase.from('feedback_replies').insert({
                feedback_id: feedback.id,
                user_id: user.id,
                content: replyContent,
                is_admin_reply: true,
                metadata: {
                    attachments: uploadedAttachments
                }
            });

            if (error) throw error;

            // Update feedback status to 'replied'
            await supabase.from('feedback').update({ status: 'replied' }).eq('id', feedback.id);
            onStatusChange(feedback.id, 'replied');

            setReplyContent('');
            releasePendingAttachments(replyAttachments);
            setReplyAttachments([]);
            fetchReplies();
            toast.success('Reply sent');
        } catch (error: any) {
            toast.error('Failed to send reply: ' + error.message);
        } finally {
            setSending(false);
        }
    };

    const handleCloseTicket = async () => {
        try {
            await supabase.from('feedback').update({ status: 'closed' }).eq('id', feedback.id);
            onStatusChange(feedback.id, 'closed');
            toast.success('Ticket closed');
            onClose();
        } catch (error: any) {
            toast.error('Failed to close ticket');
        }
    }

    const attachments = Array.isArray(feedback.metadata?.attachments)
        ? feedback.metadata.attachments.filter((attachment) => attachment?.url && attachment?.path)
        : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl h-[80vh] flex flex-col neo-border neo-shadow animate-in fade-in zoom-in-95 duration-200">
                {/* HEADER */}
                <div className="p-4 border-b-2 border-black flex items-start justify-between bg-stone-50">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 border border-black ${feedback.type === 'bug' ? 'bg-rose-100 text-rose-800' : 'bg-sky-100 text-sky-800'}`}>
                                {feedback.type}
                            </span>
                            <span className="text-xs text-stone-500 font-mono">{feedback.id.slice(0, 8)}</span>
                        </div>
                        <h2 className="font-bold text-lg leading-tight line-clamp-2">{feedback.content}</h2>
                        <div className="flex items-center gap-2 mt-2 text-xs text-stone-500">
                            <User size={12} />
                            <span>User ID: {feedback.user_id}</span>
                            <span>•</span>
                            <span>{new Date(feedback.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={`http://localhost:5173/?impersonate=${feedback.user_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-stone-200 rounded transition-colors text-stone-500 hover:text-black"
                            title="View User App"
                        >
                            <ExternalLink size={20} />
                        </a>
                        <button onClick={onClose} className="p-1 hover:bg-stone-200 rounded transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* THREAD */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-stone-50">
                    {/* ORIGINAL POST */}
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-200 border border-black flex items-center justify-center shrink-0">
                            <User size={14} className="text-stone-500" />
                        </div>
                        <div className="space-y-1 max-w-[85%]">
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-black">User</span>
                                <span className="text-[10px] text-stone-400">{new Date(feedback.created_at).toLocaleString()}</span>
                            </div>
                            <div className="p-3 bg-white neo-border text-sm leading-relaxed shadow-sm">
                                {feedback.content}
                            </div>
                            {attachments.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-3">
                                    {attachments.map((attachment) => (
                                        <a
                                            key={attachment.path}
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block overflow-hidden neo-border bg-stone-100"
                                        >
                                            <img
                                                src={attachment.url}
                                                alt={attachment.name}
                                                className="h-28 w-full object-cover"
                                                loading="lazy"
                                            />
                                            <div className="border-t border-black/10 bg-white px-2 py-1.5 text-[10px] font-bold text-stone-600 truncate">
                                                {attachment.name}
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* REPLIES */}
                    {replies.map(reply => (
                        <div key={reply.id} className={`flex gap-3 ${reply.is_admin_reply ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full border border-black flex items-center justify-center shrink-0 ${reply.is_admin_reply ? 'bg-black text-white' : 'bg-stone-200 text-stone-500'}`}>
                                {reply.is_admin_reply ? <Shield size={14} /> : <User size={14} />}
                            </div>
                            <div className={`space-y-1 max-w-[85%] flex flex-col ${reply.is_admin_reply ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-baseline gap-2 ${reply.is_admin_reply ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-sm font-black">{reply.is_admin_reply ? 'HabiCard (You)' : 'User'}</span>
                                    <span className="text-[10px] text-stone-400">{new Date(reply.created_at).toLocaleString()}</span>
                                </div>
                                <div className={`p-3 neo-border text-sm leading-relaxed shadow-sm ${reply.is_admin_reply ? 'bg-stone-900 text-white' : 'bg-white text-stone-900'}`}>
                                    {reply.content}
                                </div>
                                {getReplyAttachments(reply).length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        {getReplyAttachments(reply).map((attachment) => (
                                            <a
                                                key={attachment.path}
                                                href={attachment.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block overflow-hidden neo-border bg-stone-100"
                                            >
                                                <img
                                                    src={attachment.url}
                                                    alt={attachment.name}
                                                    className="h-24 w-full object-cover"
                                                    loading="lazy"
                                                />
                                                <div className="border-t border-black/10 bg-white px-2 py-1.5 text-[10px] font-bold text-stone-600 truncate">
                                                    {attachment.name}
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={scrollRef} />
                </div>

                {/* FOOTER / REPLY INPUT */}
                <div className="p-4 bg-white border-t-2 border-black">
                    <form onSubmit={handleSendReply} className="space-y-2">
                        {replyAttachments.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {replyAttachments.map((attachment, index) => (
                                    <div key={`${attachment.file.name}-${index}`} className="overflow-hidden neo-border bg-white">
                                        <img
                                            src={attachment.previewUrl}
                                            alt={attachment.file.name}
                                            className="h-16 w-full object-cover"
                                        />
                                        <div className="border-t border-black/10 p-1.5">
                                            <p className="truncate text-[10px] font-bold text-stone-600">{attachment.file.name}</p>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="mt-1 text-[10px] font-black uppercase text-rose-600"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                value={replyContent}
                                onChange={e => setReplyContent(e.target.value)}
                                placeholder="Type your reply..."
                                className="flex-1 p-3 neo-border bg-stone-50 focus:bg-white focus:outline-none transition-colors"
                            />
                            <label className="inline-flex cursor-pointer items-center gap-1 border border-stone-300 bg-stone-50 px-3 py-2 text-[10px] font-black uppercase text-stone-600 hover:border-black hover:text-black">
                                <ImagePlus size={13} />
                                Image
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleAttachmentSelection}
                                    className="hidden"
                                />
                            </label>
                            <button
                                type="submit"
                                disabled={sending || (!replyContent.trim() && replyAttachments.length === 0)}
                                className="bg-black text-white px-6 font-bold uppercase tracking-widest hover:-translate-y-0.5 active:translate-y-0 active:shadow-none neo-border neo-shadow disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none transition-all flex items-center gap-2"
                            >
                                {sending ? 'Sending...' : <><Send size={16} /> Reply</>}
                            </button>
                        </div>
                    </form>
                    <div className="mt-2 flex justify-end">
                        {feedback.status !== 'closed' && (
                            <button onClick={handleCloseTicket} className="text-xs font-bold text-stone-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                                <CheckCircle size={12} /> Mark as Closed
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
