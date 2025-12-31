import React, { useEffect, useState } from 'react';
import { Lightbulb, Coffee } from 'lucide-react';

export const DailyTips: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [fade, setFade] = useState(true);

    const TIPS = [
        {
            text: "Did you know? If you complete your day, you can share a HabiCard celebrating your achievement on social media.",
            icon: <Lightbulb size={12} className="text-amber-500" />
        },
        {
            text: "Enjoying the app? Consider supporting the project with a coffee to help keep it free and ad-free.",
            icon: <Coffee size={12} className="text-stone-600" />
        },
        {
            text: "Consistency is key. Even a small step each day adds up to big results over time.",
            icon: <Lightbulb size={12} className="text-stone-400" />
        },
        {
            text: "Use the 'My Habits' menu to customize your tracking and set colors that motivate you.",
            icon: <Lightbulb size={12} className="text-stone-400" />
        },
        {
            text: "Check your Monthly view to spot trends and identify which days you're most productive.",
            icon: <Lightbulb size={12} className="text-stone-400" />
        },
        {
            text: "Missed a day? Don't worry. The most important habit is getting back on track.",
            icon: <Lightbulb size={12} className="text-stone-400" />
        },
        {
            text: "Review your Annual Performance in the Dashboard to see your long-term growth.",
            icon: <Lightbulb size={12} className="text-stone-400" />
        },
        {
            text: "Toggle between Line and Bar charts in the header to visualize your progress differently.",
            icon: <Lightbulb size={12} className="text-stone-400" />
        },
        {
            text: "You can use 'Guest Mode' to try out features, but Sign In to sync across devices.",
            icon: <Lightbulb size={12} className="text-stone-400" />
        },
        {
            text: "Setting too many habits at once can be overwhelming. Start with 3 core habits.",
            icon: <Lightbulb size={12} className="text-stone-400" />
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % TIPS.length);
                setFade(true);
            }, 300); // Wait for fade out
        }, 8000); // 8 seconds per tip

        return () => clearInterval(interval);
    }, []);

    const currentTip = TIPS[currentIndex];

    return (
        <div className="mt-2 border-t border-stone-100 pt-1.5 px-1 min-h-[32px] flex items-center">
            <div className={`flex gap-2 transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex-shrink-0 mt-0.5">
                    {currentTip.icon}
                </div>
                <p className="text-[10px] text-stone-500 font-medium leading-tight">
                    {currentTip.text}
                </p>
            </div>
        </div>
    );
};
