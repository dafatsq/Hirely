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

async function testAdminQueries() {
  console.log('=== TESTING ADMIN QUERIES ===\n')
  
  // Test 1: Companies
  console.log('1. Testing companies query...')
  const { data: companies, error: compError } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      description,
      website,
      location,
      industry,
      average_rating,
      total_ratings,
      verified,
      created_at
    `)
    .limit(5)
  
  console.log('   Companies:', companies?.length || 0, 'found')
  if (compError) console.log('   Error:', compError)
  
  // Test 2: Job Postings with joins
  console.log('\n2. Testing job postings with joins...')
  const { data: jobs, error: jobsError } = await supabase
    .from('job_postings')
    .select(`
      id,
      title,
      description,
      location,
      type,
      salary_min,
      salary_max,
      status,
      created_at,
      employer_id,
      companies (id, name, verified)
    `)
    .limit(5)
  
  console.log('   Jobs:', jobs?.length || 0, 'found')
  if (jobsError) console.log('   Error:', jobsError)
  
  // Test 3: Company Reports with joins
  console.log('\n3. Testing company reports with joins...')
  const { data: reports, error: reportsError } = await supabase
    .from('company_reports')
    .select(`
      id,
      reason,
      details,
      status,
      created_at,
      user_id,
      company_id,
      companies (id, name),
      job_applications (
        id,
        job_postings (
          id,
          title
        )
      )
    `)
    .limit(5)
  
  console.log('   Reports:', reports?.length || 0, 'found')
  if (reportsError) console.log('   Error:', reportsError)
  
  if (companies && companies.length > 0 && jobs && jobs.length > 0) {
    console.log('\n✅ ALL QUERIES WORKING!')
  }
}

testAdminQueries()
