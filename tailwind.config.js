/* ============================================================================
   HabiCard — Tailwind design-system config
   ============================================================================

   Formalizes DESIGN_SYSTEM.md (audited 2026-08-13) as tokens. Every value is
   derived from that audit's dominant usage counts; nothing new is invented.
   Each conflict resolution is cross-referenced to MIGRATION_NOTES.md.

   ── HOW EACH CLIENT CONSUMES THIS ─────────────────────────────────────────
   The VALUES live in src/styles/tokens.css as CSS custom properties (required
   for the 13 runtime-selectable themes and for the token-level dark swap).
   This file maps Tailwind utility names onto those vars.

   1. Web (src/) — currently Tailwind v3 via cdn.tailwindcss.com (index.html:34),
      which cannot read a config FILE. Two options, in preference order:
        (a) RECOMMENDED: `npm i -D tailwindcss@3 postcss autoprefixer`, add a
            postcss.config.js, import a CSS entry with the three @tailwind
            directives, and drop the CDN <script>. This file then works as-is.
        (b) INTERIM: inline this object into index.html as
            `tailwind.config = { … }` before the CDN script runs. The `content`
            key below is ignored by the CDN build.
      Either way, src/styles/tokens.css must be imported before dark-theme.css.

   2. Chrome extension — Tailwind v4.1.18 (@tailwindcss/vite). v4 ignores JS
      configs unless explicitly loaded. Use src/styles/tailwind-v4-theme.css,
      which mirrors this file as an @theme block over the same vars.

   3. Mobile (twrnc, no config today) — React Native cannot read CSS variables,
      so mobile must consume the LITERAL values exported as `tokens` at the
      bottom of this file. See MIGRATION_NOTES.md §P3.

   ── WHAT IS REPLACED vs EXTENDED ──────────────────────────────────────────
   REPLACED (old class names stop resolving, which is how the migration gets
   surfaced): borderRadius, borderWidth, boxShadow, fontSize, fontWeight.
   EXTENDED (additive, nothing breaks): colors, zIndex, spacing, fontFamily.

   `colors` is deliberately EXTENDED, not replaced: ~1000 usages of the stock
   stone/amber/rose/gray palette are still live. Replacing it would break the
   app in one step. The semantic tokens below are the target; MIGRATION_NOTES.md
   §M2 lists the palette-class -> token mapping for the rewrite pass.
   ========================================================================= */

/** Tailwind v3 silently DROPS the `/opacity` modifier on a plain `var()` colour —
 *  `bg-surface/20` emits no rule at all (verified against tailwindcss@3). Wrapping in
 *  color-mix with the `<alpha-value>` placeholder makes modifiers work; with no modifier
 *  Tailwind substitutes 1, so `calc(1 * 100%)` returns the colour unchanged.
 *  v4 does this natively, so src/styles/tailwind-v4-theme.css keeps plain var() values. */
const alpha = (v) => `color-mix(in srgb, var(${v}) calc(<alpha-value> * 100%), transparent)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],

  // Dark mode is driven by the existing attribute set in index.html:9-13.
  // Pairing this with tokens.css lets `dark:` variants exist WITHOUT the ~45
  // `!important` overrides in dark-theme.css. DESIGN_SYSTEM.md §9 #14.
  darkMode: ['selector', "[data-color-mode='dark']"],

  theme: {
    /* ══ RADIUS ═══════════════════════════════════════════════════════════
       16 distinct values collapsed to 5: 4 / 8 / 12 / 16 / full.
       (DESIGN_SYSTEM.md §3.2, §9 #5)

       The five kept names retain their CURRENT pixel values, so the 252
       existing uses of `rounded`, `rounded-lg`, `rounded-xl`, `rounded-2xl`
       and `rounded-full` do not silently shift. Only the outliers break:
         rounded-sm (13)  rounded-md (6)  rounded-3xl (1)  + 22 arbitraries.

       MODAL/CARD CONFLICT RESOLVED -> 16px (`rounded-modal` / `rounded-card`).
       Reference: the 4 modals that already crossed to the rounded idiom all
       use rounded-2xl = 16px — StreakModal.tsx:369, TasksView.tsx:305,
       AiPersonalityPickerModal.tsx:17, AiDisclaimerModal.tsx:17. This also
       matches the dominant main-view card radius (rounded-2xl, 66 uses), so
       one value settles both halves of DESIGN_SYSTEM.md §6 / §9 #3.
       The 10 square modals and the square app frame (App.tsx:1721) adopt it. */
    borderRadius: {
      none: '0',
      DEFAULT: '0.25rem', // 4px  — rounded (63 uses); absorbs rounded-sm/2px/3px/4px
      lg: '0.5rem',       // 8px  — rounded-lg (72); absorbs rounded-md/6px
      xl: '0.75rem',      // 12px — rounded-xl (51); absorbs rounded-[10px]/[12px]/[14px]
      '2xl': '1rem',      // 16px — rounded-2xl (66); absorbs [20px]/[22px]/[24px]
      full: '9999px',     // rounded-full (113)

      // Semantic aliases — the preferred API. Same 5 values, no new steps.
      control: '0.5rem',  // 8px  — buttons, inputs, icon buttons
      card: '1rem',       // 16px — all main-view cards
      modal: '1rem',      // 16px — ALL modal shells + the app frame
      chip: '9999px',     // pills, badges, avatars
      // REMOVED: sm(2) md(6) 3xl(24) and every arbitrary [2px][3px][4px][10px]
      // [12px][14px][20px][22px][24px][28px][30px]. See MIGRATION_NOTES §M3.
    },

    /* ══ BORDER WIDTH ═════════════════════════════════════════════════════
       Resolves the three co-existing "heavy" weights 2 / 2.5 / 3px.
       (DESIGN_SYSTEM.md §3.1, §9 #12)
       3px stays the structural weight (~40 uses incl. the app frame and every
       modal shell); 2px stays the internal/divider weight (154 uses); 4px is
       kept only for the accent bars (border-l-4 / border-t-4, 7 uses).
       `border-3` replaces the 40 `border-[3px]` arbitraries. */
    borderWidth: {
      0: '0',
      DEFAULT: '1px', // 854 uses — hairlines, dividers
      2: '2px',       // 154 uses — internal borders, controls; absorbs 2.5px
      3: '3px',       // structural: app frame, modal shells, card outlines
      4: '4px',       // accent bars only; absorbs mobile's border-[5px]
      // REMOVED: border-[2.5px] (ShareCustomizationModal.tsx:115), border-[5px] (mobile)
    },

    /* ══ SHADOW ═══════════════════════════════════════════════════════════
       ONE hard-offset scale, 3 tiers, from the dominant offsets.
       (DESIGN_SYSTEM.md §3.3, §3.4, §9 #2, §9 #4)

       `shadow-neo` = 4px RESOLVES the .neo-shadow conflict for the majority:
       index.html:55 (4px) + chrome-extension/src/index.css:64 (4px) +
       .landing-neo-shadow-sm (4px) outvote dark-theme.css:59 (6px). It also
       sits between the 3px (20 uses) and 6px (7 uses) clusters, absorbing both.

       The soft/diffuse family (shadow / -sm / -md / -lg / -xl / -inner, 71
       uses) is FOLDED IN, not kept: DESIGN_SYSTEM.md §9 #13 identifies it as
       an unintentional Material idiom leaking into a neo-brutalist shell via
       Header.tsx and DateSelectors.tsx, not a deliberate second family.
       `shadow-frame` is the one exception — it carries the dark-mode ambient
       glow that .app-main-frame genuinely needs (dark-theme.css:314).

       Dark mode swaps VALUES via tokens.css, so all three tiers survive
       instead of collapsing to one as the old blanket selector did. */
    boxShadow: {
      none: 'none',
      'neo-sm': 'var(--neo-shadow-sm)',       // 2px — chips, inline controls, hover-press state
      neo: 'var(--neo-shadow)',               // 4px — cards, popovers, buttons (DEFAULT tier)
      'neo-lg': 'var(--neo-shadow-lg)',       // 8px — modal shells, app frame
      'neo-accent': 'var(--neo-shadow-accent)', // amber CTA, FeatureAnnouncementModal.tsx:127
      frame: 'var(--neo-shadow-frame)',       // ambient; dark mode only
      // REMOVED: 103 inline shadow-[Npx_Npx_0…] arbitraries, the 1px/6px/12px
      // tiers, every alpha variant (0.5/0.3/0.2/0.12/0.1), and the whole soft
      // family. See MIGRATION_NOTES §M5.
    },

    /* ══ TYPE SCALE ═══════════════════════════════════════════════════════
       18 sizes collapsed to 8. Anchors kept at their current values:
       text-[10px] (241 uses) -> `text-2xs`,  text-sm (136) -> unchanged 14px.
       (DESIGN_SYSTEM.md §2.2, §9 #7)

       xs / sm / base / lg / xl keep Tailwind's stock pixel values, so their
       299 existing uses are untouched. Two micro steps are added below xs
       because the app's real workhorse sizes are 9-11px, and one display step
       replaces the five landing-page display sizes. */
    fontSize: {
      '3xs': ['0.5625rem', { lineHeight: '1.2' }], // 9px  — 115 uses; absorbs 8px (39)
      '2xs': ['0.625rem', { lineHeight: '1.3' }],  // 10px — 241 uses, the de-facto label size
      xs: ['0.75rem', { lineHeight: '1rem' }],     // 12px — 93; absorbs text-[11px] (72) and text-[12px] (10)
      sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px — 136, de-facto body; absorbs text-[13px] (10)
      base: ['1rem', { lineHeight: '1.5rem' }],    // 16px — 14
      lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px — 36
      xl: ['1.25rem', { lineHeight: '1.75rem' }],  // 20px — 20; absorbs text-2xl/24px (11)
      display: ['3rem', { lineHeight: '1.05' }],   // 48px — landing hero; absorbs 3xl/4xl/5xl/7xl (30 uses)

      // REMOVED — BELOW ACCESSIBILITY FLOOR, no token provided:
      //   text-[7px] (15 uses)  text-[6px] (1, StreakModal.tsx:578)
      // These must be raised to `text-3xs` (9px) minimum, not remapped
      // silently. See MIGRATION_NOTES §M6.
      // ALSO REMOVED: 2xl 3xl 4xl 5xl 6xl 7xl 8xl 9xl, text-[15vw], text-[1.7rem],
      // text-[18px]. The landing page's display type is out-of-system; see §P6.
    },

    /* ══ WEIGHT ═══════════════════════════════════════════════════════════
       Restricted to the three faces actually loaded — Inter 400/700/900
       (index.html:35; chrome-extension/src/index.css:8-45).
       (DESIGN_SYSTEM.md §2.3, §9 #15)
       font-medium (57 uses) and font-semibold (23) had NO loaded face and were
       rendering synthetically. They are removed, not aliased, so every one of
       those 80 call sites must be consciously reassigned. See §M7. */
    fontWeight: {
      normal: '400',
      bold: '700',
      black: '900', // 493 uses — the app's default voice
      // REMOVED: thin, extralight, light, medium(57), semibold(23), extrabold
    },

    extend: {
      /* ══ FONT FAMILY ════════════════════════════════════════════════════
         `serif` (Playfair Display) is RESERVED FOR DISPLAY/HERO TEXT ONLY —
         pair it with `text-display`, `text-xl`, or `text-lg`. It must not be
         used on micro-labels or navigation. Every current wrong-context usage
         is enumerated in MIGRATION_NOTES §M8. */
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        // `font-mono` intentionally omitted — 2 uses, FeedbackModal.tsx only,
        // with no font loaded. See §M8.
      },

      /* ══ COLORS ═════════════════════════════════════════════════════════
         Semantic tokens over tokens.css vars. EXTEND (see header note).
         (DESIGN_SYSTEM.md §1, §9 #1, #8, #9, #16) */
      colors: {
        canvas: alpha('--canvas'),

        // Surfaces. `surface-soft` consolidates the four interchangeable
        // off-whites #fcfcfc / #f9f9f9 / #f0f0f0 / #f9f2f2 (§9 #16).
        surface: {
          DEFAULT: alpha('--surface'),
          soft: alpha('--surface-soft'),
          muted: alpha('--surface-muted'),   // <- bg-stone-50   (101 uses)
          strong: alpha('--surface-strong'), // <- bg-stone-100  (81 uses)
          // <- bg-black (104 uses). A SURFACE, not --ink-strong: that is a text
          // colour and is #eeeeee in dark, which would be invisible on itself.
          inverse: alpha('--surface-inverse'),
          'inverse-hover': alpha('--surface-inverse-hover'), // <- hover:bg-stone-800 (13)
          sunken: alpha('--surface-sunken'),                 // <- bg-stone-300 (4)
        },
        input: alpha('--input-bg'),

        // Text.  Usage: text-ink, text-ink-subtle, …
        ink: {
          DEFAULT: alpha('--ink'),
          strong: alpha('--ink-strong'), // <- text-stone-900 / text-black
          muted: alpha('--ink-muted'),   // <- text-stone-500 (135)
          subtle: alpha('--ink-subtle'), // <- text-stone-400 (216, the workhorse)
          dim: alpha('--ink-dim'),       // <- text-stone-300 (67)
          inverse: alpha('--ink-inverse'),
        },

        // Borders.  Usage: border-edge, border-edge-strong, …
        edge: {
          DEFAULT: alpha('--border'),       // <- border-stone-200 (92)
          strong: alpha('--border-strong'), // <- border-black (the neo border)
          subtle: alpha('--border-subtle'), // <- border-stone-100 (25)
          muted: alpha('--border-muted'),   // <- border-stone-400 (18)
          hover: alpha('--border-hover'),   // <- hover:border-stone-500 / focus:border-stone-600 (9)
        },
        ring: alpha('--ring'),

        // The 13 user-selectable presets, promoted from constants.ts:15-29.
        // Only the ACTIVE preset can be a utility (it is chosen at runtime);
        // the full list is exported as `themePresets` below and stays the data
        // source. Alpha steps replace the hex-suffix concatenation — note that
        // `+ '20'` was 12.5%, not 20% (see tokens.css).
        theme: {
          primary: alpha('--theme-primary'),
          ink: 'var(--theme-primary-ink)',                 // readable on theme.primary
          'secondary-ink': 'var(--theme-secondary-ink)',   // readable on theme.secondary
          'primary-faint': 'var(--theme-primary-faint)',   //  8%
          'primary-soft': 'var(--theme-primary-soft)',     // 12.5%
          'primary-strong': 'var(--theme-primary-strong)', // 25%
          secondary: alpha('--theme-secondary'),
          'secondary-faint': 'var(--theme-secondary-faint)',
          'secondary-soft': 'var(--theme-secondary-soft)',
          'secondary-strong': 'var(--theme-secondary-strong)',
        },

        // ── Status set ──────────────────────────────────────────────────
        // "done" = theme.secondary. Resolves the 5-way conflict; rationale
        // and the 4 replaced encodings are in MIGRATION_NOTES §R1.
        done: {
          DEFAULT: alpha('--status-done'),
          tint: 'var(--status-done-tint)',
        },
        complete: {                                   // aggregate 100% (day/week/month)
          DEFAULT: alpha('--status-complete'),
          tint: 'var(--status-complete-tint)',
        },
        missed: {
          DEFAULT: alpha('--status-missed'),            // red-500 / #ef4444
          tint: alpha('--status-missed-tint'),          // #fee2e2
        },
        warning: {
          DEFAULT: alpha('--status-warning'),           // amber-500
          tint: alpha('--status-warning-tint'),         // amber-100
          faint: alpha('--status-warning-faint'),       // amber-50
        },
        inactive: {                                   // user-marked inactive day
          DEFAULT: alpha('--status-inactive'),          // amber-300
          text: alpha('--status-inactive-text'),        // amber-900
        },
        streak: alpha('--status-streak'),               // orange-500 (== mood.2 by design)

        // 5-value mood scale, previously hand-typed in 7 files (§9 #9).
        mood: {
          1: alpha('--mood-1'),
          2: alpha('--mood-2'),
          3: alpha('--mood-3'),
          4: alpha('--mood-4'),
          5: alpha('--mood-5'),
        },

        scrim: alpha('--scrim'), // bg-scrim replaces bg-black/20…/60 (§9 #10)
      },

      /* ══ SPACING ════════════════════════════════════════════════════════
         Tailwind's stock scale IS already the 4px grid the audit found
         dominant (1 / 1.5 / 2 / 2.5 / 3 / 4 = 4-16px, >90% of all uses), so
         it is retained rather than replaced — `spacing` also feeds width,
         height, gap and inset, and overriding it would break layout far
         beyond padding. (DESIGN_SYSTEM.md §4, §9 #18)

         The half-steps to eliminate — py-0.5 (29), p-0.5 (6), px-0.5 (1),
         py-3.5 (2) — are therefore removed BY MIGRATION, per-call-site, with
         the round up/down decision recorded in MIGRATION_NOTES §M9. A config
         deletion cannot express that safely.

         CARD PADDING CONFLICT RESOLVED -> p-6 / 24px (`p-card-lg`).
         p-6 (17 uses) beats p-5 (13); both are on-grid, p-5 is not. The
         everyday card padding stays p-4 / 16px (`p-card`, 57 uses). */
      spacing: {
        card: '1rem',      // 16px — default card/panel padding (p-4, 57 uses)
        'card-lg': '1.5rem', // 24px — roomy cards; absorbs all p-5
        gutter: '0.75rem', // 12px — the densest common step (p-3, 92 uses)
      },

      /* ══ Z-INDEX ════════════════════════════════════════════════════════
         Names the 9 unscaled values already in use (50/60/90/100/110/120/
         200/210) so new surfaces stop inventing numbers. Values are
         unchanged, so current stacking order is preserved exactly.
         (DESIGN_SYSTEM.md §5.3, §9 #10) */
      zIndex: {
        nav: '50',       // BottomNav, SettingsMenu, DateSelectors popovers
        dropdown: '60',  // ShareCustomizationModal, ResolutionsModal
        overlay: '90',   // YearRetroModal
        modal: '100',    // FeedbackModal, StreakModal, FeatureAnnouncementModal
        preview: '110',  // JournalPdfPreviewModal
        sheet: '120',    // TasksView bottom sheet
        dialog: '200',   // AiPersonalityPickerModal
        alert: '210',    // AiDisclaimerModal
      },
    },
  },

  plugins: [],
};

/* ============================================================================
   LITERAL EXPORTS
   ----------------------------------------------------------------------------
   For consumers that cannot resolve CSS variables: React Native / twrnc,
   canvas rendering (utils/shareCardGenerator.ts), and PDF export
   (utils/exportJournalPdf.ts). Same values as src/styles/tokens.css.
   ========================================================================= */

/** The 13 user-selectable presets, promoted from constants.ts:15-29 verbatim. */
export const themePresets = [
  { name: 'Sage & Rose', primary: '#8da18d', secondary: '#d1b1b1' },
  { name: 'Ocean & Sky', primary: '#5b8a8a', secondary: '#8db1d1' },
  { name: 'Sunset & Clay', primary: '#b28d6c', secondary: '#d1a1a1' },
  { name: 'Lavender & Slate', primary: '#8d8da1', secondary: '#b1a1d1' },
  { name: 'Forest & Earth', primary: '#5a7a5a', secondary: '#a18d7c' },
  { name: 'Peach & Mint', primary: '#d4a89f', secondary: '#a8c9b8' },
  { name: 'Lilac & Cream', primary: '#b8a8d4', secondary: '#d9cdb8' },
  { name: 'Dusty Blue & Mauve', primary: '#8fa8c9', secondary: '#c9a8b8' },
  { name: 'Coral & Sand', primary: '#d4a8a8', secondary: '#c9b89f' },
  { name: 'Mint & Blush', primary: '#a8d4c9', secondary: '#d4b8c9' },
  { name: 'Honey & Fog', primary: '#c9b88f', secondary: '#a8b8c9' },
  { name: 'Plum & Sage', primary: '#a88fa8', secondary: '#9fb8a8' },
  { name: 'Monochrome', primary: '#2d2d2d', secondary: '#6b6b6b' },
];

/** Mood 1-5. Single source; replaces the 7 hand-typed copies (§9 #9). */
export const moodScale = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'];

/** Literal token values. `dark` holds only the keys that differ. */
export const tokens = {
  light: {
    canvas: '#f4f4f0',
    surface: '#ffffff',
    surfaceSoft: '#fdfdf8',
    surfaceMuted: '#fafaf9',
    surfaceStrong: '#f5f5f4',
    inputBg: '#ffffff',
    borderStrong: '#000000',
    border: '#e7e5e4',
    borderSubtle: '#f5f5f4',
    borderMuted: '#a8a29e',
    text: '#444444',
    textStrong: '#1c1917',
    textMuted: '#78716c',
    textSubtle: '#a8a29e',
    textDim: '#d6d3d1',
    textInverse: '#ffffff',
    scrim: 'rgba(0,0,0,0.5)',
    shadowNeoSm: '2px 2px 0 0 rgba(0,0,0,1)',
    shadowNeo: '4px 4px 0 0 rgba(0,0,0,1)',
    shadowNeoLg: '8px 8px 0 0 rgba(0,0,0,1)',
  },
  dark: {
    canvas: '#0d0d0d',
    surface: '#1a1a1a',
    surfaceSoft: '#1a1a1a',
    surfaceMuted: '#222222',
    surfaceStrong: '#2a2a2a',
    inputBg: '#222222',
    borderStrong: 'rgba(255,255,255,0.15)',
    border: 'rgba(255,255,255,0.10)',
    borderSubtle: 'rgba(255,255,255,0.10)',
    borderMuted: 'rgba(255,255,255,0.15)',
    text: '#eeeeee',
    textStrong: '#eeeeee',
    textMuted: '#9a9a9a',
    textSubtle: '#9a9a9a',
    textDim: '#636363',
    scrim: 'rgba(0,0,0,0.75)',
    shadowNeoSm: '2px 2px 0 0 rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.5)',
    shadowNeo: '3px 3px 0 0 rgba(255,255,255,0.08), 0 8px 28px rgba(0,0,0,0.55)',
    shadowNeoLg: '4px 4px 0 0 rgba(255,255,255,0.08), 0 12px 36px rgba(0,0,0,0.6)',
  },
  status: {
    missed: '#ef4444',
    missedTint: '#fee2e2',
    warning: '#f59e0b',
    warningTint: '#fef3c7',
    warningFaint: '#fffbeb',
    inactive: '#fcd34d',
    inactiveText: '#78350f',
    streak: '#f97316',
    // `done` / `complete` are theme-derived (theme.secondary / theme.primary)
    // and therefore resolved at runtime, not here.
  },
  radius: { DEFAULT: 4, control: 8, xl: 12, card: 16, modal: 16, full: 9999 },
  borderWidth: { DEFAULT: 1, 2: 2, 3: 3, 4: 4 },
  fontSize: { '3xs': 9, '2xs': 10, xs: 12, sm: 14, base: 16, lg: 18, xl: 20, display: 48 },
  fontWeight: { normal: 400, bold: 700, black: 900 },
  spacing: { gutter: 12, card: 16, cardLg: 24 },
};
