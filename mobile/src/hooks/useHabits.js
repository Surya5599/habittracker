import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { INITIAL_HABITS, LOCAL_HABITS_KEY, LOCAL_COMPLETIONS_KEY } from '../constants';
import { reportError } from '../lib/errorReporting';

const HABITS_QUEUE_KEY = 'habit_tracker_habits_queue_v1';
const MISSING_COLUMN_REGEX = /'([^']+)' column/i;

const getMissingColumnFromError = (error) => {
    const message = String(error?.message || '');
    const match = message.match(MISSING_COLUMN_REGEX);
    return match?.[1] || null;
};

const runMutationWithColumnFallback = async (runMutation, initialPayload) => {
    let payload = { ...(initialPayload || {}) };
    let attempts = 0;
    let lastResult = null;

    while (attempts < 5) {
        const result = await runMutation(payload);
        lastResult = result;
        if (!result?.error) return { ...result, payload };

        const missingColumn = getMissingColumnFromError(result.error);
        if (!missingColumn || !(missingColumn in payload)) {
            return { ...result, payload };
        }

        delete payload[missingColumn];
        attempts += 1;
    }

    return { ...(lastResult || {}), payload };
};

const mapDbHabit = (h) => ({
    id: h.id,
    name: h.name,
    description: h.description || '',
    type: h.type,
    color: h.color,
    goal: h.goal,
    frequency: h.frequency,
    weeklyTarget: h.weekly_target,
    sortOrder: h.sort_order,
    user_id: h.user_id,
    createdAt: h.created_at,
    archivedAt: h.archived_at
});

const remapOpHabitId = (op, oldId, newId) => {
    const next = { ...op };
    if (next.habitId === oldId) next.habitId = newId;
    if (next.clientId === oldId) next.clientId = newId;
    if (Array.isArray(next.habitIds)) {
        next.habitIds = next.habitIds.map((id) => (id === oldId ? newId : id));
    }
    if (next.payload?.id === oldId) {
        next.payload = { ...next.payload, id: newId };
    }
    return next;
};

export const useHabits = (session, guestMode) => {
    const [habits, setHabits] = useState([]);
    const [completions, setCompletions] = useState({});
    const [loading, setLoading] = useState(true);
    const [syncStatus, setSyncStatus] = useState('idle');
    const [syncError, setSyncError] = useState(null);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const queueRef = useRef([]);
    const replayingRef = useRef(false);

    const markSyncing = () => {
        setSyncStatus('syncing');
        setSyncError(null);
    };
    const markSynced = () => {
        setSyncStatus('synced');
        setSyncError(null);
        setLastSyncedAt(Date.now());
    };
    const markSyncError = (message) => {
        setSyncStatus('error');
        setSyncError(message || 'Sync failed');
    };

    const persistQueue = useCallback(async (nextQueue) => {
        queueRef.current = nextQueue;
        await AsyncStorage.setItem(HABITS_QUEUE_KEY, JSON.stringify(nextQueue));
    }, []);

    const enqueueOp = useCallback(async (rawOp) => {
        const op = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            ts: Date.now(),
            ...rawOp
        };

        let next = [...queueRef.current];

        if (op.type === 'completion_set') {
            next = next.filter((o) => !(o.type === 'completion_set' && o.habitId === op.habitId && o.dateKey === op.dateKey));
        } else if (op.type === 'habit_update') {
            const existingIdx = next.findIndex((o) => o.type === 'habit_update' && o.habitId === op.habitId);
            if (existingIdx >= 0) {
                const existing = next[existingIdx];
                next[existingIdx] = {
                    ...existing,
                    updates: { ...existing.updates, ...op.updates },
                    ts: op.ts
                };
                await persistQueue(next);
                return;
            }
        } else if (op.type === 'habit_archive') {
            next = next.filter((o) => !(o.type === 'habit_archive' && o.habitId === op.habitId));
        } else if (op.type === 'habit_reorder') {
            next = next.filter((o) => o.type !== 'habit_reorder');
        }

        next.push(op);
        await persistQueue(next);
    }, [persistQueue]);

    const remapLocalIds = useCallback(async (oldId, newId) => {
        setHabits((prev) => prev.map((h) => (h.id === oldId ? { ...h, id: newId } : h)));
        setCompletions((prev) => {
            if (!prev[oldId]) return prev;
            const next = { ...prev, [newId]: { ...(prev[newId] || {}), ...prev[oldId] } };
            delete next[oldId];
            return next;
        });

        const remappedQueue = queueRef.current.map((op) => remapOpHabitId(op, oldId, newId));
        await persistQueue(remappedQueue);
    }, [persistQueue]);

    const executeOp = useCallback(async (op, userId) => {
        if (op.type === 'completion_set') {
            if (op.value) {
                const { error } = await supabase
                    .from('completions')
                    .upsert({ user_id: userId, habit_id: op.habitId, date_key: op.dateKey }, { onConflict: 'user_id,habit_id,date_key' });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('completions')
                    .delete()
                    .match({ user_id: userId, habit_id: op.habitId, date_key: op.dateKey });
                if (error) throw error;
            }
            return;
        }

        if (op.type === 'habit_insert') {
            const payload = op.payload;
            const insertPayload = {
                name: payload.name,
                description: payload.description || null,
                type: payload.type,
                color: payload.color,
                goal: payload.goal,
                frequency: payload.frequency === undefined ? null : payload.frequency,
                weekly_target: payload.weeklyTarget,
                user_id: userId,
                sort_order: payload.sortOrder,
                created_at: payload.createdAt || new Date().toISOString(),
                archived_at: payload.archivedAt || null
            };
            const { data, error } = await runMutationWithColumnFallback(
                (safePayload) => supabase.from('habits').insert(safePayload).select().single(),
                insertPayload
            );

            if (error) throw error;
            if (data?.id && op.clientId && op.clientId !== data.id) {
                await remapLocalIds(op.clientId, data.id);
            }
            return;
        }

        if (op.type === 'habit_update') {
            let dbUpdates = { ...op.updates };
            if ('frequency' in dbUpdates && dbUpdates.frequency === undefined) dbUpdates.frequency = null;
            if ('weeklyTarget' in dbUpdates) {
                dbUpdates.weekly_target = dbUpdates.weeklyTarget === undefined ? null : dbUpdates.weeklyTarget;
                delete dbUpdates.weeklyTarget;
            }
            if (dbUpdates.weekly_target) dbUpdates.type = 'flexible';
            if (dbUpdates.weekly_target === null) dbUpdates.type = 'daily';

            const { error } = await runMutationWithColumnFallback(
                (safePayload) => supabase.from('habits').update(safePayload).eq('id', op.habitId).eq('user_id', userId),
                dbUpdates
            );
            if (error) throw error;
            return;
        }

        if (op.type === 'habit_delete') {
            const { error: hError } = await supabase.from('habits').delete().eq('id', op.habitId).eq('user_id', userId);
            if (hError) throw hError;
            const { error: cError } = await supabase.from('completions').delete().eq('habit_id', op.habitId).eq('user_id', userId);
            if (cError) throw cError;
            return;
        }

        if (op.type === 'habit_reorder') {
            const updateResults = await Promise.all(
                (op.habitIds || []).map((id, idx) =>
                    runMutationWithColumnFallback(
                        (safePayload) => supabase.from('habits').update(safePayload).eq('id', id).eq('user_id', userId),
                        { sort_order: idx }
                    )
                )
            );
            const firstError = updateResults.find((r) => r?.error)?.error;
            if (firstError) throw firstError;
            return;
        }

        if (op.type === 'habit_archive') {
            const { error } = await runMutationWithColumnFallback(
                (safePayload) => supabase.from('habits').update(safePayload).eq('id', op.habitId).eq('user_id', userId),
                { archived_at: op.archivedAt || null }
            );
            if (error) throw error;
        }
    }, [remapLocalIds]);

    const replayQueue = useCallback(async () => {
        if (!session?.user?.id || replayingRef.current || queueRef.current.length === 0) return;
        replayingRef.current = true;
        markSyncing();

        try {
            let queue = [...queueRef.current];
            while (queue.length > 0) {
                const op = queue[0];
                await executeOp(op, session.user.id);
                queue = queue.slice(1);
                await persistQueue(queue);
            }
            markSynced();
        } catch (error) {
            markSyncError(error?.message || 'Failed to sync queued operations');
            reportError(error, { scope: 'habits:replay-queue' });
        } finally {
            replayingRef.current = false;
        }
    }, [executeOp, persistQueue, session?.user?.id]);

    const fetchUserData = useCallback(async (userId) => {
        setLoading(true);
        markSyncing();
        try {
            let habitsResult = await supabase
                .from('habits')
                .select('*')
                .eq('user_id', userId)
                .order('sort_order', { ascending: true });

            if (habitsResult.error && habitsResult.error.code === '42703') {
                habitsResult = await supabase
                    .from('habits')
                    .select('*')
                    .eq('user_id', userId)
                    .order('id', { ascending: true });
            }

            if (habitsResult.error) throw habitsResult.error;

            let userHabits = habitsResult.data || [];

            if (userHabits.length === 0 && INITIAL_HABITS.length > 0) {
                const initialWithUser = INITIAL_HABITS.map((h, idx) => ({
                    name: h.name,
                    type: h.type,
                    color: h.color,
                    goal: h.goal,
                    user_id: userId,
                    sort_order: idx
                }));

                let insertResult = await supabase
                    .from('habits')
                    .insert(initialWithUser)
                    .select()
                    .order('sort_order', { ascending: true });

                if (insertResult.error && insertResult.error.code === '42703') {
                    const initialWithoutOrder = INITIAL_HABITS.map((h) => ({
                        name: h.name,
                        type: h.type,
                        color: h.color,
                        goal: h.goal,
                        user_id: userId
                    }));
                    insertResult = await supabase
                        .from('habits')
                        .insert(initialWithoutOrder)
                        .select()
                        .order('id', { ascending: true });
                }

                if (insertResult.error) throw insertResult.error;
                userHabits = insertResult.data || [];
            }

            setHabits(userHabits.map(mapDbHabit));

            const { data: completionsData, error: compError } = await supabase
                .from('completions')
                .select('habit_id, date_key')
                .eq('user_id', userId);

            if (compError) throw compError;

            const compMap = {};
            completionsData?.forEach((c) => {
                if (!compMap[c.habit_id]) compMap[c.habit_id] = {};
                compMap[c.habit_id][c.date_key] = true;
            });
            setCompletions(compMap);
            markSynced();

        } catch (error) {
            reportError(error, { scope: 'habits:fetch-user-data' });
            markSyncError(error?.message || 'Failed to sync data');
        } finally {
            setLoading(false);
        }
    }, []);

    const syncGuestToCloud = useCallback(async (userId, localHabits, localCompletions) => {
        if (localHabits.length === 0) return;
        markSyncing();

        try {
            const { data: existingHabits, error: fetchError } = await supabase
                .from('habits')
                .select('id')
                .eq('user_id', userId)
                .limit(1);

            if (fetchError) throw fetchError;

            if (existingHabits && existingHabits.length > 0) {
                await AsyncStorage.removeItem(LOCAL_HABITS_KEY);
                await AsyncStorage.removeItem(LOCAL_COMPLETIONS_KEY);
                return;
            }

            await supabase.from('habits').delete().eq('user_id', userId);
            await supabase.from('completions').delete().eq('user_id', userId);

            const habitsToInsert = localHabits.map((h, idx) => ({
                name: h.name,
                description: h.description || null,
                type: h.type,
                color: h.color,
                goal: h.goal,
                frequency: h.frequency,
                weekly_target: h.weeklyTarget,
                user_id: userId,
                sort_order: idx,
                created_at: h.createdAt || new Date().toISOString(),
                archived_at: h.archivedAt
            }));

            let attempts = 0;
            let insertPayload = habitsToInsert.map((h) => ({ ...h }));
            let insertAttempt = null;
            let orderColumn = 'sort_order';

            while (attempts < 5) {
                insertAttempt = await supabase
                    .from('habits')
                    .insert(insertPayload)
                    .select()
                    .order(orderColumn, { ascending: true });

                if (!insertAttempt.error) break;

                const missingColumn = getMissingColumnFromError(insertAttempt.error);
                if (!missingColumn) break;

                 if (missingColumn === 'sort_order') {
                    orderColumn = 'id';
                }

                insertPayload = insertPayload.map((habit) => {
                    const copy = { ...habit };
                    if (missingColumn in copy) delete copy[missingColumn];
                    return copy;
                });
                attempts += 1;
            }

            const { data: insertedHabits, error: hError } = insertAttempt;

            if (hError) throw hError;

            const idMap = {};
            insertedHabits?.forEach((h, idx) => {
                idMap[localHabits[idx].id] = h.id;
            });

            const completionsToInsert = [];
            Object.entries(localCompletions).forEach(([oldHabitId, dates]) => {
                const newHabitId = idMap[oldHabitId];
                if (!newHabitId) return;
                Object.keys(dates).forEach((dateKey) => {
                    if (dates[dateKey]) {
                        completionsToInsert.push({
                            habit_id: newHabitId,
                            date_key: dateKey,
                            user_id: userId
                        });
                    }
                });
            });

            if (completionsToInsert.length > 0) {
                const { error: cError } = await supabase.from('completions').insert(completionsToInsert);
                if (cError) throw cError;
            }

            await AsyncStorage.removeItem(LOCAL_HABITS_KEY);
            await AsyncStorage.removeItem(LOCAL_COMPLETIONS_KEY);
            markSynced();
        } catch (error) {
            reportError(error, { scope: 'habits:sync-guest-to-cloud' });
            markSyncError(error?.message || 'Sync failed');
        }
    }, []);

    useEffect(() => {
        const loadQueue = async () => {
            const raw = await AsyncStorage.getItem(HABITS_QUEUE_KEY);
            queueRef.current = raw ? JSON.parse(raw) : [];
        };
        loadQueue();
    }, []);

    useEffect(() => {
        const load = async () => {
            if (session) {
                const localHStr = await AsyncStorage.getItem(LOCAL_HABITS_KEY);
                const localCStr = await AsyncStorage.getItem(LOCAL_COMPLETIONS_KEY);
                const localH = localHStr ? JSON.parse(localHStr) : [];
                const localC = localCStr ? JSON.parse(localCStr) : {};

                if (localH.length > 0) {
                    await syncGuestToCloud(session.user.id, localH, localC);
                }
                await replayQueue();
                await fetchUserData(session.user.id);
            } else if (guestMode) {
                const localHStr = await AsyncStorage.getItem(LOCAL_HABITS_KEY);
                const localCStr = await AsyncStorage.getItem(LOCAL_COMPLETIONS_KEY);
                const localH = localHStr ? JSON.parse(localHStr) : [];
                const localC = localCStr ? JSON.parse(localCStr) : {};

                if (localH.length === 0) {
                    const initial = INITIAL_HABITS.map((h, idx) => ({ ...h, sortOrder: idx, createdAt: new Date().toISOString() }));
                    setHabits(initial);

                    const today = new Date();
                    const currentWeekCompletions = {};

                    const formatDateIdx = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                    const seedDates = [];
                    for (let i = 0; i < 7; i++) {
                        const d = new Date(today);
                        d.setDate(today.getDate() - i);
                        seedDates.push(formatDateIdx(d));
                    }
                    const sortedDates = seedDates.reverse();
                    const todayKey = sortedDates[sortedDates.length - 1];

                    initial.forEach((h) => {
                        if (!currentWeekCompletions[h.id]) currentWeekCompletions[h.id] = {};
                        currentWeekCompletions[h.id][todayKey] = true;
                    });

                    if (initial.length > 0) {
                        const habit1Id = initial[0].id;
                        sortedDates.slice(-4, -1).forEach((dateKey) => {
                            currentWeekCompletions[habit1Id][dateKey] = true;
                        });
                    }

                    if (initial.length > 1) {
                        const habit2Id = initial[1].id;
                        if (sortedDates.length >= 3) currentWeekCompletions[habit2Id][sortedDates[sortedDates.length - 3]] = true;
                        if (sortedDates.length >= 5) currentWeekCompletions[habit2Id][sortedDates[sortedDates.length - 5]] = true;
                    }

                    setCompletions(currentWeekCompletions);
                    await AsyncStorage.setItem(LOCAL_HABITS_KEY, JSON.stringify(initial));
                    await AsyncStorage.setItem(LOCAL_COMPLETIONS_KEY, JSON.stringify(currentWeekCompletions));
                } else {
                    setHabits(localH);
                    setCompletions(localC);
                }
                setLoading(false);
            } else {
                setHabits([]);
                setCompletions({});
                setLoading(false);
            }
        };

        load();
    }, [session, guestMode, fetchUserData, replayQueue, syncGuestToCloud]);

    useEffect(() => {
        const saveLocal = async () => {
            if (guestMode && !loading) {
                await AsyncStorage.setItem(LOCAL_HABITS_KEY, JSON.stringify(habits));
                await AsyncStorage.setItem(LOCAL_COMPLETIONS_KEY, JSON.stringify(completions));
            }
        };
        saveLocal();
    }, [habits, completions, guestMode, loading]);

    useEffect(() => {
        if (!session?.user?.id) return;
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                replayQueue();
            }
        });
        return () => sub.remove();
    }, [replayQueue, session?.user?.id]);

    const toggleCompletion = async (habitId, dateKey) => {
        const alreadyDone = completions[habitId]?.[dateKey];
        const nextValue = !alreadyDone;

        setCompletions((prev) => {
            const habitCompletions = prev[habitId] || {};
            return {
                ...prev,
                [habitId]: {
                    ...habitCompletions,
                    [dateKey]: nextValue
                }
            };
        });

        if (session && !guestMode) {
            await enqueueOp({ type: 'completion_set', habitId, dateKey, value: nextValue });
            replayQueue();
        }
    };

    const addHabit = async (themePrimary, initialName = '', initialFrequency = undefined, initialWeeklyTarget = null, initialDescription = '', initialColor = themePrimary) => {
        if (habits.length >= 25) return null;
        const tempId = `tmp-${Date.now()}`;
        const nextSortOrder = habits.length > 0 ? Math.max(...habits.map((h) => h.sortOrder || 0)) + 1 : 0;
        const newHabit = {
            id: tempId,
            name: initialName,
            description: initialDescription,
            type: initialWeeklyTarget ? 'flexible' : 'daily',
            color: initialColor,
            goal: 80,
            frequency: initialFrequency,
            weeklyTarget: initialWeeklyTarget,
            sortOrder: nextSortOrder,
            createdAt: new Date().toISOString(),
            archivedAt: null
        };

        setHabits((prev) => [...prev, newHabit]);

        if (session && !guestMode) {
            await enqueueOp({ type: 'habit_insert', clientId: tempId, payload: newHabit });
            replayQueue();
        }

        return tempId;
    };

    const updateHabit = async (id, updates) => {
        setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));

        if (session && !guestMode) {
            await enqueueOp({ type: 'habit_update', habitId: id, updates });
            replayQueue();
        }
    };

    const removeHabit = async (id) => {
        setHabits((prev) => prev.filter((h) => h.id !== id));
        setCompletions((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });

        if (session && !guestMode) {
            await enqueueOp({ type: 'habit_delete', habitId: id });
            replayQueue();
        }
    };

    const reorderHabits = async (newHabits) => {
        setHabits(newHabits);

        if (session && !guestMode) {
            await enqueueOp({ type: 'habit_reorder', habitIds: newHabits.map((h) => h.id) });
            replayQueue();
        }
    };

    const toggleArchiveHabit = async (id, archive) => {
        const timestamp = archive ? new Date().toISOString() : null;
        setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, archivedAt: timestamp } : h)));

        if (session && !guestMode) {
            await enqueueOp({ type: 'habit_archive', habitId: id, archivedAt: timestamp });
            replayQueue();
        }
    };

    return {
        habits,
        setHabits,
        completions,
        setCompletions,
        loading,
        toggleCompletion,
        addHabit,
        updateHabit,
        removeHabit,
        reorderHabits,
        toggleArchiveHabit,
        setLoading,
        retryPendingSync: replayQueue,
        pendingSyncCount: queueRef.current.length,
        syncState: {
            status: syncStatus,
            error: syncError,
            lastSyncedAt
        }
    };
};
