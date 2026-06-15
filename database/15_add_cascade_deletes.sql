-- Add ON DELETE CASCADE to user-data tables that were missing it.
-- This ensures auth.admin.deleteUser always succeeds even if the explicit
-- pre-delete steps in the delete-account Edge Function fail for any reason.

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Helper: drop existing FK and re-add with CASCADE for a given table + column.
  -- Works regardless of the original auto-generated constraint name.

  -- habits.user_id
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.habits'::regclass
      AND contype = 'f'
      AND conkey @> ARRAY[(
        SELECT attnum FROM pg_attribute
        WHERE attrelid = 'public.habits'::regclass AND attname = 'user_id'
      )]
  LOOP
    EXECUTE format('ALTER TABLE public.habits DROP CONSTRAINT %I', r.conname);
  END LOOP;
  ALTER TABLE public.habits
    ADD CONSTRAINT habits_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  -- completions.user_id
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.completions'::regclass
      AND contype = 'f'
      AND conkey @> ARRAY[(
        SELECT attnum FROM pg_attribute
        WHERE attrelid = 'public.completions'::regclass AND attname = 'user_id'
      )]
  LOOP
    EXECUTE format('ALTER TABLE public.completions DROP CONSTRAINT %I', r.conname);
  END LOOP;
  ALTER TABLE public.completions
    ADD CONSTRAINT completions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  -- monthly_goals.user_id
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.monthly_goals'::regclass
      AND contype = 'f'
      AND conkey @> ARRAY[(
        SELECT attnum FROM pg_attribute
        WHERE attrelid = 'public.monthly_goals'::regclass AND attname = 'user_id'
      )]
  LOOP
    EXECUTE format('ALTER TABLE public.monthly_goals DROP CONSTRAINT %I', r.conname);
  END LOOP;
  ALTER TABLE public.monthly_goals
    ADD CONSTRAINT monthly_goals_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  -- lists.user_id
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.lists'::regclass
      AND contype = 'f'
      AND conkey @> ARRAY[(
        SELECT attnum FROM pg_attribute
        WHERE attrelid = 'public.lists'::regclass AND attname = 'user_id'
      )]
  LOOP
    EXECUTE format('ALTER TABLE public.lists DROP CONSTRAINT %I', r.conname);
  END LOOP;
  ALTER TABLE public.lists
    ADD CONSTRAINT lists_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  -- list_items.user_id
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.list_items'::regclass
      AND contype = 'f'
      AND conkey @> ARRAY[(
        SELECT attnum FROM pg_attribute
        WHERE attrelid = 'public.list_items'::regclass AND attname = 'user_id'
      )]
  LOOP
    EXECUTE format('ALTER TABLE public.list_items DROP CONSTRAINT %I', r.conname);
  END LOOP;
  ALTER TABLE public.list_items
    ADD CONSTRAINT list_items_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

END $$;
