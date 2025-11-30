const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Read environment variables
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

async function listPolicies() {
  console.log('=== LISTING ALL RLS POLICIES ===\n')
  
  // Get all policies - using service role to bypass RLS
  const { data: policies, error } = await supabase
    .from('pg_policies')
    .select('*')
  
  if (error) {
    console.log('Cannot query pg_policies directly. Trying alternative...')
    // We need to run raw SQL - let me output what to check
    console.log('\nPlease run this SQL in Supabase SQL Editor to see all policies:')
    console.log(`
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'job_postings', 'companies', 'job_applications')
ORDER BY tablename, policyname;
    `)
  } else {
    console.log('Policies found:', policies)
  }
}

listPolicies()
