-- ==========================================
-- AGGRESSIVE POLICY RESET
-- Remove ALL policies and start completely fresh
-- ==========================================

-- ======================
-- STEP 1: DISABLE RLS ON ALL TABLES
-- ======================

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications DISABLE ROW LEVEL SECURITY;

-- ======================
-- STEP 2: DROP EVERY SINGLE POLICY (ALL VARIATIONS)
-- ======================

-- Companies table - drop ALL policies
DROP POLICY IF EXISTS "Admins can manage all companies" ON public.companies;
DROP POLICY IF EXISTS "Any employer can create a company" ON public.companies;
DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;
DROP POLICY IF EXISTS "Anyone can view verified companies" ON public.companies;
DROP POLICY IF EXISTS "Employers can create companies" ON public.companies;
DROP POLICY IF EXISTS "Owners can update companies" ON public.companies;
DROP POLICY IF EXISTS "Public company profiles" ON public.companies;
DROP POLICY IF EXISTS "Companies are viewable by everyone" ON public.companies;
DROP POLICY IF EXISTS "Employers can update their company" ON public.companies;
DROP POLICY IF EXISTS "Employers can insert their company" ON public.companies;

-- Job postings table - drop ALL policies
DROP POLICY IF EXISTS "Admins can manage all job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Anyone can view job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Anyone can view open jobs" ON public.job_postings;
DROP POLICY IF EXISTS "Employers can create jobs" ON public.job_postings;
DROP POLICY IF EXISTS "Employers can delete own jobs" ON public.job_postings;
DROP POLICY IF EXISTS "Employers can delete their own job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Employers can insert their own job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Employers can update own jobs" ON public.job_postings;
DROP POLICY IF EXISTS "Employers can update their own job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Job postings are viewable by everyone" ON public.job_postings;

-- Users table - drop ALL policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Job applications table - drop ALL policies
DROP POLICY IF EXISTS "Admins can view all job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Employers can update application status" ON public.job_applications;
DROP POLICY IF EXISTS "Employers can update applications for their jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can delete their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can insert their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can view own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.job_applications;

-- ======================
-- STEP 3: CREATE MINIMAL, SIMPLE POLICIES
-- ======================

-- COMPANIES: Public read access (no conditions, no joins)
CREATE POLICY "public_read_companies"
ON public.companies FOR SELECT
USING (true);

-- JOB POSTINGS: Public read access (no conditions, no joins)
CREATE POLICY "public_read_jobs"
ON public.job_postings FOR SELECT
USING (true);

-- JOB POSTINGS: Employers can manage their own
CREATE POLICY "employer_insert_jobs"
ON public.job_postings FOR INSERT
WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "employer_update_jobs"
ON public.job_postings FOR UPDATE
USING (auth.uid() = employer_id);

CREATE POLICY "employer_delete_jobs"
ON public.job_postings FOR DELETE
USING (auth.uid() = employer_id);

-- USERS: Authenticated users can read (NO joins to other tables)
CREATE POLICY "auth_read_users"
ON public.users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "user_update_own"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "user_insert_own"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- JOB APPLICATIONS: Users can access their own
CREATE POLICY "user_read_own_apps"
ON public.job_applications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "user_create_apps"
ON public.job_applications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_update_own_apps"
ON public.job_applications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- JOB APPLICATIONS: Employers can view/update apps for their jobs
CREATE POLICY "employer_read_job_apps"
ON public.job_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.job_postings
    WHERE job_postings.id = job_applications.job_posting_id
    AND job_postings.employer_id = auth.uid()
  )
);

CREATE POLICY "employer_update_job_apps"
ON public.job_applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.job_postings
    WHERE job_postings.id = job_applications.job_posting_id
    AND job_postings.employer_id = auth.uid()
  )
);

-- ======================
-- STEP 4: RE-ENABLE RLS
-- ======================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- ======================
-- STEP 5: VERIFY
-- ======================

SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'job_postings', 'companies', 'job_applications')
ORDER BY tablename, policyname;
