import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, ScrollView, Animated, TextInput, Easing, Modal, useWindowDimensions, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Check, ChevronLeft, ChevronRight, BookOpen, Save, Plus, X, Share, Meh, Frown, Smile, Laugh, Angry, Minus } from 'lucide-react-native';
import tw from 'twrnc';
import { isCompleted as checkCompleted } from '../utils/stats';
import { DAYS_OF_WEEK } from '../constants';
import Svg, { Circle } from 'react-native-svg';
import { NeoButton } from './NeoComponents';
import { DatePickerModal } from './DatePickerModal';

// Custom Hard Shadow Component defined outside to prevent re-renders
const HardShadowCard = ({ children, style, isDark = false }) => (
    <View style={style}>
        {/* Shadow Block */}
        <View style={[
            tw`absolute bg-black rounded-3xl`,
            { top: 8, left: 8, right: -8, bottom: -8, zIndex: -1 }
        ]} />
        {/* Main Content */}
        <View style={[tw`border-[3px] border-black rounded-3xl overflow-hidden h-full`, { backgroundColor: isDark ? '#0b0b0b' : '#ffffff', borderColor: isDark ? '#ffffff' : '#000000' }]}>
            {children}
        </View>
    </View>
);

export const DailyCard = ({
    date,
    habits,
    completions,
    theme,
    toggleCompletion,
    toggleHabitInactive,
    isHabitInactive,
    onPrev,
    onNext,
    onDateSelect,
    onShareClick,
    dayData,
    dateKey,
    updateNote,
    colorMode = 'light'
}) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [backView, setBackView] = useState('journal');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTaskText, setNewTaskText] = useState('');
    const [editingTaskId, setEditingTaskId] = useState(null);
    const longPressTriggeredRef = useRef(false);
    const [keyboardInset, setKeyboardInset] = useState(0);
    const viewSwitchAnim = useRef(new Animated.Value(1)).current;
    const isSwitchingRef = useRef(false);
    const journalScrollRef = useRef(null);
    const { t, i18n } = useTranslation();
    const isDark = colorMode === 'dark';

    const finalDayData = dayData || { tasks: [], mood: undefined, journal: '' };

    // Local state for journal/mood to allow editing before save (or auto-save)
    const [localJournal, setLocalJournal] = useState(finalDayData.journal || '');
    const [localMood, setLocalMood] = useState(finalDayData.mood);

    useEffect(() => {
        setLocalJournal(finalDayData.journal || '');
        setLocalMood(finalDayData.mood);
    }, [finalDayData.journal, finalDayData.mood]);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const onKeyboardShow = (e) => {
            const height = e?.endCoordinates?.height || 0;
            setKeyboardInset(height);
        };

        const onKeyboardHide = () => {
            setKeyboardInset(0);
        };

        const showSub = Keyboard.addListener(showEvent, onKeyboardShow);
        const hideSub = Keyboard.addListener(hideEvent, onKeyboardHide);

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const handleSaveJournal = () => {
        updateNote && updateNote(dateKey, { journal: localJournal, mood: localMood });
        flipToFront();
    };

    const handleAddTask = () => {
        setIsTaskModalOpen(true);
        setNewTaskText('');
    };

    const confirmAddTask = () => {
        if (newTaskText.trim() === '') {
            setIsTaskModalOpen(false);
            return;
        }
        const taskId = Date.now().toString();
        const newTask = { id: taskId, text: newTaskText.trim(), completed: false };
        const currentTasks = finalDayData.tasks || [];
        updateNote && updateNote(dateKey, { tasks: [...currentTasks, newTask] });
        setIsTaskModalOpen(false);
        setNewTaskText('');
    };

    const handleUpdateTask = (taskId, text) => {
        const currentTasks = finalDayData.tasks || [];
        const newTasks = currentTasks.map(t => t.id === taskId ? { ...t, text } : t);
        updateNote && updateNote(dateKey, { tasks: newTasks });
    };

    const handleToggleTask = (taskId) => {
        const currentTasks = finalDayData.tasks || [];
        const newTasks = currentTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        updateNote && updateNote(dateKey, { tasks: newTasks });
    };

    const handleDeleteTask = (taskId) => {
        const currentTasks = finalDayData.tasks || [];
        const newTasks = currentTasks.filter(t => t.id !== taskId);
        updateNote && updateNote(dateKey, { tasks: newTasks });
    };

    const MOODS = [
        { value: 1, icon: Angry, label: t('mood.veryBad'), color: '#ef4444' },
        { value: 2, icon: Frown, label: t('mood.bad'), color: '#f97316' },
        { value: 3, icon: Meh, label: t('mood.okay'), color: '#eab308' },
        { value: 4, icon: Smile, label: t('mood.good'), color: '#84cc16' },
        { value: 5, icon: Laugh, label: t('mood.great'), color: '#22c55e' },
    ];

    const animateViewChange = (applyStateChange) => {
        if (isSwitchingRef.current) return;
        isSwitchingRef.current = true;
        Animated.timing(viewSwitchAnim, {
            toValue: 0,
            duration: 110,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
        }).start(() => {
            applyStateChange();
            Animated.timing(viewSwitchAnim, {
                toValue: 1,
                duration: 170,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true
            }).start(() => {
                isSwitchingRef.current = false;
            });
        });
    };

    const switchCardView = (targetView) => {
        const currentView = isFlipped ? backView : 'habits';
        if (currentView === targetView) return;

        animateViewChange(() => {
            if (targetView === 'habits') {
                setIsFlipped(false);
            } else {
                setBackView(targetView);
                setIsFlipped(true);
            }
        });
    };

    const openJournalView = () => switchCardView('journal');
    const openTasksView = () => switchCardView('tasks');
    const flipToFront = () => switchCardView('habits');

    const handleSaveJournalOld = () => {
        // Deprecated, using the one above
        flipToFront();
    };

    const dayName = date.toLocaleDateString(i18n.language, { weekday: 'long' });
    const dateString = date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' });
    const isToday = date.toDateString() === new Date().toDateString();


    const getStartOfDay = (d) => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date;
    };

    // Helper to check if a habit is active for the current view date
    const isHabitActive = (habit) => {
        const viewDate = getStartOfDay(date);

        // Check Start Date (createdAt)
        if (habit.createdAt) {
            const startDate = getStartOfDay(new Date(habit.createdAt));
            if (viewDate < startDate) return false;
        }

        // Check End Date (archivedAt)
        // If archived today (e.g. at 2pm), it should still be visible today.
        // So we hide it if viewDate is strictly AFTER the archive date.
        // Actually, better logic: if archivedAt exists, viewDate must be <= getStartOfDay(archivedAt)
        // No, if I archive it today at 2pm, archivedAt is today. 
        // getStartOfDay(archivedAt) is Today 00:00.
        // viewDate is Today 00:00. 
        // viewDate <= startArchived is True.
        // Tomorrow: viewDate > startArchived. True. Hidden.
        // This works for "remove from future dates".

        if (habit.archivedAt) {
            const archiveDate = getStartOfDay(new Date(habit.archivedAt));
            if (viewDate > archiveDate) return false;
        }

        return true;
    };

    const dailyHabits = habits.filter(h =>
        !h.weeklyTarget &&
        (!h.frequency || h.frequency.includes(date.getDay())) &&
        isHabitActive(h)
    );
    const visibleHabitsForDate = habits.filter(h =>
        isHabitActive(h) && (h.weeklyTarget || !h.frequency || h.frequency.includes(date.getDay()))
    );
    const isHabitInactiveOnDate = (habitId) => (isHabitInactive ? isHabitInactive(habitId, dateKey) : false);

    const getDayProgress = (d) => {
        const activeDailyHabits = dailyHabits.filter(h => !isHabitInactiveOnDate(h.id));
        if (activeDailyHabits.length === 0) return 0;
        const monthIdx = d.getMonth();
        const day = d.getDate();
        const year = d.getFullYear();
        let doneCount = 0;
        activeDailyHabits.forEach(h => {
            if (checkCompleted(h.id, day, completions, monthIdx, year)) {
                doneCount++;
            }
        });
        return (doneCount / activeDailyHabits.length) * 100;
    };

    const actualProgress = getDayProgress(date);
    const completedCount = dailyHabits.reduce((acc, h) =>
        acc + (!isHabitInactiveOnDate(h.id) && checkCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear()) ? 1 : 0), 0);
    const totalCount = dailyHabits.filter(h => !isHabitInactiveOnDate(h.id)).length;
    const completedHabitsCount = visibleHabitsForDate.reduce((acc, h) => {
        if (isHabitInactiveOnDate(h.id)) return acc;
        return acc + (checkCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear()) ? 1 : 0);
    }, 0);
    const totalHabitsCount = visibleHabitsForDate.filter(h => !isHabitInactiveOnDate(h.id)).length;
    const totalTasksCount = (finalDayData.tasks || []).length;
    const completedTasksCount = (finalDayData.tasks || []).filter(task => task.completed).length;
    const hasJournalEntry = Boolean((finalDayData.journal || '').trim());
    const selectedMood = MOODS.find(m => m.value === localMood);
    const MoodStatusIcon = selectedMood?.icon || Meh;
    const panelBg = isDark ? '#0b0b0b' : '#ffffff';
    const panelSoftBg = isDark ? '#161616' : '#f9fafb';
    const textPrimary = isDark ? '#e5e7eb' : '#161616';
    const textSecondary = isDark ? '#9ca3af' : '#6b7280';
    const textMuted = isDark ? '#6b7280' : '#d6d3d1';
    const borderSoft = isDark ? '#262626' : '#f3f4f6';
    const outlineColor = isDark ? '#ffffff' : '#000000';
    const dateHeaderBg = isDark ? '#000000' : theme.secondary;

    const StatusRow = () => (
        <View style={[tw`flex-row border-t-[3px] border-b-[3px] border-black`, { backgroundColor: panelSoftBg, borderColor: outlineColor }]}>
            <TouchableOpacity
                onPress={flipToFront}
                style={[tw`flex-1 px-2 py-2 border-r border-black items-center justify-center`, { borderRightColor: outlineColor }]}
            >
                <Text style={[tw`text-[9px] font-black uppercase tracking-wider`, { color: textSecondary }]}>{t('common.myHabits')}</Text>
                <Text style={[tw`text-[10px] font-black mt-1`, { color: textPrimary }]}>{completedHabitsCount}/{totalHabitsCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={openTasksView}
                style={[tw`flex-1 px-2 py-2 border-r border-black items-center justify-center`, { borderRightColor: outlineColor }]}
            >
                <Text style={[tw`text-[9px] font-black uppercase tracking-wider`, { color: textSecondary }]}>{t('dailyCard.tasks')}</Text>
                <Text style={[tw`text-[10px] font-black mt-1`, { color: textPrimary }]}>
                    {totalTasksCount > 0 ? `${completedTasksCount}/${totalTasksCount}` : '+'}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={openJournalView}
                style={[tw`flex-1 px-2 py-2 border-r border-black items-center justify-center`, { borderRightColor: outlineColor }]}
            >
                <Text style={[tw`text-[9px] font-black uppercase tracking-wider`, { color: textSecondary }]}>{t('dailyCard.journal')}</Text>
                {selectedMood ? (
                    <MoodStatusIcon size={16} color={selectedMood.color} strokeWidth={2.5} />
                ) : (
                    <BookOpen size={16} color={hasJournalEntry ? '#166534' : textSecondary} strokeWidth={2.5} />
                )}
            </TouchableOpacity>
        </View>
    );

    const getFlexibleProgress = (habitId) => {
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
        const monday = new Date(date.getFullYear(), date.getMonth(), diff);

        let count = 0;
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dateKeyForWeekday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (isHabitInactive && isHabitInactive(habitId, dateKeyForWeekday)) {
                continue;
            }
            if (checkCompleted(habitId, d.getDate(), completions, d.getMonth(), d.getFullYear())) {
                count++;
            }
        }
        return count;
    };

    const size = 120; // Matches visually larger circle in image
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const AnimatedCircle = Animated.createAnimatedComponent(Circle);
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: actualProgress,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
        }).start();
    }, [actualProgress]);

    const strokeDashoffset = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, 0],
    });

    const { height: screenHeight } = useWindowDimensions();
    const cardHeight = screenHeight - 220; // Corrected height to stay above bottom nav
    const viewSwitchStyle = {
        opacity: viewSwitchAnim,
        transform: [
            {
                translateX: viewSwitchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [26, 0]
                })
            },
            {
                scale: viewSwitchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1]
                })
            },
            {
                rotateZ: viewSwitchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['1.2deg', '0deg']
                })
            }
        ]
    };

    return (
        <View style={[tw`pb-0 pr-0`, { height: cardHeight }]}>
            <DatePickerModal
                isVisible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onSelect={onDateSelect}
                selectedDate={date}
                theme={theme}
                colorMode={colorMode}
            />

            {/* Task Entry Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isTaskModalOpen}
                onRequestClose={() => setIsTaskModalOpen(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={tw`flex-1 justify-start items-center bg-black/60 px-6 pt-24`}
                >
                        <View style={tw`w-full`}>
                            <View style={[tw`absolute bg-black rounded-3xl`, { top: 8, left: 8, right: -8, bottom: -8, zIndex: -1 }]} />
                        <View style={[tw`rounded-3xl w-full border-[3px] border-black overflow-hidden`, { backgroundColor: panelBg, borderColor: outlineColor }]}>
                            <View style={[tw`p-4 border-b-[3px] border-black items-center`, { backgroundColor: theme.primary, borderBottomColor: outlineColor }]}>
                                <Text style={tw`text-lg font-black uppercase text-white tracking-widest`}>{t('tasks.enterTask') || 'Enter your task'}</Text>
                            </View>

                            <View style={tw`p-6`}>
                                <TextInput
                                    style={[
                                        tw`border-[3px] border-black p-4 rounded-xl text-lg font-bold mb-6`,
                                        { borderColor: outlineColor },
                                        { backgroundColor: panelSoftBg, color: textPrimary },
                                        {
                                            lineHeight: 24,
                                            paddingVertical: Platform.OS === 'android' ? 8 : 10,
                                            includeFontPadding: false,
                                            textAlignVertical: 'center'
                                        }
                                    ]}
                                    placeholder={t('tasks.placeholder') || "Type something..."}
                                    placeholderTextColor={textMuted}
                                    autoFocus={true}
                                    value={newTaskText}
                                    onChangeText={setNewTaskText}
                                    onSubmitEditing={confirmAddTask}
                                />

                                <View style={tw`flex-row gap-3`}>
                                    <TouchableOpacity
                                        onPress={() => setIsTaskModalOpen(false)}
                                        style={[tw`flex-1 py-4 rounded-xl border-[3px] border-black items-center`, { backgroundColor: panelSoftBg, borderColor: outlineColor }]}
                                    >
                                        <Text style={[tw`font-black uppercase text-xs tracking-widest`, { color: textPrimary }]}>{t('common.cancel')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={confirmAddTask}
                                        style={[tw`flex-2 py-4 rounded-xl border-[3px] border-black items-center`, { backgroundColor: theme.primary, borderColor: outlineColor }]}
                                    >
                                        <Text style={tw`text-white font-black uppercase text-xs tracking-widest`}>{t('tasks.addTask') || 'Add Task'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Front Face */}
            {!isFlipped && (
            <Animated.View style={[tw`w-full h-full`, viewSwitchStyle]}>
                <HardShadowCard style={tw`h-full`} isDark={isDark}>
                    {/* Header */}
                    <View style={[tw`p-4 flex-row items-center justify-between border-b-[3px] border-black`, { backgroundColor: dateHeaderBg, borderBottomColor: outlineColor }]}>
                        <TouchableOpacity onPress={onPrev}>
                            <ChevronLeft size={24} color="white" />
                        </TouchableOpacity>

                        <View style={tw`flex-row items-center gap-3`}>
                            <View style={tw`items-center`}>
                                <Text style={tw`text-white font-black uppercase text-xl tracking-tighter`}>{dayName}</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                                    <Text style={tw`text-white/80 font-bold text-[10px] tracking-widest`}>{dateString}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Header Progress (No Background) */}
                            <View style={tw`flex-row items-center gap-2`}>
                                <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
                                    <Svg width={64} height={64} style={{ transform: [{ rotate: '-90deg' }] }}>
                                        <Circle
                                            stroke="rgba(255,255,255,0.2)"
                                            cx={32}
                                            cy={32}
                                            r={29}
                                            strokeWidth={6}
                                            fill="transparent"
                                        />
                                        <AnimatedCircle
                                            stroke="white"
                                            cx={32}
                                            cy={32}
                                            r={29}
                                            strokeWidth={6}
                                            fill="transparent"
                                            strokeDasharray={29 * 2 * Math.PI}
                                            strokeDashoffset={progressAnim.interpolate({
                                                inputRange: [0, 100],
                                                outputRange: [29 * 2 * Math.PI, 0],
                                            })}
                                            strokeLinecap="round"
                                        />
                                    </Svg>
                                    <View style={tw`absolute inset-0 items-center justify-center`}>
                                        <Text style={tw`text-sm font-black text-white`}>{Math.round(actualProgress)}%</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity onPress={onNext}>
                            <ChevronRight size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={[tw`flex-1`, { backgroundColor: panelBg }]}
                        contentContainerStyle={{ paddingBottom: 12 }}
                        showsVerticalScrollIndicator={false}
                    >


                        <View style={tw`px-5 pb-6 pt-4`}>
                            <View style={[tw`border-b mb-2 pb-2 flex-row justify-between items-center`, { borderColor: borderSoft }]}>
                                <Text style={[tw`text-xs font-black uppercase tracking-widest`, { color: textSecondary }]}>{t('common.myHabits')}</Text>
                                <Text style={[tw`text-xs font-black mr-2`, { color: textSecondary }]}>{completedHabitsCount}/{totalHabitsCount}</Text>
                            </View>

                            {visibleHabitsForDate.length === 0 ? (
                                <Text style={[tw`text-center italic py-2 text-xs`, { color: textMuted }]}>{t('dailyCard.noDailyHabits')}</Text>
                            ) : (
                                <View style={tw`mb-2`}>
                    {visibleHabitsForDate
                        .map(habit => ({
                            ...habit,
                            done: checkCompleted(habit.id, date.getDate(), completions, date.getMonth(), date.getFullYear()),
                            weeklyDone: habit.weeklyTarget ? getFlexibleProgress(habit.id) : null,
                            inactive: isHabitInactiveOnDate(habit.id)
                        }))
                        .map(habit => (
                            <TouchableOpacity
                                key={habit.id}
                                delayLongPress={450}
                                onPressIn={() => { longPressTriggeredRef.current = false; }}
                                onLongPress={() => {
                                    longPressTriggeredRef.current = true;
                                    if (toggleHabitInactive) {
                                        toggleHabitInactive(habit.id, dateKey);
                                    }
                                }}
                                onPress={() => {
                                    if (longPressTriggeredRef.current) {
                                        longPressTriggeredRef.current = false;
                                        return;
                                    }
                                    toggleCompletion(habit.id, dateKey);
                                }}
                                style={tw`flex-row items-center justify-between mb-2 mr-2`}
                                activeOpacity={0.7}
                            >
                                <View style={tw`flex-row items-center flex-1 mr-2`}>
                                    <Text style={[
                                        tw`text-base font-bold flex-shrink`,
                                        habit.inactive
                                            ? { color: '#b45309' }
                                            : (habit.done ? { color: textMuted, textDecorationLine: 'line-through' } : { color: textPrimary })
                                    ]}>
                                        {habit.name || t('common.untitled')}
                                    </Text>
                                    {habit.weeklyTarget ? (
                                                        <Text style={[tw`ml-2 text-[10px] font-black uppercase`, { color: textSecondary }]}>
                                                            {habit.weeklyDone}/{habit.weeklyTarget}
                                                        </Text>
                                                    ) : null}
                                                </View>

                                <View style={[
                                    tw`w-6 h-6 border-[2.5px] border-black items-center justify-center rounded-sm`,
                                    habit.inactive
                                        ? { backgroundColor: '#fcd34d', borderColor: '#b45309' }
                                        : { backgroundColor: habit.done ? '#000000' : panelBg, borderColor: outlineColor }
                                ]}>
                                    {habit.inactive
                                        ? <Minus size={16} color="#78350f" strokeWidth={4} />
                                        : (habit.done && <Check size={16} color="white" strokeWidth={4} />)}
                                </View>
                            </TouchableOpacity>
                        ))
                    }
                                </View>
                            )}
                        </View>

                    </ScrollView>
                    <StatusRow />

                    {actualProgress === 100 && (
                        <TouchableOpacity
                            onPress={() => onShareClick && onShareClick({ date, dayName, dateString, completedCount, totalCount, progress: actualProgress })}
                            style={[tw`absolute right-4 bg-black p-3 rounded-full shadow-lg z-50`, { bottom: 64 }]}
                        >
                            <Share size={20} color="white" />
                        </TouchableOpacity>
                    )}

                </HardShadowCard>
            </Animated.View>
            )}

            {/* Back Face */}
            {isFlipped && (
            <Animated.View style={[tw`w-full h-full`, viewSwitchStyle]}>
                <HardShadowCard style={tw`h-full`} isDark={isDark}>
                    {/* Header */}
                    <View style={[tw`p-5 flex-row items-center border-b-[3px] border-black`, { backgroundColor: dateHeaderBg, borderBottomColor: outlineColor }]}>
                        <TouchableOpacity onPress={onPrev} style={tw`absolute left-4 z-10`}>
                            <ChevronLeft size={28} color="white" />
                        </TouchableOpacity>
                        <View style={tw`flex-1 items-center`}>
                            <Text style={tw`text-white font-black uppercase text-2xl tracking-tighter`}>
                                {backView === 'tasks' ? t('dailyCard.tasks') : t('journal.title')}
                            </Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                                <Text style={tw`text-white/90 font-bold text-sm tracking-widest mt-1`}>{dateString}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={tw`absolute right-4 z-10 flex-row items-center`}>
                            {backView === 'tasks' ? (
                                <TouchableOpacity onPress={handleAddTask} style={tw`mr-3`}>
                                    <Plus size={24} color="white" />
                                </TouchableOpacity>
                            ) : null}
                            <TouchableOpacity onPress={onNext}>
                                <ChevronRight size={28} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {backView === 'tasks' ? (
                        <ScrollView style={tw`flex-1 p-6`} showsVerticalScrollIndicator={false}>
                            {(finalDayData.tasks && finalDayData.tasks.length > 0) ? (
                                finalDayData.tasks.map(task => (
                                    <View key={task.id} style={tw`w-full flex-row items-center gap-3 mb-3`}>
                                        <TouchableOpacity
                                            onPress={() => handleToggleTask(task.id)}
                                            style={[
                                                tw`w-6 h-6 border-[2.5px] border-black rounded-sm items-center justify-center`,
                                                { backgroundColor: task.completed ? '#000000' : panelBg, borderColor: outlineColor }
                                            ]}
                                        >
                                            {task.completed && <Check size={14} color="white" strokeWidth={4} />}
                                        </TouchableOpacity>
                                        <TextInput
                                            style={[
                                                tw`flex-1 font-bold text-base`,
                                                task.completed ? { color: textMuted, textDecorationLine: 'line-through' } : { color: textPrimary },
                                                {
                                                    lineHeight: 22,
                                                    paddingVertical: 0,
                                                    minHeight: 24,
                                                    includeFontPadding: false,
                                                    textAlignVertical: 'center'
                                                }
                                            ]}
                                            value={task.text}
                                            onChangeText={(text) => handleUpdateTask(task.id, text)}
                                            autoFocus={editingTaskId === task.id}
                                            onFocus={() => setEditingTaskId(task.id)}
                                            onBlur={() => setEditingTaskId(null)}
                                            placeholder={t('tasks.newTaskPlaceholder') || "New task..."}
                                            placeholderTextColor={textMuted}
                                        />
                                        <TouchableOpacity onPress={() => handleDeleteTask(task.id)}>
                                            <X size={18} color={textMuted} />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            ) : (
                                <View style={tw`items-center justify-center w-full py-2`}>
                                    <Text style={[tw`italic text-[10px]`, { color: textMuted }]}>{t('tasks.empty')}</Text>
                                </View>
                            )}
                        </ScrollView>
                    ) : (
                        <ScrollView
                            ref={journalScrollRef}
                            style={tw`flex-1 p-6`}
                            contentContainerStyle={{ paddingBottom: 16 + keyboardInset }}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="interactive"
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={[tw`text-xs font-black uppercase tracking-widest text-center mb-4`, { color: textSecondary }]}>{t('journal.prompt')}</Text>
                            <View style={tw`flex-row justify-between mb-6`}>
                                {MOODS.map((m) => {
                                    const Icon = m.icon;
                                    const isSelected = localMood === m.value;
                                    return (
                                        <TouchableOpacity
                                            key={m.value}
                                            onPress={() => setLocalMood(m.value)}
                                            style={[
                                                tw`items-center p-1.5 rounded-lg border-2`,
                                                isSelected ? { borderColor: m.color, backgroundColor: m.color + '20' } : tw`border-transparent`
                                            ]}
                                        >
                                            <Icon
                                                size={26}
                                                color={isSelected ? m.color : textMuted}
                                                strokeWidth={isSelected ? 2.5 : 2}
                                            />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <View style={tw`relative mb-4`}>
                                <TextInput
                                    style={[tw`border-[3px] p-4 pb-14 rounded-xl h-60 text-base font-medium leading-relaxed`, { backgroundColor: panelSoftBg, borderColor: isDark ? '#262626' : '#e5e7eb', color: textPrimary }]}
                                    placeholder={t('journal.placeholder')}
                                    placeholderTextColor={textMuted}
                                    multiline
                                    textAlignVertical="top"
                                    value={localJournal}
                                    onChangeText={setLocalJournal}
                                    onFocus={() => {
                                        setTimeout(() => {
                                            journalScrollRef.current?.scrollTo({ y: 80, animated: true });
                                        }, 80);
                                    }}
                                    returnKeyType="done"
                                    blurOnSubmit={false}
                                />
                                <TouchableOpacity
                                    onPress={handleSaveJournal}
                                    style={[tw`absolute right-3 bottom-3 w-9 h-9 rounded-full border-2 border-black items-center justify-center`, { backgroundColor: '#000', borderColor: outlineColor }]}
                                >
                                    <Save size={14} color="white" />
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    )}
                    <StatusRow />
                </HardShadowCard>
            </Animated.View>
            )}
        </View>
    );
};
