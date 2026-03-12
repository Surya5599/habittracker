import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import tw from 'twrnc';
import { ChevronRight, BookOpen, CheckSquare, X, Meh, ListTodo, Search } from 'lucide-react-native';
import { isCompleted as checkCompleted } from '../utils/stats';
import { DailyCard } from '../components/DailyCard';
import { MOODS } from '../constants';


export const MonthlyView = ({
    habits,
    completions,
    notes,
    theme,
    toggleCompletion,
    toggleHabitInactive,
    isHabitInactive,
    updateNote,
    colorMode = 'light',
    cardStyle = 'large',
    initialSelectedDate = null
}) => {
    const { t, i18n } = useTranslation();
    const [mode, setMode] = useState('journals'); // 'journals' | 'habits' | 'tasks'
    const [selectedDate, setSelectedDate] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!initialSelectedDate) return;
        const d = new Date(initialSelectedDate);
        if (Number.isNaN(d.getTime())) return;
        setSelectedDate(d);
    }, [initialSelectedDate]);

    const generateLast30Days = () => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            days.push(d);
        }
        return days;
    };

    const days = generateLast30Days();

    const isDark = colorMode === 'dark';
    const panelBg = isDark ? '#0a0a0a' : '#ffffff';
    const panelSoftBg = isDark ? '#111111' : '#f3f4f6';
    const panelBorder = isDark ? '#ffffff' : '#f3f4f6';
    const divider = isDark ? '#ffffff' : '#f9fafb';
    const textPrimary = isDark ? '#f5f5f5' : '#161616';
    const textMuted = isDark ? '#a3a3a3' : '#9ca3af';
    const isHabitStartedByDate = (habit, date) => {
        if (!habit?.createdAt) return true;
        const createdDate = new Date(habit.createdAt);
        createdDate.setHours(0, 0, 0, 0);
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);
        return target >= createdDate;
    };

    const getHabitActivityForDate = (date) => {
        const dailyDue = habits.filter(h =>
            isHabitStartedByDate(h, date) &&
            !h.weeklyTarget &&
            (!h.frequency || h.frequency.includes(date.getDay()))
        );
        const flexibleDone = habits.filter(h =>
            isHabitStartedByDate(h, date) &&
            h.weeklyTarget &&
            checkCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear())
        );
        return [...dailyDue, ...flexibleDone];
    };

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const visibleDays = days.filter((date) => {
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const dayData = notes?.[dateKey] || {};
        const tasks = Array.isArray(dayData.tasks) ? dayData.tasks : [];
        const journalText = (dayData.journal || '').trim();
        const habitActivity = getHabitActivityForDate(date);

        const hasJournal = journalText.length > 0;
        const hasHabits = habitActivity.length > 0;
        const hasTasks = tasks.length > 0;

        const modeMatch =
            mode === 'journals' ? hasJournal :
                mode === 'habits' ? hasHabits :
                    hasTasks;

        if (!modeMatch) return false;
        if (!normalizedQuery) return true;

        const dateLabel = date.toLocaleDateString(i18n.language, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).toLowerCase();
        const taskText = tasks.map(task => task.text || '').join(' ').toLowerCase();
        const habitText = habitActivity.map(h => h.name || '').join(' ').toLowerCase();

        return dateLabel.includes(normalizedQuery)
            || journalText.toLowerCase().includes(normalizedQuery)
            || taskText.includes(normalizedQuery)
            || habitText.includes(normalizedQuery);
    });

    return (
        <View style={[tw`flex-1`, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
            {/* Header / Toggle */}
            <View style={[tw`p-5 border-b`, { backgroundColor: panelBg, borderColor: panelBorder }]}>
                <View style={[tw`flex-row p-1.5 rounded-2xl border`, { backgroundColor: panelSoftBg, borderColor: panelBorder }]}>
                    <TouchableOpacity
                        onPress={() => setMode('journals')}
                        style={[tw`flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2`, mode === 'journals' && { backgroundColor: panelBg }]}
                    >
                        <BookOpen size={16} color={mode === 'journals' ? theme.primary : '#a1a1aa'} />
                        <Text style={[tw`font-black uppercase text-[11px] tracking-widest`, mode === 'journals' ? { color: theme.primary } : { color: textMuted }]}>{t('monthlyView.journals')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setMode('habits')}
                        style={[tw`flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2`, mode === 'habits' && { backgroundColor: panelBg }]}
                    >
                        <CheckSquare size={16} color={mode === 'habits' ? theme.primary : '#a1a1aa'} />
                        <Text style={[tw`font-black uppercase text-[11px] tracking-widest`, mode === 'habits' ? { color: theme.primary } : { color: textMuted }]}>{t('monthlyView.habits')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setMode('tasks')}
                        style={[tw`flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2`, mode === 'tasks' && { backgroundColor: panelBg }]}
                    >
                        <ListTodo size={16} color={mode === 'tasks' ? theme.primary : '#a1a1aa'} />
                        <Text style={[tw`font-black uppercase text-[11px] tracking-widest`, mode === 'tasks' ? { color: theme.primary } : { color: textMuted }]}>Tasks</Text>
                    </TouchableOpacity>
                </View>
                <View style={[tw`mt-3 flex-row items-center rounded-xl border px-3`, { borderColor: panelBorder, backgroundColor: panelSoftBg }]}>
                    <Search size={14} color={textMuted} />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search logs..."
                        placeholderTextColor={textMuted}
                        style={[tw`flex-1 ml-2 py-2.5 text-sm font-bold`, { color: textPrimary }]}
                    />
                </View>
            </View>

            <ScrollView
                style={tw`flex-1`}
                contentContainerStyle={tw`pb-32 pt-2`}
                showsVerticalScrollIndicator={false}
            >
                {visibleDays.map((date, idx) => {
                    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    const dayData = notes?.[dateKey] || {};
                    const dayName = date.toLocaleDateString(i18n.language, { weekday: 'short' });
                    const dayNum = date.getDate();
                    const monthName = date.toLocaleDateString(i18n.language, { month: 'short' });
                    const year = date.getFullYear();
                    const tasks = Array.isArray(dayData.tasks) ? dayData.tasks : [];
                    const completedTasks = tasks.filter(task => task.completed).length;
                    const activityHabits = getHabitActivityForDate(date);

                    return (
                        <TouchableOpacity
                            key={dateKey}
                            onPress={() => setSelectedDate(date)}
                            style={[tw`mx-4 mt-3 border rounded-2xl p-4 flex-row items-center`, { backgroundColor: panelBg, borderColor: panelBorder }]}
                            activeOpacity={0.7}
                        >
                            {/* Date Column */}
                            <View style={[tw`mr-4 w-[70px] rounded-xl border px-2.5 py-2 items-center`, { backgroundColor: panelSoftBg, borderColor: panelBorder }]}>
                                <View style={[tw`rounded-full px-2 py-0.5 mb-1`, { backgroundColor: theme.primary }]}>
                                    <Text style={tw`text-[9px] font-black uppercase tracking-widest text-white`}>{dayName}</Text>
                                </View>
                                <Text style={[tw`text-2xl font-black leading-none`, { color: textPrimary }]}>{dayNum}</Text>
                                <Text style={[tw`text-[10px] font-black uppercase mt-1 tracking-wide`, { color: textMuted }]}>{monthName}</Text>
                                <Text style={[tw`text-[9px] font-black`, { color: textMuted }]}>{year}</Text>
                            </View>

                            {/* Content Column */}
                            <View style={[tw`flex-1 border-l pl-4 py-1 min-h-[40px] justify-center`, { borderColor: divider }]}>
                                {mode === 'journals' ? (
                                    <View style={tw`flex-row items-center`}>
                                        {dayData.mood ? (
                                            (() => {
                                                const moodObj = MOODS.find(m => m.value === dayData.mood);
                                                const MoodIcon = moodObj?.icon || Meh;
                                                const moodColor = moodObj?.color || '#d1d5db';
                                                return <MoodIcon size={22} color={moodColor} strokeWidth={2.5} />;
                                            })()
                                        ) : (
                                            <Meh size={22} color={isDark ? '#262626' : '#e5e7eb'} strokeWidth={2} />
                                        )}
                                        <View style={tw`flex-1 ml-3`}>
                                            <Text
                                                style={[tw`text-sm font-bold`, dayData.journal ? { color: isDark ? '#d1d5db' : '#4b5563' } : { color: isDark ? '#6b7280' : '#d1d5db', fontStyle: 'italic' }]}
                                            >
                                                {dayData.journal || t('monthlyView.emptyEntry')}
                                            </Text>
                                        </View>
                                    </View>
                                ) : mode === 'habits' ? (
                                    <View style={tw`flex-row flex-wrap gap-1.5`}>
                                        {(() => {
                                            const allToShow = activityHabits;

                                            if (allToShow.length === 0) {
                                                return <Text style={[tw`text-xs font-bold italic`, { color: isDark ? '#6b7280' : '#d1d5db' }]}>{t('monthlyView.noActivity')}</Text>;
                                            }

                                            return allToShow.map(h => {
                                                const done = checkCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear());
                                                return (
                                                    <View
                                                        key={h.id}
                                                        style={[
                                                            tw`w-3 h-3 rounded-full shadow-sm`,
                                                            {
                                                                backgroundColor: done ? h.color : panelSoftBg,
                                                                borderWidth: done ? 0 : 1.5,
                                                                borderColor: panelBorder
                                                            }
                                                        ]}
                                                    />
                                                );
                                            });
                                        })()}
                                    </View>
                                ) : (
                                    <View style={tw`flex-row items-center justify-between`}>
                                        <Text
                                            style={[tw`text-sm font-bold flex-1 mr-2`, { color: isDark ? '#d1d5db' : '#4b5563' }]}
                                            numberOfLines={1}
                                        >
                                            {tasks[0]?.text || 'Task'}
                                        </Text>
                                        <Text style={[tw`text-[11px] font-black uppercase`, { color: textMuted }]}>
                                            {completedTasks}/{tasks.length}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={tw`ml-2`}>
                                <ChevronRight size={18} color={isDark ? '#6b7280' : '#e5e7eb'} strokeWidth={3} />
                            </View>
                        </TouchableOpacity>
                    );
                })}
                {visibleDays.length === 0 && (
                    <View style={tw`px-6 pt-8`}>
                        <Text style={[tw`text-center text-sm font-bold`, { color: textMuted }]}>
                            No logs found for this section.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Popup Modal */}
            <Modal
                visible={!!selectedDate}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectedDate(null)}
            >
                <View style={tw`flex-1 justify-end bg-black/50`}>
                    <View style={[tw`rounded-t-3xl h-[90%] overflow-hidden`, { backgroundColor: isDark ? '#000000' : '#f5f5f4' }]}>
                        {/* Modal Header */}
                        <View style={[tw`p-5 border-b flex-row items-center justify-between`, { backgroundColor: panelBg, borderColor: panelBorder }]}>
                            <Text style={[tw`text-xl font-black uppercase tracking-widest`, { color: textPrimary }]}>{t('monthlyView.dayDetails')}</Text>
                            <TouchableOpacity
                                onPress={() => setSelectedDate(null)}
                                style={[tw`p-2 rounded-full`, { backgroundColor: panelSoftBg }]}
                            >
                                <X size={20} color={textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                            {selectedDate && (
                                <View style={tw`px-4 pt-4`}>
                                    <DailyCard
                                        date={selectedDate}
                                        habits={habits}
                                        completions={completions}
                                        theme={theme}
                                        colorMode={colorMode}
                                        toggleCompletion={toggleCompletion}
                                        toggleHabitInactive={toggleHabitInactive}
                                        isHabitInactive={isHabitInactive}
                                        onPrev={() => {
                                            const prev = new Date(selectedDate);
                                            prev.setDate(prev.getDate() - 1);
                                            setSelectedDate(prev);
                                        }}
                                        onNext={() => {
                                            const next = new Date(selectedDate);
                                            next.setDate(next.getDate() + 1);
                                            setSelectedDate(next);
                                        }}
                                        onDateSelect={(d) => setSelectedDate(d)}
                                        dayData={notes?.[`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`] || {}}
                                        dateKey={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`}
                                        updateNote={updateNote}
                                        cardStyle={cardStyle}
                                    />
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
