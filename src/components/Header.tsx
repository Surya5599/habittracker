import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar, LogIn, LogOut, BarChart2, Plus, BookOpen, Flame, Sun, CheckCircle, Bell, ArrowUpDown, ListTodo, List, Bot, Sparkles } from 'lucide-react';
import { ChromeLogo } from './ChromeLogo';

const CHROME_EXTENSION_URL = 'https://chromewebstore.google.com/detail/habicard-habit-tracker/bjmipgjaandcekaeookkfpacggnodoaj';
import { MONTHS } from '../constants';
import { Habit, Theme, MonthStats, MonthlyGoal, MonthlyGoals } from '../types';
import { useTranslation } from 'react-i18next';
import { SettingsMenu } from './SettingsMenu';
import { AiCoachPersonality } from '../utils/aiCoachPrompt';
import { HabitManagerModal } from './HabitManagerModal';
import { ResolutionsModal } from './ResolutionsModal';
import { WeekPicker, MonthPicker, YearPicker } from './DateSelectors';
import { buildAchievements } from './StreakModal';

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
    aiPersonality: AiCoachPersonality;
    aiCoachEnabled: boolean;
    setAiCoachEnabled: (enabled: boolean) => void;
    setAiPersonality: (personality: AiCoachPersonality) => void;
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
    onChangePassword?: () => void;
    onDeleteAccount?: () => void;
    onSearch: () => void;
    onLogToday: () => void;
    logTodayStatus: 'empty' | 'partial' | 'done';
    statsOpen: boolean;
    onToggleStats: () => void;
    sortMode: 'default' | 'name' | 'color' | 'completion';
    onCycleSortMode: () => void;
    onOpenTasks: () => void;
    tasksCount?: number;
    onOpenLists: () => void;
    listsCount?: number;
    rightPanel?: 'stats' | 'ai' | null;
    onSetRightPanel?: (panel: 'stats' | 'ai') => void;
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
    aiPersonality,
    aiCoachEnabled,
    setAiCoachEnabled,
    setAiPersonality,
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
    onChangePassword,
    onDeleteAccount,
    onSearch,
    onLogToday,
    logTodayStatus,
    statsOpen,
    onToggleStats,
    sortMode,
    onCycleSortMode,
    onOpenTasks,
    tasksCount,
    onOpenLists,
    listsCount,
    rightPanel = null,
    onSetRightPanel,
}) => {
    const { t } = useTranslation();

    const [showWeekSelector, setShowWeekSelector] = React.useState(false);
    const [showMonthSelector, setShowMonthSelector] = React.useState(false);
    const [showYearSelector, setShowYearSelector] = React.useState(false);
    const [autoAddHabitOnOpen, setAutoAddHabitOnOpen] = React.useState(false);

    const navTab = (active: boolean) =>
        `flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-100 border ${active ? 'text-orange-600 bg-orange-50 border-orange-200 shadow-[2px_2px_0px_0px_rgba(234,88,12,0.22)]' : 'text-ink-muted border-transparent hover:text-ink-strong hover:bg-surface-muted hover:border-edge hover:shadow-neo-sm'}`;

    const viewTab = (active: boolean) =>
        `px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-100 ${active ? 'bg-theme-primary text-white shadow-neo-sm' : 'text-ink-muted hover:text-ink-strong hover:bg-surface hover:shadow-neo-sm'}`;

    const logTodayBtnCls = logTodayStatus === 'done'
        ? 'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-ink-inverse transition-colors mr-2'
        : logTodayStatus === 'partial'
            ? 'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-ink-inverse transition-colors mr-2'
            : 'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-ink-inverse transition-colors mr-2';

    const badgeCount = React.useMemo(() => {
        return buildAchievements(
            annualStats,
            annualStats?.allTopHabits || [],
            annualStats?.maxStreak || 0,
            annualStats?.currentStreak || 0
        ).filter((achievement) => achievement.unlocked).length;
    }, [annualStats]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showWeekSelector || showMonthSelector || showYearSelector) {
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
        currentMonday.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
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

    const getCurrentWeekStart = () => {
        const now = new Date();
        const day = now.getDay();
        const diff = startOfWeek === 'monday'
            ? now.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * 7
            : now.getDate() - day + weekOffset * 7;
        return new Date(now.getFullYear(), now.getMonth(), diff);
    };

    const monthLabel = `${MONTHS[currentMonthIndex]} ${currentYear}`;
    const dashboardLabel = `${currentYear}`;
    const weekLabel = (() => {
        const start = getCurrentWeekStart();
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        const fmtFull = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (start.getMonth() === end.getMonth()) {
            return `${fmtFull(start)}–${end.getDate()}`;
        }
        return `${fmtFull(start)}–${fmtFull(end)}`;
    })();
    const currentLabel = view === 'monthly' ? monthLabel : view === 'dashboard' ? dashboardLabel : weekLabel;

    return (
        <div className="flex flex-col bg-surface rounded-2xl border border-edge shadow-sm">

            {/* ─── ROW 1: Logo · Nav tabs (desktop) · Streak (desktop) · CTAs · Icons ─── */}
            <div className="flex items-center gap-1 px-3 sm:px-4 py-2.5 sm:py-3">
                {/* Logo */}
                <span className="font-serif text-xl font-black uppercase tracking-tighter leading-none select-none shrink-0 mr-2 sm:mr-5">
                    <span className="text-[#404040]">HABI</span>
                    <span style={{ color: theme.secondary }}>CARD</span>
                </span>

                {/* Nav tabs — desktop only */}
                <nav className="hidden md:flex items-center gap-0.5">
                    <button onClick={() => { resetWeekOffset(); setView('weekly'); }} className={navTab(view === 'weekly')}>
                        <Sun size={14} />Home
                    </button>
                    <button onClick={() => { setAutoAddHabitOnOpen(false); setIsHabitModalOpen(true); }} className={navTab(false)}>
                        <CheckCircle size={14} />Habits
                    </button>
                    <button onClick={onViewJournal} className={navTab(false)}>
                        <BookOpen size={14} />Journal
                    </button>
                    <button onClick={onOpenTasks} className={navTab(false)}>
                        <ListTodo size={14} />Tasks
                        {(tasksCount ?? 0) > 0 && (
                            <span className="ml-0.5 px-1.5 py-1 rounded-full text-[10px] font-black bg-orange-100 text-orange-600 leading-none">
                                {tasksCount}
                            </span>
                        )}
                    </button>
                    <button onClick={onOpenLists} className={navTab(false)}>
                        <List size={14} />Lists
                        {(listsCount ?? 0) > 0 && (
                            <span className="ml-0.5 px-1.5 py-1 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-600 leading-none">
                                {listsCount}
                            </span>
                        )}
                    </button>
                </nav>

                <div className="hidden md:block w-px h-5 bg-edge mx-2 shrink-0" />

                {/* Streak — sm+ only */}
                <button
                    onClick={() => setIsStreakModalOpen(true)}
                    className="hidden sm:flex items-center gap-2 transition-all duration-100 shrink-0 px-2 py-1 rounded-lg border border-transparent hover:border-edge hover:bg-surface-muted hover:shadow-neo-sm"
                >
                    <Flame size={15} className="text-orange-500" />
                    <div className="leading-none text-left">
                        <div className="text-xs font-black uppercase tracking-wide text-ink-strong">{annualStats.currentStreak} day streak</div>
                        <div className="text-[10px] text-ink-subtle mt-0.5">{badgeCount} badge{badgeCount !== 1 ? 's' : ''} unlocked</div>
                    </div>
                </button>

                <div className="flex-1" />

                {/* Add Habit icon — mobile only */}
                <button
                    onClick={() => { setAutoAddHabitOnOpen(true); setIsHabitModalOpen(true); }}
                    className="sm:hidden p-2 rounded-lg border-2 border-edge-strong text-ink-strong bg-surface active:translate-x-[0.5px] active:translate-y-[0.5px]"
                    style={{ boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)' }}
                >
                    <Plus size={14} strokeWidth={3} />
                </button>

                {/* Get the Chrome extension — desktop only */}
                <a
                    href={CHROME_EXTENSION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-ink-inverse transition-colors mr-2"
                >
                    <ChromeLogo size={14} />
                    Get the Extension!
                </a>

                {/* Add Habit — icon-only on mobile, full label on sm+ */}
                <button
                    onClick={() => { setAutoAddHabitOnOpen(true); setIsHabitModalOpen(true); }}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-edge-strong text-sm font-black uppercase tracking-wide text-ink-strong bg-surface transition-all duration-100 mr-1 active:translate-x-[2px] active:translate-y-[2px]"
                    style={{ boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '1px 1px 0px 0px rgba(0,0,0,1)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '3px 3px 0px 0px rgba(0,0,0,1)')}
                    onMouseDown={e => (e.currentTarget.style.boxShadow = '0px 0px 0px 0px rgba(0,0,0,1)')}
                    onMouseUp={e => (e.currentTarget.style.boxShadow = '1px 1px 0px 0px rgba(0,0,0,1)')}
                >
                    <Plus size={13} strokeWidth={3} />
                    <span className="hidden sm:inline">Add Habit</span>
                </button>

                {/* Notifications */}
                <button
                    onClick={onOpenWhatsNew}
                    className="relative p-2 text-ink-subtle hover:text-ink transition-all rounded-lg hover:bg-surface-muted border border-transparent hover:border-edge"
                >
                    <Bell size={16} />
                    {(hasUnseenWhatsNew || hasUnreadFeedback) && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    )}
                </button>

                {/* Settings */}
                <SettingsMenu
                    theme={theme} setTheme={setTheme} themes={themes}
                    settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} settingsRef={settingsRef}
                    language={language} setLanguage={setLanguage}
                    startOfWeek={startOfWeek} setStartOfWeek={setStartOfWeek}
                    defaultView={defaultView} setDefaultView={setDefaultView}
                    colorMode={colorMode} setColorMode={setColorMode}
                    cardStyle={cardStyle} setCardStyle={setCardStyle}
                    aiPersonality={aiPersonality} setAiPersonality={setAiPersonality}
                    aiCoachEnabled={aiCoachEnabled} setAiCoachEnabled={setAiCoachEnabled}
                    onReportBug={onReportBug} onOpenWhatsNew={onOpenWhatsNew} onOpenTutorial={onOpenTutorial}
                    onExportData={onExportData} onViewJournal={onViewJournal}
                    isExportingData={isExportingData} hasUnreadFeedback={hasUnreadFeedback} hasUnseenWhatsNew={hasUnseenWhatsNew}
                    onLogout={!guestMode ? handleLogout : undefined}
                    onChangePassword={!guestMode ? onChangePassword : undefined}
                    onDeleteAccount={!guestMode ? onDeleteAccount : undefined}
                />

                {guestMode && (
                    <button
                        onClick={() => window.location.href = '/signin'}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-edge-strong bg-surface-inverse text-ink-inverse text-xs font-black uppercase tracking-wide hover:bg-surface-inverse-hover transition-colors ml-1"
                    >
                        <LogIn size={11} strokeWidth={3} />Sign in
                    </button>
                )}

                {!guestMode && (
                    <button
                        onClick={handleLogout}
                        className="p-2 text-ink-subtle hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="Log out"
                    >
                        <LogOut size={15} />
                    </button>
                )}
            </div>

            {/* ─── ROW 2: Date nav · Week/Month/Year · Sort · Stats ─── */}
            <div className="flex items-center gap-1 px-3 sm:px-4 py-2 border-t border-edge-subtle date-selector-container">

                {/* View switcher — desktop only (bottom nav handles this on mobile) */}
                <div className="hidden sm:flex items-center gap-0.5 bg-surface-strong rounded-lg p-1 ml-1">
                    <button onClick={() => { resetWeekOffset(); setView('weekly'); }} className={viewTab(view === 'weekly')}>Week</button>
                    <button onClick={() => { setView('monthly'); const now = new Date(); setCurrentMonthIndex(now.getMonth()); setCurrentYear(now.getFullYear()); }} className={viewTab(view === 'monthly')}>Month</button>
                    <button onClick={() => { setView('dashboard'); setCurrentYear(new Date().getFullYear()); }} className={viewTab(view === 'dashboard')}>Year</button>
                </div>

                {/* Date navigation */}
                <button
                    onClick={() => view === 'monthly' ? navigateMonth('prev') : view === 'weekly' ? navigateWeek('prev') : setCurrentYear(prev => prev - 1)}
                    className="p-1 text-ink-subtle hover:text-ink transition-colors shrink-0"
                >
                    <ChevronLeft size={16} />
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (view === 'monthly') { setShowMonthSelector(!showMonthSelector); setShowWeekSelector(false); setShowYearSelector(false); }
                        else if (view === 'weekly') { setShowWeekSelector(!showWeekSelector); setShowMonthSelector(false); setShowYearSelector(false); }
                        else { setShowYearSelector(!showYearSelector); setShowWeekSelector(false); setShowMonthSelector(false); }
                    }}
                    className="text-sm font-semibold text-ink hover:text-ink-strong transition-colors relative whitespace-nowrap"
                >
                    {currentLabel}
                    {view === 'monthly' && <MonthPicker isOpen={showMonthSelector} onClose={() => setShowMonthSelector(false)} currentMonthIndex={currentMonthIndex} currentYear={currentYear} onMonthSelect={handleMonthSelect} themePrimary={theme.primary} />}
                    {view === 'dashboard' && <YearPicker isOpen={showYearSelector} onClose={() => setShowYearSelector(false)} currentYear={currentYear} onYearSelect={handleYearSelect} themePrimary={theme.primary} />}
                    {view === 'weekly' && <WeekPicker isOpen={showWeekSelector} onClose={() => setShowWeekSelector(false)} currentDate={getCurrentWeekStart()} onWeekSelect={handleWeekSelect} themePrimary={theme.primary} />}
                </button>

                <button
                    onClick={() => view === 'monthly' ? navigateMonth('next') : view === 'weekly' ? navigateWeek('next') : setCurrentYear(prev => prev + 1)}
                    className="p-1 text-ink-subtle hover:text-ink transition-colors shrink-0"
                >
                    <ChevronRight size={16} />
                </button>

                {/* Sort — icon+label on sm+, icon-only on mobile */}
                <button
                    onClick={onCycleSortMode}
                    className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${sortMode !== 'default' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'text-ink-muted hover:text-ink-strong hover:bg-surface-muted'}`}
                >
                    <ArrowUpDown size={12} strokeWidth={2.5} />
                    {sortMode === 'name' ? 'A–Z' : sortMode === 'color' ? 'Color' : sortMode === 'completion' ? 'To Do' : 'Sort'}
                </button>

                {/* Today button */}
                <button
                    onClick={onLogToday}
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-ink-muted hover:text-ink-strong hover:bg-surface-muted transition-colors"
                >
                    <Sun size={12} strokeWidth={2.5} />
                    Today
                </button>

                <div className="flex-1" />

                {/* Log Today — mobile only, in row 2 */}
                <button onClick={onLogToday} className={`sm:hidden ${logTodayBtnCls}`}>
                    <Plus size={13} strokeWidth={2.5} />
                    Log
                </button>

                {/* AI Coach button */}
                {aiCoachEnabled && (
                    <button
                        onClick={() => onSetRightPanel?.('ai')}
                        className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 border-2 border-edge-strong text-[10px] font-black uppercase tracking-wide transition-all duration-100 ml-1 ${
                            rightPanel === 'ai'
                                ? 'bg-theme-primary text-white translate-x-[2px] translate-y-[2px]'
                                : 'bg-surface text-ink-strong shadow-neo-sm hover:shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px]'
                        }`}
                    >
                        <Bot size={12} strokeWidth={2.5} />
                        <span className="hidden sm:inline">AI Coach</span>
                        <span className={`text-[8px] font-black px-1 py-px leading-none ${rightPanel === 'ai' ? 'bg-surface text-ink-strong' : 'bg-surface-inverse text-ink-inverse'}`}>
                            {rightPanel === 'ai' ? 'ON' : 'OFF'}
                        </span>
                    </button>
                )}

                {/* Stats toggle */}
                <button
                    onClick={onToggleStats}
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 border-2 border-edge-strong text-[10px] font-black uppercase tracking-wide transition-all duration-100 ml-1 ${
                        statsOpen
                            ? 'bg-theme-primary text-white translate-x-[2px] translate-y-[2px]'
                            : 'bg-surface text-ink-strong shadow-neo-sm hover:shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px]'
                    }`}
                >
                    <BarChart2 size={12} strokeWidth={2.5} />
                    <span className="hidden sm:inline">Stats</span>
                    <span className={`text-[8px] font-black px-1 py-px leading-none ${statsOpen ? 'bg-surface text-ink-strong' : 'bg-surface-inverse text-ink-inverse'}`}>
                        {statsOpen ? 'ON' : 'OFF'}
                    </span>
                </button>
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
        </div>
    );
};
