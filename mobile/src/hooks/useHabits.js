import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { INITIAL_HABITS, LOCAL_HABITS_KEY, LOCAL_COMPLETIONS_KEY } from '../constants';
import { Alert } from 'react-native';

export const useHabits = (session, guestMode) => {
    const [habits, setHabits] = useState([]);
    const [completions, setCompletions] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchUserData = useCallback(async (userId) => {
        setLoading(true);
        try {
            const { data: habitsData, error: habitsError } = await supabase
                .from('habits')
                .select('*')
                .eq('user_id', userId)
                .order('id', { ascending: true });

            if (habitsError) throw habitsError;

            let userHabits = habitsData || [];

            if (userHabits.length === 0) {
                const initialWithUser = INITIAL_HABITS.map(h => ({
                    name: h.name,
                    type: h.type,
                    color: h.color,
                    goal: h.goal,
                    user_id: userId
                }));
                const { data: inserted, error: insertError } = await supabase
                    .from('habits')
                    .insert(initialWithUser)
                    .select()
                    .order('id', { ascending: true });
                if (insertError) throw insertError;
                userHabits = inserted || [];
            }
            setHabits(userHabits);

            const { data: completionsData, error: compError } = await supabase
                .from('completions')
                .select('habit_id, date_key')
                .eq('user_id', userId);

            if (compError) throw compError;

            const compMap = {};
            completionsData?.forEach(c => {
                if (!compMap[c.habit_id]) compMap[c.habit_id] = {};
                compMap[c.habit_id][c.date_key] = true;
            });
            setCompletions(compMap);

        } catch (err) {
            console.error('Error fetching data:', err);
            Alert.alert('Error', 'Failed to sync data');
        } finally {
            setLoading(false);
        }
    }, []);

    const syncGuestToCloud = useCallback(async (userId, localHabits, localCompletions) => {
        if (localHabits.length === 0) return;

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

            const habitsToInsert = localHabits.map(h => ({
                name: h.name,
                type: h.type,
                color: h.color,
                goal: h.goal,
                frequency: h.frequency,
                user_id: userId
            }));

            const { data: insertedHabits, error: hError } = await supabase
                .from('habits')
                .insert(habitsToInsert)
                .select()
                .order('id', { ascending: true });

            if (hError) throw hError;

            const idMap = {};
            insertedHabits?.forEach((h, idx) => {
                idMap[localHabits[idx].id] = h.id;
            });

            const completionsToInsert = [];
            Object.entries(localCompletions).forEach(([oldHabitId, dates]) => {
                const newHabitId = idMap[oldHabitId];
                if (!newHabitId) return;
                Object.keys(dates).forEach(dateKey => {
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

            Alert.alert('Success', 'Local data synced successfully!');
        } catch (err) {
            console.error('Sync failed:', err);
            Alert.alert('Error', 'Sync failed, but your account is ready.');
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            if (session) {
                const localHStr = await AsyncStorage.getItem(LOCAL_HABITS_KEY);
                const localCStr = await AsyncStorage.getItem(LOCAL_COMPLETIONS_KEY);
                const localH = localHStr ? JSON.parse(localHStr) : [];
                const localC = localCStr ? JSON.parse(localCStr) : {};

                if (localH.length > 0) {
                    syncGuestToCloud(session.user.id, localH, localC).then(() => fetchUserData(session.user.id));
                } else {
                    fetchUserData(session.user.id);
                }
            } else if (guestMode) {
                const localHStr = await AsyncStorage.getItem(LOCAL_HABITS_KEY);
                const localCStr = await AsyncStorage.getItem(LOCAL_COMPLETIONS_KEY);
                const localH = localHStr ? JSON.parse(localHStr) : [];
                const localC = localCStr ? JSON.parse(localCStr) : {};

                if (localH.length === 0) {
                    const initial = INITIAL_HABITS.map(h => ({ ...h }));
                    setHabits(initial);

                    const today = new Date();
                    const currentWeekCompletions = {};

                    const formatDateIdx = (d) => {
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    };

                    const seedDates = [];
                    for (let i = 0; i < 7; i++) {
                        const d = new Date(today);
                        d.setDate(today.getDate() - i);
                        seedDates.push(formatDateIdx(d));
                    }
                    const sortedDates = seedDates.reverse();
                    const todayKey = sortedDates[sortedDates.length - 1];

                    initial.forEach(h => {
                        if (!currentWeekCompletions[h.id]) currentWeekCompletions[h.id] = {};
                        currentWeekCompletions[h.id][todayKey] = true;
                    });

                    if (initial.length > 0) {
                        const habit1Id = initial[0].id;
                        sortedDates.slice(-4, -1).forEach(dateKey => {
                            currentWeekCompletions[habit1Id][dateKey] = true;
                        });
                    }

                    if (initial.length > 1) {
                        const habit2Id = initial[1].id;
                        if (sortedDates.length >= 3) {
                            currentWeekCompletions[habit2Id][sortedDates[sortedDates.length - 3]] = true;
                        }
                        if (sortedDates.length >= 5) {
                            currentWeekCompletions[habit2Id][sortedDates[sortedDates.length - 5]] = true;
                        }
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
    }, [session, guestMode, fetchUserData, syncGuestToCloud]);

    useEffect(() => {
        const saveLocal = async () => {
            if (guestMode && !loading) {
                await AsyncStorage.setItem(LOCAL_HABITS_KEY, JSON.stringify(habits));
                await AsyncStorage.setItem(LOCAL_COMPLETIONS_KEY, JSON.stringify(completions));
            }
        };
        saveLocal();
    }, [habits, completions, guestMode, loading]);

    const toggleCompletion = async (habitId, dateKey) => {
        const alreadyDone = completions[habitId]?.[dateKey];

        setCompletions(prev => {
            const habitCompletions = prev[habitId] || {};
            return {
                ...prev,
                [habitId]: {
                    ...habitCompletions,
                    [dateKey]: !alreadyDone
                }
            };
        });

        if (session && !guestMode) {
            try {
                if (alreadyDone) {
                    await supabase
                        .from('completions')
                        .delete()
                        .match({ user_id: session.user.id, habit_id: habitId, date_key: dateKey });
                } else {
                    await supabase
                        .from('completions')
                        .insert({ user_id: session.user.id, habit_id: habitId, date_key: dateKey });
                }
            } catch (err) {
                console.error('Sync error:', err);
                Alert.alert('Error', 'Failed to sync completion');
            }
        }
    };

    const addHabit = async (themePrimary, initialName = '', initialFrequency = undefined) => {
        if (habits.length >= 25) {
            Alert.alert('Limit Reached', 'Maximum limit of 25 habits reached');
            return null;
        }
        const tempId = Date.now().toString();
        const newHabit = {
            id: tempId,
            name: initialName,
            type: 'daily',
            color: themePrimary,
            goal: 80,
            frequency: initialFrequency
        };

        setHabits(prev => [...prev, newHabit]);

        if (session && !guestMode) {
            try {
                const { data, error } = await supabase
                    .from('habits')
                    .insert({
                        name: initialName,
                        type: 'daily',
                        color: themePrimary,
                        goal: 80,
                        frequency: initialFrequency === undefined ? null : initialFrequency,
                        user_id: session.user.id
                    })
                    .select();

                if (error) throw error;
                if (data) {
                    setHabits(prev => prev.map(h => h.id === tempId ? data[0] : h));
                    return data[0].id;
                }
            } catch (err) {
                console.error('Error adding habit:', err);
                Alert.alert('Error', 'Failed to add habit');
            }
        }
        return tempId;
    };

    const updateHabit = async (id, updates) => {
        setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));

        if (session && !guestMode) {
            try {
                const dbUpdates = { ...updates };
                if ('frequency' in dbUpdates && dbUpdates.frequency === undefined) {
                    dbUpdates.frequency = null;
                }

                await supabase
                    .from('habits')
                    .update(dbUpdates)
                    .eq('id', id)
                    .eq('user_id', session.user.id);
            } catch (err) {
                console.error('Error updating habit:', err);
                Alert.alert('Error', 'Failed to save habit updates');
            }
        }
    };

    const removeHabit = async (id) => {
        setHabits(prev => prev.filter(h => h.id !== id));
        setCompletions(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });

        if (session && !guestMode) {
            try {
                await supabase.from('habits').delete().eq('id', id).eq('user_id', session.user.id);
                await supabase.from('completions').delete().eq('habit_id', id).eq('user_id', session.user.id);
            } catch (err) {
                console.error('Error removing habit:', err);
                Alert.alert('Error', 'Failed to remove habit');
            }
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
        setLoading
    };
};
