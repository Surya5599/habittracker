import React, { useState } from 'react';
import { User } from 'lucide-react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';

interface AuthFormProps {
    onContinueAsGuest: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onContinueAsGuest }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (error) toast.error(error.message);
        else toast.success('Password reset email sent! Check your inbox.');
        setLoading(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) toast.error(error.message);
        else toast.success('Logged in successfully!');
        setLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) toast.error(error.message);
        else toast.success('Check your email to confirm your account.');
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#e5e5e5] p-4">
            <div className="max-w-md w-full bg-white border-[2px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-6 space-y-6">
                <h2 className="text-2xl font-bold text-center text-[#444] uppercase tracking-widest">
                    {isResetMode ? 'Reset Password' : 'HabiCard'}
                </h2>
                <p className="text-center text-sm text-stone-500">
                    {isResetMode
                        ? 'Enter your email to receive a password reset link.'
                        : 'Sign in to sync your progress across devices.'}
                </p>
                <form className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-xs font-bold uppercase text-stone-500 mb-1">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border-[2px] border-black focus:outline-none focus:ring-2 focus:ring-stone-300 text-sm"
                            disabled={loading}
                        />
                    </div>

                    {!isResetMode && (
                        <div>
                            <label htmlFor="password" className="block text-xs font-bold uppercase text-stone-500 mb-1">Password</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 border-[2px] border-black focus:outline-none focus:ring-2 focus:ring-stone-300 text-sm"
                                disabled={loading}
                            />
                        </div>
                    )}
                    {isResetMode && (
                        <button
                            onClick={handleResetPassword}
                            className="w-full px-4 py-2 border-[2px] border-black text-sm font-black uppercase tracking-widest bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    )}
                    <div className="flex flex-col gap-3">
                        {!isResetMode && (
                            <>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={handleLogin}
                                        className="flex-1 px-4 py-2 border-[2px] border-black text-sm font-black uppercase tracking-widest bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                                        disabled={loading}
                                    >
                                        {loading ? 'Loading...' : 'Sign In'}
                                    </button>
                                    <button
                                        onClick={handleSignUp}
                                        className="flex-1 px-4 py-2 border-[2px] border-black text-sm font-black uppercase tracking-widest bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                                        disabled={loading}
                                    >
                                        {loading ? 'Loading...' : 'Sign Up'}
                                    </button>
                                </div>
                                <button
                                    onClick={(e) => { e.preventDefault(); setIsResetMode(true); }}
                                    className="text-xs text-stone-500 hover:text-black hover:underline text-center"
                                >
                                    Forgot your password?
                                </button>
                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-stone-200"></div>
                                    <span className="flex-shrink mx-4 text-stone-400 text-[10px] font-bold uppercase">or</span>
                                    <div className="flex-grow border-t border-stone-200"></div>
                                </div>
                                <button
                                    onClick={(e) => { e.preventDefault(); onContinueAsGuest(); }}
                                    className="w-full px-4 py-2 border-[2px] border-dashed border-stone-400 text-xs font-bold uppercase tracking-widest text-stone-500 hover:bg-stone-50 hover:border-black hover:text-black transition-all flex items-center justify-center gap-2"
                                >
                                    <User size={14} />
                                    Continue as Guest
                                </button>
                            </>
                        )}
                        {isResetMode && (
                            <button
                                onClick={(e) => { e.preventDefault(); setIsResetMode(false); }}
                                className="w-full px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-black transition-all"
                                disabled={loading}
                            >
                                Back to Sign In
                            </button>
                        )}
                    </div>
                </form>
            </div >
        </div >
    );
};
