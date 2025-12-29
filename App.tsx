
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
  ChevronLeft, ChevronRight, Check, Plus, Trash2, Save, Settings,
  LayoutDashboard, Calendar, Trophy, Zap, Target, Award,
  TrendingUp, TrendingDown, ArrowRight, Clock, LogOut, User, LogIn
} from 'lucide-react';
import { Habit, HabitCompletion } from './types';
import { INITIAL_HABITS, MONTHS, DAYS_OF_WEEK_SHORT } from './constants';
import { supabase } from './supabase';
import toast, { Toaster } from 'react-hot-toast';

const THEMES = [
  { name: 'Sage & Rose', primary: '#8da18d', secondary: '#d1b1b1' },
  { name: 'Ocean & Sky', primary: '#5b8a8a', secondary: '#8db1d1' },
  { name: 'Sunset & Clay', primary: '#b28d6c', secondary: '#d1a1a1' },
  { name: 'Lavender & Slate', primary: '#8d8da1', secondary: '#b1a1d1' },
  { name: 'Forest & Earth', primary: '#5a7a5a', secondary: '#a18d7c' },
];

const LOCAL_HABITS_KEY = 'guest_habits';
const LOCAL_COMPLETIONS_KEY = 'guest_completions';

interface AuthFormProps {
  onContinueAsGuest: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onContinueAsGuest }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else toast.success('Logged in successfully!');
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) toast.error(error.message);
    else toast.success('Check your email to confirm your account.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e5e5e5] p-4">
      <div className="max-w-md w-full bg-white border-[2px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-6 space-y-6">
        <h2 className="text-2xl font-bold text-center text-[#444] uppercase tracking-widest">Habit Tracker</h2>
        <p className="text-center text-sm text-stone-500">Sign in to sync your progress across devices.</p>
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase text-stone-500 mb-1">Email</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border-[2px] border-black focus:outline-none focus:ring-2 focus:ring-stone-300 text-sm"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-bold uppercase text-stone-500 mb-1">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border-[2px] border-black focus:outline-none focus:ring-2 focus:ring-stone-300 text-sm"
              disabled={loading}
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleLogin}
                className="flex-1 px-4 py-2 border-[2px] border-black text-sm font-black uppercase tracking-widest bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Sign In'}
              </button>
              <button
                onClick={handleSignUp}
                className="flex-1 px-4 py-2 border-[2px] border-black text-sm font-black uppercase tracking-widest bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Sign Up'}
              </button>
            </div>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-stone-200"></div>
              <span className="flex-shrink mx-4 text-stone-400 text-[10px] font-bold uppercase">or</span>
              <div className="flex-grow border-t border-stone-200"></div>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); onContinueAsGuest(); }}
              className="w-full px-4 py-2 border-[2px] border-dashed border-stone-400 text-xs font-bold uppercase tracking-widest text-stone-500 hover:bg-stone-50 hover:border-black hover:text-black transition-all flex items-center justify-center gap-2"
            >
              <User size={14} />
              Continue as Guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [view, setView] = useState<'monthly' | 'dashboard'>('monthly');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const goalInputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('habit_theme');
    return saved ? JSON.parse(saved) : THEMES[0];
  });

  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion>({});

  // Sync Logic
  const syncGuestToCloud = async (userId: string, localHabits: Habit[], localCompletions: HabitCompletion) => {
    if (localHabits.length === 0) return;

    const toastId = toast.loading('Syncing guest data to your account...');
    try {
      // SAFETY CHECK: If user already has habits in the cloud, DON'T OVERWRITE
      const { data: existingHabits, error: fetchError } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (fetchError) throw fetchError;

      if (existingHabits && existingHabits.length > 0) {
        console.log('User already has data in cloud. Skipping guest sync to prevent data loss.');
        localStorage.removeItem(LOCAL_HABITS_KEY);
        localStorage.removeItem(LOCAL_COMPLETIONS_KEY);
        toast.success('Found your account data! Resuming...', { id: toastId });
        return;
      }

      await supabase.from('habits').delete().eq('user_id', userId);
      await supabase.from('completions').delete().eq('user_id', userId);

      const habitsToInsert = localHabits.map(h => ({
        name: h.name,
        type: h.type,
        color: h.color,
        goal: h.goal,
        user_id: userId
      }));

      const { data: insertedHabits, error: hError } = await supabase
        .from('habits')
        .insert(habitsToInsert)
        .select()
        .order('id', { ascending: true });

      if (hError) throw hError;

      const idMap: Record<string, string> = {};
      insertedHabits?.forEach((h, idx) => {
        idMap[localHabits[idx].id] = h.id;
      });

      const completionsToInsert: any[] = [];
      Object.entries(localCompletions).forEach(([oldHabitId, dates]) => {
        const newHabitId = idMap[oldHabitId];
        if (!newHabitId) return;
        Object.keys(dates).forEach(dateKey => {
          if (dates[dateKey]) {
            completionsToInsert.push({
              habit_id: newHabitId,
              date_key: dateKey,
              user_id: userId
            });
          }
        });
      });

      if (completionsToInsert.length > 0) {
        const { error: cError } = await supabase.from('completions').insert(completionsToInsert);
        if (cError) throw cError;
      }

      localStorage.removeItem(LOCAL_HABITS_KEY);
      localStorage.removeItem(LOCAL_COMPLETIONS_KEY);

      toast.success('Local data synced successfully!', { id: toastId });
    } catch (err) {
      console.error('Sync failed:', err);
      toast.error('Sync failed, but your account is ready.', { id: toastId });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) {
        const localH = JSON.parse(localStorage.getItem(LOCAL_HABITS_KEY) || '[]');
        const localC = JSON.parse(localStorage.getItem(LOCAL_COMPLETIONS_KEY) || '{}');
        if (localH.length > 0) {
          syncGuestToCloud(initialSession.user.id, localH, localC).then(() => fetchUserData(initialSession.user.id));
        } else {
          fetchUserData(initialSession.user.id);
        }
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setGuestMode(false);
        const localH = JSON.parse(localStorage.getItem(LOCAL_HABITS_KEY) || '[]');
        const localC = JSON.parse(localStorage.getItem(LOCAL_COMPLETIONS_KEY) || '{}');
        if (localH.length > 0) {
          syncGuestToCloud(session.user.id, localH, localC).then(() => fetchUserData(session.user.id));
        } else {
          fetchUserData(session.user.id);
        }
      } else {
        setHabits([]);
        setCompletions({});
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    setLoading(true);
    try {
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: true });

      if (habitsError) throw habitsError;

      let userHabits = habitsData || [];

      if (userHabits.length === 0) {
        const initialWithUser = INITIAL_HABITS.map(h => ({
          name: h.name,
          type: h.type,
          color: h.color,
          goal: h.goal,
          user_id: userId
        }));
        const { data: inserted, error: insertError } = await supabase
          .from('habits')
          .insert(initialWithUser)
          .select()
          .order('id', { ascending: true });
        if (insertError) throw insertError;
        userHabits = inserted || [];
      }
      setHabits(userHabits);

      const { data: completionsData, error: compError } = await supabase
        .from('completions')
        .select('habit_id, date_key')
        .eq('user_id', userId);

      if (compError) throw compError;

      const compMap: HabitCompletion = {};
      completionsData?.forEach(c => {
        if (!compMap[c.habit_id]) compMap[c.habit_id] = {};
        compMap[c.habit_id][c.date_key] = true;
      });
      setCompletions(compMap);

    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to sync data');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    if (session) {
      toast.error('You are already logged in.');
      return;
    }
    setGuestMode(true);
    const localH = localStorage.getItem(LOCAL_HABITS_KEY);
    const localC = localStorage.getItem(LOCAL_COMPLETIONS_KEY);

    if (localH) setHabits(JSON.parse(localH));
    else setHabits(INITIAL_HABITS);

    if (localC) setCompletions(JSON.parse(localC));
    else setCompletions({});

    toast('Guest Mode: Updates are local. Create account to sync.', {
      icon: '🏠',
      duration: 5000,
    });
  };

  useEffect(() => {
    if (guestMode) {
      localStorage.setItem(LOCAL_HABITS_KEY, JSON.stringify(habits));
      localStorage.setItem(LOCAL_COMPLETIONS_KEY, JSON.stringify(completions));
    }
  }, [habits, completions, guestMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    if (settingsOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsOpen]);

  useEffect(() => {
    if (editingHabitId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    if (editingGoalId && goalInputRef.current) {
      goalInputRef.current.focus();
      goalInputRef.current.select();
    }
  }, [editingHabitId, editingGoalId]);

  useEffect(() => {
    localStorage.setItem('habit_theme', JSON.stringify(theme));
  }, [theme]);

  const navigateMonth = (direction: 'prev' | 'next') => {
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

  const goToToday = () => {
    const today = new Date();
    setCurrentMonthIndex(today.getMonth());
    setCurrentYear(today.getFullYear());
    setView('monthly');
  };

  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const toggleCompletion = async (habitId: string, day: number, monthIdx: number = currentMonthIndex, year: number = currentYear) => {
    const dateKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const alreadyDone = completions[habitId]?.[dateKey];

    setCompletions(prev => {
      const habitCompletions = prev[habitId] || {};
      return {
        ...prev,
        [habitId]: {
          ...habitCompletions,
          [dateKey]: !alreadyDone
        }
      };
    });

    if (session && !guestMode) {
      try {
        if (alreadyDone) {
          await supabase
            .from('completions')
            .delete()
            .match({ user_id: session.user.id, habit_id: habitId, date_key: dateKey });
        } else {
          await supabase
            .from('completions')
            .insert({ user_id: session.user.id, habit_id: habitId, date_key: dateKey });
        }
      } catch (err) {
        console.error('Sync error:', err);
        toast.error('Failed to sync completion');
      }
    }
  };

  const isCompleted = (habitId: string, day: number, monthIdx: number = currentMonthIndex, year: number = currentYear) => {
    const dateKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return completions[habitId]?.[dateKey] || false;
  };

  const addHabit = async () => {
    const tempId = Date.now().toString();
    const newHabit: Habit = { id: tempId, name: '', type: 'daily', color: theme.primary, goal: 80 };

    setHabits(prev => [...prev, newHabit]);
    setEditingHabitId(tempId);

    if (session && !guestMode) {
      try {
        const { data, error } = await supabase
          .from('habits')
          .insert({ name: '', type: 'daily', color: theme.primary, goal: 80, user_id: session.user.id })
          .select();

        if (error) throw error;
        if (data) {
          setHabits(prev => prev.map(h => h.id === tempId ? data[0] : h));
          setEditingHabitId(data[0].id);
        }
      } catch (err) {
        console.error('Error adding habit:', err);
        toast.error('Failed to add habit');
      }
    }
  };

  const updateHabitNameState = (id: string, name: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, name } : h));
  };

  const updateHabitGoalState = (id: string, goalStr: string) => {
    const goal = parseInt(goalStr) || 0;
    setHabits(prev => prev.map(h => h.id === id ? { ...h, goal: Math.min(100, Math.max(0, goal)) } : h));
  };

  const handleHabitBlur = async (habit: Habit) => {
    setEditingHabitId(null);
    setEditingGoalId(null);
    if (session && !guestMode) {
      try {
        await supabase
          .from('habits')
          .update({ name: habit.name, goal: habit.goal })
          .eq('id', habit.id)
          .eq('user_id', session.user.id);
      } catch (err) {
        console.error('Error updating habit:', err);
        toast.error('Failed to save habit updates');
      }
    }
  };

  const removeHabit = async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setCompletions(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    if (session && !guestMode) {
      try {
        await supabase.from('habits').delete().eq('id', id).eq('user_id', session.user.id);
        await supabase.from('completions').delete().eq('habit_id', id).eq('user_id', session.user.id);
      } catch (err) {
        console.error('Error removing habit:', err);
        toast.error('Failed to remove habit');
      }
    }
  };

  const getHabitMonthStats = (habitId: string, monthIdx: number = currentMonthIndex, year: number = currentYear) => {
    const today = new Date();
    const dInM = new Date(year, monthIdx + 1, 0).getDate();
    const isPastDate = (y: number, m: number, d: number) => {
      const target = new Date(y, m, d);
      return target < today;
    };

    let completed = 0;
    let missed = 0;

    for (let day = 1; day <= dInM; day++) {
      const isDone = isCompleted(habitId, day, monthIdx, year);
      if (isDone) {
        completed++;
      } else if (isPastDate(year, monthIdx, day)) {
        missed++;
      }
    }

    return { completed, missed, totalDays: dInM };
  };

  const dailyStats = useMemo(() => {
    return monthDates.map(day => {
      let count = 0;
      habits.forEach(habit => { if (isCompleted(habit.id, day)) count++; });
      return { day, count };
    });
  }, [completions, currentMonthIndex, currentYear, habits]);

  const monthProgress = useMemo(() => {
    const totalPossible = habits.length * daysInMonth;
    let completed = 0;
    habits.forEach(habit => {
      monthDates.forEach(day => { if (isCompleted(habit.id, day)) completed++; });
    });
    return {
      total: totalPossible,
      completed,
      remaining: Math.max(0, totalPossible - completed),
      percentage: totalPossible > 0 ? (completed / totalPossible) * 100 : 0
    };
  }, [completions, currentMonthIndex, currentYear, habits, daysInMonth]);

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

  const topHabitsThisMonth = useMemo(() => {
    return habits
      .map(h => {
        const stats = getHabitMonthStats(h.id);
        return {
          ...h,
          stats,
          percentage: stats.totalDays > 0 ? (stats.completed / stats.totalDays) * 100 : 0
        };
      })
      .sort((a, b) => b.stats.completed - a.stats.completed || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
      .slice(0, 10);
  }, [habits, completions, currentMonthIndex, currentYear]);

  const annualStats = useMemo(() => {
    let totalCompletions = 0;
    let totalPossible = 0;
    let maxStreak = 0;
    let currentStreak = 0;

    const monthlySummariesRaw = MONTHS.map((_, mIdx) => {
      const dInM = new Date(currentYear, mIdx + 1, 0).getDate();
      let mCompleted = 0;
      habits.forEach(h => {
        for (let d = 1; d <= dInM; d++) {
          if (isCompleted(h.id, d, mIdx, currentYear)) mCompleted++;
        }
      });
      totalCompletions += mCompleted;
      totalPossible += habits.length * dInM;
      return {
        month: MONTHS[mIdx],
        completed: mCompleted,
        total: habits.length * dInM,
        rate: habits.length * dInM > 0 ? (mCompleted / (habits.length * dInM)) * 100 : 0
      };
    });

    const maxMonthlyRate = Math.max(...monthlySummariesRaw.map(m => m.rate));

    const monthlySummaries = monthlySummariesRaw.map((m, idx) => {
      const prev = idx > 0 ? monthlySummariesRaw[idx - 1] : null;
      const delta = prev ? m.rate - prev.rate : 0;
      let signal = "";

      if (m.rate > 0 && m.rate === maxMonthlyRate) signal = "Best focus month";
      else if (prev && delta < -15) signal = "Burnout dip";
      else if (prev && delta > 15 && prev.rate < 40) signal = "Rebound month";

      return { ...m, delta, signal };
    });


    for (let m = 0; m < 12; m++) {
      const dInM = new Date(currentYear, m + 1, 0).getDate();
      for (let d = 1; d <= dInM; d++) {
        const anyCompleted = habits.some(h => isCompleted(h.id, d, m, currentYear));
        if (anyCompleted) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
    }

    const habitPerformance = habits.map(h => {
      let hCompleted = 0;
      let hPossible = 0;
      const mCompletions: number[] = new Array(12).fill(0);

      MONTHS.forEach((_, mIdx) => {
        const dInM = new Date(currentYear, mIdx + 1, 0).getDate();
        for (let d = 1; d <= dInM; d++) {
          if (isCompleted(h.id, d, mIdx, currentYear)) {
            hCompleted++;
            mCompletions[mIdx]++;
          }
        }
        hPossible += dInM;
      });

      const q1 = mCompletions.slice(0, 3).reduce((a, b) => a + b, 0);
      const q4 = mCompletions.slice(9, 12).reduce((a, b) => a + b, 0);

      let badge = "Active Habit";
      if (hCompleted > 0) {
        if (hCompleted / hPossible > 0.85) badge = "Most Consistent";
        else if (hCompleted >= hPossible * 0.5) badge = "Identity Driver";
        else if (q4 > q1 * 1.5 && q4 > 5) badge = "Highest Growth";
        else if (hCompleted > 15) badge = "Most Attempted";
      }

      return {
        id: h.id, name: h.name, completed: hCompleted, total: hPossible, rate: hPossible > 0 ? (hCompleted / hPossible) * 100 : 0, badge,
        startRate: hPossible > 0 ? (q1 / (hPossible / 4)) * 100 : 0,
        endRate: hPossible > 0 ? (q4 / (hPossible / 4)) * 100 : 0
      };
    }).sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

    const strongestMonth = [...monthlySummaries].sort((a, b) => b.rate - a.rate)[0];
    const consistencyRate = totalPossible > 0 ? (totalCompletions / totalPossible) * 100 : 0;

    return { totalCompletions, totalPossible, monthlySummaries, topHabits: habitPerformance.slice(0, 6), maxStreak, strongestMonth, consistencyRate };
  }, [completions, habits, currentYear]);

  const isDayFullyCompleted = (day: number) => {
    if (habits.length === 0) return false;
    const dayStats = dailyStats.find(s => s.day === day);
    return dayStats?.count === habits.length;
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Explicitly clear states for immediate feedback
      setSession(null);
      setGuestMode(false);
      setHabits([]);
      setCompletions({});
      toast.success('Logged out successfully');
    } catch (err: any) {
      console.error('Logout error:', err);
      // Fallback: Clear local state anyway so the user can at least "log out" locally
      setSession(null);
      setGuestMode(false);
      setHabits([]);
      setCompletions({});
      toast.error('Session cleared locally');
    } finally {
      setLoading(false);
    }
  };

  if (!session && !guestMode) {
    return (
      <>
        <Toaster position="top-center" reverseOrder={false} />
        <AuthForm onContinueAsGuest={handleContinueAsGuest} />
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
    <div className="min-h-screen bg-[#e5e5e5] p-2 sm:p-4 font-sans text-[#444] relative overflow-x-hidden w-full max-w-full">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="max-w-full mx-auto bg-white border-[2px] sm:border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-2 sm:p-4 space-y-4 min-h-[calc(100vh-2rem)]">

        {/* TOP ROW: Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3 border border-stone-200 p-3 bg-white flex flex-col gap-2 h-full justify-between relative min-h-[160px]">
            <div ref={settingsRef}>
              {view === 'monthly' ? (
                <div className="flex items-center justify-between bg-white border border-stone-300 px-2 py-1">
                  <button onClick={() => navigateMonth('prev')} className="hover:text-black active:scale-95 transition-transform"><ChevronLeft size={16} /></button>
                  <span className="font-bold uppercase tracking-widest text-sm select-none">{MONTHS[currentMonthIndex]} {currentYear}</span>
                  <button onClick={() => navigateMonth('next')} className="hover:text-black active:scale-95 transition-transform"><ChevronRight size={16} /></button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white border border-stone-300 px-2 py-1">
                  <button onClick={() => setCurrentYear(prev => prev - 1)} className="hover:text-black active:scale-95 transition-transform"><ChevronLeft size={16} /></button>
                  <span className="font-bold uppercase tracking-widest text-sm select-none">{currentYear} Dashboard</span>
                  <button onClick={() => setCurrentYear(prev => prev + 1)} className="hover:text-black active:scale-95 transition-transform"><ChevronRight size={16} /></button>
                </div>
              )}

              <div className="mt-2 flex items-center justify-start gap-2 flex-wrap">
                <button
                  onClick={() => setView(view === 'monthly' ? 'dashboard' : 'monthly')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black text-[10px] font-black uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-black text-white shadow-none translate-y-0.5' : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'}`}
                >
                  {view === 'monthly' ? <LayoutDashboard size={12} /> : <Calendar size={12} />}
                  {view === 'monthly' ? 'Dashboard' : 'Monthly'}
                </button>

                <button
                  onClick={goToToday}
                  className="flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black text-[10px] font-black uppercase tracking-widest bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  <Clock size={12} />
                  Today
                </button>

                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={`p-1.5 rounded-full border border-stone-200 transition-colors ${settingsOpen ? 'bg-stone-100 text-stone-900' : 'text-stone-300 hover:text-stone-500'}`}
                  title="Theme Settings"
                >
                  <Settings size={14} className={settingsOpen ? 'animate-spin-slow' : ''} />
                </button>

                {guestMode ? (
                  <button
                    onClick={() => setGuestMode(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    <LogIn size={12} />
                    Sign In to Sync
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

              {settingsOpen && (
                <div className="absolute top-12 left-0 right-0 z-50 bg-white border border-stone-300 shadow-xl p-3 mx-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="text-[9px] font-bold uppercase text-stone-400 mb-2 border-b border-stone-100 pb-1">Theme Selection</div>
                  <div className="grid grid-cols-1 gap-1">
                    {THEMES.map((t) => (
                      <button
                        key={t.name}
                        onClick={() => { setTheme(t); setSettingsOpen(false); }}
                        className={`flex items-center gap-2 p-1.5 hover:bg-stone-50 rounded transition-colors text-left ${theme.name === t.name ? 'bg-stone-50 ring-1 ring-stone-200' : ''}`}
                      >
                        <div className="flex gap-0.5"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.primary }}></div><div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.secondary }}></div></div>
                        <span className="text-[10px] font-bold truncate">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {view === 'monthly' && (
              <div className="space-y-1 mt-2">
                <div className="flex justify-between items-center text-[10px] font-bold border-b border-stone-100 py-1"><span className="uppercase text-stone-400">Monthly Done</span><span className="bg-stone-50 px-2">{monthProgress.completed}</span></div>
                <div className="flex justify-between items-center text-[10px] font-bold border-b border-stone-100 py-1"><span className="uppercase text-stone-400">Goal Rate</span><span className="bg-stone-50 px-2">{monthProgress.percentage.toFixed(0)}%</span></div>
                {guestMode && <div className="text-[8px] text-emerald-600 font-bold uppercase mt-2 flex items-center gap-1 bg-emerald-50 px-2 py-1 border border-emerald-100"><User size={10} /> Guest Mode</div>}
              </div>
            )}
            {view === 'dashboard' && (
              <div className="space-y-1 mt-2">
                <div className="flex justify-between items-center text-[10px] font-bold border-b border-stone-100 py-1"><span className="uppercase text-stone-400">Annual Total</span><span className="bg-stone-50 px-2">{annualStats.totalCompletions}</span></div>
                <div className="flex justify-between items-center text-[10px] font-bold border-b border-stone-100 py-1"><span className="uppercase text-stone-400">Total Habits</span><span className="bg-stone-50 px-2">{habits.length}</span></div>
              </div>
            )}
          </div>

          <div className="md:col-span-6 border border-stone-200 p-2 bg-[#f9f9f9] min-h-[160px] h-[160px] relative overflow-hidden flex flex-col">
            <ResponsiveContainer width="100%" height="100%" minHeight={140}>
              <LineChart data={view === 'monthly' ? dailyStats : annualStats.monthlySummaries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
                <XAxis dataKey={view === 'monthly' ? "day" : "month"} hide />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey={view === 'monthly' ? "count" : "completed"} stroke={theme.primary} strokeWidth={2} dot={{ r: 2, fill: theme.primary }} animationDuration={400} isAnimationActive={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="md:col-span-3 border border-stone-200 bg-white relative flex flex-col overflow-hidden min-h-[160px]">
            <div className="text-white text-[9px] font-bold uppercase py-1 text-center tracking-widest" style={{ backgroundColor: theme.primary }}>{view === 'monthly' ? 'Monthly Success' : 'Annual Performance'}</div>
            <div className="flex-1 flex flex-col items-center justify-center p-2 relative">
              <div className="w-full h-24 sm:h-24 min-h-[96px] relative">
                <ResponsiveContainer width="100%" height="100%" minHeight={96}>
                  <PieChart>
                    <Pie
                      data={view === 'monthly'
                        ? [{ value: monthProgress.completed || 0.1 }, { value: monthProgress.remaining || 0 }]
                        : [{ value: annualStats.totalCompletions || 0.1 }, { value: Math.max(0, annualStats.totalPossible - annualStats.totalCompletions) }]
                      }
                      innerRadius="65%" outerRadius="85%" paddingAngle={2} dataKey="value" startAngle={90} endAngle={450}
                      isAnimationActive={true}
                    >
                      <Cell fill={theme.primary} /><Cell fill="#f0f0f0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 pointer-events-none">
                  <span className="text-xl font-bold leading-none">
                    {view === 'monthly'
                      ? monthProgress.percentage.toFixed(0)
                      : (annualStats.totalPossible > 0 ? (annualStats.totalCompletions / annualStats.totalPossible * 100).toFixed(0) : 0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {view === 'monthly' ? (
          /* MONTHLY VIEW CONTENT */
          <>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-9 border border-stone-200 bg-white flex flex-col overflow-hidden">
                <div className="text-stone-700 text-[10px] font-black uppercase py-1 tracking-widest grid grid-cols-5 md:grid-cols-9 transition-colors duration-500" style={{ backgroundColor: theme.secondary + '40' }}>
                  <span className="col-span-2 px-4 hidden md:block">Weekly Overview</span>
                  <div className="col-span-9 md:col-span-7 flex">{weeks.map((_, i) => (<span key={i} className="flex-1 text-center border-l border-stone-200/30">W{i + 1}</span>))}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-9 h-auto md:h-[180px] min-h-[180px]">
                  <div className="hidden md:col-span-2 border-r border-stone-100 md:flex flex-col text-[8px] font-bold uppercase text-stone-400">
                    <div className="flex-1 flex items-center px-2 border-b border-stone-50">Global Progress</div>
                    <div className="flex-1 flex items-center px-2 border-b border-stone-50">Score</div>
                    <div className="flex-1 flex items-center px-2">Weekly Activity</div>
                  </div>
                  <div className="col-span-9 md:col-span-7 flex overflow-x-auto min-h-[180px]">
                    {weeks.map((week, wIndex) => {
                      const weekTotal = week.reduce((acc, day) => {
                        let dc = 0; habits.forEach(h => { if (isCompleted(h.id, day)) dc++; }); return acc + dc;
                      }, 0);
                      const weekMax = week.length * (habits.length || 1);
                      const weekPerc = weekMax > 0 ? (weekTotal / weekMax) * 100 : 0;
                      return (
                        <div key={wIndex} className="flex-1 min-w-[80px] border-r border-stone-100 flex flex-col">
                          <div className="flex-1 flex flex-col items-center justify-center p-2 border-b border-stone-50">
                            <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden"><div className="h-full transition-all duration-300" style={{ width: `${weekPerc}%`, backgroundColor: theme.secondary }} /></div>
                            <span className="text-[9px] font-bold mt-1">{weekPerc.toFixed(0)}%</span>
                          </div>
                          <div className="flex-1 flex items-center justify-center border-b border-stone-50 py-1"><span className="text-[10px] font-bold">{weekTotal}/{weekMax}</span></div>
                          <div className="flex-1 p-2 flex items-end justify-between gap-0.5 h-12 md:h-auto">
                            {week.map(day => {
                              let dc = 0; habits.forEach(h => { if (isCompleted(h.id, day)) dc++; });
                              const hRatio = dc / (habits.length || 1);
                              const isAllDone = habits.length > 0 && dc === habits.length;
                              return <div key={day} className="flex-1" style={{ height: `${Math.max(2, hRatio * 100)}%`, backgroundColor: isAllDone ? theme.primary : theme.secondary }} />;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="md:col-span-3 border border-stone-200 bg-white flex flex-col overflow-hidden min-h-[180px]">
                <div className="text-stone-700 text-[9px] font-bold uppercase py-1 text-center tracking-widest" style={{ backgroundColor: theme.primary + '30' }}>Top 10 This Month</div>
                <div className="p-2 space-y-1.5 flex-1 overflow-y-auto overflow-x-hidden min-h-[150px]">
                  {topHabitsThisMonth.map((h, i) => {
                    const stats = h.stats;
                    const p = h.percentage;
                    return (
                      <div key={h.id} className="flex items-center justify-between text-[9px] font-bold animate-in fade-in slide-in-from-right-1 py-0.5">
                        <div className="flex gap-2 items-center"><span className="text-stone-300 w-3">{i + 1}</span><span className="truncate w-24 sm:w-32 md:w-24">{h.name || 'Untitled'}</span></div>
                        <div className="flex items-center gap-2">
                          <span className="text-stone-400 font-mono">{stats.completed}d</span>
                          <div className="w-8 h-1 bg-stone-100 rounded-full overflow-hidden"><div className="h-full transition-all duration-500" style={{ width: `${p}%`, backgroundColor: theme.primary }} /></div>
                        </div>
                      </div>
                    );
                  })}
                  {topHabitsThisMonth.length === 0 && (
                    <div className="h-full flex items-center justify-center text-[10px] font-bold text-stone-300 uppercase italic">No logged activity</div>
                  )}
                </div>
              </div>
            </div>

            <div className="border border-stone-200 bg-white flex flex-col overflow-hidden relative w-full">
              <div className="overflow-x-auto w-full">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="text-[9px] font-bold uppercase tracking-widest text-stone-600" style={{ backgroundColor: theme.secondary + '40' }}>
                      <th className="p-2 border-r border-stone-200 text-left min-w-[150px] sm:min-w-[180px] sticky left-0 z-40" style={{ backgroundColor: theme.secondary + '40' }}>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-stone-700">Habits</span>
                          <button onClick={(e) => { e.preventDefault(); addHabit(); }} className="p-1 px-2 bg-white hover:bg-stone-100 rounded shadow-sm border border-stone-200 font-black flex items-center transition-all active:scale-95" style={{ color: theme.secondary }} title="Add new habit">
                            <Plus size={12} strokeWidth={4} />
                            <span className="text-[9px] ml-1">ADD</span>
                          </button>
                        </div>
                      </th>
                      <th className="p-1 border-r border-stone-200 w-12 text-center">Goal</th>
                      {weeks.map((week, i) => (<th key={i} colSpan={week.length} className="p-1 border-r border-stone-200 text-center">Week {i + 1}</th>))}
                      <th colSpan={3} className="p-1 text-center bg-[#f0f0f0] border-l border-stone-200">Metrics Summary</th>
                    </tr>
                    <tr className="bg-[#f9f2f2] text-[8px] font-bold uppercase text-stone-400">
                      <th className="p-1 border-r border-stone-200 sticky left-0 z-40 bg-[#f9f2f2]"></th><th className="p-1 border-r border-stone-200"></th>
                      {monthDates.map(day => {
                        const isToday = day === new Date().getDate() && currentMonthIndex === new Date().getMonth() && currentYear === new Date().getFullYear();
                        const isFull = isDayFullyCompleted(day);
                        return (
                          <th key={day}
                            className={`p-1 border-r border-stone-100 min-w-[28px] text-center transition-colors duration-300 ${isToday ? 'z-10 font-black' : ''}`}
                            style={{
                              backgroundColor: isToday ? theme.primary : (isFull ? theme.primary + '30' : undefined),
                              color: isToday ? 'white' : undefined
                            }}
                          >
                            <div className="flex flex-col">
                              <span>{DAYS_OF_WEEK_SHORT[new Date(currentYear, currentMonthIndex, day).getDay()][0]}</span>
                              <span className={`${isToday ? 'scale-110' : 'text-stone-600'}`}>{day}</span>
                            </div>
                          </th>
                        );
                      })}
                      <th className="p-1 border-l border-stone-200 bg-stone-100 min-w-[85px] text-center text-stone-600">Success %</th>
                      <th className="p-1 border-l border-stone-100 bg-stone-100 min-w-[50px] text-center text-stone-600">Done</th>
                      <th className="p-1 border-l border-stone-100 bg-stone-100 min-w-[50px] text-center text-stone-600">Miss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {habits.map((habit) => {
                      const habitStats = getHabitMonthStats(habit.id);
                      const perc = (habitStats.completed / habitStats.totalDays) * 100;
                      const isEditingName = editingHabitId === habit.id;
                      const isEditingGoal = editingGoalId === habit.id;
                      return (
                        <tr key={habit.id} className="hover:bg-stone-50 transition-colors group">
                          <td className="p-1.5 px-3 border-r border-stone-200 text-[10px] font-bold text-stone-600 flex items-center justify-between gap-2 sticky left-0 z-20 bg-white group-hover:bg-stone-50">
                            {isEditingName ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  ref={inputRef}
                                  type="text"
                                  value={habit.name}
                                  onChange={(e) => updateHabitNameState(habit.id, e.target.value)}
                                  onBlur={() => handleHabitBlur(habit)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleHabitBlur(habit); }}
                                  className="bg-transparent border-b-2 outline-none flex-1 text-[10px] font-black py-0.5 w-20"
                                  style={{ borderColor: theme.secondary }}
                                />
                                <button onClick={() => handleHabitBlur(habit)} style={{ color: theme.secondary }}><Save size={14} /></button>
                              </div>
                            ) : (
                              <span className="truncate flex-1 cursor-pointer hover:underline" onClick={() => setEditingHabitId(habit.id)} title="Click to rename">{habit.name || 'Untitled Habit'}</span>
                            )}
                            <div className={`flex items-center gap-1 transition-opacity ${isEditingName ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><button onClick={(e) => { e.stopPropagation(); removeHabit(habit.id); }} className="p-1 text-stone-300 hover:text-red-500 rounded transition-colors"><Trash2 size={12} /></button></div>
                          </td>
                          <td className="p-1 border-r border-stone-200 text-center text-[9px] font-bold text-stone-400 group-hover:bg-stone-100 transition-colors">
                            {isEditingGoal ? (
                              <input
                                ref={goalInputRef}
                                type="number"
                                min="0"
                                max="100"
                                value={habit.goal}
                                onChange={(e) => updateHabitGoalState(habit.id, e.target.value)}
                                onBlur={() => handleHabitBlur(habit)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleHabitBlur(habit); }}
                                className="w-full text-center bg-transparent border-b-2 outline-none font-black text-[9px]"
                                style={{ borderColor: theme.secondary }}
                              />
                            ) : (
                              <span
                                onClick={() => setEditingGoalId(habit.id)}
                                className="cursor-pointer hover:underline hover:text-stone-600 transition-colors"
                              >
                                {habit.goal}%
                              </span>
                            )}
                          </td>
                          {monthDates.map(day => {
                            const done = isCompleted(habit.id, day);
                            const isToday = day === new Date().getDate() && currentMonthIndex === new Date().getMonth() && currentYear === new Date().getFullYear();
                            const isFull = isDayFullyCompleted(day);
                            return (
                              <td key={day}
                                className={`p-0.5 border-r border-stone-50 transition-colors duration-300`}
                                style={{ backgroundColor: isToday ? theme.primary + '15' : (isFull ? theme.primary + '20' : undefined) }}
                              >
                                <button onClick={() => toggleCompletion(habit.id, day)} className={`w-full aspect-square flex items-center justify-center border transition-all duration-200 ${done ? 'text-white shadow-sm' : 'bg-white border-stone-200 shadow-none'} hover:border-black`} style={{ backgroundColor: done ? theme.secondary : undefined, borderColor: done ? theme.secondary : undefined }}>{done && <Check size={10} strokeWidth={4} />}</button>
                              </td>
                            );
                          })}

                          <td className="p-1 px-3 border-l border-stone-200 bg-[#fcfcfc] text-center">
                            <div className="flex items-center justify-center gap-1.5 h-full">
                              <span className="text-[10px] font-black w-6 text-right" style={{ color: theme.secondary }}>{perc.toFixed(0)}%</span>
                              <div className="hidden sm:flex w-12 bg-stone-100 h-2 gap-0.5 rounded-sm overflow-hidden">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <div key={i} className={`h-full flex-1 transition-all duration-500 ${perc >= (i + 1) * 20 ? '' : 'bg-transparent'}`} style={{ backgroundColor: perc >= (i + 1) * 20 ? theme.secondary : undefined }} />
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="p-1 px-3 border-l border-stone-100 bg-[#fcfcfc] text-center">
                            <span className="text-[11px] font-black leading-none" style={{ color: theme.primary }}>{habitStats.completed}</span>
                          </td>
                          <td className="p-1 px-3 border-l border-stone-100 bg-[#fcfcfc] text-center">
                            <span className="text-[11px] font-black leading-none text-rose-400">{habitStats.missed}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* DASHBOARD VIEW CONTENT */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Trophy size={48} className="text-black" />
                </div>
                <span className="text-[11px] font-black uppercase text-stone-400 tracking-[0.2em] mb-3 border-b border-stone-100 pb-1 flex items-center gap-2">
                  <Zap size={14} className="text-amber-500" /> {currentYear} Scorecard
                </span>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[9px] font-black uppercase text-stone-500">Completions</span>
                      <span className="text-2xl font-black leading-none" style={{ color: theme.primary }}>{annualStats.totalCompletions}</span>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-1000" style={{ backgroundColor: theme.primary, width: `${annualStats.consistencyRate}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase text-stone-400">Consistency</span>
                      <span className="text-lg font-black">{annualStats.consistencyRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase text-stone-400">Max Streak</span>
                      <span className="text-lg font-black text-amber-600">{annualStats.maxStreak} Days</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase text-stone-400">Strongest Month</span>
                      <span className="text-[10px] font-black px-2 py-0.5 bg-stone-100 rounded" style={{ color: theme.primary }}>
                        {annualStats.strongestMonth?.month} ({annualStats.strongestMonth?.rate.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-3 p-4 border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col min-h-[220px]">
                <div className="flex items-center gap-2 mb-3 border-b border-stone-100 pb-2">
                  <div className="p-1 bg-amber-100 text-amber-600 rounded"><Target size={14} /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Yearly Identity: Habit Outcomes</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 overflow-y-auto">
                  {annualStats.topHabits.length > 0 ? annualStats.topHabits.map((h, i) => (
                    <div key={h.id} className="flex flex-col relative group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black truncate max-w-[120px] uppercase">{h.name || 'Untitled'}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-stone-300">{h.startRate.toFixed(0)}%</span>
                          <ArrowRight size={8} className="text-stone-300" />
                          <span className="text-[10px] font-black" style={{ color: theme.primary }}>{h.endRate.toFixed(0)}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <div className={`px-1.5 py-0.5 rounded-sm border text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 ${h.badge === "Most Consistent" ? "bg-amber-50 border-amber-200 text-amber-700" :
                          h.badge === "Highest Growth" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                            "bg-stone-100 border-stone-200 text-stone-500"
                          }`}>
                          <Award size={8} className={h.badge === "Most Consistent" ? "text-amber-500" : "text-current"} />
                          {h.badge}
                        </div>
                      </div>

                      <div className="w-full bg-stone-100 h-2 flex gap-0.5 rounded-sm overflow-hidden">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <div key={j} className="h-full flex-1 transition-all duration-500" style={{ backgroundColor: h.rate >= (j + 1) * 10 ? theme.primary : '#f0f0f0' }} />
                        ))}
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-3 text-center text-stone-300 py-4 italic text-sm">No significant habit outcomes for this year yet.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {MONTHS.map((m, idx) => {
                const monthSummary = annualStats.monthlySummaries[idx];
                const rate = monthSummary.rate;
                const signal = monthSummary.signal;
                const delta = monthSummary.delta;

                return (
                  <div key={m} className="border-[2px] border-stone-300 p-3 bg-white hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] transition-all group flex flex-col h-[200px] min-h-[200px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-black uppercase tracking-widest">{m}</span>
                      <div className="flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded">
                        {delta !== 0 && (
                          <span className={`flex items-center ${delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {delta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            <span className="text-[8px] font-black ml-0.5">{Math.abs(delta).toFixed(0)}%</span>
                          </span>
                        )}
                        <span className="text-[10px] font-bold" style={{ color: rate > 50 ? theme.primary : '#ec4899' }}>{rate.toFixed(0)}%</span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center min-h-[80px]">
                      <div className="flex items-center gap-2 mb-1 h-8">
                        <div className="flex-1 h-8">
                          <ResponsiveContainer width="100%" height="100%" minHeight={32}>
                            <BarChart data={[{ v: rate }]}>
                              <Bar dataKey="v" fill={theme.primary} radius={[2, 2, 0, 0]} fillOpacity={0.4} isAnimationActive={true} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {signal && (
                        <div className="mb-2 px-1.5 py-0.5 bg-stone-50 border border-stone-100 rounded text-[8px] font-black uppercase text-stone-500 italic text-center tracking-tight">
                          "{signal}"
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[9px] font-bold border-t border-stone-50 pt-2">
                        <span className="text-stone-300 uppercase">Completed</span>
                        <span className="text-stone-700">{monthSummary.completed}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setCurrentMonthIndex(idx); setView('monthly'); }}
                      className="mt-3 w-full py-1.5 bg-stone-50 border border-stone-200 text-[8px] font-black uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all"
                    >
                      Inspect Month
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .animate-spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { height: 8px; width: 8px; }
        ::-webkit-scrollbar-thumb { background: #000; border: 2px solid #fff; border-radius: 0; }
        ::-webkit-scrollbar-track { background: #eee; }
        
        @media (max-width: 640px) {
          .recharts-responsive-container { min-height: 120px; }
        }
      `}</style>
    </div>
  );
};

export default App;
