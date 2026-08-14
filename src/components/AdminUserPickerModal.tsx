import React, { useEffect, useRef, useState } from 'react';
import { Search, ShieldAlert, X } from 'lucide-react';
import { supabase } from '../supabase';

interface AdminUser {
    id: string;
    email: string;
    created_at: string;
}

interface AdminUserPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectUser: (user: AdminUser) => void;
    themePrimary: string;
}

export const AdminUserPickerModal: React.FC<AdminUserPickerModalProps> = ({ isOpen, onClose, onSelectUser, themePrimary }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setError(null);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const { data, error: rpcError } = await supabase.rpc('admin_search_users', { search: query.trim() });
                if (rpcError) {
                    setError('Could not load users.');
                    setResults([]);
                } else {
                    setResults(data ?? []);
                }
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, isOpen]);

    useEffect(() => {
        if (isOpen) setQuery('');
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[220] flex items-start justify-center bg-black/50 p-3 pt-16 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white neo-border neo-shadow rounded-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                style={{ maxHeight: 'min(75vh, 560px)' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="h-[3px]" style={{ backgroundColor: themePrimary }} />
                <div className="px-4 py-3 border-b-[2px] border-black flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                        <ShieldAlert size={16} />
                        <div>
                            <p className="text-sm font-black uppercase tracking-wide">View as user</p>
                            <p className="text-[10px] font-medium text-stone-500">Read-only — you can't change their data.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-black transition-colors">
                        <X size={18} strokeWidth={3} />
                    </button>
                </div>

                <div className="p-3 border-b-2 border-stone-100 shrink-0">
                    <div className="flex items-center gap-2 border-2 border-black rounded-lg px-2.5 py-1.5 bg-stone-50">
                        <Search size={13} className="text-stone-400 shrink-0" />
                        <input
                            autoFocus
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search by email..."
                            className="flex-1 text-[12px] font-medium bg-transparent focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                    {loading && (
                        <p className="text-center text-[11px] text-stone-400 font-bold py-4">Searching...</p>
                    )}
                    {!loading && error && (
                        <p className="text-center text-[11px] text-red-500 font-bold py-4">{error}</p>
                    )}
                    {!loading && !error && results.length === 0 && (
                        <p className="text-center text-[11px] text-stone-400 font-bold py-4">No users found.</p>
                    )}
                    {!loading && results.map(u => (
                        <button
                            key={u.id}
                            onClick={() => onSelectUser(u)}
                            className="flex flex-col items-start p-2.5 rounded-lg hover:bg-stone-50 transition-colors text-left border border-transparent hover:border-stone-200"
                        >
                            <span className="text-[12px] font-bold text-stone-800">{u.email}</span>
                            <span className="text-[9px] text-stone-400 font-medium">{u.id}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
