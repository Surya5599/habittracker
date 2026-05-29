# /support — Fetch latest user support & bug reports

Fetch open feedback from the HabiCard Supabase backend and present them for triage.

## One-time setup check

Verify `VITE_SUPABASE_SERVICE_ROLE_KEY` exists in `.env`:
```bash
grep -q VITE_SUPABASE_SERVICE_ROLE_KEY .env && echo "KEY_FOUND" || echo "KEY_MISSING"
```
If `KEY_MISSING`: tell the user to add `VITE_SUPABASE_SERVICE_ROLE_KEY=<key>` from the Supabase dashboard (Settings → API → service_role). Stop and wait.

## Fetch & display

Load credentials:
```bash
SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d= -f2-)
SERVICE_KEY=$(grep VITE_SUPABASE_SERVICE_ROLE_KEY .env | cut -d= -f2-)
```

Fetch latest open/replied bugs (max 30) with replies and admin tracking fields:
```bash
curl -s "${SUPABASE_URL}/rest/v1/feedback?select=id,type,content,status,created_at,user_id,admin_notes,admin_worked_on_at,replies:feedback_replies(id,content,is_admin_reply,created_at)&type=eq.bug&status=neq.closed&order=created_at.desc&limit=30" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Accept: application/json"
```

**Display** as a numbered list. For each issue show:
- **Index** — bold number
- **Type** — `🐛 Bug` or `💡 Suggestion`
- **Status** — `open` / `replied`
- **Triage** — if `admin_worked_on_at` is set, show `✅ worked on YYYY-MM-DD`; if `admin_notes` is set, show the notes inline
- **Date** — `YYYY-MM-DD`
- **Content** — first 200 chars trimmed at word boundary
- **Replies** — count; if >0 show latest reply snippet (50 chars)

Sort: un-triaged (`admin_worked_on_at` is null) first, then triaged; newest first within each group.

After listing, ask:

> **Which issue(s) would you like to work on?**
> Enter a number, comma-separated list (e.g. `1, 3`), `all bugs`, or `all open`.
> Or use commands: `note <n> <text>` to add admin notes, `done <n>` to mark worked on, `close <n>` to close.
> Type `skip` to exit.

## Load selected thread(s)

```bash
curl -s "${SUPABASE_URL}/rest/v1/feedback?select=*,replies:feedback_replies(*)&id=eq.{ISSUE_ID}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Accept: application/json"
```

Print the full thread (chronological), then suggest next actions:
- **Bug**: search the codebase for related code and propose a fix
- **Suggestion**: assess feasibility, suggest implementation approach

## Triage commands

### Mark as worked on (`done <n>`)
Sets `admin_worked_on_at` to now and optionally appends a note:
```bash
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/feedback?id=eq.{FEEDBACK_ID}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"admin_worked_on_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
```

### Add/update admin notes (`note <n> <text>`)
```bash
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/feedback?id=eq.{FEEDBACK_ID}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"admin_notes\": \"{NOTE_TEXT}\"}"
```

### Close a thread (`close <n>`)
```bash
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/feedback?id=eq.{FEEDBACK_ID}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"status": "closed"}'
```

## Post an admin reply

Ask for reply text, then:
```bash
curl -s -X POST "${SUPABASE_URL}/rest/v1/feedback_replies" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"feedback_id\": \"${FEEDBACK_ID}\", \"user_id\": \"${ADMIN_USER_ID}\", \"content\": \"${REPLY_TEXT}\", \"is_admin_reply\": true}"

# Mark as replied
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/feedback?id=eq.{FEEDBACK_ID}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"status": "replied"}'
```

## Notes
- `status`: `open` → `replied` → `closed`
- `admin_notes`: free-text triage notes (e.g. "fixed in commit abc123", "can't reproduce")
- `admin_worked_on_at`: timestamp of when you last worked on the issue
- The service role key bypasses RLS — never commit it to git
