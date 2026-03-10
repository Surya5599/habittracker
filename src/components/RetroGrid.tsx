import React from 'react';
import { Angry, Frown, Meh, Smile, Laugh } from 'lucide-react';

interface RetroGridProps {
    days: any[];
    viewMode: 'habits' | 'mood';
    monthIndex: number;
    year: number;
    onDayClick?: (day: number) => void;
    startOfWeek: 'monday' | 'sunday';
    variant?: 'card' | 'modal';
}

export const RetroGrid: React.FC<RetroGridProps> = ({
    days,
    viewMode,
    monthIndex,
    year,
    onDayClick,
    startOfWeek,
    variant = 'card'
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
    const isModal = variant === 'modal';
    const weekdayClassName = isModal
        ? 'text-[9px] sm:text-[10px] font-black text-stone-500 text-center'
        : 'text-[10px] font-black text-black text-center';

    const getHabitVisual = (rate: number) => {
        if (rate >= 1) {
            return { bgColor: '#1f4d3a', textColor: 'white', badgeBg: 'rgba(255,255,255,0.18)' };
        }
        if (rate >= 0.8) {
            return { bgColor: '#3f7a5f', textColor: 'white', badgeBg: 'rgba(255,255,255,0.18)' };
        }
        if (rate >= 0.6) {
            return { bgColor: '#76a98f', textColor: '#0f172a', badgeBg: 'rgba(255,255,255,0.55)' };
        }
        if (rate >= 0.35) {
            return { bgColor: '#b9d6c7', textColor: '#0f172a', badgeBg: 'rgba(255,255,255,0.65)' };
        }
        return { bgColor: '#e7f0eb', textColor: '#0f172a', badgeBg: 'rgba(255,255,255,0.7)' };
    };

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
            const percent = Math.round(rate * 100);
            if (day.habitsCompleted > 0) {
                const visual = getHabitVisual(rate);
                bgColor = visual.bgColor;
                textColor = visual.textColor;
            }
            content = day.habitsCompleted > 0 ? (
                <span
                    className={`font-black leading-none drop-shadow-sm tabular-nums tracking-[-0.06em] ${isModal ? (percent >= 100 ? 'text-[10px]' : 'text-[11px]') : (percent >= 100 ? 'text-[7px]' : 'text-[8px]')}`}
                    style={{ color: textColor }}
                >
                    {percent}%
                </span>
            ) : (
                <span className={`${isModal ? 'w-2 h-2' : 'w-1.5 h-1.5'} rounded-full bg-stone-300/70 block`} />
            );
        } else {
            if (day.mood) {
                const config = MOOD_CONFIG[day.mood];
                if (config) {
                    bgColor = config.color;
                    const Icon = config.icon;
                    content = <Icon size={isModal ? 16 : 18} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" strokeWidth={3} />;
                }
            }
        }

        grid.push(
            <div
                key={idx}
                onClick={() => onDayClick?.(idx + 1)}
                className={`aspect-square w-full border flex items-center justify-center relative overflow-hidden group mb-[1px] cursor-pointer transition-transform duration-150 hover:-translate-y-[1px] ${isModal ? 'rounded-[10px] border-stone-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]' : 'neo-border bg-white'}`}
                style={{ backgroundColor: bgColor }}
            >
                <span className={`absolute ${isModal ? 'top-1 left-1 text-[8px] opacity-55' : 'bottom-0 right-0.5 text-[7px] opacity-40'} font-black pointer-events-none select-none`} style={{ color: textColor }}>
                    {idx + 1}
                </span>
                <div className={`flex items-center justify-center w-full h-full ${isModal ? 'p-1.5' : 'p-0.5'}`}>
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
                    <div key={i} className={weekdayClassName}>{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 w-full">
                {grid}
            </div>
        </div>
    );
};
