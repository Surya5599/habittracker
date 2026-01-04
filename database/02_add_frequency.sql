-- Add frequency column to habits table to store specific days of the week
-- frequency is an array of integers (0-6) where 0 is Sunday, 1 is Monday, etc.
ALTER TABLE habits
ADD COLUMN frequency INTEGER[];

-- Comment on column
COMMENT ON COLUMN habits.frequency IS 'Array of days of the week (0-6) when this habit is active. NULL means every day.';

-- OPTIONAL: If you want to explicitly set all existing habits to "Every Day" (although NULL already handles this):
-- UPDATE habits SET frequency = NULL WHERE frequency IS NULL; 
-- (The above line actually does nothing since they are null, but confirms the intent: keeping them NULL effectively defaults them to 7 days in the app logic.)

-- If you strictly wanted the array [0,1,2,3,4,5,6] in the DB:
-- UPDATE habits SET frequency = ARRAY[0,1,2,3,4,5,6] WHERE frequency IS NULL;
