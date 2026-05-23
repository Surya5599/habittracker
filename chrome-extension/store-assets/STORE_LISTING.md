# HabiCard Chrome Web Store Listing

## Rejection Status (v1.0.0 — Jan 15, 2026)

> **Status:** Rejected — DO NOT resubmit until this is resolved.
>
> **Violation:** User Data Privacy  
> **Reference ID:** Purple Nickel  
> **Issue:** Privacy policy link does not lead to a valid privacy policy. Owner sites (e.g. just linking to habicard.com) are not considered valid.
>
> **Fix required:** `https://habicard.com/privacy` must serve a real, standalone privacy policy page — not a homepage, not a redirect. It must explicitly state what user data is collected (email, habit data), how it is stored (Supabase), and how users can request deletion.
>
> Once the privacy page is live and accessible, resubmit.

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
HabiCard is a clean, focused habit tracker that lives in your browser toolbar — always one click away, never in the way.

Build streaks, track consistency, and get a clear picture of how your days are actually going.

FEATURES

• Daily habit tracking — check off habits directly from the popup
• Progress rings — see your completion at a glance
• Task list — add and complete tasks for the day
• Journal & mood — log a quick note and how you're feeling
• Monthly calendar — scan patterns across the whole month
• Analytics dashboard — week-over-week and month-over-month trends
• Share card — generate a visual summary to share your progress
• Theme customization — choose colors that match your style
• New Year's goal lock — set resolutions that stay sealed until year end
• Works offline — local storage keeps your data available even without a connection
• Syncs across devices — sign in to keep your history on any machine

Designed for people who want just enough structure without the overwhelm. No subscriptions, no noise.
```

**Character count:** ~950 / 16,000

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

**Suggested shots:**
| File | What to show |
|---|---|
| `screenshots/01-daily-habits.png` | Daily view with a few habits checked, progress ring visible |
| `screenshots/02-monthly-view.png` | Monthly calendar with habit dots filled in |
| `screenshots/03-analytics.png` | Analytics dashboard with completion chart |
| `screenshots/04-journal.png` | Journal tab with mood selector and a note |
| `screenshots/05-theme.png` | Settings open showing theme color options |

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
