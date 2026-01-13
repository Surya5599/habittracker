import React from 'react';
import { ChevronLeft, ChevronRight, LayoutDashboard, Calendar, Clock, LogIn, LogOut, ArrowUp, ArrowDown, Minus, Trophy, BarChart2, Activity, Sparkles } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { MONTHS } from '../constants';
import { Habit, Theme, MonthStats, MonthlyGoal, MonthlyGoals } from '../types';
import { useTranslation } from 'react-i18next';
import { SettingsMenu } from './SettingsMenu';
import { HabitManagerModal } from './HabitManagerModal';
import { ResolutionsModal } from './ResolutionsModal';
import { FormattedText } from './FormattedText';
import { StatCard } from './StatCard';
import { DailyQuote } from './DailyQuote';
import { DailyTips } from './DailyTips';
import { WeekPicker, MonthPicker, YearPicker } from './DateSelectors';
import { buildWeeklyStory, buildMonthlyStory } from '../utils/storyGenerator';

interface HeaderProps {
    view: 'monthly' | 'dashboard' | 'weekly';
    setView: (view: 'monthly' | 'dashboard' | 'weekly') => void;
    currentYear: number;
    setCurrentYear: React.Dispatch<React.SetStateAction<number>>;
    currentMonthIndex: number;
    setCurrentMonthIndex: React.Dispatch<React.SetStateAction<number>>;
    navigateMonth: (direction: 'prev' | 'next') => void;
    navigateWeek: (direction: 'prev' | 'next') => void;
    resetWeekOffset: () => void;
    weekRange?: string;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    themes: Theme[];
    settingsOpen: boolean;
    setSettingsOpen: (open: boolean) => void;
    settingsRef: React.RefObject<HTMLDivElement>;
    language: string;
    setLanguage: (lang: string) => void;
    guestMode: boolean;
    setGuestMode: (mode: boolean) => void;
    handleLogout: () => void;
    monthProgress: any;
    annualStats: any;
    dailyStats: any[];
    weeklyStats: any[];
    weekProgress: any;
    habits: Habit[];
    defaultView: 'daily' | 'monthly' | 'dashboard';
    setDefaultView: (view: 'daily' | 'monthly' | 'dashboard') => void;
    addHabit: (themePrimary: string) => Promise<string>;
    updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
    removeHabit: (id: string) => Promise<void>;
    prevWeekProgress?: any;
    allTimeBestWeek?: any;
    setWeekOffset?: (offset: number) => void;
    weekDelta: number;
    monthDelta: number;
    monthlyGoals: MonthlyGoals;
    updateMonthlyGoals: (key: string, goals: MonthlyGoal[]) => void;
    topHabitsThisMonth: any[];
    weekOffset: number;
    isHabitModalOpen: boolean;
    setIsHabitModalOpen: (open: boolean) => void;
    isResolutionsModalOpen: boolean;
    setIsResolutionsModalOpen: (open: boolean) => void;
    isStreakModalOpen: boolean;
    setIsStreakModalOpen: (open: boolean) => void;
    reorderHabits: (newHabits: Habit[]) => Promise<void>;
    onReportBug: () => void;
    hasUnreadFeedback: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    view,
    setView,
    currentYear,
    setCurrentYear,
    currentMonthIndex,
    setCurrentMonthIndex,
    navigateMonth,
    navigateWeek,
    resetWeekOffset,
    weekRange,
    theme,
    setTheme,
    themes,
    settingsOpen,
    setSettingsOpen,
    settingsRef,
    language,
    setLanguage,
    guestMode,
    setGuestMode,
    handleLogout,
    monthProgress,
    annualStats,
    dailyStats,
    weeklyStats,
    weekProgress,
    habits,
    defaultView,
    setDefaultView,
    addHabit,
    updateHabit,
    removeHabit,
    prevWeekProgress,
    allTimeBestWeek,
    setWeekOffset,
    weekDelta,
    monthDelta,
    monthlyGoals,
    updateMonthlyGoals,
    topHabitsThisMonth,
    weekOffset,
    isHabitModalOpen,
    setIsHabitModalOpen,
    isResolutionsModalOpen,
    setIsResolutionsModalOpen,
    isStreakModalOpen,
    setIsStreakModalOpen,
    reorderHabits,
    onReportBug,
    hasUnreadFeedback
}) => {
    const { t } = useTranslation();
    const today = new Date();
    const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const currentDayOfMonth = today.getDate();
    const currentMonthOfYear = today.getMonth();
    const currentFullYear = today.getFullYear();
    const [chartType, setChartType] = React.useState<'area' | 'bar'>(() => {
        return (localStorage.getItem('habit_chart_type') as 'area' | 'bar') || 'area';
    });

    const [showWeekSelector, setShowWeekSelector] = React.useState(false);
    const [showMonthSelector, setShowMonthSelector] = React.useState(false);
    const [showYearSelector, setShowYearSelector] = React.useState(false);

    React.useEffect(() => {
        localStorage.setItem('habit_chart_type', chartType);
    }, [chartType]);

    // Close selectors when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showWeekSelector || showMonthSelector || showYearSelector) {
                // Simple close on any click for now, can be more specific if needed
                // But since the picker stops propagation, clicking outside handles the close
                const target = event.target as HTMLElement;
                if (!target.closest('.date-selector-container')) {
                    setShowWeekSelector(false);
                    setShowMonthSelector(false);
                    setShowYearSelector(false);
                }
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showWeekSelector, showMonthSelector, showYearSelector]);


    const handleWeekSelect = (date: Date) => {
        if (!setWeekOffset) return;

        const today = new Date();
        const currentDay = today.getDay();
        const currentMondayDiff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
        const currentMonday = new Date(today.getFullYear(), today.getMonth(), currentMondayDiff);

        // Normalize times to compare dates only
        currentMonday.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);

        // Calculate diff in weeks
        const diffTime = selectedDate.getTime() - currentMonday.getTime();
        const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));

        setWeekOffset(diffWeeks);
    };

    const handleMonthSelect = (monthIndex: number, year: number) => {
        setCurrentMonthIndex(monthIndex);
        setCurrentYear(year);
    };

    const handleYearSelect = (year: number) => {
        setCurrentYear(year);
    };

    // Calculate current week start date for the picker
    // This logic mimics App.tsx but we probably should pass "weekOffset" to Header to verify implementation
    // But since we don't have weekOffset here (it's in App), we can calculate it relative to "reset".
    // Wait, we don't have weekOffset in props! We need to add it.
    // For now, let's assume 0 if undefined, but we need to add it to props.

    // Actually, calculate from weekRange string is risky.
    // Ideally we pass weekOffset.

    const getCurrentWeekStart = () => {
        // This is tricky without weekOffset. 
        // Let's rely on the user passing setWeekOffset and weekOffset.
        // IF we don't have it, we default to today.
        return new Date();
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3 bg-white neo-border neo-shadow rounded-2xl p-3 flex flex-col gap-3 h-full justify-between relative min-h-[160px]">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="flex-1">
                                {view === 'monthly' ? (
                                    <div className="flex items-center justify-between bg-white border border-stone-300 px-2 py-1 relative date-selector-container">
                                        <button onClick={() => navigateMonth('prev')} className="hover:text-black active:scale-95 transition-transform"><ChevronLeft size={16} /></button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowMonthSelector(!showMonthSelector); setShowWeekSelector(false); setShowYearSelector(false); }}
                                            className="font-bold uppercase tracking-widest text-sm select-none hover:bg-stone-50 px-2 py-0.5 rounded-sm transition-colors"
                                        >
                                            {MONTHS[currentMonthIndex]} {currentYear}
                                        </button>
                                        <MonthPicker
                                            isOpen={showMonthSelector}
                                            onClose={() => setShowMonthSelector(false)}
                                            currentMonthIndex={currentMonthIndex}
                                            currentYear={currentYear}
                                            onMonthSelect={handleMonthSelect}
                                            themePrimary={theme.primary}
                                        />
                                        <button onClick={() => navigateMonth('next')} className="hover:text-black active:scale-95 transition-transform"><ChevronRight size={16} /></button>
                                    </div>
                                ) : view === 'dashboard' ? (
                                    <div className="flex items-center justify-between bg-white border border-stone-300 px-2 py-1 relative date-selector-container">
                                        <button onClick={() => setCurrentYear(prev => prev - 1)} className="hover:text-black active:scale-95 transition-transform"><ChevronLeft size={16} /></button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowYearSelector(!showYearSelector); setShowWeekSelector(false); setShowMonthSelector(false); }}
                                            className="font-bold uppercase tracking-widest text-sm select-none hover:bg-stone-50 px-2 py-0.5 rounded-sm transition-colors"
                                        >
                                            {currentYear} Dashboard
                                        </button>
                                        <YearPicker
                                            isOpen={showYearSelector}
                                            onClose={() => setShowYearSelector(false)}
                                            currentYear={currentYear}
                                            onYearSelect={handleYearSelect}
                                            themePrimary={theme.primary}
                                        />
                                        <button onClick={() => setCurrentYear(prev => prev + 1)} className="hover:text-black active:scale-95 transition-transform"><ChevronRight size={16} /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between bg-white border border-stone-300 px-2 py-1 relative date-selector-container">
                                        <button onClick={() => navigateWeek('prev')} className="hover:text-black active:scale-95 transition-transform"><ChevronLeft size={16} /></button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowWeekSelector(!showWeekSelector); setShowMonthSelector(false); setShowYearSelector(false); }}
                                            className="font-bold uppercase tracking-widest text-sm select-none hover:bg-stone-50 px-2 py-0.5 rounded-sm transition-colors"
                                        >
                                            {weekRange}
                                        </button>
                                        <WeekPicker
                                            isOpen={showWeekSelector}
                                            onClose={() => setShowWeekSelector(false)}
                                            currentDate={getCurrentWeekStart()}
                                            onWeekSelect={handleWeekSelect}
                                            themePrimary={theme.primary}
                                        />
                                        <button onClick={() => navigateWeek('next')} className="hover:text-black active:scale-95 transition-transform"><ChevronRight size={16} /></button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <SettingsMenu
                                theme={theme}
                                setTheme={setTheme}
                                themes={themes}
                                settingsOpen={settingsOpen}
                                setSettingsOpen={setSettingsOpen}
                                settingsRef={settingsRef}
                                language={language}
                                setLanguage={setLanguage}
                                defaultView={defaultView}
                                setDefaultView={setDefaultView}
                                onReportBug={onReportBug}
                                hasUnreadFeedback={hasUnreadFeedback}
                            />

                            {guestMode ? (
                                <button
                                    onClick={() => window.location.href = '/signin'}
                                    className="flex items-center gap-1.5 px-2 py-1 border-[2px] border-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                                >
                                    <LogIn size={12} />
                                    Sign In
                                </button>
                            ) : (
                                <button
                                    onClick={handleLogout}
                                    className="p-1.5 rounded-full border border-stone-200 text-stone-300 hover:text-rose-500 transition-colors"
                                    title={t('header.logout')}
                                >
                                    <LogOut size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full">
                        <button
                            onClick={() => { resetWeekOffset(); setView('weekly'); }}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 border-[2px] border-black text-[9px] font-black uppercase tracking-widest transition-all ${view === 'weekly' ? 'bg-black text-white shadow-none translate-y-0.5' : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'}`}
                        >
                            <Clock size={12} />
                            {t('header.myWeek')}
                        </button>

                        <button
                            onClick={() => {
                                setView('monthly');
                                const now = new Date();
                                setCurrentMonthIndex(now.getMonth());
                                setCurrentYear(now.getFullYear());
                            }}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 border-[2px] border-black text-[9px] font-black uppercase tracking-widest transition-all ${view === 'monthly' ? 'bg-black text-white shadow-none translate-y-0.5' : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'}`}
                        >
                            <Calendar size={12} />
                            {t('header.myMonth')}
                        </button>

                        <button
                            onClick={() => {
                                setView('dashboard');
                                setCurrentYear(new Date().getFullYear());
                            }}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 border-[2px] border-black text-[9px] font-black uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-black text-white shadow-none translate-y-0.5' : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'}`}
                        >
                            <LayoutDashboard size={12} />
                            {t('header.dashboard')}
                        </button>
                    </div>
                </div>

                {view === 'monthly' ? (
                    <div className="flex flex-col gap-2 mt-2 h-full">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-stone-50 border border-stone-200 p-2 rounded-sm" title="Total habits completed this month">
                                <div className="flex flex-col items-center justify-center mb-1">
                                    <span className="text-[8px] font-black uppercase text-stone-500 tracking-wider">Done</span>
                                    <span className="text-lg font-black leading-none" style={{ color: theme.primary }}>{monthProgress.completed}</span>
                                </div>
                                <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                                    <div className="h-full transition-all duration-300" style={{ width: `${monthProgress.percentage}%`, backgroundColor: theme.primary }} />
                                </div>
                            </div>
                            <div className="bg-stone-50 border border-stone-200 p-2 rounded-sm" title="Percentage of monthly habits completed">
                                <div className="flex flex-col items-center justify-center mb-1">
                                    <span className="text-[8px] font-black uppercase text-stone-500 tracking-wider">Rate</span>
                                    <span className="text-lg font-black leading-none" style={{ color: theme.secondary }}>{monthProgress.percentage.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                                    <div className="h-full transition-all duration-300" style={{ width: `${monthProgress.percentage}%`, backgroundColor: theme.secondary }} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 flex-grow">
                            <button
                                onClick={() => setIsHabitModalOpen(true)}
                                className="flex flex-col items-center justify-center p-2 text-white rounded-2xl neo-border neo-shadow hover:translate-y-0.5 hover:shadow-none transition-all group min-h-[60px]"
                                style={{ backgroundColor: theme.secondary }}
                            >
                                <span className="text-[14px] font-black uppercase tracking-widest leading-none">My Habits</span>
                                <span className="text-xl font-black mt-1 leading-none">{habits.length}</span>
                                <span className="text-[8px] text-white uppercase tracking-tighter mt-1 leading-none">Manage habits</span>
                            </button>
                            <div
                                onClick={() => setIsStreakModalOpen(true)}
                                className="bg-white neo-border neo-shadow p-2 text-center rounded-2xl flex flex-col items-center justify-center min-h-[60px] cursor-pointer hover:bg-orange-50 transition-colors group/streak"
                            >
                                <p className="text-[8px] font-black opacity-50 uppercase tracking-widest leading-none group-hover/streak:text-orange-500 transition-colors">Current Streak</p>
                                <p className="text-2xl font-black mt-1 leading-none group-hover/streak:scale-110 transition-transform">{annualStats.currentStreak} <span className="text-[10px]">DAYS</span></p>
                            </div>
                        </div>
                    </div>
                ) : view === 'weekly' ? (
                    <div className="flex flex-col gap-2 mt-2 h-full">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-stone-50 border border-stone-200 p-2 rounded-sm" title="Total habits completed this week">
                                <div className="flex flex-col items-center justify-center mb-1">
                                    <span className="text-[8px] font-black uppercase text-stone-500 tracking-wider">Done</span>
                                    <span className="text-lg font-black leading-none" style={{ color: theme.primary }}>{weekProgress.completed}</span>
                                </div>
                                <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                                    <div className="h-full transition-all duration-300" style={{ width: `${weekProgress.percentage}%`, backgroundColor: theme.primary }} />
                                </div>
                            </div>
                            <div className="bg-stone-50 border border-stone-200 p-2 rounded-sm" title="Percentage of weekly habits completed">
                                <div className="flex flex-col items-center justify-center mb-1">
                                    <span className="text-[8px] font-black uppercase text-stone-500 tracking-wider">Rate</span>
                                    <span className="text-lg font-black leading-none" style={{ color: theme.secondary }}>{weekProgress.percentage.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                                    <div className="h-full transition-all duration-300" style={{ width: `${weekProgress.percentage}%`, backgroundColor: theme.secondary }} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 flex-grow">
                            <button
                                onClick={() => setIsHabitModalOpen(true)}
                                className="flex flex-col items-center justify-center p-2 text-white rounded-2xl neo-border neo-shadow hover:translate-y-0.5 hover:shadow-none transition-all group min-h-[60px]"
                                style={{ backgroundColor: theme.secondary }}
                            >
                                <span className="text-[12px] font-black uppercase tracking-widest leading-none">My Habits</span>
                                <span className="text-xl font-black mt-1 leading-none">{habits.length}</span>
                                <span className="text-[8px] text-white uppercase tracking-tighter mt-1 leading-none">Manage habits</span>
                            </button>
                            <div
                                onClick={() => setIsStreakModalOpen(true)}
                                className="bg-white neo-border neo-shadow p-2 text-center rounded-2xl flex flex-col items-center justify-center min-h-[60px] cursor-pointer hover:bg-orange-50 transition-colors group/streak"
                            >
                                <p className="text-[8px] font-black opacity-50 uppercase tracking-widest leading-none group-hover/streak:text-orange-500 transition-colors">Current Streak</p>
                                <p className="text-2xl font-black mt-1 leading-none group-hover/streak:scale-110 transition-transform">{annualStats.currentStreak} <span className="text-[10px]">DAYS</span></p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 mt-2 h-full">
                        {/* Resolutions Section */}
                        <div className="relative">
                            <div className="grid grid-cols-2 gap-2 invisible">
                                <div className="bg-stone-50 border border-stone-200 p-2 rounded-sm">
                                    <div className="flex flex-col items-center justify-center mb-1">
                                        <span className="text-[8px] font-black uppercase text-stone-500 tracking-wider">Done</span>
                                        <span className="text-lg font-black leading-none">0</span>
                                    </div>
                                    <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                                        <div className="h-full" />
                                    </div>
                                </div>
                                <div className="bg-stone-50 border border-stone-200 p-2 rounded-sm">
                                    <div className="flex flex-col items-center justify-center mb-1">
                                        <span className="text-[8px] font-black uppercase text-stone-500 tracking-wider">Rate</span>
                                        <span className="text-lg font-black leading-none">0%</span>
                                    </div>
                                    <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                                        <div className="h-full" />
                                    </div>
                                </div>
                            </div>

                            {currentYear === new Date().getFullYear() && (
                                <div className="absolute inset-0">
                                    <button
                                        onClick={() => setIsResolutionsModalOpen(true)}
                                        className="w-full h-full flex items-center justify-center gap-1.5 text-[12px] font-black uppercase tracking-wider bg-black text-white px-2 py-2 rounded-xl hover:bg-stone-800 transition-colors shadow-sm"
                                    >
                                        <Sparkles size={14} />
                                        This Year Resolutions
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 flex-grow">
                            <button
                                onClick={() => setIsHabitModalOpen(true)}
                                className="flex flex-col items-center justify-center p-2 text-white rounded-2xl neo-border neo-shadow hover:translate-y-0.5 hover:shadow-none transition-all group min-h-[60px]"
                                style={{ backgroundColor: theme.secondary }}
                            >
                                <span className="text-[12px] font-black uppercase tracking-widest leading-none">My Habits</span>
                                <span className="text-xl font-black mt-1 leading-none">{habits.length}</span>
                                <span className="text-[8px] text-white uppercase tracking-tighter mt-1 leading-none">Manage habits</span>
                            </button>
                            <div
                                onClick={() => setIsStreakModalOpen(true)}
                                className="bg-white neo-border neo-shadow p-2 text-center rounded-2xl flex flex-col items-center justify-center min-h-[60px] cursor-pointer hover:bg-orange-50 transition-colors group/streak"
                            >
                                <p className="text-[8px] font-black opacity-50 uppercase tracking-widest leading-none group-hover/streak:text-orange-500 transition-colors">Current Streak</p>
                                <p className="text-2xl font-black mt-1 leading-none group-hover/streak:scale-110 transition-transform">{annualStats.currentStreak} <span className="text-[10px]">DAYS</span></p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="md:col-span-6 bg-[#f9f9f9] neo-border neo-shadow rounded-2xl p-2 min-h-[160px] h-auto relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="font-black uppercase text-sm tracking-widest">
                        {view === 'monthly' ? t('header.monthlyTrends') : (view === 'weekly' ? t('header.weeklyTrends') : t('header.annualTrends'))}
                    </h4>
                    <div className="flex items-center gap-2">
                        {view !== 'dashboard' && (
                            <div className={`text-xs font-bold px-2 py-1 neo-border ${(view === 'weekly' ? weekDelta : monthDelta) >= 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}>
                                {Math.abs(view === 'weekly' ? weekDelta : monthDelta).toFixed(0)}% {view === 'weekly' ? t('header.vsLW') : t('header.vsLM')}
                            </div>
                        )}
                        <button
                            onClick={() => setChartType(prev => prev === 'area' ? 'bar' : 'area')}
                            className="p-1 hover:bg-stone-200 rounded-sm transition-colors text-stone-400 hover:text-stone-600"
                            title={t('header.switchChart')}
                        >
                            {chartType === 'area' ? <BarChart2 size={12} /> : <Activity size={12} />}
                        </button>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="100%" minHeight={120} key={view + chartType}>
                    {chartType === 'area' ? (
                        <AreaChart data={view === 'monthly' ? dailyStats : (view === 'weekly' ? weeklyStats : annualStats.monthlySummaries)} margin={{ right: 20, left: 20, bottom: 0, top: 10 }}>
                            <defs>
                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={theme.primary} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={theme.primary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey={view === 'monthly' ? "day" : (view === 'weekly' ? "displayDay" : "month")}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 'bold' }}
                                interval={view === 'monthly' ? 'preserveStartEnd' : 0}
                                minTickGap={0}
                                padding={{ left: 10, right: 10 }}
                            />
                            <Tooltip
                                contentStyle={{ border: '2px solid black', borderRadius: '0', fontWeight: 'bold' }}
                                formatter={(value: any) => [`${value} completed`, view === 'dashboard' ? 'Total' : 'Habits']}
                            />
                            <Area
                                type="monotone"
                                dataKey={view === 'dashboard' ? "completed" : "count"}
                                stroke="#000"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorVal)"
                            />
                        </AreaChart>
                    ) : (
                        <BarChart data={view === 'monthly' ? dailyStats : (view === 'weekly' ? weeklyStats : annualStats.monthlySummaries)} margin={{ right: 20, left: 20, bottom: 20, top: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
                            <XAxis
                                dataKey={view === 'monthly' ? "day" : (view === 'weekly' ? "displayDay" : "month")}
                                tick={{ fontSize: 9, fontWeight: 'bold' }}
                                stroke="#999"
                                tickLine={false}
                                interval={view === 'monthly' ? 'preserveStartEnd' : 0}
                                minTickGap={0}
                                padding={{ left: 5, right: 5 }}
                                label={{
                                    value: view === 'monthly' ? 'Day of Month' : (view === 'weekly' ? 'Day of Week' : 'Month'),
                                    position: 'insideBottom',
                                    offset: -5,
                                    style: { fontSize: 8, fontWeight: 'bold', fill: '#999', textTransform: 'uppercase' }
                                }}
                            />
                            <YAxis
                                tick={{ fontSize: 9, fontWeight: 'bold' }}
                                stroke="#999"
                                tickLine={false}
                                width={25}
                                domain={[0, habits.length || 1]}
                                ticks={[0, (habits.length || 0) / 2, habits.length || 1]}
                                allowDecimals={true}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '2px solid black',
                                    borderRadius: '0',
                                    fontWeight: 'bold',
                                    boxShadow: '4px 4px 0px rgba(0,0,0,0.1)'
                                }}
                                formatter={(value: any) => [`${value} completed`, view === 'dashboard' ? 'Total' : 'Habits']}
                            />
                            <Bar
                                dataKey={view === 'dashboard' ? "completed" : "count"}
                                fill={theme.primary}
                                radius={[4, 4, 0, 0]}
                                stroke="#000"
                                strokeWidth={2}
                                animationDuration={1000}
                                animationBegin={0}
                                isAnimationActive={true}
                            />
                        </BarChart>
                    )}
                </ResponsiveContainer>
                <DailyQuote />
                <DailyTips />
            </div>

            <div className="md:col-span-3 bg-white neo-border neo-shadow rounded-2xl relative flex flex-col overflow-hidden min-h-[160px]">
                <div className="text-white text-[9px] font-bold uppercase py-1 text-center tracking-widest" style={{ backgroundColor: theme.primary }}>
                    {view === 'monthly' ? t('header.monthlySuccess') : (view === 'weekly' ? t('header.weeklySuccess') : t('header.annualPerformance'))}
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-2 relative">
                    {view === 'monthly' ? (
                        <div className="w-full h-full flex flex-col gap-1 overflow-hidden">
                            <div className="flex items-center justify-between px-2 pt-1 mb-1">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest leading-none mb-2">Month Mastery</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black leading-none">{monthProgress.completed}</span>
                                        <span className="text-lg font-black text-stone-300">/</span>
                                        <span className="text-lg font-black text-stone-300">{monthProgress.total}</span>
                                    </div>
                                </div>
                                <div className="w-20 h-20 relative">
                                    <ResponsiveContainer width="100%" height="100%" minHeight={80}>
                                        <PieChart>
                                            <Pie
                                                data={[{ value: monthProgress.completed || 0.1 }, { value: monthProgress.remaining || 0 }]}
                                                innerRadius="75%" outerRadius="100%" paddingAngle={2} dataKey="value" startAngle={90} endAngle={450}
                                                isAnimationActive={true}
                                                animationDuration={1000}
                                                animationBegin={0}
                                            >
                                                <Cell fill={theme.primary} /><Cell fill="#f0f0f0" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className="text-sm font-black leading-none" style={{ color: theme.primary }}>
                                            {monthProgress.percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[140px] bg-stone-50/50 neo-border rounded-xl p-2 overflow-y-auto custom-scrollbar">
                                {(() => {
                                    const isCurrentMonth = currentMonthIndex === currentMonthOfYear && currentYear === currentFullYear;
                                    const daysElapsed = isCurrentMonth ? currentDayOfMonth : new Date(currentYear, currentMonthIndex + 1, 0).getDate();
                                    const story = buildMonthlyStory(monthProgress, topHabitsThisMonth, monthDelta, t, daysElapsed);
                                    return (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Sparkles size={12} className="text-amber-500" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">Your Story This Month</span>
                                            </div>
                                            {story.sections.map((section: any, idx: number) => (
                                                <p key={idx} className="text-[11px] leading-relaxed font-bold">
                                                    <FormattedText
                                                        text={section.text}
                                                        highlightColor={theme.secondary}
                                                        className={section.type === 'consistency' ? '' : 'italic'}
                                                    />
                                                </p>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    ) : view === 'weekly' ? (
                        <div className="w-full h-full flex flex-col gap-1 overflow-hidden">
                            <div className="flex items-center justify-between px-2 pt-1 mb-1">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest leading-none mb-2">Habit Master</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black leading-none">{weekProgress.completed}</span>
                                        <span className="text-lg font-black text-stone-300">/</span>
                                        <span className="text-lg font-black text-stone-300">{weekProgress.total}</span>
                                    </div>
                                </div>
                                <div className="w-20 h-20 relative">
                                    <ResponsiveContainer width="100%" height="100%" minHeight={80}>
                                        <PieChart>
                                            <Pie
                                                data={[{ value: weekProgress.completed || 0.1 }, { value: weekProgress.remaining || 0 }]}
                                                innerRadius="75%" outerRadius="100%" paddingAngle={2} dataKey="value" startAngle={90} endAngle={450}
                                                isAnimationActive={true}
                                                animationDuration={1000}
                                                animationBegin={0}
                                            >
                                                <Cell fill={theme.primary} /><Cell fill="#f0f0f0" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className="text-sm font-black leading-none" style={{ color: theme.primary }}>
                                            {weekProgress.percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[140px] bg-stone-50/50 neo-border rounded-xl p-2 overflow-y-auto custom-scrollbar">
                                {(() => {
                                    const daysElapsed = weekOffset === 0 ? currentDayOfWeek : 7;
                                    const story = buildWeeklyStory(weekProgress, weeklyStats, habits, t, daysElapsed);
                                    return (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Sparkles size={12} className="text-amber-500" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">Your Story This Week</span>
                                            </div>
                                            {story.sections.map((section: any, idx: number) => (
                                                <p key={idx} className="text-[11px] leading-relaxed font-bold">
                                                    <FormattedText
                                                        text={section.text}
                                                        primaryColor={theme.primary}
                                                        className={section.type === 'consistency' ? 'text-black' : 'text-black'}
                                                    />
                                                </p>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-full h-24 sm:h-24 min-h-[96px] relative">
                                <ResponsiveContainer width="100%" height="100%" minHeight={96} key={view}>
                                    <PieChart>
                                        <Pie
                                            data={view === 'monthly'
                                                ? [{ value: monthProgress.completed || 0.1 }, { value: monthProgress.remaining || 0 }]
                                                : [{ value: annualStats.totalCompletions || 0.1 }, { value: Math.max(0, annualStats.totalPossible - annualStats.totalCompletions) }]
                                            }
                                            innerRadius="80%" outerRadius="100%" paddingAngle={2} dataKey="value" startAngle={90} endAngle={450}
                                            isAnimationActive={true}
                                            animationDuration={1000}
                                            animationBegin={0}
                                        >
                                            <Cell fill={theme.primary} /><Cell fill="#f0f0f0" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-black leading-none" style={{ color: theme.primary }}>
                                        {view === 'monthly'
                                            ? monthProgress.percentage.toFixed(0)
                                            : (annualStats.totalPossible > 0 ? (annualStats.totalCompletions / annualStats.totalPossible * 100).toFixed(0) : 0)}%
                                    </span>
                                </div>
                            </div>
                            <div className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mt-1">
                                {view === 'monthly'
                                    ? `${monthProgress.completed} / ${monthProgress.completed + monthProgress.remaining} Completed`
                                    : `${annualStats.totalCompletions} / ${annualStats.totalPossible} Completed`
                                }
                            </div>

                            {view === 'monthly' && (
                                <div className="w-full grid grid-cols-2 gap-2 mt-2 px-2 border-t border-stone-100 pt-2">
                                    <div className="flex flex-col items-center justify-center">
                                        <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider mb-0.5">vs Prev</span>
                                        {(() => {
                                            const delta = monthDelta;
                                            const isPositive = delta > 0;
                                            const isNeutral = Math.abs(delta) < 0.1;
                                            return (
                                                <div className={`flex items-center gap-1 text-[10px] font-black ${isNeutral ? 'text-stone-400' : (isPositive ? 'text-emerald-500' : 'text-rose-500')}`}>
                                                    {isNeutral ? <Minus size={10} strokeWidth={4} /> : (isPositive ? <ArrowUp size={10} strokeWidth={4} /> : <ArrowDown size={10} strokeWidth={4} />)}
                                                    <span>{Math.abs(delta).toFixed(isNeutral ? 0 : 1)}%</span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div className="flex flex-col items-center justify-center border-l border-stone-100">
                                        <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider mb-0.5">Best</span>
                                        <div className="flex items-center gap-1 text-[10px] font-black text-amber-500">
                                            <Trophy size={10} strokeWidth={4} />
                                            <span>{annualStats.allTimeBest?.rate?.toFixed(0) || 0}%</span>
                                        </div>
                                        {annualStats.allTimeBest && (
                                            <span className="text-[7px] font-bold text-stone-400 mt-0.5">
                                                {MONTHS[annualStats.allTimeBest.monthIdx]} {annualStats.allTimeBest.year}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            <HabitManagerModal
                isOpen={isHabitModalOpen}
                onClose={() => setIsHabitModalOpen(false)}
                habits={habits}
                addHabit={addHabit}
                updateHabit={updateHabit}
                removeHabit={removeHabit}
                reorderHabits={reorderHabits}
                themePrimary={theme.primary}
            />
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
