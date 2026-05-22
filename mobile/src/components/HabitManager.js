import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { X, ChevronLeft, ChevronRight, Check, Trash2, Archive, RefreshCw, Edit2 } from 'lucide-react-native';
import tw from 'twrnc';
import { THEMES } from '../constants';

export const HabitManager = ({
    isVisible,
    onClose,
    habits,
    addHabit,
    updateHabit,
    removeHabit,
    reorderHabits,
    toggleArchiveHabit,
    theme,
    colorMode = 'light'
}) => {
    const { t } = useTranslation();
    const [view, setView] = useState('list');
    const [showArchived, setShowArchived] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');
    const [editingHabit, setEditingHabit] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editColor, setEditColor] = useState(theme.primary);
    const [editFrequency, setEditFrequency] = useState(undefined);
    const [editWeeklyTarget, setEditWeeklyTarget] = useState(null);
    const [habitType, setHabitType] = useState('daily');

    const isDark = colorMode === 'dark';
    const bg = isDark ? '#0a0a0a' : '#ffffff';
    const bgSoft = isDark ? '#1a1a1a' : '#f3f4f6';
    const border = isDark ? '#1f1f1f' : '#f0f0f0';
    const textPrimary = isDark ? '#f5f5f5' : '#111111';
    const textMuted = isDark ? '#6b7280' : '#9ca3af';
    const deleteBg = isDark ? '#2d1515' : '#fff1f2';

    const habitColors = Array.from(new Set(THEMES.map(th => th.primary)));

    const swipeRefs = useRef({});
    const openSwipeId = useRef(null);

    const closeOpenSwipe = () => {
        if (openSwipeId.current) {
            swipeRefs.current[openSwipeId.current]?.close();
            openSwipeId.current = null;
        }
    };

    const renderRightActions = (habit) => (
        <View style={tw`flex-row`}>
            <TouchableOpacity
                onPress={() => { closeOpenSwipe(); openEdit(habit); }}
                style={[tw`w-20 items-center justify-center gap-1`, { backgroundColor: theme.primary }]}
            >
                <Edit2 size={18} color="white" strokeWidth={2} />
                <Text style={tw`text-white text-[10px] font-black uppercase tracking-wider`}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => {
                    Alert.alert(
                        t('habitManager.deleteTitle', { defaultValue: 'Delete Habit' }),
                        t('habitManager.deleteConfirm'),
                        [
                            { text: t('common.cancel'), style: 'cancel' },
                            { text: t('common.delete', { defaultValue: 'Delete' }), style: 'destructive', onPress: () => { removeHabit(habit.id); closeOpenSwipe(); } }
                        ]
                    );
                }}
                style={tw`w-20 items-center justify-center gap-1 bg-red-500`}
            >
                <Trash2 size={18} color="white" strokeWidth={2} />
                <Text style={tw`text-white text-[10px] font-black uppercase tracking-wider`}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    const renderArchivedRightActions = (habit) => (
        <TouchableOpacity
            onPress={() => { toggleArchiveHabit(habit.id, false); closeOpenSwipe(); }}
            style={[tw`w-24 items-center justify-center gap-1`, { backgroundColor: isDark ? '#1f1f1f' : '#e5e7eb' }]}
        >
            <RefreshCw size={18} color={textPrimary} strokeWidth={2} />
            <Text style={[tw`text-[10px] font-black uppercase tracking-wider`, { color: textPrimary }]}>Restore</Text>
        </TouchableOpacity>
    );

    const frequencyLabel = (habit) => {
        if (habit.weeklyTarget) return `${habit.weeklyTarget}× / week`;
        if (!habit.frequency || habit.frequency.length === 0 || habit.frequency.length === 7) return 'Every day';
        return ['S', 'M', 'T', 'W', 'T', 'F', 'S'].filter((_, i) => habit.frequency.includes(i)).join('  ');
    };

    const openEdit = (habit) => {
        setEditingHabit(habit);
        setEditName(habit.name);
        setEditDescription(habit.description || '');
        setEditColor(habit.color || theme.primary);
        setEditFrequency(habit.frequency);
        setEditWeeklyTarget(habit.weeklyTarget || null);
        setHabitType(habit.weeklyTarget ? 'weekly' : 'daily');
        setView('edit');
    };

    const handleSave = () => {
        if (!editingHabit || !editName.trim()) return;

        const duplicate = habits.some(
            h => h.id !== editingHabit.id && !h.archivedAt &&
                h.name.trim().toLowerCase() === editName.trim().toLowerCase()
        );
        if (duplicate) {
            Alert.alert('Already exists', `A habit called "${editName.trim()}" already exists.`);
            return;
        }

        updateHabit(editingHabit.id, {
            name: editName.trim(),
            description: editDescription.trim(),
            color: editColor,
            frequency: habitType === 'daily' ? editFrequency : null,
            weeklyTarget: habitType === 'weekly' ? editWeeklyTarget : null,
        });
        setView('list');
        setEditingHabit(null);
    };

    const handleBack = () => {
        setView('list');
        setEditingHabit(null);
    };

    const handleClose = () => {
        closeOpenSwipe();
        setView('list');
        setEditingHabit(null);
        setNewHabitName('');
        onClose();
    };

    const handleQuickAdd = async () => {
        const name = newHabitName.trim();
        if (!name) return;

        const duplicate = habits.some(
            h => !h.archivedAt && h.name.trim().toLowerCase() === name.toLowerCase()
        );
        if (duplicate) {
            Alert.alert('Already exists', `A habit called "${name}" already exists.`);
            return;
        }

        setNewHabitName('');
        const tempId = await addHabit(theme.primary, name, undefined, null, '', theme.primary);

        if (tempId) {
            openEdit({ id: tempId, name, color: theme.primary, description: '', frequency: undefined, weeklyTarget: null, archivedAt: null });
        }
    };

    const handleDelete = () => {
        Alert.alert(
            t('habitManager.deleteTitle', { defaultValue: 'Delete Habit' }),
            t('habitManager.deleteConfirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete', { defaultValue: 'Delete' }),
                    style: 'destructive',
                    onPress: () => {
                        removeHabit(editingHabit.id);
                        setView('list');
                        setEditingHabit(null);
                    }
                }
            ]
        );
    };

    const toggleDay = (i) => {
        if (!editFrequency) {
            setEditFrequency([0, 1, 2, 3, 4, 5, 6].filter(d => d !== i));
        } else if (editFrequency.includes(i)) {
            const next = editFrequency.filter(d => d !== i);
            setEditFrequency(next.length === 7 ? undefined : next);
        } else {
            const next = [...editFrequency, i].sort();
            setEditFrequency(next.length === 7 ? undefined : next);
        }
    };

    const activeHabits = habits.filter(h => !h.archivedAt);
    const archivedHabits = habits.filter(h => h.archivedAt);

    return (
        <Modal animationType="slide" transparent visible={isVisible} onRequestClose={handleClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={tw`flex-1 justify-end bg-black/40`}
            >
                <View style={[tw`rounded-t-3xl h-[88%] overflow-hidden`, { backgroundColor: bg }]}>

                    {view === 'list' ? (
                        <>
                            {/* Header */}
                            <View style={[tw`flex-row items-center justify-between px-5 pt-5 pb-4`, { borderBottomWidth: 1, borderColor: border }]}>
                                <Text style={[tw`text-lg font-black uppercase tracking-widest`, { color: textPrimary }]}>
                                    {t('habitManager.title')}
                                </Text>
                                <TouchableOpacity
                                    onPress={handleClose}
                                    style={[tw`w-9 h-9 rounded-full items-center justify-center`, { backgroundColor: bgSoft }]}
                                >
                                    <X size={18} color={textPrimary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                style={tw`flex-1`}
                                contentContainerStyle={{ paddingBottom: 60 }}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                {/* Quick-add row */}
                                <View style={[tw`flex-row items-center px-5 py-3.5`, { borderBottomWidth: 1, borderColor: border }]}>
                                    <View style={[tw`w-2.5 h-2.5 rounded-full mr-4`, { backgroundColor: theme.primary, opacity: 0.35 }]} />
                                    <TextInput
                                        value={newHabitName}
                                        onChangeText={setNewHabitName}
                                        onSubmitEditing={handleQuickAdd}
                                        placeholder="Add a habit..."
                                        placeholderTextColor={textMuted}
                                        returnKeyType="done"
                                        blurOnSubmit={false}
                                        style={[tw`flex-1 text-base font-medium`, { color: textPrimary }]}
                                    />
                                    {newHabitName.trim().length > 0 && (
                                        <TouchableOpacity
                                            onPress={handleQuickAdd}
                                            style={[tw`w-7 h-7 rounded-full items-center justify-center`, { backgroundColor: theme.primary }]}
                                        >
                                            <Check size={13} color="white" strokeWidth={3} />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Active habits */}
                                {activeHabits.map(habit => (
                                    <Swipeable
                                        key={habit.id}
                                        ref={ref => { swipeRefs.current[habit.id] = ref; }}
                                        renderRightActions={() => renderRightActions(habit)}
                                        onSwipeableOpen={() => {
                                            if (openSwipeId.current && openSwipeId.current !== habit.id) {
                                                swipeRefs.current[openSwipeId.current]?.close();
                                            }
                                            openSwipeId.current = habit.id;
                                        }}
                                        overshootRight={false}
                                        friction={1}
                                        rightThreshold={80}
                                    >
                                        <TouchableOpacity
                                            onPress={() => { closeOpenSwipe(); openEdit(habit); }}
                                            activeOpacity={0.55}
                                            style={[tw`flex-row items-center px-5 py-3.5`, { borderBottomWidth: 1, borderColor: border, backgroundColor: bg }]}
                                        >
                                            <View style={[tw`w-2.5 h-2.5 rounded-full mr-4`, { backgroundColor: habit.color || theme.primary }]} />
                                            <View style={tw`flex-1`}>
                                                <Text style={[tw`text-base font-semibold`, { color: textPrimary }]}>{habit.name}</Text>
                                                <Text style={[tw`text-xs font-medium mt-0.5`, { color: textMuted }]}>{frequencyLabel(habit)}</Text>
                                            </View>
                                            <ChevronRight size={16} color={textMuted} strokeWidth={2} />
                                        </TouchableOpacity>
                                    </Swipeable>
                                ))}

                                {activeHabits.length === 0 && (
                                    <View style={tw`px-5 py-10 items-center`}>
                                        <Text style={[tw`text-sm font-medium`, { color: textMuted }]}>No habits yet — add one above</Text>
                                    </View>
                                )}

                                {/* Archived section */}
                                {archivedHabits.length > 0 && (
                                    <View style={tw`mt-4`}>
                                        <TouchableOpacity
                                            onPress={() => setShowArchived(!showArchived)}
                                            style={tw`flex-row items-center px-5 py-3`}
                                        >
                                            <Text style={[tw`text-xs font-black uppercase tracking-widest mr-1.5`, { color: textMuted }]}>
                                                Archived ({archivedHabits.length})
                                            </Text>
                                            <View style={{ transform: [{ rotate: showArchived ? '90deg' : '0deg' }] }}>
                                                <ChevronRight size={12} color={textMuted} strokeWidth={2.5} />
                                            </View>
                                        </TouchableOpacity>
                                        {showArchived && archivedHabits.map(habit => (
                                            <Swipeable
                                                key={habit.id}
                                                ref={ref => { swipeRefs.current[habit.id] = ref; }}
                                                renderRightActions={() => renderArchivedRightActions(habit)}
                                                onSwipeableOpen={() => {
                                                    if (openSwipeId.current && openSwipeId.current !== habit.id) {
                                                        swipeRefs.current[openSwipeId.current]?.close();
                                                    }
                                                    openSwipeId.current = habit.id;
                                                }}
                                                overshootRight={false}
                                                friction={1}
                                                rightThreshold={60}
                                            >
                                                <TouchableOpacity
                                                    onPress={() => { closeOpenSwipe(); openEdit(habit); }}
                                                    activeOpacity={0.55}
                                                    style={[tw`flex-row items-center px-5 py-3.5`, { borderBottomWidth: 1, borderColor: border, backgroundColor: bg, opacity: 0.5 }]}
                                                >
                                                    <View style={[tw`w-2.5 h-2.5 rounded-full mr-4`, { backgroundColor: habit.color || theme.primary }]} />
                                                    <View style={tw`flex-1`}>
                                                        <Text style={[tw`text-base font-semibold`, { color: textPrimary }]}>{habit.name}</Text>
                                                        <Text style={[tw`text-xs font-medium mt-0.5`, { color: textMuted }]}>Archived</Text>
                                                    </View>
                                                    <ChevronRight size={16} color={textMuted} strokeWidth={2} />
                                                </TouchableOpacity>
                                            </Swipeable>
                                        ))}
                                    </View>
                                )}
                            </ScrollView>
                        </>
                    ) : (
                        <>
                            {/* Edit Header */}
                            <View style={[tw`flex-row items-center justify-between px-5 pt-5 pb-4`, { borderBottomWidth: 1, borderColor: border }]}>
                                <TouchableOpacity onPress={handleBack} style={tw`flex-row items-center gap-1`}>
                                    <ChevronLeft size={20} color={theme.primary} strokeWidth={2.5} />
                                    <Text style={[tw`text-base font-semibold`, { color: theme.primary }]}>Habits</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSave}
                                    style={[tw`px-5 py-1.5 rounded-full`, { backgroundColor: theme.primary }]}
                                >
                                    <Text style={tw`text-white text-sm font-bold`}>Save</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                style={tw`flex-1`}
                                contentContainerStyle={{ paddingBottom: 80 }}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                {/* Name */}
                                <View style={[tw`px-5 py-5`, { borderBottomWidth: 1, borderColor: border }]}>
                                    <Text style={[tw`text-[10px] font-black uppercase tracking-widest mb-2`, { color: textMuted }]}>Name</Text>
                                    <TextInput
                                        value={editName}
                                        onChangeText={setEditName}
                                        autoFocus
                                        placeholder="Habit name"
                                        placeholderTextColor={textMuted}
                                        style={[tw`text-2xl font-bold`, { color: textPrimary }]}
                                    />
                                </View>

                                {/* Color */}
                                <View style={[tw`py-5`, { borderBottomWidth: 1, borderColor: border }]}>
                                    <Text style={[tw`text-[10px] font-black uppercase tracking-widest mb-3 px-5`, { color: textMuted }]}>Color</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={tw`px-5 gap-3`}
                                    >
                                        {habitColors.map(color => (
                                            <TouchableOpacity
                                                key={color}
                                                onPress={() => setEditColor(color)}
                                                style={[
                                                    tw`w-9 h-9 rounded-full`,
                                                    { backgroundColor: color },
                                                    editColor === color && {
                                                        borderWidth: 3,
                                                        borderColor: textPrimary,
                                                    }
                                                ]}
                                            />
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Schedule */}
                                <View style={[tw`px-5 py-5`, { borderBottomWidth: 1, borderColor: border }]}>
                                    <Text style={[tw`text-[10px] font-black uppercase tracking-widest mb-3`, { color: textMuted }]}>Schedule</Text>

                                    <View style={[tw`flex-row p-1 rounded-xl mb-4`, { backgroundColor: bgSoft }]}>
                                        {[['daily', 'Daily'], ['weekly', 'Weekly goal']].map(([val, label]) => (
                                            <TouchableOpacity
                                                key={val}
                                                onPress={() => setHabitType(val)}
                                                style={[
                                                    tw`flex-1 py-2 rounded-lg items-center`,
                                                    habitType === val && { backgroundColor: bg, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }
                                                ]}
                                            >
                                                <Text style={[tw`text-sm font-semibold`, { color: habitType === val ? textPrimary : textMuted }]}>{label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {habitType === 'daily' ? (
                                        <View style={tw`flex-row justify-between`}>
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                                                const selected = !editFrequency || editFrequency.includes(i);
                                                return (
                                                    <TouchableOpacity
                                                        key={i}
                                                        onPress={() => toggleDay(i)}
                                                        style={[
                                                            tw`w-10 h-10 rounded-full items-center justify-center`,
                                                            { backgroundColor: selected ? editColor : bgSoft }
                                                        ]}
                                                    >
                                                        <Text style={[tw`text-xs font-bold`, { color: selected ? '#ffffff' : textMuted }]}>{day}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    ) : (
                                        <View>
                                            <Text style={[tw`text-xs font-medium mb-3`, { color: textMuted }]}>Times per week</Text>
                                            <View style={tw`flex-row justify-between`}>
                                                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                                    <TouchableOpacity
                                                        key={num}
                                                        onPress={() => setEditWeeklyTarget(num)}
                                                        style={[
                                                            tw`w-10 h-10 rounded-full items-center justify-center`,
                                                            { backgroundColor: editWeeklyTarget === num ? editColor : bgSoft }
                                                        ]}
                                                    >
                                                        <Text style={[tw`text-sm font-bold`, { color: editWeeklyTarget === num ? '#ffffff' : textMuted }]}>{num}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Notes */}
                                <View style={[tw`px-5 py-5`, { borderBottomWidth: 1, borderColor: border }]}>
                                    <Text style={[tw`text-[10px] font-black uppercase tracking-widest mb-2`, { color: textMuted }]}>Notes</Text>
                                    <TextInput
                                        value={editDescription}
                                        onChangeText={setEditDescription}
                                        placeholder="Optional notes..."
                                        placeholderTextColor={textMuted}
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                        style={[tw`text-sm font-medium min-h-[60px]`, { color: textPrimary }]}
                                    />
                                </View>

                                {/* Archive / Delete */}
                                <View style={tw`px-5 pt-6 gap-3`}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            toggleArchiveHabit(editingHabit.id, !editingHabit.archivedAt);
                                            setView('list');
                                            setEditingHabit(null);
                                        }}
                                        style={[tw`flex-row items-center gap-3 py-4 px-4 rounded-2xl`, { backgroundColor: bgSoft }]}
                                    >
                                        {editingHabit?.archivedAt
                                            ? <RefreshCw size={17} color={textPrimary} />
                                            : <Archive size={17} color={textPrimary} />
                                        }
                                        <Text style={[tw`text-sm font-semibold`, { color: textPrimary }]}>
                                            {editingHabit?.archivedAt ? 'Restore habit' : 'Archive habit'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={handleDelete}
                                        style={[tw`flex-row items-center gap-3 py-4 px-4 rounded-2xl`, { backgroundColor: deleteBg }]}
                                    >
                                        <Trash2 size={17} color="#ef4444" />
                                        <Text style={tw`text-sm font-semibold text-red-500`}>Delete habit</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};
