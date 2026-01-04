-- Create daily_notes table for storing user notes per day
CREATE TABLE IF NOT EXISTS daily_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL, -- Format: YYYY-MM-DD
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date_key)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_notes_user_date ON daily_notes(user_id, date_key);

-- Enable Row Level Security
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own notes
DROP POLICY IF EXISTS "Users can manage their own notes" ON daily_notes;
CREATE POLICY "Users can manage their own notes"
  ON daily_notes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_daily_notes_updated_at ON daily_notes;
CREATE TRIGGER update_daily_notes_updated_at
  BEFORE UPDATE ON daily_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
