import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { Feedback } from '../types';
import { TicketDetail } from './TicketDetail';
import { CheckCircle, Reply, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TicketListProps {
    // session: Session; // Removed unused prop
}

export const TicketList: React.FC<TicketListProps> = () => {
    const [tickets, setTickets] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Feedback | null>(null);
    const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');

    useEffect(() => {
        fetchTickets();

        // Subscribe to real-time changes? (Optional, skipping for now to keep simple)
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            console.log('Current User:', user);

            const { data, error } = await supabase
                .from('feedback')
                .select('*')
                .order('created_at', { ascending: false });

            console.log('Fetch Result:', { data, error });

            if (error) throw error;
            setTickets(data || []);
        } catch (error: any) {
            console.error('Fetch Error:', error);
            toast.error('Error fetching tickets: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'open') return t.status === 'open' || t.status === 'replied';
        if (filter === 'closed') return t.status === 'closed';
        return true;
    });

    const handleStatusChange = (id: string, status: Feedback['status']) => {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    return (
        <div>
            {/* CONTROLS */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                    {(['all', 'open', 'closed'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 font-bold uppercase text-xs tracking-wider neo-border transition-all ${filter === f
                                ? 'bg-black text-white neo-shadow'
                                : 'bg-white text-stone-500 hover:bg-stone-50'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="text-xs font-bold text-stone-400">
                    {filteredTickets.length} visible / {tickets.length} total
                </div>
            </div>

            {/* LIST */}
            <div className="space-y-3">
                {filteredTickets.length === 0 ? (
                    <div className="p-12 text-center text-stone-400 font-medium">No tickets found.</div>
                ) : (
                    filteredTickets.map(ticket => (
                        <div
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className="bg-white p-4 neo-border hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 border border-black ${ticket.type === 'bug' ? 'bg-rose-100 text-rose-800' : 'bg-sky-100 text-sky-800'}`}>
                                        {ticket.type}
                                    </span>
                                    <span className="text-xs text-stone-400 font-mono">
                                        ID: {ticket.id.slice(0, 6)}...
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {ticket.status === 'replied' && <span className="text-xs font-bold text-green-600 flex items-center gap-1"><Reply size={12} /> Replied</span>}
                                    {ticket.status === 'closed' && <span className="text-xs font-bold text-stone-400 flex items-center gap-1"><CheckCircle size={12} /> Closed</span>}
                                    {ticket.status === 'open' && <span className="text-xs font-bold text-amber-500 uppercase">Open</span>}
                                    <span className="text-xs text-stone-400 ml-2">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <h3 className="font-bold text-base text-stone-800 line-clamp-1 group-hover:text-black transition-colors">{ticket.content}</h3>
                            <p className="text-stone-500 text-sm mt-1 line-clamp-1">{ticket.content}</p>
                        </div>
                    ))
                )}
            </div>

            {/* DETAIL MODAL */}
            {selectedTicket && (
                <TicketDetail
                    feedback={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    onStatusChange={handleStatusChange}
                />
            )}
        </div>
    );
};
