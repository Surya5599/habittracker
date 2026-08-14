import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import tw from 'twrnc';
import { MOODS } from '../constants';
import { getPalette, alpha } from '../constants/theme';

// A page is a log of the day, not a control panel — nothing here edits anything.
// Habits read as a verdict (ring, headline, count) and tasks as a sentence about what
// the day did or didn't get through. The one door out is "View day", which opens the
// card where a day is actually written.

const MOOD_LABEL_KEYS = { 1: 'veryBad', 2: 'bad', 3: 'okay', 4: 'good', 5: 'veryGood' };

// The reference for this page is handwritten. Without shipping a font file, a serif
// italic at a generous line height is the closest honest approximation.
const ENTRY_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const BindingEdge = ({ id, primary, secondary }) => (
    <View style={{ width: 12 }}>
        <Svg width="100%" height="100%">
            <Defs>
                <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={primary} />
                    <Stop offset="1" stopColor={secondary} />
                </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
    </View>
);

const ProgressRing = ({ pct, size = 68, stroke = 7, color, track, children }) => {
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.max(0, Math.min(100, pct || 0)) / 100) * circumference;
    return (
        <View style={tw`items-center justify-center`}>
            <Svg width={size} height={size}>
                <Circle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={stroke} fill="none" />
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            {children != null && (
                <View style={tw`absolute items-center justify-center`}>{children}</View>
            )}
        </View>
    );
};

const CardLabel = ({ children, color }) => (
    <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color }]}>{children}</Text>
);

export const JournalPage = ({
    page,
    theme,
    colorMode = 'light',
    width,
    onPressViewDay,
    onPressDate,
}) => {
    const { t, i18n } = useTranslation();
    const palette = getPalette(colorMode);
    const accent = theme?.primary || '#C19A9A';
    const secondary = theme?.secondary || accent;

    // The day's averaged mood, shown in the ring. Individual entries carry their own.
    const moodObj = page.mood ? MOODS.find(m => m.value === page.mood) : null;
    const MoodIcon = moodObj?.icon;
    const anyEntryMood = page.entries.some(entry => Number.isFinite(entry.mood));

    const weekday = page.date.toLocaleDateString(i18n.language, { weekday: 'long' });
    const fullDate = page.date.toLocaleDateString(i18n.language, {
        day: 'numeric', month: 'long', year: 'numeric',
    });
    const shortDate = page.date.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

    // Locale-aware, so 24-hour locales don't get an AM/PM suffix bolted on.
    const formatTime = (timestamp) => {
        const d = new Date(timestamp);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
    };

    const verdictText = t(`journalBook.verdict.${page.verdict}`, {
        defaultValue: {
            great: 'Great day!', good: 'Good day', steady: 'Steady day',
            slow: 'Slow day', rest: 'Rest day', blank: 'Nothing logged',
        }[page.verdict],
    });
    // A weak day shouldn't be dressed in the accent as if it were a win.
    const verdictTone = ['great', 'good'].includes(page.verdict) ? accent
        : page.verdict === 'steady' ? secondary
            : palette.textMuted;

    const softCard = [
        tw`rounded-2xl p-4`,
        { backgroundColor: palette.panelSoftBg },
    ];

    return (
        <View style={[tw`flex-1 px-3 pt-2 pb-2`, { width }]}>
            <View style={[
                tw`flex-1 flex-row rounded-3xl border-[3px] overflow-hidden`,
                { borderColor: palette.outline, backgroundColor: palette.panelBg },
            ]}>
                <BindingEdge id={`edge-${page.dateKey}`} primary={accent} secondary={secondary} />

                <View style={tw`flex-1`}>
                    {/* Running head — fixed, so the date stays put while the day scrolls. */}
                    <TouchableOpacity
                        onPress={onPressDate}
                        disabled={!onPressDate}
                        accessibilityRole="button"
                        accessibilityLabel={fullDate}
                        style={[tw`px-4 pt-4 pb-3 border-b`, { borderColor: palette.divider }]}
                    >
                        <Text style={[tw`text-[10px] font-black uppercase tracking-[3px]`, { color: palette.textMuted }]}>
                            {weekday}
                        </Text>
                        <Text style={[tw`text-xl font-black uppercase tracking-tight mt-0.5`, { color: palette.textPrimary }]}>
                            {fullDate}
                        </Text>
                    </TouchableOpacity>

                    <ScrollView
                        style={tw`flex-1`}
                        contentContainerStyle={tw`px-4 pt-4 pb-5`}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* The day's verdict. Habits are reported here, not checked. */}
                        <View style={[tw`rounded-2xl p-4 flex-row items-center`, { backgroundColor: verdictTone + alpha.faint }]}>
                            {/* The ring says how much of the day got done; its centre says
                                how the day felt. On a day with no mood recorded the
                                percentage goes there instead, so the middle is never a
                                hole. */}
                            <ProgressRing
                                pct={page.completionPct ?? 0}
                                color={verdictTone}
                                track={palette.divider}
                            >
                                {moodObj ? (
                                    <MoodIcon size={26} color={moodObj.color} strokeWidth={2.5} />
                                ) : page.completionPct !== null ? (
                                    <Text style={[tw`text-sm font-black`, { color: palette.textPrimary }]}>
                                        {page.completionPct}%
                                    </Text>
                                ) : null}
                            </ProgressRing>
                            <View style={tw`flex-1 ml-4`}>
                                <Text style={[tw`text-base font-black`, { color: palette.textPrimary }]}>
                                    {verdictText}
                                </Text>
                                <Text style={[tw`text-xs font-bold mt-0.5`, { color: palette.textSecondary }]}>
                                    {page.habitsTotal > 0
                                        ? t('journalBook.habitsCompleted', {
                                            defaultValue: '{{done}} of {{total}} habits completed',
                                            done: page.habitsDone,
                                            total: page.habitsTotal,
                                        })
                                        : t('journalBook.noHabitsDue', { defaultValue: 'No habits due' })}
                                </Text>
                                {/* Only when the day actually had tasks — a line saying there
                                    were none is noise in a summary, and the tasks card below
                                    already states it. */}
                                {page.tasksTotal > 0 && (
                                    <Text style={[tw`text-xs font-bold mt-0.5`, { color: palette.textSecondary }]}>
                                        {t('journalBook.tasksCompleted', {
                                            defaultValue: '{{done}} of {{total}} tasks completed',
                                            done: page.tasksDone,
                                            total: page.tasksTotal,
                                        })}
                                    </Text>
                                )}
                                {onPressViewDay && (
                                    <TouchableOpacity
                                        onPress={onPressViewDay}
                                        accessibilityRole="button"
                                        style={[
                                            tw`mt-3 self-start flex-row items-center gap-1 px-3 h-9 rounded-full`,
                                            { backgroundColor: palette.panelBg },
                                        ]}
                                    >
                                        <Text style={[tw`text-[11px] font-black`, { color: palette.textPrimary }]}>
                                            {t('journalBook.viewDay', { defaultValue: 'View day' })}
                                        </Text>
                                        <ChevronRight size={13} color={palette.textPrimary} strokeWidth={3} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* The entry — the reason the page exists, so it gets the most room.
                            Mood is per entry here rather than one figure for the card: a day
                            can turn, and averaging that away loses the shape of it. The
                            averaged mood still lives in the ring above. */}
                        <View style={[softCard, tw`mt-3`]}>
                            <View style={tw`flex-row items-center justify-between`}>
                                <CardLabel color={palette.textMuted}>
                                    {page.isToday
                                        ? t('journalBook.todaysJournal', { defaultValue: "Today's journal" })
                                        : t('journal.title')}
                                </CardLabel>
                                {page.entries.length > 0 && (
                                    <Text style={[tw`text-[10px] font-black ml-2`, { color: palette.textMuted }]}>
                                        {page.entries.length === 1
                                            ? t('journalBook.oneEntry', { defaultValue: '1 entry' })
                                            : t('journalBook.entryCount', {
                                                defaultValue: '{{count}} entries',
                                                count: page.entries.length,
                                            })}
                                    </Text>
                                )}
                            </View>
                            <View style={tw`mt-2`}>
                                {page.entries.length === 0 ? (
                                    <Text style={[tw`text-xs font-bold italic py-1`, { color: palette.textMuted }]}>
                                        {t('journalBook.noEntry', { defaultValue: 'Nothing written' })}
                                    </Text>
                                ) : (
                                    page.entries.map((entry, i) => {
                                        const entryMood = MOODS.find(m => m.value === entry.mood);
                                        const EntryMoodIcon = entryMood?.icon;
                                        return (
                                            <View
                                                key={entry.id || i}
                                                style={[tw`flex-row items-start`, i > 0 && tw`mt-3`]}
                                            >
                                                {/* The gutter is reserved for every entry once any
                                                    of them has a mood, so the text keeps one left
                                                    edge instead of stepping in and out. */}
                                                {anyEntryMood && (
                                                    <View style={[tw`items-center`, { width: 20, paddingTop: 1 }]}>
                                                        {EntryMoodIcon && (
                                                            <EntryMoodIcon
                                                                size={15}
                                                                color={entryMood.color}
                                                                strokeWidth={2.5}
                                                                accessibilityLabel={t(
                                                                    `dailyCard.moods.${MOOD_LABEL_KEYS[entryMood.value]}`,
                                                                    { defaultValue: entryMood.label },
                                                                )}
                                                            />
                                                        )}
                                                    </View>
                                                )}
                                                <View style={[tw`flex-1`, anyEntryMood && tw`ml-1.5`]}>
                                                    {/* Entries written before createdAt existed
                                                        have no timestamp; those just start at
                                                        the text. */}
                                                    {entry.createdAt && (
                                                        <Text style={[tw`text-[9px] font-black uppercase tracking-[2px] mb-0.5`, { color: palette.textMuted }]}>
                                                            {formatTime(entry.createdAt)}
                                                        </Text>
                                                    )}
                                                    <Text
                                                        style={{
                                                            color: palette.textPrimary,
                                                            fontFamily: ENTRY_FONT,
                                                            fontStyle: 'italic',
                                                            fontSize: 15,
                                                            lineHeight: 26,
                                                        }}
                                                    >
                                                        {entry.text}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })
                                )}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Folio — fixed to the foot of the page. */}
                    <View style={[tw`flex-row items-center justify-between px-4 pt-2 pb-3`, { borderTopWidth: 1, borderTopColor: palette.divider }]}>
                        <Text style={[tw`text-[9px] font-black uppercase tracking-[2px]`, { color: palette.textMuted }]}>
                            {page.dayNumber
                                ? t('journalBook.dayNumber', { defaultValue: 'Day {{n}}', n: page.dayNumber })
                                : ''}
                        </Text>
                        <Text style={[tw`text-[9px] font-black uppercase tracking-[2px]`, { color: palette.textMuted }]}>
                            {shortDate}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};
