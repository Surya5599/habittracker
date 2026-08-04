-- Server-side rate limiting for the gemini-proxy edge function. The client-side
-- daily message caps (AI_DAILY_LIMIT / CHAT_DAILY_LIMIT) live in localStorage and
-- are trivially bypassed by clearing it — since the Gemini API key now lives only
-- server-side, an abusive client could otherwise exhaust the shared free-tier
-- quota for every user. This table backs a real per-day counter keyed by
-- authenticated user id (or IP for guests), incremented atomically via RPC.
CREATE TABLE IF NOT EXISTS ai_rate_limits (
  rate_key TEXT NOT NULL,   -- 'user:<uuid>' for logged-in users, 'ip:<address>' for guests
  date_key TEXT NOT NULL,   -- YYYY-MM-DD (UTC)
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (rate_key, date_key)
);

-- No RLS policies are added on purpose — this table is only ever touched by the
-- edge function via the service-role client, which bypasses RLS entirely. RLS is
-- still enabled so a client with just the anon/authenticated role gets a hard
-- deny if it ever tries to query this table directly.
ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION increment_ai_rate_limit(p_rate_key TEXT, p_date_key TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO ai_rate_limits (rate_key, date_key, count, updated_at)
  VALUES (p_rate_key, p_date_key, 1, NOW())
  ON CONFLICT (rate_key, date_key)
  DO UPDATE SET count = ai_rate_limits.count + 1, updated_at = NOW()
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

-- Only the service role (used exclusively inside the edge function) may call
-- this — revoke from anon/authenticated so it can't be invoked directly via
-- PostgREST to inflate/reset another key's counter.
REVOKE ALL ON FUNCTION increment_ai_rate_limit(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
