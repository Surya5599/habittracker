import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Zap, Target, Award, ArrowRight, TrendingUp, TrendingDown, Pencil, Sparkles, RefreshCw, GripVertical } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import YearView from './YearView';
import { ResolutionsModal } from './ResolutionsModal';
import { CircularProgress } from './CircularProgress';
import { RetroGrid } from './RetroGrid';
import { FormattedText } from './FormattedText';
import { Habit, Theme, MonthStats, MonthlyGoal } from '../types';
import { MONTHS } from '../constants';
import { generateUUID } from '../utils/uuid';
import { buildAnnualStory } from '../utils/storyGenerator';

interface DashboardViewProps {
    annualStats: {
        totalCompletions: number;
        totalPossible: number;
        monthlySummaries: any[];
        topHabits: any[];
        maxStreak: number;
        strongestMonth: any;
        consistencyRate: number;
        activeDays?: number;
        activeHabitsCount?: number;
        momentum?: string;
        storyVariant?: string;
        fadingHabit?: any;
        longestHabitStreak?: any;
        weekdayRate?: number;
        weekendRate?: number;
    };
    habits: Habit[];
    theme: Theme;
    currentYear: number;
    setCurrentMonthIndex: (idx: number) => void;
    setView: (view: 'monthly' | 'dashboard') => void;
    updateMonthlyGoals: (key: string, goals: any[]) => void;
    reorderHabits: (newHabits: Habit[]) => Promise<void>;
    setSelectedDateForCard: (date: Date | null, flipped?: boolean) => void;
    startOfWeek: 'monday' | 'sunday';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
    annualStats,
    habits,
    theme,
    currentYear,
    setCurrentMonthIndex,
    setView,
    monthlyGoals,
    updateMonthlyGoals,
    reorderHabits,
    setSelectedDateForCard,
    startOfWeek,
}) => {
    const { t } = useTranslation();
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
    const [editingGoalText, setEditingGoalText] = useState('');
    const [warningMonthKey, setWarningMonthKey] = useState<string | null>(null);
    const [isResolutionsModalOpen, setIsResolutionsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'habits' | 'mood'>('habits');
    const goalInputRef = useRef<HTMLInputElement>(null);

    const handleFinishEditing = (goalId: string, monthKey: string) => {
        const currentGoals = monthlyGoals[monthKey] || [];
        const goal = currentGoals.find((g: MonthlyGoal) => g.id === goalId);

        if (!goal) {
            setEditingGoalId(null);
            return;
        }

        const trimmedText = editingGoalText.trim();

        if (!trimmedText) {
            // Remove if empty
            updateMonthlyGoals(monthKey, currentGoals.filter((g: MonthlyGoal) => g.id !== goalId));
        } else {
            // Update
            updateMonthlyGoals(monthKey, currentGoals.map((g: MonthlyGoal) =>
                g.id === goalId ? { ...g, text: trimmedText } : g
            ));
        }
        setEditingGoalId(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white neo-border neo-shadow rounded-2xl flex flex-col relative overflow-hidden h-full">
                    <div className="flex items-center gap-2 mb-3 border-b border-stone-100 pb-1">
                        <div className="p-1 bg-stone-100 text-black rounded-lg"><Zap size={16} strokeWidth={2.5} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Identity Summary</span>
                    </div>

                    <div className="space-y-5">
                        {/* Primary Identity */}
                        <div>
                            <span className="text-[8px] font-black uppercase text-stone-300 tracking-[0.2em] mb-1.5 block">Primary Identity</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black italic tracking-tighter" style={{ color: theme.primary }}>
                                    {annualStats.consistencyRate >= 80 ? 'The Architect' :
                                        annualStats.consistencyRate >= 60 ? 'The Builder' :
                                            annualStats.consistencyRate >= 40 ? 'The Explorer' : 'The Novice'}
                                </span>
                                <span className="text-[10px] font-bold text-stone-400 capitalize">
                                    {annualStats.consistencyRate.toFixed(0)}% Follow-through
                                </span>
                            </div>
                        </div>

                        {/* Rhythms */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[8px] font-black uppercase text-stone-300 tracking-[0.2em] mb-1.5 block">Signature Strength</span>
                                <div className="space-y-1">
                                    <span className="text-xs font-black uppercase block leading-none">
                                        {annualStats.weekdayRate! >= annualStats.weekendRate! ? 'Weekday Rhythm' : 'Weekend Warrior'}
                                    </span>
                                    <span className="text-[10px] font-bold text-stone-400">
                                        {Math.max(annualStats.weekdayRate || 0, annualStats.weekendRate || 0).toFixed(0)}% Consistency
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="text-[8px] font-black uppercase text-stone-300 tracking-[0.2em] mb-1.5 block">Main Challenge</span>
                                <div className="space-y-1">
                                    <span className="text-xs font-black uppercase block leading-none text-rose-500">
                                        {annualStats.weekdayRate! < annualStats.weekendRate! ? 'Weekdays' : 'Weekends'}
                                    </span>
                                    <span className="text-[10px] font-bold text-stone-400">
                                        {Math.min(annualStats.weekdayRate || 0, annualStats.weekendRate || 0).toFixed(0)}% Completion
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Flow */}
                        <div>
                            <span className="text-[8px] font-black uppercase text-stone-300 tracking-[0.2em] mb-1.5 block">Active Days</span>
                            <div className="space-y-1">
                                <span className="text-xs font-black uppercase block leading-none">
                                    {annualStats.activeDays || 0} Days
                                </span>
                                <span className="text-[10px] font-bold text-stone-400">
                                    Yearly Activity
                                </span>
                            </div>
                        </div>

                        {/* Proudest Metric */}
                        <div className="pt-4 border-t border-stone-50">
                            <span className="text-[8px] font-black uppercase text-stone-300 tracking-[0.2em] mb-1.5 block">Proudest Achievement</span>
                            <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                                <div className="p-2 bg-white rounded-lg shadow-sm neo-border flex items-center justify-center">
                                    <Trophy size={14} className="text-amber-500" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-black uppercase block leading-none truncate w-32">
                                        {annualStats.topHabits?.[0]?.name || 'First Habit'}
                                    </span>
                                    <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-1 block">
                                        {annualStats.maxStreak} Day Peak Streak
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-1 h-full">
                    <YearView theme={theme} currentYear={currentYear} annualStats={annualStats} />
                </div>

                <div className="md:col-span-2 p-4 bg-white neo-border neo-shadow rounded-2xl flex flex-col min-h-[220px]">
                    <div className="flex items-center gap-2 mb-3 border-b border-stone-100 pb-2">
                        <div className="p-1 bg-amber-100 text-amber-600 rounded"><Sparkles size={14} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Your Story This Year</span>
                    </div>

                    {(() => {
                        const today = new Date();
                        const monthsElapsed = currentYear === today.getFullYear() ? today.getMonth() + 1 : 12;
                        const story = buildAnnualStory(annualStats, t, monthsElapsed);
                        if (!story.focused) {
                            return <div className="flex-1 flex items-center justify-center text-stone-300 italic text-sm">No significant habit outcomes for this year yet.</div>;
                        }

                        return (
                            <div className="flex-1 flex flex-col justify-between py-2 overflow-y-auto pr-1 custom-scrollbar">
                                <div className="space-y-5">
                                    {story.sections.map((section, idx) => {
                                        const content = (
                                            <FormattedText
                                                text={section.text}
                                                highlightColor={theme.secondary}
                                                className={section.type === 'consistency' ? 'italic' : section.type === 'experimental' ? 'text-indigo-800' : section.type === 'fading' ? 'text-amber-800' : section.type === 'neglected' ? 'text-rose-800' : ''}
                                            />
                                        );

                                        if (section.type === 'momentum' || section.type === 'rhythm') {
                                            return (
                                                <p key={idx} className="text-sm leading-relaxed">
                                                    {content}
                                                </p>
                                            );
                                        }

                                        if (section.type === 'experimental') {
                                            return (
                                                <div key={idx} className="p-3 bg-indigo-50 border-l-4 border-indigo-400 text-xs rounded-r-lg">
                                                    <span className="font-black uppercase block mb-1 text-indigo-800">Curiosity & Growth</span>
                                                    {content}
                                                </div>
                                            );
                                        }

                                        if (section.type === 'fading') {
                                            return (
                                                <div key={idx} className="p-3 bg-amber-50 border-l-4 border-amber-400 text-xs rounded-r-lg">
                                                    <span className="font-black uppercase block mb-1 text-amber-800">Fading Habit Alert</span>
                                                    {content}
                                                </div>
                                            );
                                        }

                                        if (section.type === 'consistency') {
                                            return (
                                                <div key={idx} className="p-3 bg-stone-50 border-l-4 border-black italic text-xs leading-relaxed">
                                                    {content}
                                                </div>
                                            );
                                        }

                                        if (section.type === 'neglected') {
                                            return (
                                                <div key={idx} className="flex items-start gap-3 p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                                                    <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg"><RefreshCw size={14} /></div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Reflections</span>
                                                        <p className="text-xs leading-tight">
                                                            {content}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return null;
                                    })}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div >

            <div className="flex flex-col gap-3 mt-8 mb-6">
                <h3 className="text-xl font-black uppercase tracking-tighter">Monthly Breakdown</h3>
                <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 shadow-sm w-fit">
                    <button
                        onClick={() => setViewMode('habits')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'habits' ? 'bg-white text-black shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        Habits
                    </button>
                    <button
                        onClick={() => setViewMode('mood')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'mood' ? 'bg-white text-black shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        Mood
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 w-full">
                {MONTHS.map((m, idx) => {
                    const monthSummary = annualStats.monthlySummaries[idx];
                    const rate = monthSummary.rate;
                    const signal = monthSummary.signal;
                    const delta = monthSummary.delta;

                    const isCurrentMonth = idx === new Date().getMonth() && currentYear === new Date().getFullYear();
                    const isPastMonth = currentYear < new Date().getFullYear() || (currentYear === new Date().getFullYear() && idx < new Date().getMonth());
                    const headerColor = isCurrentMonth ? theme.primary : theme.secondary;

                    return (
                        <div key={m} className={`bg-white neo-border hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group rounded-2xl flex flex-col h-auto min-h-[500px] relative overflow-hidden ${isPastMonth ? 'opacity-75' : ''} neo-shadow`}>
                            <div className="flex items-center justify-center py-2 border-b-2 border-black" style={{ backgroundColor: headerColor }}>
                                <span className="text-sm font-black uppercase tracking-[0.2em] text-white">{m} {currentYear}</span>
                            </div>

                            <div className="flex-1 flex flex-col pt-4 px-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                                        {viewMode === 'habits' ? 'Retrospective Grid' : 'Mood Analysis'}
                                    </span>
                                    <span className="text-[10px] font-black uppercase" style={{ color: headerColor }}>
                                        {viewMode === 'habits' ? `${Math.round(rate)}% Done` : 'Month Vibe'}
                                    </span>
                                </div>

                                <RetroGrid
                                    days={monthSummary.days || []}
                                    viewMode={viewMode}
                                    monthIndex={idx}
                                    year={currentYear}
                                    onDayClick={(day) => setSelectedDateForCard(new Date(currentYear, idx, day), viewMode === 'mood')}
                                    startOfWeek={startOfWeek}
                                />

                                <div className="text-center py-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">
                                        {m} {currentYear}
                                    </span>
                                </div>

                                <div className="w-full grid grid-cols-2 gap-x-2 gap-y-4 pt-2 border-t border-stone-100">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase text-stone-400 tracking-tighter mb-0.5">Best Habit</span>
                                        <span className="text-[10px] font-black uppercase truncate" title={monthSummary.topHabit ? monthSummary.topHabit.name : 'None'}>
                                            {monthSummary.topHabit ? monthSummary.topHabit.name : '-'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase text-stone-400 tracking-tighter mb-0.5">Best Streak</span>
                                        <span className="text-lg font-black uppercase text-amber-600 leading-none">{monthSummary.maxStreak}d</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase text-stone-400 tracking-tighter mb-0.5">Perfect Days</span>
                                        <span className="text-lg font-black leading-none">{monthSummary.perfectDays || 0}</span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-3 pb-2 flex flex-col gap-2">
                                    <div className="border-t border-stone-100 pt-2 w-full">
                                        <div className="flex items-center justify-between mb-1 relative">
                                            <span className="text-[9px] font-black uppercase text-stone-400">Goals</span>
                                            {warningMonthKey === `${currentYear}-${idx}` && (
                                                <div className="absolute right-0 bottom-full mb-2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded animate-in fade-in slide-in-from-bottom-1 z-10 whitespace-nowrap after:content-[''] after:absolute after:top-full after:right-4 after:border-4 after:border-transparent after:border-t-black">
                                                    Maximum 3 goals allowed
                                                </div>
                                            )}
                                            {!isPastMonth && (
                                                <button
                                                    onClick={() => {
                                                        const key = `${currentYear}-${idx}`;
                                                        const currentGoals = monthlyGoals[key] || [];
                                                        if (currentGoals.length >= 3) {
                                                            setWarningMonthKey(key);
                                                            setTimeout(() => setWarningMonthKey(null), 3000);
                                                            return;
                                                        }
                                                        const newGoal: MonthlyGoal = { id: generateUUID(), text: '', completed: false };
                                                        updateMonthlyGoals(key, [...currentGoals, newGoal]);
                                                        setEditingGoalId(newGoal.id);
                                                        setEditingGoalText('');
                                                    }}
                                                    className="text-[9px] font-black uppercase hover:text-black transition-colors"
                                                    style={{ color: headerColor }}
                                                >
                                                    + Add
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                                            {(monthlyGoals[`${currentYear}-${idx}`] || []).length > 0 ? (
                                                (monthlyGoals[`${currentYear}-${idx}`] || []).map((goal: MonthlyGoal, gIdx: number) => (
                                                    <div key={goal.id} className={`flex items-center gap-2 group/goal ${editingGoalId === goal.id ? 'bg-stone-50 p-1 rounded-sm border border-black ring-1 ring-black/5' : 'py-0.5'} transition-all`}>
                                                        <button
                                                            onClick={(e) => {
                                                                if (isPastMonth) return;
                                                                e.stopPropagation();
                                                                const key = `${currentYear}-${idx}`;
                                                                const currentGoals = monthlyGoals[key] || [];
                                                                const newGoals = currentGoals.map((g: MonthlyGoal) =>
                                                                    g.id === goal.id ? { ...g, completed: !g.completed } : g
                                                                );
                                                                updateMonthlyGoals(key, newGoals);
                                                            }}
                                                            disabled={isPastMonth}
                                                            className={`w-3 h-3 flex-shrink-0 border border-black flex items-center justify-center transition-all ${isPastMonth ? 'cursor-default opacity-50' : ''} ${goal.completed ? 'bg-black text-white' : 'bg-white hover:bg-stone-200'}`}
                                                        >
                                                            {goal.completed && <div className="w-1.5 h-1.5 bg-white" />}
                                                        </button>

                                                        {editingGoalId === goal.id ? (
                                                            <input
                                                                ref={goalInputRef}
                                                                type="text"
                                                                value={editingGoalText}
                                                                onChange={(e) => setEditingGoalText(e.target.value)}
                                                                onBlur={() => handleFinishEditing(goal.id, `${currentYear}-${idx}`)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        handleFinishEditing(goal.id, `${currentYear}-${idx}`);
                                                                    }
                                                                }}
                                                                className="w-full text-[10px] font-medium bg-transparent outline-none leading-tight border-none p-0 focus:ring-0 text-stone-800"
                                                                autoFocus
                                                                placeholder="Type goal..."
                                                            />
                                                        ) : (
                                                            <span
                                                                className={`text-[10px] leading-snug flex-1 font-medium transition-all ${goal.completed ? 'text-stone-400 line-through' : 'text-stone-700'}`}
                                                                onDoubleClick={() => {
                                                                    if (!isPastMonth) {
                                                                        setEditingGoalId(goal.id);
                                                                        setEditingGoalText(goal.text);
                                                                    }
                                                                }}
                                                            >
                                                                {goal.text}
                                                            </span>
                                                        )}

                                                        {!editingGoalId && !isPastMonth && (
                                                            <div className="flex items-center gap-1 opacity-0 group-hover/goal:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingGoalId(goal.id);
                                                                        setEditingGoalText(goal.text);
                                                                    }}
                                                                    className="text-stone-400 hover:text-black transition-colors"
                                                                >
                                                                    <Pencil size={8} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const key = `${currentYear}-${idx}`;
                                                                        const currentGoals = monthlyGoals[key] || [];
                                                                        updateMonthlyGoals(key, currentGoals.filter((g: MonthlyGoal) => g.id !== goal.id));
                                                                    }}
                                                                    className="text-stone-400 hover:text-red-500 transition-all font-black px-1"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                !isPastMonth && (
                                                    <div
                                                        className="min-h-[40px] flex items-center justify-center border-2 border-dashed border-stone-100 rounded-sm cursor-pointer hover:bg-stone-50 transition-colors"
                                                        onClick={() => {
                                                            const key = `${currentYear}-${idx}`;
                                                            const currentGoals = monthlyGoals[key] || [];
                                                            const newGoal: MonthlyGoal = { id: generateUUID(), text: '', completed: false };
                                                            updateMonthlyGoals(key, [...currentGoals, newGoal]);
                                                            setEditingGoalId(newGoal.id);
                                                            setEditingGoalText('');
                                                        }}
                                                    >
                                                        <span className="text-[9px] text-stone-400 italic">Add your main goals</span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div >

            <ResolutionsModal
                isOpen={isResolutionsModalOpen}
                onClose={() => setIsResolutionsModalOpen(false)}
                year={currentYear}
                currentResolutions={monthlyGoals[`resolutions-${currentYear}`] || []}
                onSave={(resolutions) => updateMonthlyGoals(`resolutions-${currentYear}`, resolutions)}
            />
        </div >
    );
};
