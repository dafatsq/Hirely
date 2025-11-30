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

async function checkColumns() {
  console.log('=== CHECKING ACTUAL TABLE COLUMNS ===\n')
  
  // Test with wildcard to see all columns
  console.log('1. Companies table - actual data:')
  const { data: companies, error: compError } = await supabase
    .from('companies')
    .select('*')
    .limit(1)
  
  if (companies && companies[0]) {
    console.log('   Columns:', Object.keys(companies[0]))
  }
  if (compError) console.log('   Error:', compError)
  
  console.log('\n2. Job postings table - actual data:')
  const { data: jobs, error: jobsError } = await supabase
    .from('job_postings')
    .select('*')
    .limit(1)
  
  if (jobs && jobs[0]) {
    console.log('   Columns:', Object.keys(jobs[0]))
  }
  if (jobsError) console.log('   Error:', jobsError)
  
  console.log('\n3. Company reports table - actual data:')
  const { data: reports, error: reportsError} = await supabase
    .from('company_reports')
    .select('*')
    .limit(1)
  
  if (reports && reports[0]) {
    console.log('   Columns:', Object.keys(reports[0]))
  }
  if (reportsError) console.log('   Error:', reportsError)
}

checkColumns()
