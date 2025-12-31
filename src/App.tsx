import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './supabase';
import { exportToExcel } from './utils/exportToExcel';
import { AuthForm } from './components/AuthForm';
import { UpdatePasswordForm } from './components/UpdatePasswordForm';
import { Header } from './components/Header';
import { MonthlyView } from './components/MonthlyView';
import { DashboardView } from './components/DashboardView';
import { WeeklyView } from './components/WeeklyView';
import { useHabits } from './hooks/useHabits';
import { useTheme } from './hooks/useTheme';
import { useHabitStats } from './hooks/useHabitStats';
import { DailyNote } from './types';
import { BottomNav } from './components/BottomNav';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false);
  const [defaultView, setDefaultView] = useState<'monthly' | 'dashboard' | 'weekly'>(() => {
    return (localStorage.getItem('habit_default_view') as 'monthly' | 'dashboard' | 'weekly') || 'weekly';
  });
  const [view, setView] = useState<'monthly' | 'dashboard' | 'weekly'>(defaultView);

  const updateDefaultView = async (newView: 'monthly' | 'dashboard' | 'weekly') => {
    setDefaultView(newView);
    localStorage.setItem('habit_default_view', newView);

    if (session?.user?.id) {
      try {
        await supabase.auth.updateUser({
          data: { default_view: newView }
        });
      } catch (err) {
        console.error('Failed to save default view setting:', err);
      }
    }
  };

  useEffect(() => {
    if (session?.user?.user_metadata?.default_view) {
      const remoteView = session.user.user_metadata.default_view;
      if (['monthly', 'dashboard', 'weekly'].includes(remoteView)) {
        setDefaultView(remoteView);
        // Only update view if we are just loading and haven't navigated yet? 
        // Actually, if I login, I probably want to match my saved preference immediately if I was on the default.
        // But if I already navigated, maybe not. 
        // For simplicity and "sync" behavior, let's update local default. 
        // We won't force-change the *current* view unless it's the initial load, 
        // but `view` state is initialized from `defaultView`. 
        // If the user logs in *after* load, we might want to respect their setting.
        // Let's just update the default preference for now.
      }
    }
  }, [session]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const goalInputRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState<DailyNote>({});
  const settingsRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme, THEMES } = useTheme();
  const {
    habits,
    completions,
    loading,
    toggleCompletion,
    addHabit,
    updateHabit,
    removeHabit,
    setLoading
  } = useHabits(session, guestMode);

  const daysInMonth = useMemo(() => new Date(currentYear, currentMonthIndex + 1, 0).getDate(), [currentYear, currentMonthIndex]);
  const monthDates = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const {
    dailyStats,
    weeklyStats,
    weekProgress,
    prevWeekProgress,
    allTimeBestWeek,
    monthProgress,
    topHabitsThisMonth,
    annualStats
  } = useHabitStats(habits, completions, currentMonthIndex, currentYear, daysInMonth, monthDates, weekOffset);

  const weekRange = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7);
    const monday = new Date(today.getFullYear(), today.getMonth(), diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startYear = monday.getFullYear();
    const endYear = sunday.getFullYear();

    if (startYear === endYear) {
      const fromStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const toStr = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${fromStr} - ${toStr}, ${startYear}`;
    } else {
      const fromStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const toStr = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${fromStr} - ${toStr}`;
    }
  }, [weekOffset]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (!initialSession) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryMode(true);
      }
      if (session) {
        setGuestMode(false);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setLoading]);

  // Load notes from database or localStorage
  useEffect(() => {
    const loadNotes = async () => {
      if (session?.user?.id) {
        // Load from database for logged-in users
        const { data, error } = await supabase
          .from('daily_notes')
          .select('date_key, content')
          .eq('user_id', session.user.id);

        if (!error && data) {
          const notesObj: DailyNote = {};
          data.forEach(note => {
            try {
              const parsed = JSON.parse(note.content);
              if (Array.isArray(parsed)) {
                notesObj[note.date_key] = parsed;
              } else {
                // Should not happen if we are strict, but handle just in case it's a JSON string
                notesObj[note.date_key] = [{ id: crypto.randomUUID(), text: String(parsed), completed: false }];
              }
            } catch {
              // Legacy plain text note
              if (note.content) {
                notesObj[note.date_key] = [{ id: crypto.randomUUID(), text: note.content, completed: false }];
              }
            }
          });
          setNotes(notesObj);
        }
      } else {
        // Load from localStorage for guest users
        const localNotes = JSON.parse(localStorage.getItem('habit_daily_notes') || '{}');
        // Migrate local notes if necessary
        const migratedNotes: DailyNote = {};
        Object.entries(localNotes).forEach(([key, val]) => {
          if (typeof val === 'string') {
            migratedNotes[key] = [{ id: crypto.randomUUID(), text: val, completed: false }];
          } else {
            migratedNotes[key] = val as any;
          }
        });
        setNotes(migratedNotes);
      }
    };
    loadNotes();
  }, [session]);

  // ... (existing code for settingsRef etc) ...

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // ...
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    if (settingsOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsOpen]);

  useEffect(() => {
    // ...
    if (editingHabitId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    if (editingGoalId && goalInputRef.current) {
      goalInputRef.current.focus();
      goalInputRef.current.select();
    }
  }, [editingHabitId, editingGoalId]);

  // ... (navigation methods) ...
  const navigateMonth = (direction: 'prev' | 'next') => {
    // ...
    if (direction === 'prev') {
      if (currentMonthIndex === 0) {
        setCurrentMonthIndex(11);
        setCurrentYear(prev => prev - 1);
      } else {
        setCurrentMonthIndex(prev => prev - 1);
      }
    } else {
      if (currentMonthIndex === 11) {
        setCurrentMonthIndex(0);
        setCurrentYear(prev => prev + 1);
      } else {
        setCurrentMonthIndex(prev => prev + 1);
      }
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekOffset(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  const resetWeekOffset = () => {
    setWeekOffset(0);
  };


  const handleHabitBlur = async (habit: any) => {
    setEditingHabitId(null);
    setEditingGoalId(null);
    updateHabit(habit.id, { name: habit.name, goal: habit.goal });
  };

  useEffect(() => {
    // Save to localStorage for guest users
    if (!session?.user?.id) {
      localStorage.setItem('habit_daily_notes', JSON.stringify(notes));
    }
  }, [notes, session]);

  const updateNote = async (dateKey: string, tasks: any[]) => {
    setNotes(prev => ({ ...prev, [dateKey]: tasks }));

    // Check if empty
    const isEmpty = tasks.length === 0;

    // Sync to database for logged-in users
    if (session?.user?.id) {
      if (isEmpty) {
        // Delete empty notes
        await supabase
          .from('daily_notes')
          .delete()
          .eq('user_id', session.user.id)
          .eq('date_key', dateKey);
      } else {
        // Upsert note
        await supabase
          .from('daily_notes')
          .upsert({
            user_id: session.user.id,
            date_key: dateKey,
            content: JSON.stringify(tasks)
          }, {
            onConflict: 'user_id,date_key'
          });
      }
    }
  };

  const isDayFullyCompleted = (day: number) => {
    if (habits.length === 0) return false;
    const dayStatsItem = dailyStats.find(s => s.day === day);
    return dayStatsItem?.count === habits.length;
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setGuestMode(false);
    } catch (err) {
      console.error('Logout error:', err);
      setSession(null);
      setGuestMode(false);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.loading('Generating Excel file...', { id: 'export' });
      await exportToExcel({
        habits,
        completions,
        currentYear,
        currentMonthIndex,
        theme,
        userName: session?.user?.email || 'Guest'
      });
      toast.success('Excel file downloaded successfully!', { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export. Please try again.', { id: 'export' });
    }
  };

  const weeks = useMemo(() => {
    const result: number[][] = [];
    let currentWeek: number[] = [];
    monthDates.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === monthDates.length - 1) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });
    return result;
  }, [monthDates]);

  if (passwordRecoveryMode) {
    return (
      <>
        <Toaster position="top-center" reverseOrder={false} />
        <UpdatePasswordForm onSuccess={() => setPasswordRecoveryMode(false)} />
      </>
    );
  }

  if (!session && !guestMode) {
    return (
      <>
        <Toaster position="top-center" reverseOrder={false} />
        <AuthForm onContinueAsGuest={() => setGuestMode(true)} />
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e5e5e5] flex items-center justify-center">
        <div className="text-xl font-black uppercase tracking-widest animate-pulse">Synchronizing matrix...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e5e5e5] p-2 sm:p-4 pb-20 sm:pb-4 font-sans text-[#444] relative w-full max-w-full">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="max-w-full mx-auto bg-white border-[2px] sm:border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-2 sm:p-4 space-y-4 min-h-[calc(100vh-2rem)]">

        <Header
          view={view}
          setView={setView}
          currentYear={currentYear}
          setCurrentYear={setCurrentYear}
          currentMonthIndex={currentMonthIndex}
          setCurrentMonthIndex={setCurrentMonthIndex}
          navigateMonth={navigateMonth}
          navigateWeek={navigateWeek}
          resetWeekOffset={resetWeekOffset}
          weekRange={weekRange}
          theme={theme}
          setTheme={setTheme}
          themes={THEMES}
          settingsOpen={settingsOpen}
          setSettingsOpen={setSettingsOpen}
          settingsRef={settingsRef}
          guestMode={guestMode}
          setGuestMode={setGuestMode}
          handleLogout={handleLogout}
          monthProgress={monthProgress}
          annualStats={annualStats}
          dailyStats={dailyStats}
          weeklyStats={weeklyStats}
          weekProgress={weekProgress}
          prevWeekProgress={prevWeekProgress}
          allTimeBestWeek={allTimeBestWeek}
          habits={habits}
          defaultView={defaultView}
          setDefaultView={updateDefaultView}
          addHabit={addHabit}
          updateHabit={updateHabit}
          removeHabit={removeHabit}
          setWeekOffset={setWeekOffset}
        />

        {view === 'monthly' ? (
          <MonthlyView
            habits={habits}
            completions={completions}
            currentMonthIndex={currentMonthIndex}
            currentYear={currentYear}
            theme={theme}
            weeks={weeks}
            monthDates={monthDates}
            topHabitsThisMonth={topHabitsThisMonth}
            editingHabitId={editingHabitId}
            editingGoalId={editingGoalId}
            inputRef={inputRef}
            goalInputRef={goalInputRef}
            addHabit={() => addHabit(theme.primary).then(id => setEditingHabitId(id))}
            toggleCompletion={toggleCompletion}
            updateHabitNameState={(id, name) => updateHabit(id, { name })}
            updateHabitGoalState={(id, goal) => updateHabit(id, { goal: parseInt(goal) || 0 })}
            handleHabitBlur={handleHabitBlur}
            setEditingHabitId={setEditingHabitId}
            setEditingGoalId={setEditingGoalId}
            removeHabit={removeHabit}
            isDayFullyCompleted={isDayFullyCompleted}
          />
        ) : view === 'dashboard' ? (
          <DashboardView
            annualStats={annualStats}
            habits={habits}
            theme={theme}
            currentYear={currentYear}
            setCurrentMonthIndex={setCurrentMonthIndex}
            setView={setView}
          />
        ) : (
          <WeeklyView
            habits={habits}
            completions={completions}
            currentYear={currentYear}
            weekOffset={weekOffset}
            theme={theme}
            toggleCompletion={toggleCompletion}
            notes={notes}
            updateNote={updateNote}
            addHabit={() => addHabit(theme.primary).then(id => setEditingHabitId(id))}
          />
        )}
      </div>

      <BottomNav
        view={view}
        setView={setView}
        resetWeekOffset={resetWeekOffset}
        theme={theme}
      />

      <style>{`
        .animate-spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { height: 8px; width: 8px; }
        ::-webkit-scrollbar-thumb { background: #000; border: 2px solid #fff; border-radius: 0; }
        ::-webkit-scrollbar-track { background: #eee; }
        .sticky { position: -webkit-sticky; position: sticky; }
        table { border-collapse: separate; border-spacing: 0; }
        th.sticky, td.sticky { position: -webkit-sticky; position: sticky; background-color: inherit; }
        @media (max-width: 640px) {
          .recharts-responsive-container { min-height: 120px; }
          .overflow-x-auto { -webkit-overflow-scrolling: touch; }
        }
      `}</style>
    </div>
  );
};

export default App;
