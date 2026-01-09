import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Dimensions, Animated, Easing, PanResponder, FlatList } from 'react-native';
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

export const HardShadowCardLocal = ({ children, style, bgColor }) => (
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

// A simple component to render text with [[highlights]]
const FormattedText = ({ text, highlightColor }) => {
    const parts = text.split(/(\[\[.*?\]\])/g);
    return (
        <Text style={tw`text-gray-600 font-medium leading-relaxed text-sm`}>
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
    weekStart = 'MON', // Start of week preference
}) => {
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 64;
    const chartHeight = 100;

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
    }, [periodLabel, completionStats.percentage, chartData]);

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

        if (periodLabel === 'Week') {
            return (
                <View>
                    <View style={tw`flex-row justify-between gap-1`}>
                        {retrospectiveData.map((d, i) => (
                            <View key={i} style={tw`flex-1 items-center`}>
                                <View style={[
                                    tw`w-full aspect-square rounded-lg border-2 border-black items-center justify-center overflow-hidden`
                                ]}>
                                    {d.percentage > 0 && (
                                        <AnimatedRetrospectiveBar percentage={d.percentage} color={theme.secondary} />
                                    )}
                                    <Text style={[tw`text-[10px] font-black leading-none text-black`]}>{d.percentage}%</Text>
                                    {d.percentage >= 100 && (
                                        <View style={[tw`absolute inset-0`, { backgroundColor: theme.primary, zIndex: -2 }]} />
                                    )}
                                </View>
                                <Text style={tw`text-[10px] font-black text-black mt-1`}>{d.day}</Text>
                            </View>
                        ))}
                    </View>
                    {periodLabelSecondary ? (
                        <View style={tw`mt-4 items-center`}>
                            <Text style={tw`text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none`}>{periodLabelSecondary}</Text>
                        </View>
                    ) : null}
                </View>
            );
        }

        if (periodLabel === 'Month') {
            const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
            const emptySlotsStart = Array.from({ length: gridPadding || 0 });
            const totalItemsSoFar = emptySlotsStart.length + retrospectiveData.length;
            const emptySlotsEnd = Array.from({ length: (7 - (totalItemsSoFar % 7)) % 7 });

            return (
                <View>
                    {/* Days Header */}
                    <View style={tw`flex-row justify-between mb-2 px-1`}>
                        {daysOfWeek.map((day, i) => (
                            <View key={i} style={tw`w-[13.2%] items-center`}>
                                <Text style={tw`text-[10px] font-black text-black`}>{day}</Text>
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
                            <View key={i} style={[
                                tw`w-[13.2%] h-[15.2%] aspect-square rounded-md border-2 border-black items-center justify-center overflow-hidden mb-1`,
                                tw`bg-gray-50`
                            ]}>
                                {d.percentage > 0 && (
                                    <AnimatedRetrospectiveBar percentage={d.percentage} color={theme.secondary} />
                                )}

                                <View style={tw`absolute top-1 left-1`}>
                                    <Text style={[tw`text-[7px] font-black text-black opacity-30`]}>{d.label}</Text>
                                </View>

                                <View style={tw`items-center`}>
                                    <Text style={[tw`text-[10px] font-black leading-none text-black`]}>{d.percentage}%</Text>
                                </View>

                                {d.percentage >= 100 && (
                                    <View style={[tw`absolute inset-0`, { backgroundColor: theme.primary, zIndex: -2 }]} />
                                )}
                                {d.percentage >= 100 && (
                                    <View style={tw`absolute inset-0 items-center justify-center`}>
                                        <View style={tw`absolute top-1 left-1`}>
                                            <Text style={[tw`text-[7px] font-black text-white/50`]}>{d.label}</Text>
                                        </View>
                                        <Text style={[tw`text-[10px] font-black text-black leading-none`]}>{d.percentage}%</Text>
                                    </View>
                                )}
                            </View>
                        ))}

                        {/* Filler Slots at End for consistent justify-between alignment */}
                        {emptySlotsEnd.map((_, i) => (
                            <View key={`empty-end-${i}`} style={tw`w-[13.2%] aspect-[0.5] mb-1`} />
                        ))}
                    </View>
                    {periodLabelSecondary ? (
                        <View style={tw`mt-4 items-center`}>
                            <Text style={tw`text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{periodLabelSecondary}</Text>
                        </View>
                    ) : null}
                </View>
            );
        }

        if (periodLabel === 'Year') {
            return (
                <View>
                    <View style={tw`flex-row flex-wrap justify-between gap-y-4`}>
                        {retrospectiveData.map((m, i) => (
                            <View key={i} style={tw`w-[23%] items-center`}>
                                <View style={[
                                    tw`w-full aspect-square border-2 border-black rounded-xl items-center justify-center overflow-hidden`,
                                    tw`bg-gray-50`
                                ]}>
                                    <Text style={tw`text-xs font-black text-black leading-none`}>{m.percentage}%</Text>
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
                                <Text style={tw`text-[10px] font-black text-black mt-2 uppercase leading-none`}>{m.name.substring(0, 3)}</Text>
                            </View>
                        ))}
                    </View>
                    {periodLabelSecondary ? (
                        <View style={tw`mt-6 items-center`}>
                            <Text style={tw`text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none`}>{periodLabelSecondary}</Text>
                        </View>
                    ) : null}
                </View>
            );
        }
    };

    const renderMoodAnalysis = () => {
        if (!moodData) return null;

        if (periodLabel === 'Week') {
            return (
                <View style={tw`flex-row justify-between`}>
                    {moodData.map((d, i) => {
                        const moodObj = MOODS.find(m => m.value === d.mood);
                        const Icon = moodObj?.icon;
                        return (
                            <View key={i} style={tw`items-center`}>
                                <View style={[
                                    tw`w-10 h-10 rounded-xl border-2 border-black items-center justify-center mb-1.5`,
                                    moodObj ? { backgroundColor: moodObj.color + '20', borderColor: moodObj.color } : tw`bg-gray-50 border-gray-100`
                                ]}>
                                    {Icon ? (
                                        <Icon size={22} color={moodObj.color} strokeWidth={3} />
                                    ) : (
                                        <View style={tw`w-1.5 h-1.5 rounded-full bg-gray-200`} />
                                    )}
                                </View>
                                <Text style={tw`text-[10px] font-black text-gray-400`}>{d.label.substring(0, 1)}</Text>
                            </View>
                        );
                    })}
                </View>
            );
        }

        if (periodLabel === 'Month') {
            const daysOfWeek = weekStart === 'SUN'
                ? ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
            const emptySlotsStart = Array.from({ length: gridPadding || 0 });
            const totalItemsSoFar = emptySlotsStart.length + moodData.length;
            const emptySlotsEnd = Array.from({ length: (7 - (totalItemsSoFar % 7)) % 7 });

            return (
                <View>
                    {/* Days Header */}
                    <View style={tw`flex-row justify-between mb-2 px-1`}>
                        {daysOfWeek.map((day, i) => (
                            <View key={i} style={tw`w-[13.2%] items-center`}>
                                <Text style={tw`text-[10px] font-black text-black`}>{day}</Text>
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
                                        moodObj ? { backgroundColor: moodObj.color } : tw`bg-gray-50`
                                    ]}
                                >
                                    <View style={tw`absolute top-1 left-1`}>
                                        <Text style={[tw`text-[7px] font-black`, moodObj ? tw`text-white/50` : tw`text-black opacity-30`]}>{d.label}</Text>
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

        if (periodLabel === 'Year') {
            return (
                <View style={tw`flex-row flex-wrap justify-between gap-y-4`}>
                    {moodData.map((m, i) => {
                        const moodObj = MOODS.find(mood => mood.value === m.mood);
                        const Icon = moodObj?.icon;
                        return (
                            <View key={i} style={tw`w-[23%] items-center`}>
                                <View style={[
                                    tw`w-full aspect-square border-2 border-black rounded-xl items-center justify-center`,
                                    moodObj ? { backgroundColor: moodObj.color + '20', borderColor: moodObj.color } : tw`bg-gray-50 border-gray-100`
                                ]}>
                                    {Icon ? (
                                        <Icon size={24} color={moodObj.color} strokeWidth={3} />
                                    ) : (
                                        <Text style={tw`text-gray-200 font-extrabold`}>-</Text>
                                    )}
                                </View>
                                <Text style={tw`text-[10px] font-black text-black mt-2 uppercase leading-none`}>{m.label}</Text>
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

    return (
        <View style={tw`flex-1`}>


            {/* Story Card */}
            <View style={tw`mb-6`}>
                <HardShadowCardLocal style={{ height: 280 }}>
                    {/* Header bar from image */}
                    <View style={[tw`py-1.5 px-4 items-center`, { backgroundColor: theme.primary }]}>
                        <Text style={tw`text-[10px] font-black uppercase text-white tracking-widest leading-none`}>{periodLabel} Success</Text>
                    </View>

                    <View style={tw`p-5 flex-1`}>
                        <View style={tw`flex-row items-center justify-between mb-6`}>
                            <View>
                                <Text style={tw`text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 leading-none`}>{periodLabel} Mastery</Text>
                                <View style={tw`flex-row items-baseline gap-1`}>
                                    <View style={tw`flex-row items-baseline`}>
                                        <Text style={tw`text-4xl font-black text-gray-800`}>{completionStats.completed}</Text>
                                        <Text style={tw`text-2xl font-black text-gray-200 ml-1`}>/ {completionStats.total}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={tw`items-center justify-center`}>
                                {/* Mini Circular Progress */}
                                <Svg width={70} height={70}>
                                    <Circle cx={35} cy={35} r={radius} stroke="#f5f5f4" strokeWidth={8} fill="none" />
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

                        <ScrollView showsVerticalScrollIndicator={false} style={tw`flex-1`}>
                            <View style={tw`gap-4 pb-4`}>
                                {story.sections.map((section, idx) => (
                                    <View key={idx}>
                                        <Text style={[tw`text-[10px] font-black uppercase mb-1 leading-none`,
                                        section.type === 'neglected' ? tw`text-rose-400` : tw`text-gray-400`
                                        ]}>{section.type}</Text>
                                        <FormattedText text={section.text} highlightColor={theme.secondary} />
                                    </View>
                                ))}
                                {story.sections.length === 0 && (
                                    <Text style={tw`text-gray-400 italic font-bold text-center py-4`}>Not enough data to generate a story yet.</Text>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </HardShadowCardLocal>
            </View>

            {/* Retrospective Card (New) */}
            <View style={tw`mb-6`}>
                <HardShadowCardLocal>
                    <View style={tw`p-5`}>
                        <View style={tw`flex-row justify-between items-center mb-6`}>
                            <Text style={tw`text-xs font-black uppercase text-gray-400 tracking-widest leading-none`}>Retrospective Grid</Text>
                            <Text style={[tw`text-xs font-black uppercase tracking-widest leading-none`, { color: theme.primary }]}>{Math.round(completionStats.percentage)}% Done</Text>
                        </View>
                        {renderRetrospectiveGrid()}
                    </View>
                </HardShadowCardLocal>
            </View>
            {/* Mood Analysis Card */}
            <View style={tw`mb-6`}>
                <HardShadowCardLocal>
                    <View style={tw`p-5`}>
                        <View style={tw`flex-row justify-between items-center mb-6`}>
                            <Text style={tw`text-xs font-black uppercase text-gray-400 tracking-widest leading-none`}>Mood Analysis</Text>
                            <Text style={[tw`text-[10px] font-black uppercase tracking-widest leading-none`, { color: theme.primary }]}>{periodLabel} Vibe</Text>
                        </View>
                        {renderMoodAnalysis()}
                    </View>
                </HardShadowCardLocal>
            </View>

            {/* Area Chart Card */}
            <View style={tw`mb-6`}>
                <HardShadowCardLocal>
                    <View style={tw`p-5`}>
                        <View style={tw`flex-row justify-between items-center mb-6`}>
                            <Text style={tw`text-xs font-black uppercase text-gray-400 tracking-widest leading-none`}>Activity Momentum</Text>
                            {activePoint && (
                                <Text style={[tw`text-[10px] font-black uppercase tracking-widest leading-none`, { color: theme.primary }]}>
                                    {activePoint.label}: {activePoint.value} Done
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
                                if (periodLabel === 'Week') return true;
                                if (periodLabel === 'Year') return true;
                                if (periodLabel === 'Month') return i % 5 === 0 || i === chartData.length - 1;
                                return true;
                            }).map((d, i) => (
                                <Text key={i} style={tw`text-[9px] font-black text-gray-400 leading-none uppercase`}>
                                    {periodLabel === 'Month' ? (i === 0 ? '1' : d.label) : d.label.substring(0, 3)}
                                </Text>
                            ))}
                        </View>
                    </View>
                </HardShadowCardLocal>
            </View>

            {/* Stats Grid */}
            <View style={tw`gap-3 mb-6`}>
                <HardShadowCardLocal>
                    <View style={tw`p-4 flex-row items-center justify-between`}>
                        <View style={tw`flex-1 pr-4`}>
                            <Text style={tw`text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 leading-none`}>Best Habit This {periodLabel}</Text>
                            <Text style={tw`text-lg font-black text-gray-800`} numberOfLines={1}>{stats.best?.name || "No Data"}</Text>
                        </View>
                        <View style={tw`items-end`}>
                            <Text style={tw`text-xl font-black text-gray-800`}>{stats.best?.value || "-"}</Text>
                            <View style={[tw`mt-1 w-8 h-1.5 rounded-full`, { backgroundColor: theme.primary }]} />
                        </View>
                    </View>
                </HardShadowCardLocal>

                <HardShadowCardLocal>
                    <View style={tw`p-4 flex-row items-center justify-between`}>
                        <View style={tw`flex-1 pr-4`}>
                            <Text style={tw`text-[10px] font-black uppercase text-red-300 tracking-widest mb-1 leading-none`}>Needs Focus This {periodLabel}</Text>
                            <Text style={tw`text-lg font-black text-gray-800`} numberOfLines={1}>{stats.worst?.name || "On Track"}</Text>
                        </View>
                        <View style={tw`items-end`}>
                            <Text style={tw`text-xl font-black text-gray-800`}>{stats.worst?.value || "-"}</Text>
                            <View style={[tw`mt-1 w-8 h-1.5 rounded-full`, { backgroundColor: '#fca5a5' }]} />
                        </View>
                    </View>
                </HardShadowCardLocal>
            </View>

        </View>
    );
};
