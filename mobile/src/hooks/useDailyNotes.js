import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_NOTES_KEY = 'habit_tracker_notes';

export const useDailyNotes = (session, guestMode) => {
    const [notes, setNotes] = useState({});

    // Load from local storage on mount
    useEffect(() => {
        const loadNotes = async () => {
            try {
                const storedNotes = await AsyncStorage.getItem(LOCAL_NOTES_KEY);
                if (storedNotes) {
                    setNotes(JSON.parse(storedNotes));
                }
            } catch (e) {
                console.error("Failed to load notes", e);
            }
        };
        loadNotes();
    }, []);

    // Save to local storage whenever notes change
    useEffect(() => {
        const saveNotes = async () => {
            try {
                await AsyncStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
            } catch (e) {
                console.error("Failed to save notes", e);
            }
        };
        // Simple debounce could be added here if needed, but for now we save directly
        saveNotes();
    }, [notes]);

    const updateNote = useCallback((dateKey, data) => {
        setNotes(prev => {
            const currentDayData = prev[dateKey] || {};
            return {
                ...prev,
                [dateKey]: {
                    ...currentDayData,
                    ...data
                }
            };
        });

        // TODO: Sync to Supabase if session exists
    }, []);

    return {
        notes,
        updateNote
    };
};
