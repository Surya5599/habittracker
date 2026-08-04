-- The feedback table had RLS enabled with no UPDATE policy at all, so every
-- admin action that updates it (Lock Away, Mark Complete, Restore, and the
-- status='replied' update after an admin reply) was silently updating zero
-- rows: no error, but nothing persisted, so it reverted on refresh.
CREATE POLICY "Update Feedback: Admin only"
ON feedback
FOR UPDATE
USING (lower((auth.jwt() ->> 'email'::text)) = lower('knowheredeveloper@gmail.com'::text))
WITH CHECK (lower((auth.jwt() ->> 'email'::text)) = lower('knowheredeveloper@gmail.com'::text));
