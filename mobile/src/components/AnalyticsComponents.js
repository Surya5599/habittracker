import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import tw from 'twrnc';
import { getHabitMonthStats } from '../utils/stats';
import Svg, { Circle } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;

const HardShadowCard = ({ children, style, bgColor }) => (
    <View style={style}>
        <View style={[
            tw`absolute bg-black rounded-3xl`,
            { top: 6, left: 6, right: -6, bottom: -6, zIndex: -1 }
        ]} />
        <View style={[
            tw`border-[3px] border-black rounded-3xl overflow-hidden flex-1`,
            { backgroundColor: bgColor || 'white' }
        ]}>
            {children}
        </View>
    </View>
);

export const MonthlyAnalytics = ({ habits, completions, theme }) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const monthName = new Date().toLocaleString('default', { month: 'long' });

    // Calculate stats per habit
    const habitStats = habits.map(habit => {
        const stats = getHabitMonthStats(habit.id, completions, currentMonth, currentYear, habit.frequency);
        const percentage = stats.totalDays > 0 ? Math.round((stats.completed / stats.totalDays) * 100) : 0;
        return {
            ...habit,
            stats,
            percentage
        };
    }).sort((a, b) => b.percentage - a.percentage); // Sort by best performance

    return (
        <View style={tw`flex-1`}>
            {/* Header Card */}
            <View style={tw`mb-6`}>
                <HardShadowCard bgColor={theme.primary}>
                    <View style={tw`p-5`}>
                        <Text style={tw`text-white font-black uppercase tracking-widest text-lg mb-1`}>{monthName} Overview</Text>
                        <Text style={tw`text-white/80 text-xs font-bold`}>Keep pushing your limits!</Text>
                    </View>
                </HardShadowCard>
            </View>

            {/* Habits List */}
            <View style={tw`gap-4 pb-8`}>
                {habitStats.map((habit, index) => (
                    <HardShadowCard key={habit.id}>
                        <View style={tw`p-4`}>
                            <View style={tw`flex-row justify-between items-center mb-2`}>
                                <View style={tw`flex-1 mr-4`}>
                                    <Text style={tw`font-black text-gray-800 text-base uppercase`} numberOfLines={1}>{habit.name}</Text>
                                    <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider`}>{habit.stats.completed} / {habit.stats.totalDays} Days</Text>
                                </View>
                                <View style={tw`items-end`}>
                                    <Text style={tw`text-xl font-black text-gray-800`}>{habit.percentage}%</Text>
                                </View>
                            </View>

                            {/* Progress Bar */}
                            <View style={tw`h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200`}>
                                <View
                                    style={[
                                        tw`h-full`,
                                        {
                                            width: `${habit.percentage}%`,
                                            backgroundColor: theme.secondary
                                        }
                                    ]}
                                />
                            </View>
                        </View>
                    </HardShadowCard>
                ))}

                {habitStats.length === 0 && (
                    <Text style={tw`text-center text-gray-400 font-bold mt-4`}>No habits found.</Text>
                )}
            </View>
        </View>
    );
};

export const YearlyAnalytics = ({ annualData, theme }) => {
    return (
        <View style={tw`flex-1`}>
            {/* Header Card */}
            <View style={tw`mb-6`}>
                <HardShadowCard bgColor={theme.primary}>
                    <View style={tw`p-5`}>
                        <View style={tw`flex-row justify-between items-center`}>
                            <View>
                                <Text style={tw`text-white font-black uppercase tracking-widest text-lg mb-1`}>{annualData.currentYear} Retrospective</Text>
                                <Text style={tw`text-white/80 text-xs font-bold`}>Your year in review</Text>
                            </View>
                            <View style={tw`items-end`}>
                                <Text style={tw`text-3xl font-black text-white`}>{annualData.annualPercentage}%</Text>
                                <Text style={tw`text-white/60 text-[10px] font-black uppercase`}>Consistency</Text>
                            </View>
                        </View>
                    </View>
                </HardShadowCard>
            </View>

            {/* Monthly Grid */}
            <View style={tw`mb-6`}>
                <HardShadowCard>
                    <View style={tw`p-5`}>
                        <View style={tw`flex-row flex-wrap justify-between gap-y-6`}>
                            {annualData.monthlyStats.map((m, i) => (
                                <View key={i} style={tw`w-[30%] items-center gap-2`}>
                                    <View style={tw`w-full aspect-square border-2 border-gray-200 justify-center items-center relative overflow-hidden bg-gray-50 rounded-xl`}>
                                        <Text style={tw`text-sm font-black text-gray-800 z-10`}>{m.percentage}%</Text>

                                        {/* Fill Effect */}
                                        <View
                                            style={[
                                                tw`absolute bottom-0 left-0 right-0`,
                                                {
                                                    height: `${m.percentage}%`,
                                                    backgroundColor: i === new Date().getMonth() ? theme.primary + '40' : theme.secondary + '20'
                                                }
                                            ]}
                                        />

                                        {/* Active Month Indicator */}
                                        {i === new Date().getMonth() && (
                                            <View style={[tw`absolute top-1 right-1 w-2 h-2 rounded-full`, { backgroundColor: theme.primary }]} />
                                        )}
                                    </View>
                                    <Text style={tw`text-[10px] font-black uppercase text-gray-600`}>{m.name.substring(0, 3)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </HardShadowCard>
            </View>

            {/* Quote */}
            <View style={[tw`p-6 border-2 border-dashed border-gray-300 rounded-3xl mt-2`, { backgroundColor: '#f5f5f4' }]}>
                <Text style={tw`text-gray-500 font-bold italic text-center text-sm`}>"Discipline is doing what needs to be done, even if you don't want to do it."</Text>
            </View>
        </View>
    );
};
