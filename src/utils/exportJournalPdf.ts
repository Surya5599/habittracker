import { DailyNote, Theme } from '../types';

export interface JournalExportEntry {
    dateKey: string;
    date: Date;
    mood?: number;
    journal?: string;
}

interface BuildJournalPrintHtmlOptions {
    entries: JournalExportEntry[];
    theme: Theme;
    userName?: string;
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

export const buildJournalPrintHtml = ({
    entries,
    theme,
    userName = 'You'
}: BuildJournalPrintHtmlOptions) => {
    const firstDate = entries[0]?.date;
    const lastDate = entries[entries.length - 1]?.date;
    const rangeLabel = firstDate && lastDate
        ? `${formatJournalShortDate(firstDate)} - ${formatJournalShortDate(lastDate)}`
        : 'Journal archive';

    const cards = entries.map((entry) => {
        const mood = getJournalMoodMeta(entry.mood);
        const journalBody = entry.journal
            ? entry.journal
                .split(/\n{2,}/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean)
                .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
                .join('')
            : '<p class="empty-copy">Mood logged, no entry written for this day.</p>';

        return `
            <article class="journal-entry">
                <header class="entry-header">
                    <div class="entry-meta">
                        <p class="eyebrow">Journal Entry</p>
                        <h2>${escapeHtml(formatJournalLongDate(entry.date))}</h2>
                        <p class="date-key">${escapeHtml(entry.dateKey)}</p>
                    </div>
                    <div class="mood-pill" style="color:${mood.accent}; background:${mood.fill};">
                        <span class="mood-dot" style="background:${mood.accent};"></span>
                        <strong>${escapeHtml(mood.label)}</strong>
                    </div>
                </header>
                <section class="journal-copy">
                    ${journalBody}
                </section>
                <footer class="entry-foot">
                    <span>${escapeHtml(entry.date.toLocaleDateString(undefined, { weekday: 'short' }))}</span>
                    <span>${entry.journal ? 'Written entry' : 'Mood only'}</span>
                </footer>
            </article>
        `;
    }).join('');

    return `
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My Journal PDF</title>
    <style>
        :root {
            --ink: #171717;
            --paper: #fcfbf7;
            --card: #ffffff;
            --muted: #57534e;
            --soft: #e7e5e4;
            --theme-primary: ${theme.primary};
            --theme-secondary: ${theme.secondary};
        }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: var(--paper); color: var(--ink); }
        body {
            font-family: Arial, Helvetica, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        @page {
            size: letter;
            margin: 0.5in;
        }
        .page {
            max-width: 7.1in;
            margin: 0 auto;
        }
        .cover {
            overflow: hidden;
            margin-bottom: 0.36in;
            border: 1px solid #e7e5e4;
            border-radius: 28px;
            background: var(--card);
            box-shadow: 0 14px 40px rgba(0,0,0,0.06);
        }
        .cover-inner {
            padding: 0.4in 0.42in 0.42in;
        }
        .cover-accent {
            width: calc(100% + 0.84in);
            height: 0.08in;
            margin: -0.4in -0.42in 0.28in;
            background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
        }
        .cover-kicker {
            display: inline-block;
            margin: 0 0 0.18in;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #78716c;
        }
        .cover h1 {
            margin: 0;
            font-size: 34px;
            line-height: 1.05;
            font-weight: 900;
            letter-spacing: -0.03em;
        }
        .cover p {
            max-width: 5.4in;
            margin: 0.18in 0 0;
            font-size: 14px;
            line-height: 1.8;
            color: #57534e;
        }
        .cover-stats {
            display: flex;
            gap: 0.12in;
            flex-wrap: wrap;
            margin-top: 0.22in;
        }
        .cover-stat {
            padding: 0.11in 0.16in;
            border-radius: 999px;
            background: #f5f5f4;
            font-size: 11px;
            font-weight: 700;
            color: #57534e;
        }
        .journal-entry {
            margin: 0 0 0.28in;
            padding: 0.34in 0.38in 0.28in;
            border: 1px solid #e7e5e4;
            border-radius: 26px;
            background: var(--card);
            box-shadow: 0 12px 34px rgba(0,0,0,0.05);
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .entry-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 0.18in;
            padding-bottom: 0.22in;
            border-bottom: 1px solid #e7e5e4;
        }
        .eyebrow,
        .date-key {
            margin: 0;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: #78716c;
        }
        .entry-meta h2 {
            margin: 0.1in 0 0.08in;
            font-size: 26px;
            line-height: 1.18;
            font-weight: 900;
        }
        .mood-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.08in;
            padding: 0.1in 0.14in;
            border-radius: 999px;
        }
        .mood-dot {
            width: 0.1in;
            height: 0.1in;
            border-radius: 999px;
            flex: 0 0 auto;
        }
        .mood-pill strong {
            font-size: 12px;
            font-weight: 800;
        }
        .journal-copy {
            padding-top: 0.24in;
            min-height: 1.7in;
        }
        .journal-copy p {
            margin: 0 0 0.18in;
            font-size: 14px;
            line-height: 1.9;
            color: #44403c;
        }
        .empty-copy {
            color: #78716c;
            font-style: italic;
        }
        .entry-foot {
            display: flex;
            justify-content: space-between;
            gap: 0.14in;
            padding-top: 0.18in;
            border-top: 1px solid var(--soft);
            color: #78716c;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.14em;
        }
        @media print {
            .cover,
            .journal-entry {
                break-inside: avoid;
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <main class="page">
        <section class="cover">
            <div class="cover-inner">
                <div class="cover-accent"></div>
                <span class="cover-kicker">Personal Journal</span>
                <h1>My Journal</h1>
                <p>A calm, chronological reading view of your moods and reflections, designed to feel like a private diary.</p>
                <div class="cover-stats">
                    <div class="cover-stat">${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}</div>
                    <div class="cover-stat">${escapeHtml(rangeLabel)}</div>
                    <div class="cover-stat">${escapeHtml(userName)}</div>
                </div>
            </div>
        </section>
        ${cards}
    </main>
</body>
</html>`;
};

export const downloadJournalPdfFromIframe = async (
    iframe: HTMLIFrameElement,
    entries: JournalExportEntry[],
    theme: Theme,
    userName?: string
) => {
    if (!entries.length) {
        throw new Error('No journal or mood entries found to export.');
    }

    const html = buildJournalPrintHtml({ entries, theme, userName });

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
