-- ==========================================
-- REFACTOR USERS HIERARCHY
-- ==========================================
-- Split users table into users (base), job_seekers, employers, admins
-- ==========================================

-- 1. Create Child Tables

CREATE TABLE IF NOT EXISTS public.job_seekers (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    skills TEXT[] DEFAULT '{}',
    resume_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employers (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Migrate Data

-- Migrate Job Seekers
INSERT INTO public.job_seekers (user_id, skills)
SELECT id, skills FROM public.users WHERE role = 'jobseeker'
ON CONFLICT (user_id) DO NOTHING;

-- Migrate Employers
INSERT INTO public.employers (user_id, company_id)
SELECT id, company_id FROM public.users WHERE role = 'employer'
ON CONFLICT (user_id) DO NOTHING;

-- Migrate Admins
INSERT INTO public.admins (user_id)
SELECT id FROM public.users WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- 3. Update Trigger Function for New Users

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'jobseeker');

  -- Insert into base users table
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    email = COALESCE(EXCLUDED.email, public.users.email),
    role = COALESCE(EXCLUDED.role, public.users.role);

  -- Insert into child tables based on role
  IF user_role = 'jobseeker' THEN
    INSERT INTO public.job_seekers (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF user_role = 'employer' THEN
    INSERT INTO public.employers (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF user_role = 'admin' THEN
    INSERT INTO public.admins (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update Helper Functions and Triggers

-- Update check_employer_company_match to use employers table
CREATE OR REPLACE FUNCTION check_employer_company_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the employer belongs to the company they're posting for
  IF NOT EXISTS (
    SELECT 1 FROM employers 
    WHERE user_id = NEW.employer_id 
    AND company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'You can only post jobs for your company';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Update RLS Policies

-- Update "Employers can update their company" policy
DROP POLICY IF EXISTS "Employers can update their company" ON companies;
CREATE POLICY "Employers can update their company"
ON companies FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM employers 
    WHERE user_id = auth.uid() 
    AND company_id = companies.id
  )
);

-- Add RLS for new tables
ALTER TABLE public.job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Job Seekers policies
CREATE POLICY "Job seekers can view their own profile" ON public.job_seekers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Job seekers can update their own profile" ON public.job_seekers
    FOR UPDATE USING (auth.uid() = user_id);
    
-- Allow employers to view job seekers (for applications) - simplified for now
CREATE POLICY "Employers can view job seekers" ON public.job_seekers
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'employer'));

-- Employers policies
CREATE POLICY "Employers can view their own profile" ON public.employers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Employers can update their own profile" ON public.employers
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. Drop Columns from Users Table
-- WARNING: This is destructive. Ensure code is updated.
ALTER TABLE public.users DROP COLUMN IF EXISTS skills;
ALTER TABLE public.users DROP COLUMN IF EXISTS company_id;
