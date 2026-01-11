import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Plus, Trash2, Save, Edit2, Check } from 'lucide-react-native';
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
    theme
}) => {
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isReordering, setIsReordering] = useState(false);
    const [editName, setEditName] = useState('');
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
                habitType === 'weekly' ? editWeeklyTarget : null
            );
        }
        setIsAdding(false);
        setEditName('');
        setEditFrequency(undefined);
        setEditWeeklyTarget(null);
        setHabitType('daily');
    };

    const handleAdd = () => {
        if (editingId) handleSaveEdit(editingId);
        setIsAdding(true);
        setEditName('');
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
                <View style={[tw`bg-white rounded-t-3xl h-[85%] overflow-hidden border-t-4 border-black`, { borderTopColor: 'black' }]}>
                    {/* Header */}
                    <View style={tw`p-5 border-b-2 border-black flex-row items-center justify-between bg-white`}>
                        <Text style={tw`text-xl font-black uppercase tracking-widest text-black`}>Manage Habits</Text>
                        <View style={tw`flex-row items-center gap-2`}>
                            <TouchableOpacity
                                onPress={() => setIsReordering(!isReordering)}
                                style={[tw`px-3 py-1.5 border-2 border-black`, isReordering ? tw`bg-black` : tw`bg-white`]}
                            >
                                <Text style={[tw`text-[10px] font-black uppercase tracking-wider`, isReordering ? tw`text-white` : tw`text-black`]}>
                                    {isReordering ? 'Done' : 'Reorder'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (editingId) handleSaveEdit(editingId);
                                    onClose();
                                }}
                                style={tw`p-2 bg-gray-100 border-2 border-black rounded-full`}
                            >
                                <X size={20} color="black" />
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
                                <View style={tw`bg-white border-2 border-black p-4 rounded-xl`}>
                                    <View style={tw`gap-3`}>
                                        <View style={tw`flex-row items-center gap-2`}>
                                            <TextInput
                                                placeholder="What's your new habit?"
                                                placeholderTextColor="#a1a1aa"
                                                value={editName}
                                                onChangeText={setEditName}
                                                style={tw`flex-1 bg-gray-50 border-2 border-black p-2 rounded-lg font-bold text-gray-800`}
                                                autoFocus
                                            />
                                            <TouchableOpacity onPress={handleConfirmAdd} style={tw`p-2 bg-black border-2 border-black rounded-lg`}>
                                                <Check size={18} color="white" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setIsAdding(false)} style={tw`p-2 bg-gray-100 border-2 border-black rounded-lg`}>
                                                <X size={18} color="black" />
                                            </TouchableOpacity>
                                        </View>

                                        {/* Type Toggle */}
                                        <View style={tw`flex-row bg-gray-100 border-2 border-black p-1 rounded-xl`}>
                                            <TouchableOpacity
                                                onPress={() => setHabitType('daily')}
                                                style={[tw`flex-1 py-1.5 px-2 items-center rounded-lg`, habitType === 'daily' ? { backgroundColor: theme.primary } : {}]}
                                            >
                                                <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, habitType === 'daily' ? tw`text-white` : tw`text-gray-400`]}>Daily</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => setHabitType('weekly')}
                                                style={[tw`flex-1 py-1.5 px-2 items-center rounded-lg`, habitType === 'weekly' ? { backgroundColor: theme.primary } : {}]}
                                            >
                                                <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, habitType === 'weekly' ? tw`text-white` : tw`text-gray-400`]}>Weekly</Text>
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
                                                <Text style={tw`text-[10px] font-black uppercase text-gray-400`}>Weekly Goal:</Text>
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
                            {habits.map(habit => (
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
                                    <View style={tw`bg-white border-2 border-black p-4 rounded-xl flex-row items-center justify-between`}>
                                        {isReordering && (
                                            <View style={tw`flex-row items-center gap-1 mr-3 border-r-2 border-black pr-3`}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const idx = habits.findIndex(h => h.id === habit.id);
                                                        if (idx > 0) {
                                                            const newHabits = [...habits];
                                                            [newHabits[idx - 1], newHabits[idx]] = [newHabits[idx], newHabits[idx - 1]];
                                                            reorderHabits(newHabits);
                                                        }
                                                    }}
                                                    className="p-1"
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
                                                    className="p-1"
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
                                                        style={tw`flex-1 bg-gray-50 border-2 border-black p-2 rounded-lg font-bold text-gray-800`}
                                                        autoFocus
                                                    />
                                                    <TouchableOpacity onPress={() => handleSaveEdit(habit.id)} style={tw`p-2 bg-black border-2 border-black rounded-lg`}>
                                                        <Check size={18} color="white" />
                                                    </TouchableOpacity>
                                                </View>

                                                {/* Type Toggle */}
                                                <View style={tw`flex-row bg-gray-100 border-2 border-black p-1 rounded-xl`}>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setHabitType('daily');
                                                            // Optional: Trigger save on type switch if desired, but user might be just exploring
                                                        }}
                                                        style={[tw`flex-1 py-1.5 px-2 items-center rounded-lg`, habitType === 'daily' ? { backgroundColor: theme.primary } : {}]}
                                                    >
                                                        <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, habitType === 'daily' ? tw`text-white` : tw`text-gray-400`]}>Daily</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setHabitType('weekly');
                                                        }}
                                                        style={[tw`flex-1 py-1.5 px-2 items-center rounded-lg`, habitType === 'weekly' ? { backgroundColor: theme.primary } : {}]}
                                                    >
                                                        <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, habitType === 'weekly' ? tw`text-white` : tw`text-gray-400`]}>Weekly</Text>
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
                                                        <Text style={tw`text-[10px] font-black uppercase text-gray-400`}>Weekly Goal:</Text>
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
                                                <Text style={tw`font-bold text-lg text-black`}>{habit.name || 'Untitled Habit'}</Text>
                                                <Text style={tw`text-xs font-bold text-gray-400 uppercase tracking-wider`}>
                                                    {habit.weeklyTarget
                                                        ? `Goal: ${habit.weeklyTarget}x / week`
                                                        : (!habit.frequency || habit.frequency.length === 0 || habit.frequency.length === 7)
                                                            ? 'Daily Goal'
                                                            : `Days: ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].filter((_, i) => habit.frequency.includes(i)).join(' ')}`
                                                    }
                                                </Text>
                                            </View>
                                        )}

                                        {!editingId && (
                                            <View style={tw`flex-row items-center gap-2 ml-3`}>
                                                <TouchableOpacity onPress={() => handleStartEdit(habit)} style={tw`p-2 bg-gray-100 border-2 border-black rounded-lg`}>
                                                    <Edit2 size={16} color="black" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        Alert.alert(
                                                            "Delete Habit",
                                                            "Are you sure? This cannot be undone.",
                                                            [
                                                                { text: "Cancel", style: "cancel" },
                                                                { text: "Delete", style: "destructive", onPress: () => removeHabit(habit.id) }
                                                            ]
                                                        );
                                                    }}
                                                    style={tw`p-2 bg-gray-100 border-2 border-black rounded-lg`}
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
                    <View style={tw`p-5 bg-white border-t-2 border-black`}>
                        <TouchableOpacity
                            onPress={handleAdd}
                            activeOpacity={0.8}
                            style={tw`relative`}
                        >
                            <View style={tw`absolute top-[4px] left-[4px] w-full h-full bg-black rounded-xl`} />
                            <View style={[tw`w-full py-4 rounded-xl flex-row items-center justify-center gap-2 border-2 border-black`, { backgroundColor: theme.primary }]}>
                                <Plus size={24} color="white" strokeWidth={3} />
                                <Text style={tw`text-white font-black uppercase text-lg tracking-widest`}>New Habit</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};
