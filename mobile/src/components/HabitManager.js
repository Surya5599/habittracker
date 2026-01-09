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
    theme
}) => {
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editName, setEditName] = useState('');
    const [editFrequency, setEditFrequency] = useState(undefined);

    const scrollRef = useRef(null);
    const habitPositions = useRef({});

    const handleStartEdit = (habit) => {
        setIsAdding(false);
        setEditingId(habit.id);
        setEditName(habit.name);
        setEditFrequency(habit.frequency);

        // Scroll to the habit position
        const yPos = habitPositions.current[habit.id];
        if (yPos !== undefined && scrollRef.current) {
            // Small timeout to allow the TextInput to mount and keyboard to start opening
            setTimeout(() => {
                scrollRef.current.scrollTo({ y: yPos - 20, animated: true });
            }, 100);
        }
    };

    const handleSaveEdit = (id) => {
        if (editName.trim()) {
            updateHabit(id, { name: editName, frequency: editFrequency });
        }
        setEditingId(null);
    };

    const handleConfirmAdd = async () => {
        if (editName.trim()) {
            await addHabit(theme.primary, editName.trim(), editFrequency);
        }
        setIsAdding(false);
        setEditName('');
        setEditFrequency(undefined);
    };

    const handleAdd = () => {
        setEditingId(null);
        setIsAdding(true);
        setEditName('');
        setEditFrequency(undefined);

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
                <View style={tw`bg-[#f5f5f4] rounded-t-3xl h-[85%] overflow-hidden`}>
                    {/* Header */}
                    <View style={tw`p-5 border-b border-gray-200 flex-row items-center justify-between bg-white`}>
                        <Text style={tw`text-xl font-black uppercase tracking-widest text-gray-700`}>Manage Habits</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={tw`p-2 bg-gray-100 rounded-full`}
                        >
                            <X size={20} color="#57534e" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        ref={scrollRef}
                        style={tw`flex-1 p-5`}
                        contentContainerStyle={{ paddingBottom: 120 }} // Extra padding for bottom button
                        showsVerticalScrollIndicator={false}
                    >
                        {/* New Habit Drafting Row */}
                        {isAdding && (
                            <View style={tw`bg-white border-2 border-black p-4 rounded-xl mb-4`}>
                                <View style={tw`gap-2`}>
                                    <View style={tw`flex-row items-center gap-2`}>
                                        <TextInput
                                            placeholder="What's your new habit?"
                                            placeholderTextColor="#a1a1aa"
                                            value={editName}
                                            onChangeText={setEditName}
                                            style={tw`flex-1 bg-gray-50 border border-black p-2 rounded-lg font-bold text-gray-800`}
                                            autoFocus
                                        />
                                        <TouchableOpacity onPress={handleConfirmAdd} style={tw`p-2 bg-black rounded-lg`}>
                                            <Check size={16} color="white" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setIsAdding(false)} style={tw`p-2 bg-gray-100 rounded-lg`}>
                                            <X size={16} color="#57534e" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Day Selector for New Habit */}
                                    <View style={tw`flex-row gap-1`}>
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
                                                        tw`w-6 h-6 items-center justify-center rounded border-2`,
                                                        isSelected
                                                            ? tw`bg-black border-black`
                                                            : tw`bg-white border-gray-200`
                                                    ]}
                                                >
                                                    <Text style={[
                                                        tw`text-[10px] font-black`,
                                                        isSelected ? tw`text-white` : tw`text-gray-300`
                                                    ]}>
                                                        {day}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Habits List */}
                        <View style={tw`gap-4`}>
                            {habits.map(habit => (
                                <View
                                    key={habit.id}
                                    onLayout={(event) => {
                                        const { y } = event.nativeEvent.layout;
                                        habitPositions.current[habit.id] = y;
                                    }}
                                    style={tw`bg-white border-2 border-gray-100 p-4 rounded-xl flex-row items-center justify-between shadow-sm`}
                                >
                                    {editingId === habit.id ? (
                                        <View style={tw`flex-1 gap-2`}>
                                            <View style={tw`flex-row items-center gap-2`}>
                                                <TextInput
                                                    value={editName}
                                                    onChangeText={setEditName}
                                                    style={tw`flex-1 bg-gray-50 border border-black p-2 rounded-lg font-bold text-gray-800`}
                                                    autoFocus
                                                />
                                                <TouchableOpacity onPress={() => handleSaveEdit(habit.id)} style={tw`p-2 bg-black rounded-lg`}>
                                                    <Check size={16} color="white" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => setEditingId(null)} style={tw`p-2 bg-gray-100 rounded-lg`}>
                                                    <X size={16} color="#57534e" />
                                                </TouchableOpacity>
                                            </View>

                                            {/* Day Selector */}
                                            <View style={tw`flex-row gap-1`}>
                                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                                                    const isSelected = !editFrequency || editFrequency.includes(i);
                                                    return (
                                                        <TouchableOpacity
                                                            key={i}
                                                            onPress={() => {
                                                                if (!editFrequency) {
                                                                    // From 'all' to specific
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
                                                                tw`w-6 h-6 items-center justify-center rounded border-2`,
                                                                isSelected
                                                                    ? tw`bg-black border-black`
                                                                    : tw`bg-white border-gray-200`
                                                            ]}
                                                        >
                                                            <Text style={[
                                                                tw`text-[10px] font-black`,
                                                                isSelected ? tw`text-white` : tw`text-gray-300`
                                                            ]}>
                                                                {day}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={tw`flex-1`}>
                                            <Text style={tw`font-bold text-lg text-gray-800`}>{habit.name || 'Untitled Habit'}</Text>
                                            <Text style={tw`text-xs font-bold text-gray-400 uppercase`}>Daily Goal</Text>
                                        </View>
                                    )}

                                    {!editingId && (
                                        <View style={tw`flex-row items-center gap-2 ml-3`}>
                                            <TouchableOpacity onPress={() => handleStartEdit(habit)} style={tw`p-2 bg-gray-100 rounded-lg`}>
                                                <Edit2 size={16} color="#57534e" />
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
                                                style={tw`p-2 bg-gray-100 rounded-lg`}
                                            >
                                                <Trash2 size={16} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Add Button */}
                    <View style={tw`absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 shadow-lg`}>
                        <TouchableOpacity
                            onPress={handleAdd}
                            style={[tw`w-full py-4 rounded-xl flex-row items-center justify-center gap-2 border-[3px] border-black shadow-lg`, { backgroundColor: theme.primary }]}
                        >
                            <Plus size={24} color="white" strokeWidth={3} />
                            <Text style={tw`text-white font-black uppercase text-lg tracking-widest`}>New Habit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};
