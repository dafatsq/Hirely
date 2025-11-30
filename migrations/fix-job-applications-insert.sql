-- ==========================================
-- FIX JOB APPLICATIONS - ADD INSERT POLICY
-- ==========================================
-- This allows authenticated users to submit job applications
-- ==========================================

-- Allow authenticated users to insert their own applications
CREATE POLICY "Users can insert their own applications"
  ON job_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own applications
CREATE POLICY "Users can view their own applications"
  ON job_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own applications (e.g., withdraw)
CREATE POLICY "Users can update their own applications"
  ON job_applications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own applications
CREATE POLICY "Users can delete their own applications"
  ON job_applications FOR DELETE
  USING (auth.uid() = user_id);
