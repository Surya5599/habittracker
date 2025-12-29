import React from 'react';
import { ChevronLeft, ChevronRight, LayoutDashboard, Calendar, Clock, LogIn, LogOut } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { MONTHS } from '../constants';
import { Theme, MonthStats, Habit } from '../types';
import { SettingsMenu } from './SettingsMenu';
import { HabitManagerModal } from './HabitManagerModal';
import { StatCard } from './StatCard';

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
}) => {
    const [isHabitModalOpen, setIsHabitModalOpen] = React.useState(false);

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3 border border-stone-200 p-3 bg-white flex flex-col gap-2 h-full justify-between relative min-h-[160px]">
                <div>
                    {view === 'monthly' ? (
                        <div className="flex items-center justify-between bg-white border border-stone-300 px-2 py-1">
                            <button onClick={() => navigateMonth('prev')} className="hover:text-black active:scale-95 transition-transform"><ChevronLeft size={16} /></button>
                            <span className="font-bold uppercase tracking-widest text-sm select-none">{MONTHS[currentMonthIndex]} {currentYear}</span>
                            <button onClick={() => navigateMonth('next')} className="hover:text-black active:scale-95 transition-transform"><ChevronRight size={16} /></button>
                        </div>
                    ) : view === 'dashboard' ? (
                        <div className="flex items-center justify-between bg-white border border-stone-300 px-2 py-1">
                            <button onClick={() => setCurrentYear(prev => prev - 1)} className="hover:text-black active:scale-95 transition-transform"><ChevronLeft size={16} /></button>
                            <span className="font-bold uppercase tracking-widest text-sm select-none">{currentYear} Dashboard</span>
                            <button onClick={() => setCurrentYear(prev => prev + 1)} className="hover:text-black active:scale-95 transition-transform"><ChevronRight size={16} /></button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-white border border-stone-300 px-2 py-1">
                            <button onClick={() => navigateWeek('prev')} className="hover:text-black active:scale-95 transition-transform"><ChevronLeft size={16} /></button>
                            <span className="font-bold uppercase tracking-widest text-sm select-none">Weekly Progress <span className="text-[10px] text-stone-400 font-medium lowercase tracking-normal">{weekRange}</span></span>
                            <button onClick={() => navigateWeek('next')} className="hover:text-black active:scale-95 transition-transform"><ChevronRight size={16} /></button>
                        </div>
                    )}

                    <div className="mt-2 flex items-center justify-start gap-2 flex-wrap">
                        <button
                            onClick={() => { resetWeekOffset(); setView('weekly'); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black text-[10px] font-black uppercase tracking-widest transition-all ${view === 'weekly' ? 'bg-black text-white shadow-none translate-y-0.5' : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'}`}
                        >
                            <Clock size={12} />
                            Daily
                        </button>

                        <button
                            onClick={() => setView('monthly')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black text-[10px] font-black uppercase tracking-widest transition-all ${view === 'monthly' ? 'bg-black text-white shadow-none translate-y-0.5' : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'}`}
                        >
                            <Calendar size={12} />
                            Monthly
                        </button>

                        <button
                            onClick={() => setView('dashboard')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black text-[10px] font-black uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-black text-white shadow-none translate-y-0.5' : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'}`}
                        >
                            <LayoutDashboard size={12} />
                            Dashboard
                        </button>


                        <SettingsMenu
                            theme={theme}
                            setTheme={setTheme}
                            themes={themes}
                            settingsOpen={settingsOpen}
                            setSettingsOpen={setSettingsOpen}
                            settingsRef={settingsRef}
                            defaultView={defaultView}
                            setDefaultView={setDefaultView}
                        />


                        {guestMode ? (
                            <button
                                onClick={() => setGuestMode(false)}
                                className="flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                            >
                                <LogIn size={12} />
                                Sign In
                            </button>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="p-1.5 rounded-full border border-stone-200 text-stone-300 hover:text-rose-500 transition-colors"
                                title="Logout"
                            >
                                <LogOut size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {view === 'monthly' ? (
                    <div className="space-y-2 mt-2 flex flex-col h-full">
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
                        <button
                            onClick={() => setIsHabitModalOpen(true)}
                            className="w-full flex-1 flex flex-row items-center justify-between px-4 text-white rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-0.5 hover:shadow-none transition-all border border-black group min-h-[40px]"
                            style={{ backgroundColor: theme.secondary }}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest group-hover:scale-105 transition-transform">My Habits</span>
                            <div className="flex flex-col items-end justify-center">
                                <span className="text-xl font-black leading-none">{habits.length}</span>
                                <span className="text-[8px] font-bold text-stone-500 uppercase tracking-wider">Active</span>
                            </div>
                        </button>
                    </div>
                ) : view === 'weekly' ? (
                    <div className="space-y-2 mt-2 flex flex-col h-full">
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
                        <button
                            onClick={() => setIsHabitModalOpen(true)}
                            className="w-full flex-1 flex flex-row items-center justify-between px-4 text-white rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-0.5 hover:shadow-none transition-all border border-black group min-h-[40px]"
                            style={{ backgroundColor: theme.secondary }}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest group-hover:scale-105 transition-transform">My Habits</span>
                            <div className="flex flex-col items-end justify-center">
                                <span className="text-xl font-black leading-none">{habits.length}</span>
                                <span className="text-[8px] font-bold text-stone-500 uppercase tracking-wider">Active</span>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-1 mt-2 h-full">
                        <button
                            onClick={() => setIsHabitModalOpen(true)}
                            className="w-full h-full max-h-[100px] flex flex-row items-center justify-between px-4 text-white rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-0.5 hover:shadow-none transition-all border border-black group"
                            style={{ backgroundColor: theme.secondary }}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest group-hover:scale-105 transition-transform">My Habits</span>
                            <div className="flex flex-col items-end justify-center">
                                <span className="text-3xl font-black leading-none">{habits.length}</span>
                                <span className="text-[8px] font-bold text-stone-500 uppercase tracking-wider">Active</span>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            <div className="md:col-span-6 border border-stone-200 p-2 bg-[#f9f9f9] min-h-[160px] h-[160px] relative overflow-hidden flex flex-col">
                <div className="text-[9px] font-black uppercase tracking-widest text-stone-600 mb-1 px-1">
                    {view === 'monthly' ? 'Daily Progress This Month' : (view === 'weekly' ? 'Daily Progress This Week' : 'Monthly Progress This Year')}
                </div>
                <ResponsiveContainer width="100%" height="100%" minHeight={120}>
                    <AreaChart data={view === 'monthly' ? dailyStats : (view === 'weekly' ? weeklyStats : annualStats.monthlySummaries)}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme.primary} stopOpacity={0.4} />
                                <stop offset="65%" stopColor={theme.primary} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={theme.primary} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
                        <XAxis
                            dataKey={view === 'monthly' ? "day" : (view === 'weekly' ? "displayDay" : "month")}
                            tick={{ fontSize: 9, fontWeight: 'bold' }}
                            stroke="#999"
                            tickLine={false}
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
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '2px solid #000',
                                borderRadius: '0px',
                                fontSize: '10px',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                padding: '6px 8px'
                            }}
                            labelStyle={{ fontWeight: 'bold', marginBottom: '2px' }}
                            formatter={(value: any) => [`${value} completed`, view === 'dashboard' ? 'Total' : 'Habits']}
                        />
                        <Area
                            type="monotone"
                            dataKey={view === 'dashboard' ? "completed" : "count"}
                            stroke={theme.primary}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCount)"
                            dot={{ r: 3, fill: theme.primary, strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                            animationDuration={400}
                            isAnimationActive={true}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="md:col-span-3 border border-stone-200 bg-white relative flex flex-col overflow-hidden min-h-[160px]">
                <div className="text-white text-[9px] font-bold uppercase py-1 text-center tracking-widest" style={{ backgroundColor: theme.primary }} title={view === 'monthly' ? 'Percentage of habits completed this month' : (view === 'weekly' ? 'Percentage of habits completed this week' : 'Percentage of all possible completions this year')}>
                    {view === 'monthly' ? 'Monthly Success' : (view === 'weekly' ? 'Weekly Success' : 'Annual Performance')}
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-2 relative">
                    <div className="w-full h-20 sm:h-20 min-h-[80px] relative">
                        <ResponsiveContainer width="100%" height="100%" minHeight={80}>
                            <PieChart>
                                <Pie
                                    data={view === 'monthly'
                                        ? [{ value: monthProgress.completed || 0.1 }, { value: monthProgress.remaining || 0 }]
                                        : (view === 'weekly'
                                            ? [{ value: weekProgress.completed || 0.1 }, { value: weekProgress.remaining || 0 }]
                                            : [{ value: annualStats.totalCompletions || 0.1 }, { value: Math.max(0, annualStats.totalPossible - annualStats.totalCompletions) }]
                                        )
                                    }
                                    innerRadius="65%" outerRadius="85%" paddingAngle={2} dataKey="value" startAngle={90} endAngle={450}
                                    isAnimationActive={true}
                                >
                                    <Cell fill={theme.primary} /><Cell fill="#f0f0f0" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black leading-none" style={{ color: theme.primary }}>
                                {view === 'monthly'
                                    ? monthProgress.percentage.toFixed(0)
                                    : (view === 'weekly' ? weekProgress.percentage.toFixed(0) : (annualStats.totalPossible > 0 ? (annualStats.totalCompletions / annualStats.totalPossible * 100).toFixed(0) : 0))}%
                            </span>
                        </div>
                    </div>
                    <div className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mt-1">
                        {view === 'monthly'
                            ? `${monthProgress.completed} / ${monthProgress.completed + monthProgress.remaining} Completed`
                            : (view === 'weekly'
                                ? `${weekProgress.completed} / ${weekProgress.completed + weekProgress.remaining} Completed`
                                : `${annualStats.totalCompletions} / ${annualStats.totalPossible} Completed`
                            )
                        }
                    </div>
                </div>
            </div>
            <HabitManagerModal
                isOpen={isHabitModalOpen}
                onClose={() => setIsHabitModalOpen(false)}
                habits={habits}
                addHabit={addHabit}
                updateHabit={updateHabit}
                removeHabit={removeHabit}
                themePrimary={theme.primary}
            />
        </div >
    );
};
