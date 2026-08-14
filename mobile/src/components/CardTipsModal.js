import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    Check, Minus, ArrowUpDown, ChevronLeft, ChevronRight, X,
    ClipboardList, BookOpen, CalendarDays, Plus, Target, ListChecks,
    Sparkles, Search, Inbox, Eye, MessageSquare, Bot,
} from 'lucide-react-native';
import tw from 'twrnc';
import { getPalette, readableOn } from '../constants/theme';

// Tips for whatever screen you're on.
//
// This started as the To do / Done / Rest legend pinned along the bottom of the day
// card — a permanent strip explaining three swatches, and nothing else. Every screen
// has controls carrying no label at all: the face icons, the sort cycle, the period
// stepper, the panel tabs, swipe-to-change-day. One `?` in the header, contents
// matched to the current tab.
export const CardTipsModal = ({ visible, onClose, theme, colorMode = 'light', view = 'weekly' }) => {
    const { t } = useTranslation();
    const palette = getPalette(colorMode);
    const accent = theme?.primary || '#C19A9A';
    const muted = palette.textSecondary;

    const Swatch = ({ bg, border, icon }) => (
        <View style={[
            tw`border-[2px] rounded-sm items-center justify-center`,
            { width: 20, height: 20, backgroundColor: bg, borderColor: border },
        ]}>
            {icon}
        </View>
    );

    const Pill = ({ label }) => (
        <View style={[tw`px-1.5 py-0.5 rounded`, { backgroundColor: palette.panelSoftBg }]}>
            <Text style={[tw`text-[8px] font-black uppercase`, { color: muted }]}>{label}</Text>
        </View>
    );

    const Steppers = () => (
        <View style={tw`flex-row items-center`}>
            <ChevronLeft size={13} color={muted} strokeWidth={3} />
            <ChevronRight size={13} color={muted} strokeWidth={3} />
        </View>
    );

    // Each screen's set. `lead` shows the real control, so a row can be matched to the
    // thing on screen without reading the sentence first.
    const SETS = {
        weekly: [
            {
                key: 'sectionHabits',
                fallback: 'Your habits',
                rows: [
                    { key: 'tapOnce', fallback: 'Tap once to complete', lead: <Swatch bg={accent} border={accent} icon={<Check size={11} color={readableOn(accent)} strokeWidth={4} />} /> },
                    { key: 'tapTwice', fallback: 'Tap twice to mark it a rest day', lead: <Swatch bg="#fcd34d" border="#b45309" icon={<Minus size={11} color="#78350f" strokeWidth={4} />} /> },
                    { key: 'tapAgain', fallback: 'Tap again to clear it', lead: <Swatch bg={palette.panelBg} border={accent} icon={null} /> },
                    {
                        key: 'addHabit', fallback: 'Tap Add at the top to create a new habit',
                        lead: (
                            <View style={tw`flex-row items-center`}>
                                <Plus size={14} color={muted} strokeWidth={3} />
                                <Text style={[tw`text-[9px] font-black uppercase ml-0.5`, { color: muted }]}>{t('common.add')}</Text>
                            </View>
                        ),
                    },
                ],
            },
            {
                key: 'sectionAround',
                fallback: 'Getting around',
                rows: [
                    {
                        key: 'switchFaces', fallback: 'The icons along the bottom switch between habits, tasks and journal',
                        lead: (
                            <View style={tw`flex-row items-center gap-0.5`}>
                                <Check size={12} color={accent} strokeWidth={2.5} />
                                <ClipboardList size={12} color={muted} strokeWidth={2} />
                                <BookOpen size={12} color={muted} strokeWidth={2} />
                            </View>
                        ),
                    },
                    { key: 'swipeDays', fallback: 'Swipe the card left or right to move between days', lead: <Steppers /> },
                    { key: 'tapDate', fallback: 'Tap the date to jump to any day', lead: <CalendarDays size={15} color={muted} strokeWidth={2.5} /> },
                    { key: 'sorting', fallback: 'Tap Sort to cycle the order: your own, A–Z, by colour, then unfinished first', lead: <ArrowUpDown size={15} color={muted} strokeWidth={2.5} /> },
                ],
            },
        ],

        dashboard: [
            {
                key: 'analytics.sectionPeriod',
                fallback: 'Choosing a period',
                rows: [
                    { key: 'analytics.periodTabs', fallback: 'Week, Month and Year at the top change how far back you are looking', lead: <Pill label={t('dashboard.weekTab')} /> },
                    { key: 'analytics.stepPeriod', fallback: 'The arrows step back and forward one period at a time', lead: <Steppers /> },
                    { key: 'analytics.tapPeriod', fallback: 'Tap the date in the middle to jump straight to one', lead: <CalendarDays size={15} color={muted} strokeWidth={2.5} /> },
                    { key: 'analytics.swipePeriod', fallback: 'Swiping the card sideways moves a period too', lead: <ArrowUpDown size={15} color={muted} strokeWidth={2.5} style={{ transform: [{ rotate: '90deg' }] }} /> },
                ],
            },
            {
                key: 'analytics.sectionPanels',
                fallback: 'The four panels',
                rows: [
                    {
                        key: 'analytics.panelTabs', fallback: 'The icons at the bottom flip between Score, Timing, Habits and Story',
                        lead: (
                            <View style={tw`flex-row items-center gap-0.5`}>
                                <Target size={11} color={accent} strokeWidth={2.5} />
                                <CalendarDays size={11} color={muted} strokeWidth={2} />
                                <ListChecks size={11} color={muted} strokeWidth={2} />
                                <Sparkles size={11} color={muted} strokeWidth={2} />
                            </View>
                        ),
                    },
                    { key: 'analytics.panelNumbers', fallback: 'Each icon shows that panel\'s headline number, so all four are readable at once', lead: <Target size={15} color={muted} strokeWidth={2.5} /> },
                    { key: 'analytics.tapDay', fallback: 'In Timing, tap a day in the grid to open it', lead: <Eye size={15} color={muted} strokeWidth={2.5} /> },
                ],
            },
        ],

        journal: [
            {
                key: 'review.sectionPages',
                fallback: 'Turning pages',
                rows: [
                    { key: 'review.swipePages', fallback: 'Swipe left or right to flip through your days', lead: <Steppers /> },
                    { key: 'review.tapDate', fallback: 'Tap the date at the top of a page to jump to any day', lead: <CalendarDays size={15} color={muted} strokeWidth={2.5} /> },
                    { key: 'review.readOnly', fallback: 'Pages are a record, so nothing here changes anything', lead: <Eye size={15} color={muted} strokeWidth={2.5} /> },
                    { key: 'review.viewDay', fallback: 'View day opens the card, which is where a day gets written', lead: <BookOpen size={15} color={muted} strokeWidth={2.5} /> },
                ],
            },
            {
                key: 'review.sectionFinding',
                fallback: 'Finding things',
                rows: [
                    { key: 'review.contents', fallback: 'Contents searches your entries, tasks and dates', lead: <Search size={15} color={muted} strokeWidth={2.5} /> },
                    { key: 'review.inbox', fallback: 'Inbox holds tasks with no date yet', lead: <Inbox size={15} color={muted} strokeWidth={2.5} /> },
                ],
            },
        ],

        coach: [
            {
                key: 'coach.section',
                fallback: 'Talking to your coach',
                rows: [
                    { key: 'coach.pickCoach', fallback: 'Pick a coach each day — same data and same insight, only the tone changes', lead: <Bot size={15} color={muted} strokeWidth={2.5} /> },
                    { key: 'coach.suggested', fallback: 'Tap a suggested question to start without typing', lead: <MessageSquare size={15} color={muted} strokeWidth={2.5} /> },
                    { key: 'coach.limit', fallback: 'The counter in the header is how many messages you have left today', lead: <Sparkles size={15} color={muted} strokeWidth={2.5} /> },
                    { key: 'coach.canBeWrong', fallback: 'It reads your habit history to answer, and it can be wrong — treat it as a nudge', lead: <Eye size={15} color={muted} strokeWidth={2.5} /> },
                ],
            },
        ],
    };

    const sections = SETS[view] || SETS.weekly;

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                style={tw`flex-1 items-center justify-center bg-black/50 px-7`}
            >
                {/* Swallows taps so the sheet doesn't close when you touch inside it. */}
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => { }}
                    style={[
                        tw`w-full rounded-3xl border-[3px] overflow-hidden`,
                        { borderColor: palette.outline, backgroundColor: palette.panelBg, maxHeight: '80%' },
                    ]}
                >
                    <View style={[tw`flex-row items-center justify-between px-4 py-3 border-b-[2px]`, { borderColor: palette.divider }]}>
                        <Text style={[tw`text-sm font-black uppercase tracking-widest`, { color: palette.textPrimary }]}>
                            {t('cardTips.title', { defaultValue: 'Tips' })}
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            accessibilityRole="button"
                            accessibilityLabel={t('common.done')}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={[tw`w-8 h-8 rounded-full items-center justify-center`, { backgroundColor: palette.panelSoftBg }]}
                        >
                            <X size={15} color={palette.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {/* Scrolls rather than clipping — on a short screen the last tip would
                        otherwise be cut off with nothing indicating it exists. */}
                    <ScrollView contentContainerStyle={tw`px-4 py-3`} showsVerticalScrollIndicator={false}>
                        {sections.map((section, s) => (
                            <View key={section.key} style={s > 0 && tw`mt-4`}>
                                <Text style={[tw`text-[9px] font-black uppercase tracking-[2px] mb-1`, { color: palette.textMuted }]}>
                                    {t(`cardTips.${section.key}`, { defaultValue: section.fallback })}
                                </Text>
                                {section.rows.map(({ key, fallback, lead }) => (
                                    <View key={key} style={tw`flex-row items-center gap-2 py-2`}>
                                        <View style={tw`w-11 items-center justify-center`}>{lead}</View>
                                        <Text style={[tw`flex-1 text-[13px] font-bold leading-snug`, { color: palette.textPrimary }]}>
                                            {t(`cardTips.${key}`, { defaultValue: fallback })}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </ScrollView>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};
