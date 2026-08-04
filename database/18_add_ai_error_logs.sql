-- Persist AI Coach / chat errors in the DB (not just the browser console) so they
-- can actually be reviewed later — rate limits, Gemini API errors, blocked
-- responses, dropped tool-call loops, unexpected exceptions, etc.
CREATE TABLE IF NOT EXISTS ai_error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for guest-mode errors
  context TEXT NOT NULL, -- e.g. 'insight_fetch', 'chat_rate_limit', 'chat_hiccup', 'chat_blocked', 'chat_max_rounds', 'chat_exception', 'edge_function'
  message TEXT NOT NULL,
  detail JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_error_logs_created_at ON ai_error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_error_logs_user ON ai_error_logs(user_id);

ALTER TABLE ai_error_logs ENABLE ROW LEVEL SECURITY;

-- Write-only from the client: anyone (including guests, user_id NULL) can log an
-- error, but only their own — no SELECT/UPDATE/DELETE policy exists for
-- anon/authenticated, so rows can only be read back via the service role.
DROP POLICY IF EXISTS "Anyone can insert their own ai error logs" ON ai_error_logs;
CREATE POLICY "Anyone can insert their own ai error logs"
  ON ai_error_logs
  FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
