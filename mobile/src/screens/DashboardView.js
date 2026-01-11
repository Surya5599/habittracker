import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import tw from 'twrnc';
import { ChevronLeft, ChevronRight, Settings, Check, Zap, Trophy, Target } from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { buildWeeklyStory, buildMonthlyStory, buildAnnualStory } from '../utils/storyGenerator';
import { AnalyticsDashboard, HardShadowCardLocal } from '../components/AnalyticsDashboard';

import { getHabitMonthStats } from '../utils/stats';
import { DatePickerModal } from '../components/DatePickerModal';
import { MonthYearPickerModal } from '../components/MonthYearPickerModal';
import { WeeklyCard } from '../components/WeeklyCard';


export const DashboardView = ({
    habits,
    weekProgress,
    weeklyStats,
    weekOffset,
    setWeekOffset,
    theme,
    completions,
    notes,
    toggleCompletion,
    weekStart = 'MON'
}) => {
    const [analyticsView, setAnalyticsView] = React.useState('WEEK'); // WEEK, MONTH, YEAR
    const [monthOffset, setMonthOffset] = React.useState(0);
    const [yearOffset, setYearOffset] = React.useState(0);
    const [showMonthYearPicker, setShowMonthYearPicker] = React.useState(false);
    const [pickerMode, setPickerMode] = React.useState('both'); // 'both' or 'year'

    const today = new Date();

    // Mood Data Calculations
    const weeklyMoodData = React.useMemo(() => {
        const monday = new Date(today);
        const day = today.getDay();
        const diff = weekStart === 'SUN'
            ? today.getDate() - day + (weekOffset * 7)
            : today.getDate() - (day === 0 ? 6 : day - 1) + (weekOffset * 7);
        monday.setDate(diff);

        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return {
                label: d.toLocaleDateString('default', { weekday: 'short' }),
                mood: notes[dateKey]?.mood || null
            };
        });
    }, [notes, weekOffset]);

    const monthlyMoodData = React.useMemo(() => {
        const baseDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        return Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            return {
                label: d,
                mood: notes[dateKey]?.mood || null
            };
        });
    }, [notes, monthOffset]);

    const annualMoodData = React.useMemo(() => {
        const targetYear = today.getFullYear() + yearOffset;
        const months = [
            "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
            "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
        ];
        return months.map((monthName, monthIndex) => {
            const moodCounts = {};
            const daysInMonth = new Date(targetYear, monthIndex + 1, 0).getDate();

            for (let d = 1; d <= daysInMonth; d++) {
                const dateKey = `${targetYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const mood = notes[dateKey]?.mood;
                if (mood) {
                    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
                }
            }

            let dominantMood = null;
            let maxCount = 0;
            Object.entries(moodCounts).forEach(([mood, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    dominantMood = parseInt(mood);
                }
            });

            return {
                label: monthName.substring(0, 3),
                mood: dominantMood
            };
        });
    }, [notes, yearOffset]);

    // Annual Data Calculation
    const annualData = React.useMemo(() => {
        const currentYear = new Date().getFullYear();
        const months = [
            "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
            "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
        ];
        let totalPossible = 0;
        let totalCompleted = 0;

        const monthlyStats = months.map((monthName, index) => {
            let mTotal = 0;
            let mCompleted = 0;

            habits.forEach(habit => {
                const stats = getHabitMonthStats(habit.id, completions, index, currentYear, habit.frequency, habit.createdAt);
                mTotal += stats.totalDays;
                mCompleted += stats.completed;
            });

            totalPossible += mTotal;
            totalCompleted += mCompleted;

            return {
                name: monthName,
                percentage: mTotal > 0 ? Math.round((mCompleted / mTotal) * 100) : 0,
            };
        });

        const annualPercentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

        return { monthlyStats, annualPercentage, currentYear };
    }, [habits, completions]);

    // Monthly Data Calculation
    const monthlyData = React.useMemo(() => {
        const baseDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
        const currentYear = baseDate.getFullYear();
        const currentMonth = baseDate.getMonth();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const monthName = baseDate.toLocaleString('default', { month: 'long' });

        // Calculate stats per habit
        const habitStats = habits.map(habit => {
            const stats = getHabitMonthStats(habit.id, completions, currentMonth, currentYear, habit.frequency, habit.createdAt);
            const percentage = stats.totalDays > 0 ? Math.round((stats.completed / stats.totalDays) * 100) : 0;
            return {
                ...habit,
                stats,
                percentage
            };
        }).sort((a, b) => b.percentage - a.percentage);

        const bestHabit = habitStats[0] ? { name: habitStats[0].name, value: habitStats[0].stats.completed } : null;
        const worstHabit = habitStats.length > 0 ? { name: habitStats[habitStats.length - 1].name, value: habitStats[habitStats.length - 1].stats.completed } : null;

        // Chart Data (Daily breakdown)
        const chartData = [];
        let totalCompletedInMonth = 0;
        let totalPossibleInMonth = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            let dailyCount = 0;
            habits.forEach(h => {
                const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                if (completions[h.id]?.[dateKey]) dailyCount++;
            });

            const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
            const possibleToday = habits.filter(h => !h.frequency || h.frequency.includes(dayOfWeek)).length;
            const percentageToday = possibleToday > 0 ? Math.round((dailyCount / possibleToday) * 100) : 0;

            chartData.push({
                label: d,
                value: dailyCount,
                percentage: percentageToday
            });

            // For story
            totalCompletedInMonth += dailyCount;
            totalPossibleInMonth += possibleToday;
        }

        const storyDaysElapsed = monthOffset === 0 ? today.getDate() : daysInMonth;

        const story = buildMonthlyStory(
            { completed: totalCompletedInMonth, percentage: Math.round(totalCompletedInMonth / totalPossibleInMonth * 100) || 0 },
            habitStats,
            0, // delta placeholder
            storyDaysElapsed
        );

        // Calculate first day of the month for the calendar grid
        // getDay() is 0 (Sun) to 6 (Sat). 
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const firstDayOfMo = weekStart === 'SUN'
            ? firstDay
            : (firstDay === 0 ? 6 : firstDay - 1);

        return {
            story: {
                ...story,
                completed: totalCompletedInMonth,
                percentage: Math.round(totalCompletedInMonth / totalPossibleInMonth * 100) || 0
            },
            currentMonth,
            chartData,
            firstDayOfMo,
            stats: { best: bestHabit, worst: worstHabit },
            monthName,
            year: currentYear,
            totalPossible: totalPossibleInMonth
        };
    }, [habits, completions, monthOffset]);


    // Annual Data Refined for Dashboard
    const annualDashboardData = React.useMemo(() => {
        const targetYear = today.getFullYear() + yearOffset;
        const months = [
            "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
            "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
        ];

        let totalPossible = 0;
        let totalCompleted = 0;

        const monthlyStats = months.map((monthName, index) => {
            let mTotal = 0;
            let mCompleted = 0;

            habits.forEach(habit => {
                const stats = getHabitMonthStats(habit.id, completions, index, targetYear, habit.frequency, habit.createdAt);
                mTotal += stats.totalDays;
                mCompleted += stats.completed;
            });

            totalPossible += mTotal;
            totalCompleted += mCompleted;

            return {
                name: monthName,
                percentage: mTotal > 0 ? Math.round((mCompleted / mTotal) * 100) : 0,
            };
        });

        const annualPercentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

        const chartData = monthlyStats.map((m, i) => ({ label: m.name.substring(0, 3), value: m.percentage }));

        const story = buildAnnualStory({
            topHabits: habits.map(h => {
                let hTotal = 0;
                for (let m = 0; m <= 11; m++) {
                    const s = getHabitMonthStats(h.id, completions, m, targetYear, h.frequency, h.createdAt);
                    hTotal += s.completed;
                }
                return { ...h, completed: hTotal };
            }).sort((a, b) => b.completed - a.completed),
            totalCompletions: totalCompleted,
            totalPossible: totalPossible,
            consistencyRate: annualPercentage,
            activeDays: 0,
            activeHabitsCount: habits.length,
            storyVariant: 'reflection',
            momentum: 'stable',
            longestHabitStreak: 0
        }, yearOffset === 0 ? today.getMonth() + 1 : 12);

        const habitAnnualStats = habits.map(h => {
            let total = 0;
            for (let m = 0; m <= 11; m++) {
                const s = getHabitMonthStats(h.id, completions, m, targetYear, h.frequency, h.createdAt);
                total += s.completed;
            }
            return { name: h.name, value: total };
        }).sort((a, b) => b.value - a.value);

        const best = habitAnnualStats[0];
        const worst = habitAnnualStats[habitAnnualStats.length - 1];

        story.highlights = { best, neglected: worst };

        return {
            story,
            chartData,
            stats: { best, worst },
            yearLabel: targetYear,
            totalCompleted,
            totalPossible,
            percentage: annualPercentage,
            monthlyStats // Add this for retrospective grid
        };

    }, [habits, completions, yearOffset]);
    const [showDatePicker, setShowDatePicker] = React.useState(false);

    const onDateSelect = (selectedDate) => {
        // Calculate offset from today
        const todayReset = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const selectedReset = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

        // Find the Week Start of the selected date's week
        const dayCombined = weekStart === 'SUN'
            ? selectedReset.getDay()
            : (selectedReset.getDay() === 0 ? 6 : selectedReset.getDay() - 1);
        const startOfSelected = new Date(selectedReset);
        startOfSelected.setDate(selectedReset.getDate() - dayCombined);

        // Find Week Start of current week
        const todayDay = weekStart === 'SUN'
            ? todayReset.getDay()
            : (todayReset.getDay() === 0 ? 6 : todayReset.getDay() - 1);
        const startOfToday = new Date(todayReset);
        startOfToday.setDate(todayReset.getDate() - todayDay);

        // Calculate diff in weeks
        const diffTime = startOfSelected.getTime() - startOfToday.getTime();
        const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));

        setWeekOffset(diffWeeks);
        setShowDatePicker(false);
    };

    const onMonthYearSelect = (selectedMonth, selectedYear) => {
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        if (analyticsView === 'MONTH') {
            // Calculate relative month offset
            const diffYears = selectedYear - currentYear;
            const diffMonths = selectedMonth - currentMonth;
            setMonthOffset(diffYears * 12 + diffMonths);
        } else if (analyticsView === 'YEAR') {
            // Calculate relative year offset
            setYearOffset(selectedYear - currentYear);
        }
        setShowMonthYearPicker(false);
    };

    // Weekly Retrospective Data Calculation
    const weeklyRetrospectiveData = React.useMemo(() => {
        // We use the same week logic as the chart
        const currentWeekStart = new Date(today);
        const day = today.getDay();
        const diff = weekStart === 'SUN'
            ? today.getDate() - day + (weekOffset * 7)
            : today.getDate() - (day === 0 ? 6 : day - 1) + (weekOffset * 7);
        currentWeekStart.setDate(diff);

        const days = weekStart === 'SUN'
            ? ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
            : ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

        return days.map((dayName, index) => {
            // Calculate date for this day of the week
            const d = new Date(currentWeekStart);
            d.setDate(currentWeekStart.getDate() + index);

            // Check total possible habits for this specific day
            const dayOfWeek = d.getDay(); // 0-6
            const possibleHabits = habits.filter(h => !h.frequency || h.frequency.includes(dayOfWeek));
            const totalPossible = possibleHabits.length;

            // Count completed
            let completed = 0;
            possibleHabits.forEach(h => {
                const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                if (completions[h.id]?.[dateKey]) {
                    completed++;
                }
            });

            return {
                day: dayName,
                percentage: totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0,
                isToday: d.toDateString() === today.toDateString()
            };
        });
    }, [habits, completions, weekOffset]);


    // Calculate days elapsed in the current view's week
    // If weekOffset is 0 (current week), it's today's day index (1-7, Mon-Sun)
    // If weekOffset < 0 (past), it's 7 days.
    let daysElapsed = 7;
    if (weekOffset === 0) {
        // Javascript getDay(): 0 = Sun, 1 = Mon ... 6 = Sat
        // We want Mon=1 ... Sun=7
        const dayIndex = today.getDay();
        daysElapsed = dayIndex === 0 ? 7 : dayIndex;
    }

    // Pass daysElapsed to buildWeeklyStory
    const story = buildWeeklyStory(weekProgress, weeklyStats, habits, daysElapsed);

    // Date Logic
    const currentWeekStart = new Date(today);
    const day = today.getDay();
    const diff = weekStart === 'SUN'
        ? today.getDate() - day + (weekOffset * 7)
        : today.getDate() - (day === 0 ? 6 : day - 1) + (weekOffset * 7);
    currentWeekStart.setDate(diff);
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

    const monthName = currentWeekStart.toLocaleString('default', { month: 'short' });
    const startStr = currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = currentWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fullDateString = `${startStr} - ${endStr}, ${currentWeekEnd.getFullYear()}`;

    // Chart Logic
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 64; // rough padding
    const chartHeight = 100;

    // Normalize data for chart
    const maxVal = Math.max(...weeklyStats.map(d => d.count), 1); // Avoid div by 0
    // Create curved path (rough spline)
    let pathD = `M 0,${chartHeight}`; // Start bottom left
    weeklyStats.forEach((d, i) => {
        const x = (i / 6) * chartWidth;
        const y = chartHeight - (d.count / maxVal) * chartHeight;
        if (i === 0) pathD = `M ${x},${y}`;
        else {
            const prevX = ((i - 1) / 6) * chartWidth;
            const prevY = chartHeight - (weeklyStats[i - 1].count / maxVal) * chartHeight;
            const controlX = (prevX + x) / 2;
            pathD += ` C ${controlX},${prevY} ${controlX},${y} ${x},${y}`;
        }
    });

    const areaPath = `${pathD} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;

    const activeColor = theme.primary;
    const secondaryColor = theme.secondary;

    return (
        <View style={tw`flex-1 bg-gray-100`}>
            <DatePickerModal
                isVisible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onSelect={onDateSelect}
                selectedDate={currentWeekStart} // Pass start of week as current selection context
                theme={theme}
            />

            <MonthYearPickerModal
                isVisible={showMonthYearPicker}
                onClose={() => setShowMonthYearPicker(false)}
                onSelect={onMonthYearSelect}
                currentMonth={monthlyData.currentMonth}
                currentYear={analyticsView === 'YEAR' ? (today.getFullYear() + yearOffset) : monthlyData.year}
                theme={theme}
                mode={pickerMode}
            />

            <ScrollView
                style={tw`flex-1`}
                contentContainerStyle={tw`pb-32 pt-1`}
                stickyHeaderIndices={[1]}
                showsVerticalScrollIndicator={false}
            >
                {/* Non-sticky View Toggle */}
                <View style={tw`px-3 mb-4 pt-2`}>
                    <View style={tw`flex-row bg-gray-200 p-1 rounded-2xl`}>
                        {['WEEK', 'MONTH', 'YEAR'].map((viewName) => {
                            const isActive = analyticsView === viewName;
                            return (
                                <TouchableOpacity
                                    key={viewName}
                                    onPress={() => setAnalyticsView(viewName)}
                                    style={[
                                        tw`flex-1 py-2 items-center rounded-xl`,
                                        isActive ? { backgroundColor: theme.primary } : {}
                                    ]}
                                >
                                    <Text style={[
                                        tw`text-xs font-black tracking-widest`,
                                        isActive ? tw`text-white` : tw`text-gray-500`
                                    ]}>
                                        {viewName}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* STICKY PERIOD NAVIGATION - Only this row sticks */}
                <View style={[tw`pb-3 px-3 pt-1`, { backgroundColor: '#f3f4f6' }]}>
                    {analyticsView === 'WEEK' && (
                        <View>
                            <HardShadowCardLocal bgColor={theme.primary}>
                                <View style={tw`flex-row items-center justify-between px-4 py-2`}>
                                    <TouchableOpacity onPress={() => setWeekOffset(weekOffset - 1)} style={tw`p-1`}>
                                        <ChevronLeft size={20} color="white" strokeWidth={3} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                                        <Text style={tw`text-sm font-black text-white uppercase tracking-widest leading-none`}>{fullDateString}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setWeekOffset(weekOffset + 1)} style={tw`p-1`}>
                                        <ChevronRight size={20} color="white" strokeWidth={3} />
                                    </TouchableOpacity>
                                </View>
                            </HardShadowCardLocal>
                        </View>
                    )}

                    {analyticsView === 'MONTH' && (
                        <View>
                            <HardShadowCardLocal bgColor={theme.primary}>
                                <View style={tw`flex-row items-center justify-between px-4 py-2`}>
                                    <TouchableOpacity onPress={() => setMonthOffset(monthOffset - 1)} style={tw`p-1`}>
                                        <ChevronLeft size={20} color="white" strokeWidth={3} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => { setPickerMode('both'); setShowMonthYearPicker(true); }}>
                                        <Text style={tw`text-sm font-black text-white uppercase tracking-widest leading-none`}>{monthlyData.monthName} {monthlyData.year}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setMonthOffset(monthOffset + 1)} style={tw`p-1`}>
                                        <ChevronRight size={20} color="white" strokeWidth={3} />
                                    </TouchableOpacity>
                                </View>
                            </HardShadowCardLocal>
                        </View>
                    )}

                    {analyticsView === 'YEAR' && (
                        <View>
                            <HardShadowCardLocal bgColor={theme.primary}>
                                <View style={tw`flex-row items-center justify-between px-4 py-2`}>
                                    <TouchableOpacity onPress={() => setYearOffset(yearOffset - 1)} style={tw`p-1`}>
                                        <ChevronLeft size={20} color="white" strokeWidth={3} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => { setPickerMode('year'); setShowMonthYearPicker(true); }}>
                                        <Text style={tw`text-sm font-black text-white uppercase tracking-widest leading-none`}>{annualDashboardData.yearLabel}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setYearOffset(yearOffset + 1)} style={tw`p-1`}>
                                        <ChevronRight size={20} color="white" strokeWidth={3} />
                                    </TouchableOpacity>
                                </View>
                            </HardShadowCardLocal>
                        </View>
                    )}
                </View>

                {analyticsView === 'MONTH' && (
                    <View style={tw`px-3`}>
                        <AnalyticsDashboard
                            periodLabel="Month"
                            story={monthlyData.story}
                            chartData={monthlyData.chartData}
                            stats={monthlyData.stats}
                            theme={theme}
                            completionStats={{
                                completed: monthlyData.story.completed,
                                total: monthlyData.totalPossible,
                                percentage: monthlyData.story.percentage
                            }}
                            retrospectiveData={monthlyData.chartData}
                            gridPadding={monthlyData.firstDayOfMo}
                            periodLabelSecondary={`${monthlyData.monthName} ${monthlyData.year}`}
                            moodData={monthlyMoodData}
                            weekStart={weekStart}
                        />
                    </View>
                )}

                {analyticsView === 'YEAR' && (
                    <View style={tw`px-3`}>
                        <AnalyticsDashboard
                            periodLabel="Year"
                            story={annualDashboardData.story}
                            chartData={annualDashboardData.chartData}
                            stats={annualDashboardData.stats}
                            theme={theme}
                            completionStats={{
                                completed: annualDashboardData.totalCompleted,
                                total: annualDashboardData.totalPossible,
                                percentage: annualDashboardData.percentage
                            }}
                            retrospectiveData={annualDashboardData.monthlyStats}
                            periodLabelSecondary={annualDashboardData.yearLabel}
                            moodData={annualMoodData}
                            weekStart={weekStart}
                        />
                    </View>
                )}

                {analyticsView === 'WEEK' && (
                    <View style={tw`px-3`}>
                        <WeeklyCard
                            habits={habits}
                            completions={completions}
                            theme={theme}
                            toggleCompletion={toggleCompletion}
                            date={today}
                            weekOffset={weekOffset}
                            weekStart={weekStart}
                        />
                        <AnalyticsDashboard
                            periodLabel="Week"
                            story={story}
                            chartData={weeklyStats.map(d => ({ label: d.displayDay, value: d.count }))}
                            stats={{
                                best: { name: story.highlights.best?.name, value: story.highlights.best?.completed },
                                worst: { name: story.highlights.neglected?.name, value: 0 }
                            }}
                            theme={theme}
                            completionStats={{
                                completed: weekProgress.completed,
                                total: weekProgress.total,
                                percentage: weekProgress.percentage
                            }}
                            retrospectiveData={weeklyRetrospectiveData}
                            periodLabelSecondary={fullDateString}
                            moodData={weeklyMoodData}
                            weekStart={weekStart}
                        />
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

