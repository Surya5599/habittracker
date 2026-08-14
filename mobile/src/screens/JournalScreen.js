import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BookOpen, Search, Inbox, X } from 'lucide-react-native';
import tw from 'twrnc';
import { JournalPage } from '../components/JournalPage';
import { SwipeableCard } from '../components/SwipeableCard';
import { DailyCard } from '../components/DailyCard';
import { DatePickerModal } from '../components/DatePickerModal';
import { MonthlyView } from './MonthlyView';
import { TodoScreen } from './TodoScreen';
import { BOTTOM_NAV_HEIGHT } from '../components/BottomNav';
import { getPalette, alpha } from '../constants/theme';
import { buildJournalPage, findJournalStartKey } from '../utils/journalPage';
import { toDateKey, todayKey, parseDateKey, dateKeyDaysAgo } from '../utils/dateKeys';

// How far the book runs. Forward days exist because tasks can be scheduled ahead.
const MIN_HISTORY_DAYS = 90;
const FUTURE_DAYS = 30;

export const JournalScreen = ({
    habits,
    completions,
    notes,
    theme,
    colorMode = 'light',
    toggleCompletion,
    toggleHabitInactive,
    isHabitInactive,
    updateNote,
    cardStyle = 'large',
    notesWindow,
    bottomNavHeight = BOTTOM_NAV_HEIGHT,
}) => {
    const { t } = useTranslation();
    const palette = getPalette(colorMode);
    const accent = theme?.primary || '#C19A9A';
    const { width: screenWidth } = useWindowDimensions();
    // A full-screen Modal is its own native window, outside MainScreen's SafeAreaView.
    // A SafeAreaView placed inside one re-measures against that window and comes back
    // zero, so the sheet headers ended up under the status bar with the close button
    // unreachable. Use the root provider's numbers as explicit padding instead, and
    // force the modals translucent so the value is always the right one to add —
    // the app is edge-to-edge on Android (app.config.js), so they draw under the bar.
    const insets = useSafeAreaInsets();
    const sheetTopInset = Math.max(insets.top, 12);

    const [showIndex, setShowIndex] = useState(false);
    const [showInbox, setShowInbox] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [editorDate, setEditorDate] = useState(null);
    const [editorView, setEditorView] = useState('journal');
    const [currentKey, setCurrentKey] = useState(todayKey());

    const startKey = useMemo(
        () => findJournalStartKey(notes, completions),
        [notes, completions],
    );

    // The book runs from the first thing ever recorded to a little way ahead — tasks can
    // be scheduled forward, so those pages have to exist.
    const oldestKey = startKey && startKey < dateKeyDaysAgo(MIN_HISTORY_DAYS)
        ? startKey
        : dateKeyDaysAgo(MIN_HISTORY_DAYS);
    const newestKey = useMemo(() => {
        const end = new Date();
        end.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() + FUTURE_DAYS);
        return toDateKey(end);
    }, []);

    const goToKey = useCallback((key) => setCurrentKey(key), []);

    const shiftDay = useCallback((days) => {
        setCurrentKey((key) => {
            const d = parseDateKey(key);
            d.setDate(d.getDate() + days);
            const next = toDateKey(d);
            if (next < oldestKey || next > newestKey) return key;
            return next;
        });
    }, [oldestKey, newestKey]);

    // Flipping back past the loaded notes window would render real days as blank.
    const ensureDate = notesWindow?.ensureDate;
    useEffect(() => {
        if (ensureDate) ensureDate(currentKey);
    }, [ensureDate, currentKey]);

    const openEditor = useCallback((date, view) => {
        setEditorView(view);
        setEditorDate(date);
    }, []);

    const currentDate = useMemo(() => parseDateKey(currentKey), [currentKey]);

    return (
        <View style={[tw`flex-1`, { backgroundColor: palette.pageBg }]}>
            {/* Header: the book's spine controls — jump to today, the index, the inbox. */}
            <View style={[tw`flex-row items-center gap-2 px-4 pt-3 pb-3 border-b`, { backgroundColor: palette.panelBg, borderColor: palette.cardBorder }]}>
                <BookOpen size={20} color={accent} />
                <Text style={[tw`text-lg font-black uppercase tracking-widest flex-1`, { color: palette.textPrimary }]}>
                    {t('journalBook.title', { defaultValue: 'Review' })}
                </Text>

                {currentKey !== todayKey() && (
                    <TouchableOpacity
                        onPress={() => goToKey(todayKey())}
                        accessibilityRole="button"
                        style={[tw`px-2.5 h-9 rounded-xl items-center justify-center`, { backgroundColor: accent + alpha.soft }]}
                    >
                        <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: palette.textPrimary }]}>
                            {t('journalBook.today', { defaultValue: 'Today' })}
                        </Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={() => setShowIndex(true)}
                    accessibilityRole="button"
                    accessibilityLabel={t('journalBook.index', { defaultValue: 'Contents' })}
                    style={[tw`w-9 h-9 rounded-xl items-center justify-center`, { backgroundColor: palette.panelSoftBg }]}
                >
                    <Search size={16} color={palette.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setShowInbox(true)}
                    accessibilityRole="button"
                    accessibilityLabel={t('journalBook.inbox', { defaultValue: 'Inbox' })}
                    style={[tw`w-9 h-9 rounded-xl items-center justify-center`, { backgroundColor: palette.panelSoftBg }]}
                >
                    <Inbox size={16} color={palette.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* One page at a time, on the same gesture as the day card and the analytics
                card. The paged FlatList this replaces tracked the finger but slid flat
                like a carousel, and its feel came from the platform rather than the app —
                three screens, three different swipes. */}
            <SwipeableCard
                style={[tw`flex-1`, { marginBottom: bottomNavHeight }]}
                resetKey={currentKey}
                canPrev={currentKey > oldestKey}
                canNext={currentKey < newestKey}
                onPrev={() => shiftDay(-1)}
                onNext={() => shiftDay(1)}
            >
                <JournalPage
                    page={buildJournalPage({
                        date: currentDate, habits, completions, notes, isHabitInactive, startKey,
                    })}
                    theme={theme}
                    colorMode={colorMode}
                    width={screenWidth}
                    // The page is read-only; "View day" is the only way from it to editing.
                    onPressViewDay={() => openEditor(currentDate, 'habits')}
                    onPressDate={() => setShowDatePicker(true)}
                />
            </SwipeableCard>

            {/* Index — the Logs feed, reused verbatim, as the book's contents. */}
            <Modal
                visible={showIndex}
                animationType="slide"
                statusBarTranslucent
                navigationBarTranslucent
                onRequestClose={() => setShowIndex(false)}
            >
                <View style={[tw`flex-1`, { backgroundColor: palette.pageBg, paddingTop: sheetTopInset }]}>
                    <View style={[tw`flex-row items-center justify-between px-5 py-4 border-b`, { backgroundColor: palette.panelBg, borderColor: palette.cardBorder }]}>
                        <Text style={[tw`text-lg font-black uppercase tracking-widest`, { color: palette.textPrimary }]}>
                            {t('journalBook.index', { defaultValue: 'Contents' })}
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowIndex(false)}
                            accessibilityRole="button"
                            style={[tw`w-9 h-9 rounded-full items-center justify-center`, { backgroundColor: palette.panelSoftBg }]}
                        >
                            <X size={18} color={palette.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <MonthlyView
                        habits={habits}
                        completions={completions}
                        notes={notes}
                        theme={theme}
                        colorMode={colorMode}
                        toggleCompletion={toggleCompletion}
                        toggleHabitInactive={toggleHabitInactive}
                        isHabitInactive={isHabitInactive}
                        updateNote={updateNote}
                        cardStyle={cardStyle}
                        windowStartKey={notesWindow?.startKey}
                        hasMore={!!notesWindow?.hasMore}
                        isLoadingMore={!!notesWindow?.isLoadingMore}
                        onLoadMore={notesWindow?.loadMore}
                        onSearchNotes={notesWindow?.search}
                        isSearchingNotes={!!notesWindow?.isSearching}
                        onEnsureDate={notesWindow?.ensureDate}
                        bottomNavHeight={insets.bottom}
                        // Tapping a result turns the book to that page instead of
                        // opening a second day view on top of this one.
                        onSelectDate={(date) => {
                            setShowIndex(false);
                            goToKey(toDateKey(date));
                        }}
                    />
                </View>
            </Modal>

            {/* Inbox — undated work. Not a page, because it has no date. */}
            <Modal
                visible={showInbox}
                animationType="slide"
                statusBarTranslucent
                navigationBarTranslucent
                onRequestClose={() => setShowInbox(false)}
            >
                <View style={[tw`flex-1`, { backgroundColor: palette.pageBg, paddingTop: sheetTopInset }]}>
                    <View style={[tw`flex-row items-center justify-between px-5 py-4 border-b`, { backgroundColor: palette.panelBg, borderColor: palette.cardBorder }]}>
                        <Text style={[tw`text-lg font-black uppercase tracking-widest`, { color: palette.textPrimary }]}>
                            {t('journalBook.inbox', { defaultValue: 'Inbox' })}
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowInbox(false)}
                            accessibilityRole="button"
                            style={[tw`w-9 h-9 rounded-full items-center justify-center`, { backgroundColor: palette.panelSoftBg }]}
                        >
                            <X size={18} color={palette.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <TodoScreen
                        notes={notes}
                        updateNote={updateNote}
                        theme={theme}
                        colorMode={colorMode}
                        windowStartKey={notesWindow?.startKey}
                        hasMore={!!notesWindow?.hasMore}
                        isLoadingMore={!!notesWindow?.isLoadingMore}
                        onLoadMore={notesWindow?.loadMore}
                        bottomNavHeight={insets.bottom}
                        hideHeader
                    />
                </View>
            </Modal>

            {/* Editing a day still uses the DailyCard — it's the entry surface. */}
            <Modal visible={!!editorDate} transparent animationType="slide" onRequestClose={() => setEditorDate(null)}>
                <View style={tw`flex-1 justify-end bg-black/50`}>
                    <View style={[tw`rounded-t-3xl h-[90%] overflow-hidden px-4 pt-4`, { backgroundColor: palette.pageBg }]}>
                        {editorDate && (
                            <DailyCard
                                date={editorDate}
                                habits={habits}
                                completions={completions}
                                theme={theme}
                                colorMode={colorMode}
                                toggleCompletion={toggleCompletion}
                                toggleHabitInactive={toggleHabitInactive}
                                isHabitInactive={isHabitInactive}
                                onPrev={() => {
                                    const prev = new Date(editorDate);
                                    prev.setDate(prev.getDate() - 1);
                                    setEditorDate(prev);
                                }}
                                onNext={() => {
                                    const next = new Date(editorDate);
                                    next.setDate(next.getDate() + 1);
                                    setEditorDate(next);
                                }}
                                onDateSelect={(d) => setEditorDate(d)}
                                dayData={notes?.[toDateKey(editorDate)] || {}}
                                dateKey={toDateKey(editorDate)}
                                updateNote={updateNote}
                                cardStyle={cardStyle}
                                initialView={editorView}
                            />
                        )}
                        <TouchableOpacity
                            onPress={() => { const d = editorDate; setEditorDate(null); if (d) goToKey(toDateKey(d)); }}
                            accessibilityRole="button"
                            style={[tw`my-3 py-3 rounded-2xl items-center`, { backgroundColor: palette.panelBg, borderWidth: 1, borderColor: palette.cardBorder }]}
                        >
                            <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: palette.textSecondary }]}>
                                {t('journalBook.backToPage', { defaultValue: 'Back to page' })}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <DatePickerModal
                isVisible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onSelect={(date) => { setShowDatePicker(false); goToKey(toDateKey(date)); }}
                selectedDate={currentDate}
                theme={theme}
                colorMode={colorMode}
            />
        </View>
    );
};
