-- ==========================================
-- FIX APPLICATION ACCESS FOR JOBSEEKERS
-- Re-apply RLS policies to ensure jobseekers can access their applications
-- ==========================================

-- ======================
-- USERS TABLE POLICIES
-- ======================

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Allow all authenticated users to view all user profiles
CREATE POLICY "Users can view all user profiles" ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ======================
-- JOB APPLICATIONS POLICIES
-- ======================

-- Enable RLS on job_applications table
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own applications" ON job_applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON job_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON job_applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON job_applications;
DROP POLICY IF EXISTS "Employers can update applications for their jobs" ON job_applications;

-- Allow users to view their own applications
CREATE POLICY "Users can view their own applications"
ON job_applications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to create their own applications
CREATE POLICY "Users can create their own applications"
ON job_applications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own applications
CREATE POLICY "Users can update their own applications"
ON job_applications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow employers to view applications for their jobs
CREATE POLICY "Employers can view applications for their jobs"
ON job_applications FOR SELECT
TO authenticated
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
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM job_postings
    WHERE job_postings.id = job_applications.job_posting_id
    AND job_postings.employer_id = auth.uid()
  )
);

-- ======================
-- VERIFY POLICIES
-- ======================

-- List all policies to verify
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as check_clause
FROM pg_policies
WHERE tablename IN ('users', 'job_applications')
ORDER BY tablename, policyname;
