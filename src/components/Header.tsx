import React from 'react';
import { ChevronLeft, ChevronRight, LayoutDashboard, Calendar, Clock, LogIn, LogOut, ArrowUp, ArrowDown, Minus, Trophy, BarChart2, Activity, Sparkles, Search, Plus } from 'lucide-react';
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
import { buildAchievements } from './StreakModal';
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
    startOfWeek: 'monday' | 'sunday';
    setStartOfWeek: (start: 'monday' | 'sunday') => void;
    handleLogout: () => void;
    monthProgress: any;
    annualStats: any;
    dailyStats: any[];
    weeklyStats: any[];
    weekProgress: any;
    habits: Habit[];
    defaultView: 'daily' | 'monthly' | 'dashboard';
    setDefaultView: (view: 'daily' | 'monthly' | 'dashboard') => void;
    colorMode: 'light' | 'dark';
    setColorMode: (mode: 'light' | 'dark') => void;
    cardStyle: 'compact' | 'large';
    setCardStyle: (style: 'compact' | 'large') => void;
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
    toggleArchiveHabit: (id: string, archive: boolean) => Promise<void>;
    onReportBug: () => void;
    onOpenWhatsNew: () => void;
    onOpenTutorial: () => void;
    onExportData: () => void;
    isExportingData: boolean;
    hasUnreadFeedback: boolean;
    hasUnseenWhatsNew: boolean;
    onSearch: () => void;
    onLogToday: () => void;
    logTodayStatus: 'empty' | 'partial' | 'done';
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
    startOfWeek,
    setStartOfWeek,
    handleLogout,
    monthProgress,
    annualStats,
    dailyStats,
    weeklyStats,
    weekProgress,
    habits,
    defaultView,
    setDefaultView,
    colorMode,
    setColorMode,
    cardStyle,
    setCardStyle,
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
    toggleArchiveHabit,
    onReportBug,
    onOpenWhatsNew,
    onOpenTutorial,
    onExportData,
    isExportingData,
    hasUnreadFeedback,
    hasUnseenWhatsNew,
    onSearch,
    onLogToday,
    logTodayStatus
}) => {
    const { t } = useTranslation();
    const isDarkMode = colorMode === 'dark';
    const today = new Date();
    const currentDayOfMonth = today.getDate();
    const currentMonthOfYear = today.getMonth();
    const currentFullYear = today.getFullYear();
    const [chartType, setChartType] = React.useState<'area' | 'bar'>(() => {
        return (localStorage.getItem('habit_chart_type') as 'area' | 'bar') || 'area';
    });

    const [showWeekSelector, setShowWeekSelector] = React.useState(false);
    const [showMonthSelector, setShowMonthSelector] = React.useState(false);
    const [showYearSelector, setShowYearSelector] = React.useState(false);
    const [autoAddHabitOnOpen, setAutoAddHabitOnOpen] = React.useState(false);
    const leftPanelClass = "flex flex-col gap-2 mt-2 h-full";
    const authButtonClass = "w-full min-h-[60px] flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-wider bg-black text-white px-2 py-2 rounded-xl hover:bg-stone-800 transition-colors shadow-sm";
    const quickActionButtonClass = "flex min-h-[60px] items-center justify-center gap-2 rounded-2xl border border-stone-200 px-3 py-3 text-[11px] font-black uppercase tracking-wider transition-colors";
    const quickActionMutedClass = `${quickActionButtonClass} bg-stone-50 text-stone-800 hover:bg-stone-100`;
    const quickActionPrimaryClass = logTodayStatus === 'done'
        ? `${quickActionButtonClass} border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200`
        : logTodayStatus === 'partial'
            ? `${quickActionButtonClass} border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200`
            : `${quickActionButtonClass} border-rose-300 bg-rose-100 text-rose-900 hover:bg-rose-200`;
    const utilityCardClass = "rounded-2xl p-3 neo-border neo-shadow transition-all";
    const habitsCardClass = `${utilityCardClass} flex min-h-[78px] flex-col items-center text-white hover:translate-y-0.5 hover:shadow-none group`;
    const streakCardClass = `${utilityCardClass} flex min-h-[78px] cursor-pointer flex-col items-center justify-center bg-white text-center hover:bg-orange-50 group/streak`;
    const utilityTitleClass = "text-[13px] font-black uppercase tracking-widest leading-none";
    const utilityMetaClass = "mt-auto pt-2 text-[11px] font-black uppercase tracking-wide leading-none";

    React.useEffect(() => {
        localStorage.setItem('habit_chart_type', chartType);
    }, [chartType]);

    const badgeCount = React.useMemo(() => {
        return buildAchievements(
            annualStats,
            annualStats?.allTopHabits || [],
            annualStats?.maxStreak || 0,
            annualStats?.currentStreak || 0
        ).filter((achievement) => achievement.unlocked).length;
    }, [annualStats]);

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

    const monthLabel = `${MONTHS[currentMonthIndex]} ${currentYear}`;
    const dashboardLabel = `${currentYear} Dashboard`;
    const weekLabel = weekRange || '';

    const getSelectorFontSize = (label: string) => {
        const len = label.length;
        if (len > 26) return '0.58rem';
        if (len > 22) return '0.62rem';
        if (len > 18) return '0.68rem';
        if (len > 14) return '0.74rem';
        return '0.82rem';
    };

    const getSelectorLetterSpacing = (label: string) => {
        const len = label.length;
        if (len > 22) return '0.02em';
        if (len > 16) return '0.04em';
        return '0.06em';
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
                                            className="flex-1 min-w-0 font-bold uppercase select-none hover:bg-stone-50 px-2 py-0.5 rounded-sm transition-colors whitespace-nowrap text-center"
                                            style={{ fontSize: getSelectorFontSize(monthLabel), letterSpacing: getSelectorLetterSpacing(monthLabel), lineHeight: 1.1 }}
                                        >
                                            {monthLabel}
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
                                            className="flex-1 min-w-0 font-bold uppercase select-none hover:bg-stone-50 px-2 py-0.5 rounded-sm transition-colors whitespace-nowrap text-center"
                                            style={{ fontSize: getSelectorFontSize(dashboardLabel), letterSpacing: getSelectorLetterSpacing(dashboardLabel), lineHeight: 1.1 }}
                                        >
                                            {dashboardLabel}
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
                                            className="flex-1 min-w-0 font-bold uppercase select-none hover:bg-stone-50 px-2 py-0.5 rounded-sm transition-colors whitespace-nowrap text-center"
                                            style={{ fontSize: getSelectorFontSize(weekLabel), letterSpacing: getSelectorLetterSpacing(weekLabel), lineHeight: 1.1 }}
                                        >
                                            {weekLabel}
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
                            <button
                                onClick={onSearch}
                                className="p-1.5 rounded-full border border-stone-200 text-stone-400 hover:text-black hover:bg-stone-50 transition-colors"
                            >
                                <Search size={14} />
                            </button>
                            <SettingsMenu
                                theme={theme}
                                setTheme={setTheme}
                                themes={themes}
                                settingsOpen={settingsOpen}
                                setSettingsOpen={setSettingsOpen}
                                settingsRef={settingsRef}
                                language={language}
                                setLanguage={setLanguage}
                                startOfWeek={startOfWeek}
                                setStartOfWeek={setStartOfWeek}
                                defaultView={defaultView}
                                setDefaultView={setDefaultView}
                                colorMode={colorMode}
                                setColorMode={setColorMode}
                                cardStyle={cardStyle}
                                setCardStyle={setCardStyle}
                                onReportBug={onReportBug}
                                onOpenWhatsNew={onOpenWhatsNew}
                                onOpenTutorial={onOpenTutorial}
                                onExportData={onExportData}
                                isExportingData={isExportingData}
                                hasUnreadFeedback={hasUnreadFeedback}
                                hasUnseenWhatsNew={hasUnseenWhatsNew}
                            />

                            {!guestMode && (
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
                        <div className="flex-1 rounded-xl border-2 border-black bg-stone-100 p-1 relative flex items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.12)]">
                            <button
                                onClick={() => { resetWeekOffset(); setView('weekly'); }}
                                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.12em] transition-all z-10 relative border ${view === 'weekly' ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.18)]' : 'border-transparent text-stone-500 hover:text-black'}`}
                                title="Week"
                            >
                                <Clock size={11} strokeWidth={3} className={view === 'weekly' ? 'opacity-100' : 'opacity-70'} />
                                <span>Week</span>
                            </button>

                            <button
                                onClick={() => {
                                    setView('monthly');
                                    const now = new Date();
                                    setCurrentMonthIndex(now.getMonth());
                                    setCurrentYear(now.getFullYear());
                                }}
                                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.12em] transition-all z-10 relative border ${view === 'monthly' ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.18)]' : 'border-transparent text-stone-500 hover:text-black'}`}
                                title="Month"
                            >
                                <Calendar size={11} strokeWidth={3} className={view === 'monthly' ? 'opacity-100' : 'opacity-70'} />
                                <span>Month</span>
                            </button>

                            <button
                                onClick={() => {
                                    setView('dashboard');
                                    setCurrentYear(new Date().getFullYear());
                                }}
                                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.12em] transition-all z-10 relative border ${view === 'dashboard' ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.18)]' : 'border-transparent text-stone-500 hover:text-black'}`}
                                title="Year"
                            >
                                <LayoutDashboard size={11} strokeWidth={3} className={view === 'dashboard' ? 'opacity-100' : 'opacity-70'} />
                                <span>Year</span>
                            </button>
                        </div>
                    </div>
                </div>

                {view === 'monthly' ? (
                    <div className={leftPanelClass}>
                        {guestMode ? (
                            <button
                                onClick={() => window.location.href = '/signin'}
                                className={authButtonClass}
                            >
                                <LogIn size={14} />
                                Sign up / Sign in
                            </button>
                        ) : null}

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => {
                                    setAutoAddHabitOnOpen(true);
                                    setIsHabitModalOpen(true);
                                }}
                                className={quickActionMutedClass}
                            >
                                <Plus size={14} />
                                {t('common.addHabit')}
                            </button>
                            <button
                                onClick={onLogToday}
                                className={quickActionPrimaryClass}
                            >
                                <Clock size={14} />
                                {t('common.logToday')}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 flex-grow">
                            <button
                                onClick={() => setIsHabitModalOpen(true)}
                                className={`my-habits-button ${habitsCardClass}`}
                                style={{ backgroundColor: theme.secondary }}
                            >
                                <span className={utilityTitleClass}>{t('common.myHabits')}</span>
                                <span className="mt-1 text-xl font-black leading-none">{habits.length}</span>
                                <span className={utilityMetaClass}>{t('common.manageHabits')}</span>
                            </button>
                            <div
                                onClick={() => setIsStreakModalOpen(true)}
                                className={streakCardClass}
                            >
                                <p className="text-[8px] font-black opacity-50 uppercase tracking-widest leading-none group-hover/streak:text-orange-500 transition-colors">{t('common.currentStreak')}</p>
                                <p className="text-2xl font-black mt-1 leading-none group-hover/streak:scale-110 transition-transform">{annualStats.currentStreak} <span className="text-[10px]">{t('common.days')}</span></p>
                                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">{badgeCount} badges</p>
                            </div>
                        </div>
                    </div>
                ) : view === 'weekly' ? (
                    <div className={leftPanelClass}>
                        {guestMode ? (
                            <button
                                onClick={() => window.location.href = '/signin'}
                                className={authButtonClass}
                            >
                                <LogIn size={14} />
                                Sign up / Sign in
                            </button>
                        ) : null}

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => {
                                    setAutoAddHabitOnOpen(true);
                                    setIsHabitModalOpen(true);
                                }}
                                className={quickActionMutedClass}
                            >
                                <Plus size={14} />
                                {t('common.addHabit')}
                            </button>
                            <button
                                onClick={onLogToday}
                                className={quickActionPrimaryClass}
                            >
                                <Clock size={14} />
                                {t('common.logToday')}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 flex-grow">
                            <button
                                onClick={() => setIsHabitModalOpen(true)}
                                className={`my-habits-button ${habitsCardClass}`}
                                style={{ backgroundColor: theme.secondary }}
                            >
                                <span className={utilityTitleClass}>{t('common.myHabits')}</span>
                                <span className="mt-1 text-xl font-black leading-none">{habits.length}</span>
                                <span className={utilityMetaClass}>{t('common.manageHabits')}</span>
                            </button>
                            <div
                                onClick={() => setIsStreakModalOpen(true)}
                                className={streakCardClass}
                            >
                                <p className="text-[8px] font-black opacity-50 uppercase tracking-widest leading-none group-hover/streak:text-orange-500 transition-colors">{t('common.currentStreak')}</p>
                                <p className="text-2xl font-black mt-1 leading-none group-hover/streak:scale-110 transition-transform">{annualStats.currentStreak} <span className="text-[10px]">{t('common.days')}</span></p>
                                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">{badgeCount} badges</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={leftPanelClass}>
                        {guestMode ? (
                            <button
                                onClick={() => window.location.href = '/signin'}
                                className={authButtonClass}
                            >
                                <LogIn size={14} />
                                Sign up / Sign in
                            </button>
                        ) : null}

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => {
                                    setAutoAddHabitOnOpen(true);
                                    setIsHabitModalOpen(true);
                                }}
                                className={quickActionMutedClass}
                            >
                                <Plus size={14} />
                                {t('common.addHabit')}
                            </button>
                            <button
                                onClick={onLogToday}
                                className={quickActionPrimaryClass}
                            >
                                <Clock size={14} />
                                {t('common.logToday')}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 flex-grow">
                            <button
                                onClick={() => setIsHabitModalOpen(true)}
                                className={`my-habits-button ${habitsCardClass}`}
                                style={{ backgroundColor: theme.secondary }}
                            >
                                <span className={utilityTitleClass}>{t('common.myHabits')}</span>
                                <span className="mt-1 text-xl font-black leading-none">{habits.length}</span>
                                <span className={utilityMetaClass}>{t('common.manageHabits')}</span>
                            </button>
                            <div
                                onClick={() => setIsStreakModalOpen(true)}
                                className={streakCardClass}
                            >
                                <p className="text-[8px] font-black opacity-50 uppercase tracking-widest leading-none group-hover/streak:text-orange-500 transition-colors">{t('common.currentStreak')}</p>
                                <p className="text-2xl font-black mt-1 leading-none group-hover/streak:scale-110 transition-transform">{annualStats.currentStreak} <span className="text-[10px]">{t('common.days')}</span></p>
                                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">{badgeCount} badges</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={`md:col-span-6 neo-border neo-shadow rounded-2xl p-2 min-h-[160px] h-auto relative overflow-hidden flex flex-col ${isDarkMode ? 'bg-[#151515]' : 'bg-[#f9f9f9]'}`}>
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
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255, 255, 255, 0.14)" : "#ddd"} />
                            <XAxis
                                dataKey={view === 'monthly' ? "day" : (view === 'weekly' ? "displayDay" : "month")}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 'bold', fill: isDarkMode ? '#a8a8a8' : '#666' }}
                                interval={view === 'monthly' ? 'preserveStartEnd' : 0}
                                minTickGap={0}
                                padding={{ left: 10, right: 10 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDarkMode ? '#161616' : '#fff',
                                    border: isDarkMode ? '1px solid #2d2d2d' : '2px solid black',
                                    borderRadius: isDarkMode ? '6px' : '0',
                                    color: isDarkMode ? '#ededed' : '#111',
                                    fontWeight: 'bold'
                                }}
                                formatter={(value: any) => [`${value} completed`, view === 'dashboard' ? 'Total' : 'Habits']}
                            />
                            <Area
                                type="monotone"
                                dataKey={view === 'dashboard' ? "completed" : "count"}
                                stroke={isDarkMode ? "#d6d6d6" : "#000"}
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorVal)"
                            />
                        </AreaChart>
                    ) : (
                        <BarChart data={view === 'monthly' ? dailyStats : (view === 'weekly' ? weeklyStats : annualStats.monthlySummaries)} margin={{ right: 20, left: 20, bottom: 20, top: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255, 255, 255, 0.14)" : "#ddd"} />
                            <XAxis
                                dataKey={view === 'monthly' ? "day" : (view === 'weekly' ? "displayDay" : "month")}
                                tick={{ fontSize: 9, fontWeight: 'bold', fill: isDarkMode ? '#a8a8a8' : '#666' }}
                                stroke={isDarkMode ? "#3a3a3a" : "#999"}
                                tickLine={false}
                                interval={view === 'monthly' ? 'preserveStartEnd' : 0}
                                minTickGap={0}
                                padding={{ left: 5, right: 5 }}
                                label={{
                                    value: view === 'monthly' ? 'Day of Month' : (view === 'weekly' ? 'Day of Week' : 'Month'),
                                    position: 'insideBottom',
                                    offset: -5,
                                    style: { fontSize: 8, fontWeight: 'bold', fill: isDarkMode ? '#a8a8a8' : '#999', textTransform: 'uppercase' }
                                }}
                            />
                            <YAxis
                                tick={{ fontSize: 9, fontWeight: 'bold', fill: isDarkMode ? '#a8a8a8' : '#666' }}
                                stroke={isDarkMode ? "#3a3a3a" : "#999"}
                                tickLine={false}
                                width={25}
                                domain={[0, habits.length || 1]}
                                ticks={[0, (habits.length || 0) / 2, habits.length || 1]}
                                allowDecimals={true}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                contentStyle={{
                                    backgroundColor: isDarkMode ? '#161616' : '#fff',
                                    border: isDarkMode ? '1px solid #2d2d2d' : '2px solid black',
                                    borderRadius: isDarkMode ? '6px' : '0',
                                    color: isDarkMode ? '#ededed' : '#111',
                                    fontWeight: 'bold',
                                    boxShadow: isDarkMode ? '0 10px 30px rgba(0,0,0,0.45)' : '4px 4px 0px rgba(0,0,0,0.1)'
                                }}
                                formatter={(value: any) => [`${value} completed`, view === 'dashboard' ? 'Total' : 'Habits']}
                            />
                            <Bar
                                dataKey={view === 'dashboard' ? "completed" : "count"}
                                fill={theme.primary}
                                radius={[4, 4, 0, 0]}
                                stroke={isDarkMode ? "#2d2d2d" : "#000"}
                                strokeWidth={1}
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
                                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest leading-none mb-2">Month Story</span>
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
                                                <Cell fill={theme.primary} /><Cell fill={isDarkMode ? "#2a2a2a" : "#f0f0f0"} />
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
                                                <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">{t('header.yourStoryMonth')}</span>
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
                                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest leading-none mb-2">{t('header.habitMaster')}</span>
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
                                                <Cell fill={theme.primary} /><Cell fill={isDarkMode ? "#2a2a2a" : "#f0f0f0"} />
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
                                    const daysElapsed = weekOffset === 0
                                        ? (startOfWeek === 'sunday' ? today.getDay() + 1 : (today.getDay() === 0 ? 7 : today.getDay()))
                                        : 7;
                                    const story = buildWeeklyStory(weekProgress, weeklyStats, habits, t, daysElapsed);
                                    return (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Sparkles size={12} className="text-amber-500" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">{t('header.yourStoryWeek')}</span>
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
                                            <Cell fill={theme.primary} /><Cell fill={isDarkMode ? "#2a2a2a" : "#f0f0f0"} />
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
                                    : `${Math.round(annualStats.totalCompletions)} / ${Math.round(annualStats.totalPossible)} Completed`
                                }
                            </div>

                            {currentYear === new Date().getFullYear() && (
                                <button
                                    onClick={() => setIsResolutionsModalOpen(true)}
                                    className="mt-3 w-full min-h-[44px] flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-black text-white px-2 py-2 rounded-xl hover:bg-stone-800 transition-colors shadow-sm"
                                >
                                    <Sparkles size={14} />
                                    This Year Resolutions
                                </button>
                            )}

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
                toggleArchiveHabit={toggleArchiveHabit}
                themePrimary={theme.primary}
                autoAddOnOpen={autoAddHabitOnOpen}
                onAutoAddHandled={() => setAutoAddHabitOnOpen(false)}
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
