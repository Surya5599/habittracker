-- Add optional free-text target column to habits table
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS target TEXT;

COMMENT ON COLUMN habits.target IS 'Optional free-text target for the habit, e.g. "20 mins"';
