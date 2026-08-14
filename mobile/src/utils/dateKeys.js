// Helpers for the `YYYY-MM-DD` keys used across habits, completions and notes.
// Kept dependency-free and pure so the paging math is unit-testable.

export const BACKLOG_KEY = '__backlog__';

// Number of days of history one "page" of notes covers. Two months at a time:
// enough that the To-Do/Logs screens open with real content, small enough that
// the first paint isn't waiting on a full-history fetch.
export const NOTES_PAGE_DAYS = 60;

export const toDateKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const todayKey = () => toDateKey(new Date());

export const isDateKey = (key) => /^\d{4}-\d{2}-\d{2}$/.test(key || '');

export const parseDateKey = (key) => {
    const [y, m, d] = String(key).split('-').map(Number);
    return new Date(y, m - 1, d);
};

// Local-midnight Date for a habit's createdAt/archivedAt, whatever shape it arrives in.
//
// `new Date('2026-01-15')` is parsed as UTC midnight, which is the previous calendar day
// for anyone west of UTC — a habit created on the 15th would start counting on the 14th.
// A full ISO timestamp does carry a real instant, so that one is reduced to whichever
// local day the instant falls on. Mirrors parseDateStringLocal in the web app.
export const parseDateStringLocal = (value) => {
    if (!value) return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime())
            ? null
            : new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    const str = String(value);
    if (str.includes('T')) {
        const instant = new Date(str);
        if (Number.isNaN(instant.getTime())) return null;
        return new Date(instant.getFullYear(), instant.getMonth(), instant.getDate());
    }
    if (!isDateKey(str)) {
        const fallback = new Date(str);
        return Number.isNaN(fallback.getTime())
            ? null
            : new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
    }
    return parseDateKey(str);
};

export const shiftDateKey = (key, days) => {
    const d = parseDateKey(key);
    d.setDate(d.getDate() + days);
    return toDateKey(d);
};

export const dateKeyDaysAgo = (days, from = new Date()) => {
    const d = new Date(from);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - days);
    return toDateKey(d);
};

// Oldest date included once `pages` pages have been loaded. Page 1 covers the
// most recent NOTES_PAGE_DAYS days (including today), page 2 the 60 before that.
export const windowStartKey = (pages, pageDays = NOTES_PAGE_DAYS, from = new Date()) =>
    dateKeyDaysAgo(Math.max(1, pages) * pageDays - 1, from);

// Earliest date key present in a notes map, ignoring non-date keys (`__backlog__`).
export const earliestDateKey = (notes) => {
    let earliest = null;
    Object.keys(notes || {}).forEach((key) => {
        if (!isDateKey(key)) return;
        if (!earliest || key < earliest) earliest = key;
    });
    return earliest;
};

// Postgres `ilike` treats % and _ as wildcards; searching for a literal task
// containing them (e.g. "100% week") must not turn into a match-anything query.
export const escapeLikeQuery = (query) =>
    String(query || '').replace(/[\\%_]/g, (ch) => `\\${ch}`);
