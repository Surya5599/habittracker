# HabiCard Cross-Platform Audit
*Generated: 2026-05-28*

---

## Summary

Three platforms audited: **Web** (`src/`), **Mobile** (`mobile/`), **Chrome Extension** (`chrome-extension/`). All share the same Supabase backend.

---

## SECTION 1: Differences That Should Be the Same

### 1.1 Journal Data Model — CRITICAL BUG

This is the most important finding. The three platforms store journal data differently:

| Platform | `daily_notes.content.journal` type | Format |
|---|---|---|
| **Web** | `JournalEntry[]` (array of objects) | `[{ id, text, mood, timestamp }]` |
| **Mobile** | `JournalEntry[]` (array of objects) | Same as web |
| **Extension** | `string` | Plain text |

**Impact**: If a user writes multiple journal entries on web, then opens the extension and saves a journal entry, the extension will write a plain string, overwriting the array. Next time they open the web app, their multi-entry journal for that day is gone. The extension's `useHabits.ts` hook and `DailyCard.tsx` treat `notes.journal` as a string — this is a live data corruption risk.

**Fix**: Extension's DailyCard and useHabits must handle `journal` as `JournalEntry[]`, same as web and mobile.

---

### 1.2 Language / Localization

| Platform | Languages | i18n Library |
|---|---|---|
| **Web** | 9 (en, es, ja, ko, pt, fr, de, it, zh) | i18next + react-i18next |
| **Mobile** | 9 (same set) | i18next + react-i18next |
| **Extension** | **None — hardcoded English** | None |

The extension has zero language support. Users who configured Spanish or Japanese on the web/mobile see English in the extension with no way to change it.

---

### 1.3 Dark Mode

| Platform | Dark Mode | Storage Key |
|---|---|---|
| **Web** | Yes — `data-color-mode` attribute | `habit_color_mode` |
| **Mobile** | Yes — color mode toggle in settings | `habit_tracker_color_mode` |
| **Extension** | **No dark mode** | N/A |

Extension settings only expose theme + card style. If a user is in dark mode on web/mobile, the extension is always light.

---

### 1.4 Week Start Preference

| Platform | Week Start Setting | Storage Key |
|---|---|---|
| **Web** | Monday / Sunday | `habit_start_of_week` |
| **Mobile** | MON / SUN | `habit_tracker_week_start` |
| **Extension** | **Not implemented** | N/A |

The extension's date picker and day display use a hardcoded week start. Different from what the user configured on the other platforms.

---

### 1.5 Habit Sort Modes

| Platform | Sort Options |
|---|---|
| **Web** | Default, Name, Color, Completion |
| **Mobile** | Default, Name, Color, Completion |
| **Extension** | Default only (no sort control in UI) |

Extension shows habits in whatever order Supabase returns them. Reordering via drag-drop exists in HabitManagerModal, but no sort mode toggle.

---

### 1.6 Settings Panel Parity

Web and mobile have equivalent settings panels. Extension has a minimal SettingsModal with only:
- Theme (13 options) ✓
- Card style (compact/large) ✓

Missing from extension settings vs. web/mobile:
- Language
- Dark/light mode
- Week start
- Sort mode

---

### 1.7 Storage Key Inconsistency — Mobile vs. Web

These same settings use different localStorage keys across platforms, which means they can't share preferences even if a sync layer were added:

| Setting | Web key | Mobile key |
|---|---|---|
| Theme | `habit_theme` | `habit_tracker_theme` |
| Color mode | `habit_color_mode` | `habit_tracker_color_mode` |
| Week start | `habit_start_of_week` | `habit_tracker_week_start` |
| Card style | `habit_card_style` | `habit_card_style` ✓ same |
| Language | `habit_language` | `habit_language` ✓ same |
| Sort mode | `habit_sort_mode` | `habit_sort_mode` ✓ same |

Not a critical bug (each platform manages its own localStorage), but if preferences were ever synced to Supabase `user_metadata`, the inconsistent keys would cause conflicts.

---

## SECTION 2: Missing Features By Platform

### 2.1 Mobile — Missing Features

| Feature | Web Has It | Extension Has It | Notes |
|---|---|---|---|
| **Lists** (reusable checklists) | ✓ Full `useLists` hook + `ListsView` | ✗ | Major feature gap. Lists table exists in DB. |
| **Search** (CMD+K) | ✓ SearchModal | ✗ | No search on mobile at all |
| **PDF Export** | ✓ `exportJournalPdf.ts` | ✗ | Mobile-native share/export could replace this |
| **CSV/Excel Export** | ✓ `exportUserDataCsv.ts` + `exportToExcel.ts` | ✗ | |
| **Monthly Goals / Resolutions** | ✓ ResolutionsModal | ✗ | `monthly_goals` table exists; mobile doesn't use it |
| **Streak / Achievement modal** | ✓ StreakModal (full milestone system) | ✗ | Mobile has 676 LOC BadgesStreaksView but it's **disabled** |
| **Share Card** | ✓ `shareCardGenerator.ts` | ✓ (extension) | Mobile has no share card feature |
| **Feature Announcements** | ✓ FeatureAnnouncementModal | ✗ | Users don't know about new features on mobile |
| **Real AI Analysis** | ✓ `storyGenerator.ts` (local, non-API) | ✗ | Mobile's AIAnalysisView is mock-only with hardcoded cards |
| **Annual / Year View** | ✓ YearView + DashboardView | ✗ | Mobile DashboardView has yearly tab but less visual |
| **Feedback → Admin Reply Thread** | ✓ FeedbackModal with replies | ✗ | Mobile has FeedbackModal but unclear if it shows admin replies |

**Highest-value additions for mobile**: Lists, Monthly Goals, real streak achievements.

---

### 2.2 Chrome Extension — Missing Features

| Feature | Web Has It | Mobile Has It | Notes |
|---|---|---|---|
| **Analytics / Stats** | ✓ Full weekly/monthly/annual | ✓ Full | Extension links to habicard.com instead |
| **Language selection** | ✓ 9 languages | ✓ 9 languages | Extension is English-only |
| **Dark mode** | ✓ | ✓ | Extension is light-only |
| **Monthly Goals** | ✓ ResolutionsModal | ✗ | `monthly_goals` table unused by extension |
| **Search** | ✓ CMD+K | ✗ | No search in extension |
| **Multi-day / Weekly view** | ✓ WeeklyView | ✓ WeeklyView | Extension shows only one day at a time |
| **Keyboard shortcut to open** | N/A | N/A | Extension has no keyboard shortcut defined in manifest |
| **Toolbar badge** (incomplete count) | N/A | N/A | No background SW to update badge count |
| **Browser notifications** | N/A | ✓ expo-notifications | Extension has no notification capability |
| **Export** | ✓ PDF + CSV | ✗ | No export from extension |
| **Habit frequency UI completeness** | ✓ Full | ✓ Full | Extension stores frequency but doesn't show schedule in list view |

---

### 2.3 Web — Missing Features (vs. Mobile)

| Feature | Mobile Has It | Notes |
|---|---|---|
| **Insight Engine** | ✓ `insightEngine.js` | Mobile computes `anchorHabit`, `weakestDay`, `streakFragility`. Web's DashboardView/stats don't have these specific insights. |
| **Push Notifications** | ✓ expo-notifications | Web has no reminder/notification system. Web Push API could implement this. |
| **Error Boundary** | ✓ AppErrorBoundary | Web appears to have no top-level error boundary for crash recovery. |

---

## SECTION 3: To-Delete List

### 3.1 Web App (`src/`)

| File / Item | Type | Reason to Delete |
|---|---|---|
| `src/components/MonthlyTabSurveyModal.tsx` | Component (5.1KB) | Not imported in App.tsx. No state variable opens it. Dead code. |
| `src/components/JournalModal.tsx` | Component (10KB) | Legacy component superseded entirely by DailyCard.tsx's journal section. |
| `src/components/DailyQuote.tsx` | Component (3.3KB) | Imported but no evidence of active use in current view routing. Verify before deleting. |
| `habit_motivation` localStorage key | State variable | Referenced in App.tsx state init but no UI reads or writes it. Dead state. |
| `.tmp-storage*.json` files (root) | Data files | Temporary storage dumps at repo root — not source, not needed. |
| `analytics-dashboard.js` (root) | Admin script | Not part of the app bundle. Useful for admin but shouldn't live in the web app root. Move to `scripts/` or a separate admin repo. |

---

### 3.2 Mobile (`mobile/`)

| File / Item | Type | Reason to Delete |
|---|---|---|
| `mobile/src/screens/DashboardScreen.js` | Screen (46 LOC) | Never imported in App.js or any navigation. Exports only a logout button. Fully superseded by MainScreen. |
| `mobile/src/screens/BadgesStreaksView.js` | Screen (676 LOC) | Explicitly disabled per `todo.md` item #7. Not wired into navigation. 676 lines of dead code. Either ship it or delete it. |
| `mobile/src/screens/AIAnalysisView.js` | Screen (121 LOC) | Mock data only — 2 hardcoded analysis cards. No API calls. 3-per-week counter is implemented but useless with no real analysis. Either wire up Gemini or delete. |
| `mobile/src/utils/uuid.js` | Utility (6 LOC) | `generateUUID()` is never imported anywhere. Habits use `Date.now()` for IDs instead. |
| `mobile/src/components/.HabitManager.js.swp` | Artifact | Vim swap file accidentally committed. Should be `.gitignored`. |
| `mobile/todo.md` | Docs | All 8 items are marked ✅ complete. File has no remaining value. Delete or archive. |

---

### 3.3 Chrome Extension (`chrome-extension/`)

| File / Item | Type | Reason to Delete |
|---|---|---|
| `recharts` (package.json dependency) | NPM package | In `dependencies` but zero imports anywhere in source code. Adds ~450KB to bundle for nothing. `npm uninstall recharts` in the extension dir. |
| `build_output.txt` | Artifact | Stale build error log from a Windows machine (references `D:\` drive). Committed to repo by accident. |
| `habicard-v1.0.0.zip` | Build artifact | Built extension archive checked into the repo. Should be in `.gitignore` and distributed via the Chrome Web Store, not git. |
| `// import { AuthForm }` (App.tsx line 4) | Dead import | Commented-out import. Either use it or remove the line. |

---

## SECTION 4: Additional Notes

### 4.1 The Insight Engine Gap

Mobile's `insightEngine.js` computes three powerful, non-obvious metrics:
- **Anchor Habit** — which habit most predicts a successful day (completion correlates with other completions)
- **Weakest Day** — day of week with lowest average completion
- **Streak Fragility** — how likely a current streak is to break

These are available in mobile's DashboardView but the web app's DashboardView/YearView doesn't expose them. Worth porting `insightEngine.js` → `insightEngine.ts` in `src/utils/` and surfacing in the web Dashboard.

### 4.2 BadgesStreaksView Decision

The mobile `BadgesStreaksView.js` is 676 lines of complete, tier-based achievement UI (Core / Rare / Elite / Legend badges). It was explicitly disabled. This needs a decision: either re-enable it as a feature or delete it. At 676 lines it's too large to just leave as dead code indefinitely.

### 4.3 Extension Bundle Size

The extension's `main.js` is 555KB. `recharts` (~450KB minified) is a dependency that isn't used. Removing it would likely cut the bundle by 40-50%, meaningfully improving extension load time.

### 4.4 Admin Script Location

`analytics-dashboard.js` at the repo root is a Node.js admin tool (DAU, signups, bulk invite). It's useful but out of place. It references `SUPABASE_SERVICE_ROLE_KEY` and calls the admin API. Should live in `scripts/` alongside `scripts/seed-test-account.mjs`.

### 4.5 Mobile Error Boundary Coverage

Mobile wraps the entire app in `AppErrorBoundary`. The web app has no equivalent top-level error boundary. A React error boundary in `src/App.tsx` around `<AppContent>` would prevent blank white screens on unexpected crashes.

---

## Priority Summary

### Fix Now (data integrity)
1. **Extension journal data model** — extension writes `string`, web/mobile write `JournalEntry[]`. Risk of data loss.

### High Value (missing features)
2. **Lists on mobile** — full DB schema exists, just no mobile UI
3. **Monthly goals on mobile** — same, schema exists
4. **Extension dark mode** — table stakes for users who use dark mode elsewhere
5. **Extension language support** — confusing for non-English users

### Clean Up
6. **Delete dead code list** (Section 3) — ~1,500 lines of dead mobile code alone
7. **Remove `recharts` from extension** — easy win, cuts bundle 40-50%
8. **Unify storage keys** — `habit_theme` vs `habit_tracker_theme` inconsistency

### Nice to Have
9. **Insight engine on web** — port mobile's anchor/weakest/fragility metrics
10. **Web error boundary** — parity with mobile crash handling
11. **Mobile share cards** — parity with web and extension
