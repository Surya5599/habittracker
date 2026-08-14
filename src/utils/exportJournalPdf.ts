import { DailyNote, Habit, HabitCompletion, Theme } from '../types';
import { isCompleted } from './stats';
import { isHabitActiveOnDate, isHabitManuallyInactive } from './habitActivity';
import { MOOD_SCALE, MOOD_TINTS } from '../constants';
import {
    buildReviewDataPageHtml,
    buildReviewStoryPageHtml,
    JournalReviewData,
    mixJournalColor,
    JOURNAL_PAPER,
    JOURNAL_INK,
    JOURNAL_INK_SOFT,
    JOURNAL_INK_MUTE,
    JOURNAL_RULE,
    JOURNAL_DISPLAY,
    JOURNAL_LABEL,
    journalSectionHead,
} from './journalReview';

export interface JournalExportEntry {
    dateKey: string;
    date: Date;
    mood?: number;
    journal?: string;
    /** habits actually completed that day, in the user's own habit colours */
    habitsDone: { name: string; color: string }[];
    /** how many habits were due that day, so "2 of 3" is meaningful */
    habitsDue: number;
    tasksDone: string[];
    tasksTotal: number;
}

export type PdfFont = 'serif' | 'sans' | 'mono';
export type PdfLayout = 'compact' | 'fullpage';

export const PDF_FONTS: Record<PdfFont, { label: string; stack: string }> = {
    serif:  { label: 'Serif',       stack: "Georgia,'Times New Roman',serif" },
    sans:   { label: 'Sans-serif',  stack: "Arial,Helvetica,sans-serif" },
    mono:   { label: 'Monospace',   stack: "'Courier New',Courier,monospace" },
};

interface BuildJournalPrintHtmlOptions {
    entries: JournalExportEntry[];
    theme: Theme;
    userName?: string;
    font?: PdfFont;
    layout?: PdfLayout;
    entryOffset?: number; // index of first entry in the full list (for correct numbering)
    includeCover?: boolean;
    previewMode?: boolean;
    /** When present, two data-driven "Year in Review" pages open the document,
     *  between the cover and the first daily entry. */
    review?: JournalReviewData | null;
    includeReview?: boolean;
}

const escapeHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const formatJournalLongDate = (date: Date) => new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
}).format(date);

export const formatJournalShortDate = (date: Date) => new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
}).format(date);

/** "February 14, 2026" - the weekday is shown separately as the kicker. */
export const formatJournalDisplayDate = (date: Date) => new Intl.DateTimeFormat(undefined, {
    month: 'long', day: 'numeric', year: 'numeric'
}).format(date);

export const getJournalMoodMeta = (mood?: number) => {
    switch (mood) {
        case 1:
            return { label: 'Very Bad', accent: MOOD_SCALE[0], fill: MOOD_TINTS[0] };
        case 2:
            return { label: 'Bad', accent: MOOD_SCALE[1], fill: MOOD_TINTS[1] };
        case 3:
            return { label: 'Okay', accent: MOOD_SCALE[2], fill: MOOD_TINTS[2] };
        case 4:
            return { label: 'Good', accent: MOOD_SCALE[3], fill: MOOD_TINTS[3] };
        case 5:
            return { label: 'Very Good', accent: MOOD_SCALE[4], fill: MOOD_TINTS[4] };
        default:
            return { label: 'Not logged', accent: '#78716c', fill: '#f5f5f4' };
    }
};

const getJournalText = (journal: DailyNote[string]['journal']): string => {
    if (!journal) return '';
    if (Array.isArray(journal)) return journal.map((e: any) => e?.text || '').filter(Boolean).join('\n\n');
    return journal.trim();
};

export const getJournalExportEntries = (
    notes: DailyNote,
    habits: Habit[] = [],
    completions: HabitCompletion = {},
): JournalExportEntry[] => {
    return Object.entries(notes)
        .map(([dateKey, dayData]) => {
            const journal = getJournalText(dayData.journal);
            const hasJournal = Boolean(journal);
            const hasMood = typeof dayData.mood === 'number';

            // A day still only becomes an entry because something was written or a
            // mood was logged. Habits and tasks enrich those days; they don't turn
            // every tracked day into a page.
            if (!hasJournal && !hasMood) {
                return null;
            }

            const date = new Date(`${dateKey}T12:00:00`);
            const active = habits.filter(h =>
                isHabitActiveOnDate(h, date) && !isHabitManuallyInactive(notes, dateKey, h.id));
            // weeklyTarget habits can be done on any day, so they always count as due
            const due = active.filter(h => h.weeklyTarget || !h.frequency || h.frequency.includes(date.getDay()));
            const habitsDone = active
                .filter(h => isCompleted(h.id, date.getDate(), completions, date.getMonth(), date.getFullYear()))
                .map(h => ({ name: h.name, color: h.color }));

            const tasks = Array.isArray(dayData.tasks) ? dayData.tasks : [];

            return {
                dateKey,
                date,
                mood: dayData.mood,
                journal,
                habitsDone,
                habitsDue: due.length,
                tasksDone: tasks.filter(t => t?.completed).map(t => t.text).filter(Boolean),
                tasksTotal: tasks.length,
            };
        })
        .filter((entry): entry is JournalExportEntry => Boolean(entry))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
};

const MOOD_SVG_ICON: Record<number, string> = {
    1: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><circle cx="9" cy="9" r="0.5" fill="currentColor"/><circle cx="15" cy="9" r="0.5" fill="currentColor"/></svg>`,
    2: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><circle cx="9" cy="9" r="0.5" fill="currentColor"/><circle cx="15" cy="9" r="0.5" fill="currentColor"/></svg>`,
    3: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><circle cx="9" cy="9" r="0.5" fill="currentColor"/><circle cx="15" cy="9" r="0.5" fill="currentColor"/></svg>`,
    4: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="0.5" fill="currentColor"/><circle cx="15" cy="9" r="0.5" fill="currentColor"/></svg>`,
    5: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="0.5" fill="currentColor"/><circle cx="15" cy="9" r="0.5" fill="currentColor"/></svg>`,
};

// One print palette for the whole document, imported from journalReview so the
// cover, the Year in Review pages and the daily entries cannot drift apart.
const PAPER_PDF = JOURNAL_PAPER;
const INK_PDF = JOURNAL_INK;
const INK_SOFT_PDF = JOURNAL_INK_SOFT;
const MUTE_PDF = JOURNAL_INK_MUTE;
const RULE_PDF = JOURNAL_RULE;
const DISPLAY_PDF = JOURNAL_DISPLAY;
const LABEL_PDF = JOURNAL_LABEL;


const buildCoverArticleHtml = (
    entries: JournalExportEntry[],
    theme: Theme,
    userName: string,
    fontStack: string,
    _accentMuted: string,
): string => {
    const rangeLabel = entries.length > 0
        ? `${formatJournalShortDate(entries[0].date)} \u2013 ${formatJournalShortDate(entries[entries.length - 1].date)}`
        : '';
    const year = entries.length > 0
        ? entries[entries.length - 1].date.getFullYear().toString()
        : new Date().getFullYear().toString();

    // Single hairline + one soft shadow. The previous cover stacked a 3px black
    // border against an offset solid-black box, which read as a rendering
    // artifact rather than a deliberate layer, and it also clashed with the
    // hairline language of the Year in Review pages that follow it.
    return `
<article style="position:relative;background:${PAPER_PDF};border:1px solid ${RULE_PDF};box-shadow:0 2px 20px rgba(28,25,23,0.10);min-height:9.5in;display:flex;flex-direction:column;padding:0.5in 0.52in 0.34in;-webkit-print-color-adjust:exact;print-color-adjust:exact;">

  <div style="display:flex;align-items:baseline;justify-content:space-between;padding-bottom:9px;border-bottom:1px solid ${INK_PDF};">
    <span style="font-family:${LABEL_PDF};font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.26em;color:${INK_PDF};">HabiCard Journal</span>
    <span style="font-family:${LABEL_PDF};font-size:7.5px;text-transform:uppercase;letter-spacing:0.2em;color:${MUTE_PDF};">${escapeHtml(year)}</span>
  </div>

  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
    <p style="margin:0 0 14px;font-family:${LABEL_PDF};font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.28em;color:${MUTE_PDF};">Personal journal</p>
    <h1 style="margin:0;font-family:${DISPLAY_PDF};font-size:92px;font-weight:400;letter-spacing:-0.035em;color:${INK_PDF};line-height:0.86;">${escapeHtml(year)}</h1>
    <div style="margin:22px 0 20px;height:3px;width:52px;background:${theme.primary};-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
    ${rangeLabel ? `<p style="margin:0 0 6px;font-family:${fontStack};font-size:13px;color:${INK_SOFT_PDF};">${escapeHtml(rangeLabel)}</p>` : ''}
    <p style="margin:0;font-family:${LABEL_PDF};font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.16em;color:${MUTE_PDF};">${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} &nbsp;·&nbsp; ${escapeHtml(userName)}</p>
  </div>

  <div style="display:flex;align-items:baseline;justify-content:space-between;padding-top:12px;border-top:1px solid ${RULE_PDF};">
    <span style="font-family:${LABEL_PDF};font-size:7px;text-transform:uppercase;letter-spacing:0.2em;color:${MUTE_PDF};">Private</span>
    <span style="font-family:${LABEL_PDF};font-size:7px;text-transform:uppercase;letter-spacing:0.2em;color:${MUTE_PDF};">Kept by hand</span>
  </div>

</article>`;
};

const PREVIEW_STYLES = `
    html,body{height:100%;overflow:hidden;}
    .page{height:100vh;display:flex;flex-direction:column;}
    article{flex:1;min-height:0!important;height:100%!important;}
`;

export const buildJournalCoverHtml = ({
    entries,
    theme,
    userName = 'You',
    font = 'serif',
}: {
    entries: JournalExportEntry[];
    theme: Theme;
    userName?: string;
    font?: PdfFont;
}): string => {
    const fontStack = PDF_FONTS[font].stack;
    const accentMuted = theme.primary + '55';
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Journal Cover</title>
  <style>
    *{box-sizing:border-box;}
    html,body{margin:0;padding:0;background:#f0ece4;color:#1c1917;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    body{font-family:Arial,Helvetica,sans-serif;padding:0.4in;}
    @page{size:letter;margin:0;}
    .page{max-width:7.6in;margin:0 auto;}
    ${PREVIEW_STYLES}
  </style>
</head>
<body>
<main class="page">
  ${buildCoverArticleHtml(entries, theme, userName, fontStack, accentMuted)}
</main>
</body>
</html>`;
};

/** Standalone document for one review page — the preview iframe renders a
 *  single page at a time. */
export const buildJournalReviewHtml = ({
    review,
    theme,
    userName = 'You',
    font = 'serif',
    page,
}: {
    review: JournalReviewData;
    theme: Theme;
    userName?: string;
    font?: PdfFont;
    page: 1 | 2;
}): string => {
    const fontStack = PDF_FONTS[font].stack;
    const body = page === 1
        ? buildReviewDataPageHtml(review, theme, userName, fontStack, false)
        : buildReviewStoryPageHtml(review, theme, userName, fontStack);
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Year in Review</title>
  <style>
    *{box-sizing:border-box;}
    html,body{margin:0;padding:0;background:#f0ece4;color:#1c1917;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    body{font-family:Arial,Helvetica,sans-serif;padding:0.4in;}
    @page{size:letter;margin:0;}
    .page{max-width:7.6in;margin:0 auto;}
    ${PREVIEW_STYLES}
    article{break-before:auto!important;page-break-before:auto!important;}
  </style>
</head>
<body><main class="page">${body}</main></body>
</html>`;
};

export const buildJournalPrintHtml = ({
    entries,
    theme,
    userName = 'You',
    font = 'serif',
    layout = 'compact',
    entryOffset = 0,
    includeCover = true,
    previewMode = false,
    review = null,
    includeReview = true,
}: BuildJournalPrintHtmlOptions) => {
    const fontStack = PDF_FONTS[font].stack;
    const firstDate = entries[0]?.date;
    const lastDate = entries[entries.length - 1]?.date;
    const rangeLabel = firstDate && lastDate
        ? `${formatJournalShortDate(firstDate)} – ${formatJournalShortDate(lastDate)}`
        : 'Journal archive';

    const accentMuted = theme.primary + '55';

    const cards = entries.map((entry, i) => {
        const entryIdx = i + entryOffset;
        const mood = getJournalMoodMeta(entry.mood);
        const moodIcon = entry.mood !== undefined ? (MOOD_SVG_ICON[entry.mood] ?? MOOD_SVG_ICON[4]) : '';
        const paragraphs = entry.journal
            ? entry.journal.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
            : [];
        const dayLong = entry.date.toLocaleDateString(undefined, { weekday: 'long' });
        const isFull = layout === 'fullpage';

        const journalBody = paragraphs.length
            ? paragraphs.map(p =>
                `<p style="font-family:${fontStack};font-size:13.5px;line-height:1.85;margin:0 0 1.15em;color:${INK_PDF};max-width:68ch;white-space:pre-wrap;">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`
              ).join('')
            : `<p style="font-family:${DISPLAY_PDF};font-size:12px;line-height:1.7;margin:0;color:${MUTE_PDF};font-style:italic;">Mood logged — nothing written for this day.</p>`;

        const moodBadge = entry.mood !== undefined
            ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;font-family:${LABEL_PDF};font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;white-space:nowrap;background:${mixJournalColor(mood.fill, PAPER_PDF, 0.4)};color:${mixJournalColor(mood.accent, INK_PDF, 0.55)};border:1px solid ${mixJournalColor(mood.accent, PAPER_PDF, 0.45)};flex-shrink:0;">
                <span style="display:inline-flex;align-items:center;">${moodIcon}</span>
                ${escapeHtml(mood.label)}
              </span>`
            : '';

        // ── the day's record, set as a two-page spread across the gutter ──────
        const tick = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="${MUTE_PDF}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:3px;"><polyline points="20 6 9 17 4 12"/></svg>`;

        const habitList = entry.habitsDone.length
            ? entry.habitsDone.map(h => `
      <div style="display:flex;align-items:baseline;gap:7px;padding:4px 0;">
        <span style="width:6px;height:6px;border-radius:50%;background:${h.color};flex-shrink:0;"></span>
        <span style="font-family:${fontStack};font-size:11px;line-height:1.45;color:${INK_PDF};">${escapeHtml(h.name)}</span>
      </div>`).join('')
            : `<p style="font-family:${DISPLAY_PDF};font-size:10.5px;font-style:italic;color:${MUTE_PDF};margin:2px 0 0;">Nothing marked off.</p>`;

        const taskList = entry.tasksDone.length
            ? entry.tasksDone.map(t => `
      <div style="display:flex;align-items:flex-start;gap:7px;padding:4px 0;">
        ${tick}
        <span style="font-family:${fontStack};font-size:11px;line-height:1.45;color:${INK_PDF};">${escapeHtml(t)}</span>
      </div>`).join('')
            : `<p style="font-family:${DISPLAY_PDF};font-size:10.5px;font-style:italic;color:${MUTE_PDF};margin:2px 0 0;">No tasks ticked off.</p>`;

        const tally = (done: number, total: number) => total > 0
            ? `<span style="font-family:${DISPLAY_PDF};font-size:10px;color:${MUTE_PDF};">${done} of ${total}</span>`
            : '';

        const dayRecord = `
  <div style="display:grid;grid-template-columns:1fr 1px 1fr;gap:${isFull ? '24px' : '18px'};padding:${isFull ? '20px' : '14px'} 0;border-bottom:1px solid ${RULE_PDF};">
    <div style="min-width:0;">
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:2px;">
        ${journalSectionHead('Habits completed')}
      </div>
      ${habitList}
      ${entry.habitsDue > 0 ? `<div style="margin-top:7px;">${tally(entry.habitsDone.length, entry.habitsDue)}</div>` : ''}
    </div>

    <!-- gutter -->
    <div style="background:${RULE_PDF};"></div>

    <div style="min-width:0;">
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:2px;">
        ${journalSectionHead('Tasks done')}
      </div>
      ${taskList}
      ${entry.tasksTotal > 0 ? `<div style="margin-top:7px;">${tally(entry.tasksDone.length, entry.tasksTotal)}</div>` : ''}
    </div>
  </div>`;

        const articleStyle = isFull
            ? `position:relative;background:${PAPER_PDF};border:1px solid ${RULE_PDF};box-shadow:0 2px 20px rgba(28,25,23,0.10);break-before:page;page-break-before:always;min-height:9.5in;display:flex;flex-direction:column;padding:0.5in 0.52in 0.34in;`
            : `position:relative;margin:0 0 0.28in;background:${PAPER_PDF};break-inside:avoid;page-break-inside:avoid;border:1px solid ${RULE_PDF};display:flex;flex-direction:column;padding:0.34in 0.4in 0.24in;`;

        return `
<article style="${articleStyle}">

  ${isFull ? `
  <div style="display:flex;align-items:baseline;justify-content:space-between;padding-bottom:9px;border-bottom:1px solid ${INK_PDF};">
    <span style="font-family:${LABEL_PDF};font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.26em;color:${INK_PDF};">HabiCard Journal</span>
    <span style="font-family:${LABEL_PDF};font-size:7.5px;text-transform:uppercase;letter-spacing:0.2em;color:${MUTE_PDF};">Journal entry</span>
  </div>` : ''}

  <!-- dateline -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:${isFull ? '26px' : '0'} 0 ${isFull ? '16px' : '12px'};">
    <div style="min-width:0;">
      <div style="font-family:${LABEL_PDF};font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.22em;color:${MUTE_PDF};">${escapeHtml(dayLong)}</div>
      <h2 style="margin:7px 0 0;font-family:${DISPLAY_PDF};font-size:${isFull ? '34px' : '22px'};font-weight:400;color:${INK_PDF};line-height:1.1;letter-spacing:-0.02em;">${escapeHtml(formatJournalDisplayDate(entry.date))}</h2>
      <div style="margin-top:${isFull ? '14px' : '10px'};height:3px;width:${isFull ? '42px' : '30px'};background:${theme.primary};-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
    </div>
    ${moodBadge}
  </div>

  ${dayRecord}

  <!-- the writing sits under the record -->
  <div style="padding:${isFull ? '20px' : '14px'} 0 0;">
    ${journalBody}
  </div>

  ${isFull ? `
  <div style="flex:1;min-height:0;margin-top:18px;padding-top:2px;border-top:1px solid ${RULE_PDF};">
    <div style="height:100%;background-image:repeating-linear-gradient(to bottom,transparent,transparent 25px,${RULE_PDF} 25px,${RULE_PDF} 26px);-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
  </div>

  <div style="display:flex;align-items:baseline;justify-content:space-between;padding-top:12px;border-top:1px solid ${RULE_PDF};">
    <span style="font-family:${LABEL_PDF};font-size:7px;text-transform:uppercase;letter-spacing:0.2em;color:${MUTE_PDF};">${escapeHtml(userName)}</span>
    <span style="font-family:${LABEL_PDF};font-size:7px;text-transform:uppercase;letter-spacing:0.2em;color:${MUTE_PDF};">Entry ${String(entryIdx + 1).padStart(2, '0')}</span>
  </div>` : `
  <div style="display:flex;align-items:baseline;justify-content:flex-end;padding-top:12px;">
    <span style="font-family:${LABEL_PDF};font-size:7px;text-transform:uppercase;letter-spacing:0.2em;color:${MUTE_PDF};">Entry ${String(entryIdx + 1).padStart(2, '0')}</span>
  </div>`}

</article>`;
    }).join('');

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>My Journal</title>
  <style>
    *{box-sizing:border-box;}
    html,body{margin:0;padding:0;background:#f0ece4;color:#1c1917;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    body{font-family:Arial,Helvetica,sans-serif;padding:0.4in;}
    @page{size:letter;margin:0;}
    .page{max-width:7.6in;margin:0 auto;}
    @media print{article{break-inside:avoid;page-break-inside:avoid;}}
    <!-- PREVIEW_STYLES force one article to fill the viewport, which is only
         right for the one-entry-per-page layout. Compact has to flow so the
         preview can paginate it the way the printer will. -->
    ${previewMode && layout === 'fullpage' ? PREVIEW_STYLES : ''}
  </style>
</head>
<body>
<main class="page">

  ${includeCover ? buildCoverArticleHtml(entries, theme, userName, fontStack, accentMuted) : ''}

  ${review && includeReview ? buildReviewDataPageHtml(review, theme, userName, fontStack, includeCover) : ''}
  ${review && includeReview ? buildReviewStoryPageHtml(review, theme, userName, fontStack) : ''}

  ${cards}

</main>
</body>
</html>`;
};

export const downloadJournalPdfFromIframe = async (
    iframe: HTMLIFrameElement,
    entries: JournalExportEntry[],
    theme: Theme,
    userName?: string,
    font?: PdfFont,
    layout?: PdfLayout,
    review?: JournalReviewData | null,
) => {
    if (!entries.length) {
        throw new Error('No journal or mood entries found to export.');
    }

    const html = buildJournalPrintHtml({ entries, theme, userName, font, layout, review });

    await new Promise<void>((resolve) => {
        const handleLoad = () => {
            iframe.removeEventListener('load', handleLoad);
            window.setTimeout(resolve, 250);
        };

        iframe.addEventListener('load', handleLoad);
        iframe.srcdoc = html;
    });

    const printWindow = iframe.contentWindow;

    if (!printWindow) {
        throw new Error('Unable to prepare the journal PDF preview.');
    }

    printWindow.focus();
    printWindow.print();

    return {
        filename: `habicard-journal-${entries[0].dateKey}-to-${entries[entries.length - 1].dateKey}.pdf`,
        entryCount: entries.length
    };
};
