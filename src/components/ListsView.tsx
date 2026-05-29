import React, { useState, useRef } from 'react';
import { X, Plus, Check, Trash2, ChevronLeft, List, Pencil, GripVertical } from 'lucide-react';
import { UserList, ListItem, Theme } from '../types';

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
    '#6366f1', '#a855f7', '#ec4899', '#14b8a6', '#64748b',
];

const PRESET_EMOJIS = ['📚', '💰', '🌍', '🎬', '🎮', '🍽️', '🏋️', '🎯', '🛒', '✈️', '🎵', '💡', '❤️', '⭐', '🔖'];

interface ListsViewProps {
    lists: UserList[];
    getItemsForList: (listId: string) => ListItem[];
    onClose: () => void;
    theme: Theme;
    onCreateList: (name: string, color: string, emoji?: string) => Promise<UserList | null>;
    onUpdateList: (id: string, changes: Partial<Pick<UserList, 'name' | 'color' | 'emoji'>>) => Promise<void>;
    onDeleteList: (id: string) => Promise<void>;
    onAddItem: (listId: string, text: string, notes?: string) => Promise<ListItem | null>;
    onUpdateItem: (id: string, changes: Partial<Pick<ListItem, 'text' | 'notes' | 'completed'>>) => Promise<void>;
    onDeleteItem: (id: string) => Promise<void>;
}

type ModalState =
    | { type: 'none' }
    | { type: 'create-list' }
    | { type: 'edit-list'; list: UserList }
    | { type: 'item-notes'; item: ListItem };

const ListForm: React.FC<{
    initial?: { name: string; color: string; emoji?: string };
    onSave: (name: string, color: string, emoji?: string) => void;
    onCancel: () => void;
    title: string;
}> = ({ initial, onSave, onCancel, title }) => {
    const [name, setName] = useState(initial?.name ?? '');
    const [color, setColor] = useState(initial?.color ?? '#6366f1');
    const [emoji, setEmoji] = useState(initial?.emoji ?? '');
    const inputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => { inputRef.current?.focus(); }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave(name.trim(), color, emoji || undefined);
    };

    return (
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-black">{title}</h3>

            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Name</label>
                <input
                    ref={inputRef}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Books I've read"
                    className="px-3 py-2 border-2 border-black text-sm font-medium text-stone-800 placeholder:text-stone-300 outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    maxLength={60}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Color</label>
                <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className="w-7 h-7 border-2 transition-all"
                            style={{
                                backgroundColor: c,
                                borderColor: color === c ? 'black' : c,
                                boxShadow: color === c ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none',
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Emoji (optional)</label>
                <div className="flex flex-wrap gap-1.5 items-center">
                    {PRESET_EMOJIS.map(e => (
                        <button
                            key={e}
                            type="button"
                            onClick={() => setEmoji(emoji === e ? '' : e)}
                            className="w-8 h-8 flex items-center justify-center text-base border-2 transition-all"
                            style={{ borderColor: emoji === e ? 'black' : 'transparent', boxShadow: emoji === e ? '1px 1px 0px 0px rgba(0,0,0,1)' : 'none' }}
                        >
                            {e}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 pt-1">
                <button
                    type="submit"
                    disabled={!name.trim()}
                    className="flex-1 py-2 text-xs font-black uppercase tracking-wider bg-black text-white border-2 border-black transition-all hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ boxShadow: name.trim() ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none' }}
                >
                    Save
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-xs font-black uppercase tracking-wider border-2 border-stone-300 text-stone-600 hover:border-stone-500 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};

const ItemRow: React.FC<{
    item: ListItem;
    theme: Theme;
    onToggle: () => void;
    onDelete: () => void;
    onEdit: () => void;
}> = ({ item, theme, onToggle, onDelete, onEdit }) => {
    return (
        <div className={`group flex items-start gap-3 py-3 border-b border-stone-100 transition-opacity ${item.completed ? 'opacity-50' : ''}`}>
            <button
                onClick={onToggle}
                className="mt-0.5 w-5 h-5 border-2 flex items-center justify-center shrink-0 transition-all"
                style={{
                    borderColor: item.completed ? theme.primary : '#d6d3d1',
                    backgroundColor: item.completed ? theme.primary : 'transparent',
                    boxShadow: item.completed ? 'none' : '1px 1px 0px 0px rgba(0,0,0,0.2)',
                }}
                title={item.completed ? 'Mark incomplete' : 'Mark done'}
            >
                {item.completed && <Check size={10} strokeWidth={3} color="white" />}
            </button>
            <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium leading-snug block ${item.completed ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                    {item.text}
                </span>
                {item.notes && (
                    <span className="text-xs text-stone-400 mt-0.5 block leading-relaxed">{item.notes}</span>
                )}
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={onEdit} className="p-1 text-stone-300 hover:text-stone-600 transition-colors" title="Add notes">
                    <Pencil size={12} />
                </button>
                <button onClick={onDelete} className="p-1 text-stone-300 hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
};

export const ListsView: React.FC<ListsViewProps> = ({
    lists,
    getItemsForList,
    onClose,
    theme,
    onCreateList,
    onUpdateList,
    onDeleteList,
    onAddItem,
    onUpdateItem,
    onDeleteItem,
}) => {
    const [selectedListId, setSelectedListId] = useState<string | null>(lists[0]?.id ?? null);
    const [modal, setModal] = useState<ModalState>({ type: 'none' });
    const [newItemText, setNewItemText] = useState('');
    const [newItemNotes, setNewItemNotes] = useState('');
    const [showNewItemNotes, setShowNewItemNotes] = useState(false);
    const [editingItem, setEditingItem] = useState<{ id: string; text: string; notes: string } | null>(null);
    const [showCompletedItems, setShowCompletedItems] = useState(false);
    const itemInputRef = useRef<HTMLInputElement>(null);

    const selectedList = lists.find(l => l.id === selectedListId) ?? null;
    const items = selectedListId ? getItemsForList(selectedListId) : [];
    const activeItems = items.filter(i => !i.completed);
    const completedItems = items.filter(i => i.completed);

    const handleCreateList = async (name: string, color: string, emoji?: string) => {
        const list = await onCreateList(name, color, emoji);
        if (list) setSelectedListId(list.id);
        setModal({ type: 'none' });
    };

    const handleUpdateList = async (name: string, color: string, emoji?: string) => {
        if (!selectedListId) return;
        await onUpdateList(selectedListId, { name, color, emoji });
        setModal({ type: 'none' });
    };

    const handleDeleteList = async () => {
        if (!selectedListId) return;
        await onDeleteList(selectedListId);
        setSelectedListId(lists.filter(l => l.id !== selectedListId)[0]?.id ?? null);
        setModal({ type: 'none' });
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedListId || !newItemText.trim()) return;
        await onAddItem(selectedListId, newItemText.trim(), newItemNotes.trim() || undefined);
        setNewItemText('');
        setNewItemNotes('');
        setShowNewItemNotes(false);
        itemInputRef.current?.focus();
    };

    const handleSaveEditItem = async () => {
        if (!editingItem || !editingItem.text.trim()) return;
        await onUpdateItem(editingItem.id, { text: editingItem.text.trim(), notes: editingItem.notes.trim() || undefined });
        setEditingItem(null);
    };

    const isModalOpen = modal.type !== 'none';

    return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden bg-white">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b-[3px] border-black bg-white shrink-0">
                <List size={15} style={{ color: theme.primary }} />
                <h2 className="flex-1 text-base font-black uppercase tracking-tight text-black">Lists</h2>
                {lists.length > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-black bg-black text-white">{lists.length}</span>
                )}
                <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-black hover:bg-stone-100 rounded transition-colors">
                    <X size={16} />
                </button>
            </div>

            {isModalOpen ? (
                /* ── Modal layer ── */
                <div className="flex-1 overflow-y-auto">
                    {modal.type === 'create-list' && (
                        <ListForm title="New List" onSave={handleCreateList} onCancel={() => setModal({ type: 'none' })} />
                    )}
                    {modal.type === 'edit-list' && selectedList && (
                        <div>
                            <ListForm
                                title="Edit List"
                                initial={{ name: selectedList.name, color: selectedList.color, emoji: selectedList.emoji }}
                                onSave={handleUpdateList}
                                onCancel={() => setModal({ type: 'none' })}
                            />
                            <div className="px-5 pb-5">
                                <button
                                    onClick={handleDeleteList}
                                    className="w-full py-2 text-xs font-black uppercase tracking-wider border-2 border-red-300 text-red-500 hover:border-red-500 hover:bg-red-50 transition-colors"
                                >
                                    Delete List
                                </button>
                            </div>
                        </div>
                    )}
                    {modal.type === 'item-notes' && editingItem && (
                        <div className="p-5 flex flex-col gap-4">
                            <h3 className="text-sm font-black uppercase tracking-wider text-black">Edit Item</h3>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Text</label>
                                <input
                                    value={editingItem.text}
                                    onChange={e => setEditingItem(ei => ei ? { ...ei, text: e.target.value } : null)}
                                    className="px-3 py-2 border-2 border-black text-sm font-medium text-stone-800 outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    autoFocus
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Notes (optional)</label>
                                <textarea
                                    value={editingItem.notes}
                                    onChange={e => setEditingItem(ei => ei ? { ...ei, notes: e.target.value } : null)}
                                    className="px-3 py-2 border-2 border-stone-300 text-sm text-stone-700 placeholder:text-stone-300 outline-none focus:border-black resize-none"
                                    rows={3}
                                    placeholder="Price, link, author, reason…"
                                />
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={handleSaveEditItem}
                                    className="flex-1 py-2 text-xs font-black uppercase tracking-wider bg-black text-white border-2 border-black hover:bg-stone-800"
                                    style={{ boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)' }}
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => { setModal({ type: 'none' }); setEditingItem(null); }}
                                    className="px-4 py-2 text-xs font-black uppercase tracking-wider border-2 border-stone-300 text-stone-600 hover:border-stone-500 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* ── Main two-panel layout ── */
                <div className="flex flex-1 min-h-0 overflow-hidden">
                    {/* Left: list selector */}
                    <div className="w-[140px] sm:w-[160px] shrink-0 border-r-[3px] border-black flex flex-col">
                        <div className="flex-1 overflow-y-auto py-1">
                            {lists.length === 0 && (
                                <div className="px-3 py-6 text-center text-[11px] text-stone-400 font-medium leading-relaxed">
                                    No lists yet.<br />Create one below.
                                </div>
                            )}
                            {lists.map(list => {
                                const isActive = list.id === selectedListId;
                                const listItems = getItemsForList(list.id);
                                const doneCount = listItems.filter(i => i.completed).length;
                                return (
                                    <button
                                        key={list.id}
                                        onClick={() => setSelectedListId(list.id)}
                                        className={`w-full text-left px-3 py-2.5 border-b border-stone-100 transition-all ${isActive ? 'bg-stone-100' : 'hover:bg-stone-50'}`}
                                        style={isActive ? { borderLeft: `3px solid ${list.color}` } : { borderLeft: '3px solid transparent' }}
                                    >
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            {list.emoji && <span className="text-sm leading-none">{list.emoji}</span>}
                                            <span className="text-xs font-black uppercase tracking-tight text-stone-800 truncate leading-tight">{list.name}</span>
                                        </div>
                                        <div className="text-[10px] text-stone-400 font-medium">
                                            {listItems.length === 0 ? 'Empty' : `${doneCount}/${listItems.length}`}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="p-2 border-t-[3px] border-black shrink-0">
                            <button
                                onClick={() => setModal({ type: 'create-list' })}
                                className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-black uppercase tracking-wider border-2 border-black text-black hover:bg-black hover:text-white transition-colors"
                                style={{ boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)' }}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = '1px 1px 0px 0px rgba(0,0,0,1)')}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = '2px 2px 0px 0px rgba(0,0,0,1)')}
                            >
                                <Plus size={11} strokeWidth={3} />New
                            </button>
                        </div>
                    </div>

                    {/* Right: items panel */}
                    <div className="flex-1 flex flex-col min-w-0 min-h-0">
                        {!selectedList ? (
                            <div className="flex-1 flex items-center justify-center text-stone-300 text-sm font-medium">
                                Select or create a list
                            </div>
                        ) : (
                            <>
                                {/* List header */}
                                <div
                                    className="flex items-center gap-2 px-4 py-2.5 border-b-2 border-stone-200 shrink-0"
                                    style={{ borderBottomColor: selectedList.color + '60' }}
                                >
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: selectedList.color }}
                                    />
                                    <span className="flex-1 text-sm font-black uppercase tracking-tight text-stone-800 truncate">
                                        {selectedList.emoji && <span className="mr-1">{selectedList.emoji}</span>}
                                        {selectedList.name}
                                    </span>
                                    {activeItems.length > 0 && (
                                        <span className="text-[10px] font-black text-stone-400 shrink-0">{activeItems.length} left</span>
                                    )}
                                    <button
                                        onClick={() => {
                                            setModal({ type: 'edit-list', list: selectedList });
                                        }}
                                        className="p-1 text-stone-300 hover:text-stone-600 transition-colors shrink-0"
                                        title="Edit list"
                                    >
                                        <Pencil size={12} />
                                    </button>
                                </div>

                                {/* Items */}
                                <div className="flex-1 overflow-y-auto px-4">
                                    {items.length === 0 && (
                                        <div className="py-10 text-center text-stone-300 text-sm font-medium">
                                            Nothing here yet — add your first item below.
                                        </div>
                                    )}

                                    {/* Active items */}
                                    {activeItems.map(item => (
                                        <ItemRow
                                            key={item.id}
                                            item={item}
                                            theme={theme}
                                            onToggle={() => onUpdateItem(item.id, { completed: true })}
                                            onDelete={() => onDeleteItem(item.id)}
                                            onEdit={() => {
                                                setEditingItem({ id: item.id, text: item.text, notes: item.notes ?? '' });
                                                setModal({ type: 'item-notes', item });
                                            }}
                                        />
                                    ))}

                                    {/* Completed items */}
                                    {completedItems.length > 0 && (
                                        <div className="mt-2">
                                            <button
                                                onClick={() => setShowCompletedItems(p => !p)}
                                                className="flex items-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors"
                                            >
                                                <span>{showCompletedItems ? '▾' : '▸'}</span>
                                                Done ({completedItems.length})
                                            </button>
                                            {showCompletedItems && completedItems.map(item => (
                                                <ItemRow
                                                    key={item.id}
                                                    item={item}
                                                    theme={theme}
                                                    onToggle={() => onUpdateItem(item.id, { completed: false })}
                                                    onDelete={() => onDeleteItem(item.id)}
                                                    onEdit={() => {
                                                        setEditingItem({ id: item.id, text: item.text, notes: item.notes ?? '' });
                                                        setModal({ type: 'item-notes', item });
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <div className="h-2" />
                                </div>

                                {/* Add item form */}
                                <div className="shrink-0 border-t-[3px] border-black p-3 bg-white">
                                    <form onSubmit={handleAddItem} className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <input
                                                ref={itemInputRef}
                                                value={newItemText}
                                                onChange={e => setNewItemText(e.target.value)}
                                                placeholder="Add item…"
                                                className="flex-1 px-3 py-2 border-2 border-black text-sm font-medium text-stone-800 placeholder:text-stone-300 outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                                maxLength={200}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewItemNotes(p => !p)}
                                                className={`px-2 border-2 text-[10px] font-black uppercase transition-colors ${showNewItemNotes ? 'border-black bg-black text-white' : 'border-stone-300 text-stone-400 hover:border-stone-500'}`}
                                                title="Add notes"
                                            >
                                                +note
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!newItemText.trim()}
                                                className="px-3 py-2 border-2 border-black bg-black text-white text-xs font-black uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-stone-800"
                                                style={{ boxShadow: newItemText.trim() ? '2px 2px 0px 0px rgba(0,0,0,1)' : 'none' }}
                                            >
                                                <Plus size={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                        {showNewItemNotes && (
                                            <input
                                                value={newItemNotes}
                                                onChange={e => setNewItemNotes(e.target.value)}
                                                placeholder="Price, link, author, reason…"
                                                className="w-full px-3 py-1.5 border-2 border-stone-300 text-xs text-stone-700 placeholder:text-stone-300 outline-none focus:border-black transition-colors"
                                                maxLength={300}
                                                autoFocus
                                            />
                                        )}
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
