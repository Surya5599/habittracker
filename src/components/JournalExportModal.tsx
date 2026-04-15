import React, { useMemo, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import { DailyNote, Theme } from '../types';
import {
    downloadJournalPdfFromIframe,
    formatJournalLongDate,
    formatJournalShortDate,
    getJournalExportEntries,
    getJournalMoodMeta
} from '../utils/exportJournalPdf';

interface JournalExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    notes: DailyNote;
    theme: Theme;
    userName?: string;
}

export const JournalExportModal: React.FC<JournalExportModalProps> = ({
    isOpen,
    onClose,
    notes,
    theme,
    userName = 'You'
}) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const entries = useMemo(() => getJournalExportEntries(notes), [notes]);

    const rangeLabel = entries.length
        ? `${formatJournalShortDate(entries[0].date)} - ${formatJournalShortDate(entries[entries.length - 1].date)}`
        : 'No entries yet';

    const handleDownload = async () => {
        if (!iframeRef.current || !entries.length) return;

        try {
            setIsDownloading(true);
            await downloadJournalPdfFromIframe(iframeRef.current, entries, theme, userName);
        } finally {
            setIsDownloading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px]"
            onClick={onClose}
        >
            <div
                className="flex h-[min(92vh,980px)] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border-[3px] border-black bg-[#fcfbf7] shadow-[10px_10px_0px_0px_rgba(0,0,0,0.14)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-3 border-b-[3px] border-black bg-white px-4 py-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">My Journal</p>
                        <h2 className="truncate text-lg font-black uppercase tracking-wide text-stone-900">HabiCard Journal View</h2>
                        <p className="text-xs font-bold text-stone-500">{entries.length} entries • {rangeLabel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            disabled={!entries.length || isDownloading}
                            className="inline-flex items-center gap-2 rounded-2xl border-[2px] border-black bg-black px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Download size={14} />
                            {isDownloading ? 'Preparing PDF' : 'Download PDF'}
                        </button>
                        <button
                            onClick={onClose}
                            className="rounded-full border-2 border-stone-200 bg-white p-2 text-stone-700 transition hover:border-black hover:text-black"
                            aria-label="Close journal view"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-[#ece8df] p-4 sm:p-6">
                    {!entries.length ? (
                        <div className="mx-auto flex max-w-2xl flex-col items-center rounded-[32px] border border-stone-200 bg-white px-8 py-14 text-center shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Personal Journal</p>
                            <h3 className="mt-3 text-2xl font-black text-stone-900">Nothing to show yet</h3>
                            <p className="mt-3 max-w-md text-base leading-8 text-stone-500">
                                Add a mood or write a journal entry on any day, then open this view again to export your journal.
                            </p>
                        </div>
                    ) : (
                        <div className="mx-auto max-w-3xl space-y-8">
                            <section className="overflow-hidden rounded-[36px] border border-stone-200 bg-white shadow-[0_22px_60px_rgba(0,0,0,0.08)]">
                                <div
                                    className="h-2 w-full"
                                    style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})` }}
                                />
                                <div className="px-7 py-8 sm:px-10 sm:py-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">
                                        Personal Journal
                                    </p>
                                    <h3 className="mt-3 text-4xl font-black text-stone-900 sm:text-5xl">My Journal</h3>
                                    <p className="mt-4 max-w-2xl text-base leading-8 text-stone-600">
                                        A calm, chronological reading view of your moods and reflections, designed to feel like a private diary.
                                    </p>
                                    <div className="mt-6 flex flex-wrap gap-3 text-sm text-stone-600">
                                        <div className="rounded-full bg-stone-100 px-4 py-2 font-semibold">
                                            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                                        </div>
                                        <div className="rounded-full bg-stone-100 px-4 py-2 font-semibold">
                                            {rangeLabel}
                                        </div>
                                        <div className="rounded-full bg-stone-100 px-4 py-2 font-semibold">
                                            {userName}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {entries.map((entry) => {
                                const mood = getJournalMoodMeta(entry.mood);
                                const paragraphs = entry.journal
                                    ? entry.journal.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean)
                                    : [];

                                return (
                                    <article
                                        key={entry.dateKey}
                                        className="overflow-hidden rounded-[34px] border border-stone-200 bg-white shadow-[0_18px_42px_rgba(0,0,0,0.06)]"
                                    >
                                        <div className="px-7 py-8 sm:px-10 sm:py-10">
                                            <header className="border-b border-stone-200 pb-6">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">Journal Entry</p>
                                                        <h4 className="mt-3 text-3xl font-black leading-tight text-stone-900 sm:text-4xl">
                                                            {formatJournalLongDate(entry.date)}
                                                        </h4>
                                                    </div>
                                                    <div
                                                        className="inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
                                                        style={{
                                                            backgroundColor: mood.fill,
                                                            color: mood.accent
                                                        }}
                                                    >
                                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: mood.accent }} />
                                                        {mood.label}
                                                    </div>
                                                </div>
                                            </header>

                                            <section className="pt-7">
                                                {paragraphs.length ? (
                                                    <div className="space-y-5">
                                                        {paragraphs.map((paragraph, index) => (
                                                            <p
                                                                key={`${entry.dateKey}-${index}`}
                                                                className="whitespace-pre-wrap text-[17px] leading-9 text-stone-700"
                                                            >
                                                                {paragraph}
                                                            </p>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-[17px] italic leading-9 text-stone-400">
                                                        Mood logged, no entry written for this day.
                                                    </p>
                                                )}
                                            </section>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>

                <iframe ref={iframeRef} title="journal-pdf-frame" className="hidden" />
            </div>
        </div>
    );
};
