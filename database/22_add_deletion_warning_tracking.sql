-- Tracks when a user was last sent an "account will be deleted for inactivity"
-- warning, so a repeat run of the cleanup job doesn't re-warn the same person
-- every time it's invoked.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deletion_warning_sent_at TIMESTAMP WITH TIME ZONE;

-- Set-based lookup of users inactive for `inactive_days`, excluding anyone
-- already warned within `resend_cooldown_days`. "Active" is the greatest of:
-- last sign-in, account creation, and latest completions/habits/daily_notes
-- activity — last_sign_in_at alone understates usage because Supabase only
-- bumps it on a real sign-in event, not on silent session/token refresh.
-- SECURITY DEFINER + service_role-only grant: this reads auth.users.email,
-- which must never be reachable from the anon/authenticated client roles.
CREATE OR REPLACE FUNCTION public.get_inactive_users_for_deletion_warning(
  inactive_days INTEGER DEFAULT 60,
  resend_cooldown_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  last_active_at TIMESTAMPTZ,
  warning_already_sent_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    u.id,
    u.email,
    activity.last_active_at,
    p.deletion_warning_sent_at
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  CROSS JOIN LATERAL (
    SELECT GREATEST(
      u.last_sign_in_at,
      u.created_at,
      (SELECT MAX(c.created_at) FROM public.completions c WHERE c.user_id = u.id),
      (SELECT MAX(h.created_at) FROM public.habits h WHERE h.user_id = u.id),
      (SELECT MAX(dn.updated_at) FROM public.daily_notes dn WHERE dn.user_id = u.id)
    ) AS last_active_at
  ) activity
  WHERE u.deleted_at IS NULL
    AND u.is_anonymous IS NOT TRUE
    AND u.banned_until IS NULL
    AND u.email IS NOT NULL
    AND activity.last_active_at < now() - (inactive_days || ' days')::interval
    AND (
      p.deletion_warning_sent_at IS NULL
      OR p.deletion_warning_sent_at < now() - (resend_cooldown_days || ' days')::interval
    );
$$;

REVOKE ALL ON FUNCTION public.get_inactive_users_for_deletion_warning(INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_inactive_users_for_deletion_warning(INTEGER, INTEGER) TO service_role;
