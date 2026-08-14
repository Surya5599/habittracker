import {
    STARTER_HABITS, STARTER_HABIT_COLORS, CADENCES, cadenceKeyFor,
} from '../src/constants/starterHabits';

describe('starter habits', () => {
    it('has unique keys, so picking one never toggles another', () => {
        const keys = STARTER_HABITS.map(h => h.key);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it('gives every starter a name fallback for locales missing the key', () => {
        STARTER_HABITS.forEach((h) => {
            expect(typeof h.fallback).toBe('string');
            expect(h.fallback.length).toBeGreaterThan(0);
            expect(h.emoji.length).toBeGreaterThan(0);
        });
    });

    it('only uses weekday frequencies that map to Mon–Fri', () => {
        STARTER_HABITS.filter(h => h.frequency).forEach((h) => {
            expect(h.frequency).toEqual([1, 2, 3, 4, 5]);
        });
    });

    it('spreads colours so a new user does not get ten identical habits', () => {
        // The picker assigns by index, so consecutive picks must differ.
        expect(new Set(STARTER_HABIT_COLORS).size).toBe(STARTER_HABIT_COLORS.length);
        expect(STARTER_HABIT_COLORS.length).toBeGreaterThanOrEqual(4);
    });
});

describe('cadenceKeyFor', () => {
    it('round-trips every cadence the picker offers', () => {
        CADENCES.forEach((cadence) => {
            const habit = { frequency: cadence.frequency, weeklyTarget: cadence.weeklyTarget };
            expect(cadenceKeyFor(habit)).toBe(cadence.key);
        });
    });

    it('treats an unset frequency as daily', () => {
        expect(cadenceKeyFor({})).toBe('daily');
        expect(cadenceKeyFor({ frequency: undefined, weeklyTarget: null })).toBe('daily');
    });

    it('lets a weekly target win over any frequency', () => {
        expect(cadenceKeyFor({ frequency: [1, 2, 3, 4, 5], weeklyTarget: 3 })).toBe('threeTimes');
    });
});

describe('languages', () => {
    const { LANGUAGES, languageLabel } = require('../src/constants/languages');
    const en = require('../src/locales/en.json');

    it('has unique codes', () => {
        const codes = LANGUAGES.map(l => l.code);
        expect(new Set(codes).size).toBe(codes.length);
    });

    it('labels each language in its own script, not in English', () => {
        // Someone who cannot read the current UI language has to recognise their own.
        expect(LANGUAGES.find(l => l.code === 'ja').label).toBe('日本語');
        expect(LANGUAGES.find(l => l.code === 'zh').label).toBe('中文');
        expect(LANGUAGES.find(l => l.code === 'de').label).toBe('Deutsch');
    });

    it('ships a locale file for every language it offers', () => {
        const fs = require('fs');
        LANGUAGES.forEach((lang) => {
            expect(fs.existsSync(`${__dirname}/../src/locales/${lang.code}.json`)).toBe(true);
        });
    });

    it('falls back to the raw code when asked for something unknown', () => {
        expect(languageLabel('en')).toBe('English');
        expect(languageLabel('xx')).toBe('XX');
        expect(languageLabel(undefined)).toBe('');
    });

    it('keeps a starter name for every habit the picker can offer', () => {
        STARTER_HABITS.forEach((h) => {
            expect(en.onboardingFlow.starters[h.key]).toBeTruthy();
        });
    });
});
