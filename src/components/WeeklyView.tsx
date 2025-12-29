import React from 'react';
import { Check, Plus, Share2 } from 'lucide-react';
import { Habit, HabitCompletion, Theme, DailyNote } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { isCompleted as checkCompleted } from '../utils/stats';
import { generateShareCard, shareCard } from '../utils/shareCardGenerator';
import { ShareCustomizationModal, ColorScheme } from './ShareCustomizationModal';

interface WeeklyViewProps {
    habits: Habit[];
    completions: HabitCompletion;
    currentYear: number;
    weekOffset: number;
    theme: Theme;
    toggleCompletion: (habitId: string, dateKey: string) => void;
    notes: DailyNote;
    updateNote: (dateKey: string, content: string) => void;
    addHabit: () => void;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
    habits,
    completions,
    currentYear,
    weekOffset,
    theme,
    toggleCompletion,
    notes,
    updateNote,
    addHabit,
}) => {
    const [shareModalOpen, setShareModalOpen] = React.useState(false);
    const [shareData, setShareData] = React.useState<{
        date: Date;
        dayName: string;
        dateString: string;
        completedCount: number;
        totalCount: number;
        progress: number;
    } | null>(null);

    // Calculate the dates for the current week (starting Monday)
    const getWeekDates = () => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7); // adjust when day is sunday and add offset
        const monday = new Date(today.getFullYear(), today.getMonth(), diff);

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            return date;
        });
    };

    const weekDates = getWeekDates();

    const getDayProgress = (date: Date) => {
        if (habits.length === 0) return 0;
        const monthIdx = date.getMonth();
        const day = date.getDate();
        const year = date.getFullYear();
        let doneCount = 0;
        habits.forEach(h => {
            if (checkCompleted(h.id, day, completions, monthIdx, year)) {
                doneCount++;
            }
        });
        return (doneCount / habits.length) * 100;
    };

    const handleShareClick = (date: Date, dayName: string, dateString: string, completedCount: number, totalCount: number, progress: number) => {
        setShareData({ date, dayName, dateString, completedCount, totalCount, progress });
        setShareModalOpen(true);
    };

    const handleShareConfirm = async (colorScheme: ColorScheme, message: string) => {
        if (!shareData) return;

        try {
            const blob = await generateShareCard({
                dayName: shareData.dayName,
                dateString: shareData.dateString,
                completedCount: shareData.completedCount,
                totalCount: shareData.totalCount,
                progress: shareData.progress,
                theme,
                colorScheme,
                message
            });
            await shareCard(blob, shareData.dayName);
        } catch (error) {
            console.error('Failed to share:', error);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {weekDates.map((date, index) => {
                    const dayName = DAYS_OF_WEEK[date.getDay()];
                    const dateString = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
                    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    const progress = getDayProgress(date);
                    const isToday = date.toDateString() === new Date().toDateString();

                    const completedCount = habits.reduce((acc, h) =>
                        acc + (checkCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear()) ? 1 : 0), 0);
                    const totalCount = habits.length;

                    return (
                        <div key={dateKey} className={`border-[2px] border-black bg-white flex flex-col overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 ${isToday ? 'ring-2 ring-black ring-offset-2' : ''}`}>
                            {/* Header */}
                            <div className="p-3 text-center border-b-[2px] border-black" style={{ backgroundColor: isToday ? theme.secondary : theme.primary }}>
                                <h3 className="text-white font-black uppercase tracking-tighter text-lg leading-tight">{dayName}</h3>
                                <p className="text-white/80 font-bold text-[10px] tracking-widest">{dateString}</p>
                            </div>

                            {/* Progress Circle */}
                            <div className="p-4 flex flex-col items-center justify-center border-b border-stone-100">
                                <div className="relative w-24 h-24">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            className="text-stone-100"
                                        />
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            strokeDasharray={2 * Math.PI * 40}
                                            strokeDashoffset={2 * Math.PI * 40 * (1 - progress / 100)}
                                            strokeLinecap="round"
                                            className="transition-all duration-500 ease-out"
                                            style={{ color: isToday ? theme.secondary : theme.primary }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xl font-black">{Math.round(progress)}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Daily Habits List */}
                            <div className="flex-1 p-3 bg-stone-50/50">
                                <div className="flex items-center justify-between mb-2 pb-1 border-b border-black/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Daily Habits</span>
                                </div>
                                <div className="space-y-1">
                                    {habits.map(habit => {
                                        const done = checkCompleted(habit.id, date.getDate(), completions, date.getMonth(), date.getFullYear());
                                        return (
                                            <div key={habit.id} className="flex items-center justify-between group">
                                                <span className={`text-[11px] font-bold truncate flex-1 ${done ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                                                    {habit.name || 'Untitled'}
                                                </span>
                                                <button
                                                    onClick={() => toggleCompletion(habit.id, dateKey)}
                                                    className={`w-4 h-4 border-2 border-black flex items-center justify-center transition-all ${done ? 'bg-black text-white' : 'bg-white hover:bg-stone-100'}`}
                                                >
                                                    {done && <Check size={10} strokeWidth={4} />}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {completedCount === totalCount && totalCount > 0 ? (
                                <div className="border-t border-black">
                                    <button
                                        onClick={() => handleShareClick(date, dayName, dateString, completedCount, totalCount, progress)}
                                        className="w-full p-3 bg-black text-white font-black uppercase tracking-widest text-[11px] hover:bg-stone-800 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <Share2 size={14} className="group-hover:scale-110 transition-transform" />
                                        Share Achievement
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 text-center text-[9px] font-black uppercase tracking-tight border-t border-black">
                                    <div className="p-1 px-2 border-r border-black" style={{ backgroundColor: (isToday ? theme.secondary : theme.primary) + '20' }}>
                                        <span className="text-stone-500 block">Habits Maintained</span>
                                        <span className="text-lg leading-none">{completedCount}</span>
                                    </div>
                                    <div className="p-1 px-2" style={{ backgroundColor: '#f0f0f0' }}>
                                        <span className="text-stone-500 block">To Build</span>
                                        <span className="text-lg leading-none">{totalCount - completedCount}</span>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div className="border-t-2 border-black">
                                <div className="p-2 bg-stone-100 border-b-2 border-black text-[9px] font-black uppercase tracking-widest text-stone-500 flex items-center justify-between">
                                    <span>Notes</span>
                                    <span className="text-[8px] font-medium text-stone-400 normal-case tracking-normal">
                                        {(notes[dateKey] || '').length}/500
                                    </span>
                                </div>
                                <textarea
                                    value={notes[dateKey] || ''}
                                    onChange={(e) => updateNote(dateKey, e.target.value.slice(0, 500))}
                                    placeholder="Add your notes for the day..."
                                    className="w-full p-2 text-[10px] font-medium bg-white outline-none resize-none leading-tight placeholder:italic placeholder:text-stone-400 border-2 border-transparent focus:border-stone-300 focus:h-24 transition-all duration-200 h-16"
                                    maxLength={500}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <ShareCustomizationModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                onShare={handleShareConfirm}
            />
        </>
    );
};
