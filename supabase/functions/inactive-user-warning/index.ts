import { createClient } from 'jsr:@supabase/supabase-js@2';
import { SESv2Client, SendEmailCommand } from 'npm:@aws-sdk/client-sesv2@3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// One-off cleanup job: emails every user inactive 60+ days ("last_sign_in_at",
// account creation, or latest completions/habits/daily_notes activity, whichever
// is most recent) to warn their account will be deleted in 7 days, then stamps
// profiles.deletion_warning_sent_at so a repeat invocation doesn't re-warn them.
// Not on a schedule — triggered by hand via `supabase functions invoke` with the
// ADMIN_TRIGGER_SECRET, since this reads every user's email and is not something
// any client role should be able to call.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_TRIGGER_SECRET = Deno.env.get('ADMIN_TRIGGER_SECRET')!;

const AWS_REGION = Deno.env.get('AWS_REGION') ?? 'us-east-2';
const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID')!;
const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY')!;
const SES_FROM_EMAIL = Deno.env.get('SES_FROM_EMAIL') ?? 'info@habicard.com';

// Accounts that must never be warned or swept, whatever their activity looks like.
// The App Store / Play reviewer credentials live in the demo account: if a hand-triggered
// run warned or deleted it mid-review, the reviewer would be locked out of the app and the
// submission would come back rejected. Override with EXEMPT_EMAILS (comma separated).
const EXEMPT_EMAILS = new Set(
  (Deno.env.get('EXEMPT_EMAILS') ?? 'demo@habicard.com')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

// Stay well under SES's default sending rate so a run of ~1,300 emails
// doesn't trip AWS's throttling.
const SEND_DELAY_MS = Number(Deno.env.get('SES_SEND_DELAY_MS') ?? '150');

const ses = new SESv2Client({
  region: AWS_REGION,
  credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildEmail(deletionDateStr: string) {
  const subject = 'Your HabiCard account will be deleted in 7 days';
  const text = `Hi there,

We noticed you haven't opened HabiCard in over 60 days.

To keep things tidy, we automatically remove accounts that have been inactive for a long time. Your account is currently scheduled for deletion in 7 days (on ${deletionDateStr}). This will permanently remove your habits, streaks, notes, and all other account data — this cannot be undone.

Good news: you don't have to do anything special to keep your account. Just sign in to HabiCard any time before then, and your account will stay active as normal.

Sign in: https://habicard.com

Questions or think this is a mistake? Just reply to this email.

— The HabiCard Team`;

  const html = `<p>Hi there,</p>
<p>We noticed you haven't opened HabiCard in over 60 days.</p>
<p>To keep things tidy, we automatically remove accounts that have been inactive for a long time. Your account is currently scheduled for deletion in <strong>7 days (on ${deletionDateStr})</strong>. This will permanently remove your habits, streaks, notes, and all other account data &mdash; this cannot be undone.</p>
<p>Good news: you don't have to do anything special to keep your account. Just sign in to HabiCard any time before then, and your account will stay active as normal.</p>
<p><a href="https://habicard.com">Sign in to HabiCard</a></p>
<p>Questions or think this is a mistake? Just reply to this email.</p>
<p>&mdash; The HabiCard Team</p>`;

  return { subject, text, html };
}

async function sendViaSes(toEmail: string, deletionDateStr: string) {
  const { subject, text, html } = buildEmail(deletionDateStr);
  await ses.send(new SendEmailCommand({
    FromEmailAddress: SES_FROM_EMAIL,
    Destination: { ToAddresses: [toEmail] },
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Text: { Data: text, Charset: 'UTF-8' },
          Html: { Data: html, Charset: 'UTF-8' },
        },
      },
    },
  }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!ADMIN_TRIGGER_SECRET || req.headers.get('x-admin-secret') !== ADMIN_TRIGGER_SECRET) {
    console.error('[inactive-user-warning] Missing/invalid x-admin-secret');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun: boolean = body?.dryRun !== false; // default TRUE — must opt out explicitly
    const testEmail: string | undefined = body?.testEmail;
    const inactiveDays: number = Number(body?.inactiveDays ?? 60);
    const limit: number | undefined = body?.limit ? Number(body.limit) : undefined;

    const deletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const deletionDateStr = deletionDate.toISOString().slice(0, 10);

    // Single test send — doesn't touch the DB or the real user list at all.
    if (testEmail) {
      await sendViaSes(testEmail, deletionDateStr);
      return new Response(JSON.stringify({ success: true, testEmail }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: candidates, error: rpcError } = await admin.rpc(
      'get_inactive_users_for_deletion_warning',
      { inactive_days: inactiveDays, resend_cooldown_days: 7 },
    );

    if (rpcError) {
      console.error('[inactive-user-warning] RPC failed:', rpcError.message);
      throw rpcError;
    }

    const matched = candidates ?? [];
    const eligible = matched.filter((row) => !EXEMPT_EMAILS.has(String(row.email ?? '').trim().toLowerCase()));
    const exempted = matched.length - eligible.length;
    const targets = limit ? eligible.slice(0, limit) : eligible;
    console.log(`[inactive-user-warning] dryRun=${dryRun} matched=${matched.length} exempt=${exempted} targeting=${targets.length}`);

    let sent = 0;
    const failed: Array<{ userId: string; error: string }> = [];

    for (const row of targets) {
      if (dryRun) {
        sent++;
        continue;
      }
      try {
        await sendViaSes(row.email, deletionDateStr);
        const { error: updateError } = await admin
          .from('profiles')
          .update({ deletion_warning_sent_at: new Date().toISOString() })
          .eq('id', row.user_id);
        if (updateError) throw updateError;
        sent++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[inactive-user-warning] Failed for ${row.user_id}:`, message);
        failed.push({ userId: row.user_id, error: message });
      }
      await sleep(SEND_DELAY_MS);
    }

    return new Response(JSON.stringify({
      dryRun,
      totalMatched: matched.length,
      exempted,
      targeted: targets.length,
      sent,
      failed,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('[inactive-user-warning] Unhandled error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
