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
- [ ] Decide whether `supportsTablet: true` should stay enabled

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

- [ ] Publish a public privacy policy URL
- [ ] Cover account data in the privacy policy
- [ ] Cover email or login data in the privacy policy
- [ ] Cover habit data in the privacy policy
- [ ] Cover journal or notes data in the privacy policy
- [ ] Cover analytics data if collected
- [ ] Cover crash or error reporting if collected
- [ ] Mention Supabase or other service providers
- [ ] Explain data export
- [ ] Explain data deletion
- [ ] Add the privacy policy URL in App Store Connect
- [ ] Add a support URL in App Store Connect
- [ ] Add a user privacy choices URL if you have one
- [ ] Complete App Privacy details in App Store Connect
- [ ] Complete export compliance in App Store Connect
- [ ] Complete content rights declaration
- [ ] Complete the age rating questionnaire

## App Store Listing

- [ ] Write app subtitle, maximum 30 characters
- [ ] Write promotional text
- [ ] Write full app description
- [ ] Write keywords
- [ ] Add support URL
- [ ] Add privacy policy URL
- [ ] Add copyright text
- [ ] Choose pricing
- [ ] Choose release mode: manual, automatic, or scheduled
- [ ] Add reviewer contact information
- [ ] Add reviewer notes
- [ ] Create a demo account if login is required for review
- [ ] Put demo account credentials in reviewer notes
- [ ] Explain any features that need setup in reviewer notes

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
- [ ] Prepare required iPad screenshots if tablet support stays enabled
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
