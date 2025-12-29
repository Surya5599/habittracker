import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Habit, HabitCompletion } from '../types';
import { INITIAL_HABITS, LOCAL_HABITS_KEY, LOCAL_COMPLETIONS_KEY } from '../constants';
import toast from 'react-hot-toast';

export const useHabits = (session: any, guestMode: boolean) => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [completions, setCompletions] = useState<HabitCompletion>({});
    const [loading, setLoading] = useState(true);

    const fetchUserData = useCallback(async (userId: string) => {
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

            const compMap: HabitCompletion = {};
            completionsData?.forEach(c => {
                if (!compMap[c.habit_id]) compMap[c.habit_id] = {};
                compMap[c.habit_id][c.date_key] = true;
            });
            setCompletions(compMap);

        } catch (err) {
            console.error('Error fetching data:', err);
            toast.error('Failed to sync data');
        } finally {
            setLoading(false);
        }
    }, []);

    const syncGuestToCloud = useCallback(async (userId: string, localHabits: Habit[], localCompletions: HabitCompletion) => {
        if (localHabits.length === 0) return;

        const toastId = toast.loading('Syncing guest data to your account...');
        try {
            const { data: existingHabits, error: fetchError } = await supabase
                .from('habits')
                .select('id')
                .eq('user_id', userId)
                .limit(1);

            if (fetchError) throw fetchError;

            if (existingHabits && existingHabits.length > 0) {
                localStorage.removeItem(LOCAL_HABITS_KEY);
                localStorage.removeItem(LOCAL_COMPLETIONS_KEY);
                toast.success('Found your account data! Resuming...', { id: toastId });
                return;
            }

            await supabase.from('habits').delete().eq('user_id', userId);
            await supabase.from('completions').delete().eq('user_id', userId);

            const habitsToInsert = localHabits.map(h => ({
                name: h.name,
                type: h.type,
                color: h.color,
                goal: h.goal,
                user_id: userId
            }));

            const { data: insertedHabits, error: hError } = await supabase
                .from('habits')
                .insert(habitsToInsert)
                .select()
                .order('id', { ascending: true });

            if (hError) throw hError;

            const idMap: Record<string, string> = {};
            insertedHabits?.forEach((h, idx) => {
                idMap[localHabits[idx].id] = h.id;
            });

            const completionsToInsert: any[] = [];
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

            localStorage.removeItem(LOCAL_HABITS_KEY);
            localStorage.removeItem(LOCAL_COMPLETIONS_KEY);

            toast.success('Local data synced successfully!', { id: toastId });
        } catch (err) {
            console.error('Sync failed:', err);
            toast.error('Sync failed, but your account is ready.', { id: toastId });
        }
    }, []);

    useEffect(() => {
        if (session) {
            const localH = JSON.parse(localStorage.getItem(LOCAL_HABITS_KEY) || '[]');
            const localC = JSON.parse(localStorage.getItem(LOCAL_COMPLETIONS_KEY) || '{}');
            if (localH.length > 0) {
                syncGuestToCloud(session.user.id, localH, localC).then(() => fetchUserData(session.user.id));
            } else {
                fetchUserData(session.user.id);
            }
        } else if (!guestMode) {
            setHabits([]);
            setCompletions({});
            setLoading(false);
        }
    }, [session, guestMode, fetchUserData, syncGuestToCloud]);

    useEffect(() => {
        if (guestMode) {
            localStorage.setItem(LOCAL_HABITS_KEY, JSON.stringify(habits));
            localStorage.setItem(LOCAL_COMPLETIONS_KEY, JSON.stringify(completions));
        }
    }, [habits, completions, guestMode]);

    const toggleCompletion = async (habitId: string, dateKey: string) => {
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
                toast.error('Failed to sync completion');
            }
        }
    };

    const addHabit = async (themePrimary: string) => {
        const tempId = Date.now().toString();
        const newHabit: Habit = { id: tempId, name: '', type: 'daily', color: themePrimary, goal: 80 };

        setHabits(prev => [...prev, newHabit]);

        if (session && !guestMode) {
            try {
                const { data, error } = await supabase
                    .from('habits')
                    .insert({ name: '', type: 'daily', color: themePrimary, goal: 80, user_id: session.user.id })
                    .select();

                if (error) throw error;
                if (data) {
                    setHabits(prev => prev.map(h => h.id === tempId ? data[0] : h));
                    return data[0].id;
                }
            } catch (err) {
                console.error('Error adding habit:', err);
                toast.error('Failed to add habit');
            }
        }
        return tempId;
    };

    const updateHabit = async (id: string, updates: Partial<Habit>) => {
        setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));

        if (session && !guestMode) {
            try {
                await supabase
                    .from('habits')
                    .update(updates)
                    .eq('id', id)
                    .eq('user_id', session.user.id);
            } catch (err) {
                console.error('Error updating habit:', err);
                toast.error('Failed to save habit updates');
            }
        }
    };

    const removeHabit = async (id: string) => {
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
                toast.error('Failed to remove habit');
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
