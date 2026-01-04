import React, { useState } from 'react';
import { User, Check } from 'lucide-react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

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

        // 1. Try Login first
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

        if (!loginError) {
            toast.success('Logged in successfully!');
            setLoading(false);
            return;
        }

        // 2. If login fails, try Sign Up (user might not exist)
        const { error: signUpError, data: signUpData } = await supabase.auth.signUp({ email, password });

        if (!signUpError) {
            if (!signUpData?.session) {
                const { error: retryError } = await supabase.auth.signInWithPassword({ email, password });
                if (retryError) {
                    if (retryError.message.toLowerCase().includes('email not confirmed')) {
                        toast.success('Check your email to confirm your account!');
                    } else {
                        toast.error(loginError.message);
                    }
                } else {
                    toast.success('Account created and logged in!');
                }
            } else {
                toast.success('Account created and logged in!');
            }
            setLoading(false);
            return;
        }

        if (signUpError.message.toLowerCase().includes('already registered')) {
            toast.error(loginError.message);
        } else {
            toast.error(signUpError.message);
        }

        setLoading(false);
    };

    const handleLogin = (e: React.FormEvent) => handleSubmit(e);
    const handleSignUp = (e: React.FormEvent) => handleSubmit(e);

    return (
        <div className="flex items-center justify-center p-4 overflow-hidden relative">
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
                    className="w-full max-w-[340px] md:max-w-[360px] bg-white/60 backdrop-blur-xl neo-border neo-shadow rounded-2xl p-6 md:p-8 relative perspective-1000 transform-gpu"
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <div className="h-full flex flex-col space-y-6">
                        {/* Styled Header Branding inside the card */}
                        <div className="text-center">
                            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-3">
                                Habi<span className="text-[#C19A9A]">Card</span>
                            </h1>
                            <p className="text-sm md:text-base font-medium opacity-60 max-w-[240px] mx-auto leading-tight">
                                The only tracker that treats your progress like a work of art.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <form
                                className="space-y-4"
                                onSubmit={handleSubmit}
                            >
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
                                        <button
                                            type="submit"
                                            className="w-full px-6 py-3.5 bg-black text-white neo-border neo-shadow-sm font-black uppercase tracking-widest text-xs hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                                            disabled={loading}
                                        >
                                            {loading ? 'Verifying...' : 'Access Identity'}
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
