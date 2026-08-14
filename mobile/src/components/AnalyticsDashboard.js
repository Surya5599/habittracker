import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, Dimensions, Animated, Easing, FlatList, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import Svg, { Path, Circle } from 'react-native-svg';
import { ChevronLeft, ChevronRight, Target, CalendarRange, ListChecks, Sparkles } from 'lucide-react-native';
import { MOODS } from '../constants';
import { getPalette } from '../constants/theme';

// The four questions this screen answers. Previously these were nine stacked
// shadow cards in one scroll, which reported completion % three times, done/total
// and the best habit twice each, and drew two separate calendars of the same date
// range. One card, four panels, tap to switch — the DailyCard idiom.

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

// The analytics card. Flat, like the day card on Today and the page on Review — all three
// are a 3px outline on a panel and nothing else.
//
// This one used to carry a hard drop shadow: a solid black rounded rectangle offset 6px
// down and right, sitting behind the card. Neither of the other two had one (Today defined
// a HardShadowCard and then never used it), so Analytics was the only screen in the app
// with a shadow, and it read as a stray dark band behind the card rather than as depth.
export const AnalyticsCardSurface = ({ children, style, bgColor, colorMode = 'light' }) => {
    const isDark = colorMode === 'dark';
    return (
        <View style={style}>
            <View style={[
                tw`border-[3px] rounded-3xl overflow-hidden flex-1`,
                {
                    backgroundColor: bgColor || (isDark ? '#0b0b0b' : '#ffffff'),
                    borderColor: isDark ? '#ffffff' : '#000000',
                },
            ]}>
                {children}
            </View>
        </View>
    );
};

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
    headerComponent,
    completionStats,
    retrospectiveData,
    gridPadding = 0,
    periodLabelSecondary = "",
    moodData,
    weekComparison,
    monthComparison,
    weekStart = 'MON',
    colorMode = 'light',
    onRetrospectiveDayPress,
    anchorInsight = null,
    weakDayInsight = null,
    fragilityInsight = null,
    weeklyBreakdown = null,
    // Period navigation, previously two stacked rows above the cards in DashboardView.
    // It folds into this card's header band, the way DailyCard's date header works.
    analyticsView = null,
    onChangeAnalyticsView,
    onPrevPeriod,
    onNextPeriod,
    onPressPeriodLabel,
    cardHeight,
    // Controlled from DashboardView. Each period renders its own instance of this
    // component, so internal panel state would reset to 'score' every time you
    // switched WEEK/MONTH/YEAR. Falls back to local state when uncontrolled.
    activePanel = null,
    onChangePanel = null,
}) => {
    const { t } = useTranslation();
    const [internalPanel, setInternalPanel] = useState('score');
    const panel = activePanel || internalPanel;
    const setPanel = onChangePanel || setInternalPanel;
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
    // The chart used to be `screenWidth - 64`, which assumed the old layout: a card at
    // px-3 with p-5 inside it. Inside a panel the chart now sits one level deeper
    // (card border + panel padding + the sub-block's border and padding), so that
    // constant overflowed by ~40px. Measure the slot instead of tracking the nesting;
    // the fallback only applies for the first frame before onLayout fires.
    const [chartSlotWidth, setChartSlotWidth] = useState(0);
    const chartWidth = chartSlotWidth > 0 ? chartSlotWidth : Math.max(120, screenWidth - 106);
    const chartHeight = 100;
    const comparisonChartHeight = 84;

    // Animation values
    const circleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        circleAnim.setValue(0);
        Animated.timing(circleAnim, {
            toValue: completionStats.percentage || 0,
            duration: 1200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [normalizedPeriod, completionStats.percentage]);

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

    // A 3px stroke with round caps hangs half its width past the first and last
    // points, so the series spans an inset box rather than the full canvas.
    const STROKE_INSET = 3;
    const buildPath = (series, width, height, maxValue) => {
        if (!Array.isArray(series) || series.length === 0) return '';
        const span = Math.max(1, width - STROKE_INSET * 2);
        const usable = Math.max(1, height - STROKE_INSET * 2);
        const yAt = (value) => STROKE_INSET + (usable - ((value || 0) / Math.max(maxValue, 1)) * usable);
        const xAt = (i, len) => STROKE_INSET + (len === 1 ? span : (i / (len - 1)) * span);

        if (series.length === 1) {
            const y = yAt(series[0]?.value);
            return `M ${STROKE_INSET},${y} L ${STROKE_INSET + span},${y}`;
        }
        let path = '';
        series.forEach((d, i) => {
            const x = xAt(i, series.length);
            const y = yAt(d?.value);
            if (i === 0) {
                path = `M ${x},${y}`;
            } else {
                const prevX = xAt(i - 1, series.length);
                const prevY = yAt(series[i - 1]?.value);
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

    const radius = 30;
    const circumference = radius * 2 * Math.PI;
    const comparisonDelta = normalizedPeriod === 'WEEK'
        ? wowDelta
        : normalizedPeriod === 'MONTH'
            ? momDelta
            : null;

    /* ---------------- Tab strip ---------------- */

    const palette = getPalette(colorMode);
    const moodCounts = Array.isArray(moodData)
        ? moodData.filter(d => d?.mood).length
        : 0;

    // Icon-only, matching the DailyCard strip. Each tab shows its group's headline
    // value, so all four numbers are visible at once without switching panels.
    const TABS = [
        {
            id: 'score',
            icon: Target,
            label: t('analytics.tabScore', { defaultValue: 'Score' }),
            value: `${Math.round(completionStats.percentage)}%`,
        },
        {
            id: 'timing',
            icon: CalendarRange,
            label: t('analytics.tabTiming', { defaultValue: 'Timing' }),
            value: weakDayInsight?.dayShort
                || (comparisonDelta === null ? '—' : `${comparisonDelta >= 0 ? '+' : ''}${comparisonDelta}%`),
        },
        {
            id: 'habits',
            icon: ListChecks,
            label: t('analytics.tabHabits', { defaultValue: 'Habits' }),
            value: `${completionStats.completed}/${completionStats.total}`,
        },
        {
            id: 'story',
            icon: Sparkles,
            label: t('analytics.tabStory', { defaultValue: 'Story' }),
            value: moodCounts > 0 ? String(moodCounts) : '—',
        },
    ];

    const TabStrip = () => (
        <View
            accessibilityRole="tablist"
            style={[tw`flex-row border-t-[3px]`, { backgroundColor: palette.panelSoftBg, borderTopColor: palette.outline }]}
        >
            {TABS.map((tab, i) => {
                const isActive = panel === tab.id;
                const TabIcon = tab.icon;
                return (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setPanel(tab.id)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isActive }}
                        accessibilityLabel={tab.label}
                        accessibilityValue={{ text: tab.value }}
                        style={[
                            tw`flex-1 py-3 items-center justify-center gap-1`,
                            i < TABS.length - 1 && { borderRightWidth: 1, borderRightColor: palette.outline },
                            isActive && { backgroundColor: palette.panelBg },
                        ]}
                    >
                        {/* Active tab also gets a bar overlaying the top border, the same
                            affordance DailyCard uses now that the labels are gone. */}
                        {isActive && (
                            <View style={{ position: 'absolute', top: -3, left: 0, right: 0, height: 3, backgroundColor: theme.primary }} />
                        )}
                        <TabIcon size={19} color={isActive ? theme.primary : textMuted} strokeWidth={isActive ? 2.5 : 2} />
                        <Text style={[tw`text-[11px] font-black`, { color: isActive ? textPrimary : textMuted }]} numberOfLines={1}>
                            {tab.value}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const PeriodHeader = () => (
        <View style={{ backgroundColor: theme.primary }}>
            <View style={tw`flex-row items-center justify-between px-2 py-2`}>
                <TouchableOpacity
                    onPress={onPrevPeriod}
                    disabled={!onPrevPeriod}
                    accessibilityRole="button"
                    accessibilityLabel={t('analytics.previousPeriod', { defaultValue: 'Previous period' })}
                    style={tw`w-11 h-11 items-center justify-center`}
                >
                    <ChevronLeft size={22} color="#ffffff" strokeWidth={3} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onPressPeriodLabel}
                    disabled={!onPressPeriodLabel}
                    accessibilityRole="button"
                    style={tw`flex-1 items-center justify-center h-11`}
                >
                    <Text style={tw`text-sm font-black text-white uppercase tracking-widest text-center`} numberOfLines={1}>
                        {periodLabelSecondary || periodLabel}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onNextPeriod}
                    disabled={!onNextPeriod}
                    accessibilityRole="button"
                    accessibilityLabel={t('analytics.nextPeriod', { defaultValue: 'Next period' })}
                    style={tw`w-11 h-11 items-center justify-center`}
                >
                    <ChevronRight size={22} color="#ffffff" strokeWidth={3} />
                </TouchableOpacity>
            </View>

            {analyticsView && onChangeAnalyticsView && (
                <View style={tw`flex-row px-2 pb-2 gap-1`}>
                    {['WEEK', 'MONTH', 'YEAR'].map((name) => {
                        const isActive = analyticsView === name;
                        return (
                            <TouchableOpacity
                                key={name}
                                onPress={() => onChangeAnalyticsView(name)}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: isActive }}
                                style={[
                                    tw`flex-1 py-2 rounded-lg items-center justify-center`,
                                    isActive ? { backgroundColor: '#ffffff' } : { backgroundColor: 'rgba(255,255,255,0.18)' },
                                ]}
                            >
                                <Text
                                    style={[
                                        tw`text-[10px] font-black uppercase tracking-widest`,
                                        { color: isActive ? theme.primary : '#ffffff' },
                                    ]}
                                >
                                    {t(`dashboard.${name.toLowerCase()}Tab`)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );

    // Both comparison charts (week-over-week, month-over-month) drew identical markup
    // in the old layout; one helper now serves both.
    const renderComparisonChart = (currentPath, previousPath, currentLabel, previousLabel, currentPct, previousPct) => (
        <>
            {/* This wrapper is what reports the real available width back up. */}
            <View
                style={tw`mb-4`}
                onLayout={(e) => {
                    const w = Math.round(e.nativeEvent.layout.width);
                    if (w > 0 && w !== chartSlotWidth) setChartSlotWidth(w);
                }}
            >
                <Svg width={chartWidth} height={comparisonChartHeight}>
                    <Path d={previousPath} fill="none" stroke={isDark ? '#a1a1aa' : '#9ca3af'} strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" />
                    <Path d={currentPath} fill="none" stroke={theme.primary} strokeWidth={3} strokeLinecap="round" />
                </Svg>
            </View>
            <View style={tw`flex-row items-center justify-between mb-3`}>
                <View style={tw`flex-row items-center`}>
                    <View style={[tw`w-3 h-0.5 mr-2`, { backgroundColor: theme.primary }]} />
                    <Text style={[tw`text-[10px] font-black uppercase`, { color: textPrimary }]}>{currentLabel}</Text>
                </View>
                <Text style={[tw`text-[10px] font-black uppercase`, { color: theme.primary }]}>{Math.round(currentPct)}%</Text>
            </View>
            <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`flex-row items-center`}>
                    <View style={[tw`w-3 h-0.5 mr-2`, { backgroundColor: isDark ? '#a1a1aa' : '#9ca3af' }]} />
                    <Text style={[tw`text-[10px] font-black uppercase`, { color: textPrimary }]}>{previousLabel}</Text>
                </View>
                <Text style={[tw`text-[10px] font-black uppercase`, { color: isDark ? '#a1a1aa' : '#6b7280' }]}>{Math.round(previousPct)}%</Text>
            </View>
        </>
    );

    const SectionLabel = ({ children, right }) => (
        <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={[tw`text-xs font-black uppercase tracking-widest leading-none`, { color: textMuted }]}>{children}</Text>
            {right}
        </View>
    );

    /* ---------------- Panels ---------------- */

    const scorePanel = (
        <View style={tw`p-5`}>
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
                            strokeDashoffset={circleAnim.interpolate({ inputRange: [0, 100], outputRange: [circumference, 0] })}
                            strokeLinecap="round"
                            transform="rotate(-90 35 35)"
                        />
                    </Svg>
                    <View style={tw`absolute`}>
                        <Text style={[tw`text-sm font-black`, { color: theme.primary }]}>{Math.round(completionStats.percentage)}%</Text>
                    </View>
                </View>
            </View>

            <View style={[tw`rounded-2xl border-2 p-4`, { borderColor: borderSoft, backgroundColor: surfaceSoft }]}>
                <SectionLabel>{t('analytics.atAGlance')}</SectionLabel>
                <View style={tw`flex-row flex-wrap`}>
                    <View style={tw`w-1/2 pr-3 mb-3`}>
                        <Text style={[tw`text-[9px] font-black uppercase tracking-wider`, { color: textMuted }]}>{t('analytics.completion')}</Text>
                        <Text style={[tw`text-2xl font-black mt-1`, { color: theme.primary }]}>{Math.round(completionStats.percentage)}%</Text>
                    </View>
                    <View style={tw`w-1/2 pl-3 mb-3`}>
                        <Text style={[tw`text-[9px] font-black uppercase tracking-wider`, { color: textMuted }]}>{t('analytics.vsPrevious')}</Text>
                        <Text style={[tw`text-2xl font-black mt-1`, { color: comparisonDelta === null ? textFaint : (comparisonDelta >= 0 ? theme.primary : palette.danger) }]}>
                            {comparisonDelta === null ? '--' : `${comparisonDelta >= 0 ? '+' : ''}${comparisonDelta}%`}
                        </Text>
                    </View>
                    <View style={tw`w-full`}>
                        <Text style={[tw`text-[9px] font-black uppercase tracking-wider`, { color: textMuted }]}>{t('analytics.topHabit')}</Text>
                        <Text style={[tw`text-sm font-black mt-1`, { color: textPrimary }]} numberOfLines={1}>
                            {stats.best?.name || t('analytics.noData')}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const timingPanel = (
        <View style={tw`p-5`}>
            <SectionLabel right={
                <Text style={[tw`text-xs font-black uppercase tracking-widest leading-none`, { color: theme.primary }]}>
                    {Math.round(completionStats.percentage)}% {t('analytics.done')}
                </Text>
            }>
                {t('analytics.retrospectiveGrid')}
            </SectionLabel>
            {renderRetrospectiveGrid()}

            {normalizedPeriod === 'WEEK' && weakDayInsight && (
                <View style={[tw`mt-5 rounded-2xl border-2 overflow-hidden`, { borderColor: borderSoft }]}>
                    <View style={[tw`px-3 py-1.5`, { backgroundColor: theme.primary }]}>
                        <Text style={tw`text-white text-[9px] font-black tracking-widest uppercase`}>{t('dashboard.weakSpot')}</Text>
                    </View>
                    <View style={[tw`p-3`, { backgroundColor: surfaceSoft }]}>
                        <Text style={[tw`font-medium leading-relaxed text-sm`, { color: isDark ? '#cfcfcf' : '#4b5563' }]}>
                            {t('dashboard.weakSpotDesc1') + ' '}
                            <Text style={[tw`font-black uppercase`, { color: theme.secondary }]}>
                                {weakDayInsight.completionRatePct}% {t('dashboard.weakSpotDesc2')}
                            </Text>
                            {weakDayInsight.worstHabit
                                ? '. ' + t('dashboard.weakSpotDesc3', { habit: weakDayInsight.worstHabit.name, day: weakDayInsight.dayShort })
                                : ''}
                        </Text>
                    </View>
                </View>
            )}

            {normalizedPeriod === 'MONTH' && weeklyBreakdown && weeklyBreakdown.length > 0 && (() => {
                const maxPct = Math.max(...weeklyBreakdown.map(w => w.percentage), 1);
                const MAX_BAR_H = 72;
                return (
                    <View style={[tw`mt-5 rounded-2xl border-2 p-4`, { borderColor: borderSoft, backgroundColor: surfaceSoft }]}>
                        <SectionLabel>{t('analytics.weeksThisMonth')}</SectionLabel>
                        <View style={[tw`flex-row items-end justify-between`, { height: MAX_BAR_H + 40 }]}>
                            {weeklyBreakdown.map((week, i) => {
                                const isBest = week.percentage === maxPct && week.possible > 0;
                                const barH = week.possible === 0 ? 4 : Math.max(4, Math.round((week.percentage / maxPct) * MAX_BAR_H));
                                return (
                                    <View key={i} style={tw`flex-1 items-center mx-1`}>
                                        <Text style={[tw`text-[10px] font-black mb-1`, { color: isBest ? theme.primary : textMuted }]}>
                                            {week.possible === 0 ? '—' : `${week.percentage}%`}
                                        </Text>
                                        <View style={{
                                            height: barH,
                                            width: '100%',
                                            borderRadius: 6,
                                            backgroundColor: isBest ? theme.primary : (isDark ? '#2a2a2a' : '#e5e7eb'),
                                            borderWidth: 2,
                                            borderColor: isBest ? theme.primary : (isDark ? '#3a3a3a' : '#d1d5db'),
                                        }} />
                                        <Text style={[tw`text-[10px] font-black mt-2 uppercase`, { color: isBest ? theme.primary : textPrimary }]}>{week.label}</Text>
                                        <Text style={[tw`text-[8px] font-bold mt-0.5`, { color: textMuted }]}>{week.startDay}–{week.endDay}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                );
            })()}

            {normalizedPeriod === 'WEEK' && wowMax > 1 && wowCurrent.length > 0 && wowPrevious.length > 0 && (
                <View style={[tw`mt-5 rounded-2xl border-2 p-4`, { borderColor: borderSoft, backgroundColor: surfaceSoft }]}>
                    <SectionLabel right={
                        <Text style={[tw`text-[10px] font-black uppercase tracking-widest leading-none`, { color: wowDelta >= 0 ? theme.primary : palette.danger }]}>
                            {wowDelta >= 0 ? `+${wowDelta}%` : `${wowDelta}%`} {t('analytics.vsLastWeek')}
                        </Text>
                    }>
                        {t('analytics.weekOverWeek')}
                    </SectionLabel>
                    {renderComparisonChart(wowCurrentPath, wowPreviousPath, t('analytics.thisWeek'), t('analytics.lastWeek'), wowCurrentPct, wowPreviousPct)}
                </View>
            )}

            {normalizedPeriod === 'MONTH' && momMax > 1 && momCurrent.length > 0 && momPrevious.length > 0 && (
                <View style={[tw`mt-5 rounded-2xl border-2 p-4`, { borderColor: borderSoft, backgroundColor: surfaceSoft }]}>
                    <SectionLabel right={
                        <Text style={[tw`text-[10px] font-black uppercase tracking-widest leading-none`, { color: momDelta >= 0 ? theme.primary : palette.danger }]}>
                            {momDelta >= 0 ? `+${momDelta}%` : `${momDelta}%`} {t('analytics.vsLastMonth')}
                        </Text>
                    }>
                        {t('analytics.monthOverMonth')}
                    </SectionLabel>
                    {renderComparisonChart(momCurrentPath, momPreviousPath, t('analytics.thisMonth'), monthComparison?.previousLabel || t('analytics.lastMonth'), momCurrentPct, momPreviousPct)}
                </View>
            )}
        </View>
    );

    const habitsPanel = (
        <View style={tw`p-5`}>
            <View style={[tw`rounded-2xl border-2 p-4 flex-row items-center justify-between`, { borderColor: borderSoft, backgroundColor: surfaceSoft }]}>
                <View style={tw`flex-1 mr-3`}>
                    <Text style={[tw`text-[10px] font-black uppercase tracking-widest mb-1 leading-none`, { color: textMuted }]}>{t('analytics.bestHabit', { period: periodLabel })}</Text>
                    <Text style={[tw`text-lg font-black`, { color: textPrimary }]} numberOfLines={1}>{stats.best?.name || t('analytics.noData')}</Text>
                </View>
                <Text style={[tw`text-2xl font-black`, { color: theme.primary }]}>{stats.best?.value ?? '—'}</Text>
            </View>

            <View style={[tw`mt-3 rounded-2xl border-2 p-4 flex-row items-center justify-between`, { borderColor: borderSoft, backgroundColor: surfaceSoft }]}>
                <View style={tw`flex-1 mr-3`}>
                    <Text style={[tw`text-[10px] font-black uppercase tracking-widest mb-1 leading-none`, { color: palette.danger }]}>{t('analytics.needsFocus', { period: periodLabel })}</Text>
                    <Text style={[tw`text-lg font-black`, { color: textPrimary }]} numberOfLines={1}>{stats.worst?.name || t('analytics.onTrack')}</Text>
                </View>
                <Text style={[tw`text-2xl font-black`, { color: palette.danger }]}>{stats.worst?.value ?? '—'}</Text>
            </View>

            {normalizedPeriod === 'WEEK' && anchorInsight && (
                <View style={[tw`mt-3 rounded-2xl border-2 overflow-hidden`, { borderColor: borderSoft }]}>
                    <View style={[tw`px-3 py-1.5`, { backgroundColor: theme.primary }]}>
                        <Text style={tw`text-white text-[9px] font-black tracking-widest uppercase`}>{t('dashboard.anchorHabit')}</Text>
                    </View>
                    <View style={[tw`p-3`, { backgroundColor: surfaceSoft }]}>
                        <Text style={[tw`font-medium leading-relaxed text-sm`, { color: isDark ? '#cfcfcf' : '#4b5563' }]}>
                            {t('dashboard.anchorDesc1') + ' '}
                            <Text style={[tw`font-black uppercase`, { color: theme.secondary }]}>
                                {anchorInsight.liftPct}% {t('dashboard.anchorDesc2')}
                            </Text>
                            {' ' + t('dashboard.anchorDesc3', { done: anchorInsight.doneRatePct, missed: anchorInsight.missedRatePct })}
                        </Text>
                    </View>
                </View>
            )}

            {normalizedPeriod === 'WEEK' && fragilityInsight && (
                <View style={[tw`mt-3 rounded-2xl border-2 overflow-hidden`, { borderColor: borderSoft }]}>
                    <View style={[tw`px-3 py-1.5`, { backgroundColor: theme.primary }]}>
                        <Text style={tw`text-white text-[9px] font-black tracking-widest uppercase`}>{t('dashboard.streakPattern')}</Text>
                    </View>
                    <View style={[tw`p-3`, { backgroundColor: surfaceSoft }]}>
                        <Text style={[tw`font-medium leading-relaxed text-sm`, { color: isDark ? '#cfcfcf' : '#4b5563' }]}>
                            {t('dashboard.streakDesc1') + ' '}
                            <Text style={[tw`font-black uppercase`, { color: theme.secondary }]}>
                                {fragilityInsight.breakAtLength} {fragilityInsight.breakAtLength === 1 ? t('dashboard.streakDescDay') : t('dashboard.streakDescDays')}
                            </Text>
                            {' ' + t('dashboard.streakDesc2', { count: fragilityInsight.breakCount, day: fragilityInsight.breakAtLength + 1 })}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );

    const storyPanel = (
        <View style={tw`p-5`}>
            <SectionLabel right={
                <Text style={[tw`text-[10px] font-black uppercase tracking-widest leading-none`, { color: theme.primary }]}>
                    {t('analytics.vibe', { period: periodLabel })}
                </Text>
            }>
                {t('analytics.moodAnalysis')}
            </SectionLabel>
            {renderMoodAnalysis()}

            <View style={tw`mt-6`}>
                <SectionLabel>{t('analytics.success', { period: periodLabel })}</SectionLabel>
                <View style={tw`gap-4`}>
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
            </View>
        </View>
    );

    const panelContent = {
        score: scorePanel,
        timing: timingPanel,
        habits: habitsPanel,
        story: storyPanel,
    }[panel];

    return (
        <AnalyticsCardSurface colorMode={colorMode} style={cardHeight ? { height: cardHeight } : undefined}>
            <PeriodHeader />
            {/* Each panel scrolls on its own, so no panel is constrained by the tallest
                one and none of them needs a nested scroll view. */}
            <ScrollView
                style={tw`flex-1`}
                contentContainerStyle={tw`pb-2`}
                showsVerticalScrollIndicator={false}
            >
                {panelContent}
            </ScrollView>
            <TabStrip />
        </AnalyticsCardSurface>
    );
};

