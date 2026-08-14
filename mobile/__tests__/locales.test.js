const fs = require('fs');
const path = require('path');
const { LANGUAGES } = require('../src/constants/languages');

const dir = path.join(__dirname, '..', 'src', 'locales');
const load = (code) => JSON.parse(fs.readFileSync(path.join(dir, `${code}.json`), 'utf8'));

const flatten = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) => (
    v && typeof v === 'object' && !Array.isArray(v)
        ? flatten(v, `${prefix}${k}.`)
        : [[`${prefix}${k}`, v]]
));

const en = load('en');
const enEntries = flatten(en);
const enKeys = enEntries.map(([k]) => k);
const others = LANGUAGES.filter(l => l.code !== 'en').map(l => l.code);

// Placeholders like {{count}} are contractual: the code passes that name, so a
// translation that renames or drops it silently renders the literal braces.
const placeholders = (s) => (String(s).match(/\{\{\s*\w+\s*\}\}/g) || []).sort();

describe('locales', () => {
    it.each(others)('%s has every key en.json has', (code) => {
        const theirs = new Set(flatten(load(code)).map(([k]) => k));
        expect(enKeys.filter(k => !theirs.has(k))).toEqual([]);
    });

    it.each(others)('%s keeps the same interpolation placeholders as en', (code) => {
        const theirs = Object.fromEntries(flatten(load(code)));
        const mismatched = enEntries
            .filter(([, v]) => typeof v === 'string' && placeholders(v).length > 0)
            .filter(([k, v]) => theirs[k] && placeholders(theirs[k]).join() !== placeholders(v).join())
            .map(([k]) => k);
        expect(mismatched).toEqual([]);
    });

    it.each(others)('%s has no untranslated leftovers copied verbatim from en', (code) => {
        // Proper nouns and symbols legitimately match across languages.
        const allowed = /^(HabiCard|OK|Email|E-mail|AI|IA|\d|[^\p{L}]*$)/u;
        const theirs = Object.fromEntries(flatten(load(code)));
        const identical = enEntries
            .filter(([k, v]) => typeof v === 'string' && v.length > 12 && theirs[k] === v)
            .filter(([, v]) => !allowed.test(v))
            .map(([k]) => k);
        // A handful is normal; a flood means a merge went in untranslated.
        expect(identical.length).toBeLessThan(15);
    });

    it('keeps every locale a flat-parseable JSON object', () => {
        LANGUAGES.forEach(({ code }) => {
            expect(typeof load(code)).toBe('object');
        });
    });
});

// A t() key that does not exist fails silently — i18next just returns the fallback,
// so a typo shows English to every locale and nothing ever errors.
describe('mood label keys', () => {
    const { MOODS } = require('../src/constants');
    const MOOD_LABEL_KEYS = { 1: 'veryBad', 2: 'bad', 3: 'okay', 4: 'good', 5: 'veryGood' };

    it('maps every MOODS value to a key that exists in en.json', () => {
        MOODS.forEach(({ value }) => {
            const key = MOOD_LABEL_KEYS[value];
            expect(key).toBeDefined();
            expect(en.dailyCard.moods[key]).toBeTruthy();
        });
    });

    it('is translated in every locale', () => {
        others.forEach((code) => {
            const moods = load(code).dailyCard.moods;
            Object.values(MOOD_LABEL_KEYS).forEach((key) => {
                expect(moods[key]).toBeTruthy();
            });
        });
    });
});
