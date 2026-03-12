import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, Dimensions, Animated, Easing, PanResponder, FlatList, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, ClipPath, Rect, G, Text as SvgText } from 'react-native-svg';
import { MOODS } from '../constants';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

// Local component for animated fill bar in retrospective
const AnimatedRetrospectiveBar = ({ percentage, color }) => {
    const animatedHeight = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        animatedHeight.setValue(0);
        Animated.timing(animatedHeight, {
            toValue: percentage,
            duration: 1000,
            easing: Easing.out(Easing.back(1)),
            useNativeDriver: false,
        }).start();
    }, [percentage]);

    return (
        <Animated.View style={[
            tw`absolute bottom-0 w-full`,
            {
                height: animatedHeight.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                }),
                backgroundColor: color,
                zIndex: -1
            }
        ]} />
    );
};

export const HardShadowCardLocal = ({ children, style, bgColor, colorMode = 'light' }) => (
    (() => {
        const isDark = colorMode === 'dark';
        const resolvedBg = bgColor || (isDark ? '#0b0b0b' : 'white');
        const resolvedBorder = isDark ? '#ffffff' : '#000000';
        return (
    <View style={style}>
        <View style={[
            tw`absolute bg-black rounded-3xl`,
            { top: 6, left: 6, right: -6, bottom: -6, zIndex: -1 }
        ]} />
        <View style={[
            tw`border-[3px] border-black rounded-3xl overflow-hidden flex-1`,
            { backgroundColor: resolvedBg, borderColor: resolvedBorder }
        ]}>
            {children}
        </View>
    </View>
        );
    })()
);

// A simple component to render text with [[highlights]]
const FormattedText = ({ text, highlightColor, colorMode = 'light' }) => {
    const isDark = colorMode === 'dark';
    const parts = text.split(/(\[\[.*?\]\])/g);
    return (
        <Text style={[tw`font-medium leading-relaxed text-sm`, { color: isDark ? '#cfcfcf' : '#4b5563' }]}>
            {parts.map((part, i) => {
                if (part.startsWith('[[') && part.endsWith(']]')) {
                    const content = part.slice(2, -2);
                    return (
                        <Text key={i} style={[tw`font-black uppercase`, { color: highlightColor || '#000' }]}>
                            {content}
                        </Text>
                    );
                }
                return part;
            })}
        </Text>
    );
};

export const AnalyticsDashboard = ({
    periodLabel,
    periodType,
    story,
    chartData,
    stats,
    theme,
    headerComponent, // For the toggle and date nav
    completionStats, // { completed, total, percentageLabel }
    retrospectiveData, // For the grid
    gridPadding = 0, // Padding for start of month
    periodLabelSecondary = "", // e.g. "January 2026"
    moodData, // Mood aggregation
    weekComparison, // { current, previous, currentPercentage, previousPercentage }
    monthComparison, // { current, previous, currentPercentage, previousPercentage, previousLabel }
    weekStart = 'MON', // Start of week preference
    colorMode = 'light',
    onRetrospectiveDayPress
}) => {
    const { t } = useTranslation();
    const normalizedPeriod = periodType || ({
        Week: 'WEEK',
        Month: 'MONTH',
        Year: 'YEAR'
    }[periodLabel]) || 'WEEK';
    const masteryLabel = normalizedPeriod === 'MONTH'
        ? t('header.monthMastery', { defaultValue: 'Month Mastery' })
        : t('analytics.mastery', { period: periodLabel, defaultValue: `${periodLabel} Mastery` });
    const isDark = colorMode === 'dark';
    const textPrimary = isDark ? '#f5f5f5' : '#1f2937';
    const textMuted = isDark ? '#a3a3a3' : '#9ca3af';
    const textFaint = isDark ? '#737373' : '#d1d5db';
    const surfaceSoft = isDark ? '#111111' : '#f9fafb';
    const borderSoft = isDark ? '#ffffff' : '#e5e7eb';
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 64;
    const chartHeight = 100;
    const comparisonChartHeight = 86;

    const [activePoint, setActivePoint] = useState(null);

    // Animation values
    const circleAnim = useRef(new Animated.Value(0)).current;
    const chartPathAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Reset and trigger animations when period or data changes
        circleAnim.setValue(0);
        chartPathAnim.setValue(0);
        setActivePoint(null); // Reset tooltip

        Animated.parallel([
            Animated.timing(circleAnim, {
                toValue: completionStats.percentage || 0,
                duration: 1200,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }),
            Animated.timing(chartPathAnim, {
                toValue: chartWidth,
                duration: 1500,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: false,
            })
        ]).start();
    }, [normalizedPeriod, completionStats.percentage, chartData]);

    // PanResponder for Tooltip
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const touchX = evt.nativeEvent.locationX;
                const index = Math.round((touchX / chartWidth) * (chartData.length - 1));
                const safeIndex = Math.max(0, Math.min(chartData.length - 1, index));
                setActivePoint(chartData[safeIndex]);
            },
            onPanResponderMove: (evt) => {
                const touchX = evt.nativeEvent.locationX;
                const index = Math.round((touchX / chartWidth) * (chartData.length - 1));
                const safeIndex = Math.max(0, Math.min(chartData.length - 1, index));
                setActivePoint(chartData[safeIndex]);
            },
            onPanResponderRelease: () => {
                // Keep tooltip visible for 2 seconds after release
                setTimeout(() => setActivePoint(null), 2000);
            },
            onPanResponderTerminate: () => setActivePoint(null),
        })
    ).current;

    // Retrospective Grid Rendering Logic
    const renderRetrospectiveGrid = () => {
        if (!retrospectiveData) return null;

        if (normalizedPeriod === 'WEEK') {
            return (
                <View>
                    <View style={tw`flex-row justify-between gap-1`}>
                        {retrospectiveData.map((d, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => d?.date && onRetrospectiveDayPress && onRetrospectiveDayPress(d.date)}
                                activeOpacity={d?.date ? 0.8 : 1}
                                style={tw`flex-1 items-center`}
                            >
                                <View style={[
                                    tw`w-full aspect-square rounded-lg border-2 border-black items-center justify-center overflow-hidden`
                                ]}>
                                    {d.percentage > 0 && (
                                        <AnimatedRetrospectiveBar percentage={d.percentage} color={theme.secondary} />
                                    )}
                                    <Text style={[tw`text-[10px] font-black leading-none`, { color: textPrimary }]}>{d.percentage}%</Text>
                                    {d.percentage >= 100 && (
                                        <View style={[tw`absolute inset-0`, { backgroundColor: theme.primary, zIndex: -2 }]} />
                                    )}
                                </View>
                                <Text style={[tw`text-[10px] font-black mt-1`, { color: textPrimary }]}>{d.day}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {periodLabelSecondary ? (
                        <View style={tw`mt-4 items-center`}>
                            <Text style={[tw`text-[10px] font-black uppercase tracking-widest leading-none`, { color: textFaint }]}>{periodLabelSecondary}</Text>
                        </View>
                    ) : null}
                </View>
            );
        }

        if (normalizedPeriod === 'MONTH') {
            const daysOfWeek = weekStart === 'SUN'
                ? [
                    t('common.daysShort.sun'),
                    t('common.daysShort.mon'),
                    t('common.daysShort.tue'),
                    t('common.daysShort.wed'),
                    t('common.daysShort.thu'),
                    t('common.daysShort.fri'),
                    t('common.daysShort.sat')
                ]
                : [
                    t('common.daysShort.mon'),
                    t('common.daysShort.tue'),
                    t('common.daysShort.wed'),
                    t('common.daysShort.thu'),
                    t('common.daysShort.fri'),
                    t('common.daysShort.sat'),
                    t('common.daysShort.sun')
                ];
            const emptySlotsStart = Array.from({ length: gridPadding || 0 });
            const totalItemsSoFar = emptySlotsStart.length + retrospectiveData.length;
            const emptySlotsEnd = Array.from({ length: (7 - (totalItemsSoFar % 7)) % 7 });

            return (
                <View>
                    {/* Days Header */}
                    <View style={tw`flex-row justify-between mb-2 px-1`}>
                        {daysOfWeek.map((day, i) => (
                            <View key={i} style={tw`w-[13.2%] items-center`}>
                                <Text style={[tw`text-[10px] font-black`, { color: textPrimary }]}>{day}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={tw`flex-row flex-wrap justify-between px-1`}>
                        {/* Empty Slots for Day Alignment at Start */}
                        {emptySlotsStart.map((_, i) => (
                            <View key={`empty-start-${i}`} style={tw`w-[13.2%] aspect-square mb-1`} />
                        ))}

                        {/* Actual Days */}
                        {retrospectiveData.map((d, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => d?.date && onRetrospectiveDayPress && onRetrospectiveDayPress(d.date)}
                                activeOpacity={d?.date ? 0.8 : 1}
                                style={[
                                tw`w-[13.2%] h-[15.2%] aspect-square rounded-md border-2 border-black items-center justify-center overflow-hidden mb-1`,
                                { backgroundColor: surfaceSoft, borderColor: isDark ? '#ffffff' : '#000000' }
                            ]}
                            >
                                {d.percentage > 0 && (
                                    <AnimatedRetrospectiveBar percentage={d.percentage} color={theme.secondary} />
                                )}

                                <View style={tw`absolute top-1 left-0 right-0 items-center z-10`}>
                                    <Text
                                        style={[
                                            tw`text-[8px] font-black leading-none`,
                                            { color: d.percentage >= 100 ? '#ffffff' : (isDark ? '#d4d4d8' : '#111827') }
                                        ]}
                                    >
                                        {d.label}
                                    </Text>
                                </View>

                                <View style={tw`items-center`}>
                                    <Text style={[tw`text-[10px] font-black leading-none`, { color: d.percentage >= 100 ? '#ffffff' : textPrimary }]}>{d.percentage}%</Text>
                                </View>

                                {d.percentage >= 100 && (
                                    <View style={[tw`absolute inset-0`, { backgroundColor: theme.primary, zIndex: -2 }]} />
                                )}
                            </TouchableOpacity>
                        ))}

                        {/* Filler Slots at End for consistent justify-between alignment */}
                        {emptySlotsEnd.map((_, i) => (
                            <View key={`empty-end-${i}`} style={tw`w-[13.2%] aspect-[0.5] mb-1`} />
                        ))}
                    </View>
                    {periodLabelSecondary ? (
                        <View style={tw`mt-4 items-center`}>
                            <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: textMuted }]}>{periodLabelSecondary}</Text>
                        </View>
                    ) : null}
                </View>
            );
        }

        if (normalizedPeriod === 'YEAR') {
            return (
                <View>
                    <View style={tw`flex-row flex-wrap justify-between gap-y-4`}>
                        {retrospectiveData.map((m, i) => (
                            <View key={i} style={tw`w-[23%] items-center`}>
                                <View style={[
                                    tw`w-full aspect-square border-2 border-black rounded-xl items-center justify-center overflow-hidden`,
                                    { backgroundColor: surfaceSoft, borderColor: isDark ? '#ffffff' : '#000000' }
                                ]}>
                                    <Text style={[tw`text-xs font-black leading-none`, { color: textPrimary }]}>{m.percentage}%</Text>
                                    {m.percentage > 0 && (
                                        <AnimatedRetrospectiveBar percentage={m.percentage} color={theme.secondary} />
                                    )}
                                    {m.percentage > 0 && (
                                        <View style={[
                                            tw`absolute bottom-0 w-full h-1`,
                                            { backgroundColor: theme.primary }
                                        ]} />
                                    )}
                                </View>
                                <Text style={[tw`text-[10px] font-black mt-2 uppercase leading-none`, { color: textPrimary }]}>{m.name.substring(0, 3)}</Text>
                            </View>
                        ))}
                    </View>
                    {periodLabelSecondary ? (
                        <View style={tw`mt-6 items-center`}>
                            <Text style={[tw`text-[10px] font-black uppercase tracking-widest leading-none`, { color: textFaint }]}>{periodLabelSecondary}</Text>
                        </View>
                    ) : null}
                </View>
            );
        }
    };

    const renderMoodAnalysis = () => {
        if (!moodData) return null;

        if (normalizedPeriod === 'WEEK') {
            return (
                <View style={tw`flex-row justify-between`}>
                    {moodData.map((d, i) => {
                        const moodObj = MOODS.find(m => m.value === d.mood);
                        const Icon = moodObj?.icon;
                        return (
                            <View key={i} style={tw`items-center`}>
                                <View style={[
                                    tw`w-10 h-10 rounded-xl border-2 border-black items-center justify-center mb-1.5`,
                                    moodObj ? { backgroundColor: moodObj.color + '20', borderColor: moodObj.color } : { backgroundColor: surfaceSoft, borderColor: borderSoft }
                                ]}>
                                    {Icon ? (
                                        <Icon size={22} color={moodObj.color} strokeWidth={3} />
                                    ) : (
                                        <View style={[tw`w-1.5 h-1.5 rounded-full`, { backgroundColor: isDark ? '#737373' : '#e5e7eb' }]} />
                                    )}
                                </View>
                                <Text style={[tw`text-[10px] font-black`, { color: textMuted }]}>{d.label.substring(0, 1)}</Text>
                            </View>
                        );
                    })}
                </View>
            );
        }

        if (normalizedPeriod === 'MONTH') {
            const daysOfWeek = weekStart === 'SUN'
                ? [
                    t('common.daysShort.sun'),
                    t('common.daysShort.mon'),
                    t('common.daysShort.tue'),
                    t('common.daysShort.wed'),
                    t('common.daysShort.thu'),
                    t('common.daysShort.fri'),
                    t('common.daysShort.sat')
                ]
                : [
                    t('common.daysShort.mon'),
                    t('common.daysShort.tue'),
                    t('common.daysShort.wed'),
                    t('common.daysShort.thu'),
                    t('common.daysShort.fri'),
                    t('common.daysShort.sat'),
                    t('common.daysShort.sun')
                ];
            const emptySlotsStart = Array.from({ length: gridPadding || 0 });
            const totalItemsSoFar = emptySlotsStart.length + moodData.length;
            const emptySlotsEnd = Array.from({ length: (7 - (totalItemsSoFar % 7)) % 7 });

            return (
                <View>
                    {/* Days Header */}
                    <View style={tw`flex-row justify-between mb-2 px-1`}>
                        {daysOfWeek.map((day, i) => (
                            <View key={i} style={tw`w-[13.2%] items-center`}>
                                <Text style={[tw`text-[10px] font-black`, { color: textPrimary }]}>{day}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={tw`flex-row flex-wrap justify-between px-1`}>
                        {/* Empty Slots for Day Alignment at Start */}
                        {emptySlotsStart.map((_, i) => (
                            <View key={`empty-start-${i}`} style={tw`w-[13.2%] aspect-square mb-1`} />
                        ))}

                        {/* Actual Mood Days */}
                        {moodData.map((d, i) => {
                            const moodObj = MOODS.find(m => m.value === d.mood);
                            return (
                                <View
                                    key={i}
                                    style={[
                                        tw`w-[13.2%] h-[15.2%] aspect-square rounded-md border-2 border-black items-center justify-center overflow-hidden mb-1`,
                                        moodObj ? { backgroundColor: moodObj.color } : { backgroundColor: surfaceSoft }
                                    ]}
                                >
                                    <View style={tw`absolute top-1 left-1`}>
                                        <Text style={[tw`text-[7px] font-black`, moodObj ? tw`text-white/50` : { color: textMuted, opacity: 0.4 }]}>{d.label}</Text>
                                    </View>
                                    {moodObj && moodObj.icon && (
                                        <moodObj.icon size={14} color="white" strokeWidth={3} />
                                    )}
                                </View>
                            );
                        })}

                        {/* Filler Slots at End */}
                        {emptySlotsEnd.map((_, i) => (
                            <View key={`empty-end-${i}`} style={tw`w-[13.2%] aspect-[0.5] mb-1`} />
                        ))}
                    </View>
                </View>
            );
        }

        if (normalizedPeriod === 'YEAR') {
            return (
                <View style={tw`flex-row flex-wrap justify-between gap-y-4`}>
                    {moodData.map((m, i) => {
                        const moodObj = MOODS.find(mood => mood.value === m.mood);
                        const Icon = moodObj?.icon;
                        return (
                            <View key={i} style={tw`w-[23%] items-center`}>
                                <View style={[
                                    tw`w-full aspect-square border-2 border-black rounded-xl items-center justify-center`,
                                    moodObj ? { backgroundColor: moodObj.color + '20', borderColor: moodObj.color } : { backgroundColor: surfaceSoft, borderColor: borderSoft }
                                ]}>
                                    {Icon ? (
                                        <Icon size={24} color={moodObj.color} strokeWidth={3} />
                                    ) : (
                                        <Text style={[tw`font-extrabold`, { color: textFaint }]}>-</Text>
                                    )}
                                </View>
                                <Text style={[tw`text-[10px] font-black mt-2 uppercase leading-none`, { color: textPrimary }]}>{m.label}</Text>
                            </View>
                        );
                    })}
                </View>
            );
        }
    };

    // Chart Logic
    const maxVal = Math.max(...chartData.map(d => d.value), 1);
    const dataPoints = chartData.length;

    const wowCurrent = weekComparison?.current || [];
    const wowPrevious = weekComparison?.previous || [];
    const wowCurrentPct = Number(weekComparison?.currentPercentage || 0);
    const wowPreviousPct = Number(weekComparison?.previousPercentage || 0);
    const wowDelta = Math.round(wowCurrentPct - wowPreviousPct);
    const wowMax = Math.max(
        ...wowCurrent.map((d) => d.value || 0),
        ...wowPrevious.map((d) => d.value || 0),
        1
    );

    const buildPath = (series, width, height, maxValue) => {
        if (!Array.isArray(series) || series.length === 0) return '';
        if (series.length === 1) {
            const y = height - ((series[0]?.value || 0) / Math.max(maxValue, 1)) * height;
            return `M 0,${y} L ${width},${y}`;
        }
        let path = '';
        series.forEach((d, i) => {
            const x = (i / (series.length - 1)) * width;
            const y = height - ((d?.value || 0) / Math.max(maxValue, 1)) * height;
            if (i === 0) {
                path = `M ${x},${y}`;
            } else {
                const prevX = ((i - 1) / (series.length - 1)) * width;
                const prevY = height - (((series[i - 1]?.value || 0) / Math.max(maxValue, 1)) * height);
                const controlX = (prevX + x) / 2;
                path += ` C ${controlX},${prevY} ${controlX},${y} ${x},${y}`;
            }
        });
        return path;
    };

    const wowCurrentPath = buildPath(wowCurrent, chartWidth, comparisonChartHeight, wowMax);
    const wowPreviousPath = buildPath(wowPrevious, chartWidth, comparisonChartHeight, wowMax);

    const momCurrent = monthComparison?.current || [];
    const momPrevious = monthComparison?.previous || [];
    const momCurrentPct = Number(monthComparison?.currentPercentage || 0);
    const momPreviousPct = Number(monthComparison?.previousPercentage || 0);
    const momDelta = Math.round(momCurrentPct - momPreviousPct);
    const momMax = Math.max(
        ...momCurrent.map((d) => d.value || 0),
        ...momPrevious.map((d) => d.value || 0),
        1
    );
    const momCurrentPath = buildPath(momCurrent, chartWidth, comparisonChartHeight, momMax);
    const momPreviousPath = buildPath(momPrevious, chartWidth, comparisonChartHeight, momMax);

    let pathD = `M 0,${chartHeight}`;
    chartData.forEach((d, i) => {
        const x = (i / (dataPoints - 1)) * chartWidth;
        const y = chartHeight - (d.value / maxVal) * chartHeight;
        if (i === 0) pathD = `M ${x},${y}`;
        else {
            // Cubic bezier for smoothness
            const prevX = ((i - 1) / (dataPoints - 1)) * chartWidth;
            const prevY = chartHeight - (chartData[i - 1].value / maxVal) * chartHeight;
            const controlX = (prevX + x) / 2;
            pathD += ` C ${controlX},${prevY} ${controlX},${y} ${x},${y}`;
        }
    });
    const areaPath = `${pathD} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;

    const radius = 30;
    const circumference = radius * 2 * Math.PI;
    const comparisonDelta = normalizedPeriod === 'WEEK'
        ? wowDelta
        : normalizedPeriod === 'MONTH'
            ? momDelta
            : null;

    return (
        <View style={tw`flex-1`}>

            {/* KPI Summary */}
            <View style={tw`mb-6`}>
                <HardShadowCardLocal colorMode={colorMode}>
                    <View style={tw`p-4`}>
                        <Text style={[tw`text-[10px] font-black uppercase tracking-widest mb-3 leading-none`, { color: textMuted }]}>
                            At a glance
                        </Text>
                        <View style={tw`flex-row flex-wrap`}>
                            <View style={tw`w-1/2 pr-3 mb-3`}>
                                <Text style={[tw`text-[9px] font-black uppercase tracking-wider`, { color: textMuted }]}>Completion</Text>
                                <Text style={[tw`text-2xl font-black mt-1`, { color: theme.primary }]}>{Math.round(completionStats.percentage)}%</Text>
                            </View>
                            <View style={tw`w-1/2 pl-3 mb-3`}>
                                <Text style={[tw`text-[9px] font-black uppercase tracking-wider`, { color: textMuted }]}>Done / Total</Text>
                                <Text style={[tw`text-2xl font-black mt-1`, { color: textPrimary }]}>{completionStats.completed}/{completionStats.total}</Text>
                            </View>
                            <View style={tw`w-1/2 pr-3`}>
                                <Text style={[tw`text-[9px] font-black uppercase tracking-wider`, { color: textMuted }]}>Vs Previous</Text>
                                <Text style={[tw`text-lg font-black mt-1`, { color: comparisonDelta === null ? textFaint : (comparisonDelta >= 0 ? theme.primary : '#ef4444') }]}>
                                    {comparisonDelta === null ? '--' : `${comparisonDelta >= 0 ? '+' : ''}${comparisonDelta}%`}
                                </Text>
                            </View>
                            <View style={tw`w-1/2 pl-3`}>
                                <Text style={[tw`text-[9px] font-black uppercase tracking-wider`, { color: textMuted }]}>Top Habit</Text>
                                <Text style={[tw`text-sm font-black mt-1`, { color: textPrimary }]} numberOfLines={1}>
                                    {stats.best?.name || t('analytics.noData')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </HardShadowCardLocal>
            </View>

            {/* Primary Trend */}
            <View style={tw`mb-6`}>
                <HardShadowCardLocal colorMode={colorMode}>
                    <View style={tw`p-5`}>
                        <View style={tw`flex-row justify-between items-center mb-6`}>
                            <Text style={[tw`text-xs font-black uppercase tracking-widest leading-none`, { color: textMuted }]}>{t('analytics.activityMomentum')}</Text>
                            {activePoint && (
                                <Text style={[tw`text-[10px] font-black uppercase tracking-widest leading-none`, { color: theme.primary }]}>
                                    {activePoint.label}: {activePoint.value} {t('analytics.done')}
                                </Text>
                            )}
                        </View>

                        <View {...panResponder.panHandlers}>
                            <Svg width={chartWidth} height={chartHeight} style={tw`mb-4`}>
                                <Defs>
                                    <ClipPath id="chartClip">
                                        <AnimatedRect x="0" y="0" width={chartPathAnim} height={chartHeight} />
                                    </ClipPath>
                                    <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                        <Stop offset="0" stopColor={theme.primary} stopOpacity="0.3" />
                                        <Stop offset="1" stopColor={theme.primary} stopOpacity="0" />
                                    </LinearGradient>
                                </Defs>

                                <G clipPath="url(#chartClip)">
                                    <Path
                                        d={areaPath}
                                        fill="url(#grad)"
                                    />
                                    <Path
                                        d={pathD}
                                        fill="none"
                                        stroke={theme.primary}
                                        strokeWidth={3}
                                        strokeLinecap="round"
                                    />
                                </G>

                                {activePoint && (
                                    <G>
                                        <Rect
                                            x={(chartData.indexOf(activePoint) / (chartData.length - 1)) * chartWidth - 0.5}
                                            y={0}
                                            width={1}
                                            height={chartHeight}
                                            fill={theme.primary}
                                            opacity={0.3}
                                        />
                                        <Circle
                                            cx={(chartData.indexOf(activePoint) / (chartData.length - 1)) * chartWidth}
                                            cy={chartHeight - (activePoint.value / maxVal) * chartHeight}
                                            r={5}
                                            fill={theme.primary}
                                            stroke="white"
                                            strokeWidth={2}
                                        />
                                        {/* Value Bubble */}
                                        <G
                                            transform={`translate(${Math.max(20, Math.min(chartWidth - 20, (chartData.indexOf(activePoint) / (chartData.length - 1)) * chartWidth))}, ${Math.max(15, chartHeight - (activePoint.value / maxVal) * chartHeight - 15)})`}
                                        >
                                            <Rect
                                                x="-15"
                                                y="-12"
                                                width="30"
                                                height="18"
                                                rx="4"
                                                fill="black"
                                            />
                                            <SvgText
                                                x="0"
                                                y="1"
                                                fill="white"
                                                fontSize="10"
                                                fontWeight="900"
                                                textAnchor="middle"
                                                alignmentBaseline="middle"
                                            >
                                                {activePoint.value}
                                            </SvgText>
                                        </G>
                                    </G>
                                )}
                            </Svg>
                        </View>

                        {/* X-Axis labels */}
                        <View style={tw`flex-row justify-between px-1`}>
                            {chartData.filter((_, i) => {
                                if (normalizedPeriod === 'WEEK') return true;
                                if (normalizedPeriod === 'YEAR') return true;
                                if (normalizedPeriod === 'MONTH') return i % 5 === 0 || i === chartData.length - 1;
                                return true;
                            }).map((d, i) => (
                                <Text key={i} style={[tw`text-[9px] font-black leading-none uppercase`, { color: textMuted }]}>
                                    {normalizedPeriod === 'MONTH' ? (i === 0 ? '1' : d.label) : d.label.substring(0, 3)}
                                </Text>
                            ))}
                        </View>
                    </View>
                </HardShadowCardLocal>
            </View>

            {normalizedPeriod === 'WEEK' && wowCurrent.length > 0 && wowPrevious.length > 0 && (
                <View style={tw`mb-6`}>
                    <HardShadowCardLocal colorMode={colorMode}>
                        <View style={tw`p-5`}>
                            <View style={tw`flex-row justify-between items-center mb-4`}>
                                <Text style={[tw`text-xs font-black uppercase tracking-widest leading-none`, { color: textMuted }]}>Week over week</Text>
                                <View style={[tw`px-2 py-1 rounded-lg`, { backgroundColor: wowDelta >= 0 ? `${theme.primary}22` : '#ef444422' }]}>
                                    <Text style={[tw`text-[10px] font-black uppercase`, { color: wowDelta >= 0 ? theme.primary : '#ef4444' }]}>
                                        {wowDelta >= 0 ? `+${wowDelta}%` : `${wowDelta}%`} vs last week
                                    </Text>
                                </View>
                            </View>

                            <Svg width={chartWidth} height={comparisonChartHeight} style={tw`mb-4`}>
                                <Path d={wowPreviousPath} fill="none" stroke={isDark ? '#a1a1aa' : '#9ca3af'} strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" />
                                <Path d={wowCurrentPath} fill="none" stroke={theme.primary} strokeWidth={3} strokeLinecap="round" />
                            </Svg>

                            <View style={tw`flex-row items-center justify-between mb-3`}>
                                <View style={tw`flex-row items-center`}>
                                    <View style={[tw`w-3 h-0.5 mr-2`, { backgroundColor: theme.primary }]} />
                                    <Text style={[tw`text-[10px] font-black uppercase`, { color: textPrimary }]}>This week</Text>
                                </View>
                                <Text style={[tw`text-[10px] font-black uppercase`, { color: theme.primary }]}>{Math.round(wowCurrentPct)}%</Text>
                            </View>
                            <View style={tw`flex-row items-center justify-between`}>
                                <View style={tw`flex-row items-center`}>
                                    <View style={[tw`w-3 h-0.5 mr-2`, { backgroundColor: isDark ? '#a1a1aa' : '#9ca3af' }]} />
                                    <Text style={[tw`text-[10px] font-black uppercase`, { color: textPrimary }]}>Last week</Text>
                                </View>
                                <Text style={[tw`text-[10px] font-black uppercase`, { color: isDark ? '#a1a1aa' : '#6b7280' }]}>{Math.round(wowPreviousPct)}%</Text>
                            </View>
                        </View>
                    </HardShadowCardLocal>
                </View>
            )}

            {normalizedPeriod === 'MONTH' && momCurrent.length > 0 && momPrevious.length > 0 && (
                <View style={tw`mb-6`}>
                    <HardShadowCardLocal colorMode={colorMode}>
                        <View style={tw`p-5`}>
                            <View style={tw`flex-row justify-between items-center mb-4`}>
                                <Text style={[tw`text-xs font-black uppercase tracking-widest leading-none`, { color: textMuted }]}>Month over month</Text>
                                <View style={[tw`px-2 py-1 rounded-lg`, { backgroundColor: momDelta >= 0 ? `${theme.primary}22` : '#ef444422' }]}>
                                    <Text style={[tw`text-[10px] font-black uppercase`, { color: momDelta >= 0 ? theme.primary : '#ef4444' }]}>
                                        {momDelta >= 0 ? `+${momDelta}%` : `${momDelta}%`} vs last month
                                    </Text>
                                </View>
                            </View>

                            <Svg width={chartWidth} height={comparisonChartHeight} style={tw`mb-4`}>
                                <Path d={momPreviousPath} fill="none" stroke={isDark ? '#a1a1aa' : '#9ca3af'} strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" />
                                <Path d={momCurrentPath} fill="none" stroke={theme.primary} strokeWidth={3} strokeLinecap="round" />
                            </Svg>

                            <View style={tw`flex-row items-center justify-between mb-3`}>
                                <View style={tw`flex-row items-center`}>
                                    <View style={[tw`w-3 h-0.5 mr-2`, { backgroundColor: theme.primary }]} />
                                    <Text style={[tw`text-[10px] font-black uppercase`, { color: textPrimary }]}>This month</Text>
                                </View>
                                <Text style={[tw`text-[10px] font-black uppercase`, { color: theme.primary }]}>{Math.round(momCurrentPct)}%</Text>
                            </View>
                            <View style={tw`flex-row items-center justify-between`}>
                                <View style={tw`flex-row items-center`}>
                                    <View style={[tw`w-3 h-0.5 mr-2`, { backgroundColor: isDark ? '#a1a1aa' : '#9ca3af' }]} />
                                    <Text style={[tw`text-[10px] font-black uppercase`, { color: textPrimary }]}>{monthComparison?.previousLabel || 'Last month'}</Text>
                                </View>
                                <Text style={[tw`text-[10px] font-black uppercase`, { color: isDark ? '#a1a1aa' : '#6b7280' }]}>{Math.round(momPreviousPct)}%</Text>
                            </View>
                        </View>
                    </HardShadowCardLocal>
                </View>
            )}

            {/* Retrospective Grid */}
            <View style={tw`mb-6`}>
                <HardShadowCardLocal colorMode={colorMode}>
                    <View style={tw`p-5`}>
                        <View style={tw`flex-row justify-between items-center mb-6`}>
                            <Text style={[tw`text-xs font-black uppercase tracking-widest leading-none`, { color: textMuted }]}>{t('analytics.retrospectiveGrid')}</Text>
                            <Text style={[tw`text-xs font-black uppercase tracking-widest leading-none`, { color: theme.primary }]}>{Math.round(completionStats.percentage)}% {t('analytics.done')}</Text>
                        </View>
                        {renderRetrospectiveGrid()}
                    </View>
                </HardShadowCardLocal>
            </View>

            {/* Stats Grid */}
            <View style={tw`gap-3 mb-6`}>
                <HardShadowCardLocal colorMode={colorMode}>
                    <View style={tw`p-4 flex-row items-center justify-between`}>
                        <View style={tw`flex-1 pr-4`}>
                            <Text style={[tw`text-[10px] font-black uppercase tracking-widest mb-1 leading-none`, { color: textMuted }]}>{t('analytics.bestHabit', { period: periodLabel })}</Text>
                            <Text style={[tw`text-lg font-black`, { color: textPrimary }]} numberOfLines={1}>{stats.best?.name || t('analytics.noData')}</Text>
                        </View>
                        <View style={tw`items-end`}>
                            <Text style={[tw`text-xl font-black`, { color: textPrimary }]}>{stats.best?.value || "-"}</Text>
                            <View style={[tw`mt-1 w-8 h-1.5 rounded-full`, { backgroundColor: theme.primary }]} />
                        </View>
                    </View>
                </HardShadowCardLocal>

                <HardShadowCardLocal colorMode={colorMode}>
                    <View style={tw`p-4 flex-row items-center justify-between`}>
                        <View style={tw`flex-1 pr-4`}>
                            <Text style={tw`text-[10px] font-black uppercase text-red-300 tracking-widest mb-1 leading-none`}>{t('analytics.needsFocus', { period: periodLabel })}</Text>
                            <Text style={[tw`text-lg font-black`, { color: textPrimary }]} numberOfLines={1}>{stats.worst?.name || t('analytics.onTrack')}</Text>
                        </View>
                        <View style={tw`items-end`}>
                            <Text style={[tw`text-xl font-black`, { color: textPrimary }]}>{stats.worst?.value || "-"}</Text>
                            <View style={[tw`mt-1 w-8 h-1.5 rounded-full`, { backgroundColor: '#fca5a5' }]} />
                        </View>
                    </View>
                </HardShadowCardLocal>
            </View>

            {/* Mood Analysis */}
            <View style={tw`mb-6`}>
                <HardShadowCardLocal colorMode={colorMode}>
                    <View style={tw`p-5`}>
                        <View style={tw`flex-row justify-between items-center mb-6`}>
                            <Text style={[tw`text-xs font-black uppercase tracking-widest leading-none`, { color: textMuted }]}>{t('analytics.moodAnalysis')}</Text>
                            <Text style={[tw`text-[10px] font-black uppercase tracking-widest leading-none`, { color: theme.primary }]}>{t('analytics.vibe', { period: periodLabel })}</Text>
                        </View>
                        {renderMoodAnalysis()}
                    </View>
                </HardShadowCardLocal>
            </View>

            {/* Narrative Insights */}
            <View style={tw`mb-6`}>
                <HardShadowCardLocal style={{ height: 360 }} colorMode={colorMode}>
                    <View style={[tw`py-1.5 px-4 items-center`, { backgroundColor: theme.primary }]}>
                        <Text style={tw`text-[10px] font-black uppercase text-white tracking-widest leading-none`}>
                            {t('analytics.success', { period: periodLabel })}
                        </Text>
                    </View>

                    <View style={tw`p-5 flex-1`}>
                        <View style={tw`flex-row items-center justify-between mb-6`}>
                            <View>
                                <Text style={[tw`text-[10px] font-black uppercase tracking-widest mb-2 leading-none`, { color: textMuted }]}>{masteryLabel}</Text>
                                <View style={tw`flex-row items-baseline`}>
                                    <Text style={[tw`text-4xl font-black`, { color: textPrimary }]}>{completionStats.completed}</Text>
                                    <Text style={[tw`text-2xl font-black ml-1`, { color: textFaint }]}>/ {completionStats.total}</Text>
                                </View>
                            </View>
                            <View style={tw`items-center justify-center`}>
                                <Svg width={70} height={70}>
                                    <Circle cx={35} cy={35} r={radius} stroke={isDark ? '#262626' : '#f5f5f4'} strokeWidth={8} fill="none" />
                                    <AnimatedCircle
                                        cx={35}
                                        cy={35}
                                        r={radius}
                                        stroke={theme.primary}
                                        strokeWidth={8}
                                        fill="none"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={circleAnim.interpolate({
                                            inputRange: [0, 100],
                                            outputRange: [circumference, 0]
                                        })}
                                        strokeLinecap="round"
                                        transform="rotate(-90 35 35)"
                                    />
                                </Svg>
                                <View style={tw`absolute`}>
                                    <Text style={[tw`text-sm font-black`, { color: theme.primary }]}>{Math.round(completionStats.percentage)}%</Text>
                                </View>
                            </View>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={tw`flex-1`} contentContainerStyle={tw`pb-6`}>
                            <View style={tw`gap-4 pb-4`}>
                                {story.sections.map((section, idx) => (
                                    <View key={idx}>
                                        <Text style={[tw`text-[10px] font-black uppercase mb-1 leading-none`, section.type === 'neglected' ? tw`text-rose-400` : { color: textMuted }]}>
                                            {section.type}
                                        </Text>
                                        <FormattedText text={section.text} highlightColor={theme.secondary} colorMode={colorMode} />
                                    </View>
                                ))}
                                {story.sections.length === 0 && (
                                    <Text style={[tw`italic font-bold text-center py-4`, { color: textMuted }]}>{t('analytics.notEnoughData')}</Text>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </HardShadowCardLocal>
            </View>

        </View>
    );
};
