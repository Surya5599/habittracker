-- Add archived_at column to habits table
ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;
