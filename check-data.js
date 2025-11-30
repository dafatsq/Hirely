const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkData() {
  console.log('Checking data in database...\n')

  // Check job postings
  const { data: jobs, error: jobsError, count: jobsCount } = await supabase
    .from('job_postings')
    .select('*', { count: 'exact', head: true })

  if (jobsError) {
    console.error('Error fetching jobs:', jobsError)
  } else {
    console.log(`✓ Total Job Postings: ${jobsCount}`)
  }

  // Check companies
  const { data: companies, error: companiesError, count: companiesCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })

  if (companiesError) {
    console.error('Error fetching companies:', companiesError)
  } else {
    console.log(`✓ Total Companies: ${companiesCount}`)
  }

  // Check reports
  const { data: reports, error: reportsError, count: reportsCount } = await supabase
    .from('company_reports')
    .select('*', { count: 'exact', head: true })

  if (reportsError) {
    console.error('Error fetching reports:', reportsError)
  } else {
    console.log(`✓ Total Company Reports: ${reportsCount}`)
  }

  // Check users
  const { data: users, error: usersError, count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  if (usersError) {
    console.error('Error fetching users:', usersError)
  } else {
    console.log(`✓ Total Users: ${usersCount}`)
  }

  // Sample a few jobs
  const { data: sampleJobs } = await supabase
    .from('job_postings')
    .select('id, title, status')
    .limit(5)

  if (sampleJobs && sampleJobs.length > 0) {
    console.log('\nSample Jobs:')
    sampleJobs.forEach(job => {
      console.log(`  - ${job.title} (${job.status})`)
    })
  }

  // Sample companies
  const { data: sampleCompanies } = await supabase
    .from('companies')
    .select('id, name')
    .limit(5)

  if (sampleCompanies && sampleCompanies.length > 0) {
    console.log('\nSample Companies:')
    sampleCompanies.forEach(company => {
      console.log(`  - ${company.name}`)
    })
  }
}

checkData().catch(console.error)
