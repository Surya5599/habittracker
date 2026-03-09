-- Add optional description column to habits table
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN habits.description IS 'Optional user-authored habit description shown in My Habits';
