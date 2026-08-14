// Canonical surface palette for the mobile app.
//
// Before this existed, every screen re-derived its own colours inline, and they
// drifted: the light page background was #f3f4f6 on Today and Analytics, #f9fafb on
// Logs, and #f5f5f4 on the app shell — three near-identical greys that read as a seam
// when you switch tabs. `textMuted` was worse: it was #d6d3d1 in DailyCard (~1.3:1 on
// white) and used for placeholder text, so the journal placeholder was close to
// invisible.
//
// Two registers coexist on purpose:
//   * hairline (`cardBorder`, `divider`) — list rows, panels, the calm surfaces
//   * hard outline (`outline`) — the DailyCard hero card and settings blocks
// Pick the one the surrounding surface already uses; don't mix them in one component.
//
// LIGHT/DARK are module constants, so getPalette returns a stable identity and is safe
// to list in useMemo/useCallback dependency arrays.

const LIGHT = {
    mode: 'light',
    // Surfaces
    pageBg: '#f5f5f4',
    panelBg: '#ffffff',
    panelSoftBg: '#f3f4f6',
    // Lines
    cardBorder: '#f3f4f6',
    divider: '#f3f4f6',
    // Decorative hairlines that must stay light — never use these for text.
    borderSubtle: '#d6d3d1',
    outline: '#000000',
    // Text — every value here clears 4.5:1 against BOTH panelBg and panelSoftBg.
    // Inputs sit on panelSoftBg, so checking only against white is what let the old
    // placeholder colours through. theme.contrast.test.js enforces both.
    textPrimary: '#161616',
    textSecondary: '#4b5563',
    // Not gray-500 (#6b7280): that lands at 4.39:1 on panelSoftBg, just under.
    textMuted: '#64707f',
    textOnAccent: '#ffffff',
    // Semantic — red-700/orange-700 rather than the -500 steps, which fail on
    // panelSoftBg at the small sizes these are used at.
    warn: '#c2410c',
    danger: '#b91c1c',
};

const DARK = {
    mode: 'dark',
    pageBg: '#000000',
    panelBg: '#0b0b0b',
    panelSoftBg: '#161616',
    cardBorder: '#ffffff',
    divider: '#1f1f1f',
    borderSubtle: '#3f3f46',
    outline: '#ffffff',
    textPrimary: '#f5f5f5',
    textSecondary: '#d1d5db',
    textMuted: '#a3a3a3',
    textOnAccent: '#ffffff',
    warn: '#fb923c',
    danger: '#f87171',
};

export const getPalette = (colorMode) => (colorMode === 'dark' ? DARK : LIGHT);

// Ink that stays legible on an arbitrary fill. Habit colours are user-chosen and run
// from near-black (#2d2d2d) to pale mint (#a8d4c9), so a hardcoded white checkmark
// disappears at the light end. 0.179 is the standard luminance crossover where black
// overtakes white for contrast.
const channel = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const readableOn = (hex, { light = '#ffffff', dark = '#161616' } = {}) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    if (!m) return light;
    const int = parseInt(m[1], 16);
    const luminance = 0.2126 * channel((int >> 16) & 255)
        + 0.7152 * channel((int >> 8) & 255)
        + 0.0722 * channel(int & 255);
    return luminance > 0.179 ? dark : light;
};

// Opacity suffixes for 8-digit hex tints built on the active theme accent. Named so
// call sites read as intent rather than magic hex.
export const alpha = {
    faint: '14',   //  8% — resting tint behind an icon
    soft: '1f',    // 12% — icon button background
    medium: '2e',  // 18% — count pill
    strong: '44',  // 27% — divider against a coloured card
};
