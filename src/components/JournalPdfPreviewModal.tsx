import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Download, Maximize2, Minus, Plus, Search, X } from 'lucide-react';
import { DailyNote, Habit, HabitCompletion, Theme } from '../types';
import { buildJournalReviewData, JournalNarrative, JournalReviewData } from '../utils/journalReview';
import {
    buildJournalCoverHtml,
    buildJournalReviewHtml,
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
    isDarkMode?: boolean;
    /** Year in Review data. When habits are present the export opens with two
     *  data pages before the daily entries. */
    habits?: Habit[];
    /** needed so each entry can show that day's completed habits */
    completions?: HabitCompletion;
    annualStats?: any;
    reviewYear?: number;
    narrative?: JournalNarrative;
}

// Stable fallbacks. Inline `= []` / `= {}` defaults mint a new object on every
// render, which invalidates the entries memo, which retriggers the "reset to
// page 1 when the filter changes" effect on every render - pagination then
// never advances. Module-level constants keep the identity stable.
const NO_HABITS: Habit[] = [];
const NO_COMPLETIONS: HabitCompletion = {};

export const JournalPdfPreviewModal: React.FC<JournalPdfPreviewModalProps> = ({
    isOpen,
    onClose,
    notes,
    theme,
    userName = 'You',
    isDarkMode = false,
    habits = NO_HABITS,
    completions = NO_COMPLETIONS,
    annualStats = null,
    reviewYear,
    narrative,
}) => {
    const [pdfFont, setPdfFont] = useState<PdfFont>('serif');
    const [pdfLayout, setPdfLayout] = useState<PdfLayout>('compact');
    const [query, setQuery] = useState('');
    const [currentIdx, setCurrentIdx] = useState(0);
    const [pageInputValue, setPageInputValue] = useState('');
    const [isEditingPage, setIsEditingPage] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [previewScale, setPreviewScale] = useState(1);
    const [zoomMultiplier, setZoomMultiplier] = useState(1);
    const pageInputRef = useRef<HTMLInputElement>(null);
    const downloadIframeRef = useRef<HTMLIFrameElement>(null);
    const previewIframeRef = useRef<HTMLIFrameElement>(null);
    // scrollTop of each printed page, derived by measuring the real document
    const [compactPageOffsets, setCompactPageOffsets] = useState<number[]>([]);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Letter page at 96 dpi
    const PAGE_W = 816;
    const PAGE_H = 1056;

    useEffect(() => {
        const el = previewContainerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setPreviewScale(Math.min(width / PAGE_W, height / PAGE_H) * 0.97);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const entries = useMemo(
        () => getJournalExportEntries(notes, habits, completions),
        [notes, habits, completions],
    );

    // Year in Review only makes sense once something has been tracked.
    const review = useMemo<JournalReviewData | null>(() => {
        if (!annualStats || !habits.length) return null;
        return buildJournalReviewData({
            year: reviewYear ?? new Date().getFullYear(),
            annualStats,
            habits,
            notes,
            narrative,
        });
    }, [annualStats, habits, notes, reviewYear, narrative]);
    const filteredEntries = useMemo(() => {
        if (!query.trim()) return entries;
        const q = query.toLowerCase();
        return entries.filter(e =>
            (e.journal || '').toLowerCase().includes(q) ||
            formatJournalLongDate(e.date).toLowerCase().includes(q)
        );
    }, [entries, query]);

    // Reset page when the filter or the layout changes — the two layouts have
    // completely different page counts.
    useEffect(() => {
        setCurrentIdx(0);
    }, [filteredEntries, pdfLayout]);

    const rangeLabel = entries.length
        ? `${formatJournalShortDate(entries[0].date)} – ${formatJournalShortDate(entries[entries.length - 1].date)}`
        : 'No entries';

    // Two genuinely different documents:
    //   fullpage — one entry per page, so the preview can render page N directly
    //   compact  — entries flow and the printer packs several per page, so the
    //              preview renders the whole document once and we measure where
    //              the page breaks actually land
    const isCompact = pdfLayout === 'compact';
    const reviewPages = review ? 2 : 0;
    const frontMatter = 1 + reviewPages;
    // Until the document has been measured (first paint, or any environment
    // without layout such as jsdom) fall back to the one-per-page count. It is
    // an upper bound, so navigation stays usable and simply tightens up once
    // the real break positions arrive.
    const totalPages = filteredEntries.length === 0
        ? 0
        : isCompact && compactPageOffsets.length > 0
            ? compactPageOffsets.length
            : frontMatter + filteredEntries.length;
    const clampedIdx = Math.min(currentIdx, Math.max(0, totalPages - 1));
    const isCover = !isCompact && totalPages > 0 && clampedIdx === 0;
    const reviewPageNo = !isCompact && review && clampedIdx >= 1 && clampedIdx <= reviewPages
        ? (clampedIdx as 1 | 2)
        : null;
    const entryPageIdx = !isCompact && clampedIdx >= frontMatter ? clampedIdx - frontMatter : -1;
    const currentEntry = entryPageIdx >= 0 ? filteredEntries[entryPageIdx] : null;

    // Keyboard navigation
    const goTo = useCallback((idx: number) => {
        setCurrentIdx(Math.max(0, Math.min(totalPages - 1, idx)));
    }, [totalPages]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (isEditingPage) return;
            if (e.key === 'ArrowLeft') goTo(clampedIdx - 1);
            if (e.key === 'ArrowRight') goTo(clampedIdx + 1);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, isEditingPage, clampedIdx, goTo]);

    // Focus page input when editing starts
    useEffect(() => {
        if (isEditingPage) pageInputRef.current?.select();
    }, [isEditingPage]);

    const commitPageInput = () => {
        const n = parseInt(pageInputValue, 10);
        if (!isNaN(n)) goTo(n - 1);
        setIsEditingPage(false);
    };

    // Update preview whenever the current page or options change
    useEffect(() => {
        if (!isOpen || !previewIframeRef.current) return;
        if (totalPages === 0) {
            previewIframeRef.current.srcdoc = `<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:Arial,sans-serif;color:#a8a29e;font-size:13px;background:${isDarkMode ? '#1a1a1a' : '#ece8df'};">No entries to preview</body></html>`;
            return;
        }
        let html: string;
        if (isCompact) {
            // exactly the document that gets printed
            html = buildJournalPrintHtml({
                entries: filteredEntries,
                theme,
                userName,
                font: pdfFont,
                layout: 'compact',
                includeCover: true,
                review,
                previewMode: true,
            });
        } else if (isCover) {
            html = buildJournalCoverHtml({ entries: filteredEntries, theme, userName, font: pdfFont });
        } else if (reviewPageNo && review) {
            html = buildJournalReviewHtml({ review, theme, userName, font: pdfFont, page: reviewPageNo });
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
    }, [isOpen, pdfFont, pdfLayout, isCompact, isCover, reviewPageNo, review, currentEntry, entryPageIdx, theme, userName, totalPages, filteredEntries]);

    // Measure where the printer will actually break the compact document.
    // Articles carry `break-inside: avoid`, so a page holds as many whole
    // articles as fit — pack them the same way rather than assuming a count.
    const measureCompactPages = useCallback(() => {
        const frame = previewIframeRef.current;
        const doc = frame?.contentDocument;
        if (!isCompact || !doc) return;

        const BODY_PADDING = 0.4 * 96;                 // matches the @page body padding
        const usable = PAGE_H - BODY_PADDING * 2;
        const articles = Array.from(doc.querySelectorAll('article')) as HTMLElement[];
        if (!articles.length) {
            setCompactPageOffsets([0]);
            return;
        }

        const offsets: number[] = [];
        let pageTop: number | null = null;
        articles.forEach(el => {
            const top = el.offsetTop;
            const bottom = top + el.offsetHeight;
            if (pageTop === null) {
                pageTop = top - BODY_PADDING;
                offsets.push(Math.max(0, pageTop));
            } else if (bottom - pageTop > usable) {
                pageTop = top - BODY_PADDING;
                offsets.push(Math.max(0, pageTop));
            }
        });
        setCompactPageOffsets(offsets);
    }, [isCompact, PAGE_H]);

    // Scroll the flowing document to the selected page.
    useEffect(() => {
        if (!isCompact) return;
        const win = previewIframeRef.current?.contentWindow;
        const top = compactPageOffsets[clampedIdx];
        if (win && typeof top === 'number') win.scrollTo(0, top);
    }, [isCompact, clampedIdx, compactPageOffsets]);

    const handleDownload = async () => {
        if (!downloadIframeRef.current || !filteredEntries.length) return;
        try {
            setIsDownloading(true);
            await downloadJournalPdfFromIframe(downloadIframeRef.current, filteredEntries, theme, userName, pdfFont, pdfLayout, review);
        } finally {
            setIsDownloading(false);
        }
    };

    if (!isOpen) return null;

    const canPrev = clampedIdx > 0;
    const canNext = clampedIdx < totalPages - 1;

    return (
        <div
            className="fixed inset-0 z-preview flex items-center justify-center bg-scrim p-3 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="flex flex-col w-full max-w-6xl overflow-hidden border-3 border-edge-strong shadow-neo-lg rounded-modal"
                style={{ height: 'min(94vh, 900px)', backgroundColor: isDarkMode ? '#1a1a1a' : '#fdfdf8' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Top bar */}
                <div className="flex items-center gap-3 px-4 py-3 border-b-3 border-edge-strong bg-surface shrink-0">
                    <BookOpen size={15} style={{ color: theme.primary }} />
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-black uppercase tracking-tight text-ink-strong leading-tight">Export Journal</h2>
                        <p className="text-[10px] font-medium text-ink-subtle leading-tight">
                            {filteredEntries.length}{query ? ` of ${entries.length}` : ''} {entries.length === 1 ? 'entry' : 'entries'} · {rangeLabel}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 border-2 border-edge focus-within:border-edge-strong bg-surface-muted transition-colors">
                        <Search size={12} className="text-ink-subtle shrink-0" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Filter entries…"
                            className="text-[11px] font-medium text-ink placeholder:text-ink-dim outline-none bg-transparent w-28"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="text-ink-dim hover:text-ink">
                                <X size={10} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={!filteredEntries.length || isDownloading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border-3 border-edge-strong text-[10px] font-black uppercase tracking-widest text-ink-inverse shadow-neo hover:-translate-y-0.5 hover:shadow-neo active:translate-y-0 active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-neo"
                        style={{ backgroundColor: theme.primary }}
                    >
                        <Download size={12} strokeWidth={3} />
                        {isDownloading ? 'Preparing…' : 'Export PDF'}
                    </button>
                    <button onClick={onClose} className="p-1.5 text-ink-subtle hover:text-ink-strong hover:bg-surface-strong rounded transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Body: sidebar + preview */}
                <div className="flex flex-1 min-h-0 overflow-hidden">

                    {/* Options sidebar */}
                    <div className="w-48 shrink-0 border-r-3 border-edge-strong flex flex-col gap-5 p-4 overflow-y-auto bg-surface-muted">

                        {/* Font */}
                        <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-ink-subtle">Font</span>
                            <div className="flex flex-col border-2 border-edge-strong divide-y-2 divide-edge-strong overflow-hidden shadow-neo-sm">
                                {(Object.keys(PDF_FONTS) as PdfFont[]).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setPdfFont(f)}
                                        className={`px-3 py-2.5 text-left transition-colors ${pdfFont === f ? 'bg-theme-primary text-theme-ink' : 'bg-surface text-ink hover:bg-surface-muted'}`}
                                    >
                                        <p
                                            className="text-[12px] font-bold leading-none"
                                            style={{ fontFamily: PDF_FONTS[f].stack.split(',')[0].replace(/'/g, '') }}
                                        >
                                            {PDF_FONTS[f].label}
                                        </p>
                                        <p
                                            className={`text-[9px] mt-1 leading-none ${pdfFont === f ? 'text-ink-inverse/50' : 'text-ink-subtle'}`}
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
                            <span className="text-[9px] font-black uppercase tracking-widest text-ink-subtle">Export Layout</span>
                            <div className="flex flex-col border-2 border-edge-strong divide-y-2 divide-edge-strong overflow-hidden shadow-neo-sm">
                                {([
                                    { value: 'compact' as PdfLayout, label: 'Multi-page', desc: 'Multiple per page' },
                                    { value: 'fullpage' as PdfLayout, label: 'Full page', desc: 'One entry per page' },
                                ]).map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setPdfLayout(opt.value)}
                                        className={`px-3 py-2.5 text-left transition-colors ${pdfLayout === opt.value ? 'bg-theme-primary text-theme-ink' : 'bg-surface text-ink hover:bg-surface-muted'}`}
                                    >
                                        <p className="text-[10px] font-black uppercase tracking-wide leading-none">{opt.label}</p>
                                        <p className={`text-[9px] mt-1 leading-snug ${pdfLayout === opt.value ? 'text-theme-ink/70' : 'text-ink-subtle'}`}>{opt.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="mt-auto pt-4 border-t-2 border-edge">
                            <p className="text-[9px] font-black uppercase tracking-widest text-ink-subtle">
                                {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                            </p>
                            {entries.length > 0 && (
                                <p className="text-[10px] font-medium text-ink-muted mt-0.5 leading-snug">{rangeLabel}</p>
                            )}
                        </div>
                    </div>

                    {/* Preview area */}
                    <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-surface-sunken">

                        {/* Top nav bar */}
                        <div className="flex items-center justify-between px-3 py-1.5 border-b-2 border-edge-muted bg-edge shrink-0">
                            <button
                                onClick={() => goTo(clampedIdx - 1)}
                                disabled={!canPrev}
                                className="flex items-center gap-1 px-2 py-1 border-2 border-edge-muted bg-surface text-ink text-[9px] font-black uppercase tracking-wide disabled:opacity-30 hover:border-edge-strong hover:text-ink-strong transition-all disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={12} strokeWidth={2.5} />
                                Prev
                            </button>

                            <div className="flex items-center gap-2">
                                {/* Clickable page selector */}
                                {isEditingPage ? (
                                    <input
                                        ref={pageInputRef}
                                        type="number"
                                        min={1}
                                        max={totalPages}
                                        value={pageInputValue}
                                        onChange={e => setPageInputValue(e.target.value)}
                                        onBlur={commitPageInput}
                                        onKeyDown={e => { if (e.key === 'Enter') commitPageInput(); if (e.key === 'Escape') setIsEditingPage(false); }}
                                        className="w-10 text-center text-[11px] font-black border-2 border-edge-strong outline-none bg-surface text-ink-strong py-1"
                                    />
                                ) : (
                                    <button
                                        onClick={() => { setPageInputValue(String(clampedIdx + 1)); setIsEditingPage(true); }}
                                        className="text-[9px] font-black uppercase tracking-widest text-ink-muted hover:text-ink-strong transition-colors"
                                        title="Click to jump to page"
                                    >
                                        {totalPages > 0 ? `${clampedIdx + 1} / ${totalPages}` : '—'}
                                    </button>
                                )}
                                <span className="text-[9px] text-ink-subtle">
                                    {isCover ? 'Cover' : currentEntry ? formatJournalShortDate(currentEntry.date) : ''}
                                </span>
                            </div>

                            <button
                                onClick={() => goTo(clampedIdx + 1)}
                                disabled={!canNext}
                                className="flex items-center gap-1 px-2 py-1 border-2 border-edge-muted bg-surface text-ink text-[9px] font-black uppercase tracking-wide disabled:opacity-30 hover:border-edge-strong hover:text-ink-strong transition-all disabled:cursor-not-allowed"
                            >
                                Next
                                <ChevronRight size={12} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Scaled page preview — scrollable when zoomed in */}
                        <div ref={previewContainerRef} className="flex-1 min-h-0 overflow-auto bg-surface-sunken">
                            <div className="min-w-full min-h-full flex items-center justify-center p-4">
                                <div style={{
                                    width: Math.round(PAGE_W * previewScale * zoomMultiplier),
                                    height: Math.round(PAGE_H * previewScale * zoomMultiplier),
                                    flexShrink: 0,
                                    position: 'relative',
                                }}>
                                    <iframe
                                        ref={previewIframeRef}
                                        title="pdf-preview"
                                        className="border-none absolute top-0 left-0"
                                        style={{
                                            width: PAGE_W,
                                            height: PAGE_H,
                                            transform: `scale(${previewScale * zoomMultiplier})`,
                                            transformOrigin: 'top left',
                                        }}
                                        sandbox="allow-same-origin"
                                        onLoad={measureCompactPages}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bottom bar: page nav + zoom controls */}
                        <div className="flex items-center justify-between px-3 py-2 border-t-2 border-edge-muted bg-edge shrink-0">
                            {/* Page navigation */}
                            <div className="flex items-center gap-3">
                                <button onClick={() => goTo(clampedIdx - 1)} disabled={!canPrev} className="p-1 text-ink-muted disabled:opacity-30 hover:text-ink-strong transition-colors">
                                    <ChevronLeft size={14} strokeWidth={2.5} />
                                </button>
                                <span className="text-[10px] font-black text-ink-muted tracking-widest">
                                    {totalPages > 0 ? `${clampedIdx + 1} / ${totalPages}` : '—'}
                                </span>
                                <button onClick={() => goTo(clampedIdx + 1)} disabled={!canNext} className="p-1 text-ink-muted disabled:opacity-30 hover:text-ink-strong transition-colors">
                                    <ChevronRight size={14} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Zoom controls */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setZoomMultiplier(z => Math.max(0.25, +(z - 0.25).toFixed(2)))}
                                    disabled={zoomMultiplier <= 0.25}
                                    className="p-1.5 border-2 border-edge-muted bg-surface text-ink disabled:opacity-30 hover:border-edge-strong hover:text-ink-strong transition-all disabled:cursor-not-allowed"
                                    title="Zoom out"
                                >
                                    <Minus size={10} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={() => setZoomMultiplier(1)}
                                    className="px-2 py-1 border-2 border-edge-muted bg-surface text-ink text-[9px] font-black uppercase tracking-wide hover:border-edge-strong hover:text-ink-strong transition-all min-w-[44px] text-center"
                                    title="Reset to fit"
                                >
                                    {zoomMultiplier === 1 ? <Maximize2 size={10} strokeWidth={2.5} className="mx-auto" /> : `${Math.round(zoomMultiplier * 100)}%`}
                                </button>
                                <button
                                    onClick={() => setZoomMultiplier(z => Math.min(4, +(z + 0.25).toFixed(2)))}
                                    disabled={zoomMultiplier >= 4}
                                    className="p-1.5 border-2 border-edge-muted bg-surface text-ink disabled:opacity-30 hover:border-edge-strong hover:text-ink-strong transition-all disabled:cursor-not-allowed"
                                    title="Zoom in"
                                >
                                    <Plus size={10} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden iframe for print dialog */}
            <iframe ref={downloadIframeRef} title="pdf-download-frame" className="hidden" />
        </div>
    );
};
