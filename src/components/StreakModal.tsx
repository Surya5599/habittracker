import React from 'react';
import { X, Flame, Trophy, Award, Zap } from 'lucide-react';
import { Habit, Theme } from '../types';

interface StreakModalProps {
    isOpen: boolean;
    onClose: () => void;
    habits: Habit[];
    topHabits: any[]; // From annualStats.topHabits
    theme: Theme;
    globalCurrentStreak: number;
    globalMaxStreak: number;
}

export const StreakModal: React.FC<StreakModalProps> = ({
    isOpen,
    onClose,
    habits,
    topHabits,
    theme,
    globalCurrentStreak,
    globalMaxStreak
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white w-full max-w-4xl neo-border neo-shadow-lg rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b-2 border-black flex items-center justify-between relative" style={{ backgroundColor: theme.primary }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl neo-border shadow-sm">
                            <Flame size={24} className="text-orange-500 fill-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-tight">Streak Master</h2>
                            <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Your consistency records</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/10 rounded-full transition-colors text-white"
                    >
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Global Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-2xl flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">Total Streak</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-orange-600">{globalCurrentStreak}</span>
                                    <span className="text-xs font-black text-orange-400">DAYS</span>
                                </div>
                            </div>
                            <Flame size={48} className="text-orange-200 fill-orange-200" />
                        </div>
                        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-2xl flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">Best Ever</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-amber-600">{globalMaxStreak}</span>
                                    <span className="text-xs font-black text-amber-400">DAYS</span>
                                </div>
                            </div>
                            <Trophy size={48} className="text-amber-200 fill-amber-200" />
                        </div>
                    </div>

                    {/* Habit Streaks */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap size={14} className="text-stone-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">All Your Streaks</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {topHabits.map((habit) => (
                                <div key={habit.id} className="bg-stone-50 border-2 border-stone-100 p-4 rounded-2xl group hover:border-black transition-all flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex flex-col max-w-[60%]">
                                            <span className="text-sm font-black text-stone-800 group-hover:text-black transition-colors truncate" title={habit.name}>{habit.name}</span>
                                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-tight mt-0.5">{habit.badge}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                                            <Flame size={14} className="fill-orange-600" />
                                            <span className="text-lg font-black leading-none">{habit.currentStreak}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-stone-400 uppercase tracking-tighter">Personal Best</span>
                                                <span className="text-xs font-black text-stone-600">{habit.maxStreak} Days</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[8px] font-black text-stone-400 uppercase tracking-tighter">Total Hits</span>
                                                <span className="text-xs font-black text-stone-600">{habit.completed}</span>
                                            </div>
                                        </div>

                                        <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full transition-all duration-1000"
                                                style={{
                                                    width: `${Math.min(100, (habit.currentStreak / (habit.maxStreak || 1)) * 100)}%`,
                                                    backgroundColor: theme.primary
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="p-4 bg-stone-50 border-t-2 border-black text-center">
                    <p className="text-[10px] font-bold text-stone-500 italic">
                        "Your future is found in your daily routine."
                    </p>
                </div>
            </div>
        </div>
    );
};
