# Mobile Expo App - Missing Items Execution Plan

## Status Legend
- [x] Completed in this pass
- [~] In progress / partially completed
- [ ] Planned next

## Phase 1 - Stability and Trust (now)
- [x] Add global runtime safety layer with an app-level Error Boundary fallback.
- [x] Add sync health tracking (`syncing/synced/error`) to habits + daily notes data pipelines.
- [x] Surface sync health in the top app header so users can see data state.
- [x] Clamp daily percentage math through a shared helper to avoid values > 100%.
- [x] Add baseline unit tests for stats/date logic and percentage clamping.

## Phase 2 - Data Reliability
- [ ] Add retry queue for failed note/habit sync operations (local pending ops + replay on app active).
- [ ] Add stale data guardrails for multi-device conflicts (last-write timestamps + merge strategy).
- [ ] Add explicit "last sync" detail in Settings and manual "Retry Sync" action.

## Phase 3 - Product/Store Readiness
- [ ] Implement Apple subscription flow end-to-end (products, restore purchases, entitlement gate).
- [ ] Add account deletion flow (client action + backend confirmation).
- [ ] Add privacy consent/update messaging in onboarding/settings.

## Phase 4 - QA and Release Operations
- [ ] Add test coverage for onboarding, logout, and daily card interactions.
- [ ] Add pre-release device matrix checklist (small iPhone, large iPhone, Android small/large).
- [ ] Add crash/error reporting SDK integration and release environment tagging.

## Notes from this execution
- Unit tests are now runnable with `npm test`.
- Current test suite validates:
  - month stats createdAt behavior
  - completion key matching
  - safe percentage clamping
