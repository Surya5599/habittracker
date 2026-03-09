import React, { useState } from 'react';
import { User } from 'lucide-react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface AuthFormProps {
    onContinueAsGuest: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onContinueAsGuest }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const navigate = useNavigate();

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
    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);

        if (isResetMode) {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            if (error) toast.error(error.message);
            else toast.success('Password reset email sent! Check your inbox.');
            setLoading(false);
            return;
        }

        if (authMode === 'signin') {
            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                if (error.message.toLowerCase().includes('email not confirmed')) {
                    toast.error('Confirm your email before signing in.');
                } else {
                    toast.error(error.message);
                }
            } else {
                toast.success('Signed in successfully!');
                navigate('/');
            }
        } else {
            const { error, data } = await supabase.auth.signUp({ email, password });

            if (error) {
                toast.error(error.message);
            } else if (!data.session) {
                toast.success('Account created. Check your email to confirm your account.');
                setAuthMode('signin');
            } else {
                toast.success('Account created successfully!');
                navigate('/');
            }
        }

        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center p-4 relative w-full">
            <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md">
                <motion.div
                    animate={{
                        rotateX: [0, 5, 0],
                        rotateY: [0, -5, 0]
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="w-full max-w-[340px] md:max-w-[360px] max-h-[calc(100svh-2rem)] overflow-y-auto bg-white/60 backdrop-blur-xl neo-border neo-shadow rounded-2xl p-6 md:p-8 relative perspective-1000 transform-gpu"
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <div className="h-full flex flex-col space-y-6">
                        {/* Styled Header Branding inside the card */}
                        <div className="text-center">
                            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-3">
                                Habi<span className="text-[#C19A9A]">Card</span>
                            </h1>
                            <p className="text-sm md:text-base font-medium opacity-60 max-w-[240px] mx-auto leading-tight">
                                A calming analytical tracker to build your habits
                            </p>
                        </div>

                        <div className="space-y-4">
                            <form
                                className="space-y-4"
                                onSubmit={handleSubmit}
                            >
                                {!isResetMode && (
                                    <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
                                        <button
                                            type="button"
                                            onClick={() => setAuthMode('signin')}
                                            className={`rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'signin' ? 'bg-white text-black shadow-sm' : 'text-stone-500 hover:text-black'}`}
                                            disabled={loading}
                                        >
                                            Sign In
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAuthMode('signup')}
                                            className={`rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'signup' ? 'bg-white text-black shadow-sm' : 'text-stone-500 hover:text-black'}`}
                                            disabled={loading}
                                        >
                                            Sign Up
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Email</label>
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="USER@DOMAIN.COM"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full p-2.5 bg-stone-50/50 neo-border focus:ring-2 focus:ring-[#C19A9A]/20 focus:outline-none transition-all text-sm font-black uppercase placeholder:text-stone-300"
                                            disabled={loading}
                                        />
                                    </div>

                                    {!isResetMode && (
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label htmlFor="password" className="block text-[9px] font-black uppercase tracking-widest text-stone-400">Pass</label>
                                            </div>
                                            <input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full p-2.5 bg-stone-50/50 neo-border focus:ring-2 focus:ring-[#C19A9A]/20 focus:outline-none transition-all text-sm font-black uppercase"
                                                disabled={loading}
                                            />
                                        </div>
                                    )}
                                </div>

                                {isResetMode ? (
                                    <div className="space-y-3 pt-2">
                                        <button
                                            type="submit"
                                            className="w-full px-6 py-3 bg-black text-white neo-border neo-shadow-sm font-black uppercase tracking-widest text-xs hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                                            disabled={loading}
                                        >
                                            {loading ? 'Sending Protocol...' : 'Request Pin Reset'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); setIsResetMode(false); }}
                                            className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-black transition-colors"
                                        >
                                            Return to Login
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 pt-2">
                                        {authMode === 'signup' && (
                                            <div className="rounded-xl border border-[#C19A9A]/30 bg-[#C19A9A]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-stone-600">
                                                You&apos;ll need to confirm your email before signing in.
                                            </div>
                                        )}
                                        <button
                                            type="submit"
                                            className="w-full px-6 py-3.5 bg-black text-white neo-border neo-shadow-sm font-black uppercase tracking-widest text-xs hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                                            disabled={loading}
                                        >
                                            {loading ? 'Verifying...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
                                        </button>

                                        <div className="flex justify-center">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); setIsResetMode(true); }}
                                                className="text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-black transition-colors"
                                            >
                                                Forgot your password?
                                            </button>
                                        </div>

                                        <div className="relative flex items-center py-1">
                                            <div className="flex-grow border-t border-stone-100/50"></div>
                                            <span className="flex-shrink mx-3 text-stone-300 text-[8px] font-black uppercase tracking-[0.2em]">or</span>
                                            <div className="flex-grow border-t border-stone-100/50"></div>
                                        </div>

                                        <button
                                            onClick={(e) => { e.preventDefault(); onContinueAsGuest(); }}
                                            className="w-full px-6 py-2.5 bg-white/50 text-black border-[2px] border-dashed border-stone-200 font-black uppercase tracking-widest text-[10px] hover:border-black hover:text-black transition-all flex items-center justify-center gap-2"
                                        >
                                            <User size={12} />
                                            Guest Entry
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>

                    </div>
                </motion.div>
            </div>
        </div>
    );
};
