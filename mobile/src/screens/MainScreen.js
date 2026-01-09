import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WeeklyScreen } from './WeeklyView';
import { MonthlyView } from './MonthlyView';
import { DashboardView } from './DashboardView';
import { BottomNav } from '../components/BottomNav';
import { Settings, X, Check, Plus } from 'lucide-react-native';
import tw from 'twrnc';
import { THEMES } from '../constants';
import { HabitManager } from '../components/HabitManager';

export const MainScreen = ({
    view,
    setView,
    habits,
    completions,
    weekOffset,
    setWeekOffset,
    theme,
    setTheme,
    toggleCompletion,
    weekProgress,
    resetWeekOffset,
    notes,
    updateNote,
    addHabit,
    updateHabit,
    removeHabit,
    weeklyStats,
    isGuest,
    onOpenSignIn,
    weekStart,
    setWeekStart
}) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHabitManagerOpen, setIsHabitManagerOpen] = useState(false);
    const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

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

    return (
        <View style={{ flex: 1, backgroundColor: '#f5f5f4' }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <View style={tw`flex-row items-center justify-between px-4 py-3 bg-[#f5f5f4]`}>
                    <TouchableOpacity onPress={() => setIsHabitManagerOpen(true)}>
                        <Plus size={24} color="#57534e" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={tw`text-xl font-black uppercase tracking-widest text-[#57534e]`}>
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
                            <Settings size={24} color="#57534e" strokeWidth={2.5} />
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
                        <View style={tw`bg-[#f5f5f4] rounded-t-3xl h-[85%] overflow-hidden`}>
                            {/* Modal Header */}
                            <View style={tw`p-5 border-b border-gray-200 flex-row items-center justify-between bg-white`}>
                                <Text style={tw`text-xl font-black uppercase tracking-widest text-gray-700`}>Settings</Text>
                                <TouchableOpacity
                                    onPress={() => setIsSettingsOpen(false)}
                                    style={tw`p-2 bg-gray-100 rounded-full`}
                                >
                                    <X size={20} color="#57534e" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={tw`p-5`} showsVerticalScrollIndicator={false}>
                                <Text style={tw`text-xs font-black uppercase text-gray-400 tracking-widest mb-3`}>Preferences</Text>
                                <View style={tw`mb-6`}>
                                    <View style={[tw`absolute bg-black rounded-3xl`, { top: 6, left: 6, right: -6, bottom: -6, zIndex: -1 }]} />
                                    <View style={tw`bg-white rounded-3xl overflow-hidden border-[3px] border-black`}>
                                        {/* Theme Setting */}
                                        <TouchableOpacity
                                            style={tw`flex-row items-center justify-between p-4 border-b-[3px] border-black`}
                                            onPress={() => setIsThemePickerOpen(true)}
                                        >
                                            <Text style={tw`text-sm font-black text-gray-800 uppercase tracking-tight`}>Theme</Text>
                                            <View style={tw`flex-row items-center`}>
                                                <Text style={[tw`text-xs font-black uppercase mr-3`, { color: theme.primary }]}>{theme.name}</Text>
                                                <View style={tw`flex-row`}>
                                                    <View style={[tw`w-6 h-6 rounded-full border-2 border-black`, { backgroundColor: theme.primary }]} />
                                                    <View style={[tw`w-6 h-6 rounded-full border-2 border-black -ml-2`, { backgroundColor: theme.secondary }]} />
                                                </View>
                                            </View>
                                        </TouchableOpacity>

                                        {/* Start of Week Setting */}
                                        <View style={tw`flex-row items-center justify-between p-4 border-b-[3px] border-black`}>
                                            <Text style={tw`text-sm font-black text-gray-800 uppercase tracking-tight`}>Start of Week</Text>
                                            <View style={tw`flex-row bg-gray-100 p-1 rounded-xl border-2 border-black`}>
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

                                        {/* Sign Out Setting */}
                                        <TouchableOpacity
                                            style={tw`p-4 bg-gray-50`}
                                            onPress={async () => {
                                                if (isGuest) {
                                                    onOpenSignIn();
                                                } else {
                                                    await supabase.auth.signOut();
                                                }
                                                setIsSettingsOpen(false);
                                            }}
                                        >
                                            <Text style={tw`text-sm font-black text-red-500 uppercase tracking-tight`}>
                                                {isGuest ? 'Sign In / Create Account' : 'Sign Out'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>
                        </View>

                        {/* Theme Picker Overlay - Moved up to avoid clipping */}
                        {isThemePickerOpen && (
                            <View style={[StyleSheet.absoluteFill, tw`items-center justify-center bg-black/80 px-6`, { zIndex: 1000 }]}>
                                <View style={tw`w-full`}>
                                    <View style={[tw`absolute bg-black rounded-3xl`, { top: 8, left: 8, right: -8, bottom: -8, zIndex: -1 }]} />
                                    <View style={tw`bg-white rounded-3xl w-full border-[3px] border-black overflow-hidden`}>
                                        <View style={[tw`p-4 border-b-[3px] border-black flex-row justify-between items-center`, { backgroundColor: theme.primary }]}>
                                            <Text style={tw`text-lg font-black uppercase text-white tracking-widest`}>Select Theme</Text>
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
                    </View>
                </Modal>

                <HabitManager
                    isVisible={isHabitManagerOpen}
                    onClose={() => setIsHabitManagerOpen(false)}
                    habits={habits}
                    addHabit={addHabit}
                    updateHabit={updateHabit}
                    removeHabit={removeHabit}
                    theme={theme}
                />

                {view === 'weekly' && (
                    <WeeklyScreen
                        habits={habits}
                        completions={completions}
                        weekOffset={weekOffset}
                        setWeekOffset={setWeekOffset}
                        theme={theme}
                        toggleCompletion={toggleCompletion}
                        weekProgress={weekProgress}
                        notes={notes}
                        updateNote={updateNote}
                        initialDate={selectedDate}
                        weekStart={weekStart}
                    />
                )}
                {view === 'monthly' && (
                    <MonthlyView
                        habits={habits}
                        completions={completions}
                        notes={notes}
                        theme={theme}
                        toggleCompletion={toggleCompletion}
                        updateNote={updateNote}
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
                    />
                )}
            </SafeAreaView>
            <BottomNav
                view={view}
                setView={setView}
                resetWeekOffset={resetWeekOffset}
                theme={theme}
            />
        </View>
    );
};
