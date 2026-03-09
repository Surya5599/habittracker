import 'react-native-url-polyfill/auto';
import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/lib/supabase';
import { SignInScreen } from './src/screens/SignInScreen';
import { MainScreen } from './src/screens/MainScreen';
import { useHabits } from './src/hooks/useHabits';
import { useHabitStats } from './src/hooks/useHabitStats';
import { useDailyNotes } from './src/hooks/useDailyNotes';
import { useAIAnalysis } from './src/hooks/useAIAnalysis';
import { THEMES } from './src/constants';
import i18n from './src/i18n';
import { OnboardingModal } from './src/components/OnboardingModal';
// import { useTranslation } from 'react-i18next'; // Removing hook usage in App.js context

const Stack = createStackNavigator();
const ONBOARDING_COMPLETED_KEY = 'habit_onboarding_completed';

export default function App() {
  const [session, setSession] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('weekly'); // 'weekly', 'monthly', 'dashboard'
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekStart, setWeekStart] = useState('MON'); // 'MON' or 'SUN'
  const [colorMode, setColorMode] = useState('light'); // 'light' or 'dark'
  // const { i18n } = useTranslation(); // Use imported instance instead
  const [language, setLanguage] = useState('en');

  // Theme support
  const [theme, setTheme] = useState(THEMES[1]); // default ocean
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

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

  // Initialize Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
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
    };
    checkGuest();
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
    updateNote
  } = useDailyNotes(session, guestMode);

  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const {
    weeklyStats,
    weekProgress,
    monthProgress
  } = useHabitStats(habits, completions, currentMonthIndex, currentYear, daysInMonth, monthDates, weekOffset, weekStart);

  const aiAnalysis = useAIAnalysis(session, guestMode);

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

  const handleOnboardingCreateFirstHabit = async ({ name, description, color }) => {
    const trimmedName = (name || '').trim();
    if (!trimmedName) return;
    await addHabit(color || theme.primary, trimmedName, undefined, null, (description || '').trim(), color || theme.primary);
  };

  const handleOpenOnboardingTutorial = () => {
    setOnboardingChecked(true);
    setShowOnboarding(true);
  };

  const resetWeekOffset = () => setWeekOffset(0);

  return (
    <SafeAreaProvider>
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
                    aiAnalysis={aiAnalysis}
                    language={language}
                    setLanguage={handleLanguageChange}
                    colorMode={colorMode}
                    setColorMode={handleColorModeChange}
                    userId={session?.user?.id}
                    userEmail={session?.user?.email}
                  />
                  <OnboardingModal
                    visible={onboardingChecked && showOnboarding}
                    isDark={colorMode === 'dark'}
                    theme={theme}
                    initialLanguage={language}
                    initialWeekStart={weekStart}
                    onLanguageChange={handleLanguageChange}
                    onThemeChange={handleThemeChange}
                    onWeekStartChange={handleWeekStartChange}
                    onCreateFirstHabit={handleOnboardingCreateFirstHabit}
                    onComplete={handleOnboardingComplete}
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
    </SafeAreaProvider>
  );
}
