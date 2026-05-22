# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HabiCard** is a multi-platform habit tracker with three implementations sharing the same Supabase backend:
- **Web app** — React/Vite/TypeScript at the repo root (`src/`)
- **Chrome extension** — React/Vite/TypeScript in `chrome-extension/`
- **Mobile app** — React Native/Expo in `mobile/`

## Commands

### Web App
```bash
npm install
npm run dev        # dev server at localhost:3000
npm run build      # production build → dist/
npm run preview    # preview production build
```

### Chrome Extension
```bash
cd chrome-extension
npm install
npm run build      # builds extension into dist/
```

### Mobile App
```bash
cd mobile
npm install
npm start          # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run test       # Jest unit tests
npm run test:watch
npm run build:ios      # EAS cloud build
npm run build:android
npm run submit:ios     # App Store submission
npm run submit:android
```

No ESLint config exists; TypeScript strict mode is the primary quality gate.

## Architecture

### Data Layer (Supabase)
All platforms connect to the same Supabase project. Key tables:
- **habits** — definitions (name, color, goal, frequency, sort_order, archivedAt)
- **habit_completions** — daily/weekly completion records (keyed by `YYYY-MM-DD`)
- **daily_notes** — journal entries, tasks, mood, inactive day markers per date
- **profiles** — user metadata
- **feedback** — bug reports/suggestions with admin replies
- **monthly_goals** — per-month goal lists

RLS policies enforce user isolation on all tables. Migrations live in `database/*.sql`.

### State Management Pattern
Custom hooks (`useHabits`, `useHabitStats`, `useTheme`) fetch from Supabase on mount. No Redux or global state library — everything flows through these hooks and component-local state. Preferences (language, theme, week start, color mode) are persisted in localStorage.

### Habit Frequency Logic (`src/utils/habitActivity.ts`)
Non-obvious: habits can be "due" on only certain days:
- `frequency?: number[]` — array of weekday indices (0–6) for selective daily habits (e.g., weekdays only)
- `weeklyTarget` — integer for "N times per week" habits
- **Inactive days** — dates the user marks as inactive in `daily_notes` are excluded from completion % calculations (important for vacation/illness)

Stats are calculated only over "due" days to avoid false negatives.

### App.tsx
The web app's `src/App.tsx` (~70KB) is a monolithic file containing routing, auth logic, and all view switching. When adding features to the web app, most changes will touch this file.

### Mobile App Variants
`mobile/app.config.js` uses `APP_VARIANT` env var to produce 3 app targets with unique bundle IDs:
- `production` — App Store/Play Store release
- `preview` — internal TestFlight/beta
- `development` — local dev builds

### Auth
- Supabase email/password; session persisted across reloads
- Guest mode: all data stored in localStorage only, no Supabase sync
- Admin impersonation: add `?impersonate=userId` to URL when logged in as admin

### AI Features
Story generation (`src/utils/storyGenerator.ts`) and AI analytics screen (mobile) call the Gemini API. The `VITE_GEMINI_API_KEY` / mobile equivalent must be set for these features to work.

## Environment Variables

**Web/extension** (`.env`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ADMIN_EMAILS=
VITE_GEMINI_API_KEY=   # optional, for AI features
```

**Mobile** (`mobile/.env`, loaded via react-native-dotenv):
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

## Key Conventions

- Completion date keys use `YYYY-MM-DD` format consistently across all platforms.
- Archived habits use soft-delete via `archivedAt` timestamp — they're hidden from UI but retained for historical stats.
- "What's New" feature announcements use date-based keys (e.g., `2026_07`); once seen, stored in localStorage so they don't reappear.
- Mobile wraps the component tree in `AppErrorBoundary` for graceful crash recovery.
- The Chrome extension has a content script (`content.ts`) separate from the popup UI.
