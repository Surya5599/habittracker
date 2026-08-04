import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Proxies Gemini generateContent calls so the API key never reaches the browser
// (previously it was visible in the client-side fetch URL / network tab).
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const MODEL = 'gemini-3.1-flash-lite';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Server-side ceiling on raw Gemini calls per key per day. This is intentionally
// looser than the client's UX-facing daily message caps (AI_DAILY_LIMIT=5,
// CHAT_DAILY_LIMIT=10) — a single AI Coach chat message can loop up to 5 rounds
// of tool calls, so legitimate worst-case usage across both features can reach
// several dozen raw calls a day. This exists to stop outright abuse (cleared
// localStorage, scripted hammering), not to enforce the UX limit itself.
const DAILY_RATE_LIMIT = 60;

function decodeJwtPayload(token: string): any | null {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getRateLimitKey(req: Request): string {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const claims = token ? decodeJwtPayload(token) : null;

  if (claims?.role === 'authenticated' && claims?.sub) {
    return `user:${claims.sub}`;
  }

  const forwardedFor = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const ip = forwardedFor.split(',')[0].trim();
  return `ip:${ip}`;
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

  if (!GEMINI_API_KEY) {
    console.error('[gemini-proxy] GEMINI_API_KEY secret is not set');
    return new Response(JSON.stringify({ error: 'AI service is not configured' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const rateKey = getRateLimitKey(req);
    const dateKey = new Date().toISOString().slice(0, 10);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: rateCount, error: rateError } = await admin.rpc('increment_ai_rate_limit', {
      p_rate_key: rateKey,
      p_date_key: dateKey,
    });

    if (rateError) {
      // Fail open — a broken counter shouldn't take down the AI feature.
      console.error('[gemini-proxy] rate limit RPC failed:', rateError);
    } else if ((rateCount ?? 0) > DAILY_RATE_LIMIT) {
      console.warn(`[gemini-proxy] rate limit exceeded for ${rateKey}: ${rateCount}/${DAILY_RATE_LIMIT}`);
      return new Response(JSON.stringify({
        error: { status: 'RESOURCE_EXHAUSTED', message: 'Daily AI usage limit exceeded. Try again tomorrow.' },
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { contents, tools } = body ?? {};

    if (!Array.isArray(contents)) {
      return new Response(JSON.stringify({ error: 'Missing contents' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: Record<string, unknown> = { contents };
    if (tools) payload.tools = tools;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();

    if (!res.ok || data?.error) {
      console.error('[gemini-proxy] Gemini API error:', res.status, JSON.stringify(data?.error ?? data));
    }

    // Forward Gemini's own status code so client-side rate-limit/error handling
    // (429 checks etc.) keeps working unchanged.
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('[gemini-proxy] Unhandled error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
