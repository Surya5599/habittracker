import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import tw from 'twrnc';

export const MonthYearPickerModal = ({ isVisible, onClose, onSelect, currentMonth, currentYear, theme, mode = 'both' }) => {
    const [selectedYear, setSelectedYear] = useState(currentYear);
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
                <View style={tw`bg-white w-full max-w-sm rounded-3xl border-[3px] border-black overflow-hidden shadow-xl`}>
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
                                style={tw`p-2 bg-gray-100 rounded-xl border-2 border-gray-200`}
                            >
                                <ChevronLeft size={24} color="#57534e" />
                            </TouchableOpacity>
                            <Text style={tw`text-2xl font-black text-gray-800`}>{selectedYear}</Text>
                            <TouchableOpacity
                                onPress={() => setSelectedYear(selectedYear + 1)}
                                style={tw`p-2 bg-gray-100 rounded-xl border-2 border-gray-200`}
                            >
                                <ChevronRight size={24} color="#57534e" />
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
                                                    ? { backgroundColor: theme.primary, borderColor: 'black' }
                                                    : tw`bg-gray-50 border-gray-200`
                                            ]}
                                        >
                                            <Text style={[
                                                tw`text-xs font-black uppercase tracking-widest`,
                                                isSelected ? tw`text-white` : tw`text-gray-600`
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
