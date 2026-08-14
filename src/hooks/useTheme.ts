import { useState, useEffect } from 'react';
import { THEMES } from '../constants';
import { Theme } from '../types';

const INK_ON_THEME = '#1c1917';
const INVERSE_ON_THEME = '#ffffff';

const relativeLuminance = (hex: string) => {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const channel = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(parseInt(full.slice(0, 2), 16))
        + 0.7152 * channel(parseInt(full.slice(2, 4), 16))
        + 0.0722 * channel(parseInt(full.slice(4, 6), 16));
};

const contrastRatio = (a: string, b: string) => {
    const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
};

/**
 * Foreground for anything filled with a theme colour.
 *
 * Picks whichever of ink / white actually wins on contrast rather than using a
 * luminance threshold. A threshold looks reasonable but is wrong for the
 * mid-tone presets: #8da18d sits at luminance 0.33, so a "> 0.42 means dark
 * ink" rule hands it white at 2.76:1 when ink would have given 6.998:1.
 * Measuring both and taking the max clears AA on all 13 presets.
 */
const readableInk = (hex: string) =>
    (contrastRatio(hex, INK_ON_THEME) >= contrastRatio(hex, INVERSE_ON_THEME)
        ? INK_ON_THEME
        : INVERSE_ON_THEME);

export const useTheme = () => {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('habit_theme');
        return saved ? JSON.parse(saved) : THEMES[0];
    });

    useEffect(() => {
        localStorage.setItem('habit_theme', JSON.stringify(theme));
    }, [theme]);

    // Mirror the active preset onto CSS custom properties so the token layer
    // (src/styles/tokens.css) tracks the user's theme. Without this,
    // var(--theme-primary) stays pinned to preset 1 for everyone, and the
    // theme-derived tokens (theme-*, done, complete) are unusable.
    // MIGRATION_NOTES.md prerequisite 3. Additive: no existing behaviour changes.
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--theme-primary', theme.primary);
        root.style.setProperty('--theme-secondary', theme.secondary);
        // Readable foreground for anything filled with a theme colour. The 13
        // presets span #8da18d (light sage) to #2d2d2d (near-black), so a fixed
        // text colour fails contrast on one end or the other. Pick per theme.
        root.style.setProperty('--theme-primary-ink', readableInk(theme.primary));
        root.style.setProperty('--theme-secondary-ink', readableInk(theme.secondary));
    }, [theme.primary, theme.secondary]);

    return { theme, setTheme, THEMES };
};
