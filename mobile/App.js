import 'react-native-url-polyfill/auto';
import { useState, useEffect, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { supabase } from './src/lib/supabase';
import { SignInScreen } from './src/screens/SignInScreen';
import { MainScreen } from './src/screens/MainScreen';
import { useHabits } from './src/hooks/useHabits';
import { useHabitStats } from './src/hooks/useHabitStats';
import { useDailyNotes } from './src/hooks/useDailyNotes';
import { useAiCoach } from './src/hooks/useAiCoach';
import { THEMES } from './src/constants';
import i18n from './src/i18n';
import { OnboardingModal } from './src/components/OnboardingModal';
import { OnboardingFlow } from './src/components/OnboardingFlow';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { initializeErrorReporting, reportError } from './src/lib/errorReporting';
import { isBenignAuthError } from './src/utils/authErrors';
import {
  initializeNotifications,
  loadHabitReminderSettings,
  persistHabitReminderSettings,
  requestNotificationPermissions,
  scheduleHabitReminder,
  cancelHabitReminder,
} from './src/utils/notifications';
import { isCompleted as checkCompleted } from './src/utils/stats';
// import { useTranslation } from 'react-i18next'; // Removing hook usage in App.js context

const Stack = createStackNavigator();
const ONBOARDING_COMPLETED_KEY = 'habit_onboarding_completed';

export default function App() {
  const [session, setSession] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('weekly'); // 'weekly' | 'journal' | 'dashboard' | 'coach'
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekStart, setWeekStart] = useState('MON'); // 'MON' or 'SUN'
  const [colorMode, setColorMode] = useState('light'); // 'light' or 'dark'
  const [cardStyle, setCardStyle] = useState('compact'); // 'large' or 'compact'
  // const { i18n } = useTranslation(); // Use imported instance instead
  const [language, setLanguage] = useState('en');

  // Theme support
  const [theme, setTheme] = useState(THEMES[1]); // default ocean
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Notifications
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    await AsyncStorage.setItem('habit_tracker_theme', newTheme.name);
  };

  const handleWeekStartChange = async (start) => {
    setWeekStart(start);
    await AsyncStorage.setItem('habit_tracker_week_start', start);
  };

  const handleLanguageChange = async (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    await AsyncStorage.setItem('habit_language', lang);

    if (session?.user) {
      try {
        await supabase.auth.updateUser({
          data: { language: lang }
        });
      } catch (err) {
        console.error('Failed to sync language to profile:', err);
      }
    }
  };

  const handleColorModeChange = async (mode) => {
    setColorMode(mode);
    await AsyncStorage.setItem('habit_tracker_color_mode', mode);
  };

  const handleCardStyleChange = async (style) => {
    setCardStyle(style);
    await AsyncStorage.setItem('habit_card_style', style);
  };

  // Handle deep links (e.g. email confirmation → habicard://#access_token=...&refresh_token=...)
  useEffect(() => {
    const handleDeepLink = async ({ url }) => {
      if (!url) return;
      const parsedUrl = Linking.parse(url);
      const fragment = url.includes('#') ? url.split('#')[1] : '';
      const fragmentParams = fragment ? Object.fromEntries(new URLSearchParams(fragment)) : {};
      const queryParams = parsedUrl?.queryParams || {};
      const code = queryParams.code || parsedUrl?.queryParams?.code;

      if (typeof code === 'string' && code.length > 0) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Failed to exchange auth code for session:', error);
        }
        return;
      }

      if (fragmentParams.access_token && fragmentParams.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: fragmentParams.access_token,
          refresh_token: fragmentParams.refresh_token,
        });
        if (error) {
          console.error('Failed to restore auth session from deep link:', error);
        }
      }
    };

    // App was already open when link was tapped
    const linkingSub = Linking.addEventListener('url', handleDeepLink);

    // App was cold-started by the link
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({ url });
    });

    return () => linkingSub?.remove();
  }, []);

  // Initialize Session
  useEffect(() => {
    initializeErrorReporting();

    const bootstrapSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          if (isBenignAuthError(error)) {
            // Stale local token; clear it quietly and continue signed-out.
            await supabase.auth.signOut({ scope: 'local' });
            setSession(null);
          } else {
            console.error('Failed to restore auth session:', error);
            reportError(error, { scope: 'auth:getSession' });
            setSession(null);
          }
        } else {
          setSession(data?.session || null);
        }
      } catch (error) {
        if (!isBenignAuthError(error)) {
          console.error('Failed to restore auth session:', error);
          reportError(error, { scope: 'auth:getSession:catch' });
        }
        setSession(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrapSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setGuestMode(false);
    });

    const checkGuest = async () => {
      const isGuest = await AsyncStorage.getItem('habit_guest_mode');
      if (isGuest === 'true') setGuestMode(true);

      const savedTheme = await AsyncStorage.getItem('habit_tracker_theme');
      if (savedTheme) {
        const t = THEMES.find(th => th.name === savedTheme);
        if (t) setTheme(t);
      }

      const savedWeekStart = await AsyncStorage.getItem('habit_tracker_week_start');
      if (savedWeekStart) setWeekStart(savedWeekStart);

      const savedLanguage = await AsyncStorage.getItem('habit_language');
      if (savedLanguage) {
        setLanguage(savedLanguage);
        i18n.changeLanguage(savedLanguage);
      }

      const savedColorMode = await AsyncStorage.getItem('habit_tracker_color_mode');
      if (savedColorMode === 'light' || savedColorMode === 'dark') {
        setColorMode(savedColorMode);
      }

      const savedCardStyle = await AsyncStorage.getItem('habit_card_style');
      if (savedCardStyle === 'compact' || savedCardStyle === 'large') {
        setCardStyle(savedCardStyle);
      }

      await initializeNotifications();
      const { enabled } = await loadHabitReminderSettings();
      setReminderEnabled(enabled);
    };
    checkGuest();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sync session language
  useEffect(() => {
    if (session?.user?.user_metadata?.language) {
      const remoteLang = session.user.user_metadata.language;
      setLanguage(remoteLang);
      i18n.changeLanguage(remoteLang);
      AsyncStorage.setItem('habit_language', remoteLang);
    }
  }, [session?.user?.id]);

  const {
    habits,
    completions,
    toggleCompletion,
    addHabit,
    updateHabit,
    removeHabit,
    reorderHabits,
    toggleArchiveHabit
  } = useHabits(session, guestMode);

  const {
    notes,
    updateNote,
    notesWindow
  } = useDailyNotes(session, guestMode);

  const coach = useAiCoach({ session, guestMode, habits, completions, language });

  // If the coach gets switched off while its tab is open, fall back to Today.
  useEffect(() => {
    if (view === 'coach' && coach.prefsLoaded && !coach.enabled) setView('weekly');
  }, [view, coach.prefsLoaded, coach.enabled]);

  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const {
    weeklyStats,
    weekProgress,
    monthProgress
  } = useHabitStats(habits, completions, currentMonthIndex, currentYear, daysInMonth, monthDates, weekOffset, weekStart);

  // Compute today's remaining habit count for notification body
  const todayRemainingCount = useMemo(() => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dayOfWeek = now.getDay();
    return habits.filter(h => {
      if (h.archivedAt || h.weeklyTarget) return false;
      if (h.frequency && !h.frequency.includes(dayOfWeek)) return false;
      if (h.createdAt) {
        const created = new Date(h.createdAt);
        created.setHours(0, 0, 0, 0);
        const today0 = new Date(now); today0.setHours(0, 0, 0, 0);
        if (today0 < created) return false;
      }
      return !checkCompleted(h.id, now.getDate(), completions, now.getMonth(), now.getFullYear());
    }).length;
  }, [habits, completions]);

  // Reschedule notifications whenever remaining count or enabled state changes
  useEffect(() => {
    if (!reminderEnabled) return;
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    scheduleHabitReminder(todayKey, todayRemainingCount);
  }, [reminderEnabled, todayRemainingCount]);

  const handleToggleReminder = async (enabled) => {
    setReminderEnabled(enabled);
    await persistHabitReminderSettings({ enabled });
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        setReminderEnabled(false);
        await persistHabitReminderSettings({ enabled: false });
        return;
      }
      const now = new Date();
      const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      await scheduleHabitReminder(todayKey, todayRemainingCount);
    } else {
      await cancelHabitReminder();
    }
  };

  const handleGuestLogin = async () => {
    await AsyncStorage.setItem('habit_guest_mode', 'true');
    setGuestMode(true);
  };

  const handleOpenSignIn = async () => {
    await AsyncStorage.removeItem('habit_guest_mode');
    setSession(null);
    setGuestMode(false);
    setShowOnboarding(false);
  };

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!session && !guestMode) {
        setShowOnboarding(false);
        setOnboardingChecked(true);
        return;
      }

      if (guestMode) {
        const done = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        setShowOnboarding(done !== 'true');
        setOnboardingChecked(true);
        return;
      }

      const done = !!session?.user?.user_metadata?.onboarding_completed;
      setShowOnboarding(!done);
      setOnboardingChecked(true);
    };

    checkOnboarding();
  }, [session?.user?.id, session?.user?.user_metadata?.onboarding_completed, guestMode]);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');

    if (session?.user) {
      try {
        await supabase.auth.updateUser({
          data: { onboarding_completed: true }
        });
      } catch (err) {
        console.error('Failed to sync onboarding completion:', err);
      }
    }

    setShowOnboarding(false);
  };


  // Two different jobs, so two different surfaces. First run is OnboardingFlow, which
  // creates real habits and ends on a real completion. Replaying from Settings keeps
  // the older feature tour: someone who already has habits wants reminding how the app
  // works, not to be walked through picking habits again.
  const handleOpenOnboardingTutorial = () => {
    setShowTour(true);
  };

  const handleOnboardingCreateHabit = async (pick) => {
    const id = await addHabit(
      theme.primary,
      pick.name,
      pick.frequency,
      pick.weeklyTarget,
      '',
      pick.color,
    );
    if (!id) return null;
    return { id, name: pick.name, color: pick.color };
  };

  const resetWeekOffset = () => setWeekOffset(0);

  return (
    <SafeAreaProvider>
      <AppErrorBoundary onReset={() => { }}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {session || guestMode ? (
              <Stack.Screen name="Main">
                {() => (
                  <>
                    <MainScreen
                      view={view}
                      setView={setView}
                      habits={habits}
                      completions={completions}
                      weekOffset={weekOffset}
                      setWeekOffset={setWeekOffset}
                      theme={theme}
                      setTheme={handleThemeChange}
                      toggleCompletion={toggleCompletion}
                      weekProgress={weekProgress}
                      resetWeekOffset={resetWeekOffset}
                      notes={notes}
                      updateNote={updateNote}
                      notesWindow={notesWindow}
                      addHabit={addHabit}
                      updateHabit={updateHabit}
                      removeHabit={removeHabit}
                      reorderHabits={reorderHabits}
                      toggleArchiveHabit={toggleArchiveHabit}
                      weeklyStats={weeklyStats}
                      isGuest={guestMode}
                      onOpenSignIn={handleOpenSignIn}
                      onOpenOnboardingTutorial={handleOpenOnboardingTutorial}
                      weekStart={weekStart}
                      setWeekStart={handleWeekStartChange}
                      language={language}
                      setLanguage={handleLanguageChange}
                      colorMode={colorMode}
                      setColorMode={handleColorModeChange}
                      cardStyle={cardStyle}
                      setCardStyle={handleCardStyleChange}
                      userId={session?.user?.id}
                      userEmail={session?.user?.email}
                      reminderEnabled={reminderEnabled}
                      onToggleReminder={handleToggleReminder}
                      coach={coach}
                    />
                    <OnboardingFlow
                      visible={onboardingChecked && showOnboarding}
                      theme={theme}
                      colorMode={colorMode}
                      language={language}
                      onLanguageChange={handleLanguageChange}
                      onCreateHabit={handleOnboardingCreateHabit}
                      onToggleCompletion={toggleCompletion}
                      onEnableReminder={() => handleToggleReminder(true)}
                      onComplete={handleOnboardingComplete}
                      onSkip={handleOnboardingComplete}
                    />
                    <OnboardingModal
                      visible={showTour}
                      isDark={colorMode === 'dark'}
                      theme={theme}
                      initialLanguage={language}
                      initialCardStyle={cardStyle}
                      initialWeekStart={weekStart}
                      onLanguageChange={handleLanguageChange}
                      onThemeChange={handleThemeChange}
                      onCardStyleChange={handleCardStyleChange}
                      onWeekStartChange={handleWeekStartChange}
                      onComplete={() => setShowTour(false)}
                      onClose={() => setShowTour(false)}
                    />
                  </>
                )}
              </Stack.Screen>
            ) : (
              <Stack.Screen name="SignIn">
                {props => <SignInScreen {...props} onGuestLogin={handleGuestLogin} />}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
