import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
    View, Text, SectionList, TouchableOpacity, TextInput,
    Platform, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X, Plus, CalendarPlus, Inbox, CalendarClock, ListTodo, Check } from 'lucide-react-native';
import tw from 'twrnc';
import { DatePickerModal } from '../components/DatePickerModal';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { BOTTOM_NAV_HEIGHT } from '../components/BottomNav';
import { getPalette, alpha } from '../constants/theme';
import { BACKLOG_KEY, todayKey, parseDateKey } from '../utils/dateKeys';

// Tapping the checkbox holds the checked state briefly so the tap registers
// visually before the row drops out of the list.
const COMPLETE_FEEDBACK_MS = 180;

const dayAge = (dateKey) => {
    const then = parseDateKey(dateKey);
    then.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((now - then) / 86400000));
};

export const TodoScreen = ({
    notes = {},
    updateNote,
    theme,
    colorMode = 'light',
    // Paging window from useDailyNotes — older tasks load as the list is scrolled.
    windowStartKey = null,
    hasMore = false,
    isLoadingMore = false,
    onLoadMore,
    bottomNavHeight = BOTTOM_NAV_HEIGHT,
    // The Journal renders this inside its own titled Inbox sheet, so the screen's
    // title row would be a second heading.
    hideHeader = false,
}) => {
    const { t, i18n } = useTranslation();
    const isDark = colorMode === 'dark';
    const [newText, setNewText] = useState('');
    const [schedulingTask, setSchedulingTask] = useState(null);
    const [scope, setScope] = useState('all'); // 'all' | 'overdue' | 'backlog'
    const [completing, setCompleting] = useState({});
    const completeTimers = useRef([]);
    // The completion write happens a beat after the tap, so read notes through a ref
    // rather than the snapshot captured when the row was rendered.
    const notesRef = useRef(notes);
    notesRef.current = notes;

    const {
        panelBg, panelSoftBg, cardBorder, divider,
        textPrimary, textSecondary, textMuted, warn: warnColor,
    } = getPalette(colorMode);
    const accent = theme?.primary || '#C19A9A';
    const warnTint = warnColor + (isDark ? '1a' : alpha.faint);

    useEffect(() => () => completeTimers.current.forEach(clearTimeout), []);

    const backlogTasks = notes?.[BACKLOG_KEY]?.tasks || [];

    // Only walk the loaded window instead of all history: the newest overdue days
    // come first, and older ones arrive as `windowStartKey` moves back.
    const overdueGroups = useMemo(() => {
        const todayStr = todayKey();
        const groups = new Map();
        Object.entries(notes || {}).forEach(([key, data]) => {
            if (key === BACKLOG_KEY || key >= todayStr) return;
            if (windowStartKey && key < windowStartKey) return;
            const open = (data?.tasks || []).filter(task => !task.completed);
            if (open.length === 0) return;
            groups.set(key, open.map(task => ({ ...task, fromDate: key })));
        });
        return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
    }, [notes, windowStartKey]);

    const manualBacklog = useMemo(() => {
        const seen = new Set();
        return backlogTasks.filter(task => {
            if (task.completed || seen.has(task.id)) return false;
            seen.add(task.id);
            return true;
        });
    }, [backlogTasks]);

    const overdueCount = overdueGroups.reduce((n, [, tasks]) => n + tasks.length, 0);
    const totalCount = overdueCount + manualBacklog.length;

    const sections = useMemo(() => {
        const overdue = overdueGroups.map(([dateKey, tasks]) => ({
            key: `overdue-${dateKey}`,
            kind: 'overdue',
            dateKey,
            data: tasks,
        }));
        const backlog = { key: 'backlog', kind: 'backlog', dateKey: null, data: manualBacklog };
        // An empty `sections` is what lets ListEmptyComponent through, so collapse to
        // it whenever the current scope has nothing at all to show.
        if (scope === 'overdue') return overdue;
        if (scope === 'backlog') return manualBacklog.length > 0 ? [backlog] : [];
        if (totalCount === 0) return [];
        return [...overdue, backlog];
    }, [overdueGroups, manualBacklog, scope, totalCount]);

    const handleAddTask = () => {
        if (!newText.trim()) return;
        const task = { id: Date.now().toString(), text: newText.trim(), completed: false };
        updateNote && updateNote(BACKLOG_KEY, { tasks: [...backlogTasks, task] });
        setNewText('');
    };

    const commitComplete = useCallback((task) => {
        const key = task.fromDate || BACKLOG_KEY;
        const current = notesRef.current?.[key]?.tasks || [];
        updateNote && updateNote(key, {
            tasks: current.map(t2 => t2.id === task.id ? { ...t2, completed: true } : t2),
        });
    }, [updateNote]);

    const handleComplete = useCallback((task) => {
        setCompleting(prev => (prev[task.id] ? prev : { ...prev, [task.id]: true }));
        const timer = setTimeout(() => {
            commitComplete(task);
            setCompleting(prev => {
                if (!prev[task.id]) return prev;
                const next = { ...prev };
                delete next[task.id];
                return next;
            });
        }, COMPLETE_FEEDBACK_MS);
        completeTimers.current.push(timer);
    }, [commitComplete]);

    const handleDelete = useCallback((task) => {
        if (task.fromDate) {
            const dateTasks = notes?.[task.fromDate]?.tasks || [];
            updateNote && updateNote(task.fromDate, { tasks: dateTasks.filter(t2 => t2.id !== task.id) });
        } else {
            updateNote && updateNote(BACKLOG_KEY, { tasks: backlogTasks.filter(t2 => t2.id !== task.id) });
        }
    }, [backlogTasks, notes, updateNote]);

    const handleMoveToDate = (task, targetDate) => {
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const d = String(targetDate.getDate()).padStart(2, '0');
        const targetKey = `${y}-${m}-${d}`;
        const existing = notes?.[targetKey]?.tasks || [];
        const { fromDate, ...taskData } = task;
        updateNote && updateNote(targetKey, { tasks: [...existing, { ...taskData, completed: false }] });
        if (fromDate) {
            const dateTasks = notes?.[fromDate]?.tasks || [];
            updateNote && updateNote(fromDate, { tasks: dateTasks.filter(t2 => t2.id !== task.id) });
        } else {
            updateNote && updateNote(BACKLOG_KEY, { tasks: backlogTasks.filter(t2 => t2.id !== task.id) });
        }
        setSchedulingTask(null);
    };

    /* ---------- Segmented scope control, mirroring MonthlyView's header ---------- */

    const ScopeTab = ({ id, label, icon: Icon, count = 0 }) => {
        const isActive = scope === id;
        return (
            <TouchableOpacity
                onPress={() => setScope(id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={[
                    tw`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1.5`,
                    isActive && { backgroundColor: panelBg },
                ]}
                activeOpacity={0.8}
            >
                <Icon size={14} color={isActive ? accent : textMuted} strokeWidth={isActive ? 2.5 : 2} />
                <Text
                    numberOfLines={1}
                    style={[
                        tw`font-black uppercase text-[10px] tracking-widest`,
                        { color: isActive ? textPrimary : textMuted },
                    ]}
                >
                    {label}
                </Text>
                {count > 0 && (
                    <Text style={[tw`text-[10px] font-black`, { color: isActive ? accent : textMuted }]}>
                        {count}
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

    /* ---------- List pieces ---------- */

    // A section renders as one card: the header opens it, rows sit inside the side
    // borders, and the footer closes it.
    const renderItem = useCallback(({ item, index, section }) => {
        const task = section.kind === 'backlog' ? { ...item, fromDate: null } : item;
        const isChecking = !!completing[task.id];
        const isLast = index === section.data.length - 1;
        return (
            <View style={[
                tw`flex-row items-center px-3.5 py-2.5`,
                {
                    backgroundColor: panelBg,
                    borderLeftWidth: 1,
                    borderRightWidth: 1,
                    borderColor: cardBorder,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: divider,
                    opacity: isChecking ? 0.45 : 1,
                },
            ]}>
                <TouchableOpacity
                    onPress={() => handleComplete(task)}
                    disabled={isChecking}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isChecking }}
                    accessibilityLabel={t('todo.completeTask', { defaultValue: 'Mark done' })}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 6 }}
                    style={[
                        tw`w-6 h-6 rounded-md mr-3 items-center justify-center`,
                        {
                            flexShrink: 0,
                            borderWidth: 2,
                            borderColor: accent,
                            backgroundColor: isChecking ? accent : 'transparent',
                        },
                    ]}
                >
                    {isChecking && <Check size={14} color="#ffffff" strokeWidth={4} />}
                </TouchableOpacity>

                <Text
                    style={[
                        tw`flex-1 text-sm font-bold mr-2`,
                        { color: textPrimary },
                        isChecking && { textDecorationLine: 'line-through' },
                    ]}
                    numberOfLines={2}
                >
                    {task.text}
                </Text>

                <TouchableOpacity
                    onPress={() => setSchedulingTask(task)}
                    accessibilityRole="button"
                    accessibilityLabel={t('todo.scheduleTask', { defaultValue: 'Move to a date' })}
                    style={[tw`w-8 h-8 rounded-xl items-center justify-center`, { backgroundColor: accent + alpha.soft }]}
                >
                    <CalendarPlus size={14} color={textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDelete(task)}
                    accessibilityRole="button"
                    accessibilityLabel={t('todo.deleteTask', { defaultValue: 'Delete task' })}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                    style={tw`w-8 h-8 items-center justify-center`}
                >
                    <X size={15} color={textMuted} />
                </TouchableOpacity>
            </View>
        );
    }, [accent, cardBorder, completing, divider, handleComplete, handleDelete, isDark, panelBg, t, textMuted, textPrimary]);

    const renderSectionHeader = useCallback(({ section }) => {
        const isBacklog = section.kind === 'backlog';
        const label = isBacklog
            ? t('todo.backlog', { defaultValue: 'Backlog' })
            : parseDateKey(section.dateKey).toLocaleDateString(i18n.language, {
                weekday: 'short', month: 'short', day: 'numeric',
            });
        const age = isBacklog ? null : dayAge(section.dateKey);
        const ageLabel = age === null
            ? null
            : age <= 1
                ? t('todo.yesterday', { defaultValue: 'Yesterday' })
                : t('todo.daysAgo', { defaultValue: '{{count}} days ago', count: age });
        const HeaderIcon = isBacklog ? Inbox : CalendarClock;
        const tone = isBacklog ? accent : warnColor;

        return (
            <View style={[
                tw`flex-row items-center gap-2 px-3.5 py-2.5 mt-3 rounded-t-2xl`,
                {
                    backgroundColor: isBacklog ? panelSoftBg : warnTint,
                    borderTopWidth: 1,
                    borderLeftWidth: 1,
                    borderRightWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: cardBorder,
                    borderBottomColor: divider,
                },
            ]}>
                <HeaderIcon size={13} color={tone} strokeWidth={2.5} />
                <Text
                    style={[
                        tw`flex-1 text-[10px] font-black uppercase tracking-widest`,
                        { color: isBacklog ? textSecondary : warnColor },
                    ]}
                    numberOfLines={1}
                >
                    {label}
                </Text>
                {ageLabel && (
                    <Text style={[tw`text-[10px] font-bold`, { color: textMuted }]}>{ageLabel}</Text>
                )}
                {section.data.length > 0 && (
                    <Text style={[tw`text-[10px] font-black`, { color: textMuted }]}>{section.data.length}</Text>
                )}
            </View>
        );
    }, [accent, cardBorder, divider, i18n.language, panelSoftBg, t, textMuted, textSecondary, warnColor, warnTint]);

    const renderSectionFooter = useCallback(({ section }) => (
        <View style={[
            tw`rounded-b-2xl`,
            {
                backgroundColor: panelBg,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderBottomWidth: 1,
                borderColor: cardBorder,
                paddingBottom: section.data.length === 0 ? 0 : 6,
            },
        ]}>
            {section.data.length === 0 && (
                <Text style={[tw`text-xs font-bold py-4 px-4 text-center`, { color: textMuted }]}>
                    {t('todo.emptyBacklog', { defaultValue: 'Nothing in the backlog — add something below' })}
                </Text>
            )}
        </View>
    ), [cardBorder, panelBg, t, textMuted]);

    // Empty states teach what the screen does instead of just reporting emptiness.
    const listEmpty = useMemo(() => {
        const EmptyIcon = scope === 'overdue' ? CalendarClock : Inbox;
        const title = scope === 'backlog'
            ? t('todo.emptyBacklogTitle', { defaultValue: 'Backlog is empty' })
            : t('todo.clearTitle', { defaultValue: "You're all caught up" });
        const body = scope === 'overdue'
            ? t('todo.clearBody', { defaultValue: 'Unfinished tasks from past days show up here on their own.' })
            : scope === 'backlog'
                ? t('todo.emptyBacklogBody', { defaultValue: 'Add something below and it waits here until you give it a date.' })
                : t('todo.clearHint', {
                    defaultValue: 'Unfinished tasks from past days land here on their own. Anything you add below waits in the backlog until you give it a date.',
                });

        return (
            <View style={[
                tw`mt-3 rounded-2xl border items-center px-6 py-8`,
                { backgroundColor: panelBg, borderColor: cardBorder },
            ]}>
                <View style={[tw`w-11 h-11 rounded-2xl items-center justify-center`, { backgroundColor: accent + alpha.soft }]}>
                    <EmptyIcon size={20} color={textPrimary} />
                </View>
                <Text style={[tw`mt-3 text-[11px] font-black uppercase tracking-widest text-center`, { color: textPrimary }]}>
                    {title}
                </Text>
                <Text style={[tw`mt-1.5 text-xs font-bold leading-snug text-center`, { color: textMuted }]}>
                    {body}
                </Text>
            </View>
        );
    }, [accent, cardBorder, isDark, panelBg, scope, t, textMuted, textPrimary]);

    const listFooter = () => {
        if (isLoadingMore) {
            return (
                <View style={tw`py-6 items-center`}>
                    <ActivityIndicator size="small" color={accent} />
                </View>
            );
        }
        if (hasMore && scope !== 'backlog') {
            return (
                <TouchableOpacity
                    onPress={onLoadMore}
                    style={[tw`mt-4 py-3 rounded-2xl border items-center`, { borderColor: cardBorder, backgroundColor: panelBg }]}
                >
                    <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: textSecondary }]}>
                        {t('todo.loadOlder', { defaultValue: 'Load older tasks' })}
                    </Text>
                </TouchableOpacity>
            );
        }
        if (windowStartKey && overdueCount > 0 && scope !== 'backlog') {
            const since = parseDateKey(windowStartKey).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' });
            return (
                <Text style={[tw`text-[10px] font-bold text-center mt-4 px-6`, { color: textMuted }]}>
                    {t('todo.allLoaded', { defaultValue: 'All open tasks since {{date}}', date: since })}
                </Text>
            );
        }
        return null;
    };

    const canAdd = !!newText.trim();

    return (
        <ScreenScaffold
            colorMode={colorMode}
            theme={theme}
            title={hideHeader ? undefined : t('todo.title', { defaultValue: 'To-Do' })}
            icon={Inbox}
            count={totalCount}
            bottomNavHeight={bottomNavHeight}
            headerExtra={(
                <View
                    accessibilityRole="tablist"
                    style={[tw`flex-row p-1.5 rounded-2xl border`, { backgroundColor: panelSoftBg, borderColor: cardBorder }]}
                >
                    <ScopeTab id="all" label={t('todo.all', { defaultValue: 'All' })} icon={ListTodo} />
                    <ScopeTab id="overdue" label={t('todo.overdue', { defaultValue: 'Overdue' })} icon={CalendarClock} count={overdueCount} />
                    <ScopeTab id="backlog" label={t('todo.backlog', { defaultValue: 'Backlog' })} icon={Inbox} count={manualBacklog.length} />
                </View>
            )}
            bottomBar={(
                <View style={[
                    tw`flex-row items-center rounded-xl border pl-3 pr-1.5`,
                    { backgroundColor: panelSoftBg, borderColor: cardBorder },
                ]}>
                    <Plus size={15} color={textMuted} strokeWidth={2.5} />
                    <TextInput
                        value={newText}
                        onChangeText={setNewText}
                        onSubmitEditing={handleAddTask}
                        placeholder={t('todo.addPlaceholder', { defaultValue: 'Add to backlog...' })}
                        placeholderTextColor={textMuted}
                        returnKeyType="done"
                        blurOnSubmit={false}
                        style={[tw`flex-1 ml-2 py-2.5 text-sm font-bold`, { color: textPrimary }]}
                    />
                    <TouchableOpacity
                        onPress={handleAddTask}
                        disabled={!canAdd}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !canAdd }}
                        accessibilityLabel={t('todo.addPlaceholder', { defaultValue: 'Add to backlog...' })}
                        style={[
                            tw`w-9 h-9 rounded-lg items-center justify-center`,
                            { backgroundColor: canAdd ? accent : 'transparent', opacity: canAdd ? 1 : 0.5 },
                        ]}
                    >
                        <Plus size={16} color={canAdd ? '#ffffff' : textMuted} strokeWidth={3} />
                    </TouchableOpacity>
                </View>
            )}
        >
            {({ contentBottomInset }) => (
                <>
                    <SectionList
                        sections={sections}
                        keyExtractor={(item, index) => `${item.id || 'task'}-${index}`}
                        renderItem={renderItem}
                        renderSectionHeader={renderSectionHeader}
                        renderSectionFooter={renderSectionFooter}
                        ListEmptyComponent={listEmpty}
                        ListFooterComponent={listFooter}
                        stickySectionHeadersEnabled={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: contentBottomInset }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        initialNumToRender={12}
                        maxToRenderPerBatch={12}
                        windowSize={7}
                        removeClippedSubviews={Platform.OS === 'android'}
                        onEndReachedThreshold={0.4}
                        onEndReached={() => {
                            if (hasMore && !isLoadingMore && onLoadMore) onLoadMore();
                        }}
                    />

                    <DatePickerModal
                        isVisible={!!schedulingTask}
                        onClose={() => setSchedulingTask(null)}
                        onSelect={(date) => handleMoveToDate(schedulingTask, date)}
                        selectedDate={new Date()}
                        theme={theme}
                        colorMode={colorMode}
                    />
                </>
            )}
        </ScreenScaffold>
    );
};
