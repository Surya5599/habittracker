# DESIGN_SYSTEM.md

**Reverse-engineered inventory of HabiCard's visual design as currently implemented.**
Audited 2026-08-13. Descriptive only — no fixes or redesigns proposed.

Scope: web app (`src/`), Chrome extension (`chrome-extension/src/`), mobile (`mobile/src/`).

---

## 0. How styling is delivered (context for everything below)

| Platform | Mechanism | Token layer? |
|---|---|---|
| Web | Tailwind via **CDN** (`<script src="https://cdn.tailwindcss.com">` in `index.html:34`) | **None.** No `tailwind.config.js`, no `postcss.config.js` exist. Every non-default value is an arbitrary literal (`bg-[#fdfdf8]`, `shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`). |
| Web (partial) | `src/dark-theme.css` — CSS custom properties + `html[data-color-mode='dark']` override sheet | Partial: `--dark-*`, `--neo-*`, `--card-bg`, `--input-bg` |
| Web (partial) | Inline `<style>` in `index.html:36-83` — `body`, `.neo-border`, `.neo-shadow`, scrollbars | Yes, but **conflicts with `dark-theme.css`** (see §3.4) |
| Extension | Tailwind v4 (`@import "tailwindcss"` in `chrome-extension/src/index.css:1`), self-hosted fonts | Own copy of `.neo-border` / `.neo-shadow` with **different values** |
| Mobile | `twrnc` (Tailwind-for-RN) + a few inline `style={{}}` objects | None. Has the only *shared components* in the whole repo (`mobile/src/components/NeoComponents.js`) |

**Consequence:** there is no single source of truth. The nearest thing is `src/dark-theme.css`, whose own comments (lines 14-26, 47-53) state that `--neo-*` tokens and `.neo-shadow*` classes "are the canonical shared versions — use these in app components going forward." Adoption is low (§3.4).

Dark mode is implemented as a **selector-override sheet**, not a token swap: `dark-theme.css` re-colors ~45 specific Tailwind utility classes with `!important` (`.bg-white`, `.bg-stone-50`, `.text-stone-500`, `[class*='shadow-[']`, …). Any new utility class outside that list is un-themed in dark mode by construction.

---

## 1. Color palette

### 1.1 Headline numbers

- **163 distinct hex values** across `src/**` (`.tsx`, `.ts`, `.css`).
- **103 of those 163 (63%) appear exactly once** — see §1.7.
- Plus ~120 distinct Tailwind palette class/shade combinations (`text-stone-400`, `bg-amber-50`, …).

### 1.2 App background / surface

| Value | Role | Files |
|---|---|---|
| `#F4F4F0` | App canvas (light). Also `--neo-bg`. | `index.html:39`, `src/App.tsx:1605,1642,1671,3038,3144`, `LoadingScreen.tsx`, `dark-theme.css:29,104` |
| `#e5e5e5` | App canvas — **extension only** | `chrome-extension/src/index.css:57`; also referenced in `dark-theme.css:118` and `PrivacyPolicy.tsx`, `UpdatePasswordForm.tsx`, `MonthlyView.tsx:224` |
| `--card-bg` = `#ffffff` / `#1a1a1a` | Card surface | `dark-theme.css:99,110` |
| `--card-bg-soft` = `#fdfdf8` / `#1a1a1a` | Secondary card surface | `dark-theme.css:100,111`; consumed in `MonthlyView.tsx:110,138,206,295` |
| `--input-bg` = `#ffffff` / `#222222` | Inputs | `dark-theme.css:101,112` |
| `#fdfdf8` | Journal "cream" paper | `JournalPdfPreviewModal.tsx:163`, `exportJournalPdf.ts`, `dark-theme.css:159` |
| `#fcfcfc`, `#f9f9f9`, `#f0f0f0`, `#f9f2f2` | Four near-identical off-whites, all mapped to the *same* dark surface | defined in `MonthlyView.tsx:188,289,295`, `App.tsx`, `ShareCustomizationModal.tsx`, `shareCardGenerator.ts`; collapsed by `dark-theme.css:137-156` |

### 1.3 Dark-mode ramp (the one real token set)

`src/dark-theme.css:1-13`

```
--dark-bg #0d0d0d   --dark-bg-soft #111111
--dark-surface #1a1a1a  --dark-surface-2 #222222  --dark-surface-3 #2a2a2a
--dark-border rgba(255,255,255,.10)  --dark-border-mid .15  --dark-border-strong .22
--dark-text #eeeeee  --dark-muted #9a9a9a  --dark-dim #636363  --dark-glow rgba(0,0,0,.45)
```

Three additional dark greys bypass the ramp and are hard-coded inside the same file: `#181818` (`.bg-stone-300`, line 219), `#202020` (`.bg-stone-400`, line 223), `#303030` (`hover:bg-stone-200`, line 366). `#111111` is also reused for `.bg-black` (line 228).

### 1.4 Neo-brutalist accent tokens

`src/dark-theme.css:27-33` — defined, and aliased to `--landing-neo-*`:

> **CORRECTION (this line originally read "not referenced by any component" — that was wrong).**
> The `--neo-*` names themselves have no direct consumers, but the **`--landing-neo-*` aliases
> are referenced 36 times** in `LandingPage.tsx` — `text-[var(--landing-neo-green)]` ×15,
> `-yellow` ×8, `-pink` ×7, `-blue` ×4, `-orange` ×1, `bg-[var(--landing-neo-bg)]` ×1 — as
> arbitrary-value classes and inline style values. The original check grepped the `--neo-*`
> names and never the aliases. They are a **live accent palette**, not dead tokens.

```
--neo-yellow #FFD800  --neo-pink #FF90E8  --neo-green #23A094
--neo-blue #90A8ED    --neo-orange #FF7A00  --neo-bg #F4F4F0
```

### 1.5 Theme presets (user-selectable)

`src/constants.ts:15-29` — 13 themes, each `{ primary, secondary }`, 26 hex values total, muted/desaturated palette (`#8da18d`, `#5b8a8a`, `#b28d6c`, … `Monochrome: #2d2d2d/#6b6b6b`). Consumed semantically as `theme.primary` (**97 uses**) and `theme.secondary` (**57 uses**) — the most disciplined color usage in the codebase.

`src/constants.ts:34-43` also exports a **second, unrelated, apparently dead palette** `COLORS` (`sage`, `clay`, `slate`, `dustyRose`, `background: #fcfbf7`, `card`, `text: #3d4b3d`, `gridEmpty: #f3f4f6`) that does not match `THEMES` and shares no values with the app canvas.

### 1.6 Status / semantic colors

**Mood scale (1–5)** — the same five hex values, hand-typed in **6 separate files**:

```
1 #ef4444 (angry)  2 #f97316  3 #eab308  4 #84cc16  5 #10b981 (laugh)
```
`MonthlyView.tsx:152-156`, `App.tsx:2609-2613,2684`, `DailyCard.tsx:485-489`, `RetroGrid.tsx:32-36`, `LandingPage.tsx:120-124`, `utils/exportJournalPdf.ts:53-61`. No shared constant.
(`ListsView.tsx:6` is **not** one of them — it is a list-colour swatch palette that shares three hexes then diverges to `#22c55e`/`#06b6d4`.)
The five background **tints** are duplicated too, and already disagree: mood 3 is `#fef9c3` in `App.tsx:2611` but `#fef3c7` in `exportJournalPdf.ts:57`.

**Habit done / not-done** — expressed differently per surface:

| Surface | Done | Not done | File |
|---|---|---|---|
| DailyCard habit checkbox | `bg-black text-white` | `bg-white` | `DailyCard.tsx:771` |
| DailyCard *task* checkbox | `bg-green-500 border-green-600 text-white` | `bg-white hover:bg-stone-100` | `DailyCard.tsx:929` |
| MonthlyView cell | `backgroundColor: theme.secondary` | undefined (transparent) | `MonthlyView.tsx:280` |
| MonthlyView day column | `theme.primary + '20'` (full) / `theme.primary + '15'` (today) | undefined | `MonthlyView.tsx:233` |
| WeeklyView bar | `theme.primary` if pct ≥ 100 | `theme.secondary` | `WeeklyView.tsx:190` |
| YearView month cell | — | `#fee2e2` for negative months | `YearView.tsx:505` |
| TasksView row | `opacity-0` (fades out) | `opacity-100` | `TasksView.tsx:31` |
| ListsView row | `opacity-50` | — | `ListsView.tsx:131` |

So "done" is variously black, green-500, `theme.secondary`, `theme.primary`, or an opacity change.

**Inactive day** — `bg-amber-300 text-amber-900 border-amber-700` + `text-amber-700` label (`DailyCard.tsx:759,771`). Amber is also the "hint" color (`OnboardingModal.tsx:81`), the "needs attention" card (`DashboardView`, `#fffbeb`), and the feedback "awaiting admin" dot (`FeedbackModal.tsx:787`).

**Streak / fire** — `text-orange-500 fill-orange-500` (`StreakModal.tsx:376`), `bg-orange-50 border-orange-200` tile, plus `bg-orange-100 text-orange-600` badge in `Header.tsx:304`.

**Warning / destructive** — no single value: `bg-red-500` (5×), `text-red-500` (6×), `border-red-300`/`red-500` (`ListsView.tsx:258`), `bg-rose-50`/`text-rose-700` (`FeedbackModal`, `YearView.tsx:384`), `#ef4444` raw, `hover:bg-red-50`. Red, rose, and raw-hex red all coexist.

### 1.7 Likely one-offs (single-use hex values)

103 values used exactly once. Concentrations:

- **`StreakModal.tsx` — 22 single-use hex values** (`#154c79 #1e293b #475569 #4b2a7b #8a4b00 #8d1832 #b8d8f4 #bfdbfe #cbd5e1 #d4af37 #d7c7ff #dcefff #e6ddff #eef7ff #f3efff #f5b9c6 #f8fafc #f9d6a3 #facc15 #fef08a #ffd4dc #ffe7c2 #ffe8eb #fff2df`). These are the badge/medal illustrations — a self-contained sub-palette that shares nothing with the rest of the app.
- **`constants.ts` — 14** (the odd halves of the 13 theme presets + the dead `COLORS` set).
- **`utils/exportJournalPdf.ts` — 7** (`#1c1917 #c4bdb5 #e8e3db #ece8e2 #f0ece4 #fef3c7`, +`#fdfdf8`). Print-only palette, deliberately separate.
- **`RetroGrid.tsx` — 6** (`#0f172a #1f4d3a #3f7a5f #76a98f #b9d6c7 #e7f0eb`).
- **`ListsView.tsx` — 5** list-color swatches (`#06b6d4 #14b8a6 #64748b #a855f7 #ec4899`) — Tailwind-500 hexes not drawn from `THEMES`.
- **`WeeklyView.tsx` — 3** gradient tints (`#fff7ef #f6fbf6 #f2f0fb`) used only for the summary strip (`WeeklyView.tsx:169,173,177`).
- **`WhatsNewPreviews.tsx` — 4** (`#374151 #3b82f6 #8b5cf6 #f59e0b`) — indigo/blue/violet family found nowhere else in app UI.
- Scattered: `#f7f5f2` (`AuthForm.tsx`), `#f0efed` (`MonthlyView.tsx:110`), `#fffbeb` (`DashboardView.tsx`), `#151515 #161616 #9ac1a0 #b09ac1 #c19a9a #d6d6d6 #ddd #ededed #a8a8a8 #f87171 #f9fafb #fef9c3 #34d399` (all `App.tsx`).

---

## 2. Typography

### 2.1 Families

Loaded from Google Fonts (`index.html:35`): **Inter** 400/700/900, **Playfair Display** 700/900. Extension self-hosts the same five faces (`chrome-extension/src/index.css:8-45`).

| Family | Class | Uses | Where |
|---|---|---|---|
| Inter | *(default on `body`)* | everything | `index.html:37-39`, `dark-theme.css:42-44` |
| Playfair Display | `font-serif` / `.font-playfair` | **18** | `LandingPage.tsx` (7), `App.tsx` (4), `LoadingScreen.tsx` (2), `BottomNav.tsx:36`, `DashboardView.tsx:94`, `Header.tsx`, `StreakModal.tsx`, `YearView.tsx` |
| Inter (re-asserted) | `font-sans` | **8** | `DailyCard.tsx` (3 — on all card faces), `App.tsx` (2), `ShareCustomizationModal.tsx:115`, `LandingPage.tsx`, `PrivacyPolicy.tsx` |
| monospace | `font-mono` | **2** | `FeedbackModal.tsx` only |

**Flag — Playfair is applied inconsistently at the same semantic level.** Both of these are 10px uppercase black micro-labels inside the same view, one serif and one not:

```
DashboardView.tsx:94   font-serif text-[10px] font-black uppercase tracking-widest text-stone-500   "Year in review"
DashboardView.tsx:105  text-[10px] font-black uppercase tracking-widest text-stone-500              "What defined the year"
```

`BottomNav.tsx:36` is the only navigation label in serif. `font-mono` in `FeedbackModal` is the only mono in the app.

### 2.2 Sizes

18 distinct sizes; **arbitrary px values outnumber Tailwind steps 3:1**.

| Size | Uses | Notes |
|---|---|---|
| `text-[10px]` | **241** | de-facto default for labels/metadata |
| `text-sm` (14px) | 136 | de-facto body |
| `text-[9px]` | 115 | |
| `text-xs` (12px) | 93 | overlaps `text-[12px]` (10 uses) |
| `text-[11px]` | 72 | |
| `text-[8px]` | 39 | |
| `text-lg` | 36 | |
| `text-xl` | 20 | |
| `text-[7px]` | 15 | |
| `text-base` | 14 | |
| `text-3xl` | 12 | |
| `text-2xl` | 11 | |
| `text-[13px]` / `text-[12px]` | 10 / 10 | `text-[12px]` duplicates `text-xs`; `text-[13px]` sits between `text-xs` and `text-sm` |
| `text-5xl` 9, `text-4xl` 5, `text-7xl` 4 | | display, mostly `LandingPage` |
| `text-[15vw]`, `text-[1.7rem]`, `text-[18px]`, `text-[6px]` | 2/2/1/1 | one-offs |

Effective micro-type ladder is **6, 7, 8, 9, 10, 11, 12, 13px** — eight steps within 7px of range, with `text-xs`/`text-[12px]` as literal duplicates. `text-[6px]` (`StreakModal.tsx:578`) and `text-[7px]` (15×) are below most accessibility floors.

### 2.3 Weights

| Class | Uses |
|---|---|
| `font-black` (900) | **493** |
| `font-bold` (700) | 180 |
| `font-medium` (500) | 57 |
| `font-semibold` (600) | 23 |

Weight 900 is the default voice. `font-semibold` (23 uses) is the odd one out — Inter is loaded at 400/700/900 only, so **`font-semibold` and `font-medium` (80 uses combined) have no loaded face** and render synthetically or snap to 400/700.

Tracking: `tracking-widest`, `tracking-wide`, `tracking-wider` plus arbitraries `tracking-[0.22em]` (`DashboardView.tsx:125,142,157,165`), `tracking-[0.16em]` (`YearRetroModal.tsx:143`), `tracking-[0.04em]` (`StreakModal.tsx:578`).

---

## 3. Borders, radius & shadow

### 3.1 Border widths

| Class | Uses |
|---|---|
| `border` (1px) | **854** |
| `border-2` (2px) | 166 |
| `border-[3px]` **93** — `border-[3px]` 64, `-b-` 12, `-t-` 11, `-r-` 4, `sm:` 1, `lg:border-l-` 1 | the "structural" weight |
| `border-[2px]` **58** — plain 46, `-b-` 9, `-t-` 3 | duplicates `border-2` exactly |
| `border-[4px]` **5** — plain 1, `-r-` 2, `-t-` 1, `-b-` 1 | duplicates `border-4` exactly |
| `border-b-2` 20, `border-t-2` 8, `border-b-[2px]` | tab/header dividers |
| `border-t-4` 3, `border-l-4` 3, `border-y-4` 1, `border-y-2` 1 | accent bars |
| `border-[2.5px]` / `border-b-[2.5px]` | 4 — `ShareCustomizationModal.tsx:115,118` **and its extension copy** |
| `border-[5px]` | 2 — `SettingsMenu.tsx:268` **(web)** + mobile; both are spinner rings |
| `border-[6px]` | 1 — `OnboardingModal.tsx:577`, spinner ring |
| `border: 3px solid #1c1917` | 4 (`exportJournalPdf.ts`, print) |

Three co-existing "heavy border" weights: **2px, 2.5px, 3px**, chosen per-component with no rule.

### 3.2 Radius

| Class | Uses | px |
|---|---|---|
| `rounded-full` | 113 | pill |
| `rounded-lg` | 72 | 8 |
| `rounded-2xl` | **66** | 16 |
| `rounded` | 63 | 4 |
| `rounded-xl` | 51 | 12 |
| `rounded-sm` | 13 | 2 |
| `rounded-t-2xl` | 12 | 16 |
| `rounded-md` | 6 | 6 |
| arbitrary | 22 total | `[2px] [3px]×4 [4px] [10px]×2 [12px] [14px]×2 [20px] [22px] [24px]×2 [28px] [30px]` |
| `rounded-3xl` | 1 | 24 (`LandingPage.tsx:854`) |

Distinct radius values in use: **0, 2, 3, 4, 6, 8, 10, 12, 14, 16, 20, 22, 24, 28, 30, full — 16 values.** `rounded-sm`(2) duplicates `rounded-[2px]`; `rounded`(4) duplicates `rounded-[4px]`; `rounded-2xl`(16) and `rounded-[14px]`/`rounded-[20px]` are visually adjacent.

### 3.3 Shadows

Two incompatible shadow languages:

**A. Hard offset ("neo-brutalist")** — 103 inline arbitrary instances, at depths **1, 2, 3, 4, 6, 8, 12 px**, with opacity variants `1, 0.5, 0.3, 0.2, 0.12, 0.1`:

```
shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]   20×
shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]   19×
shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]   10×
shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]    7×
shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]    7×  + shadow-[4px_4px_0_0_...] 7×  (same value, two spellings)
shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]    6×  + shadow-[2px_2px_0_0_...] 5×
shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]  1×  (LandingPage.tsx:144 hover)
shadow-[0_-6px_0px_0px_rgba(0,0,0,1)]     1×  (BottomNav.tsx:20, upward)
```
Plus tinted variants: `rgba(251,191,36,1)` amber (`FeatureAnnouncementModal.tsx:127`), `rgba(234,88,12,0.22)` orange.

**B. Soft/diffuse (Material-ish)** — `shadow` 40×, `shadow-sm` 16×, `shadow-xl` 4×, `shadow-md` 3×, `shadow-lg` 1×, `shadow-inner` 1×, plus arbitraries `shadow-[0_2px_4px_rgba(0,0,0,0.15)]` 4×, `shadow-[0_1px_2px_rgba(15,23,42,0.35)]` 2×, `shadow-[0_8px_14px_rgba(15,23,42,0.14)]`, `shadow-[0_10px_18px_rgba(15,23,42,0.12)]`, `shadow-[0_5px_14px_rgba(15,23,42,0.12)]`, `shadow-[0_10px_30px_rgba(0,0,0,0.04)]`, two `inset` highlights.

`shadow-none` appears 10× to opt out.

Dark mode flattens *all* of language A to one value via attribute selector (`dark-theme.css:126-131`): every `[class*='shadow-[']` becomes `3px 3px rgba(255,255,255,.08) + 0 8px 28px rgba(0,0,0,.55) !important`. **All seven depth tiers collapse to one in dark mode**, so the depth hierarchy exists only in light mode.

### 3.4 The canonical-class conflict

`.neo-shadow` is defined **twice in the web app with different values**:

| Definition | Value | File |
|---|---|---|
| Inline `<style>` in head | `4px 4px 0 0 rgba(0,0,0,1)` | `index.html:55-57` |
| Imported stylesheet | `6px 6px 0 0 rgba(0,0,0,1)` | `src/dark-theme.css:59-61` |
| Extension | `4px 4px 0 0 rgba(0,0,0,1)` | `chrome-extension/src/index.css:64-66` |

Same specificity, so the later-injected `dark-theme.css` wins in the web app → `.neo-shadow` renders at **6px on web and 4px in the extension** for the same class name. `.neo-border` (`3px solid black`) is consistent between the two.

Adoption of the classes `dark-theme.css` documents as canonical:

| Class | Uses in `src/**/*.tsx` |
|---|---|
| `neo-border` | 52 |
| `neo-shadow` | 13 |
| `neo-shadow-sm` | 1 |
| `landing-neo-shadow` | 7 |
| `landing-neo-shadow-sm` | 3 |
| `neo-shadow-sm` | 4 |
| `neo-shadow-lg` | **0** |
| `landing-neo-shadow` (deprecated alias) | 10 |
| inline `shadow-[Npx_Npx_0…]` | **103** |

So ~2/3 of hard shadows still bypass the canonical classes. Files using `neo-*` at all: `App.tsx`(18), `FeedbackModal.tsx`(21), `LandingPage.tsx`(10), `DailyCard.tsx`(4), and 10 files with 1 use each.

---

## 4. Spacing

Padding values in use (Tailwind scale × 0.25rem):

`0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32` — **18 steps**.

Dominant cluster (>90% of uses): **1, 1.5, 2, 2.5, 3, 4** (i.e. 4–16px).

```
p-3  92   py-2 89   p-2  84   px-2 77   px-3 71   p-4  57
py-1 50   px-4 50   p-1  40   py-1.5 36  py-0.5 29  py-3 26
p-1.5 25  px-1 23   py-2.5 21  px-6 18   p-6  17   p-5  13
```

**Flags:**
- `p-5` (13×) and `p-6` (17×) coexist as "roomy card padding" — `DashboardView.tsx:91,102,117,124` uses `p-5` for story cards while `StreakModal.tsx:397,411,425` uses `p-6` for stat tiles. Both are the top-level content padding of a card.
- Half-steps `py-0.5` (29), `p-0.5` (6), `px-0.5` (1), `py-3.5` (2) → effective 2px grid, not 4px.
- `p-8` (6×), `p-12` (2×), `py-16/20/24/32` are landing-page-only.
- Arbitrary spacing one-offs: `pr-[50%]` / `pr-[52%]` (2/1 — `LandingPage`), `pt-[15vh]` (`SearchModal.tsx:181`), `pt-[max(env(safe-area-inset-top),0.5rem)]`, `px-1.5 -mx-1.5` negative-margin row bleed (`DailyCard.tsx:751`).
- Gaps mirror the same scale; `gap-px` used for grid hairlines (`WeeklyView.tsx:168,182`).

---

## 5. Component inventory

### 5.1 There are no shared UI primitives on web

`src/components/` contains **zero** generic primitives — no `Button`, `Card`, `Modal`, `Input`, `Badge`. Every one is hand-assembled inline. `<button` appears **247 times** across 26 files:

```
SettingsMenu 25  Header 24  DailyCard 22  HabitManagerModal 21  ListsView 17
FeedbackModal 16  App.tsx 15  OnboardingModal 13  JournalPdfPreviewModal 13
DateSelectors 12  LandingPage 10  TasksView 10  AuthForm 8  StreakModal 7
ShareCustomizationModal 5  ResolutionsModal 5  FeatureAnnouncementModal 5
YearRetroModal 4  PrivacyPolicy 3  YearView 3  WeeklyView 3  AiDisclaimerModal 2
UpdatePasswordForm 1  MonthlyView 1  BottomNav 1  AiPersonalityPickerModal 1
```

Mobile is the exception: `mobile/src/components/NeoComponents.js` exports `NeoCard`, `NeoButton` (with `primary`/`secondary` variants), `NeoInput`. Used in `SignInScreen.js` only; `DailyCard.js:11` imports `NeoButton` but does not render it.

### 5.2 Card variants

| # | Variant | Definition | Files |
|---|---|---|---|
| C1 | **App frame** — square, 3px black, 8px hard shadow | `app-main-frame max-w-full md:h-full mx-auto bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-2 sm:p-3` — **no radius** | `App.tsx:1721` |
| C2 | **Canonical neo card** — 16px radius, `neo-border` + `neo-shadow` | `bg-white neo-border neo-shadow rounded-2xl` | `DailyCard.tsx:614,821,1014`, `DashboardView.tsx:81`, `AiDisclaimerModal.tsx:17`, `AiPersonalityPickerModal.tsx:17`, `TasksView.tsx:305`, `StreakModal.tsx:369` (with inline 8px shadow instead) |
| C3 | **Local `card` const** — 6px shadow, inline | `const card = "rounded-2xl border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white"` — same intent as C2, hand-written, applied 7× in one file | `DashboardView.tsx:65` |
| C4 | **YearView stat card** — 3px/4px shadow, 16px radius | `rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 bg-white` (and `[4px_4px…] p-4`) — **14 instances in one file** | `YearView.tsx:205,238,259,281,315,337,354,370,384,400,550` |
| C5 | **TasksView group card** — 12px radius, 2px border, 3px shadow | `overflow-hidden rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white` | `TasksView.tsx:227,250` |
| C6 | **Soft card (no neo at all)** — 1px stone border, diffuse shadow | `bg-white rounded-2xl border border-stone-200 shadow-sm` | `Header.tsx:280` |
| C7 | **Pastel tile** — 2px tinted border, 16px radius, no shadow | `bg-orange-50 border-2 border-orange-200 p-6 rounded-2xl` (also `amber-50/amber-200`, `violet-50/violet-200`) | `StreakModal.tsx:397,411,425` |
| C8 | **Faint-border tile** — 2px `stone-100`, 16px radius | `bg-stone-50 border-2 border-stone-100 p-4 rounded-2xl` / `border-stone-100 bg-white p-4` | `StreakModal.tsx:457,493` |
| C9 | **Insight row** — 8px radius, 2px stone border + 4px left accent | `rounded-lg border-2 border-stone-200 ${meta.accent} border-l-4 bg-stone-50 p-3` | `InsightsPanel.tsx:70` |
| C10 | **Landing card** — 16/24px radius, `landing-neo-shadow`, hover lift to 12px | `landing-neo-shadow … rounded-2xl border-[3px] border-black bg-white p-8 hover:-translate-y-1 hover:shadow-[12px_12px…]` | `LandingPage.tsx:144,317,854` |
| C11 | **StatCard** — not a card; a bordered table row | `flex justify-between items-center text-[10px] font-bold border-b border-stone-100 py-1` | `StatCard.tsx:9` |
| C12 | **Tinted-alpha card** — theme color at 12–18% alpha | `rounded-2xl border-[3px] border-black shadow-[…] ` + `backgroundColor: theme.secondary + '18'` / `'12'` | `YearView.tsx:205,337` |

**12 card variants; 7 different shadow depths across them; 4 different border treatments (3px black / 2px black / 2px tinted / 1px stone); 4 radii (0, 8, 12, 16).**

### 5.3 Modal variants

| # | Modal | Panel classes | Scrim | z-index |
|---|---|---|---|---|
| M1 | `HabitManagerModal.tsx:257` | `border-[3px] border-black shadow-[8px_8px…] bg-white` — **square** | `bg-black/50 backdrop-blur-sm` | `z-50` |
| M2 | `OnboardingModal.tsx:719` | `bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]` — **square, 20% shadow** | `bg-black/55 backdrop-blur-sm` | `z-50` |
| M3 | `SearchModal.tsx:185` | `bg-white border-[3px] border-black shadow-[8px_8px…]` — square | `bg-black/40 backdrop-blur-sm` | `z-50` |
| M4 | `ShareCustomizationModal.tsx:52` | `bg-white border-[3px] border-black shadow-[8px_8px…]` — square | `bg-black/50` — **no blur** | `z-[60]` |
| M5 | `ResolutionsModal.tsx:72` | `bg-white border-[3px] border-black shadow-[8px_8px…]` — square | `bg-black/20 backdrop-blur-sm` — **lightest scrim** | `z-[60]` |
| M6 | `YearRetroModal.tsx:56` | `bg-white border-[3px] border-black shadow-[8px_8px…]` — square | `bg-black/45 backdrop-blur-sm` | `z-[90]` |
| M7 | `FeedbackModal.tsx:830` | `bg-white neo-border neo-shadow` — square, **canonical classes** | `bg-black/40 backdrop-blur-sm` | `z-[100]` |
| M8 | `FeatureAnnouncementModal.tsx:54` | `bg-white border-[3px] border-black shadow-[6px_6px…]` — square, **6px** | `bg-black/60 backdrop-blur-sm` | `z-[100]` |
| M9 | `StreakModal.tsx:369` | `bg-white neo-border shadow-[8px_8px…] rounded-2xl` — **rounded**, header tinted `theme.primary` | `bg-black/40 backdrop-blur-sm` | `z-[100]` |
| M10 | `JournalPdfPreviewModal.tsx:163` | `border-[3px] border-black shadow-[8px_8px…]` + inline `backgroundColor: #fdfdf8 / #1a1a1a` — square, **cream, self-manages dark mode** | `bg-black/60 backdrop-blur-sm` | `z-[110]` |
| M11 | `TasksView.tsx:305` | `bg-white neo-border rounded-2xl p-5` — **rounded, no shadow**, bottom-sheet on mobile (`items-end sm:items-center`) | `bg-black/30` — no blur | `z-[120]` |
| M12 | `AiPersonalityPickerModal.tsx:17` | `bg-white neo-border neo-shadow rounded-2xl` + 3px `theme.primary` top stripe | `bg-black/50 backdrop-blur-sm` | `z-[200]` |
| M13 | `AiDisclaimerModal.tsx:17` | same as M12 | `bg-black/50 backdrop-blur-sm` | `z-[210]` |
| M14 | `LandingPage.tsx:895` | — (video/demo) | `bg-black/55 backdrop-blur-sm` | `z-50` |

Popovers/menus (not modals, but overlay surfaces):

| # | Surface | Style |
|---|---|---|
| P1 | `SettingsMenu.tsx:98` | `bg-white border-[3px] border-black shadow-[6px_6px…] rounded-xl p-2 w-72` |
| P2 | `DateSelectors.tsx:45,115,170` | `bg-white border border-stone-200 shadow-xl p-4 rounded-lg` — **1px stone + diffuse shadow** |
| P3 | `HabitManagerModal.tsx:628` | `rounded-xl border-2 border-black bg-white p-1.5 shadow-[3px_3px…]` |
| P4 | `DailyCard.tsx:968` | `rounded border border-black bg-white shadow-[3px_3px_0_0_rgba(0,0,0,0.12)]` |
| P5 | `ResolutionsModal.tsx:115` | `bg-black text-white p-4 rounded-sm shadow-xl` — inverted tooltip |

**14 modal variants + 5 overlay variants. Scrim opacity takes 6 values (20/30/40/45/50/55/60%); `backdrop-blur-sm` present on 11 of 14 and absent on 3. z-index takes 9 values with no scale (50, 60, 90, 100, 110, 120, 200, 210).**

### 5.4 Button variants

No shared component; the recurring shapes:

| # | Variant | Representative classes | Example |
|---|---|---|---|
| B1 | **Solid primary (neo)** | `bg-black text-white border-2 border-black text-[11px] font-black uppercase tracking-widest shadow-[3px_3px…] hover:shadow-[1px_1px…] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none` | `FeatureAnnouncementModal.tsx:127` |
| B2 | **Solid primary (flat)** | `bg-black text-white border-2 border-black hover:bg-stone-800` — no shadow, no press | `ListsView.tsx:106`, `Header.tsx:397` |
| B3 | **Outline neo** | `border-2 border-black bg-white text-black hover:bg-stone-50` (+ optional `shadow-[2px_2px…]`) | `FeatureAnnouncementModal.tsx:121`, `ShareCustomizationModal.tsx:207` |
| B4 | **Outline rounded** | `px-4 py-2.5 rounded-xl border-2 border-stone-300 font-black uppercase text-stone-600 hover:border-stone-500` | `AiDisclaimerModal.tsx:40` |
| B5 | **Solid rounded** | `flex-1 py-2.5 rounded-xl border-2 border-black text-white active:translate-x-[1px] active:translate-y-[1px]` | `AiDisclaimerModal.tsx:46` |
| B6 | **Muted outline** | `border-2 border-stone-400 bg-white text-stone-600 text-[9px] hover:border-black` | `JournalPdfPreviewModal.tsx:277,314,366,373` |
| B7 | **Soft ghost** | `p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 border border-transparent hover:border-stone-200` | `Header.tsx:367` |
| B8 | **Icon ghost** | `p-1.5 text-stone-400 hover:text-black hover:bg-stone-100 rounded` | `TasksView.tsx:194`, `ListsView.tsx:236` |
| B9 | **Neo icon button** | `p-2 rounded-lg border-2 border-black bg-white active:translate-x-[0.5px] active:translate-y-[0.5px]` | `Header.tsx:338` |
| B10 | **Destructive outline** | `border-2 border-red-300 text-red-500 hover:border-red-500 hover:bg-red-50` | `ListsView.tsx:258` |
| B11 | **Toggle / segmented** | `border-2` + `bg-black text-white` when active, `border-stone-300 bg-white` when not — ~10 distinct spellings of the same idea | `OnboardingModal.tsx:406,448,454`, `HabitManagerModal.tsx:281,287`, `TasksView.tsx:190` |
| B12 | **Tab** | `border-b-2 border-black -mb-0.5` when active | `FeedbackModal.tsx:867,873` |
| B13 | **Amber-shadow CTA** | `shadow-[3px_3px_0px_0px_rgba(251,191,36,1)]` | `FeatureAnnouncementModal.tsx:127` |
| B14 | **Landing CTA** | `landing-neo-shadow` + `hover:-translate-y-1 hover:shadow-[12px_12px…]` | `LandingPage.tsx:144` |

Press-feedback conventions are all different: `translate-x-[0.5px]`, `[1px]`, `[2px]`, `[3px]`, `-translate-y-0.5`, `hover:-translate-y-1`, `active:shadow-none`, or none.

---

## 6. Modal vs. main-view styling diff

| Axis | Main views (dashboard / weekly / monthly / year) | Modals | Diverges? |
|---|---|---|---|
| **Corner radius** | `rounded-2xl` (16px) near-universally on cards — `DailyCard.tsx:614,821,1014`, `DashboardView.tsx:65,81`, `YearView.tsx` (14×), `InsightsPanel.tsx:32` | **Square (0px) in 10 of 14 modals** (M1–M8, M10). Rounded only in M9 `StreakModal`, M11 `TasksView` sheet, M12/M13 AI modals. | **Yes — the single largest divergence.** The app's cards are rounded; its dialogs are not. |
| **App frame** | `App.tsx:1721` frame is also **square** (`border-[3px]` with no radius) while every card inside it is `rounded-2xl` | — | Yes — square outer frame containing rounded children |
| **Border color/weight** | Mixed: `border-[3px] border-black` (YearView, DashboardView cards), `neo-border` 3px (DailyCard), `border-2 border-black` (TasksView groups), `border border-stone-200` (Header), `border-2 border-stone-200` (InsightsPanel rows) | Consistently `border-[3px] border-black` / `neo-border` for the panel; **but internals drop to 2px** (`border-b-2 border-black` headers in M3/M7, `border-b-[3px]` in M1/M10) | Partially — modal shells are more consistent than main-view cards |
| **Shadow depth** | 3px (YearView, 14×), 4px (YearView month buttons), 6px (`DashboardView` `card` const, `neo-shadow`), none (`InsightsPanel`, `Header` uses `shadow-sm`) | **8px dominant** (M1–M7, M9, M10), 6px (M8), 20%-alpha 8px (M2), none (M11) | Yes — modals sit one to two tiers "higher" but the tiers themselves aren't defined anywhere |
| **Header treatment** | Section headers = `border-b-[3px] border-black pb-3` with icon chip (`DashboardView.tsx:82`), or `border-b-[2px]` (`InsightsPanel.tsx:34`, `AiDisclaimerModal.tsx:20`) | `border-b-2` + `bg-stone-50` (M7, M2), `border-b-[3px]` + `bg-white` (M1, M10), `bg-black text-white` (M4 `ShareCustomizationModal.tsx:56`), `backgroundColor: theme.primary` (M9 `StreakModal.tsx:373`) | Yes — 5 distinct modal header treatments incl. one fully inverted and one theme-tinted |
| **Background** | `bg-white` / `var(--card-bg)` / `var(--card-bg-soft)` / theme-alpha tints | `bg-white` mostly; `#fdfdf8` cream in M10 | Yes — M10 is the only cream modal |
| **Color palette** | Theme-driven (`theme.primary`/`secondary`) + stone greys | Mostly stone greys; **`StreakModal` introduces its own pastel system** (orange-50/amber-50/violet-50 tiles, `border-stone-100`, `rounded-2xl`, `ring-2 ring-black`, 22 unique hexes) that appears nowhere else | Yes — `StreakModal` is effectively a second design language |
| **Dark mode** | Handled globally by `dark-theme.css` utility overrides | Same, **except** M10 `JournalPdfPreviewModal.tsx:164` which branches on `isDarkMode` in JS and sets `backgroundColor` inline | Yes — one modal opts out of the global mechanism |

**Summary of the modal/main-view split:** main views committed to `rounded-2xl` + 3–6px shadows; modals committed to square + 8px shadows. Four modals (M9, M11, M12, M13 — the newest-looking ones: StreakModal, TasksView sheet, and both AI modals) have crossed over to the rounded main-view idiom, so the modal layer is mid-migration with both conventions live.

---

## 7. Information density in repeated lists / grids

| Component | What repeats | Visual hierarchy applied? |
|---|---|---|
| **`DailyCard.tsx:751-790`** habit list | one row per habit | **Minimal.** Every row identical: `text-[12px] sm:text-[13px] font-bold`, same checkbox size, same `py-1.5` (`py-1` in `compact`). Differentiation only by *state* — done ⇒ `text-stone-400 line-through`, inactive ⇒ `text-amber-700`. No grouping, no size/weight variation by streak, goal, or importance. A `cardStyle === 'compact'` toggle is the only density control. |
| **`DailyCard.tsx:914-940`** task list | one row per task | Identical rows: `border p-1.5 rounded neo-shadow-sm`. Editing row gets `ring-2 ring-black`. No priority/date hierarchy. |
| **`MonthlyView.tsx:206-295`** habit × day table | fixed 32px row height, `min-w-[28px]` cells | **Some.** Per-habit 4px left accent bar (`borderLeftColor: habit.color`, line 206); today's column emphasized (`theme.primary + '15'`, `border-[3px] border-black` on header, line 119/233); 100%-complete columns tinted `theme.primary + '20'`; mood row uses the 5-color scale. All *habits* still render at identical weight (`text-sm font-bold text-stone-700`) and identical 32px height. |
| **`YearView.tsx:400-540`** 12-month grid | one tile per month | **Some.** Peak month gets a `PEAK` badge (line 510); negative months tinted `#fee2e2` (line 505); future months greyed `#d6d3d1` (line 531); bar length encodes rate. Tile geometry identical across all 12. |
| **`YearView.tsx:238-400`** stat cards | 14 cards | **None.** All 14 use the same `rounded-2xl border-[3px] shadow-[3px_3px…] p-3 bg-white` — no primary/secondary distinction between headline stats and supporting ones. Only two deviate (`bg-rose-50` at line 384, `theme.secondary + '12'` at 337). |
| **`WeeklyView.tsx:168-195`** summary strip | 4 cells in `grid-cols-[1fr_1fr_1.2fr_auto]` | **Yes — the strongest hierarchy in the app.** Asymmetric column widths, per-cell gradient tint (`to-[#fff7ef]` / `to-[#f6fbf6]` / `to-[#f2f0fb]` / `to-[#fafafa]`), `gap-px` hairline dividers over `bg-black/10`. Also the only place these three tints appear. |
| **`DashboardView.tsx:139-172`** support cards | 3 cards in `md:grid-cols-3` | **None.** Identical `${card} p-4` with `text-[8px] tracking-[0.22em] text-stone-400` label + `text-sm font-black` value. |
| **`InsightsPanel.tsx:70`** insight rows | one row per insight | **Some.** `border-l-4` with a per-insight `meta.accent` color class. Otherwise identical `rounded-lg border-2 border-stone-200 bg-stone-50 p-3`. |
| **`TasksView.tsx:227-260`** date groups | grouped card per date | **Yes — grouping exists.** Each date is its own `rounded-xl border-2 border-black shadow-[3px_3px…]` card with a tinted header (`bg-orange-50` for scheduled, `bg-stone-100` for unscheduled). Rows *within* a group are identical `py-3.5`. |
| **`ListsView.tsx:131`** list items | one row per item | **None.** `flex items-start gap-3 py-3 border-b border-stone-100`; completed ⇒ `opacity-50`. |
| **`StreakModal.tsx:493`** per-habit streak cards | one card per habit | **None.** Identical `bg-stone-50 border-2 border-stone-100 p-4 rounded-2xl`; no ordering emphasis on the longest streak. |
| **`FeedbackModal.tsx:787-800`** feedback list | one row per report | **Some.** Type badge (`bg-rose-100 text-rose-800` bug / `bg-sky-100 text-sky-800` suggestion) + pulsing status dot (`bg-amber-500` awaiting-admin / `bg-red-500`). |

**Pattern:** hierarchy, where present, is encoded almost entirely as **color tint or a left-edge accent bar**, never as size or weight. Row heights and type scales are uniform within every list. `WeeklyView`'s summary strip and `TasksView`'s date grouping are the only two places layout itself carries hierarchy.

---

## 8. Cross-platform divergence

| Axis | Web | Extension | Mobile |
|---|---|---|---|
| Canvas | `#F4F4F0` | `#e5e5e5` | — |
| `.neo-shadow` | **6px** (dark-theme.css wins over index.html's 4px) | **4px** | 4px offset via absolutely-positioned `bg-black` layer (`NeoComponents.js:11-13`) |
| Fonts | Google Fonts CDN | self-hosted `.ttf` × 5 | system |
| Radius values | 16 distinct | 5 distinct (`rounded`, `-full`, `-lg`, `-xl`, `-[12px]`) | 11 distinct (`rounded-xl` 47, `-2xl` 36, `-3xl` 27, `-full` 50, + `borderRadius: 2/6/10/14/28`) |
| Border weights | 1, 2, 2.5, 3, 4, 5 | 2, 2.5, 3 | 2 (58), 2.5, 3 (22), 5 |
| Shared primitives | **none** | none | `NeoCard`, `NeoButton`, `NeoInput` |
| Dominant radius | `rounded-2xl` (16px) | `rounded` (4px) | `rounded-xl`/`2xl`/`3xl` mixed |

Mobile leans much rounder (`rounded-3xl` 27 uses vs 1 on web); the extension leans much squarer (`rounded` 4px, 14 uses, is its dominant radius). The same conceptual card therefore has three different silhouettes across the three clients.

---

## 9. Top Inconsistencies

Ranked by breadth of impact (number of components/pages affected).

| # | Inconsistency | Affected surface | Evidence |
|---|---|---|---|
| **1** | **No token layer at all** — Tailwind is loaded from CDN with no config, so 163 hex values and every radius/shadow/spacing value is an inline literal. 63% of hex values are single-use. | **All 34 web components + 2 pages** | `index.html:34`; absence of `tailwind.config.js`; §1.1 |
| **2** | **Two competing shadow languages, 7 depth tiers, both hand-typed** — 103 inline `shadow-[Npx_Npx_0…]` at 1/2/3/4/6/8/12px vs 71 soft `shadow`/`shadow-sm`/`shadow-xl`; dark mode collapses all hard tiers to one. | **~22 files** | §3.3; `dark-theme.css:126-131` |
| **3** | **Square modals vs rounded cards** — 10 of 14 modals are square; virtually every main-view card is `rounded-2xl`. 4 modals have crossed over, so both conventions are live. | **14 modals vs 12 card variants** | §6, §5.3 |
| **4** | **`.neo-shadow` is defined twice with different values and its "canonical" siblings are barely adopted** — `neo-shadow-lg` has 0 uses; 103 inline shadows bypass the classes the codebase documents as canonical. | **web vs extension globally; 14 files** | `index.html:55` vs `dark-theme.css:59`; §3.4 |
| **5** | **12 card variants for one concept** — 7 shadow depths, 4 border treatments, 4 radii. `DashboardView` even re-declares a local `card` const duplicating `neo-border`+`neo-shadow`. | **12 components** | §5.2 |
| **6** | **247 hand-rolled buttons, ~14 variants, no shared component** — press feedback alone has 7 different implementations. | **26 files** | §5.4 |
| **7** | **Micro-type ladder has 8 steps in a 7px range with literal duplicates** — `text-xs` (93) vs `text-[12px]` (10); `text-[10px]` (241) is the de-facto default; `text-[6px]`/`[7px]` (16) are below accessibility floors. | **all components** | §2.2 |
| **8** | **"Done" has 5 different visual encodings** — black fill, `green-500`, `theme.secondary`, `theme.primary`, opacity change — across DailyCard, MonthlyView, WeeklyView, TasksView, ListsView. | **6 components** | §1.6 |
| **9** | **Mood 5-color scale duplicated verbatim in 7 files** with no shared constant. | **7 files** | §1.6 |
| **10** | **Modal scrim/z-index have no scale** — 6 scrim opacities (20–60%), `backdrop-blur-sm` on 11 of 14, 9 unscaled z-index values (50→210). | **14 modals** | §5.3 |
| **11** | **`StreakModal` is a second design language** — pastel `-50/-200` tiles, `border-stone-100`, `ring-2 ring-black`, `p-6`, and 22 single-use hex values for badge art; shares almost nothing with the rest of the app. | **1 large modal (618 lines)** | §5.2 C7/C8, §1.7 |
| **12** | **Three "heavy border" weights** — `border-2`, `border-[2.5px]`, `border-[3px]` — chosen per component. | **~20 files** | §3.1 |
| **13** | **`Header` and `DateSelectors` use a soft Material idiom** (`border border-stone-200 shadow-sm`/`shadow-xl`, `rounded-lg`) inside an otherwise neo-brutalist shell. | **2 components, 36 buttons** | `Header.tsx:280,324,367`; `DateSelectors.tsx:45,115,170` |
| **14** | **Dark mode is a class-override sheet, not a token swap** — ~45 hard-coded utility selectors with `!important`; any new class is silently un-themed, and `JournalPdfPreviewModal` opts out entirely with a JS branch. | **all components (implicitly)** | `dark-theme.css:116-400`; `JournalPdfPreviewModal.tsx:164` |
| **15** | **Fonts don't match loaded weights** — `font-semibold`(23) + `font-medium`(57) have no loaded Inter face (400/700/900 only); `font-serif` applied at inconsistent semantic levels (two sibling 10px labels in `DashboardView`, one serif one not). | **~10 files** | `index.html:35`; §2.1, §2.3 |
| **16** | **Three canvas colors and 4 near-identical off-whites** (`#fcfcfc`, `#f9f9f9`, `#f0f0f0`, `#f9f2f2` — all collapsed to one dark surface, proving they're interchangeable). | **web vs extension; 5 files** | §1.2 |
| **17** | **Dead / unreferenced design assets** — `COLORS` in `constants.ts` (unused, contradicts `THEMES`), `neo-shadow-lg` (0 uses), `NeoButton` imported but unused in `mobile/src/components/DailyCard.js:11`. ~~`--neo-*` accent tokens (0 uses)~~ — **struck: they are live via the `--landing-neo-*` aliases, 36 uses in `LandingPage.tsx`.** See §1.4. | **3 files** | §1.4, §1.5, §5.1 |
| **18** | **Card padding split `p-5` vs `p-6`** at the same semantic level; half-step spacing (`py-0.5`, `p-0.5`, `py-3.5`) puts the effective grid at 2px not 4px. | **~8 files** | §4 |
| **19** | **Repeated lists carry no size/weight hierarchy** — hierarchy, where it exists, is color-tint or accent-bar only; 14 `YearView` stat cards and 3 `DashboardView` support cards are fully undifferentiated. | **11 list/grid components** | §7 |
| **20** | **Same card has three silhouettes across platforms** — web dominant radius 16px, extension 4px, mobile 12–24px. | **3 clients** | §8 |
