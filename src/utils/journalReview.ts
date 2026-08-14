import { DailyNote, Habit, Theme } from '../types';
import { MONTHS, MOOD_SCALE } from '../constants';

/* ============================================================================
   Journal — Year in Review
   ----------------------------------------------------------------------------
   Builds the two data-driven pages that open the exported journal, before the
   daily entries. Everything here is DERIVED from real tracked data (annualStats
   from useHabitStats, habits, notes) — no placeholder metrics.

   Print palette is deliberately separate from the app token layer
   (DESIGN_SYSTEM.md §P7): a PDF renders in a detached document where CSS custom
   properties are out of scope, so these are literal values. The one thing that
   is NOT fixed is the accent — the user's active theme drives the heatmap ramp
   and every data mark, so two people's journals never look the same.
   ========================================================================= */

export const JOURNAL_PAPER = '#fdfdf8';
export const JOURNAL_INK = '#1c1917';
export const JOURNAL_INK_SOFT = '#57534e';
export const JOURNAL_INK_MUTE = '#a8a29e';
export const JOURNAL_RULE = '#e8e3db';
export const JOURNAL_RULE_SOFT = '#f0ece4';

export const JOURNAL_DISPLAY = "Georgia,'Iowan Old Style','Times New Roman',serif";
export const JOURNAL_LABEL = "'Helvetica Neue',Arial,sans-serif";

/** The story generator wraps emphasis in [[...]] markers, which the in-app
 *  <FormattedText> renders as coloured bold spans. The PDF has to do the same
 *  substitution or the brackets leak to the reader as `[[GYM]]`. Escapes first,
 *  then promotes the markers, so habit names can safely contain < or &. */
const PAPER = JOURNAL_PAPER;
const INK = JOURNAL_INK;
const INK_SOFT = JOURNAL_INK_SOFT;
const INK_MUTE = JOURNAL_INK_MUTE;
const RULE = JOURNAL_RULE;
const RULE_SOFT = JOURNAL_RULE_SOFT;
const DISPLAY = JOURNAL_DISPLAY;
const LABEL = JOURNAL_LABEL;

export const renderJournalRichText = (value: string, accent: string) =>
    escapeJournalHtml(value)
        .replace(/\*\*(.+?)\*\*/g, (_m, inner) => `<strong style="font-weight:700;">${inner}</strong>`)
        .replace(/\[\[(.+?)\]\]/g, (_m, inner) =>
            `<span style="color:${accent};font-weight:700;">${inner}</span>`);

export const escapeJournalHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Blend two hex colours. Precomputed rather than using color-mix(), so the
 *  ramp survives print engines and PDF post-processing. */
export const mixJournalColor = (from: string, to: string, t: number) => {
    const parse = (h: string) => {
        const s = h.replace('#', '');
        const full = s.length === 3 ? s.split('').map(c => c + c).join('') : s;
        return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
    };
    const a = parse(from);
    const b = parse(to);
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(1, Math.max(0, t))));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
};

const mix = mixJournalColor;

export interface JournalNarrative {
    review?: string;
    defining?: string[];
    attention?: string;
}

export interface JournalReviewData {
    year: number;
    /** headline figures */
    daysTracked: number;
    overallScore: number;
    bestStreak: number;
    /** days where every due habit was completed - distinct from bestStreak,
     *  which counts any-habit days and therefore tracks daysTracked closely */
    perfectDays: number;
    habitsKept: number;
    /** top habits, richest first */
    topHabits: { name: string; rate: number; color: string; completed: number }[];
    /** 12 months x up to 5 weeks of completion rates; null = not yet lived */
    heatmap: (number | null)[][];
    monthly: { month: string; rate: number; perfectDays: number; topHabit: string | null; future: boolean }[];
    /** average logged mood per month, null when nothing logged */
    moodByMonth: (number | null)[];
    numbers: { label: string; value: string }[];
    highlights: { kicker: string; value: string; caption: string; tint: string }[];
    narrative: JournalNarrative;
    entryCount: number;
    moodCount: number;
    /** how many distinct months actually have a logged mood */
    moodMonthsLogged: number;
}

const round = (n: number) => Math.round(n);

export const buildJournalReviewData = ({
    year,
    annualStats,
    habits,
    notes,
    narrative = {},
}: {
    year: number;
    annualStats: any;
    habits: Habit[];
    notes: DailyNote;
    narrative?: JournalNarrative;
}): JournalReviewData => {
    const months: any[] = annualStats?.monthlySummaries ?? [];
    const colorOf = (name: string) =>
        habits.find(h => h.name === name)?.color || '#a8a29e';

    // ── heatmap: monthlySummaries already carries weeklyRates per month ──────
    // A month is EMPTY (never lived, or nothing was due) rather than 0%. Those
    // must not render as the lightest ramp step, which reads as real data.
    const isEmptyMonth = (m: any) => Boolean(m?.isFutureMonth) || !(m?.total > 0);
    const heatmap: (number | null)[][] = months.map(m => {
        const rates: number[] = m?.weeklyRates ?? [];
        const cells: (number | null)[] = isEmptyMonth(m) ? [] : rates.slice(0, 5);
        while (cells.length < 5) cells.push(null);
        return cells;
    });

    // ── mood: average of logged moods per calendar month ────────────────────
    const moodSum = Array(12).fill(0);
    const moodN = Array(12).fill(0);
    Object.entries(notes || {}).forEach(([dateKey, day]) => {
        if (!dateKey.startsWith(String(year))) return;
        const mood = (day as any)?.mood;
        if (typeof mood !== 'number') return;
        const mIdx = Number(dateKey.slice(5, 7)) - 1;
        if (mIdx < 0 || mIdx > 11) return;
        moodSum[mIdx] += mood;
        moodN[mIdx] += 1;
    });
    const moodByMonth = moodSum.map((s, i) => (moodN[i] ? s / moodN[i] : null));
    const moodCount = moodN.reduce((a, b) => a + b, 0);

    // ── entry counts straight from the notes ────────────────────────────────
    let entryCount = 0;
    Object.entries(notes || {}).forEach(([dateKey, day]) => {
        if (!dateKey.startsWith(String(year))) return;
        const j = (day as any)?.journal;
        const text = Array.isArray(j) ? j.map((e: any) => e?.text || '').join('') : (j || '');
        if (String(text).trim()) entryCount += 1;
    });

    const perfectDays = months.reduce((sum, m) => sum + (m?.perfectDays || 0), 0);
    const topHabitsRaw: any[] = (annualStats?.topHabits ?? []).filter((h: any) => h?.total > 0);

    const bestGain = [...(annualStats?.allTopHabits ?? topHabitsRaw)]
        .filter((h: any) => typeof h?.startRate === 'number' && typeof h?.endRate === 'number' && h.total > 0)
        .sort((a: any, b: any) => (b.endRate - b.startRate) - (a.endRate - a.startRate))[0];

    const strongest = annualStats?.strongestMonth;
    const longest = annualStats?.longestHabitStreak;
    const mostLogged = annualStats?.mostLoggedHabit;

    const highlights = [
        strongest?.month && {
            kicker: 'Strongest month',
            value: strongest.month,
            caption: `${round(strongest.rate || 0)}% of everything due`,
            tint: '#eef2ec',
        },
        longest?.maxStreak > 0 && {
            kicker: 'Longest streak',
            value: `${longest.maxStreak} days`,
            caption: longest.name,
            tint: '#f6eeea',
        },
        mostLogged?.name && {
            kicker: 'Most logged',
            value: `${round(mostLogged.completed || 0)}`,
            caption: `${mostLogged.name} · ${round(mostLogged.rate || 0)}%`,
            tint: '#eeeff5',
        },
        bestGain && (bestGain.endRate - bestGain.startRate) > 0 && {
            kicker: 'Biggest turnaround',
            value: `+${round(bestGain.endRate - bestGain.startRate)}%`,
            caption: `${bestGain.name}, first quarter to last`,
            tint: '#f4f1e8',
        },
    ].filter(Boolean) as JournalReviewData['highlights'];

    const numbers = [
        { label: 'Habits tracked', value: String(annualStats?.totalHabitsInYear ?? habits.length) },
        { label: 'Completions', value: (annualStats?.totalCompletions ?? 0).toLocaleString() },
        { label: 'Days you showed up', value: String(annualStats?.activeDays ?? 0) },
        { label: 'Longest run of days', value: String(annualStats?.maxStreak ?? 0) },
        { label: 'Journal entries', value: String(entryCount) },
        { label: 'Moods logged', value: String(moodCount) },
    ];

    return {
        year,
        daysTracked: annualStats?.activeDays ?? 0,
        overallScore: round(annualStats?.consistencyRate ?? 0),
        bestStreak: annualStats?.maxStreak ?? 0,
        perfectDays,
        habitsKept: annualStats?.totalHabitsInYear ?? habits.length,
        topHabits: topHabitsRaw.slice(0, 5).map((h: any) => ({
            name: h.name,
            rate: round(h.rate || 0),
            color: colorOf(h.name),
            completed: round(h.completed || 0),
        })),
        heatmap,
        monthly: months.map(m => ({
            month: m.month,
            rate: round(m.rate || 0),
            perfectDays: m.perfectDays || 0,
            topHabit: m.topHabit?.name ?? null,
            future: isEmptyMonth(m),
        })),
        moodMonthsLogged: moodByMonth.filter(v => v !== null).length,
        moodByMonth,
        numbers,
        highlights,
        narrative,
        entryCount,
        moodCount,
    };
};

/* ── small presentational helpers ──────────────────────────────────────────── */

/** Performance tiers for at-a-glance ranking. Muted toward the paper so a page
 *  of five bars still reads as one editorial object rather than a traffic light. */
const TIER_STRONG = '#5b7f5f';
const TIER_MID = '#b08a3e';
const TIER_WEAK = '#a8564b';
const tierColor = (rate: number) => (rate >= 85 ? TIER_STRONG : rate >= 60 ? TIER_MID : TIER_WEAK);
const tierLabel = (rate: number) => (rate >= 85 ? 'Strong' : rate >= 60 ? 'Holding' : 'Slipping');

export const journalSectionHead = (text: string) => `
<div style="display:flex;align-items:baseline;gap:10px;margin:0 0 14px;">
  <span style="font-family:${LABEL};font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:${INK_SOFT};white-space:nowrap;">${escapeJournalHtml(text)}</span>
  <span style="flex:1;height:1px;background:${RULE};"></span>
</div>`;

const sectionHead = journalSectionHead;

const statCell = (value: string, label: string, accent: string, first = false) => `
<div style="flex:1;min-width:0;padding:0 ${first ? '10px 0 0' : '11px'};${first ? '' : `border-left:1px solid ${RULE};`}">
  <div style="font-family:${DISPLAY};font-size:29px;line-height:1;color:${INK};letter-spacing:-0.02em;">${escapeJournalHtml(value)}</div>
  <div style="margin-top:7px;display:flex;align-items:center;gap:5px;">
    <span style="width:5px;height:5px;border-radius:50%;background:${accent};display:inline-block;flex-shrink:0;"></span>
    <span style="font-family:${LABEL};font-size:6.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${INK_MUTE};white-space:nowrap;">${escapeJournalHtml(label)}</span>
  </div>
</div>`;

const heatmapSvg = (data: JournalReviewData, accent: string) => {
    const cw = 15, ch = 10.5, gap = 3;
    const cols = 12, rows = 5;
    const w = cols * (cw + gap) - gap;
    const h = rows * (ch + gap) - gap;
    const ramp = [mix(PAPER, accent, 0.14), mix(PAPER, accent, 0.36), mix(PAPER, accent, 0.66), accent];
    const bucket = (r: number) => (r >= 75 ? 3 : r >= 50 ? 2 : r >= 25 ? 1 : 0);

    let cells = '';
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            const v = data.heatmap[c]?.[r];
            const x = c * (cw + gap);
            const y = r * (ch + gap);
            cells += v === null || v === undefined
                ? `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" fill="none" stroke="${RULE}" stroke-width="0.6"/>`
                : `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" fill="${ramp[bucket(v)]}"/>`;
        }
    }
    const labels = MONTHS.map((m, i) =>
        `<text x="${i * (cw + gap) + cw / 2}" y="${h + 11}" text-anchor="middle" font-family="${LABEL}" font-size="7" letter-spacing="0.08em" fill="${INK_MUTE}">${m[0]}</text>`
    ).join('');

    const legend = ramp.map((c, i) =>
        `<rect x="${i * 13}" y="0" width="10" height="7" fill="${c}"/>`
    ).join('');

    return `
<svg viewBox="0 0 ${w} ${h + 16}" width="100%" style="display:block;overflow:visible;">
  ${cells}${labels}
</svg>
<div style="display:flex;align-items:center;justify-content:flex-end;gap:7px;margin-top:9px;">
  <span style="font-family:${LABEL};font-size:7px;text-transform:uppercase;letter-spacing:0.12em;color:${INK_MUTE};">Less</span>
  <svg viewBox="0 0 ${ramp.length * 13 - 3} 7" width="${ramp.length * 13 - 3}" height="7" style="display:block;">${legend}</svg>
  <span style="font-family:${LABEL};font-size:7px;text-transform:uppercase;letter-spacing:0.12em;color:${INK_MUTE};">More</span>
</div>`;
};

const moodSvg = (data: JournalReviewData) => {
    // padL fits the widest axis label ("Very Good") at 6.5pt without clipping.
    const w = 620, h = 104, padL = 44, padB = 16, padT = 8;
    const plotW = w - padL - 6;
    const plotH = h - padB - padT;
    const pts = data.moodByMonth
        .map((m, i) => (m === null ? null : {
            x: padL + (i / 11) * plotW,
            y: padT + plotH - ((m - 1) / 4) * plotH,
            m,
        }))
        .filter(Boolean) as { x: number; y: number; m: number }[];

    const grid = [1, 2, 3, 4, 5].map(v => {
        const y = padT + plotH - ((v - 1) / 4) * plotH;
        const names: Record<number, string> = { 1: 'Very Bad', 2: '', 3: 'Okay', 4: '', 5: 'Very Good' };
        return `<line x1="${padL}" y1="${y}" x2="${w - 6}" y2="${y}" stroke="${v === 1 ? RULE : RULE_SOFT}" stroke-width="0.7"/>` +
            (names[v] ? `<text x="${padL - 6}" y="${y + 2.4}" text-anchor="end" font-family="${LABEL}" font-size="6.5" fill="${INK_MUTE}">${names[v]}</text>` : '');
    }).join('');

    // Only join months that are genuinely adjacent. A gap stays a gap: joining
    // Feb to November would invent eight months of trend that was never logged.
    const runs: { x: number; y: number }[][] = [];
    data.moodByMonth.forEach((m, i) => {
        if (m === null) { runs.push([]); return; }
        const pt = { x: padL + (i / 11) * plotW, y: padT + plotH - ((m - 1) / 4) * plotH };
        if (!runs.length) runs.push([]);
        runs[runs.length - 1].push(pt);
    });
    const line = runs.filter(r => r.length > 1).map(r =>
        `<polyline points="${r.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" fill="none" stroke="${INK_SOFT}" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"/>`
    ).join('');
    const dots = pts.map(p =>
        `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.4" fill="${mix(MOOD_SCALE[Math.min(4, Math.max(0, Math.round(p.m) - 1))], PAPER, 0.42)}" stroke="${PAPER}" stroke-width="0.9"/>`
    ).join('');
    const xlabels = MONTHS.map((m, i) => {
        const x = padL + (i / 11) * plotW;
        const logged = data.moodByMonth[i] !== null;
        // an unlogged month is marked absent rather than left to look like zero
        const tick = logged ? '' :
            `<line x1="${x}" y1="${padT + plotH - 3}" x2="${x}" y2="${padT + plotH + 3}" stroke="${RULE}" stroke-width="0.7"/>`;
        return tick + `<text x="${x}" y="${h - 3}" text-anchor="middle" font-family="${LABEL}" font-size="6.5" letter-spacing="0.06em" fill="${logged ? INK_MUTE : RULE}">${m.slice(0, 1)}</text>`;
    }).join('');

    if (!pts.length) {
        return `<p style="font-family:${DISPLAY};font-size:11px;font-style:italic;color:${INK_MUTE};margin:14px 0 0;">No moods logged this year.</p>`;
    }

    return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block;">${grid}${line}${dots}${xlabels}</svg>`;
};

/* ── page 1: the data spread ───────────────────────────────────────────────── */

export const buildReviewDataPageHtml = (
    data: JournalReviewData,
    theme: Theme,
    userName: string,
    fontStack: string,
    pageBreak: boolean,
): string => {
    const accent = theme.primary;
    const second = theme.secondary;
    const summary = data.narrative.review || '';

    const habitRows = data.topHabits.length
        ? data.topHabits.map(h => `
<div style="display:flex;align-items:center;gap:9px;padding:6.5px 0;border-bottom:1px solid ${RULE_SOFT};">
  <span style="width:6px;height:6px;border-radius:50%;background:${h.color};flex-shrink:0;"></span>
  <span style="flex:1;font-family:${fontStack};font-size:11px;color:${INK};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeJournalHtml(h.name)}</span>
  <span style="width:54px;height:3px;background:${RULE};position:relative;flex-shrink:0;">
    <span style="position:absolute;left:0;top:0;bottom:0;width:${Math.min(100, h.rate)}%;background:${tierColor(h.rate)};"></span>
  </span>
  <span style="width:30px;text-align:right;font-family:${DISPLAY};font-size:12px;color:${INK};flex-shrink:0;">${h.rate}%</span>
</div>`).join('')
        : `<p style="font-family:${DISPLAY};font-size:11px;font-style:italic;color:${INK_MUTE};margin:0;">No habits tracked yet.</p>`;

    const numberRows = data.numbers.map(n => `
<div style="display:flex;align-items:baseline;gap:8px;padding:5.5px 0;border-bottom:1px solid ${RULE_SOFT};">
  <span style="font-family:${fontStack};font-size:10.5px;color:${INK_SOFT};">${escapeJournalHtml(n.label)}</span>
  <span style="flex:1;border-bottom:1px dotted ${RULE};transform:translateY(-3px);"></span>
  <span style="font-family:${DISPLAY};font-size:13px;color:${INK};">${escapeJournalHtml(n.value)}</span>
</div>`).join('');

        // Same hairline-divided tile language as "Year at a glance" above, rather
    // than a second, competing set of tinted boxes.
    const highlightPanels = data.highlights.map((hl, i) => `
<div style="flex:1;min-width:0;padding:0 ${i === 0 ? '13px 0 0' : '13px'};${i === 0 ? '' : `border-left:1px solid ${RULE};`}">
  <div style="font-family:${LABEL};font-size:6.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${INK_MUTE};">${escapeJournalHtml(hl.kicker)}</div>
  <div style="font-family:${DISPLAY};font-size:21px;line-height:1.15;color:${INK};margin:6px 0 4px;letter-spacing:-0.01em;">${escapeJournalHtml(hl.value)}</div>
  <div style="font-family:${fontStack};font-size:9px;color:${INK_SOFT};line-height:1.4;">${escapeJournalHtml(hl.caption)}</div>
</div>`).join('');

    return `
<article style="position:relative;background:${PAPER};border:1px solid ${RULE};min-height:9.5in;display:flex;flex-direction:column;padding:0.5in 0.52in 0.34in;${pageBreak ? 'break-before:page;page-break-before:always;' : ''}-webkit-print-color-adjust:exact;print-color-adjust:exact;">

  <!-- masthead -->
  <div style="display:flex;align-items:baseline;justify-content:space-between;padding-bottom:9px;border-bottom:1px solid ${INK};">
    <span style="font-family:${LABEL};font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.26em;color:${INK};">HabiCard Journal</span>
    <span style="font-family:${LABEL};font-size:7.5px;text-transform:uppercase;letter-spacing:0.2em;color:${INK_MUTE};">Year in Review</span>
  </div>

  <!-- hero: year + glance -->
  <div style="display:grid;grid-template-columns:1.05fr 1.45fr;gap:26px;padding:24px 0 22px;border-bottom:1px solid ${RULE};">
    <div>
      <div style="font-family:${LABEL};font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.24em;color:${INK_MUTE};">My year</div>
      <div style="font-family:${DISPLAY};font-size:86px;line-height:0.86;letter-spacing:-0.035em;color:${INK};margin:8px 0 0;">${data.year}</div>
      <div style="width:44px;height:3px;background:${accent};margin:16px 0 13px;"></div>
      ${summary
            ? `<p style="font-family:${fontStack};font-size:10.5px;line-height:1.6;color:${INK_SOFT};margin:0;max-width:30ch;">${renderJournalRichText(summary, accent)}</p>`
            : `<p style="font-family:${fontStack};font-size:10.5px;line-height:1.6;color:${INK_SOFT};margin:0;max-width:30ch;">${data.daysTracked} days of showing up, kept in one place.</p>`}
    </div>
    <div>
      ${sectionHead('Year at a glance')}
      <div style="display:flex;">
        ${statCell(String(data.daysTracked), 'Days tracked', accent, true)}
        ${statCell(`${data.overallScore}%`, 'Overall score', second)}
        ${statCell(String(data.perfectDays), 'Perfect days', MOOD_SCALE[1])}
        ${statCell(String(data.habitsKept), 'Habits kept', INK_SOFT)}
      </div>
      <div style="margin-top:22px;">
        ${sectionHead('Consistency over time')}
        ${heatmapSvg(data, accent)}
      </div>
    </div>
  </div>

  <!-- top habits | by the numbers -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;padding:20px 0;border-bottom:1px solid ${RULE};">
    <div>
      ${sectionHead('Habits that carried the year')}
      ${habitRows}
      ${data.topHabits.length ? `
      <div style="display:flex;align-items:center;gap:11px;margin-top:9px;">
        ${[[TIER_STRONG, '85%+'], [TIER_MID, '60–84%'], [TIER_WEAK, 'Under 60%']].map(([c, l]) => `
        <span style="display:inline-flex;align-items:center;gap:4px;">
          <span style="width:9px;height:3px;background:${c};display:inline-block;"></span>
          <span style="font-family:${LABEL};font-size:6.5px;text-transform:uppercase;letter-spacing:0.1em;color:${INK_MUTE};">${l}</span>
        </span>`).join('')}
      </div>` : ''}
    </div>
    <div>
      ${sectionHead('By the numbers')}
      ${numberRows}
    </div>
  </div>

  <!-- highlights -->
  ${data.highlights.length ? `
  <div style="padding:20px 0;border-bottom:1px solid ${RULE};">
    ${sectionHead('Worth remembering')}
    <div style="display:flex;align-items:flex-start;">
      ${highlightPanels}
    </div>
  </div>` : ''}

  <!-- mood -->
  <div style="flex:1;padding:20px 0 0;">
    ${sectionHead('Mood journey')}
    <div>
      ${data.moodMonthsLogged >= 2 ? moodSvg(data) : ''}
      <p style="font-family:${fontStack};font-size:9.5px;line-height:1.6;color:${INK_SOFT};margin:${data.moodMonthsLogged >= 2 ? '10px' : '0'} 0 0;max-width:58ch;">
        ${data.moodCount === 0
            ? 'No moods logged this year — tracking one alongside a habit gives next year\'s journal a second story to tell.'
            : data.moodMonthsLogged < 3
                ? `Only ${data.moodCount} mood${data.moodCount === 1 ? '' : 's'} logged this year, across ${data.moodMonthsLogged} month${data.moodMonthsLogged === 1 ? '' : 's'} — not enough yet to chart a trend.`
                : `${data.moodCount} moods logged across the year, alongside ${data.entryCount} written ${data.entryCount === 1 ? 'entry' : 'entries'}.`}
      </p>
    </div>
  </div>

  <!-- footer -->
  <div style="display:flex;align-items:baseline;justify-content:space-between;padding-top:12px;border-top:1px solid ${RULE};">
    <span style="font-family:${LABEL};font-size:7px;text-transform:uppercase;letter-spacing:0.2em;color:${INK_MUTE};">${escapeJournalHtml(userName)}</span>
    <span style="font-family:${LABEL};font-size:7px;text-transform:uppercase;letter-spacing:0.2em;color:${INK_MUTE};">${data.year} · i</span>
  </div>

</article>`;
};

/* ── page 2: the narrative + monthly ledger ────────────────────────────────── */

export const buildReviewStoryPageHtml = (
    data: JournalReviewData,
    theme: Theme,
    userName: string,
    fontStack: string,
): string => {
    const accent = theme.primary;
    const clean = (s: string) => renderJournalRichText(s, accent);

    const ledger = data.monthly.map(m => `
<tr>
  <td style="padding:6px 0;border-bottom:1px solid ${RULE_SOFT};font-family:${LABEL};font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:${m.future ? INK_MUTE : INK};width:34px;">${m.month.slice(0, 3)}</td>
  <td style="padding:6px 8px;border-bottom:1px solid ${RULE_SOFT};width:74px;">
    ${m.future ? '' : `<span style="display:block;height:3px;background:${RULE};position:relative;"><span style="position:absolute;left:0;top:0;bottom:0;width:${Math.min(100, m.rate)}%;background:${accent};"></span></span>`}
  </td>
  <td style="padding:6px 0;border-bottom:1px solid ${RULE_SOFT};font-family:${DISPLAY};font-size:11px;color:${m.future ? INK_MUTE : INK};width:36px;">${m.future ? '—' : `${m.rate}%`}</td>
  <td style="padding:6px 14px 6px 0;border-bottom:1px solid ${RULE_SOFT};font-family:${DISPLAY};font-size:10px;color:${INK_SOFT};text-align:right;width:46px;">${m.future ? '' : (m.perfectDays || '—')}</td>
  <td style="padding:6px 0;border-bottom:1px solid ${RULE_SOFT};font-family:${fontStack};font-size:9.5px;color:${INK_SOFT};overflow:hidden;">${m.topHabit ? escapeJournalHtml(m.topHabit) : ''}</td>
</tr>`).join('');

    const defining = (data.narrative.defining || []).filter(Boolean);

    return `
<article style="position:relative;background:${PAPER};border:1px solid ${RULE};min-height:9.5in;display:flex;flex-direction:column;padding:0.5in 0.52in 0.34in;break-before:page;page-break-before:always;-webkit-print-color-adjust:exact;print-color-adjust:exact;">

  <div style="display:flex;align-items:baseline;justify-content:space-between;padding-bottom:9px;border-bottom:1px solid ${INK};">
    <span style="font-family:${LABEL};font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.26em;color:${INK};">HabiCard Journal</span>
    <span style="font-family:${LABEL};font-size:7.5px;text-transform:uppercase;letter-spacing:0.2em;color:${INK_MUTE};">What the year said</span>
  </div>

  ${data.narrative.review ? `
  <div style="padding:26px 0 22px;border-bottom:1px solid ${RULE};">
    <p style="font-family:${DISPLAY};font-size:19px;line-height:1.55;color:${INK};margin:0;max-width:52ch;text-wrap:pretty;">${clean(data.narrative.review)}</p>
  </div>` : ''}

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;padding:20px 0;border-bottom:1px solid ${RULE};">
    <div>
      ${sectionHead('What defined it')}
      ${defining.length
            ? defining.map(d => `
      <div style="display:flex;gap:8px;padding:5px 0;">
        <span style="width:3px;height:3px;border-radius:50%;background:${accent};margin-top:6px;flex-shrink:0;"></span>
        <p style="font-family:${fontStack};font-size:10px;line-height:1.6;color:${INK_SOFT};margin:0;">${clean(d)}</p>
      </div>`).join('')
            : `<p style="font-family:${DISPLAY};font-size:11px;font-style:italic;color:${INK_MUTE};margin:0;">Not enough data yet.</p>`}
    </div>
    <div>
      ${sectionHead('Where the slack was')}
      ${data.narrative.attention
            ? `<div style="background:#f7f3ea;padding:13px 14px;">
                 <p style="font-family:${fontStack};font-size:10px;line-height:1.6;color:${INK_SOFT};margin:0;">${clean(data.narrative.attention)}</p>
               </div>`
            : `<p style="font-family:${DISPLAY};font-size:11px;font-style:italic;color:${INK_MUTE};margin:0;">Nothing flagged.</p>`}
    </div>
  </div>

  <div style="padding:20px 0 0;">
    ${sectionHead('Month by month')}
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <td style="padding:0 0 7px;font-family:${LABEL};font-size:6.5px;text-transform:uppercase;letter-spacing:0.16em;color:${INK_MUTE};">Month</td>
          <td style="padding:0 8px 7px;font-family:${LABEL};font-size:6.5px;text-transform:uppercase;letter-spacing:0.16em;color:${INK_MUTE};">Completion</td>
          <td style="padding:0 0 7px;font-family:${LABEL};font-size:6.5px;text-transform:uppercase;letter-spacing:0.16em;color:${INK_MUTE};">Rate</td>
          <td style="padding:0 14px 7px 0;font-family:${LABEL};font-size:6.5px;text-transform:uppercase;letter-spacing:0.16em;color:${INK_MUTE};text-align:right;">Perfect</td>
          <td style="padding:0 0 7px;font-family:${LABEL};font-size:6.5px;text-transform:uppercase;letter-spacing:0.16em;color:${INK_MUTE};">Best habit</td>
        </tr>
      </thead>
      <tbody>${ledger}</tbody>
    </table>
  </div>

  <!-- ruled space: the printed artifact should be finishable by hand -->
  <div style="flex:1;display:flex;flex-direction:column;padding:22px 0 4px;min-height:0;">
    ${sectionHead('A note to next year')}
    <div style="flex:1;min-height:0;background-image:repeating-linear-gradient(to bottom,transparent,transparent 25px,${RULE} 25px,${RULE} 26px);-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
  </div>

  <div style="display:flex;align-items:baseline;justify-content:space-between;padding-top:12px;border-top:1px solid ${RULE};">
    <span style="font-family:${LABEL};font-size:7px;text-transform:uppercase;letter-spacing:0.2em;color:${INK_MUTE};">${escapeJournalHtml(userName)}</span>
    <span style="font-family:${LABEL};font-size:7px;text-transform:uppercase;letter-spacing:0.2em;color:${INK_MUTE};">${data.year} · ii</span>
  </div>

</article>`;
};

export const REVIEW_PAGE_COUNT = 2;
