import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { reportError } from '../lib/errorReporting';
import { normalizeNote, parseServerContent, mergeNotesByUpdatedAt, isNoteEmpty } from '../utils/noteSync';

const LOCAL_NOTES_KEY = 'habit_tracker_notes';
const LOCAL_NOTES_QUEUE_KEY = 'habit_tracker_notes_queue_v1';

export const useDailyNotes = (session, guestMode) => {
    const [notes, setNotes] = useState({});
    const [notesLoaded, setNotesLoaded] = useState(false);
    const [syncStatus, setSyncStatus] = useState('idle');
    const [syncError, setSyncError] = useState(null);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const queueRef = useRef([]);
    const isReplayingRef = useRef(false);

    const persistQueue = useCallback(async (nextQueue) => {
        queueRef.current = nextQueue;
        await AsyncStorage.setItem(LOCAL_NOTES_QUEUE_KEY, JSON.stringify(nextQueue));
    }, []);

    const enqueueOp = useCallback(async (op) => {
        const next = [...queueRef.current, { ...op, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }];
        await persistQueue(next);
    }, [persistQueue]);

    const replayQueue = useCallback(async () => {
        if (!session?.user?.id || isReplayingRef.current || queueRef.current.length === 0) return;
        isReplayingRef.current = true;
        setSyncStatus('syncing');
        setSyncError(null);

        try {
            let queue = [...queueRef.current];
            while (queue.length > 0) {
                const op = queue[0];

                if (op.type === 'delete') {
                    const { error } = await supabase
                        .from('daily_notes')
                        .delete()
                        .eq('user_id', session.user.id)
                        .eq('date_key', op.dateKey);
                    if (error) throw error;
                } else {
                    const { data: remoteRow, error: fetchError } = await supabase
                        .from('daily_notes')
                        .select('content')
                        .eq('user_id', session.user.id)
                        .eq('date_key', op.dateKey)
                        .maybeSingle();

                    if (fetchError) throw fetchError;

                    const remoteNote = remoteRow?.content ? parseServerContent(remoteRow.content) : null;
                    const localNote = normalizeNote(op.payload);
                    const merged = remoteNote
                        ? mergeNotesByUpdatedAt({ [op.dateKey]: remoteNote }, { [op.dateKey]: localNote })[op.dateKey]
                        : localNote;

                    const { error: upsertError } = await supabase
                        .from('daily_notes')
                        .upsert(
                            {
                                user_id: session.user.id,
                                date_key: op.dateKey,
                                content: JSON.stringify(merged)
                            },
                            { onConflict: 'user_id,date_key' }
                        );

                    if (upsertError) throw upsertError;
                }

                queue = queue.slice(1);
                await persistQueue(queue);
            }

            setSyncStatus('synced');
            setLastSyncedAt(Date.now());
        } catch (error) {
            setSyncStatus('error');
            setSyncError(error?.message || 'Failed to sync daily notes');
            reportError(error, { scope: 'daily-notes:replay-queue' });
        } finally {
            isReplayingRef.current = false;
        }
    }, [persistQueue, session?.user?.id]);

    useEffect(() => {
        const loadQueue = async () => {
            const raw = await AsyncStorage.getItem(LOCAL_NOTES_QUEUE_KEY);
            queueRef.current = raw ? JSON.parse(raw) : [];
        };
        loadQueue();
    }, []);

    // Load local + remote notes and merge by updated timestamp.
    useEffect(() => {
        const loadNotes = async () => {
            try {
                const storedNotes = await AsyncStorage.getItem(LOCAL_NOTES_KEY);
                const localNotesRaw = storedNotes ? JSON.parse(storedNotes) : {};
                const localNotes = {};
                Object.entries(localNotesRaw).forEach(([key, val]) => {
                    if (Array.isArray(val)) {
                        localNotes[key] = normalizeNote({ tasks: val, mood: undefined, journal: '' });
                    } else if (typeof val === 'string') {
                        localNotes[key] = normalizeNote({ tasks: [{ id: Date.now().toString(), text: val, completed: false }] });
                    } else {
                        localNotes[key] = normalizeNote(val);
                    }
                });

                if (session?.user?.id) {
                    const { data, error } = await supabase
                        .from('daily_notes')
                        .select('date_key, content')
                        .eq('user_id', session.user.id);

                    if (error) {
                        reportError(error, { scope: 'daily-notes:load-remote' });
                        setNotes(localNotes);
                    } else {
                        const remoteNotes = {};
                        (data || []).forEach((note) => {
                            remoteNotes[note.date_key] = parseServerContent(note.content);
                        });
                        const merged = mergeNotesByUpdatedAt(remoteNotes, localNotes);
                        setNotes(merged);
                    }
                } else {
                    setNotes(localNotes);
                }
            } catch (error) {
                reportError(error, { scope: 'daily-notes:load' });
            } finally {
                setNotesLoaded(true);
            }
        };

        loadNotes();
    }, [session?.user?.id]);

    // Persist notes locally for both authenticated and guest users.
    useEffect(() => {
        if (!notesLoaded) return;
        const saveNotes = async () => {
            try {
                await AsyncStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
            } catch (error) {
                reportError(error, { scope: 'daily-notes:save-local' });
            }
        };
        saveNotes();
    }, [notes, notesLoaded]);

    useEffect(() => {
        if (!session?.user?.id) return;
        replayQueue();

        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                replayQueue();
            }
        });

        return () => sub.remove();
    }, [session?.user?.id, replayQueue]);

    const updateNote = useCallback(async (dateKey, data) => {
        const now = Date.now();
        const current = notes?.[dateKey] || {};
        const updated = normalizeNote({ ...current, ...data, _updatedAt: now });

        setNotes((prev) => ({
            ...prev,
            [dateKey]: updated
        }));

        if (!session?.user?.id) return;

        if (isNoteEmpty(updated)) {
            await enqueueOp({ type: 'delete', dateKey, updatedAt: now });
        } else {
            await enqueueOp({ type: 'upsert', dateKey, payload: updated, updatedAt: now });
        }

        replayQueue();
    }, [enqueueOp, notes, replayQueue, session?.user?.id]);

    return {
        notes,
        updateNote,
        retryPendingSync: replayQueue,
        pendingSyncCount: queueRef.current.length,
        syncState: {
            status: syncStatus,
            error: syncError,
            lastSyncedAt
        }
    };
};
