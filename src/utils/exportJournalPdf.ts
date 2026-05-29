import { DailyNote, Theme } from '../types';

export interface JournalExportEntry {
    dateKey: string;
    date: Date;
    mood?: number;
    journal?: string;
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

export const getJournalMoodMeta = (mood?: number) => {
    switch (mood) {
        case 1:
            return { label: 'Very Bad', accent: '#ef4444', fill: '#fee2e2' };
        case 2:
            return { label: 'Bad', accent: '#f97316', fill: '#ffedd5' };
        case 3:
            return { label: 'Neutral', accent: '#eab308', fill: '#fef3c7' };
        case 4:
            return { label: 'Good', accent: '#84cc16', fill: '#ecfccb' };
        case 5:
            return { label: 'Very Good', accent: '#10b981', fill: '#d1fae5' };
        default:
            return { label: 'Not logged', accent: '#78716c', fill: '#f5f5f4' };
    }
};

const getJournalText = (journal: DailyNote[string]['journal']): string => {
    if (!journal) return '';
    if (Array.isArray(journal)) return journal.map((e: any) => e?.text || '').filter(Boolean).join('\n\n');
    return journal.trim();
};

export const getJournalExportEntries = (notes: DailyNote): JournalExportEntry[] => {
    return Object.entries(notes)
        .map(([dateKey, dayData]) => {
            const journal = getJournalText(dayData.journal);
            const hasJournal = Boolean(journal);
            const hasMood = typeof dayData.mood === 'number';

            if (!hasJournal && !hasMood) {
                return null;
            }

            return {
                dateKey,
                date: new Date(`${dateKey}T12:00:00`),
                mood: dayData.mood,
                journal
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

const LINE_HEIGHT_PDF = 32;
const RULED_LINES_PDF = `repeating-linear-gradient(to bottom, transparent, transparent ${LINE_HEIGHT_PDF - 1}px, #e8e3db ${LINE_HEIGHT_PDF - 1}px, #e8e3db ${LINE_HEIGHT_PDF}px)`;
const MARGIN_LINE_LEFT = 52;
const BODY_PADDING_LEFT = 68;

const buildCoverArticleHtml = (
    entries: JournalExportEntry[],
    theme: Theme,
    userName: string,
    fontStack: string,
    accentMuted: string,
): string => {
    const rangeLabel = entries.length > 0
        ? `${formatJournalShortDate(entries[0].date)} – ${formatJournalShortDate(entries[entries.length - 1].date)}`
        : '';
    const year = entries.length > 0
        ? entries[entries.length - 1].date.getFullYear().toString()
        : new Date().getFullYear().toString();

    const gutterNumbers = Array.from({ length: 38 }, (_, i) =>
        `<div style="height:${LINE_HEIGHT_PDF}px;line-height:${LINE_HEIGHT_PDF}px;text-align:right;padding-right:12px;font-family:monospace;font-size:8px;color:#ece8e2;user-select:none;">${i + 1}</div>`
    ).join('');

    return `
<article style="position:relative;background:#fdfdf8;border:3px solid #1c1917;box-shadow:5px 5px 0 0 #1c1917;min-height:9.5in;display:flex;flex-direction:column;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact;">

  <!-- Ruled texture background -->
  <div style="position:absolute;inset:0;background-image:${RULED_LINES_PDF};background-position-y:0px;opacity:0.18;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>

  <!-- Margin line -->
  <div style="position:absolute;left:${MARGIN_LINE_LEFT}px;top:0;bottom:0;width:1px;background:${accentMuted};z-index:1;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>

  <!-- Gutter line numbers (decorative) -->
  <div style="position:absolute;left:0;top:0;width:${MARGIN_LINE_LEFT}px;padding-top:16px;z-index:1;pointer-events:none;">
    ${gutterNumbers}
  </div>

  <!-- Top gradient accent bar -->
  <div style="height:14px;background:linear-gradient(90deg,${theme.primary},${theme.secondary});flex-shrink:0;position:relative;z-index:2;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>

  <!-- Main content – vertically centered -->
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding-left:${BODY_PADDING_LEFT}px;padding-right:56px;position:relative;z-index:2;">

    <!-- Label above box -->
    <p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:0.36em;color:#a8a29e;">Personal Journal</p>

    <!-- Neo-brutalist title card -->
    <div style="position:relative;display:inline-block;max-width:420px;">
      <!-- Shadow layer -->
      <div style="position:absolute;top:9px;left:9px;right:-9px;bottom:-9px;background:#1c1917;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
      <!-- Card -->
      <div style="position:relative;background:#fdfdf8;border:3px solid #1c1917;padding:34px 36px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
        <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:0.32em;color:#c4bdb5;">My</p>
        <h1 style="margin:0;font-family:${fontStack};font-size:64px;font-weight:900;letter-spacing:-0.04em;color:#1c1917;line-height:0.88;">JOURNAL</h1>
        <!-- Color rule -->
        <div style="margin:22px 0 18px;height:5px;width:80px;background:${theme.primary};-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
        <!-- Meta -->
        ${rangeLabel ? `<p style="margin:0 0 5px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#57534e;">${escapeHtml(rangeLabel)}</p>` : ''}
        <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:#a8a29e;">${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}&nbsp;&nbsp;·&nbsp;&nbsp;${escapeHtml(userName)}</p>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 56px 10px ${BODY_PADDING_LEFT}px;border-top:1px solid #e8e3db;position:relative;z-index:2;">
    <span style="font-family:monospace;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.22em;color:#d4cfc9;">Private</span>
    <span style="font-family:monospace;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.22em;color:#d4cfc9;">${year}</span>
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

export const buildJournalPrintHtml = ({
    entries,
    theme,
    userName = 'You',
    font = 'serif',
    layout = 'compact',
    entryOffset = 0,
    includeCover = true,
    previewMode = false,
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
        const lineCount = Math.max(8, paragraphs.join('\n').split('\n').length + 2);
        const dayLong = entry.date.toLocaleDateString(undefined, { weekday: 'long' });

        const journalBody = paragraphs.length
            ? paragraphs.map(p =>
                `<p style="font-family:${fontStack};font-size:15px;line-height:${LINE_HEIGHT_PDF}px;margin:0 0 ${LINE_HEIGHT_PDF}px;color:#1c1917;white-space:pre-wrap;">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`
              ).join('')
            : `<p style="font-family:${fontStack};font-size:15px;line-height:${LINE_HEIGHT_PDF}px;margin:0;color:#a8a29e;font-style:italic;">Mood logged — no written entry for this day.</p>`;

        const lineNumbers = Array.from({ length: lineCount }, (_, i) =>
            `<div style="height:${LINE_HEIGHT_PDF}px;line-height:${LINE_HEIGHT_PDF}px;text-align:right;padding-right:12px;font-family:monospace;font-size:8px;color:#d4cfc9;user-select:none;">${i + 1}</div>`
        ).join('');

        const moodBadge = entry.mood !== undefined
            ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.14em;white-space:nowrap;background:${mood.fill};color:${mood.accent};flex-shrink:0;margin-top:4px;">
                <span style="display:inline-flex;align-items:center;color:${mood.accent};">${moodIcon}</span>
                ${escapeHtml(mood.label)}
              </span>`
            : '';

        const articleStyle = layout === 'fullpage'
            ? `position:relative;background:#fdfdf8;border:3px solid #1c1917;box-shadow:5px 5px 0 0 #1c1917;break-before:page;page-break-before:always;min-height:9.5in;display:flex;flex-direction:column;`
            : `position:relative;margin:0 0 0.32in;background:#fdfdf8;break-inside:avoid;page-break-inside:avoid;border:3px solid #1c1917;box-shadow:5px 5px 0 0 #1c1917;`;

        return `
<article style="${articleStyle}">

  <!-- Page header -->
  <div style="position:relative;padding:20px 20px 16px;border-bottom:1px solid #e8e3db;">
    <!-- Margin line in header -->
    <div style="position:absolute;left:${MARGIN_LINE_LEFT}px;top:0;bottom:0;width:1px;background:${accentMuted};"></div>
    <!-- Entry number in gutter -->
    <div style="position:absolute;left:0;top:20px;width:${MARGIN_LINE_LEFT}px;text-align:right;padding-right:12px;font-family:monospace;font-size:8px;color:#d4cfc9;">${String(entryIdx + 1).padStart(2, '0')}</div>
    <!-- Header content -->
    <div style="padding-left:${BODY_PADDING_LEFT - 20}px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">
      <div>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:0.28em;color:#a8a29e;">Journal Entry</p>
        <h2 style="margin:4px 0 0;font-family:${fontStack};font-size:26px;font-weight:900;color:#1c1917;line-height:1.2;letter-spacing:-0.02em;">${escapeHtml(formatJournalLongDate(entry.date))}</h2>
      </div>
      ${moodBadge}
    </div>
  </div>

  <!-- Ruled body -->
  <div style="position:relative;">
    <!-- Margin line in body -->
    <div style="position:absolute;left:${MARGIN_LINE_LEFT}px;top:0;bottom:0;width:1px;z-index:1;background:${accentMuted};"></div>
    <!-- Line numbers -->
    <div style="position:absolute;left:0;top:0;width:${MARGIN_LINE_LEFT}px;padding-top:16px;">
      ${lineNumbers}
    </div>
    <!-- Text with ruled background -->
    <div style="padding-left:${BODY_PADDING_LEFT}px;padding-right:24px;padding-top:16px;padding-bottom:24px;min-height:${layout === 'fullpage' ? '7in' : `${LINE_HEIGHT_PDF * lineCount}px`};flex:${layout === 'fullpage' ? '1' : 'none'};background-image:${RULED_LINES_PDF};background-position-y:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
      ${journalBody}
    </div>
  </div>

  <!-- Footer -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 20px;border-top:1px solid #e8e3db;">
    <span style="font-family:Arial,sans-serif;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.22em;color:#d4cfc9;">${escapeHtml(dayLong)}</span>
    <span style="font-family:Arial,sans-serif;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.22em;color:#d4cfc9;">${entry.journal ? 'Written' : 'Mood only'} · p.${entryIdx + 1}</span>
  </div>

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
    ${previewMode ? PREVIEW_STYLES : ''}
  </style>
</head>
<body>
<main class="page">

  ${includeCover ? buildCoverArticleHtml(entries, theme, userName, fontStack, accentMuted) : ''}

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
) => {
    if (!entries.length) {
        throw new Error('No journal or mood entries found to export.');
    }

    const html = buildJournalPrintHtml({ entries, theme, userName, font, layout });

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
