import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { reportError } from '../lib/errorReporting';
import { normalizeNote, parseServerContent, mergeNotesByUpdatedAt, isNoteEmpty } from '../utils/noteSync';
import {
    BACKLOG_KEY,
    NOTES_PAGE_DAYS,
    windowStartKey,
    earliestDateKey,
    escapeLikeQuery,
} from '../utils/dateKeys';

const LOCAL_NOTES_KEY = 'habit_tracker_notes';
const LOCAL_NOTES_QUEUE_KEY = 'habit_tracker_notes_queue_v1';

// How many empty 60-day windows loadMore will skip past before giving up, so a
// long gap in history doesn't require one tap per empty stretch.
const MAX_EMPTY_PAGES_PER_LOAD = 6;
// Ceiling on rows returned by a server-side note search.
const SEARCH_ROW_LIMIT = 200;

export const useDailyNotes = (session, guestMode) => {
    const [notes, setNotes] = useState({});
    const [notesLoaded, setNotesLoaded] = useState(false);
    const [syncStatus, setSyncStatus] = useState('idle');
    const [syncError, setSyncError] = useState(null);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    // Paging window: notes older than `windowStart` exist but aren't loaded/shown
    // yet. Screens that render long lists (To-Do, Logs) clamp to this.
    const [pagesLoaded, setPagesLoaded] = useState(1);
    const [windowStart, setWindowStart] = useState(() => windowStartKey(1));
    const [hasMoreNotes, setHasMoreNotes] = useState(false);
    const [isLoadingMoreNotes, setIsLoadingMoreNotes] = useState(false);
    const [isSearchingNotes, setIsSearchingNotes] = useState(false);
    const queueRef = useRef([]);
    const isReplayingRef = useRef(false);
    // Mirror of `notes` for callbacks that shouldn't be recreated on every edit.
    const notesRef = useRef({});
    // Oldest date key that exists anywhere (server or local cache). Drives
    // hasMoreNotes without needing a count query per page.
    const earliestKnownRef = useRef(null);
    const windowStartRef = useRef(windowStartKey(1));
    const loadingMoreRef = useRef(false);
    // Month prefixes ('2026-03') already pulled in by ensureNotesForDate.
    const fetchedMonthsRef = useRef(new Set());

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

    // Folds a page of server rows into state without letting stale server data
    // clobber a newer in-memory/offline edit, and without dropping local-only dates.
    const mergeRemoteRows = useCallback((rows) => {
        const remoteNotes = {};
        (rows || []).forEach((row) => {
            remoteNotes[row.date_key] = parseServerContent(row.content);
        });
        if (Object.keys(remoteNotes).length === 0) return;

        setNotes((prev) => {
            const overlapping = {};
            Object.keys(remoteNotes).forEach((key) => {
                if (prev[key]) overlapping[key] = prev[key];
            });
            // Base = server rows, overridden per-key by whatever we already hold
            // when ours is newer (mergeNotesByUpdatedAt is last-write-wins on _updatedAt).
            return { ...prev, ...mergeNotesByUpdatedAt(remoteNotes, overlapping) };
        });
    }, []);

    // Fetches one window of notes: [fromKey, untilKey). `untilKey` is omitted for
    // the newest page so today's and any future-scheduled notes are included.
    const fetchNotesRange = useCallback(async (userId, fromKey, untilKey) => {
        let query = supabase
            .from('daily_notes')
            .select('date_key, content')
            .eq('user_id', userId)
            .gte('date_key', fromKey);
        if (untilKey) query = query.lt('date_key', untilKey);

        const { data, error } = await query;
        if (error) throw error;
        // Range filters are string comparisons, so `__backlog__` can fall inside
        // them depending on collation — it's fetched explicitly, drop it here.
        return (data || []).filter((row) => row.date_key !== BACKLOG_KEY);
    }, []);

    // Load local cache first (instant paint, works offline), then the newest
    // window from the server.
    useEffect(() => {
        let cancelled = false;

        const loadNotes = async () => {
            const initialWindowStart = windowStartKey(1);
            fetchedMonthsRef.current = new Set();
            setPagesLoaded(1);
            setWindowStart(initialWindowStart);
            windowStartRef.current = initialWindowStart;

            let localNotes = {};
            try {
                const storedNotes = await AsyncStorage.getItem(LOCAL_NOTES_KEY);
                const localNotesRaw = storedNotes ? JSON.parse(storedNotes) : {};
                Object.entries(localNotesRaw).forEach(([key, val]) => {
                    if (Array.isArray(val)) {
                        localNotes[key] = normalizeNote({ tasks: val, mood: undefined, journal: '' });
                    } else if (typeof val === 'string') {
                        localNotes[key] = normalizeNote({ tasks: [{ id: Date.now().toString(), text: val, completed: false }] });
                    } else {
                        localNotes[key] = normalizeNote(val);
                    }
                });
            } catch (error) {
                reportError(error, { scope: 'daily-notes:load-local' });
                localNotes = {};
            }

            if (cancelled) return;
            setNotes(localNotes);
            earliestKnownRef.current = earliestDateKey(localNotes);
            setNotesLoaded(true);

            const userId = session?.user?.id;
            if (!userId) {
                // Guest: everything lives locally, so "more" just means widening
                // the window over the cache we already hold.
                setHasMoreNotes(!!earliestKnownRef.current && earliestKnownRef.current < initialWindowStart);
                return;
            }

            try {
                const [pageRows, backlogResult, oldestResult] = await Promise.all([
                    fetchNotesRange(userId, initialWindowStart, null),
                    supabase
                        .from('daily_notes')
                        .select('date_key, content')
                        .eq('user_id', userId)
                        .eq('date_key', BACKLOG_KEY)
                        .maybeSingle(),
                    supabase
                        .from('daily_notes')
                        .select('date_key')
                        .eq('user_id', userId)
                        .neq('date_key', BACKLOG_KEY)
                        .order('date_key', { ascending: true })
                        .limit(1),
                ]);

                if (cancelled) return;

                if (backlogResult?.error) {
                    reportError(backlogResult.error, { scope: 'daily-notes:load-backlog' });
                }
                if (oldestResult?.error) {
                    reportError(oldestResult.error, { scope: 'daily-notes:load-oldest' });
                }

                const rows = [...pageRows];
                if (backlogResult?.data) rows.push(backlogResult.data);
                mergeRemoteRows(rows);

                const remoteEarliest = oldestResult?.data?.[0]?.date_key || null;
                const localEarliest = earliestKnownRef.current;
                earliestKnownRef.current = [remoteEarliest, localEarliest]
                    .filter(Boolean)
                    .sort()[0] || null;
                setHasMoreNotes(!!earliestKnownRef.current && earliestKnownRef.current < initialWindowStart);
            } catch (error) {
                if (cancelled) return;
                reportError(error, { scope: 'daily-notes:load-remote' });
                // Keep whatever the local cache gave us and let the user retry.
                setHasMoreNotes(!!earliestKnownRef.current && earliestKnownRef.current < initialWindowStart);
            }
        };

        loadNotes();

        return () => { cancelled = true; };
    }, [session?.user?.id, fetchNotesRange, mergeRemoteRows]);

    // Widens the window by one page (or several, when the skipped range is empty).
    const loadMoreNotes = useCallback(async () => {
        if (loadingMoreRef.current || !hasMoreNotes) return;
        loadingMoreRef.current = true;
        setIsLoadingMoreNotes(true);

        const userId = session?.user?.id;
        let pages = pagesLoaded;
        let start = windowStartRef.current;

        try {
            for (let attempt = 0; attempt < MAX_EMPTY_PAGES_PER_LOAD; attempt++) {
                const nextStart = windowStartKey(pages + 1);
                const until = start;
                pages += 1;
                start = nextStart;

                let rowCount = 0;
                if (userId) {
                    const rows = await fetchNotesRange(userId, nextStart, until);
                    rowCount = rows.length;
                    mergeRemoteRows(rows);
                } else {
                    // Guest: count what the local cache already has in this range.
                    rowCount = Object.keys(notesRef.current).filter(
                        (key) => key !== BACKLOG_KEY && key >= nextStart && key < until
                    ).length;
                }

                const reachedEnd = !earliestKnownRef.current || earliestKnownRef.current >= nextStart;
                if (rowCount > 0 || reachedEnd) break;
            }

            setPagesLoaded(pages);
            windowStartRef.current = start;
            setWindowStart(start);
            setHasMoreNotes(!!earliestKnownRef.current && earliestKnownRef.current < start);
        } catch (error) {
            reportError(error, { scope: 'daily-notes:load-more' });
        } finally {
            loadingMoreRef.current = false;
            setIsLoadingMoreNotes(false);
        }
    }, [fetchNotesRange, hasMoreNotes, mergeRemoteRows, pagesLoaded, session?.user?.id]);

    // Paging means older dates aren't fetched up front, but the user can still
    // navigate a weekly/daily card back past the window. This pulls in the
    // containing month on demand so an old day never renders as falsely empty.
    // It does NOT move the window — list screens stay bounded.
    const ensureNotesForDate = useCallback(async (dateKey) => {
        const userId = session?.user?.id;
        if (!userId || !dateKey || dateKey === BACKLOG_KEY) return;
        if (dateKey >= windowStartRef.current) return; // already covered by the window

        const monthPrefix = dateKey.slice(0, 7);
        if (fetchedMonthsRef.current.has(monthPrefix)) return;
        fetchedMonthsRef.current.add(monthPrefix);

        try {
            const [year, month] = monthPrefix.split('-').map(Number);
            const from = `${monthPrefix}-01`;
            const until = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
            const rows = await fetchNotesRange(userId, from, until);
            mergeRemoteRows(rows);
        } catch (error) {
            // Allow a later retry rather than caching the failure.
            fetchedMonthsRef.current.delete(monthPrefix);
            reportError(error, { scope: 'daily-notes:ensure-date' });
        }
    }, [fetchNotesRange, mergeRemoteRows, session?.user?.id]);

    // Server-side search so a query can reach notes outside the loaded window.
    // Matches are merged into `notes`; callers filter the merged set themselves.
    const searchNotes = useCallback(async (query) => {
        const term = String(query || '').trim();
        const userId = session?.user?.id;
        if (!userId || term.length < 2) return;

        setIsSearchingNotes(true);
        try {
            const { data, error } = await supabase
                .from('daily_notes')
                .select('date_key, content')
                .eq('user_id', userId)
                .ilike('content', `%${escapeLikeQuery(term)}%`)
                .order('date_key', { ascending: false })
                .limit(SEARCH_ROW_LIMIT);

            if (error) throw error;
            mergeRemoteRows(data);
        } catch (error) {
            reportError(error, { scope: 'daily-notes:search' });
        } finally {
            setIsSearchingNotes(false);
        }
    }, [mergeRemoteRows, session?.user?.id]);

    useEffect(() => { notesRef.current = notes; }, [notes]);

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
        notesLoaded,
        updateNote,
        retryPendingSync: replayQueue,
        pendingSyncCount: queueRef.current.length,
        syncState: {
            status: syncStatus,
            error: syncError,
            lastSyncedAt
        },
        // Paging: `windowStart` is the oldest date key currently loaded/displayable.
        notesWindow: {
            startKey: windowStart,
            pagesLoaded,
            pageDays: NOTES_PAGE_DAYS,
            hasMore: hasMoreNotes,
            isLoadingMore: isLoadingMoreNotes,
            loadMore: loadMoreNotes,
            isSearching: isSearchingNotes,
            search: searchNotes,
            // Pull in a single older date (outside the window) on demand.
            ensureDate: ensureNotesForDate
        }
    };
};
