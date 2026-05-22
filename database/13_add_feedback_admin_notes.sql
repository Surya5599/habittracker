-- Admin triage tracking for feedback issues
ALTER TABLE public.feedback
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_worked_on_at TIMESTAMP WITH TIME ZONE;
