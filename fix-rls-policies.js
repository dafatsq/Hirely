const { createClient } = require('@supabase/supabase-js')

// Read environment variables directly
const fs = require('fs')
const envContent = fs.readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAndFixPolicies() {
  console.log('Checking RLS policies...\n')
  
  // Check users table policies
  console.log('1. Checking users table RLS status:')
  const checkUsersRLS = `
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'users';
  `
  
  // Check job_applications table policies
  console.log('2. Checking job_applications table RLS status:')
  const checkAppsRLS = `
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'job_applications';
  `
  
  // List all policies on these tables
  console.log('3. Listing all policies:')
  const listPolicies = `
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
    FROM pg_policies
    WHERE tablename IN ('users', 'job_applications')
    ORDER BY tablename, policyname;
  `
  
  // Apply the fix from add-users-select-policy.sql
  console.log('\n4. Applying users table policies...')
  const fixUsersPolicies = `
    -- Enable RLS on users table if not already enabled
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
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
  `
  
  const { data: fixData, error: fixError } = await supabase.rpc('exec_sql', { sql: fixUsersPolicies })
  console.log('Result:', fixData)
  console.log('Error:', fixError)
  
  // Apply the fix from fix-public-access-policies.sql
  console.log('\n5. Applying job_applications table policies...')
  const fixAppsPolicies = `
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
  `
  
  const { data: appsData, error: appsError } = await supabase.rpc('exec_sql', { sql: fixAppsPolicies })
  console.log('Result:', appsData)
  console.log('Error:', appsError)
  
  console.log('\nDone! Policies should be fixed now.')
}

checkAndFixPolicies()
