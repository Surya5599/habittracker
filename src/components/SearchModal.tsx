
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Calendar, CheckSquare, ArrowRight, Command } from 'lucide-react';
import { DailyNote } from '../types';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    notes: DailyNote;
    onSelectDate: (date: Date) => void;
    themePrimary: string;
}

type SearchResultType = 'habit' | 'journal' | 'action';

interface SearchResult {
    id: string;
    type: SearchResultType;
    title: string;
    subtitle?: string;
    date?: Date;
    action?: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
    isOpen,
    onClose,
    notes,
    onSelectDate,
    themePrimary
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setQuery(''); // Clear query on open
            setSelectedIndex(0);
            // Small timeout to ensure render before focus
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    const results: SearchResult[] = useMemo(() => {
        if (!query.trim()) {
            // Show recent journals by default
            const recentJournals: SearchResult[] = [];
            const sortedDates = Object.keys(notes).sort((a, b) => b.localeCompare(a)); // Sort by date desc (YYYY-MM-DD compares correctly)

            for (const dateKey of sortedDates) {
                if (recentJournals.length >= 10) break;

                const note = notes[dateKey];
                const dayData = note as import('../types').DayData;
                let snippet = '';

                // Check if it has content
                if (dayData.journal) {
                    snippet = dayData.journal;
                } else if (dayData.tasks && dayData.tasks.length > 0) {
                    snippet = `${dayData.tasks.length} tasks recorded`;
                }

                if (snippet) {
                    const parts = dateKey.split('-');
                    if (parts.length === 3) {
                        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                        recentJournals.push({
                            id: dateKey,
                            type: 'journal',
                            title: date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                            subtitle: snippet,
                            date: date
                        });
                    }
                }
            }
            return recentJournals;
        }

        const lowerQuery = query.toLowerCase();
        const searchResults: SearchResult[] = [];

        // 2. Journal Entries (Daily Notes)
        Object.entries(notes).forEach(([dateKey, note]) => {
            const dayData = note as import('../types').DayData;
            let matchFound = false;
            let snippet = '';

            // Search in Journal text
            if (dayData.journal && dayData.journal.toLowerCase().includes(lowerQuery)) {
                matchFound = true;
                const index = dayData.journal.toLowerCase().indexOf(lowerQuery);
                const start = Math.max(0, index - 20);
                const end = Math.min(dayData.journal.length, index + lowerQuery.length + 40);
                snippet = (start > 0 ? '...' : '') + dayData.journal.substring(start, end) + (end < dayData.journal.length ? '...' : '');
            }
            // Search in Tasks? Optional.

            if (matchFound) {
                // Parse dateKey (YYYY-MM-DD or similar) -> Date object
                // If dateKey is YYYY-MM-DD
                const parts = dateKey.split('-');
                if (parts.length === 3) {
                    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    searchResults.push({
                        id: dateKey,
                        type: 'journal',
                        title: date.toLocaleDateString(),
                        subtitle: snippet,
                        date: date
                    });
                }
            }
        });

        // 3. Actions (Static for now)
        if ('settings'.includes(lowerQuery)) {
            // We need a way to trigger settings. 
            // Since we can't easily pass "setSettingsOpen" deep down or we have to.
            // For now let's just add basic nav actions if feasible, or skip.
        }

        return searchResults.slice(0, 20); // Limit results
    }, [query, notes, t]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Keyboard Navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + Math.max(1, results.length)) % Math.max(1, results.length));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex]);

    const handleSelect = (result: SearchResult) => {
        if (result.type === 'journal' && result.date) {
            onSelectDate(result.date);
            // Don't close, let the daily card overlay it
        } else if (result.action) {
            result.action();
            onClose();
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header / Input */}
                <div className="flex items-center gap-3 p-3 border-b-2 border-black bg-stone-50">
                    <Search className="text-stone-400" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={t('common.searchPlaceholder', "Search journals...")}
                        className="flex-1 bg-transparent text-sm font-bold placeholder:text-stone-300 outline-none"
                    />
                    <div className="hidden sm:flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-white border border-stone-300 rounded-md text-[10px] font-bold text-stone-500 shadow-sm">ESC</kbd>
                    </div>
                </div>

                {/* Results List */}
                <div
                    ref={listRef}
                    className="max-h-[60vh] overflow-y-auto p-2 space-y-1 bg-white"
                >
                    {results.length === 0 && query.trim() && (
                        <div className="p-8 text-center text-stone-400 font-medium">
                            No results found for "{query}"
                        </div>
                    )}

                    {results.length === 0 && !query.trim() && (
                        <div className="p-12 flex flex-col items-center justify-center text-stone-300 gap-2">
                            <Command size={32} strokeWidth={1} />
                            <p className="text-xs font-bold uppercase tracking-widest">Type to search...</p>
                        </div>
                    )}

                    {results.map((result, index) => (
                        <div
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleSelect(result)}
                            className={`flex items-center gap-3 p-2 cursor-pointer border-2 transition-all ${index === selectedIndex
                                ? 'border-black bg-stone-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                                : 'border-transparent hover:border-stone-200 hover:bg-stone-50'
                                }`}
                        >
                            <div className={`w-10 h-10 flex items-center justify-center border-2 border-black bg-white shadow-sm shrink-0 ${result.type === 'habit' ? 'text-blue-500' : 'text-orange-500'
                                }`}>
                                {result.type === 'habit' ? <CheckSquare size={20} /> : <Calendar size={20} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-black text-xs truncate">{result.title}</h4>
                                {result.subtitle && (
                                    <p className="text-[10px] text-stone-500 font-medium whitespace-pre-wrap mt-0.5">{result.subtitle}</p>
                                )}
                            </div>

                            {index === selectedIndex && (
                                <ArrowRight size={16} className="text-black animate-pulse" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer Helper */}
                {results.length > 0 && (
                    <div className="px-4 py-2 border-t-2 border-black bg-stone-100 flex justify-between items-center text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                        <span>Use arrows to navigate</span>
                        <span>Enter to select</span>
                    </div>
                )}
            </div>
        </div>
    );
};
