-- Achievement definitions and per-user unlock tracking
-- This version uses auth.users directly and does not depend on public.profiles

CREATE TABLE IF NOT EXISTS public.achievement_definitions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('core', 'rare', 'elite', 'legend')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    source_year INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT user_achievements_user_badge_unique UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS user_achievements_user_id_idx
    ON public.user_achievements(user_id);

CREATE INDEX IF NOT EXISTS user_achievements_achievement_id_idx
    ON public.user_achievements(achievement_id);

CREATE INDEX IF NOT EXISTS user_achievements_unlocked_at_idx
    ON public.user_achievements(unlocked_at DESC);

ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'achievement_definitions'
          AND policyname = 'Achievement definitions are readable'
    ) THEN
        CREATE POLICY "Achievement definitions are readable"
        ON public.achievement_definitions
        FOR SELECT
        USING (TRUE);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'user_achievements'
          AND policyname = 'Users can read their own achievements'
    ) THEN
        CREATE POLICY "Users can read their own achievements"
        ON public.user_achievements
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'user_achievements'
          AND policyname = 'Users can insert their own achievements'
    ) THEN
        CREATE POLICY "Users can insert their own achievements"
        ON public.user_achievements
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

INSERT INTO public.achievement_definitions (id, title, description, tier)
VALUES
    ('first-perfect-day', 'Perfect Day', 'Complete every habit due on a single day.', 'core'),
    ('ten-perfect-days', 'Clean Sheet', 'Log 10 perfect days in a year.', 'rare'),
    ('perfect-week', 'Perfect Week', 'Finish a full week at 100%.', 'rare'),
    ('perfect-month', 'Perfect Month', 'Close an entire month without a miss.', 'elite'),
    ('perfect-year', 'Perfect Year', 'Hold 100% consistency across the whole year.', 'legend'),
    ('eighty-year', '80% Year', 'Log at least 80% follow-through across the year.', 'elite'),
    ('ninety-year', '90% Year', 'Keep your yearly consistency above 90%.', 'legend'),
    ('log-80-days', '80% of the Year', 'Show up on at least 80% of trackable days.', 'elite'),
    ('century-club', 'Century Club', 'Log 100 active days in a single year.', 'core'),
    ('double-century', 'Double Century', 'Log 200 active days in a year.', 'rare'),
    ('month-machine', 'Month Machine', 'Finish 6 months at 80% or better.', 'rare'),
    ('golden-calendar', 'Golden Calendar', 'Finish 12 months at 90% or better.', 'legend'),
    ('thirty-streak', '30 Day Run', 'Reach a 30 day streak.', 'core'),
    ('hundred-streak', '100 Day Run', 'Reach a 100 day streak.', 'elite'),
    ('year-streak', '365 Day Run', 'Hold a full year streak without breaking.', 'legend'),
    ('hot-start', 'Hot Start', 'Build a live streak of 14 days right now.', 'core'),
    ('habit-squad', 'Habit Squad', 'Keep 3 habits above 80% completion.', 'rare'),
    ('precision-stack', 'Precision Stack', 'Keep 2 habits above 95% completion.', 'elite'),
    ('full-roster', 'Full Roster', 'Log activity on 10 different habits in a year.', 'rare'),
    ('peak-month', 'Peak Month', 'Hit 95% in your best month.', 'elite'),
    ('all-season', 'All Season', 'Log something in every completed month.', 'rare')
ON CONFLICT (id) DO UPDATE
SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    tier = EXCLUDED.tier,
    is_active = TRUE;

CREATE OR REPLACE VIEW public.achievement_stats AS
SELECT
    a.id,
    a.title,
    a.tier,
    COUNT(ua.user_id) AS unlock_count,
    ROUND(
        100.0 * COUNT(ua.user_id)::NUMERIC
        / NULLIF((SELECT COUNT(*) FROM auth.users), 0),
        2
    ) AS unlock_percent
FROM public.achievement_definitions a
LEFT JOIN public.user_achievements ua
    ON ua.achievement_id = a.id
GROUP BY a.id, a.title, a.tier;

CREATE OR REPLACE FUNCTION public.log_user_achievement(
    p_achievement_id TEXT,
    p_source_year INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS public.user_achievements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_row public.user_achievements;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    INSERT INTO public.user_achievements (user_id, achievement_id, source_year, metadata)
    VALUES (v_user_id, p_achievement_id, p_source_year, COALESCE(p_metadata, '{}'::jsonb))
    ON CONFLICT (user_id, achievement_id) DO UPDATE
    SET
        source_year = COALESCE(EXCLUDED.source_year, public.user_achievements.source_year),
        metadata = public.user_achievements.metadata || EXCLUDED.metadata
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

GRANT SELECT ON public.achievement_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_achievement(TEXT, INTEGER, JSONB) TO authenticated;
