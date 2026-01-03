import React, { useState } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';

interface UpdatePasswordFormProps {
    onSuccess: () => void;
}

export const UpdatePasswordForm: React.FC<UpdatePasswordFormProps> = ({ onSuccess }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Password updated successfully!');
            onSuccess();
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#e5e5e5] p-4">
            <div className="max-w-md w-full bg-white border-[2px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-6 space-y-6">
                <h2 className="text-2xl font-bold text-center text-[#444] uppercase tracking-widest">Set New Password</h2>
                <p className="text-center text-sm text-stone-500">Please enter your new password below.</p>
                <form className="space-y-4" onSubmit={handleUpdatePassword}>
                    <div>
                        <label htmlFor="new-password" className="block text-xs font-bold uppercase text-stone-500 mb-1">New Password</label>
                        <input
                            id="new-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border-[2px] border-black focus:outline-none focus:ring-2 focus:ring-stone-300 text-sm"
                            disabled={loading}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 border-[2px] border-black text-sm font-black uppercase tracking-widest bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};
