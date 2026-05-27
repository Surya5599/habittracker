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
- **Size:** 1280x800 or 640x400
- **Format:** JPEG or 24-bit PNG (no alpha)
- **Status:** Need to be captured manually

**How to capture:**
1. Load the unpacked extension in Chrome (`chrome://extensions` → Load unpacked → select `dist/`)
2. Open the popup and resize to a good state
3. Use Chrome DevTools device toolbar set to 400x600 or capture the popup window
4. Use macOS Screenshot (`Cmd+Shift+4`) and crop to 1280x800 canvas

**Suggested shots (extension popup ONLY — do not use web app screenshots):**
| File | What to show |
|---|---|
| `screenshots/01-daily-habits.png` | My Habits tab with several habits checked, progress ring showing % |
| `screenshots/02-tasks.png` | Tasks tab with a few tasks listed |
| `screenshots/03-journal.png` | Journal tab with mood selector and a note typed |
| `screenshots/04-settings.png` | Settings modal open showing theme color options |

### Small Promo Tile
- **Size:** 440x280px
- **Format:** JPEG or 24-bit PNG (no alpha)
- **File:** `store-assets/promo-small-440x280.png` *(not yet created)*
- **Suggested design:** App icon centered on a solid brand color background with "HabiCard" wordmark below

### Marquee Promo Tile
- **Size:** 1400x560px
- **Format:** JPEG or 24-bit PNG (no alpha)
- **File:** `store-assets/promo-marquee-1400x560.png` *(not yet created)*
- **Suggested design:** App icon left, key feature list right, on brand gradient background

---

## Checklist Before Resubmitting

- [ ] `https://habicard.com/privacy` is live with a real privacy policy
- [ ] `https://habicard.com/support` exists (or add a support email instead)
- [ ] At least 2 screenshots uploaded (1280x800)
- [ ] Store icon uploaded (128x128) — file ready at `store-assets/icon-128.png`
- [ ] Description pasted in from above
- [ ] Summary matches manifest description
- [ ] Homepage URL set to `https://habicard.com/`
