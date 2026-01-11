import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const LOCAL_NOTES_KEY = 'habit_tracker_notes';

export const useDailyNotes = (session, guestMode) => {
    const [notes, setNotes] = useState({});
    const [notesLoaded, setNotesLoaded] = useState(false);

    // Load from local storage or database on mount/session change
    useEffect(() => {
        const loadNotes = async () => {
            if (session?.user?.id) {
                // Load from Supabase
                const { data, error } = await supabase
                    .from('daily_notes')
                    .select('date_key, content')
                    .eq('user_id', session.user.id);

                if (!error && data) {
                    const notesObj = {};
                    data.forEach(note => {
                        try {
                            const parsed = JSON.parse(note.content);
                            if (Array.isArray(parsed)) {
                                notesObj[note.date_key] = { tasks: parsed, mood: undefined, journal: '' };
                            } else if (parsed && typeof parsed === 'object') {
                                notesObj[note.date_key] = { tasks: [], ...parsed };
                            } else {
                                notesObj[note.date_key] = { tasks: [{ id: Date.now().toString(), text: String(parsed), completed: false }] };
                            }
                        } catch {
                            if (note.content) {
                                notesObj[note.date_key] = { tasks: [{ id: Date.now().toString(), text: note.content, completed: false }] };
                            }
                        }
                    });
                    setNotes(notesObj);
                }
            } else {
                // Load from local storage for guest
                try {
                    const storedNotes = await AsyncStorage.getItem(LOCAL_NOTES_KEY);
                    if (storedNotes) {
                        const localNotes = JSON.parse(storedNotes);
                        // Migration logic for local notes too
                        const migrated = {};
                        Object.entries(localNotes).forEach(([key, val]) => {
                            if (Array.isArray(val)) {
                                migrated[key] = { tasks: val, mood: undefined, journal: '' };
                            } else if (typeof val === 'string') {
                                migrated[key] = { tasks: [{ id: Date.now().toString(), text: val, completed: false }] };
                            } else {
                                migrated[key] = { tasks: [], ...val };
                            }
                        });
                        setNotes(migrated);
                    }
                } catch (e) {
                    console.error("Failed to load notes", e);
                }
            }
            setNotesLoaded(true);
        };
        loadNotes();
    }, [session]);

    // Save to local storage whenever notes change (primarily for guest mode)
    useEffect(() => {
        if (!notesLoaded) return;
        const saveNotes = async () => {
            try {
                await AsyncStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
            } catch (e) {
                console.error("Failed to save notes", e);
            }
        };
        saveNotes();
    }, [notes, notesLoaded]);

    const updateNote = useCallback(async (dateKey, data) => {
        setNotes(prev => {
            const currentDayData = prev[dateKey] || { tasks: [], mood: undefined, journal: '' };
            const updated = {
                ...currentDayData,
                ...data
            };
            return {
                ...prev,
                [dateKey]: updated
            };
        });

        // Sync to Supabase if session exists
        if (session?.user?.id) {
            setNotes(prev => {
                const updatedNote = prev[dateKey];
                const isEmpty = (!updatedNote.tasks || updatedNote.tasks.length === 0) && !updatedNote.mood && !updatedNote.journal;

                const runSync = async () => {
                    try {
                        if (isEmpty) {
                            await supabase
                                .from('daily_notes')
                                .delete()
                                .eq('user_id', session.user.id)
                                .eq('date_key', dateKey);
                        } else {
                            await supabase
                                .from('daily_notes')
                                .upsert({
                                    user_id: session.user.id,
                                    date_key: dateKey,
                                    content: JSON.stringify(updatedNote)
                                }, {
                                    onConflict: 'user_id,date_key'
                                });
                        }
                    } catch (err) {
                        console.error('Failed to sync daily note:', err);
                    }
                };

                runSync();
                return prev;
            });
        }
    }, [session]);

    return {
        notes,
        updateNote
    };
};
