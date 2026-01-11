import 'react-native-url-polyfill/auto';
import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/lib/supabase';
import { SignInScreen } from './src/screens/SignInScreen';
import { MainScreen } from './src/screens/MainScreen';
import { useHabits } from './src/hooks/useHabits';
import { useHabitStats } from './src/hooks/useHabitStats';
import { useDailyNotes } from './src/hooks/useDailyNotes';
import { useAIAnalysis } from './src/hooks/useAIAnalysis';
import { THEMES } from './src/constants';

const Stack = createStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('weekly'); // 'weekly', 'monthly', 'dashboard'
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekStart, setWeekStart] = useState('MON'); // 'MON' or 'SUN'

  // Theme support
  const [theme, setTheme] = useState(THEMES[1]); // default ocean

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    await AsyncStorage.setItem('habit_tracker_theme', newTheme.name);
  };

  const handleWeekStartChange = async (start) => {
    setWeekStart(start);
    await AsyncStorage.setItem('habit_tracker_week_start', start);
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
    };
    checkGuest();
  }, []);

  const {
    habits,
    completions,
    toggleCompletion,
    addHabit,
    updateHabit,
    removeHabit,
    reorderHabits
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
    setGuestMode(false);
  };

  const resetWeekOffset = () => setWeekOffset(0);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {session || guestMode ? (
            <Stack.Screen name="Main">
              {() => (
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
                  weeklyStats={weeklyStats}
                  isGuest={guestMode}
                  onOpenSignIn={handleOpenSignIn}
                  weekStart={weekStart}
                  setWeekStart={handleWeekStartChange}
                  aiAnalysis={aiAnalysis}
                />
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
