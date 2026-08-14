import { averageMood, moodSampleCount, dayMood } from '../src/utils/mood';

const e = (mood) => ({ id: String(Math.random()), text: 'x', mood });

describe('averageMood', () => {
    it('averages several moods and rounds to a real MOODS value', () => {
        expect(averageMood([e(2), e(4)])).toBe(3);
        expect(averageMood([e(1), e(5)])).toBe(3);
        expect(averageMood([e(4), e(5)])).toBe(5);   // 4.5 rounds up
        expect(averageMood([e(1), e(2)])).toBe(2);   // 1.5 rounds up
    });

    it('returns the single mood when only one entry has one', () => {
        expect(averageMood([e(4)])).toBe(4);
    });

    it('ignores entries with no mood rather than counting them as zero', () => {
        expect(averageMood([e(5), e(undefined), e(5)])).toBe(5);
        expect(averageMood([e(undefined), e(2)])).toBe(2);
    });

    it('is undefined when nothing carries a mood', () => {
        expect(averageMood([])).toBeUndefined();
        expect(averageMood([e(undefined), e(null)])).toBeUndefined();
        expect(averageMood(undefined)).toBeUndefined();
    });

    it('rejects values outside the 1–5 scale instead of skewing the average', () => {
        expect(averageMood([e(4), e(99)])).toBe(4);
        expect(averageMood([e(4), e(0)])).toBe(4);
        expect(averageMood([e(4), e('5')])).toBe(4);
    });

    it('never returns a value off the scale', () => {
        expect(averageMood([e(5), e(5), e(5)])).toBe(5);
        expect(averageMood([e(1), e(1)])).toBe(1);
    });
});

describe('moodSampleCount', () => {
    it('counts only entries that actually set a mood', () => {
        expect(moodSampleCount([e(3), e(undefined), e(5)])).toBe(2);
        expect(moodSampleCount([])).toBe(0);
    });
});

describe('dayMood', () => {
    it('prefers the entries over any stored day-level value', () => {
        // The regression: a stale day mood must never outrank what the entries say.
        expect(dayMood([e(2)], 5)).toBe(2);
    });

    it('drops to undefined once the last mood-carrying entry is deleted', () => {
        expect(dayMood([], 5)).toBe(5);        // legacy note, no entries at all
        expect(dayMood([e(undefined)], undefined)).toBeUndefined();
    });

    it('falls back to a legacy day mood for notes written before entry moods', () => {
        expect(dayMood([], 4)).toBe(4);
        expect(dayMood(undefined, 4)).toBe(4);
    });

    it('is undefined when there is neither', () => {
        expect(dayMood([], undefined)).toBeUndefined();
    });
});
