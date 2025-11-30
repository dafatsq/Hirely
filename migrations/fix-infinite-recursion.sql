-- ==========================================
-- EMERGENCY FIX: INFINITE RECURSION IN RLS POLICIES
-- This fixes the circular dependency causing infinite recursion
-- ==========================================

-- ======================
-- STEP 1: DISABLE RLS TEMPORARILY TO FIX THE ISSUE
-- ======================

-- Temporarily disable RLS on all tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh (including all variations)
-- Users table policies
DROP POLICY IF EXISTS "Users can view all user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Job postings policies
DROP POLICY IF EXISTS "Job postings are viewable by everyone" ON public.job_postings;
DROP POLICY IF EXISTS "Anyone can view job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Employers can insert their own job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Employers can update their own job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Employers can delete their own job postings" ON public.job_postings;

-- Companies policies
DROP POLICY IF EXISTS "Companies are viewable by everyone" ON public.companies;
DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;
DROP POLICY IF EXISTS "Employers can update their company" ON public.companies;
DROP POLICY IF EXISTS "Employers can insert their company" ON public.companies;

-- Job applications policies
DROP POLICY IF EXISTS "Users can view their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Employers can update applications for their jobs" ON public.job_applications;

-- ======================
-- STEP 2: CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ======================

-- COMPANIES TABLE - Simple public read access
CREATE POLICY "Anyone can view companies"
ON public.companies FOR SELECT
USING (true);

-- JOB POSTINGS TABLE - Simple public read access
CREATE POLICY "Anyone can view job postings"
ON public.job_postings FOR SELECT
USING (true);

-- Employers can manage their own job postings
CREATE POLICY "Employers can insert their own job postings"
ON public.job_postings FOR INSERT
WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update their own job postings"
ON public.job_postings FOR UPDATE
USING (auth.uid() = employer_id);

CREATE POLICY "Employers can delete their own job postings"
ON public.job_postings FOR DELETE
USING (auth.uid() = employer_id);

-- USERS TABLE - Simple authenticated read access
CREATE POLICY "Authenticated users can view all profiles"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- JOB APPLICATIONS TABLE
-- Users can view their own applications
CREATE POLICY "Users can view their own applications"
ON public.job_applications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create applications
CREATE POLICY "Users can create applications"
ON public.job_applications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own applications
CREATE POLICY "Users can update their own applications"
ON public.job_applications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Employers can view applications for their jobs (using simple join, no recursion)
CREATE POLICY "Employers can view applications for their jobs"
ON public.job_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.job_postings jp
    WHERE jp.id = job_applications.job_posting_id
    AND jp.employer_id = auth.uid()
  )
);

-- Employers can update applications for their jobs
CREATE POLICY "Employers can update applications for their jobs"
ON public.job_applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.job_postings jp
    WHERE jp.id = job_applications.job_posting_id
    AND jp.employer_id = auth.uid()
  )
);

-- ======================
-- STEP 3: RE-ENABLE RLS
-- ======================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- ======================
-- STEP 4: VERIFY POLICIES
-- ======================

SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'job_postings', 'companies', 'job_applications')
ORDER BY tablename, policyname;
