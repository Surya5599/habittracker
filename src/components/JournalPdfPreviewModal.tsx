import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Download, Search, X } from 'lucide-react';
import { DailyNote, Theme } from '../types';
import {
    buildJournalCoverHtml,
    buildJournalPrintHtml,
    downloadJournalPdfFromIframe,
    formatJournalLongDate,
    formatJournalShortDate,
    getJournalExportEntries,
    PDF_FONTS,
    PdfFont,
    PdfLayout,
} from '../utils/exportJournalPdf';

interface JournalPdfPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    notes: DailyNote;
    theme: Theme;
    userName?: string;
}

export const JournalPdfPreviewModal: React.FC<JournalPdfPreviewModalProps> = ({
    isOpen,
    onClose,
    notes,
    theme,
    userName = 'You',
}) => {
    const [pdfFont, setPdfFont] = useState<PdfFont>('serif');
    const [pdfLayout, setPdfLayout] = useState<PdfLayout>('compact');
    const [query, setQuery] = useState('');
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const downloadIframeRef = useRef<HTMLIFrameElement>(null);
    const previewIframeRef = useRef<HTMLIFrameElement>(null);

    const entries = useMemo(() => getJournalExportEntries(notes), [notes]);
    const filteredEntries = useMemo(() => {
        if (!query.trim()) return entries;
        const q = query.toLowerCase();
        return entries.filter(e =>
            (e.journal || '').toLowerCase().includes(q) ||
            formatJournalLongDate(e.date).toLowerCase().includes(q)
        );
    }, [entries, query]);

    // Reset page when filter changes
    useEffect(() => {
        setCurrentIdx(0);
    }, [filteredEntries]);

    const rangeLabel = entries.length
        ? `${formatJournalShortDate(entries[0].date)} – ${formatJournalShortDate(entries[entries.length - 1].date)}`
        : 'No entries';

    // Page 0 = cover, pages 1..N = entries
    const totalPages = filteredEntries.length > 0 ? 1 + filteredEntries.length : 0;
    const clampedIdx = Math.min(currentIdx, Math.max(0, totalPages - 1));
    const isCover = totalPages > 0 && clampedIdx === 0;
    const entryPageIdx = isCover ? -1 : clampedIdx - 1;
    const currentEntry = entryPageIdx >= 0 ? filteredEntries[entryPageIdx] : null;

    // Update preview whenever the current page or options change
    useEffect(() => {
        if (!isOpen || !previewIframeRef.current) return;
        if (totalPages === 0) {
            previewIframeRef.current.srcdoc = `<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:Arial,sans-serif;color:#a8a29e;font-size:13px;background:#ece8df;">No entries to preview</body></html>`;
            return;
        }
        let html: string;
        if (isCover) {
            html = buildJournalCoverHtml({ entries: filteredEntries, theme, userName, font: pdfFont });
        } else if (currentEntry) {
            html = buildJournalPrintHtml({
                entries: [currentEntry],
                theme,
                userName,
                font: pdfFont,
                layout: 'fullpage',
                entryOffset: entryPageIdx,
                includeCover: false,
                previewMode: true,
            });
        } else {
            return;
        }
        previewIframeRef.current.srcdoc = html;
    }, [isOpen, pdfFont, isCover, currentEntry, entryPageIdx, theme, userName, totalPages, filteredEntries]);

    const handleDownload = async () => {
        if (!downloadIframeRef.current || !filteredEntries.length) return;
        try {
            setIsDownloading(true);
            await downloadJournalPdfFromIframe(downloadIframeRef.current, filteredEntries, theme, userName, pdfFont, pdfLayout);
        } finally {
            setIsDownloading(false);
        }
    };

    if (!isOpen) return null;

    const canPrev = clampedIdx > 0;
    const canNext = clampedIdx < totalPages - 1;

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="flex flex-col w-full max-w-6xl overflow-hidden border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                style={{ height: 'min(94vh, 900px)', backgroundColor: '#fdfdf8' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Top bar */}
                <div className="flex items-center gap-3 px-4 py-3 border-b-[3px] border-black bg-white shrink-0">
                    <BookOpen size={15} style={{ color: theme.primary }} />
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-black uppercase tracking-tight text-black leading-tight">Export Journal</h2>
                        <p className="text-[10px] font-medium text-stone-400 leading-tight">
                            {filteredEntries.length}{query ? ` of ${entries.length}` : ''} {entries.length === 1 ? 'entry' : 'entries'} · {rangeLabel}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 border-2 border-stone-200 focus-within:border-black bg-stone-50 transition-colors">
                        <Search size={12} className="text-stone-400 shrink-0" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Filter entries…"
                            className="text-[11px] font-medium text-stone-700 placeholder:text-stone-300 outline-none bg-transparent w-28"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="text-stone-300 hover:text-stone-600">
                                <X size={10} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={!filteredEntries.length || isDownloading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border-[3px] border-black text-[10px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        style={{ backgroundColor: theme.primary }}
                    >
                        <Download size={12} strokeWidth={3} />
                        {isDownloading ? 'Preparing…' : 'Export PDF'}
                    </button>
                    <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-black hover:bg-stone-100 rounded transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Body: sidebar + preview */}
                <div className="flex flex-1 min-h-0 overflow-hidden">

                    {/* Options sidebar */}
                    <div className="w-48 shrink-0 border-r-[3px] border-black flex flex-col gap-5 p-4 overflow-y-auto bg-stone-50">

                        {/* Font */}
                        <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Font</span>
                            <div className="flex flex-col border-2 border-black divide-y-2 divide-black overflow-hidden shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                                {(Object.keys(PDF_FONTS) as PdfFont[]).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setPdfFont(f)}
                                        className={`px-3 py-2.5 text-left transition-colors ${pdfFont === f ? 'bg-black text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
                                    >
                                        <p
                                            className="text-[12px] font-bold leading-none"
                                            style={{ fontFamily: PDF_FONTS[f].stack.split(',')[0].replace(/'/g, '') }}
                                        >
                                            {PDF_FONTS[f].label}
                                        </p>
                                        <p
                                            className={`text-[9px] mt-1 leading-none ${pdfFont === f ? 'text-white/50' : 'text-stone-400'}`}
                                            style={{ fontFamily: PDF_FONTS[f].stack.split(',')[0].replace(/'/g, '') }}
                                        >
                                            Aa Bb Cc
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Layout (export only — preview always shows full page) */}
                        <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Export Layout</span>
                            <div className="flex flex-col border-2 border-black divide-y-2 divide-black overflow-hidden shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                                {([
                                    { value: 'compact' as PdfLayout, label: 'Multi-page', desc: 'Multiple per page' },
                                    { value: 'fullpage' as PdfLayout, label: 'Full page', desc: 'One entry per page' },
                                ]).map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setPdfLayout(opt.value)}
                                        className={`px-3 py-2.5 text-left transition-colors ${pdfLayout === opt.value ? 'bg-black text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
                                    >
                                        <p className="text-[10px] font-black uppercase tracking-wide leading-none">{opt.label}</p>
                                        <p className={`text-[9px] mt-1 leading-snug ${pdfLayout === opt.value ? 'text-white/50' : 'text-stone-400'}`}>{opt.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="mt-auto pt-4 border-t-2 border-stone-200">
                            <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                                {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                            </p>
                            {entries.length > 0 && (
                                <p className="text-[10px] font-medium text-stone-500 mt-0.5 leading-snug">{rangeLabel}</p>
                            )}
                        </div>
                    </div>

                    {/* Preview area */}
                    <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-stone-300">

                        {/* Page navigation bar */}
                        <div className="flex items-center justify-between px-3 py-1.5 border-b-2 border-stone-400 bg-stone-200 shrink-0">
                            <button
                                onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                                disabled={!canPrev}
                                className="flex items-center gap-1 px-2 py-1 border-2 border-stone-400 bg-white text-stone-600 text-[9px] font-black uppercase tracking-wide disabled:opacity-30 hover:border-black hover:text-black transition-all disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={12} strokeWidth={2.5} />
                                Prev
                            </button>

                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">
                                    {totalPages > 0 ? `${clampedIdx + 1} / ${totalPages}` : '—'}
                                </span>
                                <span className="text-[9px] text-stone-400">
                                    {isCover ? 'Cover' : currentEntry ? formatJournalShortDate(currentEntry.date) : ''}
                                </span>
                            </div>

                            <button
                                onClick={() => setCurrentIdx(i => Math.min(filteredEntries.length - 1, i + 1))}
                                disabled={!canNext}
                                className="flex items-center gap-1 px-2 py-1 border-2 border-stone-400 bg-white text-stone-600 text-[9px] font-black uppercase tracking-wide disabled:opacity-30 hover:border-black hover:text-black transition-all disabled:cursor-not-allowed"
                            >
                                Next
                                <ChevronRight size={12} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Iframe page preview */}
                        <iframe
                            ref={previewIframeRef}
                            title="pdf-preview"
                            className="flex-1 w-full border-none"
                            sandbox="allow-same-origin"
                        />
                    </div>
                </div>
            </div>

            {/* Hidden iframe for print dialog */}
            <iframe ref={downloadIframeRef} title="pdf-download-frame" className="hidden" />
        </div>
    );
};
