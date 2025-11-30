-- ==========================================
-- FIX PUBLIC ACCESS POLICIES
-- Allow proper access to job postings, companies, and applications
-- ==========================================

-- ======================
-- JOB POSTINGS POLICIES
-- ======================

-- Drop existing policies
DROP POLICY IF EXISTS "Job postings are viewable by everyone" ON job_postings;
DROP POLICY IF EXISTS "Employers can insert their own job postings" ON job_postings;
DROP POLICY IF EXISTS "Employers can update their own job postings" ON job_postings;
DROP POLICY IF EXISTS "Employers can delete their own job postings" ON job_postings;

-- Allow everyone to view job postings
CREATE POLICY "Job postings are viewable by everyone"
ON job_postings FOR SELECT
USING (true);

-- Allow employers to insert their own job postings
CREATE POLICY "Employers can insert their own job postings"
ON job_postings FOR INSERT
WITH CHECK (auth.uid() = employer_id);

-- Allow employers to update their own job postings
CREATE POLICY "Employers can update their own job postings"
ON job_postings FOR UPDATE
USING (auth.uid() = employer_id);

-- Allow employers to delete their own job postings
CREATE POLICY "Employers can delete their own job postings"
ON job_postings FOR DELETE
USING (auth.uid() = employer_id);

-- ======================
-- COMPANIES POLICIES
-- ======================

-- Ensure companies are viewable by everyone (should already exist)
DROP POLICY IF EXISTS "Companies are viewable by everyone" ON companies;

CREATE POLICY "Companies are viewable by everyone"
ON companies FOR SELECT
USING (true);

-- ======================
-- JOB APPLICATIONS POLICIES
-- ======================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own applications" ON job_applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON job_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON job_applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON job_applications;
DROP POLICY IF EXISTS "Employers can update applications for their jobs" ON job_applications;

-- Allow users to view their own applications
CREATE POLICY "Users can view their own applications"
ON job_applications FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to create their own applications
CREATE POLICY "Users can create their own applications"
ON job_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own applications
CREATE POLICY "Users can update their own applications"
ON job_applications FOR UPDATE
USING (auth.uid() = user_id);

-- Allow employers to view applications for their jobs
CREATE POLICY "Employers can view applications for their jobs"
ON job_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM job_postings
    WHERE job_postings.id = job_applications.job_posting_id
    AND job_postings.employer_id = auth.uid()
  )
);

-- Allow employers to update application status for their jobs
CREATE POLICY "Employers can update applications for their jobs"
ON job_applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM job_postings
    WHERE job_postings.id = job_applications.job_posting_id
    AND job_postings.employer_id = auth.uid()
  )
);
