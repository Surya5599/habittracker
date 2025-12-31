-- Create the daily_tips table
CREATE TABLE daily_tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    icon TEXT DEFAULT 'lightbulb',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial seed data
INSERT INTO daily_tips (text, icon) VALUES
    ('Did you know? If you complete your day, you can share a HabiCard celebrating your achievement on social media.', 'lightbulb'),
    ('Enjoying the app? Consider supporting the project with a coffee to help keep it free and ad-free.', 'coffee'),
    ('Consistency is key. Even a small step each day adds up to big results over time.', 'lightbulb'),
    ('Use the "My Habits" menu to customize your tracking and set colors that motivate you.', 'lightbulb'),
    ('Check your Monthly view to spot trends and identify which days you''re most productive.', 'lightbulb'),
    ('Missed a day? Don''t worry. The most important habit is getting back on track.', 'lightbulb'),
    ('Review your Annual Performance in the Dashboard to see your long-term growth.', 'lightbulb'),
    ('Toggle between Line and Bar charts in the header to visualize your progress differently.', 'lightbulb'),
    ('You can use "Guest Mode" to try out features, but Sign In to sync across devices.', 'lightbulb'),
    ('Setting too many habits at once can be overwhelming. Start with 3 core habits.', 'lightbulb');

-- Enable Row Level Security
ALTER TABLE daily_tips ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON daily_tips
    FOR SELECT
    USING (true);
