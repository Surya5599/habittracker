import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import i18n from './i18n';
import { X, Search, Key, ChevronLeft, ChevronRight, Sparkles, BarChart2, Activity, ArrowUp, ArrowDown, Minus, Angry, Frown, Meh, Smile, Laugh, SlidersHorizontal, Check, Plus, BookOpen, ClipboardList } from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabase';
import './i18n';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { AuthForm } from './components/AuthForm';
import { UpdatePasswordForm } from './components/UpdatePasswordForm';
import { Header } from './components/Header';
import { MonthlyView } from './components/MonthlyView';
import { CircularProgress } from './components/CircularProgress';
import { DashboardView } from './components/DashboardView';
import { WeeklyView } from './components/WeeklyView';
import { TasksView } from './components/TasksView';
import { ListsView } from './components/ListsView';
import { useHabits } from './hooks/useHabits';
import { useTheme } from './hooks/useTheme';
import { useHabitStats } from './hooks/useHabitStats';
import { useLists } from './hooks/useLists';
import { Habit, DailyNote, MonthlyGoals, MonthlyGoal, DayData } from './types';
import { BottomNav } from './components/BottomNav';
import { DailyCard } from './components/DailyCard';
import { generateUUID } from './utils/uuid';
import { getInactiveHabitsForDate, isHabitActiveOnDate, isHabitManuallyInactive } from './utils/habitActivity';
import { exportUserDataCsv } from './utils/exportUserDataCsv';
import { isCompleted as checkCompleted } from './utils/stats';
import { OnboardingModal } from './components/OnboardingModal';
import { FeatureAnnouncementModal } from './components/FeatureAnnouncementModal';
import { LoadingScreen } from './components/LoadingScreen';
import { FeedbackModal } from './components/FeedbackModal';
import { StreakModal, buildAchievements } from './components/StreakModal';
import { SearchModal } from './components/SearchModal';
import { JournalPdfPreviewModal } from './components/JournalPdfPreviewModal';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { LandingPage } from './pages/LandingPage';
import { isBenignAuthError } from './utils/authErrors';
import { FormattedText } from './components/FormattedText';
import { buildAnnualStory, buildWeeklyStory, buildMonthlyStory } from './utils/storyGenerator';
import { DesignPreview, JournalPreview, PdfExportPreview, GridPreview, TasksPreview } from './components/WhatsNewPreviews';

const ADMIN_EMAILS = ((import.meta.env.VITE_ADMIN_EMAILS as string | undefined) || 'admin@habicard.com,knowheredeveloper@gmail.com')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);
const WHATS_NEW_VERSION = '2026_05';
const WHATS_NEW_SEEN_KEY = 'habit_whats_new_seen_version';
const LEGACY_DEFAULT_HABIT_NAMES = new Set(['meditation', 'exercise', 'drink 2l water', 'reading', 'journaling']);

const DEMO_HABITS: Habit[] = [
  { id: '1', name: 'Morning Meditation', type: 'daily', goal: 7, color: '#C19A9A' },
  { id: '2', name: 'Deep Work', type: 'daily', goal: 5, color: '#9AC1A0' },
  { id: '3', name: 'Daily Reading', type: 'daily', goal: 7, color: '#9AB4C1' },
  { id: '4', name: 'Physical Identity', type: 'daily', goal: 4, color: '#B09AC1' },
];

const DEMO_ANNUAL_STATS = {
  totalCompletions: 842,
  totalPossible: 1460,
  consistencyRate: 57.6,
  maxStreak: 42,
  activeDays: 215,
  activeHabitsCount: 4,
  momentum: 'ascending',
  storyVariant: 'momentum',
  topHabits: [
    { name: 'Deep Work', completed: 180, percentage: 85, badge: 'Identity Driver' },
    { name: 'Morning Meditation', completed: 150, percentage: 70, badge: 'Highest Growth' }
  ],
  strongestMonth: { month: 'October', rate: 82 },
  monthlySummaries: Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    rate: [45, 52, 48, 60, 65, 58, 72, 75, 78, 82, 79, 74][i],
    signal: i === 9 ? 'Best focus month' : (i === 6 ? 'Rebound month' : ''),
    delta: [0, 7, -4, 12, 5, -7, 14, 3, 3, 4, -3, -5][i],
    maxStreak: [12, 14, 10, 18, 22, 15, 25, 28, 30, 42, 35, 28][i],
    completed: [80, 95, 85, 110, 120, 105, 130, 140, 145, 160, 155, 140][i],
    topHabit: { name: 'Deep Work' }
  }))
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const queryParams = new URLSearchParams(location.search);
  const impersonateId = queryParams.get('impersonate');
  const [session, setSession] = useState<any>(null);

  const isAdmin = !!session?.user?.email && ADMIN_EMAILS.includes(session.user.email.toLowerCase());
  const effectiveUserId = (isAdmin && impersonateId) ? impersonateId : session?.user?.id;
  const isImpersonating = !!(isAdmin && impersonateId);
  const [guestMode, setGuestMode] = useState(() => {
    return localStorage.getItem('habit_guest_mode') === 'true';
  });
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false);
  const [defaultView, setDefaultView] = useState<'monthly' | 'dashboard' | 'weekly'>(() => {
    return (localStorage.getItem('habit_default_view') as 'monthly' | 'dashboard' | 'weekly') || 'weekly';
  });
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('habit_language') || 'en';
  });
  const [startOfWeek, setStartOfWeek] = useState<'monday' | 'sunday'>(() => {
    return (localStorage.getItem('habit_start_of_week') as 'monday' | 'sunday') || 'monday';
  });
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('habit_color_mode');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [cardStyle, setCardStyle] = useState<'compact' | 'large'>(() => {
    const saved = localStorage.getItem('habit_card_style');
    return saved === 'compact' ? 'compact' : 'large';
  });

  // Sync i18n with state
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    localStorage.setItem('habit_color_mode', colorMode);
    document.documentElement.setAttribute('data-color-mode', colorMode);
    document.documentElement.style.colorScheme = colorMode;
  }, [colorMode]);

  useEffect(() => {
    localStorage.setItem('habit_card_style', cardStyle);
  }, [cardStyle]);
  const [view, setView] = useState<'monthly' | 'dashboard' | 'weekly'>(defaultView);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isListsOpen, setIsListsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWhatsNewModal, setShowWhatsNewModal] = useState(false);
  const [hasUnseenWhatsNew, setHasUnseenWhatsNew] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isJournalExportOpen, setIsJournalExportOpen] = useState(false);
  type PanelContent = 'stats' | 'journal' | 'tasks' | null;
  const [panelTop, setPanelTop] = useState<PanelContent>(() => {
    const s = localStorage.getItem('workspace_panel_top');
    return (s === 'stats' || s === 'journal' || s === 'tasks') ? s : 'stats';
  });
  const [panelBottom, setPanelBottom] = useState<PanelContent>(() => {
    const s = localStorage.getItem('workspace_panel_bottom');
    return (s === 'stats' || s === 'journal' || s === 'tasks') ? s : null;
  });
  const [configuringSlot, setConfiguringSlot] = useState<'top' | 'bottom' | null>(null);
  const statsOpen = panelTop === 'stats' || panelBottom === 'stats';
  const rightPanelOpen = panelTop !== null || panelBottom !== null;
  const togglePanelContent = (content: 'stats' | 'journal' | 'tasks') => {
    if (panelTop === content) { setPanelTop(null); return; }
    if (panelBottom === content) { setPanelBottom(null); return; }
    if (panelTop === null) { setPanelTop(content); return; }
    if (panelBottom === null) { setPanelBottom(content); return; }
    setPanelTop(content);
  };
  const [chartType, setChartType] = useState<'area' | 'bar'>(() => (localStorage.getItem('habit_chart_type') as 'area' | 'bar') || 'area');
  const [sortMode, setSortMode] = useState<'default' | 'name' | 'color' | 'completion'>(() => (localStorage.getItem('habit_sort_mode') as 'default' | 'name' | 'color' | 'completion') || 'default');
  useEffect(() => { localStorage.setItem('workspace_panel_top', panelTop ?? ''); }, [panelTop]);
  useEffect(() => { localStorage.setItem('workspace_panel_bottom', panelBottom ?? ''); }, [panelBottom]);
  useEffect(() => { localStorage.setItem('habit_chart_type', chartType); }, [chartType]);
  useEffect(() => { localStorage.setItem('habit_sort_mode', sortMode); }, [sortMode]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  useEffect(() => {
    // Check for latest feature announcement
    const seenWhatsNewVersion = localStorage.getItem(WHATS_NEW_SEEN_KEY);
    const hasSeenLatestWhatsNew = seenWhatsNewVersion === WHATS_NEW_VERSION;

    // Determine if onboarding is completed based on current mode
    const isGuestOnboardingDone = localStorage.getItem('habit_onboarding_completed') === 'true';
    const isUserOnboardingDone = session?.user?.user_metadata?.onboarding_completed;
    const hasCompletedOnboarding = !!((guestMode && isGuestOnboardingDone) || (session?.user && isUserOnboardingDone));

    setHasUnseenWhatsNew(!hasSeenLatestWhatsNew);

    if (!hasSeenLatestWhatsNew && !showOnboarding && hasCompletedOnboarding) {
      setShowWhatsNewModal(true);
    }

    // Handle Extension Login
    // Handle Extension Login
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('source') === 'extension' && session) {
      // Send session to extension
      window.postMessage({ type: 'HABIT_EXTENSION_LOGIN', session }, '*');
    }
  }, [showOnboarding, guestMode, session?.user?.id]);

  const markWhatsNewAsSeen = () => {
    localStorage.setItem(WHATS_NEW_SEEN_KEY, WHATS_NEW_VERSION);
    setHasUnseenWhatsNew(false);
  };

  const handleWhatsNewClose = () => {
    setShowWhatsNewModal(false);
  };

  const handleOpenWhatsNew = () => {
    setShowWhatsNewModal(true);
  };

  const handleOpenTutorial = () => {
    setShowOnboarding(true);
  };

  const handleWhatsNewFinish = () => {
    markWhatsNewAsSeen();
    setView('weekly');
    setShowWhatsNewModal(false);
  };

  const whatsNewSlides = useMemo(() => ([
    {
      id: 'v2-redesign',
      title: 'Fresh Neo-Brutalist Design',
      description: 'The entire app has been redesigned with a bold, clean neo-brutalist style.',
      bullets: [
        'Every card, modal, and panel has been rebuilt from scratch.',
        'Stronger typography, sharper borders, and offset shadows throughout.',
        'Colored bullet dots next to each habit match their habit color.',
      ],
      image: <DesignPreview />,
    },
    {
      id: 'journal-multi-entry',
      title: 'Multiple Journal Entries Per Day',
      description: 'Add as many journal entries as you want in a single day — just like the mobile app.',
      bullets: [
        'Each entry has its own mood icon and timestamp.',
        'Tap the pencil to edit or the trash to delete any entry.',
        'Click "+ Add entry" at the bottom of the journal card to start.',
      ],
      image: <JournalPreview />,
    },
    {
      id: 'journal-pdf-export',
      title: 'Journal PDF Export',
      description: 'Export your entire journal as a beautifully designed PDF — with a live preview before you download.',
      bullets: [
        'Choose Serif, Sans-serif, or Monospace font.',
        'Pick Multi-page (compact) or Full-page (one entry per page) layout.',
        'Flip through entries page by page in the preview before exporting.',
      ],
      image: <PdfExportPreview />,
    },
    {
      id: 'monthly-grid',
      title: 'Monthly Grid Improvements',
      description: 'The monthly habit grid is now cleaner and easier to read.',
      bullets: [
        'Days where a habit is not scheduled show a greyed "/" instead of blank space.',
        'All rows are a consistent height for a uniform look.',
        'Stats are shown by default on the right panel.',
      ],
      image: <GridPreview />,
    },
    {
      id: 'tasks-view',
      title: 'Tasks Panel',
      description: 'Manage daily tasks directly from your habit card.',
      bullets: [
        'Add, check off, and delete tasks for any day.',
        'Tasks live alongside habits and journal in the same card.',
        'Switch between Habits, Journal, and Tasks using the status bar.',
      ],
      image: <TasksPreview />,
    },
  ]), []);

  const updateDefaultView = async (newView: 'monthly' | 'dashboard' | 'weekly') => {
    setDefaultView(newView);
    localStorage.setItem('habit_default_view', newView);

    if (session?.user?.id && !isImpersonating) {
      try {
        await supabase.auth.updateUser({
          data: { default_view: newView }
        });
      } catch (err) {
        console.error('Failed to save default view setting:', err);
      }
    }
  };

  const updateLanguage = async (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem('habit_language', newLang);

    if (session?.user?.id && !isImpersonating) {
      try {
        await supabase.auth.updateUser({
          data: { language: newLang }
        });
      } catch (err) {
        console.error('Failed to save language setting:', err);
      }
    }
  };

  const updateStartOfWeek = async (newStart: 'monday' | 'sunday') => {
    setStartOfWeek(newStart);
    localStorage.setItem('habit_start_of_week', newStart);

    if (session?.user?.id && !isImpersonating) {
      try {
        await supabase.auth.updateUser({
          data: { start_of_week: newStart }
        });
      } catch (err) {
        console.error('Failed to save start of week setting:', err);
      }
    }
  };

  const updateCardStyle = async (newStyle: 'compact' | 'large') => {
    setCardStyle(newStyle);
    localStorage.setItem('habit_card_style', newStyle);

    if (session?.user?.id && !isImpersonating) {
      try {
        await supabase.auth.updateUser({
          data: { card_style: newStyle }
        });
      } catch (err) {
        console.error('Failed to save card style setting:', err);
      }
    }
  };

  useEffect(() => {
    if (session?.user?.user_metadata?.default_view) {
      const remoteView = session.user.user_metadata.default_view;
      if (['monthly', 'dashboard', 'weekly'].includes(remoteView)) {
        setDefaultView(remoteView);
        localStorage.setItem('habit_default_view', remoteView);
      }
    }
    if (session?.user?.user_metadata?.language) {
      const remoteLang = session.user.user_metadata.language;
      setLanguage(remoteLang);
      localStorage.setItem('habit_language', remoteLang);
    }
    if (session?.user?.user_metadata?.start_of_week) {
      const remoteStart = session.user.user_metadata.start_of_week;
      if (['monday', 'sunday'].includes(remoteStart)) {
        setStartOfWeek(remoteStart);
        localStorage.setItem('habit_start_of_week', remoteStart);
      }
    }
    if (session?.user?.user_metadata?.card_style) {
      const remoteCardStyle = session.user.user_metadata.card_style;
      if (['compact', 'large'].includes(remoteCardStyle)) {
        setCardStyle(remoteCardStyle);
        localStorage.setItem('habit_card_style', remoteCardStyle);
      }
    }
  }, [session?.user?.id]);

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isResolutionsModalOpen, setIsResolutionsModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [hasUnreadFeedback, setHasUnreadFeedback] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [selectedDateForCard, setSelectedDateForCard] = useState<Date | null>(null);

  // Check for unread feedback replies
  useEffect(() => {
    const checkUnreadFeedback = async () => {
      if (!session?.user?.id) return;
      try {
        const { data, error } = await supabase
          .from('feedback_replies')
          .select('created_at')
          .eq('is_admin_reply', true)
          // We can't easily filter by "my feedback threads" in one simple query without a join or knowing feedback IDs.
          // RLS usually handles "replies to my feedback" security, but for a global "unread" check:
          // We need replies to feedback where user_id is me.
          // Let's rely on RLS allowing us to see replies to our own feedback.
          // Actually, feedback_replies usually has user_id of the replier.
          // If admin replies, user_id is admin's id.
          // So we need to join feedback table.
          // For simplicity & performance, let's just fetch the latest reply that is_admin_reply = true
          // AND belongs to one of my feedback threads.
          // If RLS is set up correctly, I should only be able to Select replies that belong to my feedback?
          // Let's assume RLS allows reading replies to own feedback.
          .order('created_at', { ascending: false })
          .limit(1);

        // Ideally, we'd filter: feedback.user_id = me. 
        // But Supabase JS simpler syntax:
        // .eq('feedback.user_id', session.user.id) ? No, needs join.
        // Let's try to filter in memory if result is small, or use a better query.
        // Better: fetch my feedback IDs first? No, too many.
        // Let's rely on valid RLS for now: "Users can view replies to their own feedback".

        // Actually, refined query: 
        // We need check if there's any reply newer than local timestamp.

        if (data && data.length > 0) {
          const latestReplyTime = new Date(data[0].created_at).getTime();
          const lastReadTime = parseInt(localStorage.getItem('habit_feedback_last_read') || '0');
          if (latestReplyTime > lastReadTime) {
            setHasUnreadFeedback(true);
          }
        }
      } catch (err) {
        console.error('Error checking unread feedback:', err);
      }
    };

    if (session?.user?.id && !isImpersonating) {
      checkUnreadFeedback();
      const channel = supabase
        .channel('feedback-unread-badge')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback_replies' }, checkUnreadFeedback)
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session?.user?.id, isImpersonating]);

  const handleOpenFeedback = () => {
    setIsFeedbackModalOpen(true);
    setHasUnreadFeedback(false);
    localStorage.setItem('habit_feedback_last_read', Date.now().toString());
  };

  const handleContinueAsGuest = () => {
    localStorage.setItem('habit_guest_mode', 'true');
    setGuestMode(true);
  };
  const [cardOpenFlipped, setCardOpenFlipped] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const goalInputRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState<DailyNote>({});
  const [notesLoaded, setNotesLoaded] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoals>(() => {
    const stored = JSON.parse(localStorage.getItem('habit_monthly_goals') || '{}');
    // Migration: Convert string[] to MonthlyGoal[]
    const migrated: MonthlyGoals = {};
    Object.entries(stored).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        migrated[key] = val.map((item: any) => {
          if (typeof item === 'string') {
            return { id: generateUUID(), text: item, completed: false };
          }
          return item as MonthlyGoal;
        });
      }
    });
    return migrated;
  });

  const updateMonthlyGoals = async (monthKey: string, goals: MonthlyGoal[]) => {
    setMonthlyGoals(prev => {
      const updated = { ...prev, [monthKey]: goals };
      localStorage.setItem('habit_monthly_goals', JSON.stringify(updated));
      return updated;
    });

    if (effectiveUserId) {
      try {
        await supabase
          .from('monthly_goals')
          .upsert({
            user_id: effectiveUserId,
            month_key: monthKey,
            goals: goals // jsonb
          }, {
            onConflict: 'user_id,month_key'
          });
      } catch (err) {
        console.error('Failed to sync monthly goals:', err);
      }
    }
  };

  const { theme, setTheme, THEMES } = useTheme();
  const {
    habits,
    completions,
    loading,
    syncError,
    retryGuestSync,
    dismissSyncError,
    toggleCompletion: baseToggleCompletion,
    addHabit,
    updateHabit,
    removeHabit,
    reorderHabits,
    toggleArchiveHabit,
    setLoading
  } = useHabits(session, guestMode, isImpersonating ? effectiveUserId : undefined);

  const daysInMonth = useMemo(() => new Date(currentYear, currentMonthIndex + 1, 0).getDate(), [currentYear, currentMonthIndex]);
  const monthDates = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

    const {
      dailyStats,
      previousDailyStats,
      weeklyStats,
      previousWeeklyStats,
      weekProgress,
      prevWeekProgress,
      weekDelta,
      monthDelta,
      allTimeBestWeek,
      monthProgress,
      topHabitsThisMonth,
      annualStats,
      previousAnnualMonthlySummaries,
      annualDelta
    } = useHabitStats(
    habits,
    completions,
    notes,
    currentMonthIndex,
    currentYear,
    daysInMonth,
    monthDates,
    weekOffset,
    startOfWeek
  );

  const { lists, items: listItems, loading: listsLoading, createList, updateList, deleteList, addItem, updateItem, deleteItem, getItemsForList } = useLists(session, guestMode);

  const weekRange = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    // Calculate difference to start of week
    // If startOfWeek is 'monday': Monday(1) is start. Diff = day - 1. (If Sunday(0), diff = -6)
    // If startOfWeek is 'sunday': Sunday(0) is start. Diff = day - 0.

    let diff;
    if (startOfWeek === 'monday') {
      diff = today.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7);
    } else {
      diff = today.getDate() - day + (weekOffset * 7);
    }

    const startOfCurrentWeek = new Date(today.getFullYear(), today.getMonth(), diff);
    const endOfCurrentWeek = new Date(startOfCurrentWeek);
    endOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 6);

    const startYear = startOfCurrentWeek.getFullYear();
    const endYear = endOfCurrentWeek.getFullYear();

    if (startYear === endYear) {
      const fromStr = startOfCurrentWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const toStr = endOfCurrentWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${fromStr} - ${toStr}, ${startYear}`;
    } else {
      const fromStr = startOfCurrentWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const toStr = endOfCurrentWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${fromStr} - ${toStr}`;
    }
  }, [weekOffset, startOfWeek]);

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

  // Load notes and monthly goals from database or localStorage
  useEffect(() => {
    const loadData = async () => {
      if (effectiveUserId) {
        // 1. Load Daily Notes
        const { data: notesData, error: notesError } = await supabase
          .from('daily_notes')
          .select('date_key, content')
          .eq('user_id', effectiveUserId);

        if (!notesError && notesData) {
          const notesObj: DailyNote = {};
          notesData.forEach(note => {
            try {
              const parsed = JSON.parse(note.content);
              if (Array.isArray(parsed)) {
                // Migration: Handle old Task[] format
                notesObj[note.date_key] = { tasks: parsed, mood: undefined, journal: undefined };
              } else if (parsed && typeof parsed === 'object') {
                // Handle new DayData format or other object format?
                // Check if it has 'tasks' property
                if ('tasks' in parsed) {
                  notesObj[note.date_key] = parsed as DayData;
                } else {
                  // Fallback or other legacy object? 
                  // Assuming if object but not array, it might be the new format or something else.
                  // Be safe:
                  notesObj[note.date_key] = { tasks: [], ...parsed };
                }
              } else {
                notesObj[note.date_key] = { tasks: [{ id: generateUUID(), text: String(parsed), completed: false }] };
              }
            } catch {
              if (note.content) {
                notesObj[note.date_key] = { tasks: [{ id: generateUUID(), text: note.content, completed: false }] };
              }
            }
          });
          setNotes(notesObj);
        }

        // 2. Load Monthly Goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('monthly_goals')
          .select('month_key, goals')
          .eq('user_id', effectiveUserId);

        if (!goalsError && goalsData) {
          const goalsObj: MonthlyGoals = {};
          goalsData.forEach(row => {
            if (row.goals && Array.isArray(row.goals)) {
              goalsObj[row.month_key] = row.goals;
            }
          });

          // If DB is empty but we have local goals, sync them up (migration)
          if (goalsData.length === 0) {
            const localGoals = JSON.parse(localStorage.getItem('habit_monthly_goals') || '{}');
            if (Object.keys(localGoals).length > 0) {
              // We have local data but no DB data. Let's start with local and sync it up?
              // For now, let's just use local data in state, and next update will save it.
              // Better: Use local data, but don't overwrite if DB had *some* data (handled by length check above).
              setMonthlyGoals(prev => {
                return prev;
              });
            } else {
              setMonthlyGoals(goalsObj);
            }
          } else {
            setMonthlyGoals(goalsObj);
          }
        }




      } else {
        // Load from localStorage for guest users
        // Notes
        const localNotes = JSON.parse(localStorage.getItem('habit_daily_notes') || '{}');
        const migrationsNotes: DailyNote = {};
        Object.entries(localNotes).forEach(([key, val]) => {
          if (Array.isArray(val)) {
            migrationsNotes[key] = { tasks: val as any[] };
          } else if (typeof val === 'string') {
            migrationsNotes[key] = { tasks: [{ id: generateUUID(), text: val, completed: false }] };
          } else {
            // Assume it fits DayData or is close enough
            migrationsNotes[key] = { tasks: [], ...(val as any) };
          }
        });
        setNotes(migrationsNotes);

        // Goals
        const localGoals = JSON.parse(localStorage.getItem('habit_monthly_goals') || '{}');
        const migratedGoals: MonthlyGoals = {};
        Object.entries(localGoals).forEach(([key, val]) => {
          if (Array.isArray(val)) {
            migratedGoals[key] = val.map((item: any) => {
              if (typeof item === 'string') return { id: generateUUID(), text: item, completed: false };
              return item;
            });
          }
        });
        setMonthlyGoals(migratedGoals);
      }
      setNotesLoaded(true);
    };
    loadData();
  }, [effectiveUserId]);

  useEffect(() => {
    if (session?.user) {
      if (!session.user.user_metadata?.onboarding_completed) {
        setShowOnboarding(true);
      }
    } else if (guestMode) {
      const localCompleted = localStorage.getItem('habit_onboarding_completed');
      if (localCompleted !== 'true') {
        setShowOnboarding(true);
      }
    }
  }, [session?.user?.id, guestMode]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);

    if (session?.user && !isImpersonating) {
      try {
        await supabase.auth.updateUser({
          data: { onboarding_completed: true }
        });
      } catch (err) {
        console.error('Failed to update onboarding status', err);
      }
    } else if (!session) {
      localStorage.setItem('habit_onboarding_completed', 'true');
    }
  };

  const handleOnboardingCreateFirstHabit = async (payload: {
    name: string;
    description: string;
    color: string;
    frequency: number[] | undefined;
    weeklyTarget: number | undefined;
  }) => {
    const existingActiveHabits = habits.filter(h => !h.archivedAt);
    const hasOnlyLegacyDefaults = existingActiveHabits.length > 0 &&
      existingActiveHabits.every(h => LEGACY_DEFAULT_HABIT_NAMES.has((h.name || '').trim().toLowerCase()));

    if (existingActiveHabits.length > 0 && !hasOnlyLegacyDefaults) return;

    if (hasOnlyLegacyDefaults) {
      for (const habit of existingActiveHabits) {
        await removeHabit(habit.id);
      }
    }

    const newId = await addHabit(payload.color || theme.primary);
    if (!newId) return;

    await updateHabit(newId, {
      name: payload.name,
      description: payload.description,
      color: payload.color || theme.primary,
      frequency: payload.frequency,
      weeklyTarget: payload.weeklyTarget
    });
  };

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

  const navigateSelectedCardDate = (direction: 'prev' | 'next') => {
    setSelectedDateForCard((prev) => {
      if (!prev) return prev;
      const dayOffset = direction === 'prev' ? -1 : 1;
      return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + dayOffset);
    });
  };

  const toDateInputValue = (date: Date) => {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const updateSelectedCardDateFromInput = (value: string) => {
    if (!value) return;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return;
    setSelectedDateForCard(new Date(year, month - 1, day));
  };


  const handleHabitBlur = async (habit: any) => {
    setEditingHabitId(null);
    setEditingGoalId(null);
    updateHabit(habit.id, { name: habit.name, goal: habit.goal });
  };

  useEffect(() => {
    // Save to localStorage for guest users
    if (!session?.user?.id && notesLoaded) {
      localStorage.setItem('habit_daily_notes', JSON.stringify(notes));
    }
  }, [notes, session?.user?.id, notesLoaded]);

  const updateNote = async (dateKey: string, data: Partial<DayData>) => {
    setNotes(prev => {
      const current = prev[dateKey] || { tasks: [] };
      const updated = { ...current, ...data };
      return { ...prev, [dateKey]: updated };
    });

    // Check if empty (no tasks, no mood, no journal)
    // We can't easily check 'updated' inside setState callback for the sync part without duplicating logic.
    // So let's calculate updated state first.
    let updatedNote: DayData | undefined;

    // We need to access previous state to calculate new state for DB sync
    // React batching means 'notes' might be stale here if called rapidly? 
    // But usually fine for this app scale.
    // Better: use Functional Update for state, but for DB we need the value.
    // Let's rely on the passed 'data' merged with 'notes[dateKey]'.

    const currentNote = notes[dateKey] || { tasks: [] };
    updatedNote = { ...currentNote, ...data };

    const journalEmpty = Array.isArray(updatedNote.journal)
      ? !(updatedNote.journal as any[]).some((e: any) => (e?.text || '').trim())
      : !updatedNote.journal;
    const isEmpty =
      (!updatedNote.tasks || updatedNote.tasks.length === 0) &&
      !updatedNote.mood &&
      journalEmpty &&
      (!updatedNote.inactiveHabits || updatedNote.inactiveHabits.length === 0);

    // Sync to database for logged-in users
    if (effectiveUserId) {
      if (isEmpty) {
        // Delete empty notes
        await supabase
          .from('daily_notes')
          .delete()
          .eq('user_id', effectiveUserId)
          .eq('date_key', dateKey);
      } else {
        // Upsert note
        await supabase
          .from('daily_notes')
          .upsert({
            user_id: effectiveUserId,
            date_key: dateKey,
            content: JSON.stringify(updatedNote)
          }, {
            onConflict: 'user_id,date_key'
          });
      }
    }
  };

  const toggleHabitInactive = async (habitId: string, dateKey: string) => {
    const currentlyInactive = isHabitManuallyInactive(notes, dateKey, habitId);
    const existing = getInactiveHabitsForDate(notes, dateKey);
    const next = currentlyInactive
      ? existing.filter(id => id !== habitId)
      : Array.from(new Set([...existing, habitId]));

    await updateNote(dateKey, { inactiveHabits: next });

    if (!currentlyInactive && completions[habitId]?.[dateKey]) {
      await baseToggleCompletion(habitId, dateKey);
    }
  };

  const isHabitInactive = (habitId: string, dateKey: string) => {
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return false;
    const autoInactive = !isHabitActiveOnDate(habit, date);
    return autoInactive || isHabitManuallyInactive(notes, dateKey, habitId);
  };

  const toggleCompletion = async (habitId: string, dateKey: string) => {
    if (isHabitInactive(habitId, dateKey)) {
      const existing = getInactiveHabitsForDate(notes, dateKey);
      if (existing.includes(habitId)) {
        await updateNote(dateKey, { inactiveHabits: existing.filter(id => id !== habitId) });
      } else {
        return;
      }
    }
    await baseToggleCompletion(habitId, dateKey);
  };

  const isDayFullyCompleted = (day: number) => {
    if (habits.length === 0) return false;
    const dayStatsItem = dailyStats.find(s => s.day === day);
    return dayStatsItem && dayStatsItem.totalDue > 0 && dayStatsItem.count === dayStatsItem.totalDue;
  };

  const selectedDateSummary = useMemo(() => {
    if (!selectedDateForCard) return null;

    const date = selectedDateForCard;
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const visibleHabitsForDate = habits.filter(h => {
      if (!isHabitActiveOnDate(h, date)) return false;
      if (h.weeklyTarget) return true;
      return !h.frequency || h.frequency.includes(date.getDay());
    });
    const totalHabits = visibleHabitsForDate.filter(h => !isHabitInactive(h.id, dateKey)).length;
    const completedHabits = visibleHabitsForDate.reduce((acc, h) => {
      if (isHabitInactive(h.id, dateKey)) return acc;
      return checkCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear()) ? acc + 1 : acc;
    }, 0);
    const dayData = notes[dateKey];
    const normalizedDayData = Array.isArray(dayData) ? { tasks: dayData } : (dayData || { tasks: [] });
    const totalTasks = normalizedDayData.tasks?.length || 0;
    const openTasks = (normalizedDayData.tasks || []).filter((task: any) => !task.completed).length;
    const journalVal = normalizedDayData.journal;
    const hasJournal = Array.isArray(journalVal)
      ? journalVal.some((e: any) => (e?.text || '').trim())
      : Boolean(journalVal && (journalVal as string).trim());
    const hasMood = typeof normalizedDayData.mood === 'number';

    return {
      completedHabits,
      totalHabits,
      openTasks,
      totalTasks,
      hasJournal,
      hasMood
    };
  }, [selectedDateForCard, habits, completions, notes]);

  const logTodayStatus = useMemo<'empty' | 'partial' | 'done'>(() => {
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const visibleHabitsForToday = habits.filter(h => {
      if (!isHabitActiveOnDate(h, today)) return false;
      if (h.weeklyTarget) return true;
      return !h.frequency || h.frequency.includes(today.getDay());
    });
    const totalHabits = visibleHabitsForToday.filter(h => !isHabitInactive(h.id, dateKey)).length;
    const completedHabits = visibleHabitsForToday.reduce((acc, h) => {
      if (isHabitInactive(h.id, dateKey)) return acc;
      return checkCompleted(h.id, today.getDate(), completions, today.getMonth(), today.getFullYear()) ? acc + 1 : acc;
    }, 0);

    if (totalHabits > 0 && completedHabits === totalHabits) return 'done';
    if (completedHabits > 0) return 'partial';
    return 'empty';
  }, [habits, completions, notes]);

  const sortedHabits = useMemo(() => {
    if (sortMode === 'default') return habits;
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return [...habits].sort((a, b) => {
      if (sortMode === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortMode === 'color') return (a.color || '').localeCompare(b.color || '');
      if (sortMode === 'completion') {
        const aDone = completions[a.id]?.[todayKey] || false;
        const bDone = completions[b.id]?.[todayKey] || false;
        if (!aDone && bDone) return -1;
        if (aDone && !bDone) return 1;
        return 0;
      }
      return 0;
    });
  }, [habits, sortMode, completions]);

  const tasksCount = useMemo(() => {
    const todayStr = (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    })();
    let count = 0;
    (Object.entries(notes) as [string, DayData][]).forEach(([key, data]) => {
      if (key === '__backlog__') {
        count += (data?.tasks || []).filter(t => !t.completed).length;
      } else if (key < todayStr) {
        count += (data?.tasks || []).filter(t => !t.completed).length;
      }
    });
    return count;
  }, [notes]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        if (isBenignAuthError(error)) {
          await supabase.auth.signOut({ scope: 'local' });
        } else {
          throw error;
        }
      }

      setSession(null);
      setGuestMode(false);
      localStorage.removeItem('habit_guest_mode');
      navigate('/signin');
    } catch (err) {
      console.error('Logout error:', err);
      setSession(null);
      setGuestMode(false);
      localStorage.removeItem('habit_guest_mode');
      navigate('/signin');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const email = session?.user?.email;
    if (!email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      toast.success('Password reset email sent — check your inbox.');
    } catch (err) {
      toast.error('Failed to send reset email. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const uid = session?.user?.id;
      if (!uid) return;
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { userId: uid },
      });
      if (error) throw error;
      await supabase.auth.signOut();
      setSession(null);
      navigate('/signin');
      toast.success('Account deleted.');
    } catch (err) {
      console.error('Delete account error:', err);
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExportingData(true);
      toast.loading('Preparing export...', { id: 'export' });
      const result = await exportUserDataCsv({
        userId: effectiveUserId,
        userEmail: session?.user?.email,
        guestMode,
        habits,
        completions,
        notes,
        monthlyGoals
      });
      toast.success(`Downloaded ${result.filename} with ${result.rowCount} rows.`, { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export. Please try again.', { id: 'export' });
    } finally {
      setIsExportingData(false);
    }
  };

  const handleOpenJournalExport = () => {
    setIsJournalExportOpen(true);
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

  const isDarkMode = colorMode === 'dark';
  const today_ref = new Date();
  const currentDayOfMonth = today_ref.getDate();
  const currentMonthOfYear = today_ref.getMonth();
  const currentFullYear_ref = today_ref.getFullYear();

  const trendDelta = view === 'weekly' ? weekDelta : view === 'monthly' ? monthDelta : annualDelta;
  const trendDeltaLabel = view === 'weekly' ? 'vs LW' : view === 'monthly' ? 'vs LM' : 'vs LY';
  const trendLegendCurrent = view === 'weekly' ? 'This week' : view === 'monthly' ? 'This month' : 'This year';
  const trendLegendPrevious = view === 'weekly' ? 'Prev week' : view === 'monthly' ? 'Prev month' : 'Prev year';

  const trendChartData = useMemo(() => {
    if (view === 'weekly') {
      return weeklyStats.map((item: any, index: number) => ({ label: item.displayDay, current: item.count, previous: previousWeeklyStats[index]?.count ?? null }));
    }
    if (view === 'monthly') {
      return dailyStats.map((item: any, index: number) => ({ label: String(item.day), current: item.count, previous: previousDailyStats[index]?.count ?? null }));
    }
    return annualStats.monthlySummaries.map((item: any, index: number) => ({ label: item.month, current: item.completed, previous: previousAnnualMonthlySummaries[index]?.completed ?? null }));
  }, [view, weeklyStats, previousWeeklyStats, dailyStats, previousDailyStats, annualStats.monthlySummaries, previousAnnualMonthlySummaries]);

  const annualStory = useMemo(() => {
    const monthsElapsed = currentYear === currentFullYear_ref ? currentMonthOfYear + 1 : 12;
    return buildAnnualStory(annualStats, t, monthsElapsed);
  }, [annualStats, currentYear, currentFullYear_ref, currentMonthOfYear, t]);

  const annualCompletionRate = annualStats.totalPossible > 0 ? (annualStats.totalCompletions / annualStats.totalPossible) * 100 : 0;

  const weekHabitPerformance = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = startOfWeek === 'monday'
      ? today.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * 7
      : today.getDate() - day + weekOffset * 7;
    const startDay = new Date(today.getFullYear(), today.getMonth(), diff);
    return habits.map(h => {
      let completed = 0, total = 0;
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDay);
        date.setDate(startDay.getDate() + i);
        if (h.frequency && !h.frequency.includes(date.getDay())) continue;
        total++;
        const dateKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
        if (completions[h.id]?.[dateKey]) completed++;
      }
      return { id: h.id, name: h.name, color: h.color, completed, total, rate: total > 0 ? (completed/total)*100 : 0 };
    }).filter(h => h.total > 0).sort((a, b) => b.rate - a.rate);
  }, [habits, completions, weekOffset, startOfWeek]);

  const statsBestHabit = useMemo(() => {
    if (view === 'weekly') return weekHabitPerformance[0] ?? null;
    if (view === 'monthly') return topHabitsThisMonth[0] ? { ...topHabitsThisMonth[0], rate: topHabitsThisMonth[0].percentage } : null;
    return annualStats.topHabits[0] ?? null;
  }, [view, weekHabitPerformance, topHabitsThisMonth, annualStats.topHabits]);

  const statsWorstHabit = useMemo(() => {
    if (view === 'weekly') return weekHabitPerformance.length > 1 ? weekHabitPerformance[weekHabitPerformance.length - 1] : null;
    if (view === 'monthly') {
      const sorted = [...topHabitsThisMonth].sort((a, b) => a.percentage - b.percentage);
      return sorted[0] && sorted[0].percentage < (statsBestHabit?.rate ?? 100) ? { ...sorted[0], rate: sorted[0].percentage } : null;
    }
    return annualStats.weakestHabit ?? null;
  }, [view, weekHabitPerformance, topHabitsThisMonth, annualStats.weakestHabit, statsBestHabit]);

  const statsKpi = useMemo(() => {
    if (view === 'weekly') return { pct: weekProgress.percentage, completed: weekProgress.completed, total: weekProgress.total, delta: weekDelta, label: 'vs last week' };
    if (view === 'monthly') return { pct: monthProgress.percentage, completed: monthProgress.completed, total: monthProgress.total, delta: monthDelta, label: 'vs last month' };
    return { pct: annualCompletionRate, completed: Math.round(annualStats.totalCompletions), total: Math.round(annualStats.totalPossible), delta: annualDelta, label: 'vs last year' };
  }, [view, weekProgress, weekDelta, monthProgress, monthDelta, annualCompletionRate, annualStats, annualDelta]);

  if (passwordRecoveryMode) {
    return (
      <>
        <Toaster position="top-center" reverseOrder={false} />
        <UpdatePasswordForm onSuccess={() => setPasswordRecoveryMode(false)} />
      </>
    );
  }

  // If this was opened by the extension and we are logged in, show a success message
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('source') === 'extension' && session) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 text-center space-y-5">
          <img src="/habicard-icon.png" alt="HabiCard" className="w-14 h-14 mx-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">You're all set</p>
            <h2 className="text-2xl font-black uppercase tracking-tight text-[#333]">
              Thank you for<br />signing in.
            </h2>
          </div>
          <p className="text-sm text-stone-500 leading-relaxed">
            Open the extension to log your habits, or stay here for the full experience.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => window.close()}
              className="w-full px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest border-[2px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Close & open extension
            </button>
            <button
              onClick={() => window.location.href = `${window.location.origin}/app`}
              className="w-full px-6 py-3 bg-white text-black text-xs font-black uppercase tracking-widest border-[2px] border-black hover:bg-stone-50 transition-colors"
            >
              Go to full website
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (syncError) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-[#F4F4F0] p-6 font-sans">
        <div className="w-full max-w-sm border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-black uppercase tracking-tight text-black">Sync Failed</h2>
            <p className="text-sm text-stone-600 leading-relaxed">{syncError}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={retryGuestSync}
              className="w-full py-2.5 bg-black text-white font-black uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors border-[2px] border-black"
            >
              Try Again
            </button>
            <button
              onClick={dismissSyncError}
              className="w-full py-2.5 bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-stone-100 transition-colors border-[2px] border-black"
            >
              Continue Without My History
            </button>
          </div>
          <p className="text-[10px] text-stone-400 text-center leading-relaxed">
            Your local data is still on this device. You can try again at any time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] md:h-[100svh] overflow-y-auto md:overflow-hidden bg-[#F4F4F0] p-2 sm:p-4 pb-20 sm:pb-4 font-sans text-[#444] relative w-full max-w-full">

      <Toaster position="top-center" reverseOrder={false} />

      {isImpersonating && (
        <div className="bg-amber-100 border-b-2 border-black p-2 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm uppercase tracking-wider">
            <Key size={16} />
            <span>Viewing as: {effectiveUserId}</span>
          </div>
          <button
            onClick={() => window.location.href = '/app'}
            className="px-3 py-1 bg-black text-white text-xs font-bold uppercase hover:opacity-80 transition-opacity"
          >
            Exit View
          </button>
        </div>
      )}

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingComplete}
        initialTheme={theme}
        onThemeChange={setTheme}
        initialLanguage={language}
        onLanguageChange={updateLanguage}
        initialStartOfWeek={startOfWeek}
        onStartOfWeekChange={updateStartOfWeek}
        onCreateFirstHabit={handleOnboardingCreateFirstHabit}
        username={session?.user?.email}
      />

      <FeatureAnnouncementModal
        isOpen={showWhatsNewModal}
        onClose={handleWhatsNewClose}
        slides={whatsNewSlides}
        headerTitle="What's New"
        headerDescription="Explore the latest updates. We’ll keep adding future releases here."
        onFinish={handleWhatsNewFinish}
      />

      <JournalPdfPreviewModal
        isOpen={isJournalExportOpen}
        onClose={() => setIsJournalExportOpen(false)}
        notes={notes}
        theme={theme}
        userName={session?.user?.email || 'You'}
        isDarkMode={isDarkMode}
      />

      <div className="app-main-frame max-w-full md:h-full mx-auto bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-2 sm:p-3 flex flex-col gap-3 overflow-visible md:overflow-hidden">

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
          language={language}
          setLanguage={updateLanguage}
          startOfWeek={startOfWeek}
          setStartOfWeek={updateStartOfWeek}
          guestMode={guestMode}
          setGuestMode={setGuestMode}
          handleLogout={handleLogout}
          monthProgress={monthProgress}
          annualStats={annualStats}
          dailyStats={dailyStats}
          previousDailyStats={previousDailyStats}
          weeklyStats={weeklyStats}
          previousWeeklyStats={previousWeeklyStats}
          weekProgress={weekProgress}
          prevWeekProgress={prevWeekProgress}
          weekDelta={weekDelta}
          monthDelta={monthDelta}
          annualDelta={annualDelta}
          allTimeBestWeek={allTimeBestWeek}
          habits={habits}
          defaultView={defaultView}
          setDefaultView={updateDefaultView}
          colorMode={colorMode}
          setColorMode={setColorMode}
          cardStyle={cardStyle}
          setCardStyle={updateCardStyle}
          addHabit={addHabit}
          updateHabit={updateHabit}
          removeHabit={removeHabit}
          reorderHabits={reorderHabits}
          toggleArchiveHabit={toggleArchiveHabit}
          setWeekOffset={setWeekOffset}
          monthlyGoals={monthlyGoals}
          updateMonthlyGoals={updateMonthlyGoals}
          topHabitsThisMonth={topHabitsThisMonth}
          previousAnnualMonthlySummaries={previousAnnualMonthlySummaries}
          weekOffset={weekOffset}
          isHabitModalOpen={isHabitModalOpen}
          setIsHabitModalOpen={setIsHabitModalOpen}
          isResolutionsModalOpen={isResolutionsModalOpen}
          setIsResolutionsModalOpen={setIsResolutionsModalOpen}
          isStreakModalOpen={isStreakModalOpen}
          setIsStreakModalOpen={setIsStreakModalOpen}
          onReportBug={() => setIsFeedbackModalOpen(true)}
          hasUnreadFeedback={hasUnreadFeedback}
            onOpenWhatsNew={handleOpenWhatsNew}
            onOpenTutorial={handleOpenTutorial}
            onExportData={handleExportData}
            onViewJournal={handleOpenJournalExport}
            isExportingData={isExportingData}
            hasUnseenWhatsNew={hasUnseenWhatsNew}
            onChangePassword={handleChangePassword}
            onDeleteAccount={handleDeleteAccount}
            onSearch={() => setIsSearchOpen(true)}
          onLogToday={() => {
            setSelectedDateForCard(new Date());
            setCardOpenFlipped(false);
          }}
          logTodayStatus={logTodayStatus}
          statsOpen={statsOpen}
          onToggleStats={() => togglePanelContent('stats')}
          sortMode={sortMode}
          onCycleSortMode={() => setSortMode(m => m === 'default' ? 'name' : m === 'name' ? 'color' : m === 'color' ? 'completion' : 'default')}
          onOpenTasks={() => setIsTasksOpen(true)}
          tasksCount={tasksCount}
          onOpenLists={() => setIsListsOpen(true)}
          listsCount={listItems.length}
          panelTop={panelTop}
          panelBottom={panelBottom}
          onSetRightPanel={togglePanelContent}
        />

        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          habits={habits}
          notes={notes}
          onSelectHabit={(habitId) => {
            setEditingHabitId(habitId);
            setIsHabitModalOpen(true);
          }}
          onSelectDate={(date) => {
            setSelectedDateForCard(date);
          }}
          themePrimary={theme.primary}
        />

        {selectedDateForCard && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-black/35 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={() => setSelectedDateForCard(null)}>
            <div className="w-full max-w-6xl h-[calc(100dvh-1rem)] md:h-[calc(100dvh-2rem)] relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col pt-[max(env(safe-area-inset-top),0.5rem)] md:pt-0" onClick={e => e.stopPropagation()}>
              <div className="flex-1 min-h-0 flex flex-col rounded-[30px] border-[3px] border-black bg-white p-3 md:p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.12)] overflow-hidden">
                <div className="grid grid-cols-[1fr_auto] items-start gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
                  <div className="justify-self-start min-w-0">
                  {isSearchOpen ? (
                    <button
                      onClick={() => setSelectedDateForCard(null)}
                      className="text-stone-700 hover:text-black p-2 transition-colors flex items-center gap-2"
                    >
                      <Search size={20} />
                      <span className="font-bold text-sm uppercase tracking-wider truncate">Back to Search</span>
                    </button>
                  ) : (
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Daily Workspace</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-stone-700">
                          Habits {selectedDateSummary?.completedHabits ?? 0}/{selectedDateSummary?.totalHabits ?? 0}
                        </span>
                        <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-stone-700">
                          Tasks {selectedDateSummary?.openTasks ?? 0} open
                        </span>
                        <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-stone-700">
                          {selectedDateSummary?.hasJournal || selectedDateSummary?.hasMood ? 'Journal updated' : 'Journal empty'}
                        </span>
                      </div>
                    </div>
                  )}
                  </div>
                  <div className="justify-self-end md:hidden">
                    <button
                      onClick={() => setSelectedDateForCard(null)}
                      className="text-stone-700 hover:text-black p-2 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="md:justify-self-center md:min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => navigateSelectedCardDate('prev')}
                        className="text-stone-700 hover:text-black p-2 transition-colors border-2 border-stone-200 hover:border-black bg-stone-50"
                        title="Previous day"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <input
                        type="date"
                        value={toDateInputValue(selectedDateForCard)}
                        onChange={(e) => updateSelectedCardDateFromInput(e.target.value)}
                        className="h-10 px-2 text-sm font-bold border-2 border-stone-200 bg-white text-stone-900 focus:outline-none focus:border-black"
                        title="Select date"
                      />
                      <button
                        onClick={() => setSelectedDateForCard(new Date())}
                        className="h-10 px-2 text-[10px] font-black uppercase tracking-wide text-stone-900 border-2 border-stone-200 hover:border-black bg-stone-50 transition-colors"
                        title="Jump to today"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => navigateSelectedCardDate('next')}
                        className="text-stone-700 hover:text-black p-2 transition-colors border-2 border-stone-200 hover:border-black bg-stone-50"
                        title="Next day"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="hidden justify-self-end md:block">
                    <button
                      onClick={() => setSelectedDateForCard(null)}
                      className="text-stone-700 hover:text-black p-2 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex-1 min-h-0 overflow-hidden">
                  <DailyCard
                    date={selectedDateForCard}
                    habits={habits}
                    completions={completions}
                    theme={theme}
                    toggleCompletion={toggleCompletion}
                    toggleHabitInactive={toggleHabitInactive}
                    isHabitInactive={isHabitInactive}
                    notes={notes}
                    updateNote={updateNote}
                    onShareClick={() => { }}
                    defaultFlipped={cardOpenFlipped}
                    combinedView={true}
                    cardStyle={cardStyle}
                    fitParentHeight={true}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        <div className="flex-1 min-h-0 min-w-0 flex flex-col lg:relative">
          <div
            className={`min-h-0 lg:h-full transition-[padding] duration-200 ${view === 'weekly' ? 'overflow-visible md:overflow-hidden' : 'overflow-visible md:overflow-y-auto'} ${rightPanelOpen && (view === 'monthly' || view === 'dashboard') ? 'lg:pr-[50%]' : ''} ${rightPanelOpen && view === 'weekly' ? 'lg:pr-[52%]' : ''} ${view === 'monthly' ? 'hidden lg:block' : ''}`}
          >
            {view === 'monthly' ? (
              <MonthlyView
                habits={sortedHabits}
                completions={completions}
                currentMonthIndex={currentMonthIndex}
                currentYear={currentYear}
                theme={theme}
                weeks={weeks}
                monthDates={monthDates}
                topHabitsThisMonth={topHabitsThisMonth}
                toggleCompletion={toggleCompletion}
                toggleHabitInactive={toggleHabitInactive}
                isHabitInactive={isHabitInactive}
                removeHabit={removeHabit}
                isDayFullyCompleted={isDayFullyCompleted}
                isModalOpen={isHabitModalOpen || isResolutionsModalOpen}
                notes={notes}
                updateNote={updateNote}
                setSelectedDateForCard={(date, flipped = false) => {
                  setSelectedDateForCard(date);
                  setCardOpenFlipped(flipped);
                }}
                statsOpen={statsOpen}
              />
            ) : view === 'dashboard' ? (
              <DashboardView
                annualStats={annualStats}
                habits={habits}
                theme={theme}
                currentYear={currentYear}
                setCurrentMonthIndex={setCurrentMonthIndex}
                setView={setView}
                monthlyGoals={monthlyGoals}
                updateMonthlyGoals={updateMonthlyGoals}
                reorderHabits={reorderHabits}
                setSelectedDateForCard={(date, flipped = false) => {
                  setSelectedDateForCard(date);
                  setCardOpenFlipped(flipped);
                }}
              />
            ) : (
              <WeeklyView
                habits={sortedHabits}
                completions={completions}
                currentYear={currentYear}
                weekOffset={weekOffset}
                theme={theme}
                toggleCompletion={toggleCompletion}
                toggleHabitInactive={toggleHabitInactive}
                isHabitInactive={isHabitInactive}
                notes={notes}
                updateNote={updateNote}
                addHabit={() => addHabit(theme.primary).then(id => setEditingHabitId(id))}
                setSelectedDateForCard={(date, flipped = false) => {
                  setSelectedDateForCard(date);
                  setCardOpenFlipped(flipped);
                }}
                startOfWeek={startOfWeek}
                cardStyle={cardStyle}
                singleCardMode={rightPanelOpen}
                weekProgress={weekProgress}
                weeklyStats={weeklyStats}
              />
            )}
          </div>
          {rightPanelOpen && (
            <div className="flex flex-col bg-white/90 border-t-[3px] border-black lg:border-t-0 lg:border-l-[3px] lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:w-1/2 lg:z-20" style={{ backdropFilter: 'blur(8px)' }} onClick={() => configuringSlot && setConfiguringSlot(null)}>

              {/* ── Top slot ── */}
              <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
                {/* Slot config button */}
                <div className="absolute top-2 right-2 z-20">
                  <button
                    onClick={e => { e.stopPropagation(); setConfiguringSlot(s => s === 'top' ? null : 'top'); }}
                    className="p-1.5 rounded-lg border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-stone-500 hover:text-black transition-colors"
                  >
                    <SlidersHorizontal size={11} strokeWidth={2.5} />
                  </button>
                  {configuringSlot === 'top' && (
                    <div className="absolute top-9 right-0 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden min-w-[148px] z-30" onClick={e => e.stopPropagation()}>
                      <p className="text-[8px] font-black uppercase tracking-wider text-stone-400 px-3 pt-2.5 pb-1">Top Slot</p>
                      {(['journal', 'tasks', 'stats'] as const).map(option => {
                        const isCurrent = panelTop === option;
                        const isDisabled = panelBottom === option;
                        return (
                          <button key={option} disabled={isDisabled} onClick={() => { setPanelTop(option); setConfiguringSlot(null); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-colors ${isDisabled ? 'text-stone-300 cursor-not-allowed' : isCurrent ? 'bg-black text-white' : 'hover:bg-stone-100 text-black'}`}>
                            {option === 'journal' && <BookOpen size={12} />}
                            {option === 'tasks' && <ClipboardList size={12} />}
                            {option === 'stats' && <BarChart2 size={12} />}
                            {option}
                            {isCurrent && <Check size={10} className="ml-auto" />}
                          </button>
                        );
                      })}
                      <div className="border-t border-stone-200 my-1" />
                      <button onClick={() => { setPanelTop(null); setConfiguringSlot(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-rose-500 hover:bg-rose-50 transition-colors">
                        <X size={12} /> Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Slot content */}
                {panelTop === 'journal' || panelTop === 'tasks' ? (
                  <div className="flex-1 min-h-0 flex justify-center p-4">
                    <div className="min-h-0 h-full" style={{ width: 'min(100%, 340px)' }}>
                      <DailyCard
                        date={new Date()}
                        habits={sortedHabits}
                        completions={completions}
                        theme={theme}
                        toggleCompletion={toggleCompletion}
                        toggleHabitInactive={toggleHabitInactive}
                        isHabitInactive={isHabitInactive}
                        notes={notes}
                        updateNote={updateNote}
                        onShareClick={() => {}}
                        startOfWeek={startOfWeek}
                        cardStyle={cardStyle}
                        globalViewMode={panelTop}
                        onGlobalViewModeChange={(mode) => setPanelTop(mode === 'habits' ? null : mode as PanelContent)}
                        fitParentHeight={true}
                      />
                    </div>
                  </div>
                ) : panelTop === 'stats' ? (
                  <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">

              {/* ── Stats panel (top slot) ── */}
              {true && <>

              {/* ── At a Glance KPI ── */}
              {view !== 'dashboard' && <div className="neo-border rounded-2xl overflow-hidden bg-white shrink-0">
                <div className="h-[3px] rounded-t-2xl" style={{ backgroundColor: theme.primary }} />
                <div className="p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-3">At a Glance</p>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Completion % — fills from bottom */}
                    <div className="rounded-xl border-2 border-black overflow-hidden relative flex flex-col justify-end p-3 min-h-[80px]">
                      <div className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out rounded-b-[10px]" style={{ height: `${Math.min(100, Math.round(statsKpi.pct))}%`, backgroundColor: theme.primary, opacity: 0.15 }} />
                      <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: theme.primary, opacity: Math.min(100, Math.round(statsKpi.pct)) > 0 ? 1 : 0 }} />
                      <span className="relative text-[9px] font-black uppercase tracking-wider text-stone-400">Completion</span>
                      <span className="relative text-4xl font-black leading-none mt-0.5" style={{ color: theme.primary }}>{Math.round(statsKpi.pct)}%</span>
                    </div>
                    {/* Done / Total — fills from bottom based on completion ratio */}
                    <div className="rounded-xl border-2 border-black overflow-hidden relative flex flex-col justify-end p-3 min-h-[80px]">
                      <div className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out rounded-b-[10px]" style={{ height: `${statsKpi.total > 0 ? Math.min(100, (statsKpi.completed / statsKpi.total) * 100) : 0}%`, backgroundColor: theme.secondary, opacity: 0.18 }} />
                      <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: theme.secondary, opacity: statsKpi.completed > 0 ? 1 : 0 }} />
                      <span className="relative text-[9px] font-black uppercase tracking-wider text-stone-400">Done / Total</span>
                      <div className="relative flex items-baseline gap-1 mt-0.5">
                        <span className="text-4xl font-black leading-none">{statsKpi.completed}</span>
                        <span className="text-xl font-black text-stone-300">/ {statsKpi.total}</span>
                      </div>
                    </div>
                    {/* vs Previous — fills based on abs delta */}
                    {(() => {
                      const d = Math.round(statsKpi.delta);
                      const fillPct = Math.min(100, Math.abs(d));
                      const fillColor = d > 0 ? '#34d399' : d < 0 ? '#f87171' : '#d4d4d4';
                      return (
                        <div className="rounded-xl border-2 border-black overflow-hidden relative flex flex-col justify-end p-3 min-h-[80px]">
                          <div className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out rounded-b-[10px]" style={{ height: `${fillPct}%`, backgroundColor: fillColor, opacity: 0.18 }} />
                          <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: fillColor, opacity: fillPct > 0 ? 1 : 0 }} />
                          <span className="relative text-[9px] font-black uppercase tracking-wider text-stone-400">{statsKpi.label}</span>
                          <span className={`relative text-3xl font-black leading-none mt-0.5 ${d > 0 ? 'text-emerald-500' : d < 0 ? 'text-rose-500' : 'text-stone-400'}`}>
                            {d > 0 ? '+' : ''}{d}%
                          </span>
                        </div>
                      );
                    })()}
                    {/* Top Habit */}
                    <div className="rounded-xl border-2 border-black p-3 flex flex-col justify-end min-h-[80px] min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Top Habit</span>
                      <span className="text-base font-black leading-tight break-words mt-0.5">{statsBestHabit?.name || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>}

              {/* ── Month Pacing by Week (monthly only) ── */}
              {view === 'monthly' && (() => {
                return (
                  <div className="neo-border rounded-2xl overflow-hidden bg-white shrink-0">
                    <div className="h-[3px] rounded-t-2xl" style={{ backgroundColor: theme.secondary }} />
                    <div className="p-3">
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.22em] text-stone-400 mb-0.5">Weekly Snapshot</p>
                          <p className="text-sm font-black uppercase tracking-wide text-stone-800">Month Pacing by Week</p>
                        </div>
                        <span className="text-[9px] font-black text-stone-300 mb-0.5">{weeks.length} checkpoints</span>
                      </div>
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
                        {weeks.map((week, wIndex) => {
                          const weekTotal = habits.reduce((acc, h) => {
                            let hWeekDone = 0, activeDays = 0;
                            week.forEach(day => {
                              const dayDate = new Date(currentYear, currentMonthIndex, day);
                              const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                              if (!isHabitActiveOnDate(h, dayDate) || isHabitManuallyInactive(notes, dateKey, h.id)) return;
                              activeDays++;
                              if (h.weeklyTarget) {
                                if (checkCompleted(h.id, day, completions, currentMonthIndex, currentYear)) hWeekDone++;
                              } else {
                                const isDue = !h.frequency || h.frequency.includes(dayDate.getDay());
                                if (isDue && checkCompleted(h.id, day, completions, currentMonthIndex, currentYear)) hWeekDone++;
                              }
                            });
                            if (h.weeklyTarget) return acc + Math.min(hWeekDone, (h.weeklyTarget / 7) * activeDays);
                            return acc + hWeekDone;
                          }, 0);
                          const weekMax = habits.reduce((acc, h) => {
                            let activeDays = 0, hPossible = 0;
                            week.forEach(day => {
                              const dayDate = new Date(currentYear, currentMonthIndex, day);
                              const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                              if (!isHabitActiveOnDate(h, dayDate) || isHabitManuallyInactive(notes, dateKey, h.id)) return;
                              activeDays++;
                              if (!h.weeklyTarget && (!h.frequency || h.frequency.includes(dayDate.getDay()))) hPossible++;
                            });
                            if (h.weeklyTarget) return acc + (h.weeklyTarget / 7) * activeDays;
                            return acc + hPossible;
                          }, 0);
                          const weekPerc = weekMax > 0 ? (weekTotal / weekMax) * 100 : 0;
                          const isCurrentWeek = week.includes(new Date().getDate()) && currentMonthIndex === new Date().getMonth() && currentYear === new Date().getFullYear();
                          const startDate = new Date(currentYear, currentMonthIndex, week[0]);
                          const endDate = new Date(currentYear, currentMonthIndex, week[week.length - 1]);
                          const monthShort = startDate.toLocaleString('default', { month: 'short' }).toUpperCase();
                          const dayBars = week.map(day => {
                            const dayDate = new Date(currentYear, currentMonthIndex, day);
                            const dKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dueH = habits.filter(h => !h.weeklyTarget && (!h.frequency || h.frequency.includes(dayDate.getDay())) && isHabitActiveOnDate(h, dayDate) && !isHabitManuallyInactive(notes, dKey, h.id));
                            const doneH = dueH.filter(h => checkCompleted(h.id, day, completions, currentMonthIndex, currentYear)).length;
                            return dueH.length > 0 ? Math.round((doneH / dueH.length) * 100) : -1;
                          });
                          return (
                            <div
                              key={wIndex}
                              className={`rounded-xl border bg-white p-2 flex flex-col gap-2 ${isCurrentWeek ? 'border-black border-2' : 'border-stone-200'}`}
                            >
                              {/* Top: week label + date + circle */}
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                  <p className="text-[7px] font-black uppercase tracking-wider text-stone-400 leading-none">Week {wIndex + 1}</p>
                                  <p className="text-[8px] font-black uppercase text-stone-700 mt-1 leading-tight">
                                    {monthShort} {String(startDate.getDate()).padStart(2, '0')} – {String(endDate.getDate()).padStart(2, '0')}
                                  </p>
                                </div>
                                <CircularProgress percentage={weekPerc} size={34} strokeWidth={4} color={theme.secondary} trackColor={theme.secondary + '25'} textClassName="text-[8px]" />
                              </div>
                              {/* Divider */}
                              <div className="border-t border-stone-100" />
                              {/* Bottom: completed + day dots */}
                              <div>
                                <p className="text-[7px] font-black uppercase tracking-wider text-stone-400 leading-none mb-1">Completed</p>
                                <div className="flex items-end justify-between gap-1">
                                  <p className="text-base font-black leading-none text-stone-900">{Math.round(weekTotal)}<span className="text-[9px] font-black text-stone-300 ml-0.5">/{Math.round(weekMax)}</span></p>
                                  {/* Per-day dot bars */}
                                  <div className="flex items-end gap-[2px]" style={{ height: 14 }}>
                                    {dayBars.map((pct, di) => (
                                      <div
                                        key={di}
                                        className="w-[5px] rounded-full transition-all duration-500"
                                        style={{
                                          height: pct > 0 ? `${Math.max(5, Math.round(pct / 100 * 14))}px` : '5px',
                                          backgroundColor: pct > 0 ? theme.secondary : '#e7e5e4',
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Trend chart */}
              {view !== 'dashboard' && <div className={`neo-border rounded-2xl overflow-hidden flex flex-col min-h-[220px] ${isDarkMode ? 'bg-[#151515]' : 'bg-[#f9f9f9]'}`}>
                <div className="h-[3px] shrink-0 rounded-t-2xl" style={{ backgroundColor: theme.primary }} />
                <div className="flex flex-col flex-1 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-serif font-black uppercase text-sm tracking-widest">
                      {view === 'monthly' ? 'Monthly Trends' : view === 'weekly' ? 'Weekly Trends' : 'Annual Trends'}
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className={`text-xs font-black px-2 py-1 border-2 border-black ${trendDelta >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {Math.abs(trendDelta).toFixed(0)}% {trendDeltaLabel}
                      </div>
                      <button
                        onClick={() => setChartType(prev => prev === 'area' ? 'bar' : 'area')}
                        className="p-1 hover:bg-stone-200 rounded-sm transition-colors text-stone-400 hover:text-stone-600"
                      >
                        {chartType === 'area' ? <BarChart2 size={12} /> : <Activity size={12} />}
                      </button>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height="100%" minHeight={150} key={view + chartType}>
                    {chartType === 'area' ? (
                      <AreaChart data={trendChartData} margin={{ right: 16, left: 16, bottom: 0, top: 8 }}>
                        <defs>
                          <linearGradient id="colorValSide" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.primary} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={theme.primary} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.14)" : "#ddd"} />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: isDarkMode ? '#a8a8a8' : '#666' }} interval={view === 'monthly' ? 'preserveStartEnd' : 0} minTickGap={0} padding={{ left: 8, right: 8 }} />
                        <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#161616' : '#fff', border: isDarkMode ? '1px solid #2d2d2d' : '2px solid black', color: isDarkMode ? '#ededed' : '#111', fontWeight: 'bold' }} formatter={(value: any, name: string) => [`${value} completed`, name === 'current' ? trendLegendCurrent : trendLegendPrevious]} />
                        <Area type="monotone" dataKey="previous" stroke={theme.secondary} strokeWidth={2} strokeDasharray="6 6" fillOpacity={0} fill="transparent" />
                        <Area type="monotone" dataKey="current" stroke={isDarkMode ? "#d6d6d6" : "#000"} strokeWidth={2.5} fillOpacity={1} fill="url(#colorValSide)" />
                      </AreaChart>
                    ) : (
                      <BarChart data={trendChartData} margin={{ right: 16, left: 16, bottom: 16, top: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.14)" : "#ddd"} />
                        <XAxis dataKey="label" tick={{ fontSize: 8, fontWeight: 'bold', fill: isDarkMode ? '#a8a8a8' : '#666' }} tickLine={false} interval={view === 'monthly' ? 'preserveStartEnd' : 0} minTickGap={0} padding={{ left: 4, right: 4 }} />
                        <YAxis tick={{ fontSize: 8, fontWeight: 'bold', fill: isDarkMode ? '#a8a8a8' : '#666' }} tickLine={false} width={20} domain={[0, 'dataMax + 1']} allowDecimals={false} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: isDarkMode ? '#161616' : '#fff', border: isDarkMode ? '1px solid #2d2d2d' : '2px solid black', color: isDarkMode ? '#ededed' : '#111', fontWeight: 'bold' }} formatter={(value: any, name: string) => [`${value} completed`, name === 'current' ? trendLegendCurrent : trendLegendPrevious]} />
                        <Bar dataKey="previous" fill={theme.secondary} fillOpacity={0.55} radius={[3, 3, 0, 0]} strokeWidth={1} />
                        <Bar dataKey="current" fill={theme.primary} radius={[3, 3, 0, 0]} strokeWidth={1} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>}
              {/* Story panel */}
              {view !== 'dashboard' && <div className="neo-border rounded-2xl flex flex-col overflow-hidden bg-white flex-1 min-h-0">
                <div className="text-white text-[10px] font-black uppercase py-2 text-center tracking-widest border-b-[3px] border-black shrink-0" style={{ backgroundColor: theme.primary }}>
                  {view === 'monthly' ? 'Monthly Success' : view === 'weekly' ? 'Weekly Success' : 'Annual Performance'}
                </div>
                <div className="flex-1 flex flex-col p-3 gap-2 overflow-y-auto min-h-0">
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
                        <div className="w-14 h-14 relative">
                          <PieChart width={56} height={56}>
                            <Pie data={[{ value: monthProgress.completed || 0.1 }, { value: monthProgress.remaining || 0 }]} innerRadius="72%" outerRadius="100%" paddingAngle={2} dataKey="value" startAngle={90} endAngle={450} isAnimationActive={true} animationDuration={800}>
                              <Cell fill={theme.primary} /><Cell fill={isDarkMode ? "#2a2a2a" : "#f0f0f0"} />
                            </Pie>
                          </PieChart>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black" style={{ color: theme.primary }}>{monthProgress.percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 bg-stone-50/50 neo-border rounded-xl p-2 overflow-y-auto">
                        {(() => {
                          const isCurrentMonth = currentMonthIndex === currentMonthOfYear && currentYear === currentFullYear_ref;
                          const daysElapsed = isCurrentMonth ? currentDayOfMonth : new Date(currentYear, currentMonthIndex + 1, 0).getDate();
                          const story = buildMonthlyStory(monthProgress, topHabitsThisMonth, monthDelta, t, daysElapsed);
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5"><Sparkles size={10} className="text-amber-500" /><span className="font-serif text-[9px] font-black uppercase tracking-widest text-stone-500">Your story</span></div>
                              {story.sections.map((section: any, idx: number) => (
                                <p key={idx} className="text-[11px] leading-relaxed font-bold">
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
                          <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest leading-none mb-1">Week progress</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black leading-none">{weekProgress.completed}</span>
                            <span className="text-lg font-black text-stone-300">/ {weekProgress.total}</span>
                          </div>
                        </div>
                        <div className="w-14 h-14 relative">
                          <PieChart width={56} height={56}>
                            <Pie data={[{ value: weekProgress.completed || 0.1 }, { value: weekProgress.remaining || 0 }]} innerRadius="72%" outerRadius="100%" paddingAngle={2} dataKey="value" startAngle={90} endAngle={450} isAnimationActive={true} animationDuration={800}>
                              <Cell fill={theme.primary} /><Cell fill={isDarkMode ? "#2a2a2a" : "#f0f0f0"} />
                            </Pie>
                          </PieChart>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black" style={{ color: theme.primary }}>{weekProgress.percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 bg-stone-50/50 neo-border rounded-xl p-2 overflow-y-auto">
                        {(() => {
                          const daysElapsed = weekOffset === 0
                            ? (startOfWeek === 'sunday' ? today_ref.getDay() + 1 : (today_ref.getDay() === 0 ? 7 : today_ref.getDay()))
                            : 7;
                          const story = buildWeeklyStory(weekProgress, weeklyStats, habits, t, daysElapsed);
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5"><Sparkles size={10} className="text-amber-500" /><span className="font-serif text-[9px] font-black uppercase tracking-widest text-stone-500">Your story</span></div>
                              {story.sections.map((section: any, idx: number) => (
                                <p key={idx} className="text-[11px] leading-relaxed font-bold">
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
                          <div className="flex items-center gap-1.5 mb-1"><Sparkles size={10} className="text-amber-500" /><span className="font-serif text-[9px] font-black uppercase tracking-widest text-stone-500">Annual story</span></div>
                          {annualStory.annualSummary ? (
                            <div>
                              <div className="text-[12px] font-black text-stone-900 truncate">{annualStory.annualSummary.support.strongestHabit?.name || 'Year story'}</div>
                              <p className="text-[10px] font-bold text-stone-500">{annualStory.annualSummary.support.momentumLabel} · {annualStory.annualSummary.support.rhythmLabel}</p>
                            </div>
                          ) : (
                            <p className="text-[11px] font-bold text-stone-500">No significant outcomes yet</p>
                          )}
                        </div>
                        <div className="w-14 h-14 relative shrink-0">
                          <PieChart width={56} height={56}>
                            <Pie data={[{ value: annualStats.totalCompletions || 0.1 }, { value: Math.max(0, annualStats.totalPossible - annualStats.totalCompletions) }]} innerRadius="72%" outerRadius="100%" paddingAngle={2} dataKey="value" startAngle={90} endAngle={450} isAnimationActive={true} animationDuration={800}>
                              <Cell fill={theme.primary} /><Cell fill={isDarkMode ? "#2a2a2a" : "#f0f0f0"} />
                            </Pie>
                          </PieChart>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black" style={{ color: theme.primary }}>{annualCompletionRate.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>}

              {/* ── Dashboard: Year Trend ── */}
              {view === 'dashboard' && (
                <div className="neo-border rounded-2xl overflow-hidden flex flex-col min-h-[200px] bg-[#f9f9f9] shrink-0">
                  <div className="h-[3px] shrink-0 rounded-t-2xl" style={{ backgroundColor: theme.primary }} />
                  <div className="flex flex-col flex-1 p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Year Trend</p>
                      <div className={`text-[9px] font-black px-2 py-1 border border-black ${trendDelta >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trendDelta >= 0 ? '+' : ''}{Math.abs(trendDelta).toFixed(0)}% vs LY
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%" minHeight={140}>
                      <AreaChart data={trendChartData} margin={{ right: 12, left: 12, bottom: 0, top: 6 }}>
                        <defs>
                          <linearGradient id="yearGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.primary} stopOpacity={0.7} />
                            <stop offset="95%" stopColor={theme.primary} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 'bold', fill: '#666' }} interval={0} minTickGap={0} padding={{ left: 8, right: 8 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid black', fontWeight: 'bold' }} formatter={(value: any) => [`${value} completed`]} />
                        <Area type="monotone" dataKey="previous" stroke={theme.secondary} strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={0} fill="transparent" />
                        <Area type="monotone" dataKey="current" stroke="#000" strokeWidth={2} fillOpacity={1} fill="url(#yearGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ── Dashboard: 52-Week Heatmap ── */}
              {view === 'dashboard' && (() => {
                const jan1DayOfWeek = new Date(currentYear, 0, 1).getDay();
                const emptyCells = jan1DayOfWeek;

                const yearCells: { pct: number; month: number }[] = [];
                for (let m = 0; m < 12; m++) {
                  const summary = annualStats.monthlySummaries[m];
                  const days = summary?.days ?? [];
                  days.forEach((d: any, i: number) => {
                    const date = new Date(currentYear, m, i + 1);
                    if (date.getMonth() !== m) return;
                    const pct = d.totalPossible > 0 ? Math.round((d.habitsCompleted / d.totalPossible) * 100) : -1;
                    yearCells.push({ pct, month: m });
                  });
                }

                const allCells: ({ pct: number; month: number } | null)[] = [
                  ...Array(emptyCells).fill(null),
                  ...yearCells,
                ];

                const weekColumns: ({ pct: number; month: number } | null)[][] = [];
                for (let i = 0; i < allCells.length; i += 7) {
                  weekColumns.push(allCells.slice(i, i + 7));
                }

                const monthAbbr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

                const getCellColor = (pct: number) => {
                  if (pct < 0) return '#f5f5f4';
                  if (pct === 0) return '#e7e5e4';
                  if (pct < 50) return theme.secondary + '60';
                  if (pct < 100) return theme.secondary + 'aa';
                  return theme.primary;
                };

                return (
                  <div className="neo-border rounded-2xl overflow-hidden bg-white shrink-0">
                    <div className="h-[3px] rounded-t-2xl" style={{ backgroundColor: theme.secondary }} />
                    <div className="p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-3">52-Week Map</p>
                      <div className="overflow-x-auto">
                        <div className="flex gap-[3px]" style={{ minWidth: 'max-content' }}>
                          {weekColumns.map((week, wi) => (
                            <div key={wi} className="flex flex-col gap-[3px]">
                              {Array.from({ length: 7 }, (_, di) => {
                                const cell = week[di] ?? null;
                                return (
                                  <div
                                    key={di}
                                    className="w-[10px] h-[10px] rounded-[2px]"
                                    style={{ backgroundColor: cell ? getCellColor(cell.pct) : 'transparent' }}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                        <div className="flex mt-1 gap-[3px]">
                          {(() => {
                            const labels: React.ReactNode[] = [];
                            let cellIdx = emptyCells;
                            for (let m = 0; m < 12; m++) {
                              const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
                              labels.push(
                                <div key={m} style={{ width: Math.ceil(daysInMonth / 7) * 13, minWidth: 0 }}>
                                  <span className="text-[7px] font-black text-stone-300 uppercase">{monthAbbr[m]}</span>
                                </div>
                              );
                              cellIdx += daysInMonth;
                            }
                            return labels;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Dashboard: Seasonal Breakdown ── */}
              {view === 'dashboard' && (() => {
                const seasons = [
                  { name: 'Winter', label: 'Dec–Feb', months: [11, 0, 1] },
                  { name: 'Spring', label: 'Mar–May', months: [2, 3, 4] },
                  { name: 'Summer', label: 'Jun–Aug', months: [5, 6, 7] },
                  { name: 'Fall',   label: 'Sep–Nov', months: [8, 9, 10] },
                ].map(s => {
                  const data = s.months.map(m => annualStats.monthlySummaries[m]).filter((m: any) => m && !m.isFutureMonth && m.total > 0);
                  const avg = data.length > 0 ? Math.round(data.reduce((acc: number, m: any) => acc + m.rate, 0) / data.length) : null;
                  return { ...s, avg };
                });
                const maxAvg = Math.max(...seasons.map(s => s.avg ?? 0));

                return (
                  <div className="neo-border rounded-2xl overflow-hidden bg-white shrink-0">
                    <div className="h-[3px] rounded-t-2xl" style={{ backgroundColor: theme.secondary }} />
                    <div className="p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-3">Seasonal Patterns</p>
                      <div className="grid grid-cols-4 gap-2">
                        {seasons.map(s => {
                          const isBest = s.avg !== null && s.avg === maxAvg && maxAvg > 0;
                          return (
                            <div key={s.name} className={`rounded-xl border p-2 text-center relative overflow-hidden ${isBest ? 'border-black border-2' : 'border-stone-200'}`}>
                              {s.avg !== null && s.avg > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 transition-all duration-500" style={{ height: `${s.avg}%`, backgroundColor: isBest ? theme.primary : theme.secondary, opacity: isBest ? 0.2 : 0.15 }} />
                              )}
                              <p className="relative text-[8px] font-black uppercase tracking-wide text-stone-500">{s.name}</p>
                              <p className="relative text-base font-black leading-tight mt-0.5 text-stone-900">{s.avg !== null ? `${s.avg}%` : '—'}</p>
                              <p className="relative text-[7px] font-bold text-stone-400">{s.label}</p>
                              {isBest && <p className="relative text-[7px] font-black" style={{ color: theme.primary }}>PEAK</p>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Dashboard: Weekday Pattern ── */}
              {view === 'dashboard' && (
                <div className="neo-border rounded-2xl overflow-hidden bg-white shrink-0">
                  <div className="h-[3px] rounded-t-2xl" style={{ backgroundColor: theme.secondary }} />
                  <div className="p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-2">Weekday Pattern</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Weekdays', rate: Math.round(annualStats.weekdayRate ?? 0) },
                        { label: 'Weekends', rate: Math.round(annualStats.weekendRate ?? 0) },
                      ].map(({ label, rate }) => {
                        const isBetter = label === 'Weekdays'
                          ? (annualStats.weekdayRate ?? 0) >= (annualStats.weekendRate ?? 0)
                          : (annualStats.weekendRate ?? 0) > (annualStats.weekdayRate ?? 0);
                        return (
                          <div key={label} className={`rounded-xl border relative overflow-hidden p-2 ${isBetter ? 'border-black border-2' : 'border-stone-200'}`}>
                            <div className="absolute bottom-0 left-0 right-0" style={{ height: `${rate}%`, backgroundColor: isBetter ? theme.primary : theme.secondary, opacity: 0.15 }} />
                            <p className="relative text-[8px] font-black uppercase text-stone-500">{label}</p>
                            <p className="relative text-xl font-black leading-none mt-0.5" style={{ color: isBetter ? theme.primary : undefined }}>{rate}%</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Best / Needs Focus ── */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="neo-border rounded-2xl overflow-hidden bg-white">
                  <div className="h-[3px] rounded-t-2xl bg-emerald-400" />
                  <div className="p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                      {view === 'weekly' ? 'Best This Week' : view === 'monthly' ? 'Best This Month' : 'Best This Year'}
                    </span>
                    {statsBestHabit ? (
                      <>
                        <span className="text-sm font-black leading-tight break-words">{statsBestHabit.name}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${Math.min(100, Math.round(statsBestHabit.rate))}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-emerald-600">{Math.round(statsBestHabit.rate)}%</span>
                        </div>
                      </>
                    ) : <span className="text-xs text-stone-300 font-bold">No data yet</span>}
                  </div>
                </div>
                <div className="neo-border rounded-2xl overflow-hidden bg-white">
                  <div className="h-[3px] rounded-t-2xl bg-rose-300" />
                  <div className="p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-rose-300">
                      {view === 'weekly' ? 'Needs Focus' : view === 'monthly' ? 'Needs Focus' : 'Needs Focus'}
                    </span>
                    {statsWorstHabit ? (
                      <>
                        <span className="text-sm font-black leading-tight break-words">{statsWorstHabit.name}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                            <div className="h-full rounded-full bg-rose-300 transition-all" style={{ width: `${Math.min(100, Math.round(statsWorstHabit.rate))}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-rose-400">{Math.round(statsWorstHabit.rate)}%</span>
                        </div>
                      </>
                    ) : <span className="text-xs text-stone-300 font-bold">On track</span>}
                  </div>
                </div>
              </div>

              {/* ── Habit Leaderboard ── */}
              {(() => {
                const list = view === 'weekly' ? weekHabitPerformance :
                  view === 'monthly' ? topHabitsThisMonth.map((h: any) => ({ ...h, rate: h.percentage })) :
                  annualStats.topHabits;
                if (!list || list.length === 0) return null;
                return (
                  <div className="neo-border rounded-2xl overflow-hidden bg-white shrink-0">
                    <div className="h-[3px] rounded-t-2xl" style={{ backgroundColor: theme.primary }} />
                    <div className="p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-3">
                        {view === 'weekly' ? 'Weekly Leaderboard' : view === 'monthly' ? 'Monthly Leaderboard' : 'Top Habits'}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {list.slice(0, 6).map((h: any, i: number) => {
                          const pct = Math.min(100, Math.round(h.rate ?? 0));
                          const hasCount = h.completed != null && h.total != null && Math.round(h.total) > 0;
                          return (
                            <div key={h.id ?? i} className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-stone-300 w-3 text-right shrink-0">{i + 1}</span>
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: h.color || theme.primary }} />
                              <span className="text-[11px] font-bold text-stone-700 flex-1 min-w-0 truncate">{h.name}</span>
                              {hasCount && <span className="text-[9px] font-black text-stone-300 shrink-0">{Math.round(h.completed)}/{Math.round(h.total)}</span>}
                              <div className="w-14 h-1.5 rounded-full bg-stone-100 overflow-hidden shrink-0">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: theme.primary }} />
                              </div>
                              <span className="text-[10px] font-black w-7 text-right shrink-0" style={{ color: theme.primary }}>{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Analytics heatmap ── */}
              {view !== 'dashboard' && <div className="neo-border rounded-2xl overflow-hidden bg-white shrink-0">
                <div className="h-[3px] rounded-t-2xl" style={{ backgroundColor: theme.secondary }} />
                <div className="p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-3">
                    {view === 'weekly' ? 'Day Breakdown' : view === 'monthly' ? 'Month Heatmap' : 'Year Overview'}
                  </p>

                  {view === 'weekly' && (() => {
                    const weekStart_dates = (() => {
                      const now = new Date();
                      const day = now.getDay();
                      const diff = startOfWeek === 'monday'
                        ? now.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * 7
                        : now.getDate() - day + weekOffset * 7;
                      return new Date(now.getFullYear(), now.getMonth(), diff);
                    })();
                    const MOOD_MAP: Record<number, { icon: React.ElementType; color: string; bg: string }> = {
                      1: { icon: Angry,  color: '#ef4444', bg: '#fee2e2' },
                      2: { icon: Frown,  color: '#f97316', bg: '#ffedd5' },
                      3: { icon: Meh,    color: '#eab308', bg: '#fef9c3' },
                      4: { icon: Smile,  color: '#84cc16', bg: '#ecfccb' },
                      5: { icon: Laugh,  color: '#10b981', bg: '#d1fae5' },
                    };
                    const days = weeklyStats.map((d: any, i: number) => {
                      const date = new Date(weekStart_dates);
                      date.setDate(weekStart_dates.getDate() + i);
                      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      const dueHabits = habits.filter((h: any) => !h.weeklyTarget && (!h.frequency || h.frequency.includes(date.getDay())));
                      const doneCount = dueHabits.filter((h: any) => checkCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear())).length;
                      const pct = dueHabits.length > 0 ? Math.round((doneCount / dueHabits.length) * 100) : 0;
                      const isToday = date.toDateString() === new Date().toDateString();
                      const moodVal = notes[dateKey]?.mood;
                      const moodMeta = typeof moodVal === 'number' ? MOOD_MAP[moodVal] ?? null : null;
                      const label = d.displayDay.slice(0, 2).toUpperCase();
                      return { pct, isToday, moodMeta, label };
                    });
                    return (
                      <div className="flex flex-col gap-2">
                        {/* Day labels */}
                        <div className="flex gap-2">
                          {days.map((d, i) => (
                            <div key={i} className="flex-1 text-center">
                              <span className={`text-[10px] font-black uppercase ${d.isToday ? 'text-black' : 'text-stone-400'}`}>{d.label}</span>
                            </div>
                          ))}
                        </div>
                        {/* Completion tiles */}
                        <div className="flex gap-2">
                          {days.map((d, i) => (
                            <div key={i} className={`relative flex-1 aspect-square rounded-xl overflow-hidden flex items-end justify-center pb-1.5 ${d.isToday ? 'border-2 border-black' : 'border border-stone-200'} ${d.pct === 0 ? 'bg-stone-50' : ''}`}>
                              {d.pct > 0 && <div className="absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out" style={{ height: `${d.pct}%`, backgroundColor: d.pct >= 100 ? theme.primary : theme.secondary, opacity: d.pct >= 100 ? 1 : 0.8 }} />}
                              <span className={`relative text-xs font-black leading-none ${d.pct >= 50 ? 'text-white' : d.pct === 0 ? 'text-stone-300' : 'text-stone-700'}`}>{d.pct}%</span>
                            </div>
                          ))}
                        </div>
                        {/* Mood tiles */}
                        <div className="flex gap-2">
                          {days.map((d, i) => {
                            const MoodIcon = d.moodMeta?.icon;
                            return (
                              <div key={i} className={`relative flex-1 aspect-square rounded-xl overflow-hidden flex items-center justify-center ${d.isToday ? 'border-2 border-black' : 'border border-stone-200'}`} style={{ backgroundColor: d.moodMeta?.bg || '#f9fafb' }}>
                                {MoodIcon
                                  ? <MoodIcon size={20} color={d.moodMeta!.color} strokeWidth={2.5} />
                                  : <span className="text-[10px] font-black text-stone-300">—</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {view === 'monthly' && (() => {
                    const firstDay = new Date(currentYear, currentMonthIndex, 1).getDay();
                    const offset_days = startOfWeek === 'monday' ? (firstDay === 0 ? 6 : firstDay - 1) : firstDay;
                    const dayLabels = startOfWeek === 'monday' ? ['M','T','W','T','F','S','S'] : ['S','M','T','W','T','F','S'];
                    return (
                      <div>
                        <div className="grid grid-cols-7 gap-1 mb-1.5">
                          {dayLabels.map((l, i) => (
                            <div key={i} className="text-center text-[8px] font-black text-stone-300">{l}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: offset_days }).map((_, i) => <div key={`e${i}`} />)}
                          {dailyStats.map((d: any) => {
                            const pct = d.totalDue > 0 ? Math.round((d.count / d.totalDue) * 100) : -1;
                            const isToday = d.day === new Date().getDate() && currentMonthIndex === new Date().getMonth() && currentYear === new Date().getFullYear();
                            const cellDateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
                            const cellNote = notes[cellDateKey];
                            const moodVal = cellNote && !Array.isArray(cellNote) ? (cellNote as any).mood : undefined;
                            const MOOD_ICON_MAP: Record<number, React.ElementType> = { 1: Angry, 2: Frown, 3: Meh, 4: Smile, 5: Laugh };
                            const MOOD_COLOR_MAP: Record<number, string> = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#84cc16', 5: '#10b981' };
                            const CellMoodIcon = typeof moodVal === 'number' ? MOOD_ICON_MAP[moodVal] : null;
                            const cellMoodColor = typeof moodVal === 'number' ? MOOD_COLOR_MAP[moodVal] : null;
                            return (
                              <div
                                key={d.day}
                                className={`aspect-square rounded-lg border relative overflow-hidden ${isToday ? 'border-black border-2' : 'border-stone-200'}`}
                                style={{ backgroundColor: '#fafaf9' }}
                              >
                                {/* Bottom fill to pct */}
                                {pct > 0 && (
                                  <div className="absolute bottom-0 left-0 right-0 transition-all duration-500" style={{ height: `${pct}%`, backgroundColor: pct >= 100 ? theme.primary : theme.secondary, opacity: 0.82 }} />
                                )}
                                {/* Day — top left */}
                                <span className={`absolute top-1 left-1 text-[10px] font-black leading-none z-10 ${pct >= 90 ? 'text-white' : 'text-stone-700'}`}>{d.day}</span>
                                {/* Mood — center */}
                                {CellMoodIcon && (
                                  <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <CellMoodIcon size={16} style={{ fill: cellMoodColor!, color: '#44403c', strokeWidth: 1.5 }} />
                                  </div>
                                )}
                                {/* % — bottom center */}
                                <div className="absolute bottom-1 left-0 right-0 flex justify-center z-10">
                                  <span className={`text-[10px] font-black leading-none ${pct >= 40 ? 'text-white' : pct >= 0 ? 'text-stone-600' : 'text-stone-300'}`}>
                                    {pct >= 0 ? `${pct}%` : '—'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {view === 'dashboard' && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {annualStats.monthlySummaries.map((m: any, i: number) => {
                        const pct = Math.round(m.rate || 0);
                        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        const isCurrent = i === new Date().getMonth() && currentYear === new Date().getFullYear();
                        return (
                          <div key={i} className={`rounded-lg border-2 overflow-hidden flex flex-col items-center py-2 gap-1 relative ${isCurrent ? 'border-black' : 'border-stone-200'}`}>
                            <div className="absolute inset-0" style={{ backgroundColor: theme.secondary, opacity: pct >= 100 ? 0 : pct / 100 * 0.7 }} />
                            {pct >= 100 && <div className="absolute inset-0" style={{ backgroundColor: theme.primary }} />}
                            <span className={`relative text-[8px] font-black uppercase ${pct >= 60 ? 'text-white' : 'text-stone-500'}`}>{monthNames[i]}</span>
                            <span className={`relative text-[10px] font-black ${pct >= 60 ? 'text-white' : 'text-stone-800'}`}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>}
              </>}

                  </div>
                ) : (
                  <div className="flex-1 min-h-0 flex items-center justify-center cursor-pointer group" onClick={() => setConfiguringSlot('top')}>
                    <div className="flex flex-col items-center gap-2 text-stone-300 group-hover:text-stone-500 transition-colors pointer-events-none">
                      <Plus size={24} strokeWidth={2} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Add panel</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Divider ── */}
              <div className="h-[3px] bg-black shrink-0" />

              {/* ── Bottom slot ── */}
              <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
                {/* Slot config button */}
                <div className="absolute top-2 right-2 z-20">
                  <button
                    onClick={e => { e.stopPropagation(); setConfiguringSlot(s => s === 'bottom' ? null : 'bottom'); }}
                    className="p-1.5 rounded-lg border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-stone-500 hover:text-black transition-colors"
                  >
                    <SlidersHorizontal size={11} strokeWidth={2.5} />
                  </button>
                  {configuringSlot === 'bottom' && (
                    <div className="absolute top-9 right-0 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden min-w-[148px] z-30" onClick={e => e.stopPropagation()}>
                      <p className="text-[8px] font-black uppercase tracking-wider text-stone-400 px-3 pt-2.5 pb-1">Bottom Slot</p>
                      {(['journal', 'tasks', 'stats'] as const).map(option => {
                        const isCurrent = panelBottom === option;
                        const isDisabled = panelTop === option;
                        return (
                          <button key={option} disabled={isDisabled} onClick={() => { setPanelBottom(option); setConfiguringSlot(null); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-colors ${isDisabled ? 'text-stone-300 cursor-not-allowed' : isCurrent ? 'bg-black text-white' : 'hover:bg-stone-100 text-black'}`}>
                            {option === 'journal' && <BookOpen size={12} />}
                            {option === 'tasks' && <ClipboardList size={12} />}
                            {option === 'stats' && <BarChart2 size={12} />}
                            {option}
                            {isCurrent && <Check size={10} className="ml-auto" />}
                          </button>
                        );
                      })}
                      <div className="border-t border-stone-200 my-1" />
                      <button onClick={() => { setPanelBottom(null); setConfiguringSlot(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-rose-500 hover:bg-rose-50 transition-colors">
                        <X size={12} /> Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Slot content */}
                {panelBottom === 'journal' || panelBottom === 'tasks' ? (
                  <div className="flex-1 min-h-0 flex justify-center p-4">
                    <div className="min-h-0 h-full" style={{ width: 'min(100%, 340px)' }}>
                      <DailyCard
                        date={new Date()}
                        habits={sortedHabits}
                        completions={completions}
                        theme={theme}
                        toggleCompletion={toggleCompletion}
                        toggleHabitInactive={toggleHabitInactive}
                        isHabitInactive={isHabitInactive}
                        notes={notes}
                        updateNote={updateNote}
                        onShareClick={() => {}}
                        startOfWeek={startOfWeek}
                        cardStyle={cardStyle}
                        globalViewMode={panelBottom}
                        onGlobalViewModeChange={(mode) => setPanelBottom(mode === 'habits' ? null : mode as PanelContent)}
                        fitParentHeight={true}
                      />
                    </div>
                  </div>
                ) : panelBottom === 'stats' ? (
                  <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">

              {/* ── Stats panel (bottom slot) ── */}
              {true && <>

              {/* ── At a Glance KPI ── */}
              {view !== 'dashboard' && <div className="neo-border rounded-2xl overflow-hidden bg-white shrink-0">
                <div className="h-[3px] rounded-t-2xl" style={{ backgroundColor: theme.primary }} />
                <div className="p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-3">At a Glance</p>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Completion % — fills from bottom */}
                    <div className="rounded-xl border-2 border-black overflow-hidden relative flex flex-col justify-end p-3 min-h-[80px]">
                      <div className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out rounded-b-[10px]" style={{ height: `${Math.min(100, Math.round(statsKpi.pct))}%`, backgroundColor: theme.primary, opacity: 0.15 }} />
                      <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: theme.primary, opacity: Math.min(100, Math.round(statsKpi.pct)) > 0 ? 1 : 0 }} />
                      <span className="relative text-[9px] font-black uppercase tracking-wider text-stone-400">Completion</span>
                      <span className="relative text-4xl font-black leading-none mt-0.5" style={{ color: theme.primary }}>{Math.round(statsKpi.pct)}%</span>
                    </div>
                    {/* Done / Total — fills from bottom based on completion ratio */}
                    <div className="rounded-xl border-2 border-black overflow-hidden relative flex flex-col justify-end p-3 min-h-[80px]">
                      <div className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out rounded-b-[10px]" style={{ height: `${statsKpi.total > 0 ? Math.min(100, (statsKpi.completed / statsKpi.total) * 100) : 0}%`, backgroundColor: theme.secondary, opacity: 0.18 }} />
                      <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: theme.secondary, opacity: statsKpi.completed > 0 ? 1 : 0 }} />
                      <span className="relative text-[9px] font-black uppercase tracking-wider text-stone-400">Done / Total</span>
                      <div className="relative flex items-baseline gap-1 mt-0.5">
                        <span className="text-4xl font-black leading-none">{statsKpi.completed}</span>
                        <span className="text-xl font-black text-stone-300">/ {statsKpi.total}</span>
                      </div>
                    </div>
                    {/* vs Previous — fills based on abs delta */}
                    {(() => {
                      const d = Math.round(statsKpi.delta);
                      const fillPct = Math.min(100, Math.abs(d));
                      const fillColor = d > 0 ? '#34d399' : d < 0 ? '#f87171' : '#d4d4d4';
                      return (
                        <div className="rounded-xl border-2 border-black overflow-hidden relative flex flex-col justify-end p-3 min-h-[80px]">
                          <div className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out rounded-b-[10px]" style={{ height: `${fillPct}%`, backgroundColor: fillColor, opacity: 0.18 }} />
                          <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: fillColor, opacity: fillPct > 0 ? 1 : 0 }} />
                          <span className="relative text-[9px] font-black uppercase tracking-wider text-stone-400">{statsKpi.label}</span>
                          <span className={`relative text-3xl font-black leading-none mt-0.5 ${d > 0 ? 'text-emerald-500' : d < 0 ? 'text-rose-500' : 'text-stone-400'}`}>
                            {d > 0 ? '+' : ''}{d}%
                          </span>
                        </div>
                      );
                    })()}
                    {/* Top Habit */}
                    <div className="rounded-xl border-2 border-black p-3 flex flex-col justify-end min-h-[80px] min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Top Habit</span>
                      <span className="text-base font-black leading-tight break-words mt-0.5">{statsBestHabit?.name || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>}

              {/* ── Month Pacing by Week (monthly only) ── */}
              {view === 'monthly' && (() => {
                return (
                  <div className="neo-border rounded-2xl overflow-hidden bg-white shrink-0">
                    <div className="h-[3px] rounded-t-2xl" style={{ backgroundColor: theme.secondary }} />
                    <div className="p-3">
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.22em] text-stone-400 mb-0.5">Weekly Snapshot</p>
                          <p className="text-sm font-black uppercase tracking-wide text-stone-800">Month Pacing by Week</p>
                        </div>
                        <span className="text-[9px] font-black text-stone-300 mb-0.5">{weeks.length} checkpoints</span>
                      </div>
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
                        {weeks.map((week, wIndex) => {
                          const weekTotal = habits.reduce((acc, h) => {
                            let hWeekDone = 0, activeDays = 0;
                            week.forEach(day => {
                              const dayDate = new Date(currentYear, currentMonthIndex, day);
                              const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                              if (!isHabitActiveOnDate(h, dayDate) || isHabitManuallyInactive(notes, dateKey, h.id)) return;
                              activeDays++;
                              if (h.weeklyTarget) {
                                if (checkCompleted(h.id, day, completions, currentMonthIndex, currentYear)) hWeekDone++;
                              } else {
                                const isDue = !h.frequency || h.frequency.includes(dayDate.getDay());
                                if (isDue && checkCompleted(h.id, day, completions, currentMonthIndex, currentYear)) hWeekDone++;
                              }
                            });
                            if (h.weeklyTarget) return acc + Math.min(hWeekDone, (h.weeklyTarget / 7) * activeDays);
                            return acc + hWeekDone;
                          }, 0);
                          const weekMax = habits.reduce((acc, h) => {
                            let activeDays = 0, hPossible = 0;
                            week.forEach(day => {
                              const dayDate = new Date(currentYear, currentMonthIndex, day);
                              const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                              if (!isHabitActiveOnDate(h, dayDate) || isHabitManuallyInactive(notes, dateKey, h.id)) return;
                              activeDays++;
                              if (!h.weeklyTarget && (!h.frequency || h.frequency.includes(dayDate.getDay()))) hPossible++;
                            });
                            if (h.weeklyTarget) return acc + (h.weeklyTarget / 7) * activeDays;
                            return acc + hPossible;
                          }, 0);
                          const weekPerc = weekMax > 0 ? (weekTotal / weekMax) * 100 : 0;
                          const isCurrentWeek = week.includes(new Date().getDate()) && currentMonthIndex === new Date().getMonth() && currentYear === new Date().getFullYear();
                          const startDate = new Date(currentYear, currentMonthIndex, week[0]);
                          const endDate = new Date(currentYear, currentMonthIndex, week[week.length - 1]);
                          const monthShort = startDate.toLocaleString('default', { month: 'short' }).toUpperCase();
                          const dayBars = week.map(day => {
                            const dayDate = new Date(currentYear, currentMonthIndex, day);
                            const dKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dueH = habits.filter(h => !h.weeklyTarget && (!h.frequency || h.frequency.includes(dayDate.getDay())) && isHabitActiveOnDate(h, dayDate) && !isHabitManuallyInactive(notes, dKey, h.id));
                            const doneH = dueH.filter(h => checkCompleted(h.id, day, completions, currentMonthIndex, currentYear)).length;
                            return dueH.length > 0 ? Math.round((doneH / dueH.length) * 100) : -1;
                          });
                          return (
                            <div
                              key={wIndex}
                              className={`rounded-xl border bg-white p-2 flex flex-col gap-2 ${isCurrentWeek ? 'border-black border-2' : 'border-stone-200'}`}
                            >
                              {/* Top: week label + date + circle */}
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                  <p className="text-[7px] font-black uppercase tracking-wider text-stone-400 leading-none">Week {wIndex + 1}</p>
                                  <p className="text-[8px] font-black uppercase text-stone-700 mt-1 leading-tight">
                                    {monthShort} {String(startDate.getDate()).padStart(2, '0')} – {String(endDate.getDate()).padStart(2, '0')}
                                  </p>
                                </div>
                                <CircularProgress percentage={weekPerc} size={34} strokeWidth={4} color={theme.secondary} trackColor={theme.secondary + '25'} textClassName="text-[8px]" />
                              </div>
                              {/* Divider */}
                              <div className="border-t border-stone-100" />
                              {/* Bottom: completed + day dots */}
                              <div>
                                <p className="text-[7px] font-black uppercase tracking-wider text-stone-400 leading-none mb-1">Completed</p>
                                <div className="flex items-end justify-between gap-1">
                                  <p className="text-base font-black leading-none text-stone-900">{Math.round(weekTotal)}<span className="text-[9px] font-black text-stone-300 ml-0.5">/{Math.round(weekMax)}</span></p>
                                  {/* Per-day dot bars */}
                                  <div className="flex items-end gap-[2px]" style={{ height: 14 }}>
                                    {dayBars.map((pct, di) => (
                                      <div
                                        key={di}
                                        className="w-[5px] rounded-full transition-all duration-500"
                                        style={{
                                          height: pct > 0 ? `${Math.max(5, Math.round(pct / 100 * 14))}px` : '5px',
                                          backgroundColor: pct > 0 ? theme.secondary : '#e7e5e4',
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Trend chart */}
              {view !== 'dashboard' && <div className={`neo-border rounded-2xl overflow-hidden flex flex-col min-h-[220px] ${isDarkMode ? 'bg-[#151515]' : 'bg-[#f9f9f9]'}`}>
                <div className="h-[3px] shrink-0 rounded-t-2xl" style={{ backgroundColor: theme.primary }} />
                <div className="flex flex-col flex-1 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-serif font-black uppercase text-sm tracking-widest">
                      {view === 'monthly' ? 'Monthly Trends' : view === 'weekly' ? 'Weekly Trends' : 'Annual Trends'}
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className={`text-xs font-black px-2 py-1 border-2 border-black ${trendDelta >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {Math.abs(trendDelta).toFixed(0)}% {trendDeltaLabel}
                      </div>
                      <button
                        onClick={() => setChartType(prev => prev === 'area' ? 'bar' : 'area')}
                        className="p-1 hover:bg-stone-200 rounded-sm transition-colors text-stone-400 hover:text-stone-600"
                      >
                        {chartType === 'area' ? <BarChart2 size={12} /> : <Activity size={12} />}
                      </button>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height="100%" minHeight={150} key={view + chartType}>
                    {chartType === 'area' ? (
                      <AreaChart data={trendChartData} margin={{ right: 16, left: 16, bottom: 0, top: 8 }}>
                        <defs>
                          <linearGradient id="colorValSide" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.primary} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={theme.primary} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.14)" : "#ddd"} />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: isDarkMode ? '#a8a8a8' : '#666' }} interval={view === 'monthly' ? 'preserveStartEnd' : 0} minTickGap={0} padding={{ left: 8, right: 8 }} />
                        <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#161616' : '#fff', border: isDarkMode ? '1px solid #2d2d2d' : '2px solid black', color: isDarkMode ? '#ededed' : '#111', fontWeight: 'bold' }} formatter={(value: any, name: string) => [`${value} completed`, name === 'current' ? trendLegendCurrent : trendLegendPrevious]} />
                        <Area type="monotone" dataKey="previous" stroke={theme.secondary} strokeWidth={2} strokeDasharray="6 6" fillOpacity={0} fill="transparent" />
                        <Area type="monotone" dataKey="current" stroke={isDarkMode ? "#d6d6d6" : "#000"} strokeWidth={2.5} fillOpacity={1} fill="url(#colorValSide)" />
                      </AreaChart>
                    ) : (
                      <BarChart data={trendChartData} margin={{ right: 16, left: 16, bottom: 16, top: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.14)" : "#ddd"} />
                        <XAxis dataKey="label" tick={{ fontSize: 8, fontWeight: 'bold', fill: isDarkMode ? '#a8a8a8' : '#666' }} tickLine={false} interval={view === 'monthly' ? 'preserveStartEnd' : 0} minTickGap={0} padding={{ left: 4, right: 4 }} />
                        <YAxis tick={{ fontSize: 8, fontWeight: 'bold', fill: isDarkMode ? '#a8a8a8' : '#666' }} tickLine={false} width={20} domain={[0, 'dataMax + 1']} allowDecimals={false} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: isDarkMode ? '#161616' : '#fff', border: isDarkMode ? '1px solid #2d2d2d' : '2px solid black', color: isDarkMode ? '#ededed' : '#111', fontWeight: 'bold' }} formatter={(value: any, name: string) => [`${value} completed`, name === 'current' ? trendLegendCurrent : trendLegendPrevious]} />
                        <Bar dataKey="previous" fill={theme.secondary} fillOpacity={0.55} radius={[3, 3, 0, 0]} strokeWidth={1} />
                        <Bar dataKey="current" fill={theme.primary} radius={[3, 3, 0, 0]} strokeWidth={1} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>}
              {/* Story panel */}
              {view !== 'dashboard' && <div className="neo-border rounded-2xl flex flex-col overflow-hidden bg-white flex-1 min-h-0">
                <div className="text-white text-[10px] font-black uppercase py-2 text-center tracking-widest border-b-[3px] border-black shrink-0" style={{ backgroundColor: theme.primary }}>
                  {view === 'monthly' ? 'Monthly Success' : view === 'weekly' ? 'Weekly Success' : 'Annual Performance'}
                </div>
                <div className="flex-1 flex flex-col p-3 gap-2 overflow-y-auto min-h-0">
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
                        <div className="w-14 h-14 relative">
                          <PieChart width={56} height={56}>
                            <Pie data={[{ value: monthProgress.completed || 0.1 }, { value: monthProgress.remaining || 0 }]} innerRadius="72%" outerRadius="100%" paddingAngle={2} dataKey="value" startAngle={90} endAngle={450} isAnimationActive={true} animationDuration={800}>
                              <Cell fill={theme.primary} /><Cell fill={isDarkMode ? "#2a2a2a" : "#f0f0f0"} />
                            </Pie>
                          </PieChart>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black" style={{ color: theme.primary }}>{monthProgress.percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 bg-stone-50/50 neo-border rounded-xl p-2 overflow-y-auto">
                        {(() => {
                          const isCurrentMonth = currentMonthIndex === currentMonthOfYear && currentYear === currentFullYear_ref;
                          const daysElapsed = isCurrentMonth ? currentDayOfMonth : new Date(currentYear, currentMonthIndex + 1, 0).getDate();
                          const story = buildMonthlyStory(monthProgress, topHabitsThisMonth, monthDelta, t, daysElapsed);
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5"><Sparkles size={10} className="text-amber-500" /><span className="font-serif text-[9px] font-black uppercase tracking-widest text-stone-500">Your story</span></div>
                              {story.sections.map((section: any, idx: number) => (
                                <p key={idx} className="text-[11px] leading-relaxed font-bold">
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
                          <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest leading-none mb-1">Week progress</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black leading-none">{weekProgress.completed}</span>
                            <span className="text-lg font-black text-stone-300">/ {weekProgress.total}</span>
                          </div>
                        </div>
                        <div className="w-14 h-14 relative">
                          <PieChart width={56} height={56}>
                            <Pie data={[{ value: weekProgress.completed || 0.1 }, { value: weekProgress.remaining || 0 }]} innerRadius="72%" outerRadius="100%" paddingAngle={2} dataKey="value" startAngle={90} endAngle={450} isAnimationActive={true} animationDuration={800}>
                              <Cell fill={theme.primary} /><Cell fill={isDarkMode ? "#2a2a2a" : "#f0f0f0"} />
                            </Pie>
                          </PieChart>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black" style={{ color: theme.primary }}>{weekProgress.percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 bg-stone-50/50 neo-border rounded-xl p-2 overflow-y-auto">
                        {(() => {
                          const daysElapsed = weekOffset === 0
                            ? (startOfWeek === 'sunday' ? today_ref.getDay() + 1 : (today_ref.getDay() === 0 ? 7 : today_ref.getDay()))
                            : 7;
                          const story = buildWeeklyStory(weekProgress, weeklyStats, habits, t, daysElapsed);
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5"><Sparkles size={10} className="text-amber-500" /><span className="font-serif text-[9px] font-black uppercase tracking-widest text-stone-500">Your story</span></div>
                              {story.sections.map((section: any, idx: number) => (
                                <p key={idx} className="text-[11px] leading-relaxed font-bold">
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
                          <div className="flex items-center gap-1.5 mb-1"><Sparkles size={10} className="text-amber-500" /><span className="font-serif text-[9px] font-black uppercase tracking-widest text-stone-500">Annual story</span></div>
                          {annualStory.annualSummary ? (
                            <div>
                              <div className="text-[12px] font-black text-stone-900 truncate">{annualStory.annualSummary.support.strongestHabit?.name || 'Year story'}</div>
                              <p className="text-[10px] font-bold text-stone-500">{annualStory.annualSummary.support.momentumLabel} · {annualStory.annualSummary.support.rhythmLabel}</p>
                            </div>
                          ) : (
                            <p className="text-[11px] font-bold text-stone-500">No significant outcomes yet</p>
                          )}
                        </div>
                        <div className="w-14 h-14 relative shrink-0">
                          <PieChart width={56} height={56}>
                            <Pie data={[{ value: annualStats.totalCompletions || 0.1 }, { value: Math.max(0, annualStats.totalPossible - annualStats.totalCompletions) }]} innerRadius="72%" outerRadius="100%" paddingAngle={2} dataKey="value" startAngle={90} endAngle={450} isAnimationActive={true} animationDuration={800}>
                              <Cell fill={theme.primary} /><Cell fill={isDarkMode ? "#2a2a2a" : "#f0f0f0"} />
                            </Pie>
                          </PieChart>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black" style={{ color: theme.primary }}>{annualCompletionRate.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>}

              {/* ── Dashboard: Year Trend ── */}
              {view === 'dashboard' && (
                <div className="neo-border rounded-2xl overflow-hidden flex flex-col min-h-[200px] bg-[#f9f9f9] shrink-0">
                  <div className="h-[3px] shrink-0 rounded-t-2xl" style={{ backgroundColor: theme.primary }} />
                  <div className="flex flex-col flex-1 p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Year Trend</p>
                      <div className={`text-[9px] font-black px-2 py-1 border border-black ${trendDelta >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trendDelta >= 0 ? '+' : ''}{Math.abs(trendDelta).toFixed(0)}% vs LY
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%" minHeight={140}>
                      <AreaChart data={trendChartData} margin={{ right: 12, left: 12, bottom: 0, top: 6 }}>
                        <defs>
                          <linearGradient id="yearGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.primary} stopOpacity={0.7} />
                            <stop offset="95%" stopColor={theme.primary} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 'bold', fill: '#666' }} interval={0} minTickGap={0} padding={{ left: 8, right: 8 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid black', fontWeight: 'bold' }} formatter={(value: any) => [`${value} completed`]} />
                        <Area type="monotone" dataKey="previous" stroke={theme.secondary} strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={0} fill="transparent" />
                        <Area type="monotone" dataKey="current" stroke="#000" strokeWidth={2} fillOpacity={1} fill="url(#yearGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ── Dashboard: 52-Week Heatmap ── */}
              {view === 'dashboard' && (() => {
                const jan1DayOfWeek = new Date(currentYear, 0, 1).getDay();
                const emptyCells = jan1DayOfWeek;

                const yearCells: { pct: number; month: number }[] = [];
                for (let m = 0; m < 12; m++) {
                  const summary = annualStats.monthlySummaries[m];
                  const days = summary?.days ?? [];
                  days.forEach((d: any, i: number) => {
                    const date = new Date(currentYear, m, i + 1);
                    if (date.getMonth() !== m) return;
                    const pct = d.totalPossible > 0 ? Math.round((d.habitsCompleted / d.totalPossible) * 100) : -1;
                    yearCells.push({ pct, month: m });
                  });
                }

                const allCells: ({ pct: number; month: number } | null)[] = [
                  ...Array(emptyCells).fill(null),
                  ...yearCells,
                ];

                const weekColumns: ({ pct: number; month: number } | null)[][] = [];
                for (let i = 0; i < allCells.length; i += 7) {
                  weekColumns.push(allCells.slice(i, i + 7));
                }

                const monthAbbr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

                const getCellColor = (pct: number) => {
                  if (pct < 0) return '#f5f5f4';
                  if (pct === 0) return '#e7e5e4';
                  if (pct < 50) return theme.secondary + '60';
                  if (pct < 100) return theme.secondary + 'aa';
                  return theme.primary;
                };

                return (
                  <div className="neo-border rounded-2xl overflow-hidden bg-white shrink-0">
                    <div className="h-[3px] rounded-t-2xl" style={{ backgroundColor: theme.secondary }} />
                    <div className="p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-3">52-Week Map</p>
                      <div className="overflow-x-auto">
                        <div className="flex gap-[3px]" style={{ minWidth: 'max-content' }}>
                          {weekColumns.map((week, wi) => (
                            <div key={wi} className="flex flex-col gap-[3px]">
                              {Array.from({ length: 7 }, (_, di) => {
                                const cell = week[di] ?? null;
                                return (
                                  <div
                                    key={di}
                                    className="w-[10px] h-[10px] rounded-[2px]"
                                    style={{ backgroundColor: cell ? getCellColor(cell.pct) : 'transparent' }}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                        <div className="flex mt-1 gap-[3px]">
                          {(() => {
                            const labels: React.ReactNode[] = [];
                            let cellIdx = emptyCells;
                            for (let m = 0; m < 12; m++) {
                              const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
                              labels.push(
                                <div key={m} style={{ width: Math.ceil(daysInMonth / 7) * 13, minWidth: 0 }}>
                                  <span className="text-[7px] font-black text-stone-300 uppercase">{monthAbbr[m]}</span>
                                </div>
                              );
                              cellIdx += daysInMonth;
                            }
                            return labels;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Dashboard: Seasonal Breakdown ── */}
              {view === 'dashboard' && (() => {
                const seasons = [
                  { name: 'Winter', label: 'Dec–Feb', months: [11, 0, 1] },
                  { name: 'Spring', label: 'Mar–May', months: [2, 3, 4] },
                  { name: 'Summer', label: 'Jun–Aug', months: [5, 6, 7] },
                  { name: 'Fall',   label: 'Sep–Nov', months: [8, 9, 10] },
                ].map(s => {
                  const data = s.months.map(m => annualStats.monthlySummaries[m]).filter((m: any) => m && !m.isFutureMonth && m.total > 0);
                  const avg = data.length > 0 ? Math.round(data.reduce((acc: number, m: any) => acc + m.rate, 0) / data.length) : null;
                  return { ...s, avg };
                });
                const maxAvg = Math.max(...seasons.map(s => s.avg ?? 0));

                return (
                  <div className="neo-border rounded-2xl overflow-hidden bg-white shrink-0">
                    <div className="h-[3px] rounded-t-2xl" style={{ backgroundColor: theme.secondary }} />
                    <div className="p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-3">Seasonal Patterns</p>
                      <div className="grid grid-cols-4 gap-2">
                        {seasons.map(s => {
                          const isBest = s.avg !== null && s.avg === maxAvg && maxAvg > 0;
                          return (
                            <div key={s.name} className={`rounded-xl border p-2 text-center relative overflow-hidden ${isBest ? 'border-black border-2' : 'border-stone-200'}`}>
                              {s.avg !== null && s.avg > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 transition-all duration-500" style={{ height: `${s.avg}%`, backgroundColor: isBest ? theme.primary : theme.secondary, opacity: isBest ? 0.2 : 0.15 }} />
                              )}
                              <p className="relative text-[8px] font-black uppercase tracking-wide text-stone-500">{s.name}</p>
                              <p className="relative text-base font-black leading-tight mt-0.5 text-stone-900">{s.avg !== null ? `${s.avg}%` : '—'}</p>
                              <p className="relative text-[7px] font-bold text-stone-400">{s.label}</p>
                              {isBest && <p className="relative text-[7px] font-black" style={{ color: theme.primary }}>PEAK</p>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Dashboard: Weekday Pattern ── */}
              {view === 'dashboard' && (
                <div className="neo-border rounded-2xl overflow-hidden bg-white shrink-0">
                  <div className="h-[3px] rounded-t-2xl" style={{ backgroundColor: theme.secondary }} />
                  <div className="p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-2">Weekday Pattern</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Weekdays', rate: Math.round(annualStats.weekdayRate ?? 0) },
                        { label: 'Weekends', rate: Math.round(annualStats.weekendRate ?? 0) },
                      ].map(({ label, rate }) => {
                        const isBetter = label === 'Weekdays'
                          ? (annualStats.weekdayRate ?? 0) >= (annualStats.weekendRate ?? 0)
                          : (annualStats.weekendRate ?? 0) > (annualStats.weekdayRate ?? 0);
                        return (
                          <div key={label} className={`rounded-xl border relative overflow-hidden p-2 ${isBetter ? 'border-black border-2' : 'border-stone-200'}`}>
                            <div className="absolute bottom-0 left-0 right-0" style={{ height: `${rate}%`, backgroundColor: isBetter ? theme.primary : theme.secondary, opacity: 0.15 }} />
                            <p className="relative text-[8px] font-black uppercase text-stone-500">{label}</p>
                            <p className="relative text-xl font-black leading-none mt-0.5" style={{ color: isBetter ? theme.primary : undefined }}>{rate}%</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Best / Needs Focus ── */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="neo-border rounded-2xl overflow-hidden bg-white">
                  <div className="h-[3px] rounded-t-2xl bg-emerald-400" />
                  <div className="p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                      {view === 'weekly' ? 'Best This Week' : view === 'monthly' ? 'Best This Month' : 'Best This Year'}
                    </span>
                    {statsBestHabit ? (
                      <>
                        <span className="text-sm font-black leading-tight break-words">{statsBestHabit.name}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${Math.min(100, Math.round(statsBestHabit.rate))}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-emerald-600">{Math.round(statsBestHabit.rate)}%</span>
                        </div>
                      </>
                    ) : <span className="text-xs text-stone-300 font-bold">No data yet</span>}
                  </div>
                </div>
                <div className="neo-border rounded-2xl overflow-hidden bg-white">
                  <div className="h-[3px] rounded-t-2xl bg-rose-300" />
                  <div className="p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-rose-300">
                      {view === 'weekly' ? 'Needs Focus' : view === 'monthly' ? 'Needs Focus' : 'Needs Focus'}
                    </span>
                    {statsWorstHabit ? (
                      <>
                        <span className="text-sm font-black leading-tight break-words">{statsWorstHabit.name}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                            <div className="h-full rounded-full bg-rose-300 transition-all" style={{ width: `${Math.min(100, Math.round(statsWorstHabit.rate))}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-rose-400">{Math.round(statsWorstHabit.rate)}%</span>
                        </div>
                      </>
                    ) : <span className="text-xs text-stone-300 font-bold">On track</span>}
                  </div>
                </div>
              </div>

              {/* ── Habit Leaderboard ── */}
              {(() => {
                const list = view === 'weekly' ? weekHabitPerformance :
                  view === 'monthly' ? topHabitsThisMonth.map((h: any) => ({ ...h, rate: h.percentage })) :
                  annualStats.topHabits;
                if (!list || list.length === 0) return null;
                return (
                  <div className="neo-border rounded-2xl overflow-hidden bg-white shrink-0">
                    <div className="h-[3px] rounded-t-2xl" style={{ backgroundColor: theme.primary }} />
                    <div className="p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-3">
                        {view === 'weekly' ? 'Weekly Leaderboard' : view === 'monthly' ? 'Monthly Leaderboard' : 'Top Habits'}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {list.slice(0, 6).map((h: any, i: number) => {
                          const pct = Math.min(100, Math.round(h.rate ?? 0));
                          const hasCount = h.completed != null && h.total != null && Math.round(h.total) > 0;
                          return (
                            <div key={h.id ?? i} className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-stone-300 w-3 text-right shrink-0">{i + 1}</span>
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: h.color || theme.primary }} />
                              <span className="text-[11px] font-bold text-stone-700 flex-1 min-w-0 truncate">{h.name}</span>
                              {hasCount && <span className="text-[9px] font-black text-stone-300 shrink-0">{Math.round(h.completed)}/{Math.round(h.total)}</span>}
                              <div className="w-14 h-1.5 rounded-full bg-stone-100 overflow-hidden shrink-0">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: theme.primary }} />
                              </div>
                              <span className="text-[10px] font-black w-7 text-right shrink-0" style={{ color: theme.primary }}>{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Analytics heatmap ── */}
              {view !== 'dashboard' && <div className="neo-border rounded-2xl overflow-hidden bg-white shrink-0">
                <div className="h-[3px] rounded-t-2xl" style={{ backgroundColor: theme.secondary }} />
                <div className="p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-3">
                    {view === 'weekly' ? 'Day Breakdown' : view === 'monthly' ? 'Month Heatmap' : 'Year Overview'}
                  </p>

                  {view === 'weekly' && (() => {
                    const weekStart_dates = (() => {
                      const now = new Date();
                      const day = now.getDay();
                      const diff = startOfWeek === 'monday'
                        ? now.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * 7
                        : now.getDate() - day + weekOffset * 7;
                      return new Date(now.getFullYear(), now.getMonth(), diff);
                    })();
                    const MOOD_MAP: Record<number, { icon: React.ElementType; color: string; bg: string }> = {
                      1: { icon: Angry,  color: '#ef4444', bg: '#fee2e2' },
                      2: { icon: Frown,  color: '#f97316', bg: '#ffedd5' },
                      3: { icon: Meh,    color: '#eab308', bg: '#fef9c3' },
                      4: { icon: Smile,  color: '#84cc16', bg: '#ecfccb' },
                      5: { icon: Laugh,  color: '#10b981', bg: '#d1fae5' },
                    };
                    const days = weeklyStats.map((d: any, i: number) => {
                      const date = new Date(weekStart_dates);
                      date.setDate(weekStart_dates.getDate() + i);
                      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      const dueHabits = habits.filter((h: any) => !h.weeklyTarget && (!h.frequency || h.frequency.includes(date.getDay())));
                      const doneCount = dueHabits.filter((h: any) => checkCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear())).length;
                      const pct = dueHabits.length > 0 ? Math.round((doneCount / dueHabits.length) * 100) : 0;
                      const isToday = date.toDateString() === new Date().toDateString();
                      const moodVal = notes[dateKey]?.mood;
                      const moodMeta = typeof moodVal === 'number' ? MOOD_MAP[moodVal] ?? null : null;
                      const label = d.displayDay.slice(0, 2).toUpperCase();
                      return { pct, isToday, moodMeta, label };
                    });
                    return (
                      <div className="flex flex-col gap-2">
                        {/* Day labels */}
                        <div className="flex gap-2">
                          {days.map((d, i) => (
                            <div key={i} className="flex-1 text-center">
                              <span className={`text-[10px] font-black uppercase ${d.isToday ? 'text-black' : 'text-stone-400'}`}>{d.label}</span>
                            </div>
                          ))}
                        </div>
                        {/* Completion tiles */}
                        <div className="flex gap-2">
                          {days.map((d, i) => (
                            <div key={i} className={`relative flex-1 aspect-square rounded-xl overflow-hidden flex items-end justify-center pb-1.5 ${d.isToday ? 'border-2 border-black' : 'border border-stone-200'} ${d.pct === 0 ? 'bg-stone-50' : ''}`}>
                              {d.pct > 0 && <div className="absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out" style={{ height: `${d.pct}%`, backgroundColor: d.pct >= 100 ? theme.primary : theme.secondary, opacity: d.pct >= 100 ? 1 : 0.8 }} />}
                              <span className={`relative text-xs font-black leading-none ${d.pct >= 50 ? 'text-white' : d.pct === 0 ? 'text-stone-300' : 'text-stone-700'}`}>{d.pct}%</span>
                            </div>
                          ))}
                        </div>
                        {/* Mood tiles */}
                        <div className="flex gap-2">
                          {days.map((d, i) => {
                            const MoodIcon = d.moodMeta?.icon;
                            return (
                              <div key={i} className={`relative flex-1 aspect-square rounded-xl overflow-hidden flex items-center justify-center ${d.isToday ? 'border-2 border-black' : 'border border-stone-200'}`} style={{ backgroundColor: d.moodMeta?.bg || '#f9fafb' }}>
                                {MoodIcon
                                  ? <MoodIcon size={20} color={d.moodMeta!.color} strokeWidth={2.5} />
                                  : <span className="text-[10px] font-black text-stone-300">—</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {view === 'monthly' && (() => {
                    const firstDay = new Date(currentYear, currentMonthIndex, 1).getDay();
                    const offset_days = startOfWeek === 'monday' ? (firstDay === 0 ? 6 : firstDay - 1) : firstDay;
                    const dayLabels = startOfWeek === 'monday' ? ['M','T','W','T','F','S','S'] : ['S','M','T','W','T','F','S'];
                    return (
                      <div>
                        <div className="grid grid-cols-7 gap-1 mb-1.5">
                          {dayLabels.map((l, i) => (
                            <div key={i} className="text-center text-[8px] font-black text-stone-300">{l}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: offset_days }).map((_, i) => <div key={`e${i}`} />)}
                          {dailyStats.map((d: any) => {
                            const pct = d.totalDue > 0 ? Math.round((d.count / d.totalDue) * 100) : -1;
                            const isToday = d.day === new Date().getDate() && currentMonthIndex === new Date().getMonth() && currentYear === new Date().getFullYear();
                            const cellDateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
                            const cellNote = notes[cellDateKey];
                            const moodVal = cellNote && !Array.isArray(cellNote) ? (cellNote as any).mood : undefined;
                            const MOOD_ICON_MAP: Record<number, React.ElementType> = { 1: Angry, 2: Frown, 3: Meh, 4: Smile, 5: Laugh };
                            const MOOD_COLOR_MAP: Record<number, string> = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#84cc16', 5: '#10b981' };
                            const CellMoodIcon = typeof moodVal === 'number' ? MOOD_ICON_MAP[moodVal] : null;
                            const cellMoodColor = typeof moodVal === 'number' ? MOOD_COLOR_MAP[moodVal] : null;
                            return (
                              <div
                                key={d.day}
                                className={`aspect-square rounded-lg border relative overflow-hidden ${isToday ? 'border-black border-2' : 'border-stone-200'}`}
                                style={{ backgroundColor: '#fafaf9' }}
                              >
                                {/* Bottom fill to pct */}
                                {pct > 0 && (
                                  <div className="absolute bottom-0 left-0 right-0 transition-all duration-500" style={{ height: `${pct}%`, backgroundColor: pct >= 100 ? theme.primary : theme.secondary, opacity: 0.82 }} />
                                )}
                                {/* Day — top left */}
                                <span className={`absolute top-1 left-1 text-[10px] font-black leading-none z-10 ${pct >= 90 ? 'text-white' : 'text-stone-700'}`}>{d.day}</span>
                                {/* Mood — center */}
                                {CellMoodIcon && (
                                  <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <CellMoodIcon size={16} style={{ fill: cellMoodColor!, color: '#44403c', strokeWidth: 1.5 }} />
                                  </div>
                                )}
                                {/* % — bottom center */}
                                <div className="absolute bottom-1 left-0 right-0 flex justify-center z-10">
                                  <span className={`text-[10px] font-black leading-none ${pct >= 40 ? 'text-white' : pct >= 0 ? 'text-stone-600' : 'text-stone-300'}`}>
                                    {pct >= 0 ? `${pct}%` : '—'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {view === 'dashboard' && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {annualStats.monthlySummaries.map((m: any, i: number) => {
                        const pct = Math.round(m.rate || 0);
                        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        const isCurrent = i === new Date().getMonth() && currentYear === new Date().getFullYear();
                        return (
                          <div key={i} className={`rounded-lg border-2 overflow-hidden flex flex-col items-center py-2 gap-1 relative ${isCurrent ? 'border-black' : 'border-stone-200'}`}>
                            <div className="absolute inset-0" style={{ backgroundColor: theme.secondary, opacity: pct >= 100 ? 0 : pct / 100 * 0.7 }} />
                            {pct >= 100 && <div className="absolute inset-0" style={{ backgroundColor: theme.primary }} />}
                            <span className={`relative text-[8px] font-black uppercase ${pct >= 60 ? 'text-white' : 'text-stone-500'}`}>{monthNames[i]}</span>
                            <span className={`relative text-[10px] font-black ${pct >= 60 ? 'text-white' : 'text-stone-800'}`}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>}
              </>}

                  </div>
                ) : (
                  <div className="flex-1 min-h-0 flex items-center justify-center cursor-pointer group" onClick={() => setConfiguringSlot('bottom')}>
                    <div className="flex flex-col items-center gap-2 text-stone-300 group-hover:text-stone-500 transition-colors pointer-events-none">
                      <Plus size={24} strokeWidth={2} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Add panel</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      <BottomNav
        view={view}
        setView={setView}
        resetWeekOffset={resetWeekOffset}
        theme={theme}
      />

      {isTasksOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm"
          onClick={() => setIsTasksOpen(false)}
        >
          <div
            className="bg-white neo-border neo-shadow rounded-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ maxHeight: 'min(85vh, 680px)' }}
            onClick={e => e.stopPropagation()}
          >
            <TasksView notes={notes} updateNote={updateNote} theme={theme} onClose={() => setIsTasksOpen(false)} />
          </div>
        </div>
      )}

      {isListsOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm"
          onClick={() => setIsListsOpen(false)}
        >
          <div
            className="bg-white neo-border neo-shadow rounded-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ maxHeight: 'min(85vh, 680px)' }}
            onClick={e => e.stopPropagation()}
          >
            <ListsView
              lists={lists}
              getItemsForList={getItemsForList}
              onClose={() => setIsListsOpen(false)}
              theme={theme}
              onCreateList={createList}
              onUpdateList={updateList}
              onDeleteList={deleteList}
              onAddItem={addItem}
              onUpdateItem={updateItem}
              onDeleteItem={deleteItem}
            />
          </div>
        </div>
      )}

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          if (hasUnreadFeedback) {
            setHasUnreadFeedback(false);
            localStorage.setItem('habit_feedback_last_read', Date.now().toString());
          }
        }}
        userId={session?.user?.id}
        userEmail={session?.user?.email}
        hasUnreadFeedback={hasUnreadFeedback}
      />

      <StreakModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        habits={habits}
        topHabits={annualStats.allTopHabits}
        theme={theme}
        globalCurrentStreak={annualStats.currentStreak}
        globalMaxStreak={annualStats.maxStreak}
        annualStats={annualStats}
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

// Sign In Page Component
const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, THEMES } = useTheme();
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('habit_color_mode');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [cardStyle, setCardStyle] = useState<'compact' | 'large'>(() => {
    const saved = localStorage.getItem('habit_card_style');
    return saved === 'compact' ? 'compact' : 'large';
  });
  const [currentYear] = useState(new Date().getFullYear());
  const [currentMonthIndex] = useState(new Date().getMonth());

  useEffect(() => {
    document.documentElement.setAttribute('data-color-mode', colorMode);
    document.documentElement.style.colorScheme = colorMode;
  }, [colorMode]);

  const handleContinueAsGuest = () => {
    localStorage.setItem('habit_guest_mode', 'true');
    navigate('/app');
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto bg-[#F4F4F0]">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Showcase Background */}
      <div className="absolute inset-0 z-0 opacity-75 blur-[4px] pointer-events-none scale-105">
        <div className="max-w-7xl mx-auto p-4 space-y-4">
          <Header
            view="dashboard" setView={() => { }}
            currentYear={currentYear} setCurrentYear={() => { }}
            currentMonthIndex={currentMonthIndex} setCurrentMonthIndex={() => { }}
            navigateMonth={() => { }} navigateWeek={() => { }} resetWeekOffset={() => { }}
            theme={theme} setTheme={() => { }} themes={THEMES}
            settingsOpen={false} setSettingsOpen={() => { }} settingsRef={{ current: null } as any}
            guestMode={true} setGuestMode={() => { }} handleLogout={() => { }}
            monthProgress={{ completed: 140, total: 200, percentage: 70, remaining: 60 }}
              annualStats={DEMO_ANNUAL_STATS}
              dailyStats={[]} previousDailyStats={[]} weeklyStats={[]} previousWeeklyStats={[]} weekProgress={{ completed: 25, total: 28, percentage: 89 }}
              habits={DEMO_HABITS} defaultView="dashboard" setDefaultView={() => { }}
              colorMode={colorMode} setColorMode={setColorMode}
              cardStyle={cardStyle} setCardStyle={setCardStyle}
              addHabit={async () => ''} updateHabit={async () => { }} removeHabit={async () => { }}
              weekDelta={12} monthDelta={5} annualDelta={9} monthlyGoals={{}} updateMonthlyGoals={() => { }}
              previousAnnualMonthlySummaries={DEMO_ANNUAL_STATS.monthlySummaries}
              topHabitsThisMonth={[]} weekOffset={0}
            isHabitModalOpen={false} setIsHabitModalOpen={() => { }}
            isResolutionsModalOpen={false} setIsResolutionsModalOpen={() => { }}
            isStreakModalOpen={false} setIsStreakModalOpen={() => { }}
            reorderHabits={async () => { }}
              onReportBug={() => { }}
              onOpenWhatsNew={() => { }}
              onOpenTutorial={() => { }}
              onExportData={() => { }}
              onViewJournal={() => { }}
              isExportingData={false}
              hasUnseenWhatsNew={false}
              hasUnreadFeedback={false}
            onSearch={() => { }}
            onLogToday={() => { }}
            logTodayStatus="empty"
          />
          <DashboardView
            annualStats={DEMO_ANNUAL_STATS}
            habits={DEMO_HABITS}
            theme={theme}
            currentYear={currentYear}
            setCurrentMonthIndex={() => { }}
            setView={() => { }}
            monthlyGoals={{}}
            updateMonthlyGoals={() => { }}
          />
        </div>
      </div>

      <div className="relative z-10 w-full min-h-screen flex items-start sm:items-center justify-center p-4 sm:py-6">
        <div className="absolute inset-0 bg-transparent"></div>
        <AuthForm onContinueAsGuest={handleContinueAsGuest} />
      </div>

    </div>
  );
};

// Handles password-reset email links — shows the form once the recovery session is confirmed
const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // With PKCE flow, supabase-js exchanges the code from the URL synchronously during
    // createClient(), before this component mounts. The PASSWORD_RECOVERY event fires then
    // and is missed by onAuthStateChange. So we check getSession() immediately as well.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready) return <LoadingScreen />;
  return <UpdatePasswordForm onSuccess={() => navigate('/app', { replace: true })} />;
};

// Handles email confirmation links → establishes session → redirects to app
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/app', { replace: true });
      } else {
        // Token is in the URL fragment — Supabase JS picks it up automatically on load
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            subscription.unsubscribe();
            navigate('/app', { replace: true });
          }
        });
      }
    });
  }, []);

  return null;
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [guestMode, setGuestMode] = useState(() => {
    return localStorage.getItem('habit_guest_mode') === 'true';
  });
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        setGuestMode(false);
        localStorage.removeItem('habit_guest_mode');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check for extension login
  const urlParams = new URLSearchParams(location.search);
  const isExtensionLogin = urlParams.get('source') === 'extension';

  if (loading) {
    return <LoadingScreen />;
  }

  // If extension login and has session, allow through (AppContent will handle the special view)
  if (isExtensionLogin && session) {
    return <>{children}</>;
  }

  // If not authenticated and not in guest mode, redirect to signin
  if (!session && !guestMode) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

// Intercepts PASSWORD_RECOVERY events from anywhere in the app and redirects to /update-password.
// Needed because Supabase may redirect to the site root (not /update-password) if that URL
// isn't in the dashboard's allowed redirect list — LandingPage then ships the user to /app
// before AppContent's own PASSWORD_RECOVERY listener has a chance to mount.
const PasswordRecoveryGuard: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    // Listener must never be torn down mid-route-change — drop location.pathname from deps.
    // Navigating to /update-password when already there is harmless (replace: true).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/update-password', { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  return null;
};

// Main App Component with Routing
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <PasswordRecoveryGuard />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<LandingPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route
          path="/privacy"
          element={
            <PrivacyPolicy
              onOpenFeedback={() => {
                window.location.href = 'mailto:support@habicard.com?subject=Privacy%20Policy%20Feedback';
              }}
            />
          }
        />

        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
