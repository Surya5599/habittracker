import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { DailyCard } from '../components/DailyCard';
import { WeeklyCard } from '../components/WeeklyCard';

import { THEMES } from '../constants';
import Svg, { Circle } from 'react-native-svg';

export const WeeklyScreen = ({
    habits,
    completions,
    weekOffset,
    setWeekOffset,
    theme,
    toggleCompletion,
    weekProgress,
    notes,
    updateNote,
    initialDate,
    weekStart = 'MON'
}) => {
    const [mobileDayIndex, setMobileDayIndex] = useState(0);

    const getWeekStartIndex = (date, start) => {
        const d = date.getDay();
        if (start === 'SUN') return d;
        return d === 0 ? 6 : d - 1;
    };

    // Initial setup to match current day or passed date
    useEffect(() => {
        const targetDate = initialDate || new Date();
        const adjustedIndex = getWeekStartIndex(targetDate, weekStart);
        setMobileDayIndex(Math.max(0, Math.min(6, adjustedIndex)));
    }, [initialDate, weekStart]);

    const getWeekDates = () => {
        const today = new Date();
        const day = today.getDay();
        const diff = weekStart === 'SUN'
            ? today.getDate() - day + (weekOffset * 7)
            : today.getDate() - (day === 0 ? 6 : day - 1) + (weekOffset * 7);
        const weekStartDate = new Date(today.getFullYear(), today.getMonth(), diff);

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(weekStartDate);
            date.setDate(weekStartDate.getDate() + i);
            return date;
        });
    };

    const weekDates = getWeekDates();
    const currentDate = weekDates[mobileDayIndex];

    // Format date key (YYYY-MM-DD) for notes lookup
    // Assuming simple local date string for key
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const dayData = notes?.[dateKey] || {};

    const handlePrevDay = () => {
        if (mobileDayIndex > 0) {
            setMobileDayIndex(mobileDayIndex - 1);
        } else {
            setWeekOffset(weekOffset - 1);
            setMobileDayIndex(6);
        }
    };

    const handleNextDay = () => {
        if (mobileDayIndex < 6) {
            setMobileDayIndex(mobileDayIndex + 1);
        } else {
            setWeekOffset(weekOffset + 1);
            setMobileDayIndex(0);
        }
    };

    const handleDateSelect = (selectedDate) => {
        const today = new Date();
        // Calculate week offset based on Week Start of the current week vs Week Start of selected date
        // Base Week Start (Week 0)
        const currentDay = today.getDay();
        const currentDiff = weekStart === 'SUN'
            ? today.getDate() - currentDay
            : today.getDate() - (currentDay === 0 ? 6 : currentDay - 1);
        const baseWeekStart = new Date(today.getFullYear(), today.getMonth(), currentDiff);
        baseWeekStart.setHours(0, 0, 0, 0);

        // Targeted Week Start
        const targetDay = selectedDate.getDay();
        const targetDiff = weekStart === 'SUN'
            ? selectedDate.getDate() - targetDay
            : selectedDate.getDate() - (targetDay === 0 ? 6 : targetDay - 1);
        const targetWeekStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), targetDiff);
        targetWeekStart.setHours(0, 0, 0, 0);

        const diffTime = targetWeekStart - baseWeekStart;
        const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));

        setWeekOffset(diffWeeks);

        // Mobile Day Index
        const dayIndex = getWeekStartIndex(selectedDate, weekStart);
        setMobileDayIndex(dayIndex);
    };

    // Stats for Header
    const circleSize = 60;
    const strokeWidth = 5;
    const radius = (circleSize - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progressOffset = circumference - (weekProgress.percentage / 100) * circumference;

    return (
        <View style={tw`flex-1 bg-gray-100`}>
            {/* Daily Card and Weekly Card container */}
            <View style={tw`px-4 flex-1 pt-2`}>
                <DailyCard
                    date={currentDate}
                    habits={habits}
                    completions={completions}
                    theme={theme}
                    toggleCompletion={toggleCompletion}
                    onPrev={handlePrevDay}
                    onNext={handleNextDay}
                    onDateSelect={handleDateSelect}
                    dayData={dayData}
                    dateKey={dateKey}
                    updateNote={updateNote}
                />
                {/* 
                  Note: If WeeklyCard is also present, it will follow the DailyCard. 
                  Since DailyCard height is screen-relative, WeeklyCard might be off-screen.
                  However, the user wants the card fixed, so we follow that lead.
                */}
                <WeeklyCard
                    habits={habits}
                    completions={completions}
                    theme={theme}
                    toggleCompletion={toggleCompletion}
                    date={currentDate}
                    weekOffset={weekOffset}
                    weekStart={weekStart}
                />
            </View>
        </View>
    );
};
