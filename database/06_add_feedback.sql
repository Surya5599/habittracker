-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to insert feedback
CREATE POLICY "Enable insert for all users" ON public.feedback
    FOR INSERT WITH CHECK (true);

-- Only allow authenticated users to view their own feedback (optional, but good practice)
-- CREATE POLICY "Users can view own feedback" ON public.feedback
--     FOR SELECT USING (auth.uid() = user_id);
