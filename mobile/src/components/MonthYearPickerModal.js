import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import tw from 'twrnc';

export const MonthYearPickerModal = ({ isVisible, onClose, onSelect, currentMonth, currentYear, theme, mode = 'both', colorMode = 'light' }) => {
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const isDark = colorMode === 'dark';
    const panelBg = isDark ? '#0a0a0a' : '#ffffff';
    const panelBorder = isDark ? '#ffffff' : '#000000';
    const textPrimary = isDark ? '#f5f5f5' : '#1f2937';
    const subtleBg = isDark ? '#111111' : '#f3f4f6';
    const mutedText = isDark ? '#d4d4d4' : '#4b5563';
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const handleSelectMonth = (monthIndex) => {
        onSelect(monthIndex, selectedYear);
        onClose();
    };

    const handleSelectYear = (year) => {
        if (mode === 'year') {
            onSelect(null, year);
            onClose();
        } else {
            setSelectedYear(year);
        }
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
                        <Text style={tw`text-white font-black uppercase text-lg tracking-widest`}>
                            {mode === 'year' ? 'Select Year' : 'Select Month'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={tw`bg-black/20 p-1 rounded-full`}>
                            <X size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={tw`p-6`}>
                        {/* Year Selector */}
                        <View style={tw`flex-row items-center justify-between mb-8`}>
                            <TouchableOpacity
                                onPress={() => setSelectedYear(selectedYear - 1)}
                                style={[tw`p-2 rounded-xl border-2`, { backgroundColor: subtleBg, borderColor: panelBorder }]}
                            >
                                <ChevronLeft size={24} color={textPrimary} />
                            </TouchableOpacity>
                            <Text style={[tw`text-2xl font-black`, { color: textPrimary }]}>{selectedYear}</Text>
                            <TouchableOpacity
                                onPress={() => setSelectedYear(selectedYear + 1)}
                                style={[tw`p-2 rounded-xl border-2`, { backgroundColor: subtleBg, borderColor: panelBorder }]}
                            >
                                <ChevronRight size={24} color={textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {mode === 'both' ? (
                            <View style={tw`flex-row flex-wrap justify-between gap-y-4`}>
                                {months.map((month, index) => {
                                    const isSelected = index === currentMonth && selectedYear === currentYear;
                                    return (
                                        <TouchableOpacity
                                            key={month}
                                            onPress={() => handleSelectMonth(index)}
                                            style={[
                                                tw`w-[30%] py-4 items-center justify-center rounded-2xl border-2`,
                                                isSelected
                                                    ? { backgroundColor: theme.primary, borderColor: panelBorder }
                                                    : { backgroundColor: subtleBg, borderColor: panelBorder }
                                            ]}
                                        >
                                            <Text style={[
                                                tw`text-xs font-black uppercase tracking-widest`,
                                                isSelected ? tw`text-white` : { color: mutedText }
                                            ]}>
                                                {month}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={tw`items-center`}>
                                <TouchableOpacity
                                    onPress={() => handleSelectYear(selectedYear)}
                                    style={[
                                        tw`w-full py-4 items-center justify-center rounded-2xl border-[3px] border-black shadow-sm`,
                                        { backgroundColor: theme.primary }
                                    ]}
                                >
                                    <Text style={tw`text-white font-black uppercase tracking-widest text-lg`}>Confirm {selectedYear}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};
