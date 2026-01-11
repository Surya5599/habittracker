-- Add sort_order column to habits table
ALTER TABLE habits
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Initialize sort_order for existing habits based on their creation order (id)
WITH numbered_habits AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY id) - 1 as new_order
    FROM habits
)
UPDATE habits
SET sort_order = numbered_habits.new_order
FROM numbered_habits
WHERE habits.id = numbered_habits.id;

-- Comment on column
COMMENT ON COLUMN habits.sort_order IS 'The priority order for displaying habits. Lower values appear first.';
