import React, { useEffect, useState, useRef } from 'react';
import { Quote } from 'lucide-react';
import { supabase } from '../supabase';

export const DailyQuote: React.FC = () => {
    const [motivation, setMotivation] = useState('');
    const [loading, setLoading] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchMotivation = async () => {
            try {
                // 1. Check local storage first (fastest)
                const cached = localStorage.getItem('habit_motivation');
                if (cached) {
                    setMotivation(cached);
                }

                // 2. Check Supabase user metadata
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user?.user_metadata?.motivation) {
                    const remoteMotivation = session.user.user_metadata.motivation;
                    setMotivation(remoteMotivation);
                    // Sync to local if different
                    if (remoteMotivation !== cached) {
                        localStorage.setItem('habit_motivation', remoteMotivation);
                    }
                }
            } catch (error) {
                console.error('Error fetching motivation:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMotivation();
    }, []);

    const handleSave = async () => {
        const text = motivation.trim();
        if (!text) return;

        // 1. Save locally
        localStorage.setItem('habit_motivation', text);

        // 2. Save to Supabase if logged in
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await supabase.auth.updateUser({
                    data: { motivation: text }
                });
            }
        } catch (error) {
            console.error('Error saving motivation:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            inputRef.current?.blur();
        }
    };

    if (loading) return <div className="h-12 animate-pulse bg-stone-100 rounded-sm w-full mt-2" />;

    return (
        <div className="mt-2 border-t border-stone-200 pt-2 px-1">
            <div className="flex gap-2 items-start">
                <Quote size={12} className="text-stone-400 flex-shrink-0 mt-1 fill-current" />
                <div className="flex flex-col gap-0 w-full">
                    <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider">I want to do this because</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={motivation}
                        onChange={(e) => setMotivation(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        placeholder="...enter your motivation here"
                        className="w-full bg-transparent border-b border-stone-200 focus:border-black outline-none text-[11px] font-medium text-stone-700 leading-tight italic placeholder:text-stone-300 py-0.5 transition-colors"
                    />
                </div>
            </div>
        </div>
    );
};
