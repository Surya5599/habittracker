INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'feedback-attachments',
    'feedback-attachments',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Feedback attachments are viewable by anyone" ON storage.objects;
CREATE POLICY "Feedback attachments are viewable by anyone"
ON storage.objects
FOR SELECT
USING (bucket_id = 'feedback-attachments');

DROP POLICY IF EXISTS "Feedback attachments can be uploaded by anyone" ON storage.objects;
CREATE POLICY "Feedback attachments can be uploaded by anyone"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'feedback-attachments');
