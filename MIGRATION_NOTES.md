# MIGRATION_NOTES.md

Handoff for the pass that rewrites components. Pairs with `DESIGN_SYSTEM.md`
(audit, 2026-08-13) and the token config added in this step.

**No component files were modified in this step.** Deliverables added:

| File | Role |
|---|---|
| `src/styles/tokens.css` | **Canonical values.** CSS custom properties + the dark-mode swap. |
| `tailwind.config.js` | Tailwind **v3** utility names → those vars. Also exports literal values (`tokens`, `themePresets`, `moodScale`) for JS/canvas/PDF/React-Native consumers. |
| `src/styles/tailwind-v4-theme.css` | Tailwind **v4** `@theme` mirror, for the Chrome extension. |

## Why the values live in CSS, not in the JS config

Three constraints forced this, and the rewrite pass needs to know all three:

1. **The 13 themes are runtime-selectable** (`constants.ts:15-29`, consumed as
   `theme.primary` × 97 / `theme.secondary` × 57). A static Tailwind color
   cannot express that; a var reassigned by JS can.
2. **`DESIGN_SYSTEM.md` §9 #14 requires a token-level dark swap**, replacing the
   ~45 `!important` utility overrides in `dark-theme.css`. That is only
   expressible by redefining vars under `[data-color-mode='dark']`.
3. **Three clients, three Tailwind setups** — web is v3 *via CDN* (no config
   file is read at all), the extension is v4 (ignores JS configs), mobile is
   `twrnc` with no config and no CSS-variable support. Vars are the only layer
   the first two share; mobile must use the literal exports.

## Prerequisites before any component rewrite

1. **Get the web app off the CDN.** `cdn.tailwindcss.com` (`index.html:34`)
   — *partially satisfied:* batch 1 added an **additive** `tailwind.config` bridge at
   `index.html:35-52` (boxShadow only). The full switch is still required.
   cannot read `tailwind.config.js`. Either
   `npm i -D tailwindcss@3 postcss autoprefixer` + a `postcss.config.js` + a CSS
   entry with the `@tailwind` directives (**recommended**), or inline the config
   object into `index.html` as `tailwind.config = { … }`.
   *Until this is done none of the new utilities exist.*
2. ~~`import './styles/tokens.css'` in `src/index.tsx` **before** `dark-theme.css`.~~
   **DONE** (batch 1).
3. ~~Have `useTheme` write the active preset to `--theme-primary` /
   `--theme-secondary` on `document.documentElement`.~~ **DONE** (batch 6) — both
   `src/hooks/useTheme.ts` and `chrome-extension/src/hooks/useTheme.ts`.
4. Delete the superseded blocks: `index.html:71-77` (`.neo-border`/`.neo-shadow`),
   `dark-theme.css:1-33` (`--dark-*`, `--neo-*`), `:55-74` (`.neo-shadow*`
   tiers), `:126-138` (blanket shadow overrides). Keep the rest of
   `dark-theme.css` until §M2 is complete, then delete it entirely.

---

# Part 1 — Every §9 inconsistency and the token that resolves it

| §9 | Inconsistency | Resolving token(s) | Kind |
|---|---|---|---|
| **1** | No token layer; 163 hex values, 63% single-use | The whole of `tokens.css`; `tailwind.config.js` `theme` | Structural |
| **2** | 2 shadow languages, 7 hard tiers, dark mode flattens all | `shadow-neo-sm` / `shadow-neo` / `shadow-neo-lg` (+ `-accent`, `frame`); dark values swapped per-token so tiers survive | Replaced → §M5 |
| **3** | Square modals vs rounded cards | `rounded-modal` = `rounded-card` = **16px** | Judgement → §R3 |
| **4** | `.neo-shadow` defined twice (4px vs 6px); canonical classes unadopted | `shadow-neo` = **4px**, single definition | Judgement → §R2 |
| **5** | 12 card variants | `rounded-card` + `border-3 border-edge-strong` + `shadow-neo` + `p-card` | Composite → §M3, §M5 |
| **6** | 247 hand-rolled buttons, ~14 variants | `rounded-control` + `border-2` + `shadow-neo-sm` — **tokens only; a shared `<Button>` is out of scope here** → §P4 | Partial |
| **7** | 18 type sizes, 8 steps in a 7px band, duplicates | 8-step scale, anchors `text-2xs` (10px) / `text-sm` (14px) | Replaced → §M6 |
| **8** | "done" has 5 encodings | `bg-done` (= `theme.secondary`), `bg-complete` (= `theme.primary`) | Judgement → §R1 |
| **9** | Mood scale duplicated in 7 files | `mood-1`…`mood-5`; `moodScale` export for JS/canvas | Replaced → §M2 |
| **10** | 6 scrim opacities, 9 unscaled z-indexes | `bg-scrim`; `z-nav`/`dropdown`/`overlay`/`modal`/`preview`/`sheet`/`dialog`/`alert` | Replaced → §M8 |
| **11** | `StreakModal` is a second design language | `warning-*`/`streak` for UI chrome; the 22 badge hexes are **illustration, not tokens** → §P2 | Partial |
| **12** | Three heavy border weights (2 / 2.5 / 3px) | `borderWidth` = 1 / 2 / 3 / 4 only | Replaced → §M3 |
| **13** | `Header`/`DateSelectors` soft Material idiom | Soft shadow family **removed**; folded into `shadow-neo-sm` | Judgement → §R5 |
| **14** | Dark mode = `!important` class overrides | `[data-color-mode='dark']` var block in `tokens.css`; `darkMode: ['selector', …]` | Structural |
| **15** | `font-medium`/`semibold` have no loaded face; serif misapplied | `fontWeight` = normal/bold/black only; `font-serif` reserved for display | Replaced → §M6, §M7 |
| **16** | 3 canvases + 4 interchangeable off-whites | `canvas`; `surface-soft` (absorbs all four) | Replaced → §M2 |
| **17** | Dead `--neo-*`, `COLORS`, `neo-shadow-lg`, unused import | **Deleted, not carried over** (documented in `tokens.css` footer) | Done |
| **18** | `p-5` vs `p-6`; half-steps put the grid at 2px | `p-card` (16px) / `p-card-lg` (**24px**) | Judgement → §R4, §M9 |
| **19** | Lists carry no size/weight hierarchy | **Not a token problem.** Needs design → §P1 | Deferred |
| **20** | Same card, 3 silhouettes across clients | One radius scale shared by all three configs | Replaced → §M3, §P3 |

---

# Part 2 — Judgement calls (each conflict, and why this side won)

### §R1 — "done" resolved to `theme.secondary` → `bg-done`

Five encodings existed (`DESIGN_SYSTEM.md` §1.6). Across the three files the
brief named, theme-driven color wins **4 of 5** encodings, and within those,
a two-level split is already consistent:

| Level | Existing | Token |
|---|---|---|
| One habit completed on one day | `theme.secondary` — `MonthlyView.tsx:280` | **`bg-done`** |
| An aggregate reaching 100% (day / week / month) | `theme.primary` — `MonthlyView.tsx:233`, `WeeklyView.tsx:190` | **`bg-complete`** |

So `done` = `theme.secondary` is not a coin-flip; it is the encoding already
used for the atomic "this is done" mark, and it preserves the existing
secondary-vs-primary distinction rather than flattening it.

**Reassign these:**

| Site | Now | → |
|---|---|---|
| `DailyCard.tsx:771` habit checkbox | `bg-black text-white` | `bg-done` (+ `text-ink-strong`) |
| `DailyCard.tsx:929` task checkbox | `bg-green-500 border-green-600` | `bg-done border-done` — **drops the only green in the app** |
| `MonthlyView.tsx:280` | `theme.secondary` inline | `bg-done` |
| `MonthlyView.tsx:233` | `theme.primary + '20'/'15'` | `bg-complete-tint` |
| `WeeklyView.tsx:190` | `theme.primary` / `theme.secondary` | `bg-complete` / `bg-done` |
| `TasksView.tsx:31` `opacity-0`, `ListsView.tsx:131` `opacity-50` | opacity | Keep as *dismissal* animation; add `bg-done` for the checkbox itself. Opacity was never a color encoding. |

⚠️ `DailyCard.tsx:771` is the app's most-seen control. Black → theme-secondary
is a **visible change** and needs a look before merge.

### §R2 — `.neo-shadow` resolved to **4px**

Three of four definitions already say 4px — `index.html:76`,
`chrome-extension/src/index.css:77`, `.landing-neo-shadow-sm`. Only
`dark-theme.css:59` says 6px, and it wins today purely by injection order.
4px also sits between the 3px (20 uses) and 6px (7 uses) clusters, so one token
absorbs both.

⚠️ **Visible regression to expect:** the 13 `.neo-shadow` call sites currently
render at 6px and will drop to 4px. The extension is unaffected (already 4px).

### §R3 — All modal shells resolved to **16px** (`rounded-modal`)

Reference is the four modals that already crossed to the rounded idiom —
`StreakModal.tsx:369`, `TasksView.tsx:305`, `AiPersonalityPickerModal.tsx:17`,
`AiDisclaimerModal.tsx:17` — all `rounded-2xl` = 16px. This equals the dominant
main-view card radius (`rounded-2xl`, 66 uses), so a single value closes both
halves of §6. The 10 square modals **and the square app frame**
(`App.tsx:1721`) adopt it.

### §R4 — Card padding resolved to **`p-6` / 24px** (`p-card-lg`)

`p-6` (17 uses) beats `p-5` (13). Everyday card padding stays `p-4` / 16px
(`p-card`, 57 uses); `p-card-lg` is only for the roomy tier. Affects
`DashboardView.tsx:91,102,117,124` (`p-5` → `p-card-lg`) and
`StreakModal.tsx:397,411,425` (`p-6` → `p-card-lg`, no visual change).

### §R5 — Soft shadow family **folded in**, not kept

The brief said keep it only if the audit shows intent. §9 #13 shows the
opposite: it is an unintentional Material idiom leaking in through
`Header.tsx` and `DateSelectors.tsx`. So `shadow` / `-sm` / `-md` / `-lg` /
`-xl` / `-inner` are removed. One exception survives — `shadow-frame`, the
dark-mode ambient glow `.app-main-frame` genuinely needs
(`dark-theme.css:314`).

⚠️ `DateSelectors.tsx:45,115,170` popovers go from `border border-stone-200
shadow-xl rounded-lg` to `border-2 border-edge-strong shadow-neo
rounded-control`. That is a deliberate restyle, not a swap — review it.

---

# Part 3 — Mechanical migration maps

### §M1 — Duplicate definitions to delete

| Delete | Because |
|---|---|
| `index.html:71-77` `.neo-border` / `.neo-shadow` | → `border-3 border-edge-strong`, `shadow-neo`. `.neo-shadow` is **dead as of batch 1**; `.neo-border` still has 52 users |
| `dark-theme.css:1-33` `--dark-*`, `--neo-*`, aliases | → `tokens.css`. ⚠️ `--neo-*` is **NOT** dead: the `--landing-neo-*` aliases have 36 consumers in `LandingPage.tsx`. Both the palette and the aliases are now defined in `tokens.css`, so this block is safe to delete — but only because of that. |
| `dark-theme.css:55-74` `.neo-shadow*`, `.landing-neo-shadow*` | → the 3-tier `shadow-neo*` scale |
| `dark-theme.css:126-138` blanket `[class*='shadow-[']` overrides | → per-token dark values (this is what un-flattens the tiers) |
| `chrome-extension/src/index.css:72-78` local `.neo-*` | → v4 `@theme`. **Already dead** — the extension never used these classes |
| `constants.ts:34-43` `COLORS` | Dead (§9 #17) |
| `mobile/src/components/DailyCard.js:11` `NeoButton` import | Unused (§9 #17) |

### §M2 — Palette classes → semantic tokens

Progressive and non-breaking: `colors` is **extended**, so old classes keep
working until each file is converted. Convert file-by-file, then delete
`dark-theme.css`.

**Text** (8 steps → 5; light-mode nuance preserved, unlike `dark-theme.css`
which already collapses 600–900 into one dark value):

| Now | → |
|---|---|
| `text-black`, `text-stone-900`, `text-stone-800` | `text-ink-strong` |
| `text-stone-700`, `text-stone-600` | `text-ink` |
| `text-stone-500` (135) | `text-ink-muted` |
| `text-stone-400` (216, workhorse) | `text-ink-subtle` |
| `text-stone-300` (67) | `text-ink-dim` |
| `text-gray-*` (26 uses, a stray second grey ramp) | nearest `ink-*` |

**Surfaces / borders:**

| Now | → |
|---|---|
| `bg-white` | `bg-surface` |
| `bg-[#fdfdf8]`, `bg-[#fcfcfc]`, `bg-[#f9f9f9]`, `bg-[#f0f0f0]`, `bg-[#f9f2f2]` | `bg-surface-soft` (§9 #16) |
| `bg-stone-50` (101) | `bg-surface-muted` |
| `bg-stone-100` (81), `hover:bg-stone-100` | `bg-surface-strong` |
| `bg-stone-200` (26 — tracks, separators) | `bg-edge` |
| `bg-black`, `bg-stone-800` | `bg-ink-strong` |
| `bg-[#F4F4F0]`, `bg-[#e5e5e5]` (ext) | `bg-canvas` |
| `border-black` | `border-edge-strong` |
| `border-stone-200` (92) | `border-edge` |
| `border-stone-100` (25), `border-stone-50` | `border-edge-subtle` |
| `border-stone-300` (24), `border-stone-400` (18) | `border-edge-muted` |
| `ring-black` | `ring-ring` |
| `bg-black/20…/60` | `bg-scrim` |

**Status:**

| Now | → |
|---|---|
| `#ef4444`, `text-red-500`, `bg-red-500`, `text-rose-*`, `bg-rose-*` | `missed` / `missed-tint` |
| `bg-amber-50`, `-100`, `text-amber-600/700/800/900`, `border-amber-*` | `warning-faint` / `-tint` / `warning` |
| `bg-amber-300`, `border-amber-700`, `text-amber-900` (inactive day, `DailyCard.tsx:759,771`) | `inactive` / `inactive-text` |
| `text-orange-500`, `fill-orange-500`, `bg-orange-100` | `streak` |
| `bg-green-500`, `border-green-600` | `done` (see §R1) |
| the 5 mood hexes in **6** files | `moodScale` **JS import** — NOT `var()`. Consumers are SVG attributes, `ctx.fillStyle`, a PDF string, and one hex-alpha concatenation (`m.color + '18'`), none of which resolve CSS vars. Needs a small refactor; see `UNRESOLVED.md` batch 4a §A |
| `theme.primary + 'NN'` string concat | `theme-primary-faint/soft/strong` — ⚠️ **`+ '20'` is 12.5%, not 20%** (hex alpha; see `tokens.css`) |

### §M3 — Radius and border width

| Now | → | Δ |
|---|---|---|
| `rounded-sm` (13), `rounded-[2px]`, `-[3px]`, `-[4px]` | `rounded` | +2px on the 2px ones |
| `rounded-md` (6) | `rounded-lg` | +2px |
| `rounded-[10px]`, `-[12px]`, `-[14px]` | `rounded-xl` | ±2px |
| `rounded-[20px]`, `-[22px]`, `-[24px]` | `rounded-2xl` | −4…−8px |
| `rounded-3xl` (1), `rounded-[28px]`, `-[30px]` | `rounded-2xl` | ⚠️ −8…−14px, `LandingPage.tsx:854` |
| `rounded-b-[10px]` (3), `rounded-t-[10px]` | `rounded-b-xl` / `rounded-t-xl` | +2px |
| main-view cards | `rounded-card` | — |
| **10 square modals + `App.tsx:1721` frame** | `rounded-modal` | ⚠️ 0 → 16px (§R3) |
| buttons / inputs / icon buttons | `rounded-control` | — |
| `border-[3px]` + `-t-`/`-b-`/`-r-`/`-l-` variants (**93**) | `border-3` / `border-t-3` / … | none |
| `border-[2px]` + variants (**58**), `border-[1px]` (1) | `border-2` / `border-t-2` / `border-b-2` / `border` | none |
| `border-[2.5px]` + `border-b-[2.5px]` (**4**, web + extension) | `border-2` / `border-b-2` | −0.5px |
| `border-[4px]` + variants (**5**) | `border-4` / `border-t-4` / … | none |
| `border-[5px]` (2), `border-[6px]` (1) | **left alone** — spinner-ring stroke width, not a border. See `UNRESOLVED.md` batch 3 |

### §M5 — Shadows

| Now | → |
|---|---|
| `shadow-[1px_1px…]` (6), `shadow-[2px_2px…]` (25, both spellings) | `shadow-neo-sm` |
| `shadow-[3px_3px…]` (20), `[4px_4px…]` (15), `[6px_6px…]` (7) | `shadow-neo` |
| `shadow-[8px_8px…]` (12), `[12px_12px…]` (1) | `shadow-neo-lg` |
| `.neo-shadow` (13) | `shadow-neo` — ⚠️ 6px → 4px (§R2) |
| `.neo-shadow-sm` (1) | `shadow-neo-sm` — 3px → 2px |
| `.landing-neo-shadow` (7) + `-sm` (3) | `shadow-neo` — 6px/4px → 4px |
| all alpha variants (`0.5/0.3/0.2/0.12/0.1`) | the opaque token at the matching tier |
| `rgba(251,191,36,1)` amber CTA | `shadow-neo-accent` |
| `shadow`, `-sm`, `-md`, `-lg`, `-xl`, `-inner` (71) | `shadow-neo-sm` (chrome) or `shadow-neo` (popovers) — §R5 |
| `.app-main-frame` dark glow | `shadow-frame` |
| `shadow-none` (10) | keep |

### §M6 — Type scale

| Now | → | Note |
|---|---|---|
| `text-[6px]` (1, `StreakModal.tsx:578`), `text-[7px]` (15) | `text-3xs` | ⚠️ **accessibility** — raise, do not preserve. §P5 |
| `text-[8px]` (39) | `text-3xs` | +1px |
| `text-[9px]` (115) | `text-3xs` | none |
| `text-[10px]` (241) | `text-2xs` | none — anchor |
| `text-[11px]` (72) | `text-xs` | ⚠️ +1px across 72 sites; check dense grids |
| `text-[12px]` (10), `text-xs` (93) | `text-xs` | none |
| `text-[13px]` (10), `text-sm` (136) | `text-sm` | +1px / none — anchor |
| `text-base` (14), `text-lg` (36), `text-xl` (20) | unchanged | none |
| `text-2xl` (11) | `text-xl` | −4px |
| `text-3xl` (12), `4xl` (5), `5xl` (9), `7xl` (4), `text-[15vw]`, `text-[1.7rem]` | `text-display` | ⚠️ landing-only, 30 sites → §P6 |
| `text-[18px]` (1) | `text-lg` | none |

### §M7 — Font weights (80 sites, no loaded face today)

`font-semibold` → `font-bold`. `font-medium` → `font-normal` for body copy,
`font-bold` for labels. Both rendered synthetically before, so either choice is
a change; pick per site.

```
font-medium (57)   LandingPage 8  ListsView 8  YearView 7  TasksView 5
                   WhatsNewPreviews 4  FeedbackModal 4  App 4  JournalPdfPreviewModal 3
                   HabitManagerModal 3  SearchModal 2  DailyCard 2  + 7 files × 1
font-semibold (23) OnboardingModal 7  Header 7  WhatsNewPreviews 3
                   FeatureAnnouncementModal 3  FeedbackModal 1  AuthForm 1  App 1
```

### §M8 — Serif, mono, scrim, z-index

**`font-serif` is display-only.** All 18 uses, classified:

| Site | Size | Verdict |
|---|---|---|
| `App.tsx:2254`, `:2294`, `:2309` | 9px | ❌ → `font-sans` |
| `BottomNav.tsx:36` | 9px | ❌ → `font-sans` (only serif nav label in the app) |
| `DashboardView.tsx:94` | 10px | ❌ → `font-sans` — its sibling at `:105` is identical but sans |
| `App.tsx:2177` | 14px | ❌ → `font-sans` |
| `Header.tsx:285`, `StreakModal.tsx:379`, `YearView.tsx:185` | 20px | ✅ keep |
| `LoadingScreen.tsx:14,15` | 48px | ✅ keep |
| `LandingPage.tsx:165,286,732,836,850,851,855` | 30–72px | ✅ keep |

→ **6 wrong-context usages to switch to `font-sans`.**

`font-mono` (`FeedbackModal.tsx`, 2 uses): no face loaded, token removed → use
`font-sans`, or load a mono face if the content needs it.

**Scrim:** all of `bg-black/20|30|40|45|50|55|60` → `bg-scrim`. Also add
`backdrop-blur-sm` to the 3 modals missing it (`ShareCustomizationModal.tsx:50`,
`TasksView.tsx:301`, and `ShareCustomizationModal`'s inner overlay).

**Z-index:** values unchanged, so stacking order is preserved exactly —
`z-50`→`z-nav`, `z-[60]`→`z-dropdown`, `z-[90]`→`z-overlay`, `z-[100]`→`z-modal`,
`z-[110]`→`z-preview`, `z-[120]`→`z-sheet`, `z-[200]`→`z-dialog`,
`z-[210]`→`z-alert`. Local `z-10`/`z-20`/`z-30`/`z-40` inside components are
untouched.

### §M9 — Spacing half-steps (rounding decision per the brief)

Tailwind's stock scale is retained — it already *is* the 4px grid the audit
found dominant, and `spacing` also feeds width/height/gap/inset, so
blanket-overriding it would break layout well beyond padding. The half-steps are
therefore removed **by migration**, with the direction fixed here:

| Now | → | Direction | Why |
|---|---|---|---|
| `py-0.5` (29) | `py-1` | **up** (2→4px) | preserves separation; 2px is off-grid |
| `p-0.5` (6) | `p-1` | **up** | same |
| `px-0.5` (1) | `px-1` | **up** | same |
| `py-3.5` (2) | `py-3` | **down** (14→12px) | `py-3` has 26 uses vs `py-4`'s 4 |
| `p-5` (13) | `p-card-lg` (24px) | **up** | §R4 |
| `p-6` (17) | `p-card-lg` (24px) | — | §R4 |
| `p-4` (57) | `p-card` (16px) | — | default card padding |
| `p-3` (92) | `p-gutter` (12px) | — | dense/default gutter |

`px-1.5` / `py-1.5` / `py-2.5` / `px-2.5` (6px and 10px) are **kept** — they are
on the stock scale and in heavy use; the brief only called out `0.5` and `3.5`.

---

# Part 4 — Deliberately unresolved (needs a decision, not a token)

- **§P1 — List/grid hierarchy (§9 #19).** 11 components render fully uniform
  rows. Tokens cannot fix this; it needs a design decision about what earns
  emphasis. Worst cases: `YearView` (14 identical stat cards),
  `DashboardView.tsx:139-172` (3 identical support cards).
- **§P2 — `StreakModal`'s 22 badge hexes.** Illustration assets, not UI tokens.
  Recommend a local `BADGE_PALETTE` constant in that file rather than promoting
  them globally. Its *chrome* (`orange-50`/`amber-50`/`violet-50` tiles) does
  migrate to `warning-*` per §M2 — the violet has no token and needs a call.
- **§P3 — Mobile.** `twrnc` cannot read CSS variables. It needs its own
  `mobile/tailwind.config.js` built from the `tokens` literal export, and the
  dark swap has to be a JS-side theme object. Mobile currently leans much
  rounder (`rounded-3xl` × 27) than the 16px scale.
- **§P4 — No shared primitives.** 247 inline buttons across 26 files and 12 card
  variants. Tokens make them *consistent*; they don't make them *reusable*. A
  `<Button>` / `<Card>` / `<Modal>` extraction is the logical next step and is
  out of scope here. `mobile/src/components/NeoComponents.js` is the only
  existing precedent.
- **§P5 — Accessibility.** 16 sites below 9px (`text-[6px]` ×1, `text-[7px]` ×15)
  are mapped to `text-3xs` in §M6, but 9px is still small. Worth a real
  decision rather than a mechanical remap.
- **§P6 — Landing display type.** Collapsing 30/36/48/72px and `15vw` into one
  48px step will visibly change the hero. Either put `LandingPage.tsx` on a
  documented exception list or give it its own display sub-scale.
- **§P7 — Print/canvas palettes.** `exportJournalPdf.ts` (7 hexes) and
  `RetroGrid.tsx` (6) are intentionally separate; leave them, but move to
  local module constants so they stop showing up as app-palette noise. Both
  should import `moodScale` for the mood colors.
- **§P8 — Extension canvas.** Adopting `--canvas` changes the extension
  background from `#e5e5e5` to `#F4F4F0`. Intended (one canvas), but visible.
- **§P9 — One v4 detail to verify on first build.** `tailwind-v4-theme.css`
  clears the radius namespace with `--radius-*: initial` and relies on v4's
  built-in `0.25rem` for the bare `rounded` utility (which matches our 4px
  step). Confirm `rounded` still emits 4px in the extension build; if not, add
  an explicit `@utility rounded`. Flagged in the file itself.

---

# Part 5 — Suggested order, and how to verify

1. Prerequisites (above) — nothing works before these.
2. `§M1` deletions + `§M2` color migration, **one file at a time**, then delete
   `dark-theme.css`. Check both color modes after each file.
3. `§M3` radius/borders → the §R3 modal change lands here. Screenshot-diff the
   10 modals.
4. `§M5` shadows → expect the 6px→4px shift on 52 sites (§R2).
5. `§M6`/`§M7`/`§M8` type, weights, serif — mostly mechanical.
6. `§M9` spacing.
7. Part 4 items as separate, scoped tickets.

Verification greps — each should return **0** when its step is done:

```bash
# no arbitrary hex in class names or inline style
grep -rnE '(bg|text|border|from|to)-\[#' src/ --include=*.tsx
grep -rnE '#[0-9a-fA-F]{3,8}' src/ --include=*.tsx        # allow-list: RetroGrid, StreakModal badges (§P2/§P7)

# no arbitrary shadows / radii / border widths
grep -rnE 'shadow-\[|rounded-\[|border-\[[0-9]' src/ --include=*.tsx
grep -rn 'shadow-sm\|shadow-md\|shadow-lg\|shadow-xl\|shadow-inner' src/ --include=*.tsx

# no arbitrary type sizes, no unloaded weights, no removed radii
grep -rnE 'text-\[[0-9]' src/ --include=*.tsx
grep -rn 'font-medium\|font-semibold' src/ --include=*.tsx
grep -rn 'rounded-sm\|rounded-md\|rounded-3xl' src/ --include=*.tsx

# no raw scrims, no unnamed z-index, no legacy neo classes
grep -rn 'bg-black/' src/ --include=*.tsx
grep -rnE 'z-\[[0-9]+\]' src/ --include=*.tsx
grep -rn 'neo-border\|neo-shadow\|landing-neo' src/ index.html chrome-extension/src

# mood scale defined only once
grep -rn '#ef4444' src/ --include=*.tsx --include=*.ts   # expect: tokens.css + moodScale export only
```

⚠️ On the CDN build, removed utilities fail **silently** (the class simply
produces no CSS) rather than erroring. Do prerequisite 1 first, or these
migrations will look done while rendering nothing.
