const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function testQueries() {
  console.log('Testing admin queries...\n')

  // Test jobs with companies
  console.log('1. Fetching jobs with companies...')
  const { data: jobs, error: jobsError } = await supabase
    .from('job_postings')
    .select(`
      id,
      title,
      status,
      companies (id, name)
    `)
    .limit(3)

  if (jobsError) {
    console.error('Jobs Error:', jobsError)
  } else {
    console.log('Jobs Result:', JSON.stringify(jobs, null, 2))
  }

  // Test companies
  console.log('\n2. Fetching companies...')
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name')
    .limit(3)

  if (companiesError) {
    console.error('Companies Error:', companiesError)
  } else {
    console.log('Companies Result:', JSON.stringify(companies, null, 2))
  }

  // Test reports
  console.log('\n3. Fetching reports...')
  const { data: reports, error: reportsError } = await supabase
    .from('company_reports')
    .select('id, reason, status')
    .limit(3)

  if (reportsError) {
    console.error('Reports Error:', reportsError)
  } else {
    console.log('Reports Result:', JSON.stringify(reports, null, 2))
  }
}

testQueries().catch(console.error)
