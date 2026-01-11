import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, TextInput, Easing, Modal, useWindowDimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Check, ChevronLeft, ChevronRight, BookOpen, Save, Plus, X, Share, Meh, Frown, Smile, Laugh, Angry } from 'lucide-react-native';
import tw from 'twrnc';
import { isCompleted as checkCompleted } from '../utils/stats';
import { DAYS_OF_WEEK } from '../constants';
import Svg, { Circle } from 'react-native-svg';
import { NeoButton } from './NeoComponents';
import { DatePickerModal } from './DatePickerModal';

// Custom Hard Shadow Component defined outside to prevent re-renders
const HardShadowCard = ({ children, style }) => (
    <View style={style}>
        {/* Shadow Block */}
        <View style={[
            tw`absolute bg-black rounded-3xl`,
            { top: 8, left: 8, right: -8, bottom: -8, zIndex: -1 }
        ]} />
        {/* Main Content */}
        <View style={tw`bg-white border-[3px] border-black rounded-3xl overflow-hidden h-full`}>
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
    onPrev,
    onNext,
    onDateSelect,
    onShareClick,
    dayData,
    dateKey,
    updateNote
}) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTaskText, setNewTaskText] = useState('');
    const [editingTaskId, setEditingTaskId] = useState(null);
    const animatedValue = useRef(new Animated.Value(0)).current;

    const finalDayData = dayData || { tasks: [], mood: undefined, journal: '' };

    // Local state for journal/mood to allow editing before save (or auto-save)
    const [localJournal, setLocalJournal] = useState(finalDayData.journal || '');
    const [localMood, setLocalMood] = useState(finalDayData.mood);

    useEffect(() => {
        setLocalJournal(finalDayData.journal || '');
        setLocalMood(finalDayData.mood);
    }, [finalDayData.journal, finalDayData.mood]);

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
        { value: 1, icon: Angry, label: 'Very Bad', color: '#ef4444' },
        { value: 2, icon: Frown, label: 'Bad', color: '#f97316' },
        { value: 3, icon: Meh, label: 'Okay', color: '#eab308' },
        { value: 4, icon: Smile, label: 'Good', color: '#84cc16' },
        { value: 5, icon: Laugh, label: 'Great', color: '#22c55e' },
    ];

    // Animation interpolation
    const frontInterpolate = animatedValue.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
    });
    const backInterpolate = animatedValue.interpolate({
        inputRange: [0, 180],
        outputRange: ['180deg', '360deg'],
    });

    const flipToBack = () => {
        setIsFlipped(true);
        Animated.spring(animatedValue, {
            toValue: 180,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start();
    };

    const flipToFront = () => {
        setIsFlipped(false);
        Animated.spring(animatedValue, {
            toValue: 0,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start();
    };

    const handleSaveJournalOld = () => {
        // Deprecated, using the one above
        flipToFront();
    };

    const dayName = DAYS_OF_WEEK[date.getDay()];
    const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const isToday = date.toDateString() === new Date().toDateString();

    const dailyHabits = habits.filter(h => !h.weeklyTarget && (!h.frequency || h.frequency.includes(date.getDay())));
    const flexibleHabits = habits.filter(h => h.weeklyTarget);

    const getDayProgress = (d) => {
        if (dailyHabits.length === 0) return 100; // If no daily habits, it's "complete" or 100%? Web used 100 if totalDue is 0.
        const monthIdx = d.getMonth();
        const day = d.getDate();
        const year = d.getFullYear();
        let doneCount = 0;
        dailyHabits.forEach(h => {
            if (checkCompleted(h.id, day, completions, monthIdx, year)) {
                doneCount++;
            }
        });
        return (doneCount / dailyHabits.length) * 100;
    };

    const actualProgress = getDayProgress(date);
    const completedCount = dailyHabits.reduce((acc, h) =>
        acc + (checkCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear()) ? 1 : 0), 0);
    const totalCount = dailyHabits.length;

    const getFlexibleProgress = (habitId) => {
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
        const monday = new Date(date.getFullYear(), date.getMonth(), diff);

        let count = 0;
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
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

    const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
    const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

    const { height: screenHeight } = useWindowDimensions();
    const cardHeight = screenHeight - 220; // Corrected height to stay above bottom nav

    return (
        <View style={[tw`pb-0 pr-0`, { height: cardHeight }]}>
            <DatePickerModal
                isVisible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onSelect={onDateSelect}
                selectedDate={date}
                theme={theme}
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
                        <View style={tw`bg-white rounded-3xl w-full border-[3px] border-black overflow-hidden`}>
                            <View style={[tw`p-4 border-b-[3px] border-black items-center`, { backgroundColor: theme.primary }]}>
                                <Text style={tw`text-lg font-black uppercase text-white tracking-widest`}>Enter your task</Text>
                            </View>

                            <View style={tw`p-6`}>
                                <TextInput
                                    style={tw`bg-gray-50 border-[3px] border-black p-4 rounded-xl text-gray-800 text-lg font-bold mb-6`}
                                    placeholder="Type something..."
                                    placeholderTextColor="#d6d3d1"
                                    autoFocus={true}
                                    value={newTaskText}
                                    onChangeText={setNewTaskText}
                                    onSubmitEditing={confirmAddTask}
                                />

                                <View style={tw`flex-row gap-3`}>
                                    <TouchableOpacity
                                        onPress={() => setIsTaskModalOpen(false)}
                                        style={tw`flex-1 py-4 rounded-xl border-[3px] border-black bg-gray-100 items-center`}
                                    >
                                        <Text style={tw`text-black font-black uppercase text-xs tracking-widest`}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={confirmAddTask}
                                        style={[tw`flex-2 py-4 rounded-xl border-[3px] border-black items-center`, { backgroundColor: theme.primary }]}
                                    >
                                        <Text style={tw`text-white font-black uppercase text-xs tracking-widest`}>Add Task</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Front Face */}
            <Animated.View style={[tw`absolute inset-0 w-full h-full`, frontAnimatedStyle, { backfaceVisibility: 'hidden', zIndex: isFlipped ? 0 : 1 }]}>
                <HardShadowCard style={tw`h-full`}>
                    {/* Header */}
                    <View style={[tw`p-4 flex-row items-center justify-between border-b-[3px] border-black`, { backgroundColor: theme.secondary }]}>
                        <TouchableOpacity onPress={onPrev}>
                            <ChevronLeft size={24} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={tw`flex-row items-center gap-3`}>
                            <View style={tw`items-center`}>
                                <Text style={tw`text-white font-black uppercase text-xl tracking-tighter`}>{dayName}</Text>
                                <Text style={tw`text-white/80 font-bold text-[10px] tracking-widest`}>{dateString}</Text>
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
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onNext}>
                            <ChevronRight size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={tw`flex-1 bg-white`} showsVerticalScrollIndicator={false}>


                        {/* ... Habits List ... */}
                        <View style={tw`px-5 pb-6 pt-4`}>
                            <View style={tw`border-b border-gray-100 mb-2 pb-2 flex-row justify-between items-center`}>
                                <Text style={tw`text-xs font-black uppercase text-gray-400 tracking-widest`}>Daily Habits</Text>
                                <Text style={tw`text-xs font-black text-gray-400 mr-2`}>{dailyHabits.length}</Text>
                            </View>

                            {dailyHabits.length === 0 ? (
                                <Text style={tw`text-center text-gray-300 italic py-2 text-xs`}>No fixed habits today</Text>
                            ) : (
                                <View style={[tw`mb-4`, { maxHeight: 160 }]}>
                                    <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                                        {dailyHabits
                                            .map(habit => ({
                                                ...habit,
                                                done: checkCompleted(habit.id, date.getDate(), completions, date.getMonth(), date.getFullYear())
                                            }))
                                            .map(habit => (
                                                <TouchableOpacity
                                                    key={habit.id}
                                                    onPress={() => toggleCompletion(habit.id, dateKey)}
                                                    style={tw`flex-row items-center justify-between mb-2 mr-2`}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={[tw`text-base font-bold`, habit.done ? tw`text-gray-300 line-through` : tw`text-gray-800`]}>
                                                        {habit.name || 'Untitled'}
                                                    </Text>

                                                    <View style={[
                                                        tw`w-6 h-6 border-[2.5px] border-black items-center justify-center rounded-sm`,
                                                        habit.done ? tw`bg-black` : tw`bg-white`
                                                    ]}>
                                                        {habit.done && <Check size={16} color="white" strokeWidth={4} />}
                                                    </View>
                                                </TouchableOpacity>
                                            ))
                                        }
                                    </ScrollView>
                                </View>
                            )}

                            {flexibleHabits.length > 0 && (
                                <>
                                    <View style={tw`border-b border-gray-100 mb-2 pb-2 mt-0 flex-row justify-between items-center`}>
                                        <Text style={tw`text-xs font-black uppercase text-gray-400 tracking-widest`}>Flexible Habits</Text>
                                        <Text style={tw`text-xs font-black text-gray-400 mr-2`}>{flexibleHabits.length}</Text>
                                    </View>
                                    <View style={[tw`mb-2`, { maxHeight: 160 }]}>
                                        <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                                            {flexibleHabits.map(habit => {
                                                const flexDone = checkCompleted(habit.id, date.getDate(), completions, date.getMonth(), date.getFullYear());
                                                const current = getFlexibleProgress(habit.id);
                                                return (
                                                    <TouchableOpacity
                                                        key={habit.id}
                                                        onPress={() => toggleCompletion(habit.id, dateKey)}
                                                        style={tw`flex-row items-center justify-between mb-2 mr-2`}
                                                        activeOpacity={0.7}
                                                    >
                                                        <View>
                                                            <Text style={[tw`text-base font-bold`, flexDone ? tw`text-gray-300 line-through` : tw`text-gray-800`]}>
                                                                {habit.name || 'Untitled'}
                                                            </Text>
                                                            <Text style={tw`text-[10px] font-black text-gray-400 uppercase`}>
                                                                Goal: {current}/{habit.weeklyTarget} this week
                                                            </Text>
                                                        </View>

                                                        <View style={[
                                                            tw`w-6 h-6 border-[2.5px] border-black items-center justify-center rounded-sm`,
                                                            flexDone ? tw`bg-black` : tw`bg-white`
                                                        ]}>
                                                            {flexDone && <Check size={16} color="white" strokeWidth={4} />}
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    </View>
                                </>
                            )}
                        </View>

                        {/* Stats Row */}
                        <View style={tw`flex-row border-t-[3px] border-b-[3px] border-black`}>
                            <View style={[tw`flex-1 p-3 items-center border-r-[3px] border-black`, { backgroundColor: theme.primary }]}>
                                <Text style={tw`text-[10px] font-black uppercase text-white/80`}>Habits Maintained</Text>
                                <Text style={tw`text-2xl font-black text-white`}>{completedCount}</Text>
                            </View>
                            <View style={[tw`flex-1 p-3 items-center`, { backgroundColor: theme.secondary }]}>
                                <Text style={tw`text-[10px] font-black uppercase text-white/80`}>To Build</Text>
                                <Text style={tw`text-2xl font-black text-white`}>{Math.max(0, totalCount - completedCount)}</Text>
                            </View>
                        </View>

                        <View style={tw`flex-row items-center justify-between bg-gray-50 px-4 py-3 border-b-[3px] border-black`}>
                            <TouchableOpacity onPress={flipToBack}>
                                {(() => {
                                    const selectedMood = MOODS.find(m => m.value === localMood);
                                    if (selectedMood) {
                                        const MoodIcon = selectedMood.icon;
                                        return <MoodIcon size={24} color={selectedMood.color} strokeWidth={2.5} />;
                                    }
                                    return <BookOpen size={20} color="#a8a29e" />;
                                })()}
                            </TouchableOpacity>
                            <Text style={tw`text-xs font-black uppercase text-gray-500 tracking-widest`}>Tasks</Text>
                            <TouchableOpacity
                                onPress={handleAddTask}
                            >
                                <Plus size={20} color="#a8a29e" />
                            </TouchableOpacity>
                        </View>

                        <View style={tw`p-6 min-h-[100px]`}>
                            {(finalDayData.tasks && finalDayData.tasks.length > 0) ? (
                                finalDayData.tasks.map(task => (
                                    <View key={task.id} style={tw`w-full flex-row items-center gap-3 mb-3`}>
                                        <TouchableOpacity
                                            onPress={() => handleToggleTask(task.id)}
                                            style={[
                                                tw`w-6 h-6 border-[2.5px] border-black rounded-sm items-center justify-center`,
                                                task.completed ? tw`bg-black` : tw`bg-white`
                                            ]}
                                        >
                                            {task.completed && <Check size={14} color="white" strokeWidth={4} />}
                                        </TouchableOpacity>
                                        <TextInput
                                            style={[
                                                tw`flex-1 text-gray-800 font-bold text-base`,
                                                task.completed && tw`text-gray-300 line-through`
                                            ]}
                                            value={task.text}
                                            onChangeText={(text) => handleUpdateTask(task.id, text)}
                                            autoFocus={editingTaskId === task.id}
                                            onFocus={() => setEditingTaskId(task.id)}
                                            onBlur={() => setEditingTaskId(null)}
                                            placeholder="New task..."
                                            placeholderTextColor="#d6d3d1"
                                        />
                                        <TouchableOpacity onPress={() => handleDeleteTask(task.id)}>
                                            <X size={18} color="#d6d3d1" />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            ) : (
                                <View style={tw`items-center justify-center w-full py-2`}>
                                    <Text style={tw`text-gray-300 italic text-[10px]`}>No tasks yet. Click + to add one!</Text>
                                </View>
                            )}
                        </View>

                    </ScrollView>

                    {actualProgress === 100 && (
                        <TouchableOpacity
                            onPress={() => onShareClick && onShareClick({ date, dayName, dateString, completedCount, totalCount, progress: actualProgress })}
                            style={tw`absolute bottom-4 right-4 bg-black p-3 rounded-full shadow-lg z-50`}
                        >
                            <Share size={20} color="white" />
                        </TouchableOpacity>
                    )}

                </HardShadowCard>
            </Animated.View>

            {/* Back Face (Journal) */}
            <Animated.View style={[tw`absolute inset-0 w-full h-full`, backAnimatedStyle, { backfaceVisibility: 'hidden', zIndex: isFlipped ? 1 : 0 }]}>
                <HardShadowCard style={tw`h-full`}>
                    {/* Header */}
                    <View style={[tw`p-5 flex-row items-center border-b-[3px] border-black`, { backgroundColor: theme.secondary }]}>
                        <TouchableOpacity onPress={handleSaveJournal} style={tw`absolute left-4 z-10`}>
                            <ChevronLeft size={28} color="white" />
                        </TouchableOpacity>
                        <View style={tw`flex-1 items-center`}>
                            <Text style={tw`text-white font-black uppercase text-2xl tracking-tighter`}>Journal</Text>
                            <Text style={tw`text-white/90 font-bold text-sm tracking-widest mt-1`}>{dateString}</Text>
                        </View>
                    </View>

                    <ScrollView style={tw`flex-1 p-6`} showsVerticalScrollIndicator={false}>
                        <Text style={tw`text-xs font-black uppercase tracking-widest text-gray-400 text-center mb-4`}>How did today go?</Text>
                        <View style={tw`flex-row justify-between mb-8`}>
                            {MOODS.map((m) => {
                                const Icon = m.icon;
                                const isSelected = localMood === m.value;
                                return (
                                    <TouchableOpacity
                                        key={m.value}
                                        onPress={() => setLocalMood(m.value)}
                                        style={[
                                            tw`items-center p-2 rounded-xl border-2`,
                                            isSelected ? { borderColor: m.color, backgroundColor: m.color + '20' } : tw`border-transparent`
                                        ]}
                                    >
                                        <Icon
                                            size={32}
                                            color={isSelected ? m.color : '#d6d3d1'}
                                            strokeWidth={isSelected ? 2.5 : 2}
                                        />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TextInput
                            style={tw`bg-gray-50 border-[3px] border-gray-200 p-4 rounded-xl text-gray-800 h-60 text-base font-medium leading-relaxed mb-6`}
                            placeholder="Write your thoughts..."
                            placeholderTextColor="#d6d3d1"
                            multiline
                            textAlignVertical="top"
                            value={localJournal}
                            onChangeText={setLocalJournal}
                        />

                        <TouchableOpacity
                            onPress={handleSaveJournal}
                            style={[tw`w-full py-4 rounded-xl flex-row items-center justify-center gap-2 border-[3px] border-black`, { backgroundColor: '#000' }]}
                        >
                            <Save size={20} color="white" />
                            <Text style={tw`text-white font-black uppercase text-sm tracking-widest`}>Save Entry</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </HardShadowCard>
            </Animated.View>
        </View>
    );
};
