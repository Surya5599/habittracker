# HabiCard App Store Release Checklist

Use this checklist for publishing the Expo/EAS mobile app to the Apple App Store.

## Project Config

- [x] Confirm production app name is `HabiCard`
- [x] Confirm production slug is `habicard`
- [x] Confirm production scheme is `habicard`
- [x] Confirm production iOS bundle ID is `com.suryasingh.habicard`
- [x] Confirm production Android package name is `com.suryasingh.habicard`
- [x] Confirm preview bundle ID is `com.suryasingh.habicard.preview`
- [x] Confirm dev bundle ID is `com.suryasingh.habicard.dev`
- [x] Confirm `version` in `app.config.js` is ready for release
- [x] Confirm iOS `buildNumber` is ready for release
- [x] Confirm `ITSAppUsesNonExemptEncryption: false` is accurate
- [x] Confirm production `.env` has the required Supabase keys before building
- [x] Confirm app icon exists at `assets/icon.png`
- [x] Confirm splash image exists at `assets/splash-icon.png`
- [x] Confirm adaptive icon exists at `assets/adaptive-icon.png`
- [x] Decide whether `supportsTablet: true` should stay enabled (disabled — iPhone only)

## Apple Developer Setup

- [x] Enroll in the Apple Developer Program
- [x] Sign in to App Store Connect
- [x] Accept any pending Apple agreements
- [x] Complete tax and banking forms if HabiCard will be paid or use purchases
- [x] Create the App Store Connect app record
- [x] Use bundle ID `com.suryasingh.habicard`
- [x] Set app name to `HabiCard`
- [x] Set primary language
- [x] Set SKU
- [x] Set app category
- [x] Choose app availability countries or regions

## Code And Build Readiness

- [x] Dynamic Expo config resolves successfully with production values
- [x] Static `app.json` removed so `app.config.js` is the single source of truth
- [x] `expo-notifications` package installed for the configured native plugin
- [x] `react-native-worklets` installed for `react-native-reanimated`
- [x] Expo SDK dependencies aligned with SDK 54
- [x] `npx expo install --check` reports dependencies are up to date
- [x] `npx expo-doctor` passes all 17 checks under Node 24
- [x] Jest suite passes: 3 suites, 11 tests
- [ ] Run a production EAS iOS cloud build
- [ ] Install the production/TestFlight build on a real iPhone

## Product Readiness

- [ ] Test install on a real iPhone
- [ ] Test account creation
- [ ] Test login
- [ ] Test password reset
- [ ] Test onboarding
- [ ] Test habit creation
- [ ] Test habit editing
- [ ] Test habit deletion
- [ ] Test daily logging
- [ ] Test notes or journal entries
- [ ] Test streaks
- [ ] Test weekly view
- [ ] Test monthly view
- [ ] Test yearly view
- [ ] Test analytics
- [ ] Test exports
- [ ] Test sharing
- [ ] Test settings
- [ ] Test logout
- [ ] Test account deletion or document the deletion process
- [ ] Remove placeholder text
- [ ] Remove test-only content
- [ ] Remove noisy debug logs
- [ ] Confirm all URLs work
- [ ] Confirm Supabase production services are available
- [ ] Confirm auth redirect URLs are configured correctly
- [ ] Confirm backend services will stay online during Apple review

## Privacy And Legal

- [x] Publish a public privacy policy URL (habicard.com/privacy — redeploy web app to pick up latest edits)
- [x] Cover account data in the privacy policy
- [x] Cover email or login data in the privacy policy
- [x] Cover habit data in the privacy policy
- [x] Cover journal or notes data in the privacy policy
- [x] Cover AI Coach chat data in the privacy policy (added — was previously missing/inaccurate)
- [x] Cover analytics data if collected (none collected; policy states this)
- [x] Cover crash or error reporting if collected (none collected)
- [x] Mention Supabase or other service providers
- [ ] Explain data export
- [ ] Explain data deletion
- [ ] Add the privacy policy URL in App Store Connect
- [ ] Add a support URL in App Store Connect
- [ ] Add a user privacy choices URL if you have one
- [ ] Complete App Privacy details in App Store Connect (Email, User Content, User ID → App Functionality only, no tracking; User Content also shared with Google Gemini for App Functionality)
- [x] Complete export compliance in App Store Connect (ITSAppUsesNonExemptEncryption: false already set in app.config.js — standard HTTPS only)
- [ ] Complete content rights declaration
- [ ] Complete the age rating questionnaire

## App Store Listing

- [x] Write app subtitle, maximum 30 characters — `Track Habits. Build Streaks.`
- [x] Write promotional text — "New: an AI Coach that reads your real streak data and calls out what you're missing. Build habits that actually stick — one card at a time."
- [x] Write full app description — see below
- [x] Write keywords — `habit tracker,streak,journal,daily planner,goal tracker,routine,mood tracker,productivity,todo`
- [x] Add support URL — `mailto:support@habicard.com`
- [ ] Add privacy policy URL — `https://habicard.com/privacy` (after redeploy with the AI Coach fix)
- [x] Add copyright text — `© 2026 HabiCard`
- [x] Choose pricing — Free
- [x] Choose release mode: manual, automatic, or scheduled — Manual (control launch timing after Apple approval)
- [ ] Add reviewer contact information
- [x] Add reviewer notes — see below
- [x] Create a demo account if login is required for review — demo@habicard.com, seeded with ~1.5 years of realistic habit data (Jan 2025–present)
- [x] Put demo account credentials in reviewer notes — demo@habicard.com / HabiCardDemo2026!
- [x] Explain any features that need setup in reviewer notes — AI Coach note included below

### Reviewer notes (paste into App Review Information)

```
Sign in with the demo account below to see a fully populated app (habits, streaks,
journal entries, and an AI Coach insight already generated):

Email: demo@habicard.com
Password: HabiCardDemo2026!

Notes:
- The AI Coach tab (bottom of the daily card) uses Google's Gemini API via our own
  server-side proxy to generate a personalized insight from the demo account's habit
  history — no API key or extra setup is needed on your end.
- "Guest Mode" is also available from the sign-in screen and requires no account;
  all guest data stays local to the device.
```

### Description text (paste into App Store Connect)

```
Stop breaking your streaks.

HabiCard turns your daily goals into visual, satisfying cards you actually want to complete. No clutter, no guilt — just clear progress.

• LIGHTNING FAST — Log a habit in one tap. No menus, no friction.
• VISUAL PROGRESS — Watch streaks grow with charts and cards built to feel good.
• FLEXIBLE GOALS — Daily, weekday-only, or "N times a week" — habits that adapt to your life.
• JOURNAL & TASKS — Keep daily notes, mood, and to-dos right next to your habits.
• AI COACH — Get a personalized daily insight built from your actual streak data, in a coaching style you pick — direct, hype, calm, tough, or roast.
• WEEKLY, MONTHLY & YEARLY VIEWS — Zoom out and see the whole pattern, not just today.
• THEMES — Pick a look that's actually yours.

Your data is private and synced securely to your account — no ads, no trackers, no selling your data.

Build the habit. Keep the streak. Make it stick.
```

## Screenshots And Media

- [ ] Capture today card screenshot
- [ ] Capture habit setup screenshot
- [ ] Capture streaks screenshot
- [ ] Capture weekly or monthly view screenshot
- [ ] Capture yearly view screenshot
- [ ] Capture analytics screenshot
- [ ] Capture journal or notes screenshot
- [ ] Capture sharing or export screenshot
- [ ] Prepare required iPhone screenshots
- [ ] Add 1 to 10 screenshots per required device size
- [ ] Create an app preview video if desired
- [ ] Check screenshots have no private user data
- [ ] Check screenshots are not using placeholder content

## EAS Build

- [ ] Log in to Expo: `npx eas login`
- [ ] Link the project if needed: `npx eas init`
- [ ] Configure Apple credentials: `npx eas credentials`
- [ ] Run a production iOS build: `APP_VARIANT=production npx eas build --platform ios --profile production`
- [ ] Wait for the build to finish
- [ ] Confirm the build uses the production bundle ID
- [ ] Confirm the build version and build number are correct
- [ ] Submit the iOS build: `APP_VARIANT=production npx eas submit --platform ios --profile production`
- [ ] Wait for App Store Connect build processing

## TestFlight

- [ ] Add the processed build to TestFlight
- [ ] Add internal testers
- [ ] Install from TestFlight on a real device
- [ ] Complete a fresh-user QA pass
- [ ] Complete a returning-user QA pass
- [ ] Fix crashes or blocking bugs
- [ ] Confirm no unexpected permission prompts appear
- [ ] Confirm notifications work if enabled

## Submit For Review

- [ ] Select the processed build for the app version
- [ ] Confirm all required metadata is complete
- [ ] Confirm App Privacy details are complete
- [ ] Confirm export compliance is complete
- [ ] Confirm screenshots are uploaded
- [ ] Confirm reviewer notes are clear
- [ ] Add the app version to review
- [ ] Submit the draft submission for App Review
- [ ] Monitor App Store Connect for reviewer messages
- [ ] Respond to any rejection or metadata feedback

## Release Day

- [ ] Confirm release mode one last time
- [ ] Confirm availability countries or regions
- [ ] Confirm pricing
- [ ] Confirm production Supabase database is healthy
- [ ] Confirm auth emails and links work
- [ ] Confirm support email or support form is monitored
- [ ] Release the approved version if using manual release
- [ ] Verify HabiCard appears correctly on the App Store
- [ ] Download the live App Store version
- [ ] Run a quick live production smoke test

## Useful Commands

- iOS production build: `npm run build:ios`
- Android production build: `npm run build:android`
- Preview APK: `eas build --platform android --profile preview`
- iOS simulator: `eas build --platform ios --profile ios-simulator`
- iOS submit: `npm run submit:ios`
- Android submit: `npm run submit:android`
