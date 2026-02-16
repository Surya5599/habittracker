import React from 'react';
import { Theme } from '../types';
import { Angry, Frown, Meh, Smile, Laugh } from 'lucide-react';

interface RetroGridProps {
    days: any[];
    viewMode: 'habits' | 'mood';
    theme: Theme;
    monthIndex: number;
    year: number;
    onDayClick?: (day: number) => void;
    startOfWeek: 'monday' | 'sunday';
}

export const RetroGrid: React.FC<RetroGridProps> = ({
    days,
    viewMode,
    monthIndex,
    year,
    onDayClick,
    startOfWeek
}) => {
    const firstDayOfMonth = new Date(year, monthIndex, 1).getDay();
    // In our calendar we start on Sunday (0) or Monday (1)?
    // The screenshot shows M T W T F S S, which means Monday is first.
    // Sunday in JS is 0, Monday is 1.
    // To start with Monday, we shift: (day + 6) % 7
    // To start with Sunday, we don't shift (day is already 0-6 starting Sun)
    const firstDayShifted = startOfWeek === 'monday' ? (firstDayOfMonth + 6) % 7 : firstDayOfMonth;

    const MOOD_CONFIG: Record<number, { icon: any, color: string }> = {
        1: { icon: Angry, color: '#ef4444' },
        2: { icon: Frown, color: '#f97316' },
        3: { icon: Meh, color: '#eab308' },
        4: { icon: Smile, color: '#84cc16' },
        5: { icon: Laugh, color: '#10b981' },
    };

    const grid = [];

    // Add empty slots
    for (let i = 0; i < firstDayShifted; i++) {
        grid.push(<div key={`empty-${i}`} className="aspect-square w-full" />);
    }

    days.forEach((day, idx) => {
        let bgColor = '#ffffff';
        let content = null;
        let textColor = 'black';

        if (viewMode === 'habits') {
            const rate = day.totalPossible > 0 ? (day.habitsCompleted / day.totalPossible) : 0;
            if (day.habitsCompleted > 0) {
                // Using olive/green shades consistent with retro aesthetics
                if (rate >= 1) bgColor = '#4d614d'; // Dark Olive for 100%
                else if (rate >= 0.7) bgColor = '#8da18d'; // Sage for 70%+
                else if (rate >= 0.4) bgColor = '#a8c9a8'; // Light Sage for 40%+
                else bgColor = '#c9d9c9'; // Very light for low completion

                if (rate >= 0.7) textColor = 'white';
            }
            content = (
                <span className="text-[10px] font-black leading-none drop-shadow-sm" style={{ color: textColor }}>
                    {day.totalPossible > 0 ? `${Math.round(rate * 100)}%` : '0%'}
                </span>
            );
        } else {
            if (day.mood) {
                const config = MOOD_CONFIG[day.mood];
                if (config) {
                    bgColor = config.color;
                    const Icon = config.icon;
                    content = <Icon size={18} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" strokeWidth={3} />;
                }
            }
        }

        grid.push(
            <div
                key={idx}
                onClick={() => onDayClick?.(idx + 1)}
                className="aspect-square w-full neo-border bg-white flex items-center justify-center relative overflow-hidden group mb-[1px] cursor-pointer"
                style={{ backgroundColor: bgColor }}
            >
                <span className="absolute bottom-0 right-0.5 text-[7px] font-black opacity-40 pointer-events-none select-none" style={{ color: textColor }}>
                    {idx + 1}
                </span>
                <div className="flex items-center justify-center w-full h-full p-0.5">
                    {content}
                </div>
            </div>
        );
    });

    return (
        <div className="w-full space-y-2">
            <div className="grid grid-cols-7 gap-1 w-full">
                {(startOfWeek === 'monday'
                    ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
                    : ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                ).map((d, i) => (
                    <div key={i} className="text-[10px] font-black text-black text-center">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 w-full">
                {grid}
            </div>
        </div>
    );
};
