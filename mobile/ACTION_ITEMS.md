# Mobile Action Items

- [x] Port the web app's feedback flow into mobile: add a Feedback modal/screen with `Bug Report` and `Suggestion` submission, feedback history/replies, and the Ko-fi "Buy Me a Coffee" button used in the web feedback modal.

## From device testing — 2026-08-12 — implemented

All three items are implemented (2026-08-12). Code is in place but **not yet exercised on a
device** — UI verification is pending.

### 1. To-Do list opens slowly when there are many tasks — paginated ✅
- [x] Newest-first, windowed loading with fetch-on-scroll.
- What changed:
  - `src/utils/dateKeys.js` (new) — pure `YYYY-MM-DD` helpers + the window math (`NOTES_PAGE_DAYS = 60`).
  - `src/hooks/useDailyNotes.js` — the unbounded `daily_notes` fetch is gone. Loads the local
    cache first (instant paint / offline), then only the newest 60-day window, plus the
    `__backlog__` row and a one-row probe for the oldest date (drives `hasMore`).
    New API: `notesWindow = { startKey, hasMore, isLoadingMore, loadMore, search, isSearching, ensureDate }`.
  - `src/screens/TodoScreen.js` — `ScrollView` → `SectionList`; overdue derivation clamped to
    the window; `onEndReached` + a "Load older tasks" footer.

### 2. Same batching for Logs — done ✅
- [x] Windowed months + fetch-on-scroll + server-side search.
- What changed:
  - `src/screens/MonthlyView.js` — fixed `generateLast30Days` replaced by the shared window;
    both list modes are now `FlatList`s with `onEndReached`; search is debounced (350 ms) and
    calls `notesWindow.search`, which runs a server `ilike` over `content` (limit 200) so
    matches from months that were never paged in still appear. While a query is active the
    list widens from the window to every loaded date.

### 3. AI Coach on mobile — added ✅
- [x] Daily insight + 5 chat messages/day, same model as web.
- What changed:
  - `src/utils/aiCoach.js` (new) — port of the web `aiCoachPrompt.ts` / `aiCoachTools.ts`:
    identical prompts, the same 4 Gemini tools, `computeRichContext`, plus mobile-side
    `computeAnnualContext` / `computeDeltas` (web got these from `useHabitStats`).
  - `src/hooks/useAiCoach.js` (new) — day state in `ai_coach_chats`, quota in AsyncStorage
    (`habicard_ai_<date>`, limit 5, refunded on service errors), disclaimer + daily
    personality gates, the 5-round tool-call loop, errors to `ai_error_logs`.
  - `src/screens/AiCoachScreen.js` (new) — insight bubble + category rows, chat, suggested
    questions, composer pinned at the bottom, disclaimer modal, personality picker, guest lock.
  - Wiring: 5th "Coach" tab in `BottomNav` (tab metrics tighten to fit), `view === 'coach'`
    in `MainScreen`, and a Settings row that toggles `habit_ai_coach_enabled` / opens the coach.

### Known deviations from web
- No DiceBear avatars (would need a remote SVG fetch) — each personality carries an emoji + color.
- The 5/day quota is per-device (AsyncStorage), so mobile and web each get their own 5. The real
  abuse ceiling is still the Edge Function's 60 raw calls/day per user.
- `estimatePossibleDays` intentionally reproduces the web quirk of counting a whole calendar month
  for the current month, so percentages match across platforms rather than being "more correct".
- `ai_error_logs` has no platform column, so mobile contexts are prefixed `mobile:`.

### Tests
- `__tests__/dateKeys.test.js`, `__tests__/aiCoach.test.js` (new) — 40 assertions, passing.
- Pre-existing failures in `__tests__/noteSync.test.js` (2) are unrelated: they still expect the
  old string-shaped `journal`.
