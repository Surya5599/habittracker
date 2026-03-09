import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Plus, Trash2, Save, Edit2, Check, Archive, RefreshCw } from 'lucide-react-native';
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
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isReordering, setIsReordering] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editColor, setEditColor] = useState(theme.primary);
    const [editFrequency, setEditFrequency] = useState(undefined);
    const [editWeeklyTarget, setEditWeeklyTarget] = useState(null);
    const [habitType, setHabitType] = useState('daily'); // 'daily' or 'weekly'

    const scrollRef = useRef(null);
    const habitPositions = useRef({});

    const handleStartEdit = (habit) => {
        // If already editing something else, save it first
        if (editingId && editingId !== habit.id) {
            handleSaveEdit(editingId);
        }
        setIsAdding(false);
        setEditingId(habit.id);
        setEditName(habit.name);
        setEditDescription(habit.description || '');
        setEditColor(habit.color || theme.primary);
        setEditFrequency(habit.frequency);
        setEditWeeklyTarget(habit.weeklyTarget || null);
        setHabitType(habit.weeklyTarget ? 'weekly' : 'daily');

        // Scroll to the habit position
        const yPos = habitPositions.current[habit.id];
        if (yPos !== undefined && scrollRef.current) {
            // Small timeout to allow the TextInput to mount and keyboard to start opening
            setTimeout(() => {
                // Scroll a bit higher than just yPos to give some breathing room
                scrollRef.current.scrollTo({ y: Math.max(0, yPos - 10), animated: true });
            }, 150);
        }
    };

    const persistCurrentEdit = (id) => {
        if (!id) return;
        if (editName.trim()) {
            const updates = {
                name: editName,
                description: editDescription.trim(),
                color: editColor,
                frequency: habitType === 'daily' ? editFrequency : null,
                weeklyTarget: habitType === 'weekly' ? editWeeklyTarget : null
            };
            updateHabit(id, updates);
        }
    };

    const handleSaveEdit = (id) => {
        persistCurrentEdit(id);
        setEditingId(null);
    };

    const handleConfirmAdd = async () => {
        if (editName.trim()) {
            await addHabit(
                theme.primary,
                editName.trim(),
                habitType === 'daily' ? editFrequency : undefined,
                habitType === 'weekly' ? editWeeklyTarget : null,
                editDescription.trim(),
                editColor
            );
        }
        setIsAdding(false);
        setEditName('');
        setEditDescription('');
        setEditColor(theme.primary);
        setEditFrequency(undefined);
        setEditWeeklyTarget(null);
        setHabitType('daily');
    };

    const handleAdd = () => {
        if (editingId) handleSaveEdit(editingId);
        setIsAdding(true);
        setEditName('');
        setEditDescription('');
        setEditColor(theme.primary);
        setEditFrequency(undefined);
        setEditWeeklyTarget(3); // Default for weekly
        setHabitType('daily');

        // Scroll to top where the drafting row is
        if (scrollRef.current) {
            setTimeout(() => {
                scrollRef.current.scrollTo({ y: 0, animated: true });
            }, 100);
        }
    };

    const isDark = colorMode === 'dark';
    const outlineColor = isDark ? '#ffffff' : '#000000';
    const habitColors = Array.from(new Set(THEMES.map(t => t.primary)));

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={tw`flex-1 justify-end bg-black/50`}
            >
                <View style={[tw`rounded-t-3xl h-[85%] overflow-hidden border-t-4 border-black`, { borderTopColor: outlineColor, backgroundColor: isDark ? '#000000' : '#ffffff' }]}>
                    {/* Header */}
                    <View style={[tw`p-5 border-b-2 border-black flex-row items-center justify-between`, { backgroundColor: isDark ? '#0b0b0b' : '#ffffff', borderBottomColor: outlineColor }]}>
                        <Text style={[tw`text-xl font-black uppercase tracking-widest`, { color: isDark ? '#e5e7eb' : '#000000' }]}>{t('habitManager.title')}</Text>
                        <View style={tw`flex-row items-center gap-2`}>
                            <TouchableOpacity
                                onPress={() => setShowArchived(!showArchived)}
                                accessibilityRole="button"
                                accessibilityLabel={showArchived
                                    ? t('habitManager.showActive', { defaultValue: 'Show active habits' })
                                    : t('habitManager.showArchived', { defaultValue: 'Show archived habits' })}
                                style={[tw`p-2.5 border-2 border-black rounded-full`, showArchived ? tw`bg-black` : tw`bg-white`, { borderColor: outlineColor }]}
                            >
                                {showArchived ? (
                                    <RefreshCw size={16} color="white" />
                                ) : (
                                    <Archive size={16} color="black" />
                                )}
                            </TouchableOpacity>
                            {!showArchived && (
                                <TouchableOpacity
                                    onPress={() => setIsReordering(!isReordering)}
                                    accessibilityRole="button"
                                    accessibilityLabel={isReordering
                                        ? t('common.done', { defaultValue: 'Done reordering' })
                                        : t('common.reorder', { defaultValue: 'Reorder habits' })}
                                    style={[tw`p-2.5 border-2 border-black rounded-full`, isReordering ? tw`bg-black` : tw`bg-white`, { borderColor: outlineColor }]}
                                >
                                    {isReordering ? (
                                        <Check size={16} color="white" />
                                    ) : (
                                        <Edit2 size={16} color="black" />
                                    )}
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                onPress={() => {
                                    if (editingId) handleSaveEdit(editingId);
                                    onClose();
                                }}
                                style={[tw`p-2 border-2 border-black rounded-full`, { backgroundColor: isDark ? '#161616' : '#f3f4f6', borderColor: outlineColor }]}
                            >
                                <X size={20} color={isDark ? '#e5e7eb' : 'black'} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView
                        ref={scrollRef}
                        style={tw`flex-1 p-5`}
                        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 450 : 350 }} // Larger padding to allow last items to clear keyboard
                        showsVerticalScrollIndicator={false}
                    >
                        {isAdding && (
                            <View style={tw`relative mb-4`}>
                                <View style={tw`absolute top-[4px] left-[4px] w-full h-full bg-black rounded-xl`} />
                                <View style={[tw`bg-white border-2 border-black p-4 rounded-xl`, { borderColor: outlineColor }]}>
                                    <View style={tw`gap-3`}>
                                        <View style={tw`flex-row items-center gap-2`}>
                                            <TextInput
                                                placeholder={t('habitManager.habitNamePlaceholder') || "What's your new habit?"}
                                                placeholderTextColor="#a1a1aa"
                                                value={editName}
                                                onChangeText={setEditName}
                                                style={[tw`flex-1 bg-gray-50 border-2 border-black p-2 rounded-lg font-bold text-gray-800`, { borderColor: outlineColor }]}
                                                autoFocus
                                            />
                                            <TouchableOpacity onPress={handleConfirmAdd} style={[tw`p-2 bg-black border-2 border-black rounded-lg`, { borderColor: outlineColor }]}>
                                                <Check size={18} color="white" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setIsAdding(false)} style={[tw`p-2 bg-gray-100 border-2 border-black rounded-lg`, { borderColor: outlineColor }]}>
                                                <X size={18} color="black" />
                                            </TouchableOpacity>
                                        </View>
                                        <TextInput
                                            placeholder={t('habitManager.habitDescriptionPlaceholder', { defaultValue: 'Optional description' })}
                                            placeholderTextColor="#a1a1aa"
                                            value={editDescription}
                                            onChangeText={setEditDescription}
                                            multiline
                                            numberOfLines={2}
                                            textAlignVertical="top"
                                            style={[tw`bg-gray-50 border-2 border-black p-2 rounded-lg font-medium text-gray-700 min-h-[56px]`, { borderColor: outlineColor }]}
                                        />
                                        <View style={tw`flex-row flex-wrap gap-2`}>
                                            {habitColors.map(color => (
                                                <TouchableOpacity
                                                    key={`add-color-${color}`}
                                                    onPress={() => setEditColor(color)}
                                                    style={[
                                                        tw`w-7 h-7 rounded-full border-2`,
                                                        { backgroundColor: color, borderColor: editColor === color ? outlineColor : '#d1d5db' }
                                                    ]}
                                                />
                                            ))}
                                        </View>

                                        {/* Type Toggle */}
                                        <View style={[tw`flex-row bg-gray-100 border-2 border-black p-1 rounded-xl`, { borderColor: outlineColor }]}>
                                            <TouchableOpacity
                                                onPress={() => setHabitType('daily')}
                                                style={[tw`flex-1 py-1.5 px-2 items-center rounded-lg`, habitType === 'daily' ? { backgroundColor: theme.primary } : {}]}
                                            >
                                                <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, habitType === 'daily' ? tw`text-white` : tw`text-gray-400`]}>{t('habitManager.daily', { defaultValue: 'Daily' })}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => setHabitType('weekly')}
                                                style={[tw`flex-1 py-1.5 px-2 items-center rounded-lg`, habitType === 'weekly' ? { backgroundColor: theme.primary } : {}]}
                                            >
                                                <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, habitType === 'weekly' ? tw`text-white` : tw`text-gray-400`]}>{t('habitManager.weekly', { defaultValue: 'Weekly' })}</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {habitType === 'daily' ? (
                                            <View style={tw`flex-row justify-between w-full`}>
                                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                                                    const isSelected = !editFrequency || editFrequency.includes(i);
                                                    return (
                                                        <TouchableOpacity
                                                            key={i}
                                                            onPress={() => {
                                                                if (!editFrequency) {
                                                                    const all = [0, 1, 2, 3, 4, 5, 6];
                                                                    setEditFrequency(all.filter(d => d !== i));
                                                                } else {
                                                                    if (editFrequency.includes(i)) {
                                                                        const next = editFrequency.filter(d => d !== i);
                                                                        setEditFrequency(next.length === 7 ? undefined : next);
                                                                    } else {
                                                                        const next = [...editFrequency, i].sort();
                                                                        setEditFrequency(next.length === 7 ? undefined : next);
                                                                    }
                                                                }
                                                            }}
                                                            style={[
                                                                tw`w-10 h-10 items-center justify-center rounded-lg border-2`,
                                                                isSelected
                                                                    ? tw`bg-black border-black`
                                                                    : tw`bg-white border-gray-200`
                                                            ]}
                                                        >
                                                            <Text style={[
                                                                tw`text-xs font-black`,
                                                                isSelected ? tw`text-white` : tw`text-gray-300`
                                                            ]}>
                                                                {day}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        ) : (
                                            <View style={tw`gap-2`}>
                                                <Text style={tw`text-[10px] font-black uppercase text-gray-400`}>{t('habitManager.weeklyGoal', { defaultValue: 'Weekly goal' })}:</Text>
                                                <View style={tw`flex-row justify-between w-full`}>
                                                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                                        <TouchableOpacity
                                                            key={num}
                                                            onPress={() => setEditWeeklyTarget(num)}
                                                            style={[
                                                                tw`w-10 h-10 items-center justify-center rounded-lg border-2`,
                                                                editWeeklyTarget === num
                                                                    ? tw`bg-black border-black`
                                                                    : tw`bg-white border-gray-200`
                                                            ]}
                                                        >
                                                            <Text style={[
                                                                tw`text-xs font-black`,
                                                                editWeeklyTarget === num ? tw`text-white` : tw`text-gray-300`
                                                            ]}>
                                                                {num}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Habits List */}
                        <View style={tw`gap-2`}>
                            {habits
                                .filter(h => showArchived ? h.archivedAt : !h.archivedAt)
                                .map(habit => (
                                    <View
                                        key={habit.id}
                                        onLayout={(event) => {
                                            const { y } = event.nativeEvent.layout;
                                            habitPositions.current[habit.id] = y;

                                            // If this is the card that was just opened for editing,
                                            // we might want to re-scroll it into view if it expanded
                                            if (editingId === habit.id && scrollRef.current) {
                                                setTimeout(() => {
                                                    scrollRef.current.scrollTo({ y: Math.max(0, y - 10), animated: true });
                                                }, 50);
                                            }
                                        }}
                                        style={tw`relative mb-2`}
                                    >
                                        <View style={tw`absolute top-[3px] left-[3px] w-full h-full bg-black rounded-xl`} />
                                        <View style={[tw`bg-white border-2 border-black p-4 rounded-xl flex-row items-center justify-between`, habit.archivedAt && tw`bg-gray-50 opacity-80`, { borderColor: outlineColor }]}>
                                            {isReordering && !showArchived && (
                                                <View style={[tw`flex-row items-center gap-1 mr-3 border-r-2 border-black pr-3`, { borderRightColor: outlineColor }]}>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            const idx = habits.findIndex(h => h.id === habit.id);
                                                            if (idx > 0) {
                                                                const newHabits = [...habits];
                                                                [newHabits[idx - 1], newHabits[idx]] = [newHabits[idx], newHabits[idx - 1]];
                                                                reorderHabits(newHabits);
                                                            }
                                                        }}
                                                        style={tw`p-1`}
                                                    >
                                                        <Text style={tw`text-xl font-black text-black`}>↑</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            const idx = habits.findIndex(h => h.id === habit.id);
                                                            if (idx < habits.length - 1) {
                                                                const newHabits = [...habits];
                                                                [newHabits[idx + 1], newHabits[idx]] = [newHabits[idx], newHabits[idx + 1]];
                                                                reorderHabits(newHabits);
                                                            }
                                                        }}
                                                        style={tw`p-1`}
                                                    >
                                                        <Text style={tw`text-xl font-black text-black`}>↓</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                            {editingId === habit.id ? (
                                                <View style={tw`flex-1 gap-4`}>
                                                    <View style={tw`flex-row items-center gap-2`}>
                                                        <TextInput
                                                            value={editName}
                                                            onChangeText={setEditName}
                                                            onBlur={() => persistCurrentEdit(habit.id)}
                                                            style={[tw`flex-1 bg-gray-50 border-2 border-black p-2 rounded-lg font-bold text-gray-800`, { borderColor: outlineColor }]}
                                                            autoFocus
                                                        />
                                                        <TouchableOpacity onPress={() => handleSaveEdit(habit.id)} style={[tw`p-2 bg-black border-2 border-black rounded-lg`, { borderColor: outlineColor }]}>
                                                            <Check size={18} color="white" />
                                                        </TouchableOpacity>
                                                    </View>
                                                    <TextInput
                                                        value={editDescription}
                                                        onChangeText={setEditDescription}
                                                        onBlur={() => persistCurrentEdit(habit.id)}
                                                        placeholder={t('habitManager.habitDescriptionPlaceholder', { defaultValue: 'Optional description' })}
                                                        placeholderTextColor="#a1a1aa"
                                                        multiline
                                                        numberOfLines={2}
                                                        textAlignVertical="top"
                                                        style={[tw`bg-gray-50 border-2 border-black p-2 rounded-lg font-medium text-gray-700 min-h-[56px]`, { borderColor: outlineColor }]}
                                                    />
                                                    <View style={tw`flex-row flex-wrap gap-2`}>
                                                        {habitColors.map(color => (
                                                            <TouchableOpacity
                                                                key={`${habit.id}-color-${color}`}
                                                                onPress={() => {
                                                                    setEditColor(color);
                                                                    updateHabit(habit.id, { color });
                                                                }}
                                                                style={[
                                                                    tw`w-7 h-7 rounded-full border-2`,
                                                                    { backgroundColor: color, borderColor: editColor === color ? outlineColor : '#d1d5db' }
                                                                ]}
                                                            />
                                                        ))}
                                                    </View>

                                                    {/* Type Toggle */}
                                                    <View style={[tw`flex-row bg-gray-100 border-2 border-black p-1 rounded-xl`, { borderColor: outlineColor }]}>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                setHabitType('daily');
                                                                // Optional: Trigger save on type switch if desired, but user might be just exploring
                                                            }}
                                                            style={[tw`flex-1 py-1.5 px-2 items-center rounded-lg`, habitType === 'daily' ? { backgroundColor: theme.primary } : {}]}
                                                        >
                                                            <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, habitType === 'daily' ? tw`text-white` : tw`text-gray-400`]}>{t('habitManager.daily', { defaultValue: 'Daily' })}</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                setHabitType('weekly');
                                                            }}
                                                            style={[tw`flex-1 py-1.5 px-2 items-center rounded-lg`, habitType === 'weekly' ? { backgroundColor: theme.primary } : {}]}
                                                        >
                                                            <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, habitType === 'weekly' ? tw`text-white` : tw`text-gray-400`]}>{t('habitManager.weekly', { defaultValue: 'Weekly' })}</Text>
                                                        </TouchableOpacity>
                                                    </View>

                                                    {habitType === 'daily' ? (
                                                        <View style={tw`flex-row justify-between w-full`}>
                                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                                                                const isSelected = !editFrequency || editFrequency.includes(i);
                                                                return (
                                                                    <TouchableOpacity
                                                                        key={i}
                                                                        onPress={() => {
                                                                            let next;
                                                                            if (!editFrequency) {
                                                                                const all = [0, 1, 2, 3, 4, 5, 6];
                                                                                next = all.filter(d => d !== i);
                                                                            } else {
                                                                                if (editFrequency.includes(i)) {
                                                                                    next = editFrequency.filter(d => d !== i);
                                                                                } else {
                                                                                    next = [...editFrequency, i].sort();
                                                                                }
                                                                            }
                                                                            const finalFreq = next.length === 7 ? undefined : next;
                                                                            setEditFrequency(finalFreq);
                                                                            // Auto-save frequency change
                                                                            updateHabit(habit.id, { frequency: finalFreq, weeklyTarget: null });
                                                                        }}
                                                                        style={[
                                                                            tw`w-10 h-10 items-center justify-center rounded-lg border-2`,
                                                                            isSelected
                                                                                ? tw`bg-black border-black`
                                                                                : tw`bg-white border-gray-200`
                                                                        ]}
                                                                    >
                                                                        <Text style={[
                                                                            tw`text-xs font-black`,
                                                                            isSelected ? tw`text-white` : tw`text-gray-300`
                                                                        ]}>
                                                                            {day}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                );
                                                            })}
                                                        </View>
                                                    ) : (
                                                        <View style={tw`gap-2`}>
                                                            <Text style={tw`text-[10px] font-black uppercase text-gray-400`}>{t('habitManager.weeklyGoal', { defaultValue: 'Weekly goal' })}:</Text>
                                                            <View style={tw`flex-row justify-between w-full`}>
                                                                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                                                    <TouchableOpacity
                                                                        key={num}
                                                                        onPress={() => {
                                                                            setEditWeeklyTarget(num);
                                                                            // Auto-save target change
                                                                            updateHabit(habit.id, { weeklyTarget: num, frequency: null });
                                                                        }}
                                                                        style={[
                                                                            tw`w-10 h-10 items-center justify-center rounded-lg border-2`,
                                                                            editWeeklyTarget === num
                                                                                ? tw`bg-black border-black`
                                                                                : tw`bg-white border-gray-200`
                                                                        ]}
                                                                    >
                                                                        <Text style={[
                                                                            tw`text-xs font-black`,
                                                                            editWeeklyTarget === num ? tw`text-white` : tw`text-gray-300`
                                                                        ]}>
                                                                            {num}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </View>
                                                        </View>
                                                    )}
                                                </View>
                                            ) : (
                                                <View style={tw`flex-1`}>
                                                    <View style={tw`flex-row items-center gap-2`}>
                                                        <View style={[tw`w-3.5 h-3.5 rounded-full border`, { backgroundColor: habit.color || theme.primary, borderColor: outlineColor }]} />
                                                        <Text style={tw`font-bold text-lg text-black`}>{habit.name || t('habitManager.untitled')}</Text>
                                                    </View>
                                                    {!!habit.description?.trim() && (
                                                        <Text style={tw`text-xs text-gray-600 mt-1`} numberOfLines={2}>
                                                            {habit.description}
                                                        </Text>
                                                    )}
                                                    <Text style={tw`text-xs font-bold text-gray-400 uppercase tracking-wider`}>
                                                        {habit.weeklyTarget
                                                            ? `${t('habitManager.goal', { defaultValue: 'Goal' })}: ${habit.weeklyTarget}x / ${t('common.week', { defaultValue: 'Week' })}`
                                                            : (!habit.frequency || habit.frequency.length === 0 || habit.frequency.length === 7)
                                                                ? t('habitManager.dailyGoal', { defaultValue: 'Daily' })
                                                                : `${t('habitManager.days', { defaultValue: 'Days' })}: ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].filter((_, i) => habit.frequency.includes(i)).join(' ')}`
                                                        }
                                                    </Text>
                                                </View>
                                            )}

                                            {!editingId && (
                                                <View style={tw`flex-row items-center gap-2 ml-3`}>
                                                    <TouchableOpacity
                                                        onPress={() => toggleArchiveHabit(habit.id, !habit.archivedAt)}
                                                        style={[tw`p-2 bg-gray-100 border-2 border-black rounded-lg`, { borderColor: outlineColor }]}
                                                    >
                                                        {habit.archivedAt ? (
                                                            <RefreshCw size={16} color="black" />
                                                        ) : (
                                                            <Archive size={16} color="black" />
                                                        )}
                                                    </TouchableOpacity>
                                                    {!habit.archivedAt && (
                                                        <TouchableOpacity onPress={() => handleStartEdit(habit)} style={[tw`p-2 bg-gray-100 border-2 border-black rounded-lg`, { borderColor: outlineColor }]}>
                                                            <Edit2 size={16} color="black" />
                                                        </TouchableOpacity>
                                                    )}
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            Alert.alert(
                                                                t('habitManager.deleteTitle', { defaultValue: 'Delete Habit' }),
                                                                t('habitManager.deleteConfirm'),
                                                                [
                                                                    { text: t('common.cancel'), style: "cancel" },
                                                                    { text: t('common.delete', { defaultValue: 'Delete' }), style: "destructive", onPress: () => removeHabit(habit.id) }
                                                                ]
                                                            );
                                                        }}
                                                        style={[tw`p-2 bg-gray-100 border-2 border-black rounded-lg`, { borderColor: outlineColor }]}
                                                    >
                                                        <Trash2 size={16} color="#ef4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))}
                        </View>
                    </ScrollView>

                    {/* Add Button */}
                    <View style={[tw`p-5 bg-white border-t-2 border-black`, { borderTopColor: outlineColor }]}>
                        <TouchableOpacity
                            onPress={handleAdd}
                            activeOpacity={0.8}
                            style={tw`relative`}
                        >
                            <View style={tw`absolute top-[4px] left-[4px] w-full h-full bg-black rounded-xl`} />
                            <View style={[tw`w-full py-4 rounded-xl flex-row items-center justify-center gap-2 border-2 border-black`, { backgroundColor: theme.primary, borderColor: outlineColor }]}>
                                <Plus size={24} color="white" strokeWidth={3} />
                                <Text style={tw`text-white font-black uppercase text-lg tracking-widest`}>{t('habitManager.addHabit')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};
