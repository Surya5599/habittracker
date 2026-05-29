import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { UserList, ListItem } from '../types';

const LOCAL_LISTS_KEY = 'habicard_lists';
const LOCAL_LIST_ITEMS_KEY = 'habicard_list_items';

function loadLocal<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function saveLocal(key: string, value: unknown) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch { /* ignore */ }
}

function uuid() {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useLists = (session: any, guestMode: boolean) => {
    const [lists, setLists] = useState<UserList[]>([]);
    const [items, setItems] = useState<ListItem[]>([]);
    const [loading, setLoading] = useState(true);

    const isLocal = guestMode || !session;

    const fetchData = useCallback(async (userId: string) => {
        setLoading(true);
        try {
            const [listsRes, itemsRes] = await Promise.all([
                supabase.from('lists').select('*').eq('user_id', userId).is('archived_at', null).order('sort_order', { ascending: true }),
                supabase.from('list_items').select('*').eq('user_id', userId).order('sort_order', { ascending: true }),
            ]);
            if (listsRes.error) throw listsRes.error;
            if (itemsRes.error) throw itemsRes.error;

            setLists((listsRes.data || []).map(r => ({
                id: r.id, name: r.name, color: r.color, emoji: r.emoji,
                sortOrder: r.sort_order, createdAt: r.created_at, archivedAt: r.archived_at,
            })));
            setItems((itemsRes.data || []).map(r => ({
                id: r.id, listId: r.list_id, text: r.text, notes: r.notes,
                completed: r.completed, completedAt: r.completed_at,
                sortOrder: r.sort_order, createdAt: r.created_at,
            })));
        } catch (err) {
            console.error('useLists fetch error', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isLocal) {
            setLists(loadLocal<UserList[]>(LOCAL_LISTS_KEY, []));
            setItems(loadLocal<ListItem[]>(LOCAL_LIST_ITEMS_KEY, []));
            setLoading(false);
        } else if (session?.user?.id) {
            fetchData(session.user.id);
        }
    }, [session, guestMode, fetchData, isLocal]);

    // Persist to localStorage for guest mode
    useEffect(() => {
        if (isLocal) { saveLocal(LOCAL_LISTS_KEY, lists); }
    }, [lists, isLocal]);
    useEffect(() => {
        if (isLocal) { saveLocal(LOCAL_LIST_ITEMS_KEY, items); }
    }, [items, isLocal]);

    const createList = useCallback(async (name: string, color: string, emoji?: string): Promise<UserList | null> => {
        const sortOrder = lists.length;
        if (isLocal) {
            const newList: UserList = { id: uuid(), name, color, emoji, sortOrder, createdAt: new Date().toISOString() };
            setLists(prev => [...prev, newList]);
            return newList;
        }
        const { data, error } = await supabase.from('lists').insert({
            user_id: session.user.id, name, color, emoji, sort_order: sortOrder,
        }).select().single();
        if (error || !data) { console.error(error); return null; }
        const newList: UserList = { id: data.id, name: data.name, color: data.color, emoji: data.emoji, sortOrder: data.sort_order, createdAt: data.created_at };
        setLists(prev => [...prev, newList]);
        return newList;
    }, [lists.length, isLocal, session]);

    const updateList = useCallback(async (id: string, changes: Partial<Pick<UserList, 'name' | 'color' | 'emoji'>>) => {
        setLists(prev => prev.map(l => l.id === id ? { ...l, ...changes } : l));
        if (!isLocal) {
            const dbChanges: Record<string, unknown> = {};
            if (changes.name !== undefined) dbChanges.name = changes.name;
            if (changes.color !== undefined) dbChanges.color = changes.color;
            if (changes.emoji !== undefined) dbChanges.emoji = changes.emoji;
            await supabase.from('lists').update(dbChanges).eq('id', id);
        }
    }, [isLocal]);

    const deleteList = useCallback(async (id: string) => {
        setLists(prev => prev.filter(l => l.id !== id));
        setItems(prev => prev.filter(i => i.listId !== id));
        if (!isLocal) {
            await supabase.from('lists').delete().eq('id', id);
        }
    }, [isLocal]);

    const addItem = useCallback(async (listId: string, text: string, notes?: string): Promise<ListItem | null> => {
        const sortOrder = items.filter(i => i.listId === listId).length;
        if (isLocal) {
            const newItem: ListItem = { id: uuid(), listId, text, notes, completed: false, sortOrder, createdAt: new Date().toISOString() };
            setItems(prev => [...prev, newItem]);
            return newItem;
        }
        const { data, error } = await supabase.from('list_items').insert({
            list_id: listId, user_id: session.user.id, text, notes: notes || null, completed: false, sort_order: sortOrder,
        }).select().single();
        if (error || !data) { console.error(error); return null; }
        const newItem: ListItem = { id: data.id, listId: data.list_id, text: data.text, notes: data.notes, completed: data.completed, sortOrder: data.sort_order, createdAt: data.created_at };
        setItems(prev => [...prev, newItem]);
        return newItem;
    }, [items, isLocal, session]);

    const updateItem = useCallback(async (id: string, changes: Partial<Pick<ListItem, 'text' | 'notes' | 'completed'>>) => {
        const completedAt = changes.completed === true ? new Date().toISOString() : changes.completed === false ? null : undefined;
        setItems(prev => prev.map(i => i.id === id ? { ...i, ...changes, ...(completedAt !== undefined ? { completedAt } : {}) } : i));
        if (!isLocal) {
            const dbChanges: Record<string, unknown> = {};
            if (changes.text !== undefined) dbChanges.text = changes.text;
            if (changes.notes !== undefined) dbChanges.notes = changes.notes;
            if (changes.completed !== undefined) { dbChanges.completed = changes.completed; dbChanges.completed_at = completedAt ?? null; }
            await supabase.from('list_items').update(dbChanges).eq('id', id);
        }
    }, [isLocal]);

    const deleteItem = useCallback(async (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
        if (!isLocal) {
            await supabase.from('list_items').delete().eq('id', id);
        }
    }, [isLocal]);

    const getItemsForList = useCallback((listId: string) => {
        return items.filter(i => i.listId === listId).sort((a, b) => a.sortOrder - b.sortOrder);
    }, [items]);

    return { lists, items, loading, createList, updateList, deleteList, addItem, updateItem, deleteItem, getItemsForList };
};
