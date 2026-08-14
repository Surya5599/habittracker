import { getPalette } from '../src/constants/theme';

// The bug this locks down: `textMuted` was #d6d3d1 in light mode (~1.3:1 on white) and
// was used as `placeholderTextColor` on the journal and task inputs, so the placeholder
// was very nearly invisible. Checking a colour against white alone isn't enough either —
// inputs sit on panelSoftBg, and gray-500 passes on white but fails on panelSoftBg.

const channel = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) throw new Error(`Expected a 6-digit hex colour, got ${hex}`);
    const int = parseInt(m[1], 16);
    return 0.2126 * channel((int >> 16) & 255)
        + 0.7152 * channel((int >> 8) & 255)
        + 0.0722 * channel(int & 255);
};

const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
};

// WCAG AA for text below 18px, which is every one of these in practice.
const AA_TEXT = 4.5;
const TEXT_TOKENS = ['textPrimary', 'textSecondary', 'textMuted', 'warn', 'danger'];
const SURFACES = ['panelBg', 'panelSoftBg'];

describe('theme contrast', () => {
    it.each(['light', 'dark'])('%s: known reference ratios', (mode) => {
        // Sanity-check the maths itself against values we can reason about.
        expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 1);
        expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
        expect(getPalette(mode).mode).toBe(mode);
    });

    describe.each(['light', 'dark'])('%s mode', (mode) => {
        const palette = getPalette(mode);

        it.each(
            TEXT_TOKENS.flatMap(token => SURFACES.map(surface => [token, surface])),
        )('%s clears AA on %s', (token, surface) => {
            expect(contrast(palette[token], palette[surface])).toBeGreaterThanOrEqual(AA_TEXT);
        });

        it('rejects the colour that caused the original bug', () => {
            // #d6d3d1 was the old light-mode textMuted.
            expect(contrast('#d6d3d1', '#ffffff')).toBeLessThan(AA_TEXT);
            expect(palette.textMuted).not.toBe('#d6d3d1');
        });

        it('keeps the three text levels visually distinct', () => {
            const levels = [palette.textPrimary, palette.textSecondary, palette.textMuted];
            expect(new Set(levels).size).toBe(3);
            // Ordered: primary is the highest contrast against its own panel.
            const ratios = levels.map(c => contrast(c, palette.panelBg));
            expect(ratios[0]).toBeGreaterThan(ratios[1]);
            expect(ratios[1]).toBeGreaterThan(ratios[2]);
        });
    });

    it('getPalette returns a stable identity so it is safe in hook deps', () => {
        expect(getPalette('dark')).toBe(getPalette('dark'));
        expect(getPalette('light')).toBe(getPalette('light'));
        // Anything that is not 'dark' is light, including undefined.
        expect(getPalette(undefined)).toBe(getPalette('light'));
    });
});

describe('readableOn', () => {
    const { readableOn } = require('../src/constants/theme');

    // Habit colours are user-chosen and span the range in constants/THEMES.
    it('puts dark ink on pale habit colours', () => {
        expect(readableOn('#a8d4c9')).toBe('#161616'); // mint
        expect(readableOn('#d1b1b1')).toBe('#161616'); // rose
        expect(readableOn('#c9b88f')).toBe('#161616'); // honey
    });

    it('puts light ink on dark habit colours', () => {
        expect(readableOn('#2d2d2d')).toBe('#ffffff'); // monochrome
        expect(readableOn('#5a7a5a')).toBe('#ffffff'); // forest
    });

    it('always beats the alternative it rejected', () => {
        ['#a8d4c9', '#2d2d2d', '#8da18d', '#5b8a8a', '#d4a8a8'].forEach((fill) => {
            const chosen = readableOn(fill);
            const other = chosen === '#ffffff' ? '#161616' : '#ffffff';
            expect(contrast(chosen, fill)).toBeGreaterThan(contrast(other, fill));
        });
    });

    it('falls back to white for a colour it cannot parse', () => {
        expect(readableOn(undefined)).toBe('#ffffff');
        expect(readableOn('rebeccapurple')).toBe('#ffffff');
    });
});
