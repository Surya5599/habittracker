import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import tw from 'twrnc';
import { ChevronRight, BookOpen, Cookie, X, Meh } from 'lucide-react-native';
import { isCompleted as checkCompleted } from '../utils/stats';
import { DailyCard } from '../components/DailyCard';
import { MOODS } from '../constants';


export const MonthlyView = ({ habits, completions, notes, theme, toggleCompletion, updateNote }) => {
    const [mode, setMode] = useState('journals'); // 'journals' or 'habits'
    const [selectedDate, setSelectedDate] = useState(null);

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

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Header / Toggle */}
            <View style={tw`p-5 bg-white border-b border-gray-100`}>
                <View style={tw`flex-row bg-gray-100 p-1.5 rounded-2xl`}>
                    <TouchableOpacity
                        onPress={() => setMode('journals')}
                        style={[tw`flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2`, mode === 'journals' && tw`bg-white shadow-sm`]}
                    >
                        <BookOpen size={16} color={mode === 'journals' ? theme.primary : '#a1a1aa'} />
                        <Text style={[tw`font-black uppercase text-[11px] tracking-widest`, mode === 'journals' ? { color: theme.primary } : tw`text-gray-400`]}>Journals</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setMode('habits')}
                        style={[tw`flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2`, mode === 'habits' && tw`bg-white shadow-sm`]}
                    >
                        <Cookie size={16} color={mode === 'habits' ? theme.primary : '#a1a1aa'} />
                        <Text style={[tw`font-black uppercase text-[11px] tracking-widest`, mode === 'habits' ? { color: theme.primary } : tw`text-gray-400`]}>Habits</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={tw`flex-1`}
                contentContainerStyle={tw`pb-32 pt-2`}
                showsVerticalScrollIndicator={false}
            >
                {days.map((date, idx) => {
                    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    const dayData = notes?.[dateKey] || {};
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = date.getDate();
                    const monthName = date.toLocaleDateString('en-US', { month: 'short' });

                    return (
                        <TouchableOpacity
                            key={dateKey}
                            onPress={() => setSelectedDate(date)}
                            style={tw`mx-4 mt-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex-row items-center`}
                            activeOpacity={0.7}
                        >
                            {/* Date Column */}
                            <View style={tw`items-center mr-4 w-12`}>
                                <Text style={tw`text-[10px] font-black uppercase text-gray-400 mb-0.5`}>{dayName}</Text>
                                <Text style={tw`text-xl font-black text-gray-800`}>{dayNum}</Text>
                                <Text style={tw`text-[10px] font-black uppercase text-gray-400 mt-0.5`}>{monthName}</Text>
                            </View>

                            {/* Content Column */}
                            <View style={tw`flex-1 border-l border-gray-50 pl-4 py-1 min-h-[40px] justify-center`}>
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
                                            <Meh size={22} color="#e5e7eb" strokeWidth={2} />
                                        )}
                                        <View style={tw`flex-1 ml-3`}>
                                            <Text
                                                style={[tw`text-sm font-bold`, dayData.journal ? tw`text-gray-600` : tw`text-gray-300 italic`]}
                                            >
                                                {dayData.journal || 'Empty entry...'}
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={tw`flex-row flex-wrap gap-1.5`}>
                                        {habits.filter(h => !h.frequency || h.frequency.includes(date.getDay())).length > 0 ? (
                                            habits
                                                .filter(h => !h.frequency || h.frequency.includes(date.getDay()))
                                                .map(h => {
                                                    const done = checkCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear());
                                                    return (
                                                        <View
                                                            key={h.id}
                                                            style={[
                                                                tw`w-3 h-3 rounded-full shadow-sm`,
                                                                {
                                                                    backgroundColor: done ? h.color : '#f3f4f6',
                                                                    borderWidth: done ? 0 : 1.5,
                                                                    borderColor: '#e5e7eb'
                                                                }
                                                            ]}
                                                        />
                                                    );
                                                })
                                        ) : (
                                            <Text style={tw`text-xs font-bold text-gray-300 italic`}>No habits scheduled</Text>
                                        )}
                                    </View>
                                )}
                            </View>

                            <View style={tw`ml-2`}>
                                <ChevronRight size={18} color="#e5e7eb" strokeWidth={3} />
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Popup Modal */}
            <Modal
                visible={!!selectedDate}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectedDate(null)}
            >
                <View style={tw`flex-1 justify-end bg-black/50`}>
                    <View style={tw`bg-[#f5f5f4] rounded-t-3xl h-[90%] overflow-hidden`}>
                        {/* Modal Header */}
                        <View style={tw`p-5 border-b border-gray-200 flex-row items-center justify-between bg-white`}>
                            <Text style={tw`text-xl font-black uppercase tracking-widest text-gray-700`}>Day Details</Text>
                            <TouchableOpacity
                                onPress={() => setSelectedDate(null)}
                                style={tw`p-2 bg-gray-100 rounded-full`}
                            >
                                <X size={20} color="#57534e" />
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
                                        toggleCompletion={toggleCompletion}
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
