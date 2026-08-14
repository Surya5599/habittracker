# UNRESOLVED.md

Literals the token migration left **unchanged** because they don't map cleanly to a
defined token. Nothing here was guessed at. Grouped by batch.

---

## Batch 1 — Shadows (`§M5`, `§R2`, `§R5`)

**33 of 45 remaining occurrences are a single deliberate deferral** (the soft/diffuse
family, group B) — see the reason there before treating this list as a defect count.

### A. Diffuse, inset, directional and tinted shadows — no matching token (19)

The `shadow-neo*` scale is hard-offset, opaque, down-and-right only. None of these fit.

| File:line | Literal | Reason |
|---|---|---|
| `src/components/StreakModal.tsx:317` | `shadow-[0_5px_14px_rgba(15,23,42,0.12)]` | Diffuse slate glow, badge illustration (`§P2`) — not UI chrome |
| `src/components/StreakModal.tsx:319` | `shadow-[0_1px_2px_rgba(15,23,42,0.35)]` | ditto |
| `src/components/StreakModal.tsx:320` | `shadow-[0_1px_2px_rgba(15,23,42,0.35)]` | ditto |
| `src/components/StreakModal.tsx:326` | `shadow-[0_2px_4px_rgba(16,185,129,0.35)]` | Emerald-tinted diffuse; no tinted token but `neo-accent` (amber) |
| `src/components/StreakModal.tsx:333` | `shadow-[0_2px_4px_rgba(0,0,0,0.15)]` | Diffuse, badge illustration |
| `src/components/StreakModal.tsx:336` | `shadow-[0_2px_4px_rgba(0,0,0,0.15)]` | ditto |
| `src/components/StreakModal.tsx:339` | `shadow-[0_2px_4px_rgba(0,0,0,0.15)]` | ditto |
| `src/components/StreakModal.tsx:341` | `shadow-[0_2px_4px_rgba(0,0,0,0.15)]` | ditto |
| `src/components/StreakModal.tsx:574` | `shadow-[inset_0_6px_10px_rgba(255,255,255,0.8)]` | **Inset** highlight; no inset token exists |
| `src/components/StreakModal.tsx:577` | `shadow-[0_8px_14px_rgba(15,23,42,0.14)]` | Diffuse, badge illustration |
| `src/components/StreakModal.tsx:581` | `shadow-[0_10px_18px_rgba(15,23,42,0.12)]` | ditto |
| `src/components/StreakModal.tsx:584` | `shadow-[0_1px_2px_rgba(250,204,21,0.35)]` | Yellow-tinted diffuse; no matching tinted token |
| `src/components/RetroGrid.tsx:95` | `shadow-[0_1px_1px_rgba(0,0,0,0.5)]` | Diffuse; `RetroGrid` is a decorative canvas (`§P7`) |
| `src/components/RetroGrid.tsx:104` | `shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]` | **Inset** highlight |
| `src/components/YearRetroModal.tsx:117` | `shadow-[0_10px_30px_rgba(0,0,0,0.04)]` | Very wide, very faint diffuse — no equivalent tier |
| `src/components/Header.tsx:198` | `shadow-[2px_2px_0px_0px_rgba(234,88,12,0.22)]` | Hard offset but **orange-tinted**; only an amber accent token exists |
| `src/components/FeatureAnnouncementModal.tsx:127` | `hover:shadow-[1px_1px_0px_0px_rgba(251,191,36,1)]` | Amber hover tier. Base (3px) migrated to `shadow-neo-accent`; there is no `neo-accent-sm`, so the hover-shrink would be lost. **Needs a second accent tier.** |
| `chrome-extension/src/components/HabitManagerModal.tsx:137` | `shadow-[4px_4px_0px_0px_gray]` | Named color `gray`, not the black offset — deliberate greyed/disabled look? |
| `chrome-extension/src/components/HabitManagerModal.tsx:137` | `hover:shadow-[2px_2px_0px_0px_gray]` | ditto |

> **Dark-mode interaction to know about:** `dark-theme.css:126-138` still applies
> `box-shadow … !important` to any element whose class list *contains* `shadow-[`.
> `FeatureAnnouncementModal.tsx:127` keeps such a class (its amber hover), so in dark mode
> that element is still driven by the blanket rule rather than by `shadow-neo-accent`.
> Behaviour is unchanged from before this batch; it self-resolves when the amber hover tier
> is added and those rules are deleted per `§M1`.

> `BottomNav.tsx:20`'s `shadow-[0_-6px_0px_0px_rgba(0,0,0,1)]` — hard offset but pointing
> **upward** — was also left. All three tokens are down-right; an upward variant would be a
> new token, not a mapping.

### B. Stock soft-scale classes — target tier is a per-site judgement (26)

`§R5` folds the soft/diffuse family into the hard scale, but `MIGRATION_NOTES.md` gives
the target as *"`shadow-neo-sm` (chrome) or `shadow-neo` (popovers)"* — a per-site
decision, and a **restyle** (diffuse → hard offset) rather than a token substitution.
Per rule 4 these are flagged, not guessed. They still render correctly today because the
config bridge is additive.

| Files | Sites | Suggested tier (for review, not applied) |
|---|---|---|
| `DateSelectors.tsx:45,115,170` (`shadow-xl`) + `:92,147,197` (`shadow-md`) | 6 | `shadow-neo` — these are the popovers `§R5` calls out explicitly |
| `chrome-extension/src/components/DateSelectors.tsx:44` (`xl`), `:104` (`md`) | 2 | `shadow-neo` — same component, extension copy |
| `SettingsMenu.tsx:115,204,211,236,260` | 5 | `shadow-neo-sm` — inline chrome |
| `StreakModal.tsx:443,450` | 2 | `shadow-neo-sm` — inline chrome |
| `SearchModal.tsx:200,231` | 2 | `shadow-neo-sm` |
| `FeedbackModal.tsx:1186,1204` | 2 | `shadow-neo-sm` |
| `LandingPage.tsx:243,561` (`sm`), `:538` (`shadow-inner`) | 3 | `shadow-neo-sm`; **`shadow-inner` has no token at all** |
| `Header.tsx:280` | 1 | ⚠️ The soft card (`§9 #13`, variant C6). Changing it is the visible half of that finding — wants a look, not a sweep. |
| `MonthlyView.tsx:172` | 1 | `shadow-neo-sm` |
| `ResolutionsModal.tsx:115` (`shadow-xl`) | 1 | `shadow-neo` — inverted tooltip |
| `RetroGrid.tsx:81` | 1 | Decorative canvas (`§P7`) — may be out of system entirely |

`shadow-none` / `active:shadow-none` / `hover:shadow-none` (17 sites) were **left as-is
deliberately** — `§M5` keeps them and `shadow-none` is a defined token. Not a defect.

### C. Mobile — deferred wholesale (`§P3`)  *(applies to every batch)*

`mobile/` has 3 shadow usages (`shadow-sm`, `shadow-xl`, and one RN
`shadowColor`/`shadowOffset`/`elevation` triple). React Native cannot read CSS variables,
so mobile needs its own config built from the `tokens` literal export before any of this
applies. `NeoComponents.js` fakes offset shadows with an absolutely-positioned black
`View` rather than a shadow property, so there is no CSS literal to swap.

---

## Batch 2 — Radius (`§M3` radius half, `§R3`)

Every radius literal mapped cleanly, so there are **no unmapped values**. What follows are
two consequences of the mandated `§R3` modal change that need a decision this pass is not
allowed to make.

### A. `rounded-modal` added, but the shell cannot clip its corners (2)

`§R3` mandates 16px on all modal shells. These two shells have no `overflow-hidden`, and
their first child paints a background right up to the top edge — so the new radius will be
**covered by the child** and the corners will still look square. Adding `overflow-hidden`
is a structural change, so it was not made.

| File:line | Shell | Blocking child |
|---|---|---|
| `src/components/ResolutionsModal.tsx:72` | `…shadow-neo-lg rounded-modal w-full max-w-md flex flex-col relative` — no overflow | `:80` `p-6 border-b border-stone-100 bg-stone-50` paints the top corners |
| `src/components/ShareCustomizationModal.tsx:52` | `…shadow-neo-lg rounded-modal … overflow-y-auto` — `overflow-y` does not clip the x axis | `:56` `bg-black text-white p-4` header paints the top corners black |

Checked and **fine** (no action): `HabitManagerModal`, `OnboardingModal`, `SearchModal`,
`YearRetroModal`, `FeedbackModal`, `JournalPdfPreviewModal` all have `overflow-hidden`;
`FeatureAnnouncementModal`'s first child is transparent and its buttons sit inside a padded
wrapper; `App.tsx:1721`'s frame has `p-2 sm:p-3` so no child reaches the corner.

### B. Radius reductions of 8px or more — worth eyeballing (3)

Mapped as `§M3` specifies, but these are the largest silhouette changes in the batch:

| File | Was | Now | Δ |
|---|---|---|---|
| `src/App.tsx` | `rounded-[30px]` on the main content container | `rounded-2xl` (16px) | **−14px** — the most visible single change in this batch |
| `src/components/StreakModal.tsx` | `rounded-[28px]` | `rounded-2xl` (16px) | −12px |
| `src/pages/LandingPage.tsx` | `rounded-3xl` (24px) | `rounded-2xl` (16px) | −8px |

### C. Mobile radius — deferred with the rest of mobile (`§P3`)

Still literal in `mobile/src`: `rounded-[28px]` ×1, `rounded-[22px]` ×1, plus inline RN
`borderRadius: 2 / 6 / 10 / 14 / 28`. Untouched — mobile has no config and cannot read the
token layer.

---

## Batch 3 — Border width (`§M3` border half, `§9 #12`)

### A. Spinner-ring stroke widths — not borders (2)

`§M3` says `border-[5px] → border-4`, but that instruction assumed the value was a
decorative border in mobile only. It isn't: both remaining outliers are the **stroke of a
circular spinner**, where the width *is* the ring thickness. Narrowing them changes the
spinner's weight, so they were left alone rather than forced onto the 1/2/3/4 scale.

| File:line | Literal | Element |
|---|---|---|
| `src/components/OnboardingModal.tsx:577` | `border-[6px]` | `w-14 h-14 rounded-full border-[6px] border-black border-t-transparent` — spinner |
| `src/components/SettingsMenu.tsx:268` | `border-[5px]` | `w-12 h-12 rounded-full border-[5px] border-stone-200 border-…` — spinner |

Options for review: add a `stroke` scale to the config, keep them as documented arbitrary
exceptions, or replace both with a real spinner component. `mobile/src/components/
OnboardingModal.js:393` has the same `border-[5px]` ring, deferred with mobile (`§P3`).

### B. A test was coupled to a class literal (fixed)

`src/test/JournalPdfPreviewModal.test.tsx:121` selected the modal top bar with
`querySelector('.border-b-\[3px\]')`. The rename to `border-b-3` broke it — the selector
returned `null`, the click never fired, and the assertion failed. Updated to
`.border-b-3`; 49/49 pass again. **No other test couples to a token class** (checked:
only `.fixed.inset-0`, `button:last-child` and `svg` remain, none of which any batch
touches). Worth knowing for the colour and spacing batches.

---

## Batch 4a — Colour: surfaces, borders, text (`§M2`)

**1469 exact-value renames applied across 41 files** (light mode pixel-identical).
What follows is everything left, and why. Three items are **blockers needing a decision**
before the colour work can finish.

### ⚠️ BLOCKER 1 — `bg-black` / `bg-stone-800` have no safe token (117 sites)

`§M2` maps these to `bg-ink-strong`. **That would be a bug.** `--ink-strong` is a *text*
colour and in dark mode it is `#eeeeee`; combined with `text-white`/`text-ink-inverse` it
gives near-white text on a near-white background — invisible buttons. `dark-theme.css:228`
currently maps `.bg-black` to `#111111`, which has no equivalent in the token set.

*Needs:* a `surface-inverse` token (`#000000` light / `#111111` dark, matching the existing
override). Then `bg-black` → `bg-surface-inverse` is exact in both modes.
Affected: `bg-black` 104, `bg-stone-800` 13.

### ⚠️ BLOCKER 2 — the opacity modifier does not work on these tokens (89 sites)

The tokens are plain `var(--x)` values. Tailwind's `/opacity` modifier requires an
`<alpha-value>` placeholder, so `bg-surface/20` emits broken CSS. Every site carrying a
modifier was therefore **skipped**, which leaves two names for one colour
(`bg-surface` and `bg-white/20` side by side).

*Recommended fix* — keeps `tokens.css` unchanged (vars stay hex) and needs no channel
splitting, so the v4 mirror and the mobile literal export are unaffected:

```js
surface: 'color-mix(in srgb, var(--surface) calc(<alpha-value> * 100%), transparent)'
```

Tailwind substitutes `1` when no modifier is present, so unmodified usage is unchanged.
Affected: `bg-black/*` 25, `bg-white/*` 19, `text-white/*` 19, `border-black/*` 9,
`bg-stone-50/*` 8, `border-white/*` 6, `border-stone-100/*` 2, others 1.

### ⚠️ BLOCKER 3 — theme-derived tokens are still inert (`§R1`, prerequisite 3)

Nothing writes `--theme-primary` / `--theme-secondary` at runtime — `useTheme.ts` only
persists to `localStorage`. So `var(--theme-primary)` is pinned to preset 1 (Sage & Rose)
for all users. Until a `useTheme` effect mirrors the active preset onto
`document.documentElement`, **`bg-done`, `bg-complete` and every `theme-*` tint are unusable**
— adopting them would silently break theme switching for all 13 presets.

Consequently `§R1` (the "done" re-encoding) was **not started**. `done`/`complete`/`theme-*`
are also deliberately absent from the `index.html` bridge so they cannot be used by accident.
Both `src/hooks/useTheme.ts` and `chrome-extension/src/hooks/useTheme.ts` need the same fix.

### A. Mood scale — not migratable as a token swap (`§9 #9`, 6 files)

`§M2` assumed these were CSS-context values. They are not: the 5 hexes live in JS config
objects whose consumers mostly cannot resolve `var()`.

| Consumer | Site | Why `var()` fails |
|---|---|---|
| lucide `color` prop | `DailyCard.tsx:532` | becomes the SVG `stroke` **attribute**; `var()` is invalid in presentation attributes |
| SVG `fill` attribute | `LandingPage.tsx:524` | same |
| **hex-alpha concatenation** | `DailyCard.tsx:1092` | `m.color + '18'` — `'var(--mood-1)' + '18'` is garbage |
| PDF/HTML string | `exportJournalPdf.ts:53-61` | detached document; vars out of scope |
| canvas 2D | `shareCardGenerator.ts` | `ctx.fillStyle` cannot parse `var()` |

`var()` *would* work at `MonthlyView.tsx:173`, `DailyCard.tsx:1093` and `RetroGrid.tsx:93`
(inline `style`), but migrating only those leaves the same scale expressed two ways — worse
than leaving it whole. **Left entirely untouched.**

*Needs:* the `moodScale` JS import that `§M2` calls for (a small refactor: add imports,
and replace `m.color + '18'` with a real alpha helper), plus `--mood-N-tint` tokens for the
five background tints, which are also duplicated **and already inconsistent** — mood 3 is
`#fef9c3` in `App.tsx:2611` but `#fef3c7` in `exportJournalPdf.ts:57`.

**Audit correction:** the mood scale is in **6** files, not 7. `ListsView.tsx:6` is a
*list-colour swatch palette* that happens to share three hexes and then diverges
(`#22c55e`, `#06b6d4`). It is not the mood scale and must not be tokenised as one.

### B. Value-changing tiers — deferred to 4b (774 sites)

These map cleanly per `§M2` but each shifts its light-mode value, so they belong in a batch
that gets its own visual pass rather than riding along with exact renames:

| Class | Sites | Light-mode delta |
|---|---|---|
| `text-black` | 186 | `#000000` → `#1c1917` |
| `text-white` | 160 | → `--ink-inverse` (dark mode `#ffffff` → `#eeeeee`) |
| `text-stone-600` | 77 | `#57534e` → `#444444` |
| `text-stone-700` | 66 | `#44403c` → `#444444` (near-exact) |
| `text-stone-800` | 59 | `#292524` → `#1c1917` |
| `border-stone-300` | 27 | `#d6d3d1` → `#a8a29e` — **noticeably darker** |
| `text-stone-900` | 24 | `#1c1917` exact (grouped here only for consistency) |
| `gray-*` family | 48 | warm stone → neutral gray is a **hue change** |
| `bg-stone-300/400/500` | 6 | no token in the ramp |
| `divide-black` | 4 | → `divide-edge-strong` |

### C. Status semantics — needs per-site judgement, not a sweep

`§M2` maps `text-rose-*`/`bg-rose-*` to `missed`. **Wrong in at least one place:**
`FeedbackModal.tsx:792` uses `bg-rose-100 text-rose-800` for the *"bug" report-type badge*
and `bg-sky-100 text-sky-800` for "suggestion" — categorical, not "a missed habit". Amber is
similarly overloaded across four distinct roles (hint, needs-attention, inactive day,
awaiting-admin). Mapping these needs a per-site read of intent, so no status colour was
migrated in this batch.

---

## Batch 5 — Spacing (`§M9`, `§R4`)

**54 replacements across 23 files.** No enabling change was needed — every target is a
stock scale step, so no bridge entry was added.

Applied: `py-0.5`→`py-1` (30), `p-0.5`→`p-1` (6), `px-0.5`→`px-1` (1), `pl-0.5`→`pl-1` (1),
`pr-0.5`→`pr-1` (1), `py-3.5`→`py-3` (2), and `§R4`'s `p-5`→`p-6` (13).

`pl-0.5` / `pr-0.5` were not named in `§M9` but are the identical 2px-off-grid case with the
identical rule, so they were folded in rather than left as stragglers.

### A. The semantic aliases were deliberately NOT applied (196 sites)

`§M9` maps `p-4`→`p-card`, `p-3`→`p-gutter`, `p-6`→`p-card-lg`. Applying those as a sweep
would be a **mislabel, not a migration**: `p-4` (69 sites) and `p-3` (93) are used on buttons,
list rows, popovers, table cells and generic wrappers as well as cards. Renaming every one to
`p-card` asserts "this element is a card" where it often isn't, and the pixel value is
already correct either way — so the rename buys nothing and loses information.

`p-card` / `p-card-lg` / `p-gutter` therefore stay defined-but-unused, available for
deliberate use as components are touched. `§R4`'s actual conflict (20px vs 24px) is resolved
on value: all 13 `p-5` sites are now `p-6`, so the roomy tier is a single 24px across
`DashboardView` (4), `LandingPage` (3), `ListsView` (2), `YearView` (2), `StreakModal`,
`TasksView`.

### B. Half-steps outside `§M9`'s padding scope (267 sites)

`§M9` only covered padding, but the same 2px grid persists elsewhere. Not touched, because
`§9 #18`'s finding was scoped to padding and two of these categories should *not* be rounded:

| Utility | Sites | Note |
|---|---|---|
| `gap-1.5` | 78 | flex/grid gaps |
| `mt-0.5` / `mb-0.5` / `ml-0.5` | 39 | margins |
| `translate-y-0.5` / `translate-x-0.5` (incl. `hover:`/`active:`) | 39 | ⚠️ **button press-feedback offsets, not spacing** — rounding to 1 (4px) would double the travel and make every press feel loose |
| `h-1.5` / `w-1.5` / `h-2.5` / `w-2.5` / `h-0.5` | 46 | ⚠️ **element dimensions** (dots, bars, rails) — not on the spacing grid at all |
| `space-y-1.5` / `space-y-0.5` | 13 | stack rhythm |
| `top-1.5` / other inset | ~5 | positioning |

`px-1.5` (13), `py-1.5` (37), `p-1.5` (30), `py-2.5` (21), `px-2.5` (10), `p-2.5` (9) are
**kept** as `§M9` specifies — on the stock scale and in heavy use.

### C. Arbitrary padding values — layout-specific, no token applies (5)

`pr-[50%]`, `pr-[52%]` (`LandingPage` two-column split), `pt-[15vh]`
(`SearchModal` drop position), `pt-[max(env(safe-area-inset-top),0.5rem)]` (iOS safe area),
`pb-[2px]`. None express a spacing step; all are layout arithmetic. Left as-is.

---

## Batch 6 — the three blockers, RESOLVED

All three items flagged in batch 4a are fixed. Batch 4a's blocker entries are superseded.

### ✅ Blocker 1 — `surface-inverse` token added; `bg-black` migrated (104 sites)

`--surface-inverse` is now defined in `tokens.css`: `#000000` light, `#111111` dark. Both
values are exactly what renders today (the dark value is lifted from `dark-theme.css:228`),
so this is **recording an existing value, not inventing one** — the migration is exact in
both colour modes.

Declared in all four surfaces (`tokens.css`, `tailwind.config.js`, the `index.html` bridge,
`tailwind-v4-theme.css` + the extension's `@theme`) and applied to all 104 plain `bg-black`
sites across 32 files.

**Still deferred:** `bg-stone-800` (13 sites, `#292524`). `§M2` grouped it with `bg-black`,
but it is a different colour and `dark-theme.css` never overrode it — mapping it to
`#000000` is a real value change, so it belongs in colour batch 4b.

### ✅ Blocker 2 — colours are now alpha-capable (v3 only)

`tailwind.config.js` and the `index.html` bridge wrap every colour token in

```js
const alpha = (v) => `color-mix(in srgb, var(${v}) calc(<alpha-value> * 100%), transparent)`;
```

35 values wrapped in the config, 31 in the bridge. The already-alpha'd `--theme-*-faint/soft/
strong` tints are deliberately left unwrapped to avoid nesting `color-mix`.

**Verified empirically, not assumed** — compiled against real `tailwindcss@3`:

| Class | Emitted |
|---|---|
| `bg-surface` | `color-mix(in srgb, var(--surface) calc(var(--tw-bg-opacity,1) * 100%), transparent)` |
| `bg-surface-inverse/50` | `color-mix(in srgb, var(--surface-inverse) calc(0.5 * 100%), transparent)` |
| *(before the fix)* `bg-plainvar/20` | **no rule emitted at all** — confirming the silent-drop diagnosis |

**v4 needs no change.** Verified with `@tailwindcss/cli@4`: it applies modifiers natively as
`color-mix(in oklab, …)` behind an `@supports` guard. So the extension keeps plain `var()`
values and `tailwind-v4-theme.css` is unchanged.

The 89 `/opacity` sites are now *technically* migratable, but were **not** migrated here —
25 of them are `bg-black/20…60` modal scrims that `§M8` consolidates to `bg-scrim`, and
routing them through `--surface-inverse` would also lighten the dark scrim (`dark-theme.css`
forces `.85` today). They belong in the scrim batch.

### ✅ Blocker 3 — `useTheme` now mirrors the preset onto CSS vars

Both `src/hooks/useTheme.ts` and `chrome-extension/src/hooks/useTheme.ts` gained one
effect writing `--theme-primary` / `--theme-secondary` to `document.documentElement`.
Purely additive — no existing behaviour changes, and confirmed present in the built bundle.

`var(--theme-primary)` now tracks the user's choice across all 13 presets, so `theme-*`,
`done` and `complete` are live. `done`/`complete`/`theme-*` are still absent from the
`index.html` bridge on purpose: `§R1` is a **visible design change** (the `DailyCard`
checkbox goes black → theme-secondary) and should be approved rather than swept in.

### Verification note — a silent no-op I caught

`index.html` is **CRLF**; `tailwind.config.js` and `tokens.css` are LF. One multi-line
scripted replace against `index.html` matched on `\n` and silently did nothing, which left
`surface.inverse` out of the web bridge while 104 components already referenced
`bg-surface-inverse` — those would have rendered with **no background at all**. Found by
grepping the built output for the token rather than trusting the script's success message,
then fixed and re-audited: all 14 tokens used in components are present in the bridge.
Component-level replacements were all single-line and therefore unaffected.

---

## Batch 7 — scrims, z-index, colour 4b, §R1, mood refactor

Four items applied: **20 scrims, 15 z-index, 712 colour, 5 `§R1` sites, 45 mood hexes.**

### A. `z-50` deliberately NOT named (§M8)

`§M8` maps `z-50` → `z-nav`. Left alone: `z-50` is doing **double duty** — nav chrome
(`BottomNav`, `SettingsMenu`, `DateSelectors` popovers) *and* four modal shells
(`HabitManagerModal`, `OnboardingModal`, `SearchModal`, `LandingPage`'s video modal). Naming
it `z-nav` mislabels the modals; naming it `z-modal` would change its value from 50 to 100
and promote those four above `z-dropdown`/`z-overlay`, altering real stacking order.

All seven **arbitrary** values migrated 1:1 with values unchanged, so stacking is preserved
exactly. Fixing `z-50` means deciding whether those four modals *should* sit below
`ShareCustomizationModal` (60) and `YearRetroModal` (90) — a behaviour question, not a token one.

### B. Scrim consolidation — 8 opacities collapsed to one

Only lines that are genuinely an overlay (`fixed inset-0`) were converted, so these were
correctly left alone:

| Site | Class | Why it is not a scrim |
|---|---|---|
| `OnboardingModal.tsx:584` | `bg-black/80` | a **bar-chart fill** (`flex-1` with `height: h%`) |
| `DailyCard.tsx:274,751` | `hover:bg-black/5` | row hover overlay |
| `StreakModal.tsx:385` | `hover:bg-black/10` | icon-button hover |
| `WeeklyView.tsx:168` | `bg-black/10` | grid hairline backing |

⚠️ **Visible change:** scrim opacity was 20/30/35/40/45/50/55/60% and is now a single 50%
light / 75% dark. `ResolutionsModal` (was 20%) gets notably darker; `FeatureAnnouncementModal`
and `JournalPdfPreviewModal` (were 60%) get lighter. Dark mode also moves from
`rgba(20,20,20,.85)` to `rgba(0,0,0,.75)`.

The 4 hover overlays keep `bg-black/NN`, so `dark-theme.css`'s `[class*='bg-black/']` rule
still forces them to `rgba(20,20,20,.85)` in dark — i.e. a "5%" hover renders at 85%. That is
a **pre-existing bug**, now isolated to 4 sites; fixing it is a behaviour change, not a rename.

### C. `§R1` applied — 5 sites (⚠️ REVIEW THIS FIRST)

| Site | Was | Now |
|---|---|---|
| `DailyCard.tsx:771` habit checkbox | `bg-surface-inverse text-ink-inverse` | `bg-done text-ink-strong` |
| `DailyCard.tsx:929` task checkbox | `bg-green-500 border-green-600` | `bg-done border-done` — removes the **only green in the app** |
| `MonthlyView.tsx:280` | `theme.secondary` | `var(--status-done)` |
| `MonthlyView.tsx:233` | `theme.primary + '15'` / `+ '20'` | `var(--theme-primary-faint)` / `var(--status-complete-tint)` |
| `WeeklyView.tsx:190` | `theme.primary` / `theme.secondary` | `var(--status-complete)` / `var(--status-done)` |

`DailyCard.tsx:771` is the app's most-used control and it changes from a black fill to the
theme's secondary pastel. **This is the one change in the whole migration most likely to want
reverting** — it is isolated to these 5 edits.

`theme.primary/secondary + 'NN'` remains at **17 further sites** not enumerated by `§R1`
(e.g. `MonthlyView.tsx:109` `+'40'` = 25% → `theme-secondary-strong` would be exact;
`:121` `+'30'` = 19% has no exact token, sitting between `soft` 12% and `strong` 25%).

### D. Mood scale — now single-source (45 hexes across 6 files)

`MOOD_SCALE` / `MOOD_TINTS` added to `src/constants.ts` as **plain hex arrays**, because the
consumers cannot resolve CSS variables (SVG attributes, `ctx.fillStyle`, PDF string, and
`MOOD_SCALE[i] + '18'` hex-alpha concatenation — which keeps working unchanged with hex).

Literal mood hexes now appear only in: `constants.ts` (the source), `ListsView.tsx`
(`PRESET_COLORS` swatches — correctly untouched), and `WhatsNewPreviews.tsx` (mock habit
colours + a badge, not the mood scale).

⚠️ `exportJournalPdf.ts` mood-3 tint changes `#fef3c7` → `#fef9c3` (yellow-100), unifying the
disagreement noted in `DESIGN_SYSTEM.md §1.6`. **PDF output shifts very slightly.**

### E. Still on the stock palette — 34 stone + 5 misc (no token exists)

| Class | Sites | Why |
|---|---|---|
| `bg-stone-800` | 13 | `#292524` — not `#000`, and never dark-overridden, so `surface-inverse` is a value change |
| `border-stone-500` / `-600` | 9 | between `edge-muted` (#a8a29e) and `edge-strong` (#000) |
| `bg-stone-300` / `-400` / `-500` / `-900` / `-950` | 9 | dark mode maps 300/400 to bespoke `#181818`/`#202020`; no ramp equivalent |
| `ring-stone-200` / `-300` | 2 | only `ring` (black) is tokenised |
| `text-stone-200` | 1 | lighter than `ink-dim` |
| `border-white/*` | 6 | inverse border on coloured headers; no token |
| `shadow-[…]` | 20 | batch 1 §A — diffuse/inset/tinted |
| `border-[5px]` / `[6px]` | 2 | batch 3 §A — spinner rings |

---

## Batch 8 — closing the token gaps + pruning dead overrides

**55 replacements + 24 dead CSS rules removed.** `stone-*`, `gray-*` and raw
`white`/`black` classes are now at **zero**.

### Three tokens added, each covering a real cluster

Inspecting the leftovers showed they were not one-offs but **states of tokens that already
existed**:

| Token | Light / dark | Replaces | Why |
|---|---|---|---|
| `--surface-inverse-hover` | `#292524` / `#222222` | `hover:bg-stone-800` (13) | Always paired with `bg-black` — it *is* that button's hover. Dark steps **up** the ramp because `#111111` must lighten on hover. |
| `--border-hover` | `#78716c` / `rgba(255,255,255,.22)` | `hover:border-stone-500` (5), `focus:border-stone-600` (4) | Both were the hover of `border-stone-400`; two values collapse to one step. |
| `--surface-sunken` | `#d6d3d1` / `#181818` | `bg-stone-300` (4) | Progress-dot track + PDF preview backdrop. Dark value is the bespoke one `dark-theme.css` already used. |

Exact matches needing no new token: `bg-stone-400`→`bg-edge-muted`, `bg-stone-500`→
`bg-ink-muted`, `ring-stone-200`→`ring-edge` (all pixel-identical). Near matches, documented:
`bg-stone-900`/`950`→`bg-surface-inverse`, `ring-stone-300`→`ring-edge`,
`text-stone-200`→`text-ink-dim`, `border-white/*`→`border-ink-inverse/*`.

### Theme hex-alpha concatenation — 14 of 17 migrated

The misleading `theme.primary + 'NN'` idiom is nearly gone. True alphas vs the three steps
(`faint` 8%, `soft` 12%, `strong` 25%):

| Suffix | Real alpha | → | Shift |
|---|---|---|---|
| `'12'` | 7.1% | `-faint` | +0.9pp |
| `'18'` (7 sites) | 9.4% | `-faint` | −1.4pp |
| `'20'` | 12.5% | `-soft` | −0.5pp |
| `'25'` | 14.5% | `-soft` | −2.5pp |
| `'30'` | 18.8% | `-strong` | +6.2pp |
| `'40'` | 25.1% | `-strong` | exact |

**3 left:** `theme.primary + '60'`, `theme.secondary + '60'` (37.6%) and
`theme.secondary + 'aa'` (66.7%) are far beyond `strong` (25%). A 4th step for 2 sites would
be bloat, so they stay — `App.tsx:2398,2399`, `DailyCard.tsx:1175`.

### `dark-theme.css` — 24 dead rules removed, `!important` count 47 → 23

`§9 #14`'s real payoff. Every deleted rule was verified to have **no matching class left in
`src/`**, so removal is a no-op by construction. The file shrank 12.9 KB → 8.7 KB, braces
balanced, both builds and all 49 tests still pass.

Five partially-dead groups were **trimmed** rather than deleted (e.g. `.bg-stone-50, .bg-amber-50, …`
kept the amber/rose/sky/green selectors and dropped only `.bg-stone-50`).

⚠️ **An audit bug I caught:** my first liveness pass glued `:hover` pseudo-classes onto class
names, marking `.hover\:bg-red-50:hover` dead. Red was never migrated — that rule is **live**
and was kept. Re-tested every ambiguous selector with the pseudo stripped before deleting.

**Rules deliberately kept:**

| Rule | Why |
|---|---|
| `[class*='shadow-[']` + the 2 variants | 20 arbitrary shadows remain (batch 1 §A) |
| `[class*='bg-black/']` | the 5 remaining hover/chart `bg-black/NN` |
| amber / rose / sky / green / orange / purple | status colours never migrated (batch 4a §C) |
| `.bg-[#e5e5e5]`, `[style*='fdfdf8']` | extension canvas + inline PDF styles |
| `input`/`textarea`/`::placeholder`/scrollbars | element selectors, not classes |
| `.hover\:bg-red-50:hover` | **live** — see the audit bug above |
| `.my-habits-button` | dead, but a bespoke class rather than a utility — left as-is (4 lines) |

### Final state

`stone-*` 0 · `gray-*` 0 · raw `white`/`black` 0 · arbitrary radius 0 · arbitrary z-index 0.
Remaining by design: 20 diffuse/inset shadows, 2 spinner-ring border widths, 5 `bg-black/NN`
(4 hover overlays + 1 chart fill), 3 heavy theme alphas, 11 mood hexes (the `constants.ts`
source plus `ListsView` swatches and `WhatsNewPreviews` mock data).

---

## Batch 8b — a wrong claim in my own audit, corrected

While verifying that every inline `var()` resolves, six came back **undefined**:
`--landing-neo-green/-yellow/-pink/-blue/-orange/-bg`.

`DESIGN_SYSTEM.md §1.4` recorded the `--neo-*` palette as "defined … and **not referenced by
any component**", and `§9 #17` listed it under "dead / unreferenced design assets". Both were
wrong. The original check grepped the `--neo-*` names and **never the `--landing-neo-*`
aliases**, which `LandingPage.tsx` uses **36 times**:

| Alias | Uses | Form |
|---|---|---|
| `--landing-neo-green` | 15 | `text-[var(…)]`, inline `style` |
| `--landing-neo-yellow` | 8 | arbitrary class + inline |
| `--landing-neo-pink` | 7 | `bg-[var(…)]` |
| `--landing-neo-blue` | 4 | `text-[var(…)]` |
| `--landing-neo-orange` | 1 | `text-[var(…)]` |
| `--landing-neo-bg` | 1 | `bg-[var(--landing-neo-bg)]` on the page root |

**Nothing was broken at any point** — `dark-theme.css:22-35` still defined them. But
`§M1` instructs deleting that block "once `§M2` is complete", and doing so would have
silently blanked 36 landing-page colours, including the page background. A latent trap.

**Fixed:** the palette and its aliases now live in `tokens.css` inside `:root` (values
verbatim from `dark-theme.css`), verified present in both the web and extension builds. The
aliases were kept rather than renamed — renaming means editing `LandingPage.tsx` markup, which
is outside a token-only pass. `DESIGN_SYSTEM.md §1.4`/`§9 #17` and `MIGRATION_NOTES §M1` now
carry the correction.

Genuinely dead and confirmed by grep: `--neo-bg` (folded into `--canvas`; `--landing-neo-bg`
aliases it) and the `.landing-neo-shadow`/`-sm` **classes** (0 uses after the shadow batch).

⚠️ **Process note.** I made this claim in the original audit without grepping for it, and it
survived six batches. Two other unverified assumptions were caught the same way — `grep -P`
silently returning nothing, and a CRLF multi-line replace silently no-op'ing. In all three
cases the check that caught it was *verifying the built output*, not trusting a script's
success message.
