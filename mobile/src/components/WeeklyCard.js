import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Check, Target } from 'lucide-react-native';
import tw from 'twrnc';
import { isCompleted as checkCompleted } from '../utils/stats';

const HardShadowCardLocal = ({ children, bgColor = 'white', borderSize = 3 }) => (
    <View style={tw`mb-6 mx-1`}>
        <View style={[
            tw`absolute bg-black rounded-3xl`,
            { top: 6, left: 6, right: -6, bottom: -6, zIndex: -1 }
        ]} />
        <View style={[
            tw`border-[${borderSize}px] border-black rounded-3xl overflow-hidden`,
            { backgroundColor: bgColor }
        ]}>
            {children}
        </View>
    </View>
);

export const WeeklyCard = ({
    habits,
    completions,
    theme,
    toggleCompletion,
    date, // Reference date (usually today)
    weekOffset,
    weekStart = 'MON'
}) => {
    // Filter for flexible habits
    const flexibleHabits = habits.filter(h => h.weekly_target);

    if (flexibleHabits.length === 0) return null;

    // Calculate current week boundaries
    const today = new Date();
    const day = today.getDay();
    const diff = weekStart === 'SUN'
        ? today.getDate() - day + (weekOffset * 7)
        : today.getDate() - (day === 0 ? 6 : day - 1) + (weekOffset * 7);

    const weekStartDate = new Date(today.getFullYear(), today.getMonth(), diff);
    weekStartDate.setHours(0, 0, 0, 0);

    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStartDate);
        d.setDate(weekStartDate.getDate() + i);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return (
        <HardShadowCardLocal borderSize={3}>
            <View style={[tw`p-4 border-b-[3px] border-black`, { backgroundColor: theme.primary }]}>
                <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center gap-2`}>
                        <Target size={20} color="white" strokeWidth={3} />
                        <Text style={tw`text-white font-black uppercase text-sm tracking-widest`}>Weekly Goals</Text>
                    </View>
                </View>
            </View>

            <View style={tw`p-5 bg-white`}>
                {flexibleHabits.map((habit) => {
                    // Count completions for this habit in the current week
                    let weekCount = 0;
                    weekDates.forEach(dateKey => {
                        if (completions[habit.id]?.[dateKey]) weekCount++;
                    });

                    const isDoneToday = completions[habit.id]?.[todayKey];
                    const isGoalReached = weekCount >= habit.weekly_target;

                    return (
                        <View key={habit.id} style={tw`mb-5 last:mb-0`}>
                            <View style={tw`flex-row items-center justify-between mb-2`}>
                                <View style={tw`flex-1`}>
                                    <Text style={[tw`text-base font-black`, isGoalReached ? tw`text-gray-300` : tw`text-gray-800`]}>
                                        {habit.name}
                                    </Text>
                                    <Text style={tw`text-[10px] font-black uppercase text-gray-400`}>
                                        Target: {habit.weekly_target}x this week
                                    </Text>
                                </View>

                                <View style={tw`flex-row items-center gap-3`}>
                                    <View style={tw`items-end`}>
                                        <Text style={[tw`text-lg font-black`, isGoalReached ? { color: theme.primary } : tw`text-black`]}>
                                            {weekCount}<Text style={tw`text-gray-300`}>/{habit.weekly_target}</Text>
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => toggleCompletion(habit.id, todayKey)}
                                        style={[
                                            tw`w-10 h-10 border-[3px] border-black items-center justify-center rounded-xl`,
                                            isDoneToday ? tw`bg-black` : tw`bg-white`
                                        ]}
                                    >
                                        {isDoneToday && <Check size={20} color="white" strokeWidth={4} />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Progress Bar */}
                            <View style={tw`h-3 bg-gray-100 rounded-full border-2 border-black overflow-hidden`}>
                                <View
                                    style={[
                                        tw`h-full rounded-full`,
                                        {
                                            backgroundColor: isGoalReached ? theme.primary : theme.secondary,
                                            width: `${Math.min(100, (weekCount / habit.weekly_target) * 100)}%`
                                        }
                                    ]}
                                />
                            </View>
                        </View>
                    );
                })}
            </View>
        </HardShadowCardLocal>
    );
};
