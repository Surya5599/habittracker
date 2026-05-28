import React, { useState, useRef, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, ScrollView, Animated, TextInput, Easing, useWindowDimensions, Platform, Keyboard, PanResponder, Alert } from 'react-native';
import { Check, ChevronLeft, ChevronRight, BookOpen, Save, Plus, X, Meh, Frown, Smile, Laugh, Angry, Minus, ClipboardList, ArrowUpDown, Pencil } from 'lucide-react-native';
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
    notes = {},
    colorMode = 'light',
    cardStyle = 'large',
    initialView = 'habits'
}) => {
    const startsFlipped = initialView === 'journal' || initialView === 'tasks';
    const [isFlipped, setIsFlipped] = useState(startsFlipped);
    const [backView, setBackView] = useState(startsFlipped ? initialView : 'journal');
    const [sortMode, setSortMode] = useState('default'); // 'default' | 'name' | 'color' | 'completion'
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [newTaskText, setNewTaskText] = useState('');
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [keyboardInset, setKeyboardInset] = useState(0);
    const viewSwitchAnim = useRef(new Animated.Value(1)).current;
    const [switchPhase, setSwitchPhase] = useState('idle'); // idle | out | in
    const isSwitchingRef = useRef(false);
    const flipAnim = useRef(new Animated.Value(startsFlipped ? 1 : 0)).current;
    const backSwitchAnim = useRef(new Animated.Value(0)).current;
    const journalScrollRef = useRef(null);
    const swipeLockRef = useRef(false);
    const onPrevRef = useRef(onPrev);
    const onNextRef = useRef(onNext);
    const { t, i18n } = useTranslation();
    const isDark = colorMode === 'dark';
    const isLargeLayout = cardStyle === 'large';
    const isCompact = !isLargeLayout;
    const activeTab = isFlipped ? backView : 'habits';
    const [statusRowWidth, setStatusRowWidth] = useState(0);
    const statusIndicatorAnim = useRef(new Animated.Value(0)).current;

    const finalDayData = dayData || { tasks: [], mood: undefined, journal: [] };

    const [isAddingEntry, setIsAddingEntry] = useState(false);
    const [newEntryText, setNewEntryText] = useState('');
    const [newEntryMood, setNewEntryMood] = useState(undefined);
    const [editingEntryId, setEditingEntryId] = useState(null);
    const [editingEntryText, setEditingEntryText] = useState('');
    const [editingEntryMood, setEditingEntryMood] = useState(undefined);

    useEffect(() => {
        onPrevRef.current = onPrev;
        onNextRef.current = onNext;
    }, [onPrev, onNext]);

    useEffect(() => {
        AsyncStorage.getItem('habit_sort_mode').then((saved) => {
            if (saved) setSortMode(saved);
        });
    }, []);

    const handleSortModeChange = useCallback((next) => {
        setSortMode(next);
        AsyncStorage.setItem('habit_sort_mode', next);
    }, []);

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

    const handleAddEntry = () => {
        if (!newEntryText.trim()) return;
        const entry = { id: Date.now().toString(), text: newEntryText.trim(), mood: newEntryMood, createdAt: Date.now() };
        const current = Array.isArray(finalDayData.journal) ? finalDayData.journal : [];
        const updated = [...current, entry];
        const latestMood = [...updated].reverse().find(e => e.mood)?.mood;
        updateNote && updateNote(dateKey, { journal: updated, mood: latestMood });
        setNewEntryText('');
        setNewEntryMood(undefined);
        setIsAddingEntry(false);
    };

    const handleUpdateEntry = (id) => {
        if (!editingEntryText.trim()) return;
        const current = Array.isArray(finalDayData.journal) ? finalDayData.journal : [];
        const updated = current.map(e => e.id === id ? { ...e, text: editingEntryText.trim(), mood: editingEntryMood } : e);
        const latestMood = [...updated].reverse().find(e => e.mood)?.mood;
        updateNote && updateNote(dateKey, { journal: updated, mood: latestMood });
        setEditingEntryId(null);
        setEditingEntryText('');
        setEditingEntryMood(undefined);
    };

    const handleDeleteEntry = (id) => {
        const current = Array.isArray(finalDayData.journal) ? finalDayData.journal : [];
        updateNote && updateNote(dateKey, { journal: current.filter(e => e.id !== id) });
    };

    const formatEntryTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const confirmAddTask = () => {
        if (newTaskText.trim() === '') return;
        const taskId = Date.now().toString();
        const newTask = { id: taskId, text: newTaskText.trim(), completed: false };
        const currentTasks = finalDayData.tasks || [];
        updateNote && updateNote(dateKey, { tasks: [...currentTasks, newTask] });
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


    const handleHabitTap = (habit) => {
        if (habit.inactive) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (toggleHabitInactive) toggleHabitInactive(habit.id, dateKey);
        } else if (habit.done) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            toggleCompletion(habit.id, dateKey);
            if (toggleHabitInactive) toggleHabitInactive(habit.id, dateKey);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleCompletion(habit.id, dateKey);
        }
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

        setSwitchPhase('out');
        Animated.timing(viewSwitchAnim, {
            toValue: 0,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
        }).start(() => {
            applyStateChange();
            setSwitchPhase('in');
            viewSwitchAnim.setValue(0);
            Animated.timing(viewSwitchAnim, {
                toValue: 1,
                duration: 200,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true
            }).start(() => {
                setSwitchPhase('idle');
                isSwitchingRef.current = false;
            });
        });
    };

    const switchCardView = (targetView) => {
        const currentView = isFlipped ? backView : 'habits';
        if (currentView === targetView || isSwitchingRef.current) return;

        const goingToBack = targetView !== 'habits';

        if (goingToBack && !isFlipped) {
            // habits → tasks/journal: flip forward
            isSwitchingRef.current = true;
            setBackView(targetView);
            Animated.timing(flipAnim, {
                toValue: 1,
                duration: 360,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start(() => {
                setIsFlipped(true);
                isSwitchingRef.current = false;
            });
        } else if (!goingToBack && isFlipped) {
            // tasks/journal → habits: flip back
            isSwitchingRef.current = true;
            Animated.timing(flipAnim, {
                toValue: 0,
                duration: 360,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start(() => {
                setIsFlipped(false);
                isSwitchingRef.current = false;
            });
        } else {
            // back-to-back: tasks ↔ journal, flip the inner content
            isSwitchingRef.current = true;
            Animated.timing(backSwitchAnim, {
                toValue: 0.5,
                duration: 180,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start(() => {
                setBackView(targetView);
                Animated.timing(backSwitchAnim, {
                    toValue: 1,
                    duration: 180,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }).start(() => {
                    backSwitchAnim.setValue(0);
                    isSwitchingRef.current = false;
                });
            });
        }
    };

    const openJournalView = () => switchCardView('journal');
    const openTasksView = () => switchCardView('tasks');
    const flipToFront = () => switchCardView('habits');

    useEffect(() => {
        if (!statusRowWidth) return;
        const tabIndex = activeTab === 'habits' ? 0 : activeTab === 'tasks' ? 1 : 2;
        const targetX = (statusRowWidth / 3) * tabIndex;
        Animated.timing(statusIndicatorAnim, {
            toValue: targetX,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
        }).start();
    }, [activeTab, statusRowWidth, statusIndicatorAnim]);

    const dayName = date.toLocaleDateString(i18n.language, { weekday: 'long' });
    const shortDayName = date.toLocaleDateString(i18n.language, { weekday: 'short' });
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
    const journalEntries = Array.isArray(finalDayData.journal) ? finalDayData.journal : [];
    const hasJournalEntry = journalEntries.some(e => (e.text || '').trim());
    const displayMood = [...journalEntries].reverse().find(e => e.mood)?.mood ?? finalDayData.mood;
    const selectedMood = MOODS.find(m => m.value === displayMood);
    const MoodStatusIcon = selectedMood?.icon || Meh;
    const panelBg = isDark ? '#0b0b0b' : '#ffffff';
    const panelSoftBg = isDark ? '#161616' : '#f9fafb';
    const textPrimary = isDark ? '#e5e7eb' : '#161616';
    const textSecondary = isDark ? '#9ca3af' : '#6b7280';
    const textMuted = isDark ? '#6b7280' : '#d6d3d1';
    const borderSoft = isDark ? '#262626' : '#f3f4f6';
    const outlineColor = isDark ? '#ffffff' : '#000000';
    const dateHeaderBg = isDark ? '#000000' : theme.secondary;
    const headerCircleSize = 60;
    const headerCircleRadius = 27;
    const headerCircleStroke = 5;
    const headerTitleSize = 28;
    const headerDateSize = 11;
    const listItemTextSize = isLargeLayout ? 16 : 17;
    const listItemSpacing = isLargeLayout ? 4 : 4;
    const checkBoxSize = isLargeLayout ? 28 : 30;

    const StatusRow = () => (
        <View
            onLayout={(e) => setStatusRowWidth(e.nativeEvent.layout.width)}
            style={[tw`relative flex-row border-t-[3px]`, { backgroundColor: panelSoftBg, borderTopColor: outlineColor }]}
        >
            {/* Active tab indicator — coloured bar that overlays the top border */}
            {statusRowWidth > 0 ? (
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: -3,
                        left: 0,
                        width: statusRowWidth / 3,
                        height: 3,
                        backgroundColor: theme.primary,
                        transform: [{ translateX: statusIndicatorAnim }],
                    }}
                />
            ) : null}

            <TouchableOpacity
                onPress={flipToFront}
                style={[tw`flex-1 py-3 border-r items-center justify-center`, { borderRightColor: outlineColor }]}
            >
                <Check size={15} color={activeTab === 'habits' ? theme.primary : textSecondary} strokeWidth={2.5} />
                <Text style={[tw`text-[8px] font-black uppercase tracking-wider mt-1`, { color: activeTab === 'habits' ? theme.primary : textSecondary }]}>
                    {t('common.myHabits')}
                </Text>
                <Text style={[tw`text-[11px] font-black mt-0.5`, { color: textPrimary }]}>
                    {completedHabitsCount}/{totalHabitsCount}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={openTasksView}
                style={[tw`flex-1 py-3 border-r items-center justify-center`, { borderRightColor: outlineColor }]}
            >
                <ClipboardList size={15} color={activeTab === 'tasks' ? theme.primary : textSecondary} strokeWidth={2} />
                <Text style={[tw`text-[8px] font-black uppercase tracking-wider mt-1`, { color: activeTab === 'tasks' ? theme.primary : textSecondary }]}>
                    {t('dailyCard.tasks')}
                </Text>
                <Text style={[tw`text-[11px] font-black mt-0.5`, { color: textPrimary }]}>
                    {totalTasksCount > 0 ? `${completedTasksCount}/${totalTasksCount}` : '—'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={openJournalView}
                style={tw`flex-1 py-3 items-center justify-center`}
            >
                {selectedMood
                    ? <MoodStatusIcon size={15} color={selectedMood.color} strokeWidth={2.5} />
                    : <BookOpen size={15} color={activeTab === 'journal' ? theme.primary : textSecondary} strokeWidth={2} />
                }
                <Text style={[tw`text-[8px] font-black uppercase tracking-wider mt-1`, { color: activeTab === 'journal' ? theme.primary : textSecondary }]}>
                    {t('dailyCard.journal')}
                </Text>
                <Text style={[tw`text-[11px] font-black mt-0.5`, { color: textPrimary }]}>
                    {hasJournalEntry ? '✓' : '—'}
                </Text>
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
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const prevProgressRef = useRef(actualProgress);

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: actualProgress,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
        }).start();
    }, [actualProgress]);

    useEffect(() => {
        if (actualProgress === 100 && prevProgressRef.current < 100 && totalCount > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.12, duration: 160, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
                Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, damping: 6, stiffness: 180 }),
            ]).start();
        }
        prevProgressRef.current = actualProgress;
    }, [actualProgress, totalCount]);

    const strokeDashoffset = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, 0],
    });

    const { height: screenHeight } = useWindowDimensions();
    const { width: screenWidth } = useWindowDimensions();
    const cardHeight = screenHeight - 220; // Corrected height to stay above bottom nav
    const swipeX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        swipeX.setValue(0);
    }, [dateKey, swipeX]);

    const runDaySwipe = (direction) => {
        const isNext = direction === 'next';
        const exitTo = isNext ? -screenWidth * 1.05 : screenWidth * 1.05;
        const enterFrom = isNext ? screenWidth * 0.65 : -screenWidth * 0.65;

        Animated.timing(swipeX, {
            toValue: exitTo,
            duration: 180,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true
        }).start(() => {
            if (isNext) {
                onNextRef.current && onNextRef.current();
            } else {
                onPrevRef.current && onPrevRef.current();
            }

            swipeX.setValue(enterFrom);
            Animated.spring(swipeX, {
                toValue: 0,
                useNativeDriver: true,
                damping: 16,
                stiffness: 180,
                mass: 0.9
            }).start(() => {
                swipeLockRef.current = false;
            });
        });
    };

    const snapBackSwipe = () => {
        Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: true,
            damping: 14,
            stiffness: 220,
            mass: 0.8
        }).start();
    };

    const swipeResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                const absDx = Math.abs(gestureState.dx);
                const absDy = Math.abs(gestureState.dy);
                return !swipeLockRef.current && absDx > 14 && absDx > absDy * 1.3;
            },
            onPanResponderMove: (_, gestureState) => {
                if (swipeLockRef.current) return;
                swipeX.setValue(gestureState.dx);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (swipeLockRef.current) return;
                const dx = gestureState.dx;
                const vx = gestureState.vx;
                const isStrongSwipe = Math.abs(dx) > 48 || Math.abs(vx) > 0.55;
                if (!isStrongSwipe) {
                    snapBackSwipe();
                    return;
                }

                swipeLockRef.current = true;
                if (dx < 0) {
                    runDaySwipe('next');
                } else {
                    runDaySwipe('prev');
                }
            },
            onPanResponderTerminate: () => {
                snapBackSwipe();
            }
        })
    ).current;

    const swipeCardStyle = {
        transform: [
            { translateX: swipeX },
            {
                rotateZ: swipeX.interpolate({
                    inputRange: [-screenWidth, 0, screenWidth],
                    outputRange: ['-8deg', '0deg', '8deg']
                })
            },
            {
                scale: swipeX.interpolate({
                    inputRange: [-screenWidth, 0, screenWidth],
                    outputRange: [0.96, 1, 0.96]
                })
            }
        ],
        opacity: swipeX.interpolate({
            inputRange: [-screenWidth, 0, screenWidth],
            outputRange: [0.86, 1, 0.86]
        })
    };
    const viewSwitchStyle = {
        transform: [
            {
                translateX: viewSwitchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: switchPhase === 'out' ? [-6, 0] : [10, 0]
                })
            },
            {
                scale: viewSwitchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.995, 1]
                })
            }
        ],
        opacity: viewSwitchAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.86, 1]
        })
    };

    // Inner flip for tasks ↔ journal (same "back" side of the card)
    const backSwitchFlipStyle = {
        transform: [
            { perspective: 1000 },
            {
                rotateY: backSwitchAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: ['0deg', '90deg', '0deg'],
                }),
            },
        ],
        opacity: backSwitchAnim.interpolate({
            inputRange: [0, 0.44, 0.5, 0.56, 1],
            outputRange: [1, 1, 0, 1, 1],
        }),
    };

    // Two-phase flip: front sweeps 0→90° out, then back sweeps -90→0° in.
    // Each face only ever shows its front face — no backfaceVisibility needed.
    const frontFlipStyle = {
        transform: [
            { perspective: 1000 },
            {
                rotateY: flipAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: ['0deg', '90deg', '90deg'],
                }),
            },
        ],
        opacity: flipAnim.interpolate({
            inputRange: [0, 0.44, 0.5, 1],
            outputRange: [1, 1, 0, 0],
        }),
    };

    const backFlipStyle = {
        transform: [
            { perspective: 1000 },
            {
                rotateY: flipAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: ['-90deg', '-90deg', '0deg'],
                }),
            },
        ],
        opacity: flipAnim.interpolate({
            inputRange: [0, 0.5, 0.56, 1],
            outputRange: [0, 0, 1, 1],
        }),
    };

    return (
        <Animated.View style={[tw`pb-0 pr-0`, { height: cardHeight }, swipeCardStyle]} {...swipeResponder.panHandlers}>
            <DatePickerModal
                isVisible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onSelect={onDateSelect}
                selectedDate={date}
                theme={theme}
                colorMode={colorMode}
            />

            <View style={tw`h-full`}>
                {/* Front Face */}
                <Animated.View
                    style={[{ position: 'absolute', width: '100%', height: '100%' }, frontFlipStyle]}
                    pointerEvents={isFlipped ? 'none' : 'auto'}
                >
                    <View style={[tw`border-[3px] rounded-3xl overflow-hidden h-full`, { backgroundColor: isDark ? '#0b0b0b' : '#ffffff', borderColor: isDark ? '#ffffff' : '#000000' }]}>
                    {/* Header */}
                    <View style={[tw`flex-row items-center justify-between border-b-[3px] border-black`, { paddingHorizontal: isLargeLayout ? 14 : 16, paddingVertical: isLargeLayout ? 12 : 16, backgroundColor: dateHeaderBg, borderBottomColor: outlineColor }]}>
                        <TouchableOpacity onPress={onPrev}>
                            <ChevronLeft size={24} color="white" />
                        </TouchableOpacity>

                        <View style={tw`flex-row items-center gap-3`}>
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7} style={tw`items-center`}>
                                <Text style={[tw`text-white font-black uppercase tracking-tighter`, { fontSize: headerTitleSize, lineHeight: headerTitleSize + 2 }]}>{dayName}</Text>
                                <Text style={[tw`text-white/80 font-bold tracking-widest`, { fontSize: headerDateSize }]}>{dateString}</Text>
                            </TouchableOpacity>

                            <View style={tw`flex-row items-center gap-2`}>
                                    <View style={{ width: headerCircleSize, height: headerCircleSize, alignItems: 'center', justifyContent: 'center' }}>
                                        <Svg width={headerCircleSize} height={headerCircleSize} style={{ transform: [{ rotate: '-90deg' }] }}>
                                            <Circle
                                                stroke="rgba(255,255,255,0.2)"
                                                cx={headerCircleSize / 2}
                                                cy={headerCircleSize / 2}
                                                r={headerCircleRadius}
                                                strokeWidth={headerCircleStroke}
                                                fill="transparent"
                                            />
                                            <AnimatedCircle
                                                stroke="white"
                                                cx={headerCircleSize / 2}
                                                cy={headerCircleSize / 2}
                                                r={headerCircleRadius}
                                                strokeWidth={headerCircleStroke}
                                                fill="transparent"
                                                strokeDasharray={headerCircleRadius * 2 * Math.PI}
                                                strokeDashoffset={progressAnim.interpolate({
                                                    inputRange: [0, 100],
                                                    outputRange: [headerCircleRadius * 2 * Math.PI, 0],
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

                    <View style={[tw`flex-1`, { backgroundColor: panelBg }]}>
                        <View style={[tw`px-5 pt-3 pb-2 border-b`, { borderColor: borderSoft }]}>
                            <View style={tw`flex-row justify-between items-center`}>
                                <Text style={[tw`text-xs font-black uppercase tracking-widest`, { color: textSecondary }]}>{t('common.myHabits')}</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        const next = sortMode === 'default' ? 'name' : sortMode === 'name' ? 'color' : sortMode === 'color' ? 'completion' : 'default';
                                        handleSortModeChange(next);
                                    }}
                                    style={[tw`flex-row items-center gap-1 px-2 py-0.5 rounded-full`, { backgroundColor: sortMode !== 'default' ? theme.primary + '22' : borderSoft }]}
                                    activeOpacity={0.7}
                                >
                                    <ArrowUpDown size={10} color={sortMode !== 'default' ? theme.primary : textSecondary} strokeWidth={2.5} />
                                    <Text style={[tw`text-[9px] font-black uppercase tracking-wider`, { color: sortMode !== 'default' ? theme.primary : textSecondary }]}>
                                        {sortMode === 'name' ? 'A–Z' : sortMode === 'color' ? 'Color' : sortMode === 'completion' ? 'To Do' : 'Sort'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView
                            style={tw`flex-1 px-5`}
                            contentContainerStyle={{ paddingTop: 10, paddingBottom: 12 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {visibleHabitsForDate.length === 0 ? (
                                <Text style={[tw`text-center italic py-2 text-xs`, { color: textMuted }]}>
                                    {habits.length === 0
                                        ? 'Tap + Add, then type your first habit name'
                                        : t('dailyCard.noDailyHabits')}
                                </Text>
                            ) : (
                                <View style={tw`mb-2`}>
                                    {visibleHabitsForDate
                                        .map(habit => ({
                                            ...habit,
                                            done: checkCompleted(habit.id, date.getDate(), completions, date.getMonth(), date.getFullYear()),
                                            weeklyDone: habit.weeklyTarget ? getFlexibleProgress(habit.id) : null,
                                            inactive: isHabitInactiveOnDate(habit.id)
                                        }))
                                        .sort((a, b) => {
                                            if (sortMode === 'name') return (a.name || '').localeCompare(b.name || '');
                                            if (sortMode === 'color') return (a.color || '').localeCompare(b.color || '');
                                            if (sortMode === 'completion') {
                                                const aTodo = !a.done && !a.inactive;
                                                const bTodo = !b.done && !b.inactive;
                                                if (aTodo && !bTodo) return -1;
                                                if (!aTodo && bTodo) return 1;
                                                return 0;
                                            }
                                            return 0; // default: preserve original sortOrder
                                        })
                                        .map(habit => (
                                            <TouchableOpacity
                                                key={habit.id}
                                                onPress={() => handleHabitTap(habit)}
                                                style={[tw`flex-row items-center`, { marginBottom: listItemSpacing, paddingVertical: 9 }]}
                                                activeOpacity={0.65}
                                            >
                                                {/* Colored accent bar */}
                                                <View style={{
                                                    width: 3,
                                                    alignSelf: 'stretch',
                                                    borderRadius: 2,
                                                    marginRight: 11,
                                                    backgroundColor: habit.inactive ? '#b45309' : (habit.color || theme.primary),
                                                    opacity: habit.done ? 0.3 : 1,
                                                }} />

                                                <View style={tw`flex-row items-center flex-1 mr-2`}>
                                                    <Text style={[
                                                        tw`font-bold flex-shrink`,
                                                        { fontSize: listItemTextSize },
                                                        habit.inactive
                                                            ? { color: '#b45309' }
                                                            : (habit.done ? { color: textMuted, textDecorationLine: 'line-through' } : { color: textPrimary })
                                                    ]}>
                                                        {habit.name || t('common.untitled')}
                                                    </Text>
                                                    {habit.weeklyTarget ? (
                                                        <View style={[tw`ml-2 px-1.5 py-0.5 rounded`, { backgroundColor: theme.primary + '22' }]}>
                                                            <Text style={[tw`text-[9px] font-black`, { color: theme.primary }]}>
                                                                {habit.weeklyDone}/{habit.weeklyTarget} wk
                                                            </Text>
                                                        </View>
                                                    ) : null}
                                                </View>

                                                <View style={[
                                                    tw`border-[2.5px] items-center justify-center rounded-sm`,
                                                    { width: checkBoxSize, height: checkBoxSize },
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
                        </ScrollView>
                    </View>

                    {/* Habit state legend */}
                    {visibleHabitsForDate.length > 0 && (
                        <View style={[tw`flex-row items-center justify-center gap-4 pb-2 pt-1`, { borderTopWidth: 1, borderColor: borderSoft }]}>
                            {[
                                { label: 'To do', bg: panelBg, borderColor: outlineColor, icon: null },
                                { label: 'Done', bg: '#000000', borderColor: outlineColor, icon: <Check size={10} color="white" strokeWidth={4} /> },
                                { label: 'Rest', bg: '#fcd34d', borderColor: '#b45309', icon: <Minus size={10} color="#78350f" strokeWidth={4} /> },
                            ].map(({ label, bg, borderColor, icon }) => (
                                <View key={label} style={tw`flex-row items-center gap-1.5`}>
                                    <View style={[tw`border-[2px] rounded-sm items-center justify-center`, { width: 14, height: 14, backgroundColor: bg, borderColor }]}>
                                        {icon}
                                    </View>
                                    <Text style={[tw`text-[9px] font-black uppercase tracking-widest`, { color: textMuted }]}>{label}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <StatusRow />
                    </View>
                </Animated.View>

                {/* Back Face */}
                <Animated.View
                    style={[{ position: 'absolute', width: '100%', height: '100%' }, backFlipStyle]}
                    pointerEvents={isFlipped ? 'auto' : 'none'}
                >
                    <Animated.View style={[tw`w-full h-full`, backSwitchFlipStyle]}>
                    <View style={[tw`border-[3px] rounded-3xl overflow-hidden h-full`, { backgroundColor: isDark ? '#0b0b0b' : '#ffffff', borderColor: isDark ? '#ffffff' : '#000000' }]}>
                    {/* Header */}
                    <View style={[tw`flex-row items-center border-b-[3px] border-black`, { paddingHorizontal: isCompact ? 14 : 20, paddingVertical: isCompact ? 10 : 20, backgroundColor: dateHeaderBg, borderBottomColor: outlineColor }]}>
                        <TouchableOpacity onPress={onPrev} style={tw`absolute left-4 z-10`}>
                            <ChevronLeft size={isCompact ? 24 : 28} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7} style={tw`flex-1 items-center`}>
                            <Text style={[tw`text-white font-black uppercase tracking-tighter`, { fontSize: isCompact ? 24 : 30, lineHeight: isCompact ? 26 : 32 }]}>
                                {backView === 'tasks' ? t('dailyCard.tasks') : t('journal.title')}
                            </Text>
                            <Text style={[tw`text-white/90 font-bold tracking-widest mt-1`, { fontSize: isCompact ? 12 : 14 }]}>
                                <Text style={{ opacity: 0.9 }}>{shortDayName}</Text>
                                <Text>{`, ${dateString}`}</Text>
                            </Text>
                        </TouchableOpacity>
                        <View style={tw`absolute right-4 z-10 flex-row items-center gap-3`}>
                            <TouchableOpacity onPress={onNext}>
                                <ChevronRight size={isCompact ? 24 : 28} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {backView === 'tasks' ? (
                        <ScrollView style={tw`flex-1 p-6`} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {/* Inline task input */}
                            <View style={[tw`flex-row items-center gap-3 mb-3 pb-3 border-b-[2px]`, { borderColor: borderSoft }]}>
                                <View style={[tw`w-6 h-6 border-[2px] rounded-sm items-center justify-center`, { borderColor: textMuted, borderStyle: 'dashed' }]} />
                                <TextInput
                                    style={[tw`flex-1 font-bold text-base`, { color: textPrimary, lineHeight: 22, paddingVertical: 0, minHeight: 24, includeFontPadding: false, textAlignVertical: 'center' }]}
                                    value={newTaskText}
                                    onChangeText={setNewTaskText}
                                    onSubmitEditing={confirmAddTask}
                                    placeholder={t('tasks.addTask') || 'Add a task...'}
                                    placeholderTextColor={textMuted}
                                    returnKeyType="done"
                                    blurOnSubmit={false}
                                />
                            </View>

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
                            style={tw`flex-1 p-4`}
                            contentContainerStyle={{ paddingBottom: 32 + keyboardInset }}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="interactive"
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Existing entries */}
                            {journalEntries.map((entry) => {
                                const entryMoodObj = MOODS.find(m => m.value === entry.mood);
                                const EntryMoodIcon = entryMoodObj?.icon;
                                return (
                                    <View
                                        key={entry.id}
                                        style={[tw`mb-3 rounded-xl border-2 overflow-hidden`, { borderColor: borderSoft, backgroundColor: panelSoftBg }]}
                                    >
                                        {editingEntryId === entry.id ? (
                                            <View>
                                                <TextInput
                                                    style={[tw`p-3 text-sm font-medium`, { color: textPrimary, minHeight: 80, textAlignVertical: 'top' }]}
                                                    value={editingEntryText}
                                                    onChangeText={setEditingEntryText}
                                                    multiline
                                                    autoFocus
                                                    onFocus={() => setTimeout(() => journalScrollRef.current?.scrollToEnd({ animated: true }), 80)}
                                                />
                                                {/* Mood row below text, above action bar */}
                                                <View style={[tw`flex-row justify-between px-3 py-2 border-t-2`, { borderColor: borderSoft }]}>
                                                    {MOODS.map((m) => {
                                                        const Icon = m.icon;
                                                        const isSel = editingEntryMood === m.value;
                                                        return (
                                                            <TouchableOpacity
                                                                key={m.value}
                                                                onPress={() => setEditingEntryMood(isSel ? undefined : m.value)}
                                                                style={[
                                                                    tw`flex-1 items-center py-1.5 rounded-lg border-2 mx-0.5`,
                                                                    isSel ? { borderColor: m.color, backgroundColor: m.color + '20' } : tw`border-transparent`
                                                                ]}
                                                            >
                                                                <Icon size={20} color={isSel ? m.color : textMuted} strokeWidth={isSel ? 2.5 : 2} />
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                                <View style={[tw`flex-row justify-between items-center px-3 py-2 border-t-2`, { borderColor: borderSoft }]}>
                                                    <TouchableOpacity onPress={() => { setEditingEntryId(null); setEditingEntryText(''); setEditingEntryMood(undefined); }}>
                                                        <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: textMuted }]}>{t('common.cancel')}</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => handleUpdateEntry(entry.id)}
                                                        style={[tw`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg`, { backgroundColor: outlineColor }]}
                                                    >
                                                        <Save size={11} color={isDark ? '#000' : '#fff'} />
                                                        <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: isDark ? '#000' : '#fff' }]}>{t('journal.save')}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ) : (
                                            <View>
                                                {EntryMoodIcon && (
                                                    <View style={[tw`px-3 py-2 border-b-2`, { borderColor: borderSoft }]}>
                                                        <EntryMoodIcon size={16} color={entryMoodObj.color} strokeWidth={2.5} />
                                                    </View>
                                                )}
                                                <Text style={[tw`px-3 py-3 text-sm font-medium leading-relaxed`, { color: textPrimary }]}>{entry.text}</Text>
                                                <View style={[tw`flex-row items-center justify-between px-3 py-2 border-t-2`, { borderColor: borderSoft }]}>
                                                    <Text style={[tw`text-[9px] font-black uppercase tracking-widest`, { color: textMuted }]}>
                                                        {formatEntryTime(entry.createdAt)}
                                                    </Text>
                                                    <View style={tw`flex-row gap-4`}>
                                                        <TouchableOpacity onPress={() => { setEditingEntryId(entry.id); setEditingEntryText(entry.text); setEditingEntryMood(entry.mood); }}>
                                                            <Pencil size={13} color={textSecondary} />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)}>
                                                            <X size={13} color={textMuted} />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}

                            {/* Empty state */}
                            {journalEntries.length === 0 && !isAddingEntry && (
                                <Text style={[tw`text-[10px] font-black uppercase tracking-widest text-center py-3 mb-3`, { color: textMuted }]}>
                                    {t('journal.empty')}
                                </Text>
                            )}

                            {/* New entry input or add button */}
                            {isAddingEntry ? (
                                <View style={[tw`rounded-xl border-2 overflow-hidden`, { borderColor: outlineColor, backgroundColor: panelSoftBg }]}>
                                    <TextInput
                                        style={[tw`p-3 text-sm font-medium`, { color: textPrimary, minHeight: 100, textAlignVertical: 'top' }]}
                                        value={newEntryText}
                                        onChangeText={setNewEntryText}
                                        placeholder={t('journal.placeholder')}
                                        placeholderTextColor={textMuted}
                                        multiline
                                        autoFocus
                                        onFocus={() => setTimeout(() => journalScrollRef.current?.scrollToEnd({ animated: true }), 80)}
                                    />
                                    {/* Mood row below text, above action bar */}
                                    <View style={[tw`flex-row justify-between px-3 py-2 border-t-2`, { borderColor: borderSoft }]}>
                                        {MOODS.map((m) => {
                                            const Icon = m.icon;
                                            const isSel = newEntryMood === m.value;
                                            return (
                                                <TouchableOpacity
                                                    key={m.value}
                                                    onPress={() => setNewEntryMood(isSel ? undefined : m.value)}
                                                    style={[
                                                        tw`flex-1 items-center py-1.5 rounded-lg border-2 mx-0.5`,
                                                        isSel ? { borderColor: m.color, backgroundColor: m.color + '20' } : tw`border-transparent`
                                                    ]}
                                                >
                                                    <Icon size={20} color={isSel ? m.color : textMuted} strokeWidth={isSel ? 2.5 : 2} />
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                    <View style={[tw`flex-row justify-between items-center px-3 py-2 border-t-2`, { borderColor: borderSoft }]}>
                                        <TouchableOpacity onPress={() => { setIsAddingEntry(false); setNewEntryText(''); setNewEntryMood(undefined); }}>
                                            <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: textMuted }]}>{t('common.cancel')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleAddEntry}
                                            style={[tw`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg`, { backgroundColor: outlineColor }]}
                                        >
                                            <Save size={11} color={isDark ? '#000' : '#fff'} />
                                            <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: isDark ? '#000' : '#fff' }]}>{t('journal.save')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setIsAddingEntry(true)}
                                    style={[tw`flex-row items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed`, { borderColor: theme.primary + '80' }]}
                                >
                                    <Plus size={14} color={theme.primary} />
                                    <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: theme.primary }]}>
                                        {t('journal.addEntry')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    )}
                    <StatusRow />
                    </View>
                    </Animated.View>
                </Animated.View>
            </View>
        </Animated.View>
    );
};
