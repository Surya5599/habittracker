import React, { useState, useMemo } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, TextInput,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { X, Plus, CalendarPlus, Inbox } from 'lucide-react-native';
import tw from 'twrnc';
import { DatePickerModal } from '../components/DatePickerModal';

export const TodoScreen = ({ notes = {}, updateNote, theme, colorMode = 'light' }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const isDark = colorMode === 'dark';
    const [newText, setNewText] = useState('');
    const [schedulingTask, setSchedulingTask] = useState(null);

    const panelBg     = isDark ? '#0b0b0b' : '#ffffff';
    const textPrimary = isDark ? '#e5e7eb' : '#161616';
    const textSecondary = isDark ? '#9ca3af' : '#6b7280';
    const textMuted   = isDark ? '#6b7280' : '#d6d3d1';
    const borderSoft  = isDark ? '#262626' : '#f3f4f6';
    const outlineColor = isDark ? '#ffffff' : '#000000';
    const accent = theme?.primary || '#C19A9A';

    const backlogTasks = notes?.['__backlog__']?.tasks || [];

    const overdueTasks = useMemo(() => {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const result = [];
        Object.entries(notes || {}).forEach(([key, data]) => {
            if (key === '__backlog__' || key >= todayStr) return;
            (data?.tasks || []).filter(t => !t.completed).forEach(t => {
                result.push({ ...t, fromDate: key });
            });
        });
        return result.sort((a, b) => b.fromDate.localeCompare(a.fromDate));
    }, [notes]);

    // Group overdue tasks by date
    const overdueGroups = useMemo(() => {
        const groups = {};
        overdueTasks.forEach(task => {
            if (!groups[task.fromDate]) groups[task.fromDate] = [];
            groups[task.fromDate].push(task);
        });
        return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
    }, [overdueTasks]);

    const manualBacklog = useMemo(() => {
        const seen = new Set();
        return backlogTasks.filter(t => {
            if (t.completed || seen.has(t.id)) return false;
            seen.add(t.id);
            return true;
        });
    }, [backlogTasks]);

    const handleAddTask = () => {
        if (!newText.trim()) return;
        const task = { id: Date.now().toString(), text: newText.trim(), completed: false };
        updateNote && updateNote('__backlog__', { tasks: [...backlogTasks, task] });
        setNewText('');
    };

    const handleComplete = (task) => {
        if (task.fromDate) {
            const dateTasks = notes?.[task.fromDate]?.tasks || [];
            updateNote && updateNote(task.fromDate, {
                tasks: dateTasks.map(t => t.id === task.id ? { ...t, completed: true } : t),
            });
        } else {
            updateNote && updateNote('__backlog__', {
                tasks: backlogTasks.map(t => t.id === task.id ? { ...t, completed: true } : t),
            });
        }
    };

    const handleDelete = (task) => {
        if (task.fromDate) {
            const dateTasks = notes?.[task.fromDate]?.tasks || [];
            updateNote && updateNote(task.fromDate, { tasks: dateTasks.filter(t => t.id !== task.id) });
        } else {
            updateNote && updateNote('__backlog__', { tasks: backlogTasks.filter(t => t.id !== task.id) });
        }
    };

    const handleMoveToDate = (task, targetDate) => {
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const d = String(targetDate.getDate()).padStart(2, '0');
        const targetKey = `${y}-${m}-${d}`;
        const existing = notes?.[targetKey]?.tasks || [];
        const { fromDate, ...taskData } = task;
        updateNote && updateNote(targetKey, { tasks: [...existing, { ...taskData, completed: false }] });
        if (fromDate) {
            const dateTasks = notes?.[fromDate]?.tasks || [];
            updateNote && updateNote(fromDate, { tasks: dateTasks.filter(t => t.id !== task.id) });
        } else {
            updateNote && updateNote('__backlog__', { tasks: backlogTasks.filter(t => t.id !== task.id) });
        }
        setSchedulingTask(null);
    };

    const TaskRow = ({ task }) => (
        <View style={[tw`flex-row items-center py-3 border-b`, { borderColor: borderSoft }]}>
            <TouchableOpacity
                onPress={() => handleComplete(task)}
                style={[tw`w-5 h-5 rounded mr-3 items-center justify-center border-2`, { borderColor: accent, flexShrink: 0 }]}
            />
            <Text style={[tw`flex-1 text-sm font-medium mr-2`, { color: textPrimary }]} numberOfLines={2}>
                {task.text}
            </Text>
            <TouchableOpacity
                onPress={() => setSchedulingTask(task)}
                style={[tw`p-1.5 rounded-lg mr-1`, { backgroundColor: accent + '18' }]}
            >
                <CalendarPlus size={13} color={accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(task)} style={tw`p-1`}>
                <X size={14} color={textMuted} />
            </TouchableOpacity>
        </View>
    );

    const totalCount = overdueGroups.reduce((n, [, tasks]) => n + tasks.length, 0) + manualBacklog.length;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[tw`flex-1`, { backgroundColor: isDark ? '#000000' : '#f3f4f6' }]}
        >
            {/* Header */}
            <View style={[tw`flex-row items-center gap-2 px-5 pt-4 pb-3`, { paddingTop: 16 }]}>
                <Inbox size={20} color={accent} />
                <Text style={[tw`text-lg font-black uppercase tracking-widest flex-1`, { color: textPrimary }]}>
                    To-Do
                </Text>
                {totalCount > 0 && (
                    <View style={[tw`px-2.5 py-0.5 rounded-full`, { backgroundColor: accent + '22' }]}>
                        <Text style={[tw`text-xs font-black`, { color: accent }]}>{totalCount}</Text>
                    </View>
                )}
            </View>

            <ScrollView
                style={tw`flex-1`}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Overdue groups */}
                {overdueGroups.length > 0 && (
                    <View style={tw`mb-4`}>
                        <Text style={[tw`text-[10px] font-black uppercase tracking-widest mb-2 mt-1`, { color: '#f97316' }]}>
                            Overdue
                        </Text>
                        {overdueGroups.map(([dateKey, tasks]) => {
                            const dateLabel = new Date(dateKey + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                            return (
                                <View key={dateKey} style={[tw`rounded-2xl mb-3 overflow-hidden border-[2px]`, { backgroundColor: panelBg, borderColor: outlineColor }]}>
                                    <View style={[tw`px-4 py-2 border-b`, { borderColor: borderSoft, backgroundColor: '#f9730610' }]}>
                                        <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: '#f97316' }]}>
                                            {dateLabel}
                                        </Text>
                                    </View>
                                    <View style={tw`px-4`}>
                                        {tasks.map(task => <TaskRow key={`overdue-${dateKey}-${task.id}`} task={task} />)}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Manual backlog */}
                <View style={[tw`rounded-2xl overflow-hidden border-[2px]`, { backgroundColor: panelBg, borderColor: outlineColor }]}>
                    <View style={[tw`px-4 py-2 border-b`, { borderColor: borderSoft }]}>
                        <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: textSecondary }]}>
                            Backlog
                        </Text>
                    </View>
                    <View style={tw`px-4`}>
                        {manualBacklog.length === 0 ? (
                            <Text style={[tw`text-xs italic py-4 text-center`, { color: textMuted }]}>
                                Nothing in the backlog — add something below
                            </Text>
                        ) : (
                            manualBacklog.map(task => <TaskRow key={`backlog-${task.id}`} task={{ ...task, fromDate: null }} />)
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Add input pinned above keyboard */}
            <View style={[
                tw`flex-row items-center gap-2 px-4 border-t-[2px]`,
                { borderColor: outlineColor, backgroundColor: panelBg, paddingTop: 12, paddingBottom: 12 + insets.bottom },
            ]}>
                <TextInput
                    value={newText}
                    onChangeText={setNewText}
                    onSubmitEditing={handleAddTask}
                    placeholder="Add to backlog..."
                    placeholderTextColor={textMuted}
                    returnKeyType="done"
                    blurOnSubmit={false}
                    style={[tw`flex-1 text-sm font-medium`, { color: textPrimary }]}
                />
                <TouchableOpacity
                    onPress={handleAddTask}
                    disabled={!newText.trim()}
                    style={[tw`p-2 rounded-lg`, { backgroundColor: newText.trim() ? outlineColor : borderSoft }]}
                >
                    <Plus size={14} color={newText.trim() ? (isDark ? '#000' : '#fff') : textMuted} />
                </TouchableOpacity>
            </View>

            <DatePickerModal
                isVisible={!!schedulingTask}
                onClose={() => setSchedulingTask(null)}
                onSelect={(date) => handleMoveToDate(schedulingTask, date)}
                selectedDate={new Date()}
                theme={theme}
                colorMode={colorMode}
            />
        </KeyboardAvoidingView>
    );
};
