import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[delete-account] Missing or malformed Authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use the standard pattern: create a user-scoped client from the request's JWT.
    // This is the recommended way to verify the caller in Supabase edge functions.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error('[delete-account] JWT verification failed:', authError?.message);
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[delete-account] Verified caller:', user.id);

    // Confirm the userId in the body matches the authenticated caller
    const body = await req.json();
    const { userId } = body;
    if (!userId || userId !== user.id) {
      console.error('[delete-account] userId mismatch — body:', userId, 'jwt:', user.id);
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin client for privileged operations (bypasses RLS, can delete auth user)
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const uid = user.id;

    // Delete user data. Errors from individual tables are logged but not fatal —
    // the auth user deletion at the end cascades remaining ON DELETE CASCADE tables.
    const steps: Array<[string, Promise<unknown>]> = [
      ['completions',          admin.from('completions').delete().eq('user_id', uid)],
      ['habits',               admin.from('habits').delete().eq('user_id', uid)],
      ['daily_notes',          admin.from('daily_notes').delete().eq('user_id', uid)],
      ['monthly_goals',        admin.from('monthly_goals').delete().eq('user_id', uid)],
      ['user_achievements',    admin.from('user_achievements').delete().eq('user_id', uid)],
      ['list_items',           admin.from('list_items').delete().eq('user_id', uid)],
      ['lists',                admin.from('lists').delete().eq('user_id', uid)],
      ['profiles',             admin.from('profiles').delete().eq('id', uid)],
      ['feedback (anonymise)', admin.from('feedback').update({ user_id: null }).eq('user_id', uid)],
    ];

    for (const [label, op] of steps) {
      const { error } = await op as { error: { message: string } | null };
      if (error) {
        console.warn(`[delete-account] Non-fatal error on "${label}":`, error.message);
      } else {
        console.log(`[delete-account] OK: ${label}`);
      }
    }

    // Delete the auth user — this is the critical step
    console.log('[delete-account] Deleting auth user:', uid);
    const { error: deleteError } = await admin.auth.admin.deleteUser(uid);
    if (deleteError) {
      console.error('[delete-account] auth.admin.deleteUser failed:', deleteError.message);
      throw deleteError;
    }

    console.log('[delete-account] Success for user:', uid);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('[delete-account] Unhandled error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
