import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { X, ChevronLeft, ChevronRight, Check, Trash2, Archive, RefreshCw, GripVertical, Plus } from 'lucide-react-native';
import tw from 'twrnc';
import { THEMES, HABIT_NAME_MAX_LENGTH } from '../constants';
import { readableOn } from '../constants/theme';

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
    const [editingHabit, setEditingHabit] = useState(null);
    // True while the editor is filling in a habit that does not exist yet.
    const [isCreating, setIsCreating] = useState(false);
    const [editName, setEditName] = useState('');
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

    // Swipe actions used to live on each row: Edit (which tapping the row already did)
    // and Delete. Two hidden gestures on top of tap-to-edit and long-press-to-drag, with
    // nothing on screen announcing any of them. Archive and Delete are both in the
    // editor, one tap away and labelled, so the whole layer is gone.

    // Day initials come from the locale — the old hardcoded S M T W T F S was wrong in
    // every language but English, including the week-start order.
    const dayInitials = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
        .map(k => t(`common.daysShort.${k}`, { defaultValue: k[0].toUpperCase() }));

    const frequencyLabel = (habit) => {
        if (habit.weeklyTarget) return t('habitManager.perWeek', { count: habit.weeklyTarget });
        if (!habit.frequency || habit.frequency.length === 0 || habit.frequency.length === 7) return t('habitManager.everyDay');
        return dayInitials.filter((_, i) => habit.frequency.includes(i)).join('  ');
    };

    // Create mode is the same form with no habit behind it yet. Nothing is written until
    // Save, so backing out of a half-filled form leaves no stray habit in the list.
    const openCreate = () => {
        setEditingHabit(null);
        setIsCreating(true);
        setEditName('');
        setEditColor(theme.primary);
        setEditFrequency(undefined);
        setEditWeeklyTarget(null);
        setHabitType('daily');
        setView('edit');
    };

    const openEdit = (habit) => {
        setIsCreating(false);
        setEditingHabit(habit);
        setEditName(habit.name);
        setEditColor(habit.color || theme.primary);
        setEditFrequency(habit.frequency);
        setEditWeeklyTarget(habit.weeklyTarget || null);
        setHabitType(habit.weeklyTarget ? 'weekly' : 'daily');
        setView('edit');
    };

    const handleSave = async () => {
        const name = editName.trim();
        if (!name) return;

        if (isCreating) {
            const duplicate = habits.some(
                h => !h.archivedAt && h.name.trim().toLowerCase() === name.toLowerCase()
            );
            if (duplicate) {
                Alert.alert(t('habitManager.alreadyExists'), t('habitManager.alreadyExistsMsg', { name }));
                return;
            }
            await addHabit(
                theme.primary,
                name,
                habitType === 'daily' ? editFrequency : undefined,
                habitType === 'weekly' ? editWeeklyTarget : null,
                '',
                editColor,
            );
            handleBack();
            return;
        }

        if (!editingHabit) return;

        const originalName = editingHabit.name.trim().toLowerCase();
        const duplicate = habits.some(
            h => !h.archivedAt &&
                h.name.trim().toLowerCase() === editName.trim().toLowerCase() &&
                h.id !== editingHabit.id &&
                // guard against false positives after tempId→realId remap:
                // if the habit's name matches what we opened the editor with, it's the same habit
                h.name.trim().toLowerCase() !== originalName
        );
        if (duplicate) {
            Alert.alert(t('habitManager.alreadyExists'), t('habitManager.alreadyExistsMsg', { name: editName.trim() }));
            return;
        }

        updateHabit(editingHabit.id, {
            name: editName.trim(),
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
        setIsCreating(false);
    };

    const handleClose = () => {
        setView('list');
        setEditingHabit(null);
        setIsCreating(false);
        onClose();
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
                {/* The list needs a fixed height — DraggableFlatList has to know how tall
                    its viewport is. The editor doesn't: it's a short form, and pinning it
                    to 88% of the screen left a tall empty gap under the delete button and
                    pushed the fields further apart than they needed to be. It sizes to its
                    content now, capped so a long list of colours can still scroll. */}
                <View style={[
                    tw`rounded-t-3xl overflow-hidden`,
                    { backgroundColor: bg },
                    view === 'list' ? tw`h-[88%]` : { maxHeight: '88%' },
                ]}>

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

                            <DraggableFlatList
                                data={activeHabits}
                                keyExtractor={(item) => item.id}
                                onDragEnd={({ data }) => reorderHabits(data)}
                                activationDistance={10}
                                contentContainerStyle={{ paddingBottom: 60 }}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                ListHeaderComponent={
                                    /* Straight to the editor. This row used to be a text
                                       field: you typed a name here, and submitting created
                                       the habit and then opened the editor anyway — so the
                                       name was entered in one place and everything else in
                                       another, and a half-finished habit existed the moment
                                       you hit return. One tap, one form. */
                                    <TouchableOpacity
                                        onPress={openCreate}
                                        accessibilityRole="button"
                                        style={[tw`flex-row items-center px-5 py-3.5`, { borderBottomWidth: 1, borderColor: border }]}
                                    >
                                        <View style={[tw`w-6 h-6 rounded-full items-center justify-center mr-3`, { backgroundColor: theme.primary }]}>
                                            <Plus size={14} color={readableOn(theme.primary)} strokeWidth={3} />
                                        </View>
                                        <Text style={[tw`flex-1 text-base font-semibold`, { color: textPrimary }]}>
                                            {t('habitManager.addHabit')}
                                        </Text>
                                        <ChevronRight size={16} color={textMuted} strokeWidth={2} />
                                    </TouchableOpacity>
                                }
                                ListEmptyComponent={
                                    <View style={tw`px-5 py-10 items-center`}>
                                        <Text style={[tw`text-sm font-medium`, { color: textMuted }]}>{t("habitManager.emptyList")}</Text>
                                    </View>
                                }
                                ListFooterComponent={
                                    archivedHabits.length > 0 ? (
                                        <View style={tw`mt-4`}>
                                            <TouchableOpacity
                                                onPress={() => setShowArchived(!showArchived)}
                                                style={tw`flex-row items-center px-5 py-3`}
                                            >
                                                <Text style={[tw`text-xs font-black uppercase tracking-widest mr-1.5`, { color: textMuted }]}>
                                                    {t("habitManager.archivedCount", { count: archivedHabits.length })}
                                                </Text>
                                                <View style={{ transform: [{ rotate: showArchived ? '90deg' : '0deg' }] }}>
                                                    <ChevronRight size={12} color={textMuted} strokeWidth={2.5} />
                                                </View>
                                            </TouchableOpacity>
                                            {showArchived && archivedHabits.map(habit => (
                                                <TouchableOpacity
                                                    key={habit.id}
                                                    onPress={() => openEdit(habit)}
                                                    activeOpacity={0.55}
                                                    accessibilityRole="button"
                                                    style={[tw`flex-row items-center px-5 py-3.5`, { borderBottomWidth: 1, borderColor: border, backgroundColor: bg, opacity: 0.5 }]}
                                                >
                                                    <View style={[tw`w-2.5 h-2.5 rounded-full mr-4`, { backgroundColor: habit.color || theme.primary }]} />
                                                    <View style={tw`flex-1`}>
                                                        <Text style={[tw`text-base font-semibold`, { color: textPrimary }]}>{habit.name}</Text>
                                                        <Text style={[tw`text-xs font-medium mt-0.5`, { color: textMuted }]}>
                                                            {t('habitManager.archivedTag')}
                                                        </Text>
                                                    </View>
                                                    <ChevronRight size={16} color={textMuted} strokeWidth={2} />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ) : null
                                }
                                renderItem={({ item: habit, drag, isActive }) => (
                                    <ScaleDecorator activeScale={0.98}>
                                        <View style={[tw`flex-row items-center px-5 py-3.5`, { borderBottomWidth: 1, borderColor: border, backgroundColor: isActive ? (isDark ? '#1a1a1a' : '#f9f9f9') : bg }]}>
                                            <TouchableOpacity
                                                onLongPress={drag}
                                                delayLongPress={150}
                                                activeOpacity={0.4}
                                                accessibilityLabel={t('habitManager.dragToReorder')}
                                                hitSlop={{ top: 8, bottom: 8, left: 4, right: 12 }}
                                                style={tw`mr-3`}
                                            >
                                                <GripVertical size={16} color={textMuted} strokeWidth={2} />
                                            </TouchableOpacity>
                                            <View style={[tw`w-2.5 h-2.5 rounded-full mr-3`, { backgroundColor: habit.color || theme.primary }]} />
                                            <TouchableOpacity
                                                onPress={() => openEdit(habit)}
                                                activeOpacity={0.55}
                                                accessibilityRole="button"
                                                style={tw`flex-1 flex-row items-center`}
                                            >
                                                <View style={tw`flex-1`}>
                                                    <Text style={[tw`text-base font-semibold`, { color: textPrimary }]} numberOfLines={1}>{habit.name}</Text>
                                                    <Text style={[tw`text-xs font-medium mt-0.5`, { color: textMuted }]}>{frequencyLabel(habit)}</Text>
                                                </View>
                                                <ChevronRight size={16} color={textMuted} strokeWidth={2} />
                                            </TouchableOpacity>
                                        </View>
                                    </ScaleDecorator>
                                )}
                            />
                        </>
                    ) : (
                        <>
                            {/* Edit Header */}
                            <View style={[tw`flex-row items-center justify-between px-5 pt-4 pb-3`, { borderBottomWidth: 1, borderColor: border }]}>
                                <TouchableOpacity onPress={handleBack} style={tw`flex-row items-center gap-1`}>
                                    <ChevronLeft size={20} color={theme.primary} strokeWidth={2.5} />
                                    <Text style={[tw`text-base font-semibold`, { color: theme.primary }]}>{t("habitManager.backToList")}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSave}
                                    disabled={!editName.trim()}
                                    style={[
                                        tw`px-5 py-1.5 rounded-full`,
                                        { backgroundColor: theme.primary, opacity: editName.trim() ? 1 : 0.4 },
                                    ]}
                                >
                                    <Text style={[tw`text-sm font-bold`, { color: readableOn(theme.primary) }]}>{t("habitManager.save")}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* No flex-1: the sheet is content-sized now, and a flex child
                                in an auto-height parent collapses to nothing. */}
                            <ScrollView
                                contentContainerStyle={{ paddingBottom: 24 }}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                {/* Name */}
                                <View style={[tw`px-5 py-4`, { borderBottomWidth: 1, borderColor: border }]}>
                                    <View style={tw`flex-row items-center justify-between mb-1.5`}>
                                        <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: textMuted }]}>{t("habitManager.name")}</Text>
                                        {/* Only once it's close. A counter sitting there from the
                                            first character reads as a limit you're fighting. */}
                                        {editName.length > HABIT_NAME_MAX_LENGTH - 10 && (
                                            <Text style={[
                                                tw`text-[10px] font-black`,
                                                { color: editName.length >= HABIT_NAME_MAX_LENGTH ? theme.primary : textMuted },
                                            ]}>
                                                {editName.length}/{HABIT_NAME_MAX_LENGTH}
                                            </Text>
                                        )}
                                    </View>
                                    <TextInput
                                        value={editName}
                                        onChangeText={setEditName}
                                        maxLength={HABIT_NAME_MAX_LENGTH}
                                        autoFocus
                                        placeholder={t("habitManager.habitNamePlaceholder")}
                                        placeholderTextColor={textMuted}
                                        style={[tw`text-xl font-bold`, { color: textPrimary }]}
                                    />
                                </View>

                                {/* Color */}
                                <View style={[tw`py-4`, { borderBottomWidth: 1, borderColor: border }]}>
                                    <Text style={[tw`text-[10px] font-black uppercase tracking-widest mb-2 px-5`, { color: textMuted }]}>{t("habitManager.color")}</Text>
                                    {/* Wrapped, not a horizontal scroll: there are only a dozen,
                                        and a side-scroller hid both how many there were and
                                        which one was selected if it sat off-screen. */}
                                    <View style={tw`flex-row flex-wrap px-5 gap-2.5`}>
                                        {habitColors.map(color => (
                                            <TouchableOpacity
                                                key={color}
                                                onPress={() => setEditColor(color)}
                                                accessibilityRole="button"
                                                accessibilityState={{ selected: editColor === color }}
                                                style={[
                                                    tw`w-9 h-9 rounded-full items-center justify-center`,
                                                    { backgroundColor: color },
                                                ]}
                                            >
                                                {editColor === color && (
                                                    <Check size={16} color={readableOn(color)} strokeWidth={4} />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Schedule */}
                                <View style={[tw`px-5 py-4`, { borderBottomWidth: 1, borderColor: border }]}>
                                    <Text style={[tw`text-[10px] font-black uppercase tracking-widest mb-2`, { color: textMuted }]}>{t("habitManager.schedule")}</Text>

                                    <View style={[tw`flex-row p-1 rounded-xl mb-3`, { backgroundColor: bgSoft }]}>
                                        {[['daily', t('habitManager.daily')], ['weekly', t('habitManager.weeklyGoal')]].map(([val, label]) => (
                                            <TouchableOpacity
                                                key={val}
                                                onPress={() => setHabitType(val)}
                                                style={[
                                                    tw`flex-1 py-1.5 rounded-lg items-center`,
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
                                                            tw`w-9 h-9 rounded-full items-center justify-center`,
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
                                            <Text style={[tw`text-xs font-medium mb-2`, { color: textMuted }]}>{t('habitManager.timesPerWeek')}</Text>
                                            <View style={tw`flex-row justify-between`}>
                                                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                                    <TouchableOpacity
                                                        key={num}
                                                        onPress={() => setEditWeeklyTarget(num)}
                                                        style={[
                                                            tw`w-9 h-9 rounded-full items-center justify-center`,
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

                                {/* Archive / Delete — nothing to act on until the habit exists. */}
                                {!isCreating && (
                                <View style={tw`px-5 pt-4 gap-2`}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            toggleArchiveHabit(editingHabit.id, !editingHabit.archivedAt);
                                            setView('list');
                                            setEditingHabit(null);
                                        }}
                                        style={[tw`flex-row items-center gap-3 py-3 px-4 rounded-2xl`, { backgroundColor: bgSoft }]}
                                    >
                                        {editingHabit?.archivedAt
                                            ? <RefreshCw size={17} color={textPrimary} />
                                            : <Archive size={17} color={textPrimary} />
                                        }
                                        <Text style={[tw`text-sm font-semibold`, { color: textPrimary }]}>
                                            {editingHabit?.archivedAt ? t('habitManager.restoreHabit') : t('habitManager.archiveHabit')}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={handleDelete}
                                        style={[tw`flex-row items-center gap-3 py-3 px-4 rounded-2xl`, { backgroundColor: deleteBg }]}
                                    >
                                        <Trash2 size={17} color="#ef4444" />
                                        <Text style={tw`text-sm font-semibold text-red-500`}>{t('habitManager.deleteHabit')}</Text>
                                    </TouchableOpacity>
                                </View>
                                )}
                            </ScrollView>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};
