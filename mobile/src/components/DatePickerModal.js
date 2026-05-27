import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react-native';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL  = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS  = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const DatePickerModal = ({ isVisible, onClose, onSelect, selectedDate, theme, colorMode = 'light' }) => {
    const initial = selectedDate || new Date();
    const [viewMode, setViewMode]         = useState('days');
    const [currentMonth, setCurrentMonth] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));
    const [pickerYear, setPickerYear]     = useState(() => initial.getFullYear());
    const [gridWidth, setGridWidth]       = useState(0);

    const isDark      = colorMode === 'dark';
    const panelBg     = isDark ? '#0a0a0a' : '#ffffff';
    const panelBorder = isDark ? '#ffffff' : '#000000';
    const textPrimary = isDark ? '#f5f5f5' : '#111827';
    const textMuted   = isDark ? '#6b7280' : '#9ca3af';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDay    = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const monthLabel  = `${MONTH_FULL[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

    // Compute exact pixel size from measured container width — no flex/aspectRatio on cells
    const cellSize   = gridWidth > 0 ? Math.floor(gridWidth / 7) : 0;
    const circleSize = cellSize > 0 ? cellSize - 8 : 0;

    const selectDay = (d) => {
        onSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
        onClose();
    };

    const prevMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

    const openMonthPicker = () => { setPickerYear(currentMonth.getFullYear()); setViewMode('months'); };
    const selectMonth = (idx) => { setCurrentMonth(new Date(pickerYear, idx, 1)); setViewMode('days'); };
    const goToThisMonth = () => { setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setViewMode('days'); };

    // Build grid as explicit rows — no flexWrap so rows can never stretch vertically
    const renderDayGrid = () => {
        if (!cellSize) return null;

        const numRows = Math.ceil((firstDay + daysInMonth) / 7);
        const rows = [];

        for (let row = 0; row < numRows; row++) {
            const cells = [];
            for (let col = 0; col < 7; col++) {
                const d = row * 7 + col - firstDay + 1;
                if (d < 1 || d > daysInMonth) {
                    cells.push(<View key={col} style={{ width: cellSize, height: cellSize }} />);
                } else {
                    const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
                    cellDate.setHours(0, 0, 0, 0);
                    const isSelected = selectedDate && cellDate.toDateString() === selectedDate.toDateString();
                    const isToday    = cellDate.toDateString() === today.toDateString();

                    cells.push(
                        <TouchableOpacity
                            key={col}
                            onPress={() => selectDay(d)}
                            activeOpacity={0.7}
                            style={{ width: cellSize, height: cellSize, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <View style={{
                                width: circleSize,
                                height: circleSize,
                                borderRadius: circleSize / 2,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isSelected
                                    ? theme.primary
                                    : isToday
                                        ? theme.primary + '25'
                                        : 'transparent',
                            }}>
                                <Text style={{
                                    fontSize: 13,
                                    fontWeight: isSelected || isToday ? '900' : '500',
                                    color: isSelected ? '#ffffff' : isToday ? theme.primary : textPrimary,
                                    includeFontPadding: false,
                                    textAlignVertical: 'center',
                                }}>
                                    {d}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                }
            }
            rows.push(
                <View key={row} style={{ flexDirection: 'row' }}>
                    {cells}
                </View>
            );
        }

        return rows;
    };

    const renderMonthGrid = () =>
        MONTH_SHORT.map((name, idx) => {
            const isActive   = idx === currentMonth.getMonth() && pickerYear === currentMonth.getFullYear();
            const isSelected = selectedDate && idx === selectedDate.getMonth() && pickerYear === selectedDate.getFullYear();
            const isTodayMo  = idx === today.getMonth() && pickerYear === today.getFullYear();
            return (
                <TouchableOpacity
                    key={idx}
                    onPress={() => selectMonth(idx)}
                    activeOpacity={0.7}
                    style={{
                        width: '33.33%',
                        paddingVertical: 14,
                        alignItems: 'center',
                        borderRadius: 14,
                        backgroundColor: isSelected ? theme.primary : isActive ? theme.primary + '22' : 'transparent',
                    }}
                >
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '800',
                        color: isSelected ? '#ffffff' : isActive ? theme.primary : textPrimary,
                    }}>
                        {name}
                    </Text>
                    {isTodayMo && !isSelected && (
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.primary, marginTop: 4 }} />
                    )}
                </TouchableOpacity>
            );
        });

    return (
        <Modal animationType="fade" transparent visible={isVisible} onRequestClose={onClose}>
            <TouchableOpacity
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: '100%', maxWidth: 360 }}>
                    <View style={{
                        backgroundColor: panelBg,
                        borderWidth: 3,
                        borderColor: panelBorder,
                        borderRadius: 28,
                        overflow: 'hidden',
                    }}>
                        {/* Header */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            backgroundColor: theme.primary,
                            borderBottomWidth: 3,
                            borderBottomColor: panelBorder,
                        }}>
                            <TouchableOpacity
                                onPress={viewMode === 'days' ? prevMonth : () => setPickerYear(y => y - 1)}
                                style={{ padding: 6, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.15)' }}
                            >
                                <ChevronLeft size={20} color="white" strokeWidth={2.5} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={viewMode === 'days' ? openMonthPicker : () => setViewMode('days')}
                                activeOpacity={0.75}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2, paddingHorizontal: 8 }}
                            >
                                <Text style={{ color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: -0.3, textTransform: 'uppercase' }}>
                                    {viewMode === 'days' ? monthLabel : pickerYear}
                                </Text>
                                {viewMode === 'days'
                                    ? <ChevronDown size={15} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />
                                    : <ChevronUp   size={15} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />
                                }
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={viewMode === 'days' ? nextMonth : () => setPickerYear(y => y + 1)}
                                style={{ padding: 6, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.15)' }}
                            >
                                <ChevronRight size={20} color="white" strokeWidth={2.5} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ padding: 14 }}>
                            {viewMode === 'days' ? (
                                <>
                                    {/* Weekday labels row — onLayout here measures the exact grid width */}
                                    <View
                                        style={{ flexDirection: 'row' }}
                                        onLayout={e => setGridWidth(e.nativeEvent.layout.width)}
                                    >
                                        {DAY_LABELS.map((l, i) => (
                                            <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
                                                <Text style={{ fontSize: 11, fontWeight: '900', color: textMuted, letterSpacing: 0.5 }}>{l}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Day grid — explicit rows, no flexWrap */}
                                    <View>{renderDayGrid()}</View>

                                    <TouchableOpacity
                                        onPress={() => { onSelect(new Date()); onClose(); }}
                                        style={{
                                            marginTop: 12,
                                            paddingVertical: 12,
                                            borderRadius: 14,
                                            alignItems: 'center',
                                            backgroundColor: theme.primary + '18',
                                            borderWidth: 2,
                                            borderColor: theme.primary,
                                        }}
                                    >
                                        <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>
                                            Today
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 6 }}>
                                        {renderMonthGrid()}
                                    </View>

                                    <TouchableOpacity
                                        onPress={goToThisMonth}
                                        style={{
                                            marginTop: 8,
                                            paddingVertical: 12,
                                            borderRadius: 14,
                                            alignItems: 'center',
                                            backgroundColor: theme.primary + '18',
                                            borderWidth: 2,
                                            borderColor: theme.primary,
                                        }}
                                    >
                                        <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>
                                            This Month
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};
