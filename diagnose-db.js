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

async function diagnoseIssue() {
  console.log('=== DIAGNOSING DATABASE CONNECTIVITY ===\n')
  
  // 1. Check if we can connect at all
  console.log('1. Testing basic database connection...')
  const { data: testConn, error: connError } = await supabase
    .from('companies')
    .select('id')
    .limit(1)
  
  console.log('   Connection:', connError ? '❌ FAILED' : '✅ SUCCESS')
  if (connError) console.log('   Error:', connError)
  
  // 2. Check job_postings table and RLS
  console.log('\n2. Checking job_postings table...')
  const { data: jobs, error: jobsError } = await supabase
    .from('job_postings')
    .select('id, title, employer_id')
    .limit(5)
  
  console.log('   Jobs found:', jobs?.length || 0)
  console.log('   Error:', jobsError)
  if (jobs) {
    console.log('   Sample jobs:', jobs.map(j => `${j.title} (employer: ${j.employer_id})`))
  }
  
  // 3. Check companies table
  console.log('\n3. Checking companies table...')
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name')
    .limit(5)
  
  console.log('   Companies found:', companies?.length || 0)
  console.log('   Error:', companiesError)
  
  // 4. Check users table
  console.log('\n4. Checking users table...')
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, role')
    .limit(5)
  
  console.log('   Users found:', users?.length || 0)
  console.log('   Error:', usersError)
  
  // 5. Check RLS status on all tables
  console.log('\n5. Checking RLS status on critical tables...')
  const tables = ['job_postings', 'companies', 'users', 'job_applications']
  
  for (const table of tables) {
    const { data, error } = await supabase.rpc('check_rls_status', { table_name: table })
    
    if (error) {
      // Try alternative query
      console.log(`   ${table}: Checking...`)
      const { data: testData, error: testError } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      console.log(`     Can query: ${testError ? '❌ NO' : '✅ YES'}`)
      if (testError) console.log(`     Error:`, testError.message)
    }
  }
  
  // 6. Check if anon key can access job_postings (it should)
  console.log('\n6. Testing with anon key (public access)...')
  const anonClient = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  const { data: publicJobs, error: publicJobsError } = await anonClient
    .from('job_postings')
    .select('id, title')
    .limit(3)
  
  console.log('   Jobs visible to public:', publicJobs?.length || 0)
  console.log('   Error:', publicJobsError)
  
  const { data: publicCompanies, error: publicCompError } = await anonClient
    .from('companies')
    .select('id, name')
    .limit(3)
  
  console.log('   Companies visible to public:', publicCompanies?.length || 0)
  console.log('   Error:', publicCompError)
  
  // 7. Check auth.users
  console.log('\n7. Checking auth system...')
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
  
  console.log('   Auth users in system:', authData?.users?.length || 0)
  console.log('   Error:', authError)
  
  console.log('\n=== DIAGNOSIS COMPLETE ===')
  console.log('\nISSUES FOUND:')
  
  const issues = []
  if (connError) issues.push('❌ Cannot connect to database')
  if (!jobs || jobs.length === 0) issues.push('❌ No job postings found')
  if (!companies || companies.length === 0) issues.push('❌ No companies found')
  if (!users || users.length === 0) issues.push('❌ No users found')
  if (publicJobsError) issues.push('❌ Public cannot view job postings (RLS blocking)')
  if (publicCompError) issues.push('❌ Public cannot view companies (RLS blocking)')
  
  if (issues.length === 0) {
    console.log('✅ Database appears healthy')
    console.log('   Issue is likely with authentication or session handling')
  } else {
    issues.forEach(issue => console.log(issue))
  }
}

diagnoseIssue()
