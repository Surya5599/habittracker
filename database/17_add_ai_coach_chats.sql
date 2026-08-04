-- Persist AI Coach daily insight + chat history in the DB instead of localStorage,
-- so it survives clearing the browser cache / switching devices.
CREATE TABLE IF NOT EXISTS ai_coach_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL, -- Format: YYYY-MM-DD
  personality TEXT,
  insight JSONB,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_coach_chats_user_date ON ai_coach_chats(user_id, date_key);

ALTER TABLE ai_coach_chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own ai coach chats" ON ai_coach_chats;
CREATE POLICY "Users can manage their own ai coach chats"
  ON ai_coach_chats
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_ai_coach_chats_updated_at ON ai_coach_chats;
CREATE TRIGGER update_ai_coach_chats_updated_at
  BEFORE UPDATE ON ai_coach_chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
