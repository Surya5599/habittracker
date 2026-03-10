import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import i18n from './i18n';
import { X, Search, Key, ChevronLeft, ChevronRight } from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabase';
import './i18n';
import { AuthForm } from './components/AuthForm';
import { UpdatePasswordForm } from './components/UpdatePasswordForm';
import { Header } from './components/Header';
import { MonthlyView } from './components/MonthlyView';
import { DashboardView } from './components/DashboardView';
import { WeeklyView } from './components/WeeklyView';
import { useHabits } from './hooks/useHabits';
import { useTheme } from './hooks/useTheme';
import { useHabitStats } from './hooks/useHabitStats';
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
import { StreakModal } from './components/StreakModal';
import { SearchModal } from './components/SearchModal';
import { MonthlyTabSurveyModal } from './components/MonthlyTabSurveyModal';
import { PrivacyPolicy } from './pages/PrivacyPolicy';

const ADMIN_EMAILS = ((import.meta.env.VITE_ADMIN_EMAILS as string | undefined) || 'admin@habicard.com,knowheredeveloper@gmail.com')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);
const WHATS_NEW_VERSION = '2026_06';
const WHATS_NEW_SEEN_KEY = 'habit_whats_new_seen_version';
const MONTHLY_TAB_SURVEY_MIN_ACCOUNT_AGE_MS = 5 * 24 * 60 * 60 * 1000;
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWhatsNewModal, setShowWhatsNewModal] = useState(false);
  const [hasUnseenWhatsNew, setHasUnseenWhatsNew] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showMonthlyTabSurvey, setShowMonthlyTabSurvey] = useState(false);
  const [submittingMonthlyTabSurvey, setSubmittingMonthlyTabSurvey] = useState(false);
  const [monthlyTabSurveyChecked, setMonthlyTabSurveyChecked] = useState(false);
  const [hasAnsweredMonthlyTabSurvey, setHasAnsweredMonthlyTabSurvey] = useState(false);
  const [dismissedMonthlyTabSurveyThisSession, setDismissedMonthlyTabSurveyThisSession] = useState(false);

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

  const monthlyTabSurveyStorageKey = session?.user?.id
    ? `habit_monthly_tab_survey_seen_${session.user.id}`
    : null;

  useEffect(() => {
    const checkMonthlyTabSurveyStatus = async () => {
    if (!session?.user?.id || guestMode || isImpersonating) {
      setMonthlyTabSurveyChecked(false);
      setHasAnsweredMonthlyTabSurvey(false);
      setDismissedMonthlyTabSurveyThisSession(false);
      return;
    }

      setMonthlyTabSurveyChecked(false);
      try {
        const { data, error } = await supabase
          .from('feedback')
          .select('id')
          .eq('user_id', session.user.id)
          .contains('metadata', { surveyType: 'monthly_tab_usage' })
          .limit(1);

        if (error) throw error;

        const hasResponse = Array.isArray(data) && data.length > 0;
        setHasAnsweredMonthlyTabSurvey(hasResponse);
        if (hasResponse && monthlyTabSurveyStorageKey) {
          localStorage.setItem(monthlyTabSurveyStorageKey, 'true');
        }
      } catch (error) {
        console.error('Failed to check monthly tab survey status:', error);
        const seenLocally = monthlyTabSurveyStorageKey
          ? localStorage.getItem(monthlyTabSurveyStorageKey) === 'true'
          : false;
        setHasAnsweredMonthlyTabSurvey(seenLocally);
      } finally {
        setMonthlyTabSurveyChecked(true);
      }
    };

    checkMonthlyTabSurveyStatus();
  }, [session?.user?.id, guestMode, isImpersonating, monthlyTabSurveyStorageKey]);

  const shouldAskMonthlyTabSurvey = useMemo(() => {
    if (!session?.user?.id || guestMode || isImpersonating) return false;
    if (showOnboarding || showWhatsNewModal || showMonthlyTabSurvey) return false;
    if (!session.user.created_at) return false;
    if (!monthlyTabSurveyChecked || hasAnsweredMonthlyTabSurvey || dismissedMonthlyTabSurveyThisSession) return false;

    const accountCreatedAt = new Date(session.user.created_at).getTime();
    if (Number.isNaN(accountCreatedAt)) return false;

    return (Date.now() - accountCreatedAt) >= MONTHLY_TAB_SURVEY_MIN_ACCOUNT_AGE_MS;
  }, [
    session?.user?.id,
    session?.user?.created_at,
    guestMode,
    isImpersonating,
    showOnboarding,
    showWhatsNewModal,
    showMonthlyTabSurvey,
    monthlyTabSurveyChecked,
    hasAnsweredMonthlyTabSurvey,
    dismissedMonthlyTabSurveyThisSession
  ]);

  useEffect(() => {
    if (!shouldAskMonthlyTabSurvey) return;

    const timer = window.setTimeout(() => {
      setShowMonthlyTabSurvey(true);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [shouldAskMonthlyTabSurvey]);

  const handleWhatsNewFinish = () => {
    markWhatsNewAsSeen();
    setView('weekly');
    setShowWhatsNewModal(false);
  };

  const markMonthlyTabSurveySeen = () => {
    if (monthlyTabSurveyStorageKey) {
      localStorage.setItem(monthlyTabSurveyStorageKey, 'true');
    }
  };

  const handleCloseMonthlyTabSurvey = () => {
    setDismissedMonthlyTabSurveyThisSession(true);
    setShowMonthlyTabSurvey(false);
  };

  const handleSubmitMonthlyTabSurvey = async (payload: { answer: 'often' | 'sometimes' | 'never' }) => {
    if (!session?.user?.id) return;

    setSubmittingMonthlyTabSurvey(true);
    try {
      const labelMap = {
        often: 'Often',
        sometimes: 'Sometimes',
        never: 'Never'
      } as const;

      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: session.user.id,
          type: 'suggestion',
          status: 'closed',
          content: `Monthly tab survey: ${labelMap[payload.answer]}`,
          metadata: {
            surveyType: 'monthly_tab_usage',
            answer: payload.answer,
            triggeredView: view,
            accountCreatedAt: session.user.created_at || null,
            reporterEmail: session.user.email || null,
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;

      markMonthlyTabSurveySeen();
      setHasAnsweredMonthlyTabSurvey(true);
      setShowMonthlyTabSurvey(false);
      toast.success('Thanks for the feedback.');
    } catch (error) {
      console.error('Monthly tab survey error:', error);
      toast.error('Failed to submit survey. Please try again.');
    } finally {
      setSubmittingMonthlyTabSurvey(false);
    }
  };

  const whatsNewSlides = useMemo(() => ([
    {
      id: 'status-bar',
      title: 'New Status Bar',
      description: 'Tap Habits, Tasks, or Journal to switch instantly.',
      bullets: [
        'Counts and icons update for the day.'
      ],
      image: (
        <img src="/whats-new/status-bar.png" alt="Status bar for Habits, Tasks, and Journal" className="w-full h-44 object-contain bg-stone-100 border border-stone-200 rounded-sm" />
      )
    },
    {
      id: 'skip-habit',
      title: 'Skip Habits Without Penalty',
      description: 'Right-click a habit checkbox to skip it.',
      bullets: [
        'Skipped habits do not lower your completion rate.'
      ],
      image: (
        <div className="w-full border border-stone-200 rounded-sm bg-white p-3">
          <div className="flex items-center justify-between border border-stone-200 rounded px-3 py-2 bg-stone-50">
            <div className="min-w-0">
              <p className="text-sm font-black text-stone-800 truncate">Morning Run</p>
              <p className="text-[11px] font-bold text-stone-500">Right-click to skip</p>
            </div>
            <div className="w-6 h-6 border-2 border-black rounded-sm bg-[#facc15] flex items-center justify-center">
              <span className="text-[10px] font-black text-black leading-none">-</span>
            </div>
          </div>
          <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-[#ca8a04]">Skipped = No Penalty</p>
        </div>
      )
    },
    {
      id: 'language-support',
      title: 'Language Support',
      description: 'Choose your app language in Settings.',
      bullets: [
        'Tap Settings → Language, then pick your preferred language.'
      ],
      image: (
        <img src="/whats-new/language-support.png" alt="Language selection in settings" className="w-full h-44 object-contain bg-stone-100 border border-stone-200 rounded-sm" />
      )
    },
    {
      id: 'dark-mode',
      title: 'Dark Mode',
      description: 'You can use dark mode now.',
      bullets: [
        'Tap Settings → Appearance, then choose Dark.'
      ],
      image: (
        <div className="w-full h-44 border border-stone-200 rounded-sm bg-[#121212] flex items-center justify-center">
          <div className="w-[88%] max-w-[300px] border border-[#2d2d2d] rounded-lg p-3 bg-[#1a1a1a]">
            <div className="h-2.5 w-20 rounded bg-[#2a2a2a] mb-2" />
            <div className="h-2.5 w-full rounded bg-[#252525] mb-2" />
            <div className="h-2.5 w-[80%] rounded bg-[#252525]" />
          </div>
        </div>
      )
    },
    {
      id: 'card-style',
      title: 'Card Style Options',
      description: 'Choose how day progress appears on your daily card.',
      bullets: [
        'Tap Settings → Appearance → Card Style.'
      ],
      image: (
        <div className="w-full border border-stone-200 rounded-sm bg-stone-100 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-black overflow-hidden bg-white">
              <div className="flex items-center justify-between px-2 py-2 bg-[#9ab4c1]">
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-wider text-white">Thursday</p>
                  <p className="text-[7px] font-bold text-white/85">Jan 1, 2026</p>
                </div>
                <div className="w-7 h-7 rounded-full border-[3px] border-white/35 border-r-white flex items-center justify-center text-[7px] font-black text-white">
                  40
                </div>
              </div>
              <div className="px-2 py-3 bg-stone-50">
                <div className="h-2 rounded bg-stone-200 mb-1.5"></div>
                <div className="h-2 rounded bg-stone-200 w-4/5"></div>
              </div>
              <div className="px-2 py-1 border-t border-stone-200 text-[8px] font-black uppercase tracking-widest text-stone-500">
                Compact
              </div>
            </div>

            <div className="rounded-xl border border-black overflow-hidden bg-white">
              <div className="px-2 py-2 bg-[#9ab4c1] text-center">
                <p className="text-[8px] font-black uppercase tracking-wider text-white">Thursday</p>
                <p className="text-[7px] font-bold text-white/85">Jan 1, 2026</p>
              </div>
              <div className="px-2 py-2 bg-stone-50 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-[5px] border-stone-200 border-r-[#9ab4c1] flex items-center justify-center text-[10px] font-black text-stone-700">
                  40%
                </div>
                <div className="mt-2 h-2 rounded bg-stone-200 w-full"></div>
              </div>
              <div className="px-2 py-1 border-t border-stone-200 text-[8px] font-black uppercase tracking-widest text-stone-500">
                Large
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'export-data',
      title: 'Export Your Data',
      description: 'Download your HabiCard data directly from Settings.',
      bullets: [
        'Tap Settings → Data → Export Data.'
      ],
      image: (
        <div className="w-full rounded-sm border border-stone-200 bg-stone-100 p-3">
          <div className="mx-auto max-w-[320px] rounded-2xl border border-black bg-white p-3 shadow-[4px_4px_0_0_rgba(0,0,0,0.08)]">
            <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-2">
              <div className="flex items-center gap-2 px-2 pb-2">
                <div className="h-3 w-3 rounded-sm bg-stone-300" />
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Data</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-2">
                <span className="text-[10px] font-bold uppercase text-stone-600">Export Data</span>
                <span className="text-[10px] font-black uppercase text-stone-700">Download</span>
              </div>
            </div>
            <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-stone-500">
              One tap from Settings
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'daily-view-combined',
      title: 'Daily View Together',
      description: 'See Habits, Tasks, and Journal in one daily view.',
      bullets: [
        'Click on the Day/Date of the card to see the full day view.'
      ],
      image: (
        <div className="w-full bg-stone-100 border border-stone-200 rounded-sm p-1">
          <img
            src="/whats-new/daily-habit-view.gif"
            alt="Daily view preview with habits tasks and journal together"
            className="w-full h-56 object-contain rounded-sm bg-stone-100"
          />
        </div>
      )
    }
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
      // Optional: Set up realtime subscription? For now, fetch on load is enough.
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
    weeklyStats,
    weekProgress,
    prevWeekProgress,
    weekDelta,
    monthDelta,
    allTimeBestWeek,
    monthProgress,
    topHabitsThisMonth,
    annualStats
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

    const isEmpty =
      (!updatedNote.tasks || updatedNote.tasks.length === 0) &&
      !updatedNote.mood &&
      !updatedNote.journal &&
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
    // @ts-ignore - totalDue is added in hook
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
    const hasJournal = Boolean(normalizedDayData.journal && normalizedDayData.journal.trim());
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

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
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

  // If this was opened by the extension and we are logged in, show a success message
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('source') === 'extension' && session) {
    return (
      <div className="min-h-screen bg-[#e5e5e5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto border-2 border-green-500">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-xl font-black uppercase tracking-widest text-[#444]">
            Signed in!
          </h2>
          <p className="text-stone-500">
            You are now signed in to HabiCard. You can close this tab and return to the extension.
          </p>
          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={() => window.close()}
              className="px-6 py-2 bg-black text-white text-sm font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              Close Tab
            </button>
            <button
              onClick={() => window.location.href = window.location.origin}
              className="px-6 py-2 bg-white text-black border-2 border-black text-sm font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors"
            >
              See Web App
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-[100svh] md:h-[100svh] overflow-y-auto md:overflow-hidden bg-[#e5e5e5] p-2 sm:p-4 pb-20 sm:pb-4 font-sans text-[#444] relative w-full max-w-full">

      <Toaster position="top-center" reverseOrder={false} />

      {isImpersonating && (
        <div className="bg-amber-100 border-b-2 border-black p-2 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm uppercase tracking-wider">
            <Key size={16} />
            <span>Viewing as: {effectiveUserId}</span>
          </div>
          <button
            onClick={() => window.location.href = '/'}
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

      <MonthlyTabSurveyModal
        isOpen={showMonthlyTabSurvey}
        onClose={handleCloseMonthlyTabSurvey}
        onSubmit={handleSubmitMonthlyTabSurvey}
        submitting={submittingMonthlyTabSurvey}
      />

      <div className="max-w-full md:h-full mx-auto bg-white border-[2px] sm:border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-2 sm:p-4 flex flex-col gap-4 overflow-visible md:overflow-hidden">

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
          weeklyStats={weeklyStats}
          weekProgress={weekProgress}
          prevWeekProgress={prevWeekProgress}
          weekDelta={weekDelta}
          monthDelta={monthDelta}
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
          isExportingData={isExportingData}
          hasUnseenWhatsNew={hasUnseenWhatsNew}
          onSearch={() => setIsSearchOpen(true)}
          onLogToday={() => {
            setSelectedDateForCard(new Date());
            setCardOpenFlipped(false);
          }}
          logTodayStatus={logTodayStatus}
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
            <div className="w-full max-w-6xl relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col pt-[max(env(safe-area-inset-top),1rem)] md:pt-4" onClick={e => e.stopPropagation()}>
              <div className="mb-3 rounded-2xl border-[2px] border-black bg-white p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.12)]">
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
              </div>
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
            />
            </div>
          </div>,
          document.body
        )}

        <div className={`flex-1 min-h-0 ${view === 'weekly' ? 'overflow-visible md:overflow-hidden' : 'overflow-visible md:overflow-y-auto'}`}>
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
              toggleCompletion={toggleCompletion}
              toggleHabitInactive={toggleHabitInactive}
              isHabitInactive={isHabitInactive}
              updateHabitNameState={(id, name) => updateHabit(id, { name })}
              updateHabitGoalState={(id, goal) => updateHabit(id, { goal: parseInt(goal) || 0 })}
              handleHabitBlur={handleHabitBlur}
              setEditingHabitId={setEditingHabitId}
              setEditingGoalId={setEditingGoalId}
              removeHabit={removeHabit}
              isDayFullyCompleted={isDayFullyCompleted}
              isModalOpen={isHabitModalOpen || isResolutionsModalOpen}
              notes={notes}
              updateNote={updateNote}
              setSelectedDateForCard={(date, flipped = false) => {
                setSelectedDateForCard(date);
                setCardOpenFlipped(flipped);
              }}
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
              habits={habits}
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
            />
          )}
        </div>
      </div>

      <BottomNav
        view={view}
        setView={setView}
        resetWeekOffset={resetWeekOffset}
        theme={theme}
      />

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
    navigate('/');
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto bg-[#e5e5e5]">
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
            dailyStats={[]} weeklyStats={[]} weekProgress={{ completed: 25, total: 28, percentage: 89 }}
            habits={DEMO_HABITS} defaultView="dashboard" setDefaultView={() => { }}
            colorMode={colorMode} setColorMode={setColorMode}
            cardStyle={cardStyle} setCardStyle={setCardStyle}
            addHabit={async () => ''} updateHabit={async () => { }} removeHabit={async () => { }}
            weekDelta={12} monthDelta={5} monthlyGoals={{}} updateMonthlyGoals={() => { }}
            topHabitsThisMonth={[]} weekOffset={0}
            isHabitModalOpen={false} setIsHabitModalOpen={() => { }}
            isResolutionsModalOpen={false} setIsResolutionsModalOpen={() => { }}
            isStreakModalOpen={false} setIsStreakModalOpen={() => { }}
            reorderHabits={async () => { }}
            onReportBug={() => { }}
            onOpenWhatsNew={() => { }}
            onOpenTutorial={() => { }}
            onExportData={() => { }}
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

// Main App Component with Routing
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
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
          path="/*"
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
