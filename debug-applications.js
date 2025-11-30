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

async function testUserQuery() {
  const testUserId = 'ee6c6478-5052-4bff-8122-f4014ad5c302'
  
  console.log('Testing with user:', testUserId)
  console.log('\n1. Simple query:')
  const { data: simple, error: simpleError } = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', testUserId)
  
  console.log('Result:', simple?.length, 'applications')
  console.log('Error:', simpleError)
  
  console.log('\n2. Query with job_postings join:')
  const { data: withJob, error: jobError } = await supabase
    .from('job_applications')
    .select('id, status, applied_at, job_postings(id, title, location, company_id)')
    .eq('user_id', testUserId)
  
  console.log('Result:', withJob?.length, 'applications')
  console.log('Data:', JSON.stringify(withJob, null, 2))
  console.log('Error:', jobError)
  
  console.log('\n3. Query with inner join and companies:')
  const { data: fullQuery, error: fullError } = await supabase
    .from('job_applications')
    .select(`
      id,
      status,
      applied_at,
      job_postings!inner (
        id,
        title,
        location,
        company_id,
        companies!inner (id, name)
      )
    `)
    .eq('user_id', testUserId)
  
  console.log('Result:', fullQuery?.length, 'applications')
  console.log('Data:', JSON.stringify(fullQuery, null, 2))
  console.log('Error:', fullError)
  
  // Check the job posting
  if (simple && simple.length > 0) {
    const jobId = simple[0].job_posting_id
    console.log('\n4. Checking job posting:', jobId)
    const { data: job, error: jobCheckError } = await supabase
      .from('job_postings')
      .select('id, title, location, company_id, companies(id, name)')
      .eq('id', jobId)
      .single()
    
    console.log('Job data:', JSON.stringify(job, null, 2))
    console.log('Error:', jobCheckError)
  }
}

testUserQuery()
