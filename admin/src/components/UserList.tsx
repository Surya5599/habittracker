import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ExternalLink, Search, Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserSummary {
    id: string;
    habitCount: number;
    lastActive?: string; // We might not have this easily without inspecting completions
}

export const UserList: React.FC = () => {
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [manualId, setManualId] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // We don't have access to auth.users, so we fetch distinct user_ids from habits
            const { data, error } = await supabase
                .from('habits')
                .select('user_id, created_at');

            if (error) throw error;

            if (data) {
                const userMap = new Map<string, { count: number; lastCreated: string }>();

                data.forEach((row: any) => {
                    const current = userMap.get(row.user_id) || { count: 0, lastCreated: '' };
                    userMap.set(row.user_id, {
                        count: current.count + 1,
                        lastCreated: row.created_at > current.lastCreated ? row.created_at : current.lastCreated
                    });
                });

                const userList: UserSummary[] = Array.from(userMap.entries()).map(([id, stats]) => ({
                    id,
                    habitCount: stats.count,
                    lastActive: stats.lastCreated // Rough proxy for activity
                }));

                setUsers(userList);
            }
        } catch (error: any) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load user list: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleManualImpersonate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualId.trim()) return;
        window.open(`http://localhost:5173/?impersonate=${manualId.trim()}`, '_blank');
        setManualId('');
    };

    return (
        <div className="space-y-6">
            {/* MANUAL INPUT */}
            <div className="bg-white p-6 neo-border neo-shadow">
                <h3 className="font-black uppercase tracking-widest text-lg mb-4 flex items-center gap-2">
                    <Search size={20} />
                    Direct Impersonation
                </h3>
                <form onSubmit={handleManualImpersonate} className="flex gap-2">
                    <input
                        type="text"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        placeholder="Enter any User UUID..."
                        className="flex-1 p-3 neo-border bg-stone-50 focus:bg-white focus:outline-none transition-colors font-mono text-sm"
                    />
                    <button
                        type="submit"
                        className="bg-black text-white px-6 font-bold uppercase tracking-widest hover:-translate-y-0.5 active:translate-y-0 active:shadow-none neo-border neo-shadow transition-all"
                    >
                        Go
                    </button>
                </form>
            </div>

            {/* USER LIST */}
            <div className="bg-white p-6 neo-border neo-shadow">
                <h3 className="font-black uppercase tracking-widest text-lg mb-4 flex items-center gap-2">
                    <Users size={20} />
                    Discovered Users ({users.length})
                </h3>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-stone-400" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-stone-400 text-center p-8 italic">
                        No users found in habits table.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {users.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-3 border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                <div>
                                    <div className="font-mono text-sm font-bold text-stone-700">{user.id}</div>
                                    <div className="text-xs text-stone-400 mt-1">
                                        {user.habitCount} habits • Last habit created: {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Unknown'}
                                    </div>
                                </div>
                                <a
                                    href={`http://localhost:5173/?impersonate=${user.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 text-stone-600 text-xs font-bold uppercase hover:border-black hover:text-black transition-all"
                                >
                                    <ExternalLink size={14} />
                                    View App
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
