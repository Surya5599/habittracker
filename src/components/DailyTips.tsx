import React, { useState, useEffect } from 'react';
import { Lightbulb, Coffee } from 'lucide-react';
import { supabase } from '../supabase';

interface Tip {
    id?: string;
    text: string;
    icon: string; // 'lightbulb' | 'coffee'
}

export const DailyTips: React.FC = () => {
    const [tips, setTips] = useState<Tip[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [fade, setFade] = useState(true);

    const FALLBACK_TIPS = [
        {
            text: "Did you know? If you complete your day, you can share a HabiCard celebrating your achievement on social media.",
            icon: 'lightbulb'
        },
        {
            text: "Enjoying the app? Consider supporting the project with a coffee to help keep it free and ad-free.",
            icon: 'coffee'
        },
        {
            text: "Consistency is key. Even a small step each day adds up to big results over time.",
            icon: 'lightbulb'
        }
    ];

    useEffect(() => {
        const fetchTips = async () => {
            try {
                const { data, error } = await supabase
                    .from('daily_tips')
                    .select('*')
                    .eq('active', true);

                if (error) throw error;
                if (data && data.length > 0) {
                    setTips(data);
                } else {
                    setTips(FALLBACK_TIPS);
                }
            } catch (error) {
                console.error('Error fetching tips:', error);
                setTips(FALLBACK_TIPS);
            }
        };

        fetchTips();
    }, []);

    useEffect(() => {
        if (tips.length === 0) return;

        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % tips.length);
                setFade(true);
            }, 300);
        }, 8000);

        return () => clearInterval(interval);
    }, [tips]);

    if (tips.length === 0) return null;

    const currentTip = tips[currentIndex];

    const renderIcon = (iconName: string) => {
        if (iconName === 'coffee') return <Coffee size={12} className="text-stone-600" />;
        return <Lightbulb size={12} className={iconName === 'lightbulb' && currentTip.text.includes('HabiCard') ? "text-amber-500" : "text-stone-400"} />;
    };

    return (
        <div className="mt-2 border-t border-stone-100 pt-1.5 px-1 min-h-[32px] flex items-center">
            <div className={`flex gap-2 transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex-shrink-0 mt-0.5">
                    {renderIcon(currentTip.icon)}
                </div>
                <p className="text-[10px] text-stone-500 font-medium leading-tight">
                    {currentTip.text}
                </p>
            </div>
        </div>
    );
};
