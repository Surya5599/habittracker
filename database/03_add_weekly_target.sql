-- Migration to add weekly_target to habits table
ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS weekly_target INTEGER DEFAULT NULL;

-- Comment to explain the column
COMMENT ON COLUMN habits.weekly_target IS 'Number of times per week a habit should be completed (flexible habits)';
