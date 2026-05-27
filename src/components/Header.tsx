import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, LayoutDashboard, Calendar, Clock, LogIn, LogOut, ArrowUp, ArrowDown, Minus, BarChart2, Activity, Sparkles, Search, Plus, BookOpen, Flame } from 'lucide-react';
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
import { buildAnnualStory, buildWeeklyStory, buildMonthlyStory } from '../utils/storyGenerator';

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
    previousDailyStats: any[];
    weeklyStats: any[];
    previousWeeklyStats: any[];
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
    annualDelta: number;
    monthlyGoals: MonthlyGoals;
    updateMonthlyGoals: (key: string, goals: MonthlyGoal[]) => void;
    topHabitsThisMonth: any[];
    previousAnnualMonthlySummaries: any[];
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
    onViewJournal: () => void;
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
    previousDailyStats,
    weeklyStats,
    previousWeeklyStats,
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
    annualDelta,
    monthlyGoals,
    updateMonthlyGoals,
    topHabitsThisMonth,
    previousAnnualMonthlySummaries,
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
    onViewJournal,
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
    const [statsOpen, setStatsOpen] = React.useState<boolean>(() => {
        const saved = localStorage.getItem('header_stats_open');
        if (saved !== null) return saved === 'true';
        return view === 'dashboard';
    });

    const [showWeekSelector, setShowWeekSelector] = React.useState(false);
    const [showMonthSelector, setShowMonthSelector] = React.useState(false);
    const [showYearSelector, setShowYearSelector] = React.useState(false);
    const [autoAddHabitOnOpen, setAutoAddHabitOnOpen] = React.useState(false);
    const iconBtn = "p-1.5 rounded-full border border-stone-200 text-stone-400 hover:text-black hover:bg-stone-50 transition-colors";
    const actionBtn = "hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 text-[10px] font-black uppercase tracking-wide text-stone-600 hover:border-black hover:text-black transition-colors";
    const logTodayBtn = logTodayStatus === 'done'
        ? "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-emerald-400 bg-emerald-50 text-[10px] font-black uppercase tracking-wide text-emerald-700 hover:bg-emerald-100 transition-colors"
        : logTodayStatus === 'partial'
            ? "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-amber-400 bg-amber-50 text-[10px] font-black uppercase tracking-wide text-amber-700 hover:bg-amber-100 transition-colors"
            : "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-rose-400 bg-rose-50 text-[10px] font-black uppercase tracking-wide text-rose-700 hover:bg-rose-100 transition-colors";
    const trendDelta = view === 'weekly' ? weekDelta : view === 'monthly' ? monthDelta : annualDelta;
    const trendDeltaLabel = view === 'weekly' ? t('header.vsLW') : view === 'monthly' ? t('header.vsLM') : 'vs LY';
    const trendLegendCurrent = view === 'weekly' ? 'This week' : view === 'monthly' ? 'This month' : 'This year';
    const trendLegendPrevious = view === 'weekly' ? 'Prev week' : view === 'monthly' ? 'Prev month' : 'Prev year';

    const trendChartData = React.useMemo(() => {
        if (view === 'weekly') {
            return weeklyStats.map((item, index) => ({
                label: item.displayDay,
                current: item.count,
                previous: previousWeeklyStats[index]?.count ?? null
            }));
        }

        if (view === 'monthly') {
            return dailyStats.map((item, index) => ({
                label: String(item.day),
                current: item.count,
                previous: previousDailyStats[index]?.count ?? null
            }));
        }

        return annualStats.monthlySummaries.map((item: any, index: number) => ({
            label: item.month,
            current: item.completed,
            previous: previousAnnualMonthlySummaries[index]?.completed ?? null
        }));
    }, [view, weeklyStats, previousWeeklyStats, dailyStats, previousDailyStats, annualStats.monthlySummaries, previousAnnualMonthlySummaries]);

    const annualStory = React.useMemo(() => {
        const monthsElapsed = currentYear === currentFullYear ? currentMonthOfYear + 1 : 12;
        return buildAnnualStory(annualStats, t, monthsElapsed);
    }, [annualStats, currentYear, currentFullYear, currentMonthOfYear, t]);

    const annualCompletionRate = annualStats.totalPossible > 0
        ? (annualStats.totalCompletions / annualStats.totalPossible) * 100
        : 0;

    React.useEffect(() => {
        localStorage.setItem('habit_chart_type', chartType);
    }, [chartType]);

    React.useEffect(() => {
        localStorage.setItem('header_stats_open', String(statsOpen));
    }, [statsOpen]);

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

    const currentLabel = view === 'monthly' ? monthLabel : view === 'dashboard' ? dashboardLabel : weekLabel;
    const dateSelector = (
        <div className="flex items-center justify-between bg-white border-2 border-black px-2 py-1 relative date-selector-container min-w-[160px] shrink-0">
            <button onClick={() => view === 'monthly' ? navigateMonth('prev') : view === 'weekly' ? navigateWeek('prev') : setCurrentYear(prev => prev - 1)} className="hover:text-black active:scale-95 transition-transform"><ChevronLeft size={15} /></button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (view === 'monthly') { setShowMonthSelector(!showMonthSelector); setShowWeekSelector(false); setShowYearSelector(false); }
                    else if (view === 'weekly') { setShowWeekSelector(!showWeekSelector); setShowMonthSelector(false); setShowYearSelector(false); }
                    else { setShowYearSelector(!showYearSelector); setShowWeekSelector(false); setShowMonthSelector(false); }
                }}
                className="flex-1 min-w-0 font-black uppercase select-none hover:bg-stone-50 px-2 py-0.5 transition-colors whitespace-nowrap text-center"
                style={{ fontSize: getSelectorFontSize(currentLabel), letterSpacing: getSelectorLetterSpacing(currentLabel), lineHeight: 1.1 }}
            >
                {currentLabel}
            </button>
            {view === 'monthly' && <MonthPicker isOpen={showMonthSelector} onClose={() => setShowMonthSelector(false)} currentMonthIndex={currentMonthIndex} currentYear={currentYear} onMonthSelect={handleMonthSelect} themePrimary={theme.primary} />}
            {view === 'dashboard' && <YearPicker isOpen={showYearSelector} onClose={() => setShowYearSelector(false)} currentYear={currentYear} onYearSelect={handleYearSelect} themePrimary={theme.primary} />}
            {view === 'weekly' && <WeekPicker isOpen={showWeekSelector} onClose={() => setShowWeekSelector(false)} currentDate={getCurrentWeekStart()} onWeekSelect={handleWeekSelect} themePrimary={theme.primary} />}
            <button onClick={() => view === 'monthly' ? navigateMonth('next') : view === 'weekly' ? navigateWeek('next') : setCurrentYear(prev => prev + 1)} className="hover:text-black active:scale-95 transition-transform"><ChevronRight size={15} /></button>
        </div>
    );

    const viewTabs = (
        <div className="rounded-lg border-2 border-black bg-stone-100 p-0.5 flex items-center shrink-0">
            <button onClick={() => { resetWeekOffset(); setView('weekly'); }} className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.1em] transition-all border ${view === 'weekly' ? 'bg-black text-white border-black' : 'border-transparent text-stone-500 hover:text-black'}`}>
                <Clock size={10} strokeWidth={3} /><span>Week</span>
            </button>
            <button onClick={() => { setView('monthly'); const now = new Date(); setCurrentMonthIndex(now.getMonth()); setCurrentYear(now.getFullYear()); }} className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.1em] transition-all border ${view === 'monthly' ? 'bg-black text-white border-black' : 'border-transparent text-stone-500 hover:text-black'}`}>
                <Calendar size={10} strokeWidth={3} /><span>Month</span>
            </button>
            <button onClick={() => { setView('dashboard'); setCurrentYear(new Date().getFullYear()); }} className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.1em] transition-all border ${view === 'dashboard' ? 'bg-black text-white border-black' : 'border-transparent text-stone-500 hover:text-black'}`}>
                <LayoutDashboard size={10} strokeWidth={3} /><span>Year</span>
            </button>
        </div>
    );


    return (
        <div className="flex flex-col gap-3">

            {/* ─── TOOLBAR ─── */}
            <div className="flex items-center gap-2 bg-white neo-border neo-shadow rounded-2xl px-3 py-2 flex-wrap">
                {/* Logo */}
                <span className="font-serif text-lg font-black uppercase tracking-tighter leading-none select-none shrink-0 pr-1">
                    <span className="text-[#404040]">HABI</span>
                    <span style={{ color: theme.secondary }}>CARD</span>
                </span>
                <div className="w-px h-5 bg-stone-200 shrink-0" />
                {/* Date nav */}
                {dateSelector}
                {/* View tabs */}
                {viewTabs}
                <div className="hidden sm:block w-px h-5 bg-stone-200 shrink-0" />
                {/* Streak */}
                <button
                    onClick={() => setIsStreakModalOpen(true)}
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 text-[10px] font-black uppercase tracking-wide text-stone-600 hover:border-black hover:text-black transition-colors shrink-0"
                >
                    <Flame size={11} className="text-orange-500" />
                    {annualStats.currentStreak}d · {badgeCount} badges
                </button>
                {/* Quick actions */}
                <button
                    onClick={() => { setAutoAddHabitOnOpen(true); setIsHabitModalOpen(true); }}
                    className={actionBtn}
                >
                    <Plus size={11} strokeWidth={3} />{t('common.addHabit')}
                </button>
                <button onClick={onLogToday} className={logTodayBtn}>
                    <Clock size={11} strokeWidth={3} />{t('common.logToday')}
                </button>
                <button onClick={onViewJournal} className={actionBtn}>
                    <BookOpen size={11} strokeWidth={3} />Journal
                </button>
                {/* Spacer */}
                <div className="flex-1" />
                {/* Guest sign-in */}
                {guestMode && (
                    <button onClick={() => window.location.href = '/signin'} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-black bg-black text-white text-[10px] font-black uppercase tracking-wide hover:bg-stone-800 transition-colors shrink-0">
                        <LogIn size={11} strokeWidth={3} />Sign in
                    </button>
                )}
                {/* Icon buttons */}
                <button onClick={onSearch} className={iconBtn}><Search size={13} /></button>
                <SettingsMenu
                    theme={theme} setTheme={setTheme} themes={themes}
                    settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} settingsRef={settingsRef}
                    language={language} setLanguage={setLanguage}
                    startOfWeek={startOfWeek} setStartOfWeek={setStartOfWeek}
                    defaultView={defaultView} setDefaultView={setDefaultView}
                    colorMode={colorMode} setColorMode={setColorMode}
                    cardStyle={cardStyle} setCardStyle={setCardStyle}
                    onReportBug={onReportBug} onOpenWhatsNew={onOpenWhatsNew} onOpenTutorial={onOpenTutorial}
                    onExportData={onExportData} onViewJournal={onViewJournal}
                    isExportingData={isExportingData} hasUnreadFeedback={hasUnreadFeedback} hasUnseenWhatsNew={hasUnseenWhatsNew}
                />
                {!guestMode && (
                    <button onClick={handleLogout} className={iconBtn} title={t('header.logout')}>
                        <LogOut size={13} />
                    </button>
                )}
                {/* Stats toggle */}
                <button
                    onClick={() => setStatsOpen(prev => !prev)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-500 hover:border-black hover:text-black transition-colors text-[10px] font-black uppercase tracking-wide shrink-0"
                >
                    <BarChart2 size={12} />
                    <span className="hidden sm:inline">Stats</span>
                    {statsOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
            </div>

            {/* ─── STATS PANEL ─── */}
            {statsOpen && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

                    {/* Trend chart */}
                    <div className={`neo-border neo-shadow rounded-2xl overflow-hidden flex flex-col min-h-[220px] ${isDarkMode ? 'bg-[#151515]' : 'bg-[#f9f9f9]'}`}>
                        <div className="h-[3px] shrink-0 rounded-t-2xl" style={{ backgroundColor: theme.primary }} />
                        <div className="flex flex-col flex-1 p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-serif font-black uppercase text-sm tracking-widest">
                                    {view === 'monthly' ? t('header.monthlyTrends') : (view === 'weekly' ? t('header.weeklyTrends') : t('header.annualTrends'))}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <div className={`text-sm font-black px-3 py-1 border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${trendDelta >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {Math.abs(trendDelta).toFixed(0)}% {trendDeltaLabel}
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 rounded-full border-2 border-black bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-stone-500">
                                        <span className="inline-flex items-center gap-1">
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.primary }} />
                                            {trendLegendCurrent}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <span className="h-[2px] w-3 rounded-full" style={{ backgroundColor: theme.secondary }} />
                                            {trendLegendPrevious}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setChartType(prev => prev === 'area' ? 'bar' : 'area')}
                                        className="p-1 hover:bg-stone-200 rounded-sm transition-colors text-stone-400 hover:text-stone-600"
                                        title={t('header.switchChart')}
                                    >
                                        {chartType === 'area' ? <BarChart2 size={12} /> : <Activity size={12} />}
                                    </button>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height="100%" minHeight={160} key={view + chartType}>
                                {chartType === 'area' ? (
                                    <AreaChart data={trendChartData} margin={{ right: 20, left: 20, bottom: 0, top: 10 }}>
                                        <defs>
                                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={theme.primary} stopOpacity={0.8} />
                                                <stop offset="95%" stopColor={theme.primary} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.14)" : "#ddd"} />
                                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: isDarkMode ? '#a8a8a8' : '#666' }} interval={view === 'monthly' ? 'preserveStartEnd' : 0} minTickGap={0} padding={{ left: 10, right: 10 }} />
                                        <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#161616' : '#fff', border: isDarkMode ? '1px solid #2d2d2d' : '2px solid black', borderRadius: isDarkMode ? '6px' : '0', color: isDarkMode ? '#ededed' : '#111', fontWeight: 'bold' }} formatter={(value: any, name: string) => [`${value} completed`, name === 'current' ? trendLegendCurrent : trendLegendPrevious]} />
                                        <Area type="monotone" dataKey="previous" name="previous" stroke={theme.secondary} strokeWidth={2} strokeDasharray="6 6" fillOpacity={0} fill="transparent" />
                                        <Area type="monotone" dataKey="current" name="current" stroke={isDarkMode ? "#d6d6d6" : "#000"} strokeWidth={2.5} fillOpacity={1} fill="url(#colorVal)" />
                                    </AreaChart>
                                ) : (
                                    <BarChart data={trendChartData} margin={{ right: 20, left: 20, bottom: 20, top: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.14)" : "#ddd"} />
                                        <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 'bold', fill: isDarkMode ? '#a8a8a8' : '#666' }} stroke={isDarkMode ? "#3a3a3a" : "#999"} tickLine={false} interval={view === 'monthly' ? 'preserveStartEnd' : 0} minTickGap={0} padding={{ left: 5, right: 5 }} label={{ value: view === 'monthly' ? 'Day of Month' : (view === 'weekly' ? 'Day of Week' : 'Month'), position: 'insideBottom', offset: -5, style: { fontSize: 8, fontWeight: 'bold', fill: isDarkMode ? '#a8a8a8' : '#999', textTransform: 'uppercase' } }} />
                                        <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: isDarkMode ? '#a8a8a8' : '#666' }} stroke={isDarkMode ? "#3a3a3a" : "#999"} tickLine={false} width={25} domain={[0, 'dataMax + 1']} allowDecimals={false} />
                                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: isDarkMode ? '#161616' : '#fff', border: isDarkMode ? '1px solid #2d2d2d' : '2px solid black', borderRadius: isDarkMode ? '6px' : '0', color: isDarkMode ? '#ededed' : '#111', fontWeight: 'bold', boxShadow: isDarkMode ? '0 10px 30px rgba(0,0,0,0.45)' : '4px 4px 0px rgba(0,0,0,0.1)' }} formatter={(value: any, name: string) => [`${value} completed`, name === 'current' ? trendLegendCurrent : trendLegendPrevious]} />
                                        <Bar dataKey="previous" name="previous" fill={theme.secondary} fillOpacity={0.55} radius={[4, 4, 0, 0]} stroke={isDarkMode ? "#2d2d2d" : "#000"} strokeWidth={1} animationDuration={900} animationBegin={0} isAnimationActive={true} />
                                        <Bar dataKey="current" name="current" fill={theme.primary} radius={[4, 4, 0, 0]} stroke={isDarkMode ? "#2d2d2d" : "#000"} strokeWidth={1} animationDuration={1000} animationBegin={0} isAnimationActive={true} />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Story / success panel */}
                    <div className="bg-white neo-border neo-shadow rounded-2xl relative flex flex-col overflow-hidden">
                        <div className="text-white text-[11px] font-black uppercase py-2 text-center tracking-widest border-b-[3px] border-black" style={{ backgroundColor: theme.primary }}>
                            {view === 'monthly' ? t('header.monthlySuccess') : (view === 'weekly' ? t('header.weeklySuccess') : t('header.annualPerformance'))}
                        </div>
                        <div className="flex-1 flex flex-col p-3 gap-2 overflow-y-auto">
                            {view === 'monthly' ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest leading-none mb-1">Month Story</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black leading-none">{monthProgress.completed}</span>
                                                <span className="text-lg font-black text-stone-300">/ {monthProgress.total}</span>
                                            </div>
                                        </div>
                                        <div className="w-16 h-16 relative">
                                            <PieChart width={64} height={64}>
                                                <Pie data={[{ value: monthProgress.completed || 0.1 }, { value: monthProgress.remaining || 0 }]} innerRadius="72%" outerRadius="100%" paddingAngle={2} dataKey="value" startAngle={90} endAngle={450} isAnimationActive={true} animationDuration={800}>
                                                    <Cell fill={theme.primary} /><Cell fill={isDarkMode ? "#2a2a2a" : "#f0f0f0"} />
                                                </Pie>
                                            </PieChart>
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className="text-xs font-black" style={{ color: theme.primary }}>{monthProgress.percentage.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-stone-50/50 neo-border rounded-xl p-2 overflow-y-auto">
                                        {(() => {
                                            const isCurrentMonth = currentMonthIndex === currentMonthOfYear && currentYear === currentFullYear;
                                            const daysElapsed = isCurrentMonth ? currentDayOfMonth : new Date(currentYear, currentMonthIndex + 1, 0).getDate();
                                            const story = buildMonthlyStory(monthProgress, topHabitsThisMonth, monthDelta, t, daysElapsed);
                                            return (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-1.5"><Sparkles size={11} className="text-amber-500" /><span className="font-serif text-[9px] font-black uppercase tracking-widest text-stone-500">{t('header.yourStoryMonth')}</span></div>
                                                    {story.sections.map((section: any, idx: number) => (
                                                        <p key={idx} className="text-[12px] leading-relaxed font-bold">
                                                            <FormattedText text={section.text} highlightColor={theme.secondary} className={section.type === 'consistency' ? '' : 'italic'} />
                                                        </p>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </>
                            ) : view === 'weekly' ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest leading-none mb-1">{t('header.habitMaster')}</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black leading-none">{weekProgress.completed}</span>
                                                <span className="text-lg font-black text-stone-300">/ {weekProgress.total}</span>
                                            </div>
                                        </div>
                                        <div className="w-16 h-16 relative">
                                            <PieChart width={64} height={64}>
                                                <Pie data={[{ value: weekProgress.completed || 0.1 }, { value: weekProgress.remaining || 0 }]} innerRadius="72%" outerRadius="100%" paddingAngle={2} dataKey="value" startAngle={90} endAngle={450} isAnimationActive={true} animationDuration={800}>
                                                    <Cell fill={theme.primary} /><Cell fill={isDarkMode ? "#2a2a2a" : "#f0f0f0"} />
                                                </Pie>
                                            </PieChart>
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className="text-xs font-black" style={{ color: theme.primary }}>{weekProgress.percentage.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-stone-50/50 neo-border rounded-xl p-2 overflow-y-auto">
                                        {(() => {
                                            const daysElapsed = weekOffset === 0
                                                ? (startOfWeek === 'sunday' ? today.getDay() + 1 : (today.getDay() === 0 ? 7 : today.getDay()))
                                                : 7;
                                            const story = buildWeeklyStory(weekProgress, weeklyStats, habits, t, daysElapsed);
                                            return (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-1.5"><Sparkles size={11} className="text-amber-500" /><span className="font-serif text-[9px] font-black uppercase tracking-widest text-stone-500">{t('header.yourStoryWeek')}</span></div>
                                                    {story.sections.map((section: any, idx: number) => (
                                                        <p key={idx} className="text-[12px] leading-relaxed font-bold">
                                                            <FormattedText text={section.text} primaryColor={theme.primary} className="text-black" />
                                                        </p>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1"><Sparkles size={11} className="text-amber-500" /><span className="font-serif text-[9px] font-black uppercase tracking-widest text-stone-500">{t('annualUi.story.title')}</span></div>
                                            {annualStory.annualSummary ? (
                                                <div>
                                                    <div className="text-[12px] font-black text-stone-900 truncate">{annualStory.annualSummary.support.strongestHabit?.name || 'Year story'}</div>
                                                    <p className="text-[10px] font-bold text-stone-500">{annualStory.annualSummary.support.momentumLabel} · {annualStory.annualSummary.support.rhythmLabel}</p>
                                                </div>
                                            ) : (
                                                <p className="text-[11px] font-bold text-stone-500">{t('annualUi.story.noSignificantOutcomes')}</p>
                                            )}
                                        </div>
                                        <div className="w-16 h-16 relative shrink-0">
                                            <PieChart width={64} height={64}>
                                                <Pie data={[{ value: annualStats.totalCompletions || 0.1 }, { value: Math.max(0, annualStats.totalPossible - annualStats.totalCompletions) }]} innerRadius="72%" outerRadius="100%" paddingAngle={2} dataKey="value" startAngle={90} endAngle={450} isAnimationActive={true} animationDuration={800}>
                                                    <Cell fill={theme.primary} /><Cell fill={isDarkMode ? "#2a2a2a" : "#f0f0f0"} />
                                                </Pie>
                                            </PieChart>
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className="text-xs font-black" style={{ color: theme.primary }}>{annualCompletionRate.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <div className="rounded-lg bg-stone-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-2 py-1.5 text-center">
                                            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">Rate</div>
                                            <div className="font-serif text-sm font-black text-stone-900">{annualCompletionRate.toFixed(0)}%</div>
                                        </div>
                                        <div className="rounded-lg bg-stone-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-2 py-1.5 text-center">
                                            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">Done</div>
                                            <div className="font-serif text-sm font-black text-stone-900">{Math.round(annualStats.totalCompletions)}</div>
                                        </div>
                                        <div className="rounded-lg bg-stone-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-2 py-1.5 text-center">
                                            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">vs LY</div>
                                            {(() => {
                                                const d = annualDelta;
                                                const pos = d > 0; const neu = Math.abs(d) < 0.1;
                                                return <div className={`flex items-center justify-center gap-0.5 text-sm font-black ${neu ? 'text-stone-400' : pos ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {neu ? <Minus size={11} strokeWidth={4} /> : pos ? <ArrowUp size={11} strokeWidth={4} /> : <ArrowDown size={11} strokeWidth={4} />}
                                                    <span>{Math.abs(d).toFixed(neu ? 0 : 1)}%</span>
                                                </div>;
                                            })()}
                                        </div>
                                    </div>
                                    <div className="rounded-lg border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-stone-50/70 px-3 py-2 flex items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">Strongest month</div>
                                            <div className="font-serif text-[11px] font-black text-stone-900 truncate">{annualStory.annualSummary?.support.strongestMonth?.month || 'Still emerging'}</div>
                                            <div className="text-[10px] font-bold text-stone-500">{annualStory.annualSummary?.support.strongestMonth?.rate ? `${Math.round(annualStory.annualSummary.support.strongestMonth.rate)}% completion` : annualStory.annualSummary?.support.momentumLabel || ''}</div>
                                        </div>
                                        <div className="w-px self-stretch bg-stone-200" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">Strongest habit</div>
                                            <div className="font-serif text-[11px] font-black text-stone-900 truncate">{annualStory.annualSummary?.support.strongestHabit?.name || 'No clear anchor yet'}</div>
                                            <div className="text-[10px] font-bold text-stone-500">{annualStory.annualSummary?.support.rhythmLabel || ''}</div>
                                        </div>
                                    </div>
                                    {currentYear === new Date().getFullYear() && (
                                        <button onClick={() => setIsResolutionsModalOpen(true)} className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-black text-white px-2 py-2 rounded-xl hover:bg-stone-800 transition-colors">
                                            <Sparkles size={11} />{t('header.thisYearResolutions')}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                </div>
            )}

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
        </div>
    );
};
