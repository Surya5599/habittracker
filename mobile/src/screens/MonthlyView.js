import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, FlatList, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { ChevronRight, X, Meh, Search, CheckSquare, BookOpen, ScrollText, Check } from 'lucide-react-native';
import { isCompleted as checkCompleted } from '../utils/stats';
import { DailyCard } from '../components/DailyCard';
import { MOODS } from '../constants';
import { dayMood } from '../utils/mood';
import { BACKLOG_KEY, isDateKey, todayKey, toDateKey, parseDateKey, parseDateStringLocal } from '../utils/dateKeys';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { BOTTOM_NAV_HEIGHT } from '../components/BottomNav';
import { getPalette, alpha } from '../constants/theme';

const SEARCH_DEBOUNCE_MS = 350;

// "Habits 3/5" under a journal entry. A finished count goes full-contrast so a
// complete day is legible at a glance without needing a colour to carry it.
const MetaStat = ({ icon: Icon, label, done, total, mutedColor, valueColor, doneColor }) => {
    const complete = total > 0 && done === total;
    const labelColor = complete ? doneColor : mutedColor;
    return (
        <View style={tw`flex-row items-center gap-1.5`}>
            <Icon size={11} color={labelColor} strokeWidth={2.5} />
            <Text style={[tw`text-[9px] font-black uppercase tracking-widest`, { color: labelColor }]}>{label}</Text>
            <Text style={[tw`text-[10px] font-black`, { color: complete ? doneColor : valueColor }]}>
                {done}/{total}
            </Text>
        </View>
    );
};

export const MonthlyView = ({
    habits,
    completions,
    notes,
    theme,
    toggleCompletion,
    toggleHabitInactive,
    isHabitInactive,
    updateNote,
    colorMode = 'light',
    cardStyle = 'large',
    initialSelectedDate = null,
    // Paging window from useDailyNotes — older logs load as the list is scrolled.
    windowStartKey = null,
    hasMore = false,
    isLoadingMore = false,
    onLoadMore,
    onSearchNotes,
    isSearchingNotes = false,
    onEnsureDate,
    bottomNavHeight = BOTTOM_NAV_HEIGHT,
    // When the Journal uses this screen as its index, a result should turn the book to
    // that page rather than stack a second day view on top of it.
    onSelectDate = null,
}) => {
    const { t, i18n } = useTranslation();
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedFocusView, setSelectedFocusView] = useState('habits');
    const [searchQuery, setSearchQuery] = useState('');

    const openDateCard = (date, focusView) => {
        if (onSelectDate) { onSelectDate(date, focusView); return; }
        setSelectedFocusView(focusView);
        setSelectedDate(date);
    };

    // The day-detail card can be paged back past the loaded window; make sure the
    // date being viewed is actually fetched.
    useEffect(() => {
        if (!selectedDate || !onEnsureDate) return;
        onEnsureDate(toDateKey(selectedDate));
    }, [selectedDate, onEnsureDate]);

    useEffect(() => {
        if (!initialSelectedDate) return;
        const d = new Date(initialSelectedDate);
        if (Number.isNaN(d.getTime())) return;
        setSelectedDate(d);
    }, [initialSelectedDate]);

    const normalizedQuery = searchQuery.trim().toLowerCase();

    // Ask the server for matches outside the loaded window so searching isn't
    // limited to whatever has been paged in. Results land in `notes`.
    useEffect(() => {
        if (!onSearchNotes || normalizedQuery.length < 2) return;
        const timer = setTimeout(() => { onSearchNotes(normalizedQuery); }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [normalizedQuery, onSearchNotes]);

    const {
        pageBg, panelBg, panelSoftBg, cardBorder: panelBorder, divider,
        textPrimary, textSecondary, textMuted,
    } = getPalette(colorMode);
    const accent = theme?.primary || '#C19A9A';

    // Newest-first candidate dates. Normally the loaded window; while searching,
    // every date we hold a note for, so server matches from older months show up.
    const days = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = todayKey();
        const keys = new Set();

        const oldest = windowStartKey || toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29));
        const cursor = new Date(today);
        while (toDateKey(cursor) >= oldest) {
            keys.add(toDateKey(cursor));
            cursor.setDate(cursor.getDate() - 1);
        }

        if (normalizedQuery.length >= 2) {
            Object.keys(notes || {}).forEach((key) => {
                if (key === BACKLOG_KEY || !isDateKey(key) || key > todayStr) return;
                keys.add(key);
            });
        }

        return Array.from(keys).sort((a, b) => b.localeCompare(a)).map(parseDateKey);
    }, [normalizedQuery, notes, windowStartKey]);

    const isHabitStartedByDate = (habit, date) => {
        if (!habit?.createdAt) return true;
        const createdDate = parseDateStringLocal(habit.createdAt);
        if (!createdDate) return true;
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);
        return target >= createdDate;
    };

    // This screen is a journal reader first: one row per written entry, newest first,
    // with that day's habit/task numbers attached as a compact meta strip. Days with
    // no writing stay out of the default feed — they surface only as search hits.
    const rows = useMemo(() => {
        const summarize = (date) => {
            const dateKey = toDateKey(date);
            const dayData = notes?.[dateKey] || {};

            const dailyDue = habits.filter(h =>
                isHabitStartedByDate(h, date) &&
                !h.weeklyTarget &&
                (!h.frequency || h.frequency.includes(date.getDay())) &&
                !(isHabitInactive && isHabitInactive(h.id, dateKey))
            );
            const flexibleDone = habits.filter(h =>
                isHabitStartedByDate(h, date) &&
                h.weeklyTarget &&
                checkCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear())
            );
            // Only id and done are needed: habits contribute the "Habits 3/5" count but
            // are deliberately not searchable, so the name never leaves this scope.
            const habitActivity = [...dailyDue, ...flexibleDone].map(h => ({
                id: h.id,
                done: checkCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear()),
            }));
            const habitsDone = habitActivity.filter(h => h.done).length;

            const tasks = Array.isArray(dayData.tasks) ? dayData.tasks : [];
            const tasksDone = tasks.filter(task => task.completed).length;

            const entries = Array.isArray(dayData.journal)
                ? dayData.journal
                : (dayData.journal ? [{ id: 'legacy', text: dayData.journal, mood: dayData.mood }] : []);
            const written = entries.filter(e => (e.text || '').trim());
            // Averaged across the day’s entries — see utils/mood.
            const mood = dayMood(written, dayData.mood);

            const dateLabel = date.toLocaleDateString(i18n.language, {
                weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
            });

            return {
                date,
                dateKey,
                habitActivity,
                habitsDone,
                tasks,
                tasksDone,
                entries: written,
                mood,
                dateLabel: dateLabel.toLowerCase(),
                // Journal text, task text, and the date — habit names are excluded on
                // purpose. Habits are due on most days, so matching their names turned a
                // search into a wall of days that had nothing to do with what you typed.
                searchBlob: [
                    dateLabel,
                    written.map(e => e.text || '').join(' '),
                    tasks.map(task => task.text || '').join(' '),
                ].join(' ').toLowerCase(),
            };
        };

        const out = [];
        days.forEach((date) => {
            const day = summarize(date);
            if (normalizedQuery && !day.searchBlob.includes(normalizedQuery)) return;

            const base = {
                date: day.date,
                dateKey: day.dateKey,
                habitActivity: day.habitActivity,
                habitsDone: day.habitsDone,
                tasks: day.tasks,
                tasksDone: day.tasksDone,
                dayMood: day.mood,
            };

            if (day.entries.length === 0) {
                // No writing. Only worth a row when the query matched a task or the date.
                if (normalizedQuery) {
                    out.push({
                        ...base,
                        key: `${day.dateKey}-day`,
                        entry: null,
                        showMeta: true,
                        // Say what matched, or the row is an unexplained result.
                        matchTaskText: day.tasks.find(tk => (tk.text || '').toLowerCase().includes(normalizedQuery))?.text || '',
                    });
                }
                return;
            }

            // When a query matches specific entries, show just those; when it matched
            // the day some other way (a task, a habit, the date), show the whole day.
            const textHits = normalizedQuery
                ? day.entries.filter(e => (e.text || '').toLowerCase().includes(normalizedQuery))
                : day.entries;
            const shown = textHits.length > 0 ? textHits : day.entries;

            shown.forEach((entry, i) => {
                out.push({
                    ...base,
                    key: `${day.dateKey}-${entry.id || i}`,
                    entry,
                    // Repeating the day's counts on every entry of one day is noise.
                    showMeta: i === 0,
                });
            });
        });
        return out;
    }, [days, habits, completions, isHabitInactive, notes, normalizedQuery, i18n.language]);

    const handleEndReached = useCallback(() => {
        if (hasMore && !isLoadingMore && onLoadMore) onLoadMore();
    }, [hasMore, isLoadingMore, onLoadMore]);

    const listFooter = () => {
        if (isLoadingMore) {
            return (
                <View style={tw`py-6 items-center`}>
                    <ActivityIndicator size="small" color={accent} />
                </View>
            );
        }
        if (hasMore) {
            return (
                <TouchableOpacity
                    onPress={onLoadMore}
                    style={[tw`mx-4 mt-4 py-3 rounded-2xl border items-center`, { borderColor: panelBorder, backgroundColor: panelBg }]}
                >
                    <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: textSecondary }]}>
                        {t('monthlyView.loadOlder', { defaultValue: 'Load older logs' })}
                    </Text>
                </TouchableOpacity>
            );
        }
        if (windowStartKey) {
            const since = parseDateKey(windowStartKey).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' });
            return (
                <Text style={[tw`text-[10px] font-bold text-center mt-4 px-6`, { color: textMuted }]}>
                    {t('monthlyView.allLoaded', { defaultValue: 'History loaded back to {{date}}', date: since })}
                </Text>
            );
        }
        return null;
    };

    const emptyState = (
        <View style={tw`px-4 pt-3`}>
            {isSearchingNotes ? (
                <View style={tw`py-8 items-center`}>
                    <ActivityIndicator size="small" color={accent} />
                </View>
            ) : (
                <View style={[
                    tw`rounded-2xl border items-center px-6 py-8`,
                    { backgroundColor: panelBg, borderColor: panelBorder },
                ]}>
                    <View style={[tw`w-11 h-11 rounded-2xl items-center justify-center`, { backgroundColor: accent + alpha.soft }]}>
                        <ScrollText size={20} color={textPrimary} />
                    </View>
                    <Text style={[tw`mt-3 text-[11px] font-black uppercase tracking-widest text-center`, { color: textPrimary }]}>
                        {normalizedQuery
                            ? t('monthlyView.noResultsTitle', { defaultValue: 'No matches' })
                            : t('monthlyView.emptyTitle', { defaultValue: 'Nothing written yet' })}
                    </Text>
                    <Text style={[tw`mt-1.5 text-xs font-bold leading-snug text-center`, { color: textMuted }]}>
                        {normalizedQuery
                            ? t('monthlyView.noResultsBody', { defaultValue: 'Search covers journal entries, tasks, and dates like "Aug 3".' })
                            : t('monthlyView.emptyBody', { defaultValue: 'Journal entries you write on the day card collect here, newest first, ready to read back.' })}
                    </Text>
                </View>
            )}
        </View>
    );

    const renderRow = useCallback(({ item: row }) => {
        const { date, entry, showMeta, habitActivity, habitsDone, tasks, tasksDone, dayMood } = row;
        const dayName = date.toLocaleDateString(i18n.language, { weekday: 'short' });
        const dayNum = date.getDate();
        const monthName = date.toLocaleDateString(i18n.language, { month: 'short' });

        const mood = entry?.mood ?? dayMood;
        const moodObj = mood ? MOODS.find(m => m.value === mood) : null;
        const MoodIcon = moodObj?.icon || Meh;
        const moodColor = moodObj?.color || textMuted;

        const hasHabits = habitActivity.length > 0;
        const hasTasks = tasks.length > 0;
        // Meta is a footnote under an entry, but it's the whole point of a search hit
        // that has no writing on it.
        const showMetaStrip = showMeta && (hasHabits || hasTasks);

        return (
            <TouchableOpacity
                onPress={() => openDateCard(date, entry ? 'journal' : hasTasks ? 'tasks' : 'habits')}
                style={[
                    tw`mx-4 mt-3 border rounded-2xl p-3.5 flex-row items-center`,
                    { backgroundColor: panelBg, borderColor: moodObj ? moodColor : panelBorder },
                ]}
                activeOpacity={0.7}
                accessibilityRole="button"
            >
                <View style={[
                    tw`mr-3 w-[44px] rounded-xl border py-2 items-center`,
                    {
                        backgroundColor: moodObj ? moodColor + '18' : panelSoftBg,
                        borderColor: moodObj ? moodColor : panelBorder,
                    },
                ]}>
                    <Text style={[tw`text-[9px] font-black uppercase`, { color: moodObj ? moodColor : accent }]} numberOfLines={1}>{dayName}</Text>
                    <Text style={[tw`text-xl font-black leading-tight`, { color: textPrimary }]}>{dayNum}</Text>
                    <Text style={[tw`text-[9px] font-black uppercase`, { color: textMuted }]} numberOfLines={1}>{monthName}</Text>
                </View>

                <View style={[
                    tw`flex-1 border-l pl-3.5 py-0.5 min-h-[40px] justify-center`,
                    { borderColor: moodObj ? moodColor + alpha.strong : divider },
                ]}>
                    {/* The entry itself — the thing you came here to read. */}
                    {entry ? (
                        <View style={tw`flex-row items-start gap-2`}>
                            <View style={[tw`rounded-full p-1 mt-0.5`, { backgroundColor: moodColor + '22' }]}>
                                <MoodIcon size={14} color={moodColor} strokeWidth={moodObj ? 2.5 : 2} />
                            </View>
                            <Text
                                style={[tw`flex-1 text-sm font-bold leading-snug`, { color: textSecondary }]}
                                numberOfLines={4}
                            >
                                {entry.text}
                            </Text>
                        </View>
                    ) : row.matchTaskText ? (
                        <View style={tw`flex-row items-center gap-2`}>
                            <CheckSquare size={13} color={textMuted} strokeWidth={2.5} />
                            <Text style={[tw`flex-1 text-sm font-bold`, { color: textSecondary }]} numberOfLines={2}>
                                {row.matchTaskText}
                            </Text>
                        </View>
                    ) : (
                        <View style={tw`flex-row items-center gap-2`}>
                            <BookOpen size={13} color={textMuted} strokeWidth={2.5} />
                            <Text style={[tw`text-xs font-bold italic`, { color: textMuted }]}>
                                {t('monthlyView.noEntry', { defaultValue: 'No entry written' })}
                            </Text>
                        </View>
                    )}

                    {showMetaStrip && (
                        <View style={[
                            tw`flex-row items-center flex-wrap gap-x-4 gap-y-1 mt-2 pt-2`,
                            { borderTopWidth: 1, borderTopColor: divider },
                        ]}>
                            {hasHabits && (
                                <MetaStat
                                    icon={Check}
                                    label={t('monthlyView.habits', { defaultValue: 'Habits' })}
                                    done={habitsDone}
                                    total={habitActivity.length}
                                    mutedColor={textMuted}
                                    valueColor={textSecondary}
                                    doneColor={textPrimary}
                                />
                            )}
                            {hasTasks && (
                                <MetaStat
                                    icon={CheckSquare}
                                    label={t('bottomNav.todo', { defaultValue: 'To-Do' })}
                                    done={tasksDone}
                                    total={tasks.length}
                                    mutedColor={textMuted}
                                    valueColor={textSecondary}
                                    doneColor={textPrimary}
                                />
                            )}
                        </View>
                    )}
                </View>

                <View style={tw`ml-2`}>
                    <ChevronRight size={18} color={textMuted} strokeWidth={3} />
                </View>
            </TouchableOpacity>
        );
    }, [accent, divider, i18n.language, panelBg, panelBorder, panelSoftBg, t, textMuted, textPrimary, textSecondary]);

    return (
        <ScreenScaffold
            colorMode={colorMode}
            theme={theme}
            title={t('monthlyView.title', { defaultValue: 'Logs' })}
            icon={ScrollText}
            count={rows.length}
            bottomNavHeight={bottomNavHeight}
            // The old Journals/Habits/Tasks segments are gone — the feed is the journal,
            // and search reaches tasks and habits too.
            headerExtra={(
                <View style={[tw`flex-row items-center rounded-xl border px-3`, { borderColor: panelBorder, backgroundColor: panelSoftBg }]}>
                    <Search size={14} color={textMuted} />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={t('monthlyView.searchPlaceholder')}
                        placeholderTextColor={textMuted}
                        style={[tw`flex-1 ml-2 py-2.5 text-sm font-bold`, { color: textPrimary }]}
                    />
                    {isSearchingNotes && <ActivityIndicator size="small" color={accent} />}
                    {searchQuery.length > 0 && !isSearchingNotes && (
                        <TouchableOpacity
                            onPress={() => setSearchQuery('')}
                            accessibilityRole="button"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={tw`p-1`}
                        >
                            <X size={14} color={textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        >
            {({ contentBottomInset }) => (
                <>
            <FlatList
                data={rows}
                keyExtractor={(row) => row.key}
                renderItem={renderRow}
                contentContainerStyle={{ paddingTop: 8, paddingBottom: contentBottomInset }}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={7}
                onEndReachedThreshold={0.4}
                onEndReached={handleEndReached}
                ListEmptyComponent={emptyState}
                ListFooterComponent={listFooter}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            />

            {/* Day detail */}
            <Modal
                visible={!!selectedDate}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectedDate(null)}
            >
                <View style={tw`flex-1 justify-end bg-black/50`}>
                    <View style={[tw`rounded-t-3xl h-[90%] overflow-hidden`, { backgroundColor: pageBg }]}>
                        {/* Modal Header */}
                        <View style={[tw`p-5 border-b flex-row items-center justify-between`, { backgroundColor: panelBg, borderColor: panelBorder }]}>
                            <Text style={[tw`text-xl font-black uppercase tracking-widest`, { color: textPrimary }]}>{t('monthlyView.dayDetails')}</Text>
                            <TouchableOpacity
                                onPress={() => setSelectedDate(null)}
                                style={[tw`p-2 rounded-full`, { backgroundColor: panelSoftBg }]}
                            >
                                <X size={20} color={textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                            {selectedDate && (
                                <View style={tw`px-4 pt-4`}>
                                    <DailyCard
                                        date={selectedDate}
                                        habits={habits}
                                        completions={completions}
                                        theme={theme}
                                        colorMode={colorMode}
                                        toggleCompletion={toggleCompletion}
                                        toggleHabitInactive={toggleHabitInactive}
                                        isHabitInactive={isHabitInactive}
                                        onPrev={() => {
                                            const prev = new Date(selectedDate);
                                            prev.setDate(prev.getDate() - 1);
                                            setSelectedDate(prev);
                                        }}
                                        onNext={() => {
                                            const next = new Date(selectedDate);
                                            next.setDate(next.getDate() + 1);
                                            setSelectedDate(next);
                                        }}
                                        onDateSelect={(d) => setSelectedDate(d)}
                                        dayData={notes?.[toDateKey(selectedDate)] || {}}
                                        dateKey={toDateKey(selectedDate)}
                                        updateNote={updateNote}
                                        cardStyle={cardStyle}
                                        initialView={selectedFocusView}
                                    />
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
                </>
            )}
        </ScreenScaffold>
    );
};
