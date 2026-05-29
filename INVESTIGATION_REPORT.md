# HabiCard — 10-Question Investigation Report
*Generated: 2026-05-28*

---

## Q1 — Conflict Blindness: What actually wins?
**Verdict: Last-write-wins. Silent data loss. No user notification.**

Mobile uses a persisted queue in AsyncStorage (`HABITS_QUEUE_KEY`). When the queue replays on reconnect, it runs:

```js
supabase.from('completions').upsert(
  { user_id, habit_id, date_key },
  { onConflict: 'user_id,habit_id,date_key' }
)
```

This is a pure last-write-wins upsert. If you completed a habit on mobile offline and the web toggled it back before mobile reconnected, whichever Supabase write lands last wins — with zero merge logic, zero timestamp comparison, and zero notification to the user. The queue deduplicates locally (same habit+date keeps only the last queued operation), but it has no awareness of what the server already has.

**The queue does survive app kill** — it replays on next `AppState = 'active'`. So the conflict isn't lost, it's just always last-write-wins when it executes.

**Notes (`mergeNotesByUpdatedAt`)** do have a timestamp-based merge — the note with the later `updatedAt` wins. But completions have no equivalent strategy.

---

## Q2 — Inactive Day Retroactivity: Does the streak change?
**Verdict: Yes on web (streak goes up). Not supported on mobile (ignored).**

On **web**, `useHabitStats.ts` calls `isHabitManuallyInactive(notes, dateKey, habitId)` inside the streak loop and skips that day entirely from the count — as if it never existed. Retroactively marking last Tuesday inactive will immediately add that day to your streak on the next render. A 29-day streak with Tuesday in the middle becomes 30 days. This is the intended behavior but it's nowhere disclosed to users.

On **mobile**, `useHabitStats.js` only checks `isHabitStartedByDate` — it has no call to `isHabitManuallyInactive`. Marking a day inactive on mobile has zero effect on the displayed streak. The same account, same data, shows different streaks on web vs. mobile.

---

## Q3 — AI Analysis: Is the mock disclosed?
**Verdict: No disclosure anywhere. Counter depletes for real. Deceptive.**

`AIAnalysisView.js` renders two hardcoded mock analysis cards with `t('aiAnalysis.mockTitle')` and `t('aiAnalysis.mockContent')` — no "coming soon", no "beta", no "sample" label anywhere in the component.

`useAIAnalysis.js` runs a real `supabase.from('profiles').update({ analysis_count: newCount })` each time the button is tapped. The counter on screen (`2 / 3`, `1 / 3`, `0 / 3`) is backed by real DB writes. When a user hits 0, they are locked out for the week — against a feature that never ran.

A user tapping "Get Analysis" three times sees: a Sparkles icon, a decrementing counter, and two polished analysis cards. There is nothing in the UI that would tell them the analysis is fake. When their weekly limit expires, they'll try again and get the same two hardcoded cards.

---

## Q4 — Lists Adoption: Is anyone measuring it?
**Verdict: Zero feature-level telemetry. Product is completely blind.**

`analytics-dashboard.js` tracks only: total users, DAU (habit completions), dormant users, never-signed-in users, daily signups. That's it.

Searched the entire web and mobile source for: `analytics.track`, `posthog`, `mixpanel`, `amplitude`, `gtag`, `plausible`, `logEvent`. Zero hits on actual event calls — every match is a UI label or i18n key like `"analytics.completion"`.

The Privacy Policy explicitly states: *"We do not run analytics trackers, ad networks, or session recording tools on HabiCard."* That's truthful and intentional.

The consequence: there is no data on whether Lists, PDF Export, AI Analysis, Search, Monthly Goals, or Share Cards are used by 1 user or 1,000. The team can see "40 daily active users" but cannot tell if any of them have ever opened Lists.

---

## Q5 — Guest Sync UX Cliff: What does failure look like?
**Verdict: No loading state. Misleading error. No rollback. Partial sync leaves a broken account.**

`syncGuestToCloud()` is called fire-and-forget:
```ts
syncGuestToCloud(userId, localH, localC).then(() => fetchUserData(userId))
// no await, no loading state, UI doesn't block
```

On failure, the catch block shows:
```ts
toast.error('Sync failed, but your account is ready.')
```

This message is wrong in the most important failure case. The function inserts habits first, then completions. If habits succeed and completions fail (network drop mid-sync), the account has your 5 habits but zero completion history. The toast says the account is ready. The user believes their data is safe.

**localStorage is only cleared on success** (lines 176–177). So if the user logs out and back in as guest, they see the old local data. If they stay logged in, they see the cloud account with missing history. There's no retry button, no "re-sync" option, and no way to know the sync was partial without noticing the missing completions.

---

## Q6 — Three Platforms, Three Mental Models: Confirmed.
**Verdict: No shared "home" concept. Three genuinely different information architectures.**

| | Web | Mobile | Extension |
|---|---|---|---|
| Default view | Weekly grid (7 days) | Today's daily card | Today's daily card |
| Navigation | Header tabs + modal stack | Bottom nav (4 tabs) | No nav — single page |
| Stats surface | Right-side panel, always visible | Analytics tab (separate screen) | None (links to web) |
| Journal access | Click any day card | Flip card on daily view | Inline on daily card |
| Primary action | Toggle habit in grid | Toggle on daily card | Toggle on daily card |

A user who opens web in the morning, extension at work, and mobile at night is operating three distinct interaction models with the same data. There is no design document or shared navigation spec.

---

## Q7 — postMessage Origin Check: Secure or not?
**Verdict: Secure. The concern was valid but the implementation handles it correctly.**

`content.ts`:
```ts
window.addEventListener('message', (event) => {
  if (event.source !== window) return;  // blocks iframe injection
  if (event.data.type === 'HABIT_EXTENSION_LOGIN' && event.data.session) {
    syncSessionToExtension(JSON.stringify(event.data.session));
  }
});
```

`event.source !== window` check correctly rejects messages from iframes or other windows. The `localStorage` watcher is also safe — localStorage is same-origin only, so no cross-domain script can set the Supabase session key.

**The only real attack surface**: a stored XSS vulnerability on habicard.com itself. If an attacker can execute JS on habicard.com, they can post a crafted session. But that's an XSS problem, not an extension architecture problem. The extension is not making this worse.

**This one is fine.**

---

## Q8 — Admin Impersonation: Does it actually work?
**Verdict: Almost certainly broken. Impersonation is frontend-only. Admin likely sees empty data for the target user.**

How impersonation works:
1. `effectiveUserId = impersonateId` (the target user's ID)
2. Supabase queries use `.eq('user_id', effectiveUserId)`
3. But the Supabase client still uses the **admin's auth token**

If `habits` has an RLS policy `WHERE user_id = auth.uid()`, then `auth.uid()` returns the admin's ID — not the impersonated user's. The query returns zero rows. Admin sees an empty app.

If `habits` has **no RLS at all** (the migrations don't define RLS for habits/completions — they were likely created via Supabase UI), then authenticated users can read any row filtered by `.eq('user_id', X)`. In that case impersonation works — but as a side effect of missing RLS, not by design. That's a different problem: any authenticated user could in principle query other users' habits by passing an arbitrary user_id.

Either way, there is no service role key in play, no real auth token swap, and no backend-enforced admin bypass. The feature either silently shows nothing or works by accident of missing RLS.

---

## Q9 — Guest Sync Test Coverage: What's tested?
**Verdict: syncGuestToCloud has zero test coverage. 6 test files total, all covering utilities only.**

Full test inventory across all three platforms:

| File | Tests | What it covers |
|---|---|---|
| `src/test/habitActivity.test.ts` | 19 | Date key formatting, frequency logic, inactive habit detection |
| `src/test/stats.test.ts` | 28 | Completion counting, monthly stats, frequency filters |
| `src/test/JournalPdfPreviewModal.test.tsx` | 16 | Modal render, pagination, search, zoom |
| `mobile/__tests__/authErrors.test.js` | 3 | Benign auth error classification |
| `mobile/__tests__/noteSync.test.js` | 5 | Note normalization, timestamp merge, empty checks |
| `mobile/__tests__/stats.test.js` | 8 | Habit stats with createdAt, completion checks |
| **Extension** | **0** | Nothing |

**Total: 79 test cases. All are unit tests of pure utility functions.**

Not tested anywhere: `syncGuestToCloud`, guest mode initialization, guest-to-cloud migration, auth flows, any Supabase interaction, any cross-platform data contract, the sync queue, or conflict resolution.

---

## Q10 — Cross-Platform Schema Contract: Confirmed corruption path.
**Verdict: Real bug. Extension stores journal as string. Web stores as JournalEntry[]. Produces visible garbage in the UI.**

Type definitions are defined separately per platform with no sharing:

**Web** `src/types.ts`:
```ts
journal?: string | JournalEntry[]  // accepts both (has migration code)
```

**Extension** `chrome-extension/src/types.ts`:
```ts
journal?: string  // only string
```

**Mobile**: array format, same as web.

**Corruption scenario (step by step)**:
1. Extension user types "Good day" → saves `{ journal: "Good day" }` to Supabase
2. Web user fetches same day → `parseJournalEntries()` converts string to `[{ id: '1', text: 'Good day', ... }]`, adds a second entry, saves `{ journal: [{ id: '1', ... }, { id: '2', ... }] }`
3. Extension user fetches same day → `journalDraft = dayData.journal || ''` → journalDraft is now an array object
4. Textarea renders with array value → browser coerces to `"[object Object],[object Object]"`
5. Extension user sees corrupted text. If they save, they write `"[object Object],[object Object]"` as a string back to Supabase, destroying both entries permanently.

**Reverse direction**: Web reads extension's string → `parseJournalEntries()` handles it gracefully (converts to single-entry array). So web is resilient; extension is not.

**Database** stores `content` as `TEXT` with no JSONB schema enforcement — either format passes through silently.

No shared TypeScript types exist. No cross-platform integration tests. No schema validation layer.

---

## Severity Summary

| # | Question | Verdict | Severity |
|---|---|---|---|
| 1 | Conflict blindness | Last-write-wins, silent data loss | **High** |
| 2 | Inactive day retroactivity | Works on web, ignored on mobile | **Medium** (platform inconsistency) |
| 3 | AI Analysis mock disclosure | No disclosure, counter depletes for real | **High** (trust / deception) |
| 4 | Feature analytics | Zero telemetry, flying blind | **Medium** (product visibility) |
| 5 | Guest sync UX cliff | Misleading error, no rollback, partial state possible | **Critical** (data loss) |
| 6 | Three mental models | Confirmed, no shared home concept | **Low** (design debt) |
| 7 | postMessage security | Secure, no vulnerability | **None** |
| 8 | Admin impersonation | Broken or works by accident of missing RLS | **High** (either broken feature or RLS gap) |
| 9 | Guest sync test coverage | Zero coverage on most critical path | **High** (testing gap) |
| 10 | Journal type mismatch | Confirmed corruption: `[object Object]` in textarea | **Critical** (data corruption) |
