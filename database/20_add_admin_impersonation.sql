-- Read-only admin impersonation: lets an admin view any user's dashboard/stats
-- (habits, completions, notes, monthly goals, lists) without being able to
-- modify it. INSERT/UPDATE/DELETE stay strictly `auth.uid() = user_id` — only
-- SELECT policies gain the admin bypass.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

INSERT INTO profiles (id, is_admin)
SELECT id, true FROM auth.users WHERE lower(email) IN ('admin@habicard.com', 'knowheredeveloper@gmail.com')
ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- Bypasses RLS internally (SECURITY DEFINER) to check the caller's own admin
-- flag — safe to grant broadly since it only ever reveals a boolean about the
-- caller themselves.
CREATE OR REPLACE FUNCTION is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM profiles WHERE id = auth.uid()), false);
$$;

REVOKE ALL ON FUNCTION is_app_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_app_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION is_app_admin() FROM anon; -- Supabase grants EXECUTE to anon by default on new functions

-- habits
DROP POLICY IF EXISTS "Users can only see their own habits" ON habits;
CREATE POLICY "Users can only see their own habits"
  ON habits FOR SELECT
  USING (auth.uid() = user_id OR is_app_admin());

-- completions
DROP POLICY IF EXISTS "Users can only see their own completions" ON completions;
CREATE POLICY "Users can only see their own completions"
  ON completions FOR SELECT
  USING (auth.uid() = user_id OR is_app_admin());

-- daily_notes — was a single ALL policy; split so the admin bypass only applies to SELECT
DROP POLICY IF EXISTS "Users can manage their own notes" ON daily_notes;
CREATE POLICY "Users can view their own notes or admin can view any"
  ON daily_notes FOR SELECT
  USING (auth.uid() = user_id OR is_app_admin());
CREATE POLICY "Users can insert their own notes"
  ON daily_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes"
  ON daily_notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes"
  ON daily_notes FOR DELETE
  USING (auth.uid() = user_id);

-- monthly_goals
DROP POLICY IF EXISTS "Users can view their own monthly goals" ON monthly_goals;
CREATE POLICY "Users can view their own monthly goals"
  ON monthly_goals FOR SELECT
  USING (auth.uid() = user_id OR is_app_admin());

-- lists — was a single ALL policy; split so the admin bypass only applies to SELECT
DROP POLICY IF EXISTS "Users can manage their own lists" ON lists;
CREATE POLICY "Users can view their own lists or admin can view any"
  ON lists FOR SELECT
  USING (auth.uid() = user_id OR is_app_admin());
CREATE POLICY "Users can insert their own lists"
  ON lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own lists"
  ON lists FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own lists"
  ON lists FOR DELETE USING (auth.uid() = user_id);

-- list_items — was a single ALL policy; split so the admin bypass only applies to SELECT
DROP POLICY IF EXISTS "Users can manage their own list items" ON list_items;
CREATE POLICY "Users can view their own list items or admin can view any"
  ON list_items FOR SELECT
  USING (auth.uid() = user_id OR is_app_admin());
CREATE POLICY "Users can insert their own list items"
  ON list_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own list items"
  ON list_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own list items"
  ON list_items FOR DELETE USING (auth.uid() = user_id);

-- Lets an admin search users by email to pick who to impersonate. Checks
-- is_app_admin() internally, so it's safe to grant EXECUTE broadly.
CREATE OR REPLACE FUNCTION admin_search_users(search text)
RETURNS TABLE(id uuid, email text, created_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_app_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email::text, u.created_at
  FROM auth.users u
  WHERE search = '' OR u.email ILIKE '%' || search || '%'
  ORDER BY u.created_at DESC
  LIMIT 20;
END;
$$;

REVOKE ALL ON FUNCTION admin_search_users(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_search_users(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION admin_search_users(text) FROM anon;
