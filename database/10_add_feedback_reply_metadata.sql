ALTER TABLE public.feedback_replies
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
