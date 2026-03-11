import React, { useState } from 'react';
import { Check, User } from 'lucide-react';
import { supabase } from '../supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface AuthFormProps {
    onContinueAsGuest: () => void;
    initialMode?: 'signin' | 'signup';
}

type PanelTone = 'error' | 'success' | 'info';

export const AuthForm: React.FC<AuthFormProps> = ({ onContinueAsGuest, initialMode = 'signin' }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialMode);
    const [panelMessage, setPanelMessage] = useState<{ tone: PanelTone; text: string } | null>(null);
    const [showResendConfirmation, setShowResendConfirmation] = useState(false);
    const navigate = useNavigate();

    const resetPanelState = () => {
        setPanelMessage(null);
        setShowResendConfirmation(false);
    };

    const setMessage = (tone: PanelTone, text: string, allowResend = false) => {
        setPanelMessage({ tone, text });
        setShowResendConfirmation(allowResend);
    };

    const isExistingAccountError = (message: string) => {
        const normalized = message.toLowerCase();
        return normalized.includes('already registered') || normalized.includes('already exists') || normalized.includes('user already registered');
    };

    const isMissingAccountError = (message: string) => {
        const normalized = message.toLowerCase();
        return normalized.includes('email not found') || normalized.includes('user not found') || normalized.includes('no user found');
    };

    const isWrongPasswordError = (message: string) => {
        const normalized = message.toLowerCase();
        return normalized.includes('invalid login credentials') || normalized.includes('invalid password') || normalized.includes('wrong password');
    };

    const handleResendConfirmation = async () => {
        if (!email.trim()) {
            setMessage('error', 'Enter your email address first.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/app`
            }
        });

        if (error) {
            setMessage('error', error.message);
        } else {
            setMessage('success', 'Confirmation email sent. Check your inbox.');
        }

        setLoading(false);
    };

    const lookupEmailStatus = async (candidateEmail: string) => {
        const { data, error } = await supabase.functions.invoke('auth-email-status', {
            body: { email: candidateEmail }
        });

        if (error) {
            throw error;
        }

        return {
            exists: Boolean(data?.exists),
            confirmed: Boolean(data?.confirmed),
        };
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        resetPanelState();

        if (isResetMode) {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/app`,
            });

            if (error) {
                setMessage('error', error.message);
            } else {
                setMessage('success', 'Password reset email sent. Check your inbox.');
            }

            setLoading(false);
            return;
        }

        if (authMode === 'signin') {
            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                if (error.message.toLowerCase().includes('email not confirmed')) {
                    setMessage('error', 'Confirm your email before logging in.', true);
                } else if (isMissingAccountError(error.message)) {
                    setAuthMode('signup');
                    setMessage('info', 'Email does not exist. Please sign up.');
                } else if (isWrongPasswordError(error.message)) {
                    try {
                        const status = await lookupEmailStatus(email);
                        if (!status.exists) {
                            setAuthMode('signup');
                            setMessage('info', 'Email does not exist. Please sign up.');
                        } else if (!status.confirmed) {
                            setMessage('error', 'Confirm your email before logging in.', true);
                        } else {
                            setMessage('error', 'Incorrect password. Please fix your password and try again.');
                        }
                    } catch {
                        setMessage('error', 'Incorrect password. Please fix your password and try again.');
                    }
                } else {
                    setMessage('error', error.message);
                }
            } else {
                navigate('/app');
            }
        } else {
            const { error, data } = await supabase.auth.signUp({ email, password });

            if (error) {
                if (isExistingAccountError(error.message)) {
                    setAuthMode('signin');
                    setMessage('info', 'Account already exists. Please log in.');
                } else {
                    setMessage('error', error.message);
                }
            } else if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
                setAuthMode('signin');
                setMessage('info', 'Account already exists. Please log in.');
            } else if (!data.session) {
                setMessage('success', 'Account created. Check your email to confirm your account.');
                setAuthMode('signin');
            } else {
                navigate('/app');
            }
        }

        setLoading(false);
    };

    const fieldFilled = (value: string) => value.trim().length > 0;
    const emailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    const cardModeKey = isResetMode ? 'reset' : authMode;
    const progressPercent = isResetMode
        ? (emailValid(email) ? 100 : 0)
        : ((emailValid(email) ? 50 : 0) + (fieldFilled(password) ? 50 : 0));

    return (
        <div className="flex items-center justify-center p-4 relative w-full">
            <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md">
                <div className="w-full max-w-[340px] md:max-w-[360px] [perspective:1200px]">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={cardModeKey}
                            initial={{ rotateY: 90, opacity: 0, x: 24 }}
                            animate={{ rotateY: 0, opacity: 1, x: 0 }}
                            exit={{ rotateY: -90, opacity: 0, x: -24 }}
                            transition={{ duration: 0.4, ease: 'easeInOut' }}
                            className="relative flex max-h-[calc(100svh-2rem)] h-full flex-col overflow-hidden rounded-2xl bg-white neo-border neo-shadow perspective-1000 transform-gpu"
                            style={{ transformStyle: 'preserve-3d', transformOrigin: 'center center' }}
                        >
                                <div className="border-b-[3px] border-black bg-[#d6d3d1] px-6 py-5 text-center text-black">
                                    <div className="flex flex-col items-center justify-center">
                                        <h1 className="text-3xl font-black uppercase tracking-tight leading-none">
                                            <span className="text-[#404040]">Habi</span>
                                            <span className="text-[#c59b97]">Card</span>
                                        </h1>
                                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-600">
                                            Daily Access Card
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-1 flex-col overflow-hidden p-6">
                                    <form className="space-y-4" onSubmit={handleSubmit}>
                                    <div className="mb-2 text-center">
                                        <div className="mx-auto flex h-24 w-24 items-center justify-center">
                                            <div className="relative h-24 w-24">
                                                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                                                    <path
                                                        className="text-stone-200"
                                                        strokeWidth="3.5"
                                                        stroke="currentColor"
                                                        fill="none"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                    <path
                                                        className="text-[#9cb4a4] transition-all duration-300 ease-out"
                                                        strokeWidth="3.5"
                                                        strokeDasharray={`${progressPercent}, 100`}
                                                        strokeLinecap="round"
                                                        stroke="currentColor"
                                                        fill="none"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-2xl font-black text-stone-900">{progressPercent}%</span>
                                                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                                                        {isResetMode ? 'Email' : 'Access'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="email" className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">Username</label>
                                        <div className="flex items-center gap-3 rounded-2xl border-[2px] border-black bg-white px-4 py-3">
                                            <div className={`flex h-6 w-6 items-center justify-center rounded-[4px] border-2 border-black ${emailValid(email) ? 'bg-black text-white' : 'bg-white text-black'}`}>
                                                {emailValid(email) ? <Check size={14} strokeWidth={3} /> : null}
                                            </div>
                                            <input
                                                id="email"
                                                    type="email"
                                                    placeholder="USER@DOMAIN.COM"
                                                    value={email}
                                                    onChange={(e) => {
                                                        setEmail(e.target.value);
                                                        resetPanelState();
                                                    }}
                                                    className="w-full bg-transparent text-sm font-black uppercase text-stone-800 placeholder:text-stone-300 focus:outline-none"
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>

                                        {!isResetMode && (
                                            <div>
                                                <label htmlFor="password" className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">Password</label>
                                                <div className="flex items-center gap-3 rounded-2xl border-[2px] border-black bg-white px-4 py-3">
                                                    <div className={`flex h-6 w-6 items-center justify-center rounded-[4px] border-2 border-black ${fieldFilled(password) ? 'bg-black text-white' : 'bg-white text-black'}`}>
                                                        {fieldFilled(password) ? <Check size={14} strokeWidth={3} /> : null}
                                                    </div>
                                                    <input
                                                        id="password"
                                                        type="password"
                                                        placeholder="••••••••"
                                                        value={password}
                                                        onChange={(e) => {
                                                            setPassword(e.target.value);
                                                            resetPanelState();
                                                        }}
                                                        className="w-full bg-transparent text-sm font-black uppercase text-stone-800 placeholder:text-stone-300 focus:outline-none"
                                                        disabled={loading}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {panelMessage && (
                                        <div
                                            className={`rounded-xl px-3 py-3 text-[10px] font-bold uppercase tracking-wide ${
                                                panelMessage.tone === 'error'
                                                    ? 'border border-rose-200 bg-rose-50 text-rose-700'
                                                    : panelMessage.tone === 'success'
                                                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                                        : 'border border-stone-200 bg-stone-50 text-stone-600'
                                            }`}
                                        >
                                            <div>{panelMessage.text}</div>
                                            {showResendConfirmation && (
                                                <button
                                                    type="button"
                                                    onClick={handleResendConfirmation}
                                                    disabled={loading}
                                                    className="mt-3 inline-flex items-center rounded-full border border-current px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50"
                                                >
                                                    Resend Confirmation Email
                                                </button>
                                            )}
                                        </div>
                                    )}

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
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setIsResetMode(false);
                                                    resetPanelState();
                                                }}
                                                className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-black transition-colors"
                                            >
                                                Return to Login
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 pt-2">
                                            {authMode === 'signup' && (
                                                <div className="rounded-xl border border-[#C19A9A]/30 bg-[#C19A9A]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-stone-600">
                                                    You&apos;ll need to confirm your email before logging in.
                                                </div>
                                            )}
                                            <button
                                                type="submit"
                                                className="w-full px-6 py-3.5 bg-black text-white neo-border neo-shadow-sm font-black uppercase tracking-widest text-xs hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                                                disabled={loading}
                                            >
                                                {loading ? 'Verifying...' : authMode === 'signin' ? 'Log In' : 'Create Account'}
                                            </button>

                                            <div className="flex justify-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setIsResetMode(true);
                                                        resetPanelState();
                                                    }}
                                                    className="text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-black transition-colors"
                                                >
                                                    Forgot your password?
                                                </button>
                                            </div>

                                            <div className="relative flex items-center py-1">
                                                <div className="flex-grow border-t border-stone-100/50"></div>
                                                <span className="mx-3 flex-shrink text-[8px] font-black uppercase tracking-[0.2em] text-stone-300">or</span>
                                                <div className="flex-grow border-t border-stone-100/50"></div>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    onContinueAsGuest();
                                                }}
                                                className="flex w-full items-center justify-center gap-2 border-[2px] border-dashed border-stone-200 bg-white/50 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:border-black hover:text-black"
                                            >
                                                <User size={12} />
                                                Guest Entry
                                            </button>
                                        </div>
                                    )}
                                    </form>
                                </div>

                                {!isResetMode && (
                                    <div className="grid grid-cols-2 border-t-[3px] border-black bg-white">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAuthMode('signup');
                                                resetPanelState();
                                            }}
                                            className={`border-r-[3px] border-black p-3 transition-colors ${authMode === 'signup' ? 'bg-stone-100' : 'bg-white'}`}
                                            disabled={loading}
                                        >
                                            <span className="mb-1 block text-[10px] font-black tracking-wider text-stone-500">ACCOUNT</span>
                                            <span className="text-sm font-bold text-black">Sign Up</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAuthMode('signin');
                                                resetPanelState();
                                            }}
                                            className={`p-3 transition-colors ${authMode === 'signin' ? 'bg-stone-100' : 'bg-white'}`}
                                            disabled={loading}
                                        >
                                            <span className="mb-1 block text-[10px] font-black tracking-wider text-stone-500">ACCESS</span>
                                            <span className="text-sm font-bold text-black">Log In</span>
                                        </button>
                                    </div>
                                )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
