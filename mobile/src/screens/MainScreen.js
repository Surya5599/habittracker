import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WeeklyScreen } from './WeeklyView';
import { MonthlyView } from './MonthlyView';
import { DashboardView } from './DashboardView';
import { BadgesStreaksView } from './BadgesStreaksView';
import { BottomNav } from '../components/BottomNav';
import { Settings, X, Check, Plus, MessageSquare, Sun, Moon, Shield, Sparkles, Trash2 } from 'lucide-react-native';
import tw from 'twrnc';
import { THEMES } from '../constants';
import { HabitManager } from '../components/HabitManager';
import { supabase } from '../lib/supabase';
import { FeedbackModal } from '../components/FeedbackModal';
import { PrivacyPolicyModal } from '../components/PrivacyPolicyModal';
import { HelpTutorialModal } from '../components/HelpTutorialModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isBenignAuthError } from '../utils/authErrors';
import { reportError } from '../lib/errorReporting';

export const MainScreen = ({
    view,
    setView,
    habits,
    completions,
    weekOffset,
    setWeekOffset,
    theme,
    setTheme,
    toggleCompletion: baseToggleCompletion,
    weekProgress,
    resetWeekOffset,
    notes,
    updateNote,
    addHabit,
    updateHabit,
    removeHabit,
    reorderHabits,
    weeklyStats,
    isGuest,
    onOpenSignIn,
    onOpenOnboardingTutorial,
    weekStart,
    setWeekStart,
    language,
    setLanguage,
    toggleArchiveHabit,
    colorMode,
    setColorMode,
    cardStyle,
    setCardStyle,
    userId,
    userEmail
}) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHabitManagerOpen, setIsHabitManagerOpen] = useState(false);
    const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
    const [isLanguagePickerOpen, setIsLanguagePickerOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
    const [isHelpTutorialOpen, setIsHelpTutorialOpen] = useState(false);
    const [tutorialBaselineHabitsCount, setTutorialBaselineHabitsCount] = useState(0);
    const [tutorialBaselineHabitIds, setTutorialBaselineHabitIds] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const { t } = useTranslation();
    const isDark = colorMode === 'dark';
    const outlineColor = isDark ? '#ffffff' : '#000000';

    const LANGUAGES = [
        { code: 'en', label: 'English' },
        { code: 'es', label: 'Español' },
        { code: 'fr', label: 'Français' },
        { code: 'de', label: 'Deutsch' },
        { code: 'it', label: 'Italiano' },
        { code: 'pt', label: 'Português' },
        { code: 'ja', label: '日本語' },
        { code: 'ko', label: '한국어' },
        { code: 'zh', label: '中文' }
    ];

    const handleSelectDayFromLog = (date) => {
        // Logic to navigate to weekly view at this specific date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        // Find Monday of current week (relative to weekOffset 0)
        const currentDayNum = today.getDay();
        const currentDiff = weekStart === 'SUN'
            ? today.getDate() - currentDayNum
            : today.getDate() - (currentDayNum === 0 ? 6 : currentDayNum - 1);
        const baseMonday = new Date(today.getFullYear(), today.getMonth(), currentDiff);
        baseMonday.setHours(0, 0, 0, 0);

        // Find Monday of target week
        const targetDayNum = targetDate.getDay();
        const targetDiff = weekStart === 'SUN'
            ? targetDate.getDate() - targetDayNum
            : targetDate.getDate() - (targetDayNum === 0 ? 6 : targetDayNum - 1);
        const targetMonday = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDiff);
        targetMonday.setHours(0, 0, 0, 0);

        // Calculate week offset
        const diffWeeks = Math.round((targetMonday - baseMonday) / (1000 * 60 * 60 * 24 * 7));

        setSelectedDate(targetDate);
        setWeekOffset(diffWeeks);
        setView('weekly');
    };

    const handleAuthAction = async () => {
        try {
            if (isGuest) {
                await onOpenSignIn();
            } else {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    if (!isBenignAuthError(error)) {
                        throw error;
                    }
                }
                // Force UI back to auth screen even if auth listener is delayed.
                await onOpenSignIn();
            }
            setIsSettingsOpen(false);
        } catch (error) {
            reportError(error, { scope: 'main-screen:sign-out' });
            Alert.alert(t('settings.errors.title'), error?.message || t('settings.errors.unableSignOut'));
        }
    };

    const clearLocalAppData = async () => {
        const keys = [
            'habit_guest_mode',
            'habit_tracker_habits',
            'habit_tracker_completions',
            'habit_tracker_notes',
            'habit_tracker_habits_queue_v1',
            'habit_tracker_notes_queue_v1'
        ];
        await AsyncStorage.multiRemove(keys);
    };

    const runDeleteAccount = async () => {
        try {
            if (isGuest) {
                await clearLocalAppData();
                await onOpenSignIn();
                setIsSettingsOpen(false);
                return;
            }

            const userIdValue = userId;
            if (!userIdValue) {
                Alert.alert(t('settings.errors.title'), t('settings.account.noSession'));
                return;
            }

            const fnResult = await supabase.functions.invoke('delete-account', { body: { userId: userIdValue } });
            if (fnResult.error) {
                throw fnResult.error;
            }

            await clearLocalAppData();
            const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
            if (signOutError && !isBenignAuthError(signOutError)) {
                reportError(signOutError, { scope: 'main-screen:delete-account-signout' });
            }

            setIsSettingsOpen(false);
            await onOpenSignIn();
        } catch (error) {
            reportError(error, { scope: 'main-screen:delete-account' });
            Alert.alert(t('settings.account.deleteFailed'), error?.message || t('settings.account.unableDelete'));
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            t('settings.account.prompts.confirmTitle'),
            t('settings.account.prompts.confirmBody'),
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            t('settings.account.prompts.sureTitle'),
                            t('settings.account.prompts.sureBody'),
                            [
                                { text: t('settings.account.prompts.keep'), style: 'cancel' },
                                { text: t('settings.account.prompts.forever'), style: 'destructive', onPress: runDeleteAccount }
                            ]
                        );
                    }
                }
            ]
        );
    };

    const getInactiveHabitsForDate = (dateKey) => {
        const dayData = notes?.[dateKey];
        if (!dayData || Array.isArray(dayData)) return [];
        return Array.isArray(dayData.inactiveHabits) ? dayData.inactiveHabits : [];
    };

    const isHabitInactive = (habitId, dateKey) => {
        const habit = habits.find((h) => h.id === habitId);
        if (!habit) return false;

        const [y, m, d] = dateKey.split('-').map(Number);
        const targetDate = new Date(y, m - 1, d);
        targetDate.setHours(0, 0, 0, 0);

        let autoInactive = false;
        if (habit.createdAt) {
            const start = new Date(habit.createdAt);
            start.setHours(0, 0, 0, 0);
            if (targetDate < start) autoInactive = true;
        }
        if (habit.archivedAt) {
            const archived = new Date(habit.archivedAt);
            archived.setHours(0, 0, 0, 0);
            if (targetDate > archived) autoInactive = true;
        }

        const manualInactive = getInactiveHabitsForDate(dateKey).includes(habitId);
        return autoInactive || manualInactive;
    };

    const toggleHabitInactive = async (habitId, dateKey) => {
        const existing = getInactiveHabitsForDate(dateKey);
        const currentlyInactive = existing.includes(habitId);
        const next = currentlyInactive
            ? existing.filter((id) => id !== habitId)
            : Array.from(new Set([...existing, habitId]));

        await updateNote(dateKey, { inactiveHabits: next });

        if (!currentlyInactive && completions[habitId]?.[dateKey]) {
            await baseToggleCompletion(habitId, dateKey);
        }
    };

    const handleToggleCompletion = async (habitId, dateKey) => {
        if (isHabitInactive(habitId, dateKey)) {
            const existing = getInactiveHabitsForDate(dateKey);
            if (existing.includes(habitId)) {
                await updateNote(dateKey, { inactiveHabits: existing.filter((id) => id !== habitId) });
            } else {
                return;
            }
        }
        await baseToggleCompletion(habitId, dateKey);
    };

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#f5f5f4' }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <View style={[tw`flex-row items-center justify-between px-4 py-3`, { backgroundColor: isDark ? '#000000' : '#f5f5f4' }]}>
                    <TouchableOpacity onPress={() => setIsHabitManagerOpen(true)} style={tw`flex-row items-center`}>
                        <Plus size={22} color={isDark ? '#e5e7eb' : '#57534e'} strokeWidth={2.5} />
                        <Text style={[tw`ml-1.5 text-xs font-black uppercase tracking-widest`, { color: isDark ? '#e5e7eb' : '#57534e' }]}>Add</Text>
                    </TouchableOpacity>
                    <Text style={[tw`text-xl font-black uppercase tracking-widest`, { color: isDark ? '#e5e7eb' : '#57534e' }]}>
                        Habi<Text style={tw`text-[#C19A9A]`}>Card</Text>
                    </Text>
                    <View style={tw`flex-row items-center gap-3`}>
                        {isGuest && (
                            <TouchableOpacity
                                onPress={onOpenSignIn}
                                style={tw`bg-[#C19A9A] px-3 py-1 rounded-full`}
                            >
                                <Text style={tw`text-white text-xs font-black uppercase tracking-wider`}>Sign In</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => setIsSettingsOpen(true)}>
                            <Settings size={24} color={isDark ? '#e5e7eb' : '#57534e'} strokeWidth={2.5} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ... Modals ... */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isSettingsOpen}
                    onRequestClose={() => setIsSettingsOpen(false)}
                >
                    <View style={tw`flex-1 justify-end bg-black/50`}>
                        <View style={[tw`rounded-t-3xl h-[85%] overflow-hidden`, { backgroundColor: isDark ? '#000000' : '#f5f5f4' }]}>
                            {/* Modal Header */}
                            <View style={[tw`p-5 border-b flex-row items-center justify-between`, { backgroundColor: isDark ? '#0b0b0b' : '#ffffff', borderColor: isDark ? '#2a2a2a' : '#e5e7eb' }]}>
                                <Text style={[tw`text-xl font-black uppercase tracking-widest`, { color: isDark ? '#e5e7eb' : '#2a2a2a' }]}>{t('settings.title')}</Text>
                                <TouchableOpacity
                                    onPress={() => setIsSettingsOpen(false)}
                                    style={[tw`p-2 rounded-full`, { backgroundColor: isDark ? '#161616' : '#f3f4f6' }]}
                                >
                                    <X size={20} color={isDark ? '#e5e7eb' : '#57534e'} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={tw`p-5`} showsVerticalScrollIndicator={false}>
                                <Text style={[tw`text-xs font-black uppercase tracking-widest mb-3`, { color: isDark ? '#9ca3af' : '#9ca3af' }]}>{t('settings.general.title') || 'Preferences'}</Text>
                                <View style={tw`mb-6`}>
                                    <View style={[tw`absolute bg-black rounded-3xl`, { top: 6, left: 6, right: -6, bottom: -6, zIndex: -1 }]} />
                                    <View style={[tw`rounded-3xl overflow-hidden border-[3px] border-black`, { backgroundColor: isDark ? '#0b0b0b' : '#ffffff', borderColor: outlineColor }]}>
                                        {/* Theme Setting */}
                                        <TouchableOpacity
                                            style={[tw`flex-row items-center justify-between p-4 border-b-[3px] border-black`, { borderBottomColor: outlineColor }]}
                                            onPress={() => setIsThemePickerOpen(true)}
                                        >
                                            <Text style={[tw`text-sm font-black uppercase tracking-tight`, { color: isDark ? '#e5e7eb' : '#161616' }]}>{t('settings.theme.title')}</Text>
                                            <View style={tw`flex-row items-center`}>
                                                <Text style={[tw`text-xs font-black uppercase mr-3`, { color: theme.primary }]}>{theme.name}</Text>
                                                <View style={tw`flex-row`}>
                                                    <View style={[tw`w-6 h-6 rounded-full border-2 border-black`, { backgroundColor: theme.primary }]} />
                                                    <View style={[tw`w-6 h-6 rounded-full border-2 border-black -ml-2`, { backgroundColor: theme.secondary }]} />
                                                </View>
                                            </View>
                                        </TouchableOpacity>

                                        {/* Language Setting */}
                                        <TouchableOpacity
                                            style={[tw`flex-row items-center justify-between p-4 border-b-[3px] border-black`, { borderBottomColor: outlineColor }]}
                                            onPress={() => setIsLanguagePickerOpen(true)}
                                        >
                                            <Text style={[tw`text-sm font-black uppercase tracking-tight`, { color: isDark ? '#e5e7eb' : '#161616' }]}>{t('settings.language.title')}</Text>
                                            <View style={tw`flex-row items-center`}>
                                                <Text style={tw`text-xs font-black uppercase mr-2 text-gray-500`}>
                                                    {LANGUAGES.find(l => l.code === language)?.label || language.toUpperCase()}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>

                                        <View style={[tw`flex-row items-center justify-between p-4 border-b-[3px] border-black`, { borderBottomColor: outlineColor }]}>
                                            <Text style={[tw`text-sm font-black uppercase tracking-tight`, { color: isDark ? '#e5e7eb' : '#161616' }]}>{t('settings.general.startOfWeek')}</Text>
                                            <View style={[tw`flex-row p-1 rounded-xl border-2 border-black`, { backgroundColor: isDark ? '#161616' : '#f3f4f6', borderColor: outlineColor }]}>
                                                <TouchableOpacity
                                                    onPress={() => setWeekStart('SUN')}
                                                    style={[tw`px-3 py-1.5 rounded-lg`, weekStart === 'SUN' && { backgroundColor: theme.primary }]}
                                                >
                                                    <Text style={[tw`text-[10px] font-black`, weekStart === 'SUN' ? tw`text-white` : tw`text-gray-400`]}>SUN</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => setWeekStart('MON')}
                                                    style={[tw`px-3 py-1.5 rounded-lg`, weekStart === 'MON' && { backgroundColor: theme.primary }]}
                                                >
                                                    <Text style={[tw`text-[10px] font-black`, weekStart === 'MON' ? tw`text-white` : tw`text-gray-400`]}>MON</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={[tw`flex-row items-center justify-between p-4 border-b-[3px] border-black`, { borderBottomColor: outlineColor }]}>
                                            <Text style={[tw`text-sm font-black uppercase tracking-tight`, { color: isDark ? '#e5e7eb' : '#161616' }]}>{t('settings.appearance.title')}</Text>
                                            <View style={[tw`flex-row p-1 rounded-xl border-2 border-black`, { backgroundColor: isDark ? '#161616' : '#f3f4f6', borderColor: outlineColor }]}>
                                                <TouchableOpacity
                                                    onPress={() => setColorMode('light')}
                                                    style={[tw`px-3 py-1.5 rounded-lg flex-row items-center`, colorMode === 'light' && { backgroundColor: theme.primary }]}
                                                >
                                                    <Sun size={12} color={colorMode === 'light' ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280')} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => setColorMode('dark')}
                                                    style={[tw`px-3 py-1.5 rounded-lg flex-row items-center`, colorMode === 'dark' && { backgroundColor: theme.primary }]}
                                                >
                                                    <Moon size={12} color={colorMode === 'dark' ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280')} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={[tw`flex-row items-center justify-between p-4 border-b-[3px] border-black`, { borderBottomColor: outlineColor }]}>
                                            <Text style={[tw`text-sm font-black uppercase tracking-tight`, { color: isDark ? '#e5e7eb' : '#161616' }]}>{t('settings.cardSize.title')}</Text>
                                            <View style={[tw`flex-row p-1 rounded-xl border-2 border-black`, { backgroundColor: isDark ? '#161616' : '#f3f4f6', borderColor: outlineColor }]}>
                                                <TouchableOpacity
                                                    onPress={() => setCardStyle('compact')}
                                                    style={[tw`px-3 py-1.5 rounded-lg`, cardStyle === 'compact' && { backgroundColor: theme.primary }]}
                                                >
                                                    <Text style={[tw`text-[10px] font-black uppercase`, cardStyle === 'compact' ? tw`text-white` : tw`text-gray-400`]}>{t('settings.cardSize.compact')}</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => setCardStyle('large')}
                                                    style={[tw`px-3 py-1.5 rounded-lg`, cardStyle === 'large' && { backgroundColor: theme.primary }]}
                                                >
                                                    <Text style={[tw`text-[10px] font-black uppercase`, cardStyle === 'large' ? tw`text-white` : tw`text-gray-400`]}>{t('settings.cardSize.large')}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            style={[tw`flex-row items-center justify-between p-4 border-b-[3px] border-black`, { borderBottomColor: outlineColor }]}
                                            onPress={() => {
                                                setIsSettingsOpen(false);
                                                if (onOpenOnboardingTutorial) onOpenOnboardingTutorial();
                                            }}
                                        >
                                            <Text style={[tw`text-sm font-black uppercase tracking-tight`, { color: isDark ? '#e5e7eb' : '#1f2937' }]}>
                                                {t('settings.onboardingEntry.title')}
                                            </Text>
                                            <View style={tw`flex-row items-center`}>
                                                <Text style={[tw`text-xs font-black uppercase mr-2`, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                    {t('settings.onboardingEntry.open')}
                                                </Text>
                                                <Sparkles size={16} color={isDark ? '#a3a3a3' : '#57534e'} />
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[tw`flex-row items-center justify-between p-4 border-b-[3px] border-black`, { borderBottomColor: outlineColor }]}
                                            onPress={() => {
                                                setIsSettingsOpen(false);
                                                setIsFeedbackOpen(true);
                                            }}
                                        >
                                            <Text style={tw`text-sm font-black text-gray-800 uppercase tracking-tight`}>
                                                {t('settings.support.title')}
                                            </Text>
                                            <View style={tw`flex-row items-center`}>
                                                <Text style={tw`text-xs font-black uppercase mr-2 text-gray-500`}>
                                                    {t('settings.support.reportBug')}
                                                </Text>
                                                <MessageSquare size={16} color="#57534e" />
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[tw`flex-row items-center justify-between p-4 border-b-[3px] border-black`, { borderBottomColor: outlineColor }]}
                                            onPress={() => {
                                                setIsSettingsOpen(false);
                                                setIsPrivacyOpen(true);
                                            }}
                                        >
                                            <Text style={[tw`text-sm font-black uppercase tracking-tight`, { color: isDark ? '#e5e7eb' : '#1f2937' }]}>
                                                {t('settings.privacy.title')}
                                            </Text>
                                            <View style={tw`flex-row items-center`}>
                                                <Text style={[tw`text-xs font-black uppercase mr-2`, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                                    {t('settings.privacy.policy')}
                                                </Text>
                                                <Shield size={16} color={isDark ? '#a3a3a3' : '#57534e'} />
                                            </View>
                                        </TouchableOpacity>

                                        {/* Sign Out Setting */}
                                        <TouchableOpacity
                                            style={[tw`p-4`, { backgroundColor: isDark ? '#161616' : '#f9fafb' }]}
                                            onPress={handleAuthAction}
                                        >
                                            <Text style={tw`text-sm font-black text-red-500 uppercase tracking-tight`}>
                                                {isGuest ? t('header.signIn') : t('header.logout')}
                                            </Text>
                                        </TouchableOpacity>

                                        {!isGuest && (
                                            <TouchableOpacity
                                                style={[tw`flex-row items-center justify-between p-4 border-t-[3px] border-black`, { borderTopColor: outlineColor, backgroundColor: isDark ? '#161616' : '#f9fafb' }]}
                                                onPress={handleDeleteAccount}
                                            >
                                                <Text style={tw`text-sm font-black text-red-500 uppercase tracking-tight`}>{t('settings.account.delete')}</Text>
                                                <Trash2 size={16} color="#ef4444" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </ScrollView>
                        </View>

                        {/* Theme Picker Overlay - Moved up to avoid clipping */}
                        {isThemePickerOpen && (
                            <View style={[StyleSheet.absoluteFill, tw`items-center justify-center bg-black/80 px-6`, { zIndex: 1000 }]}>
                                <View style={tw`w-full`}>
                                    <View style={[tw`absolute bg-black rounded-3xl`, { top: 8, left: 8, right: -8, bottom: -8, zIndex: -1 }]} />
                                    <View style={[tw`bg-white rounded-3xl w-full border-[3px] border-black overflow-hidden`, { borderColor: outlineColor }]}>
                                        <View style={[tw`p-4 border-b-[3px] border-black flex-row justify-between items-center`, { backgroundColor: theme.primary, borderBottomColor: outlineColor }]}>
                                            <Text style={tw`text-lg font-black uppercase text-white tracking-widest`}>{t('settings.theme.select')}</Text>
                                            <TouchableOpacity onPress={() => setIsThemePickerOpen(false)}>
                                                <X size={24} color="white" strokeWidth={3} />
                                            </TouchableOpacity>
                                        </View>

                                        <ScrollView style={tw`p-4 max-h-[400px]`} showsVerticalScrollIndicator={false}>
                                            <View style={tw`flex-row flex-wrap justify-between`}>
                                                {THEMES.map((t) => (
                                                    <TouchableOpacity
                                                        key={t.name}
                                                        onPress={() => {
                                                            setTheme(t);
                                                            setIsThemePickerOpen(false);
                                                        }}
                                                        style={[
                                                            tw`w-[31%] aspect-square rounded-2xl items-center justify-center border-2 mb-3`,
                                                            theme.name === t.name ? tw`border-black bg-gray-50` : tw`border-gray-100 bg-white`
                                                        ]}
                                                    >
                                                        <View style={tw`flex-row mb-2`}>
                                                            <View style={[tw`w-5 h-5 rounded-full border border-black z-10`, { backgroundColor: t.primary }]} />
                                                            <View style={[tw`w-5 h-5 rounded-full border border-black -ml-2`, { backgroundColor: t.secondary }]} />
                                                        </View>
                                                        <Text style={[tw`text-[10px] font-black uppercase`, { color: t.primary }]}>{t.name}</Text>
                                                        {theme.name === t.name && (
                                                            <View style={tw`absolute top-1 right-1`}>
                                                                <Check size={10} color="black" strokeWidth={4} />
                                                            </View>
                                                        )}
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </ScrollView>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Language Picker Overlay */}
                        {isLanguagePickerOpen && (
                            <View style={[StyleSheet.absoluteFill, tw`items-center justify-center bg-black/80 px-6`, { zIndex: 1000 }]}>
                                <View style={tw`w-full`}>
                                    <View style={[tw`absolute bg-black rounded-3xl`, { top: 8, left: 8, right: -8, bottom: -8, zIndex: -1 }]} />
                                    <View style={[tw`bg-white rounded-3xl w-full border-[3px] border-black overflow-hidden`, { borderColor: outlineColor }]}>
                                        <View style={[tw`p-4 border-b-[3px] border-black flex-row justify-between items-center`, { backgroundColor: theme.primary, borderBottomColor: outlineColor }]}>
                                            <Text style={tw`text-lg font-black uppercase text-white tracking-widest`}>{t('settings.language.title')}</Text>
                                            <TouchableOpacity onPress={() => setIsLanguagePickerOpen(false)}>
                                                <X size={24} color="white" strokeWidth={3} />
                                            </TouchableOpacity>
                                        </View>

                                        <ScrollView style={tw`p-4 max-h-[400px]`} showsVerticalScrollIndicator={false}>
                                            <View style={tw`flex-row flex-wrap justify-between`}>
                                                {LANGUAGES.map((l) => (
                                                    <TouchableOpacity
                                                        key={l.code}
                                                        onPress={() => {
                                                            setLanguage(l.code);
                                                            setIsLanguagePickerOpen(false);
                                                        }}
                                                        style={[
                                                            tw`w-[31%] aspect-square rounded-2xl items-center justify-center border-2 mb-3`,
                                                            language === l.code ? tw`border-black bg-gray-50` : tw`border-gray-100 bg-white`
                                                        ]}
                                                    >
                                                        <Text style={[tw`text-md font-black uppercase mb-1`, { color: theme.primary }]}>{l.code.toUpperCase()}</Text>
                                                        <Text style={tw`text-[10px] font-bold text-gray-500 text-center`}>{l.label}</Text>
                                                        {language === l.code && (
                                                            <View style={tw`absolute top-1 right-1`}>
                                                                <Check size={10} color="black" strokeWidth={4} />
                                                            </View>
                                                        )}
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </ScrollView>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </Modal>

                <HabitManager
                    isVisible={isHabitManagerOpen}
                    onClose={() => setIsHabitManagerOpen(false)}
                    habits={habits}
                    addHabit={addHabit}
                    updateHabit={updateHabit}
                    removeHabit={removeHabit}
                    reorderHabits={reorderHabits}
                    theme={theme}
                    toggleArchiveHabit={toggleArchiveHabit}
                    colorMode={colorMode}
                />
                <FeedbackModal
                    isOpen={isFeedbackOpen}
                    onClose={() => setIsFeedbackOpen(false)}
                    userId={userId}
                    userEmail={userEmail}
                    isGuest={isGuest}
                    colorMode={colorMode}
                />
                <PrivacyPolicyModal
                    isVisible={isPrivacyOpen}
                    onClose={() => setIsPrivacyOpen(false)}
                    onOpenFeedback={() => setIsFeedbackOpen(true)}
                    colorMode={colorMode}
                    theme={theme}
                />

                {view === 'weekly' && (
                    <WeeklyScreen
                        habits={habits}
                        completions={completions}
                        weekOffset={weekOffset}
                        setWeekOffset={setWeekOffset}
                        theme={theme}
                        toggleCompletion={handleToggleCompletion}
                        toggleHabitInactive={toggleHabitInactive}
                        isHabitInactive={isHabitInactive}
                        weekProgress={weekProgress}
                        notes={notes}
                        updateNote={updateNote}
                        initialDate={selectedDate}
                        weekStart={weekStart}
                        colorMode={colorMode}
                        cardStyle={cardStyle}
                    />
                )}
                {view === 'monthly' && (
                    <MonthlyView
                        habits={habits}
                        completions={completions}
                        notes={notes}
                        theme={theme}
                        toggleCompletion={handleToggleCompletion}
                        toggleHabitInactive={toggleHabitInactive}
                        isHabitInactive={isHabitInactive}
                        updateNote={updateNote}
                        colorMode={colorMode}
                        cardStyle={cardStyle}
                    />
                )}
                {view === 'dashboard' && (
                    <DashboardView
                        habits={habits}
                        completions={completions}
                        weekProgress={weekProgress}
                        weeklyStats={weeklyStats}
                        weekOffset={weekOffset}
                        setWeekOffset={setWeekOffset}
                        theme={theme}
                        notes={notes}
                        weekStart={weekStart}
                        toggleCompletion={handleToggleCompletion}
                        toggleHabitInactive={toggleHabitInactive}
                        isHabitInactive={isHabitInactive}
                        updateNote={updateNote}
                        colorMode={colorMode}
                        cardStyle={cardStyle}
                    />
                )}
                {view === 'badges' && (
                    <BadgesStreaksView
                        habits={habits}
                        completions={completions}
                        theme={theme}
                        colorMode={colorMode}
                    />
                )}
                <HelpTutorialModal
                    visible={isHelpTutorialOpen}
                    onClose={() => setIsHelpTutorialOpen(false)}
                    currentView={view}
                    habitsCount={habits.length}
                    baselineHabitsCount={tutorialBaselineHabitsCount}
                    habitIds={habits.map((h) => h.id)}
                    baselineHabitIds={tutorialBaselineHabitIds}
                    completions={completions}
                    notes={notes}
                    colorMode={colorMode}
                    theme={theme}
                />
            </SafeAreaView>
            <BottomNav
                view={view}
                setView={setView}
                resetWeekOffset={resetWeekOffset}
                theme={theme}
                colorMode={colorMode}
            />
        </View>
    );
};
