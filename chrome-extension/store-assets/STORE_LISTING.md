# HabiCard Chrome Web Store Listing

## Rejection History

### v1.0.0 — Jan 15, 2026
> **Violation:** User Data Privacy — Reference ID: Purple Nickel  
> **Issue:** Privacy policy link did not lead to a valid privacy policy.  
> **Fix applied:** Rewrote `habicard.com/privacy` as a standalone policy page.

### v1.0.1 — May 2026
> **Violation:** Inaccurate Description — Reference ID: Red Potassium  
> **Issue:** Metadata described features not present in the extension (monthly calendar, analytics dashboard, New Year's goal lock, offline mode).  
> **Fix applied:** Rewrote description to only describe features visible in the extension popup.

---

## Product Details

| Field | Value |
|---|---|
| **Title** | HabiCard - Habit Tracker |
| **Summary** | Track your daily habits and build consistency with HabiCard. |
| **Category** | Workflow & Planning |
| **Language** | English (United States) |
| **Homepage URL** | https://habicard.com/ |
| **Support URL** | https://habicard.com/support *(needs to be created)* |
| **Mature content** | No |
| **Visibility** | Public |

---

## Description

> Paste the text below into the Chrome Web Store description field.

```
HabiCard is a habit tracker that lives in your browser toolbar — one click to check in on your day, no tab switching required.

Sign in with your HabiCard account to sync your habits, then open the popup to log your day in seconds.

WHAT'S IN THE POPUP

• My Habits tab — check off each habit for the day, see your completion ring update live
• Tasks tab — add and complete one-off tasks for the day
• Journal tab — write a quick note and log your mood
• Progress ring — at-a-glance percentage of habits completed today
• Navigate days — swipe back to log a missed day or check yesterday
• Theme options — choose a color scheme in Settings
• Compact or full card view — pick the density that suits you

REQUIRES A FREE HABICARD ACCOUNT

Sign up at habicard.com. Your habits sync across the extension and the full web app, where you can access monthly views and trend analytics.
```

**Character count:** ~780 / 16,000

---

## Graphic Assets

### Store Icon
- **File:** `store-assets/icon-128.png`
- **Size:** 128x128px ✅
- **Status:** Ready

### Screenshots (REQUIRED — minimum 2)
- **Size:** 1280x800, JPEG
- **Status:** ✅ Done — `store-assets/screenshots/01-daily-habits.jpg` … `04-settings.jpg`, generated from the real DailyCard/SettingsModal components with seeded demo data (see `submission-guide.html`/PDF for how)

### Small Promo Tile
- **Size:** 440x280px
- **File:** `store-assets/promo-small-440x280.jpg` — ✅ Done

### Marquee Promo Tile
- **Size:** 1400x560px
- **File:** `store-assets/promo-marquee-1400x560.jpg` — ✅ Done

---

## v1.0.2 — Aug 2026 pass

- Removed the unused `"tabs"` permission from the manifest — the extension only calls `chrome.tabs.create`, which requires no permission at all. Declared-but-unused permissions are the #1 Chrome Web Store rejection reason.
- Fixed a `customStorage.ts` type error (unrelated to the store, but part of keeping the build clean).
- Full Privacy Practices tab answers (single purpose, permission justification, data disclosure, certification) now live in `store-assets/HabiCard-Chrome-Store-Submission-Guide.pdf`.

## Checklist Before Resubmitting

- [x] `https://habicard.com/privacy` is live with a real privacy policy
- [x] `https://habicard.com/support` exists
- [x] 4 screenshots uploaded (1280x800)
- [x] Store icon uploaded (128x128) — file ready at `store-assets/icon-128.png`
- [x] Description pasted in from above
- [x] Summary matches manifest description
- [x] Homepage URL set to `https://habicard.com/`
- [ ] Privacy Practices tab filled in per `HabiCard-Chrome-Store-Submission-Guide.pdf`
- [ ] Upload `store-assets/habicard-extension-v1.0.2.zip` as the package
