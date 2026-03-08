import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import tw from 'twrnc';
import { DAYS_OF_WEEK } from '../constants';

export const DatePickerModal = ({ isVisible, onClose, onSelect, selectedDate, theme, colorMode = 'light' }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));
    const isDark = colorMode === 'dark';
    const panelBg = isDark ? '#0a0a0a' : '#ffffff';
    const panelBorder = isDark ? '#ffffff' : '#000000';
    const textPrimary = isDark ? '#f5f5f5' : '#1f2937';
    const textMuted = isDark ? '#a3a3a3' : '#9ca3af';
    const subtleBg = isDark ? '#111111' : '#f3f4f6';

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleToday = () => {
        const today = new Date();
        onSelect(today);
        onClose();
    };

    const handleSelectDay = (day) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        onSelect(newDate);
        onClose();
    };

    const { days, firstDay } = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Adjust firstDay for Monday start if desired, but Calendar standard often Sunday. 
    // Let's stick to simple Sunday=0 for grid.

    const renderCalendarGrid = () => {
        const daysArray = [];
        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            daysArray.push(<View key={`empty-${i}`} style={tw`w-[14.28%] aspect-square`} />);
        }
        // Days
        for (let i = 1; i <= days; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();

            daysArray.push(
                <TouchableOpacity
                    key={i}
                    onPress={() => handleSelectDay(i)}
                    style={[
                        tw`w-[14.28%] aspect-square items-center justify-center m-0.5 rounded-lg`,
                        isSelected ? { backgroundColor: theme.primary } : (isToday ? { backgroundColor: subtleBg, borderWidth: 2, borderColor: isDark ? '#ffffff' : '#d1d5db' } : tw`bg-transparent`)
                    ]}
                >
                    <Text style={[
                        tw`text-sm font-bold`,
                        isSelected ? tw`text-white` : { color: textPrimary }
                    ]}>
                        {i}
                    </Text>
                </TouchableOpacity>
            );
        }
        return daysArray;
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={tw`flex-1 justify-center items-center bg-black/50 p-4`}>
                <View style={[tw`w-full max-w-sm rounded-3xl border-[3px] overflow-hidden shadow-xl`, { backgroundColor: panelBg, borderColor: panelBorder }]}>
                    {/* Header */}
                    <View style={[tw`p-4 flex-row items-center justify-between border-b-[3px] border-black`, { backgroundColor: theme.primary }]}>
                        <Text style={tw`text-white font-black uppercase text-lg tracking-widest`}>Select Date</Text>
                        <TouchableOpacity onPress={onClose} style={tw`bg-black/20 p-1 rounded-full`}>
                            <X size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={tw`p-4`}>
                        {/* Month Nav */}
                        <View style={tw`flex-row items-center justify-between mb-4`}>
                            <TouchableOpacity onPress={handlePrevMonth} style={[tw`p-2 rounded-lg border-2`, { backgroundColor: subtleBg, borderColor: isDark ? '#ffffff' : '#d1d5db' }]}>
                                <ChevronLeft size={20} color={isDark ? '#e5e7eb' : '#57534e'} />
                            </TouchableOpacity>
                            <Text style={[tw`text-lg font-black uppercase`, { color: textPrimary }]}>{monthName}</Text>
                            <TouchableOpacity onPress={handleNextMonth} style={[tw`p-2 rounded-lg border-2`, { backgroundColor: subtleBg, borderColor: isDark ? '#ffffff' : '#d1d5db' }]}>
                                <ChevronRight size={20} color={isDark ? '#e5e7eb' : '#57534e'} />
                            </TouchableOpacity>
                        </View>

                        {/* Weekday Headers */}
                        <View style={[tw`flex-row mb-2 border-b pb-2`, { borderColor: isDark ? '#ffffff' : '#e5e7eb' }]}>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <View key={i} style={tw`w-[14.28%] items-center`}>
                                    <Text style={[tw`text-xs font-black`, { color: textMuted }]}>{day}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Grid */}
                        <View style={tw`flex-row flex-wrap`}>
                            {renderCalendarGrid()}
                        </View>

                        {/* Today Button */}
                        <TouchableOpacity
                            onPress={handleToday}
                            style={[tw`mt-4 w-full py-3 rounded-xl border-[2px] border-black flex-row items-center justify-center gap-2`, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                        >
                            <Text style={[tw`font-black uppercase text-sm tracking-widest`, { color: theme.primary }]}>Jump to Today</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
