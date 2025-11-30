import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local manually
const envFile = readFileSync('.env.local', 'utf8')
const envVars = {}
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=')
  if (key && values.length) {
    envVars[key.trim()] = values.join('=').trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkRatings() {
  console.log('🔍 Checking companies table structure...\n')

  // Check if columns exist
  const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      AND column_name IN ('average_rating', 'total_ratings')
      ORDER BY column_name;
    `
  })

  if (columnsError) {
    console.log('⚠️  Cannot check columns (RPC might not exist). Checking data directly...\n')
  } else if (columns && columns.length > 0) {
    console.log('✅ Rating columns exist:')
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`)
    })
    console.log()
  } else {
    console.log('❌ Rating columns NOT found in companies table!\n')
  }

  // Check companies data
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name, average_rating, total_ratings')
    .limit(5)

  if (companiesError) {
    console.error('❌ Error fetching companies:', companiesError.message)
    console.log('\n🔧 The columns likely don\'t exist. Run the migration:\n')
    console.log('   psql -d your_database -f migrations/create-company-ratings.sql\n')
    return
  }

  if (companies && companies.length > 0) {
    console.log('📊 Sample companies data:')
    companies.forEach(company => {
      console.log(`   ${company.name}: ${company.average_rating || 0} stars (${company.total_ratings || 0} ratings)`)
    })
    console.log()
  }

  // Check if company_ratings table exists
  const { data: ratings, error: ratingsError } = await supabase
    .from('company_ratings')
    .select('count')
    .limit(1)

  if (ratingsError) {
    console.error('❌ company_ratings table does not exist!')
    console.log('   Run: psql -d your_database -f migrations/create-company-ratings.sql\n')
  } else {
    const { count } = await supabase
      .from('company_ratings')
      .select('*', { count: 'exact', head: true })

    console.log(`✅ company_ratings table exists with ${count || 0} ratings\n`)
  }

  // Test query that matches the app
  const { data: jobTest, error: jobError } = await supabase
    .from('job_postings')
    .select('id, title, companies!inner(name, average_rating, total_ratings)')
    .eq('status', 'open')
    .limit(3)

  if (jobError) {
    console.error('❌ Error testing job query:', jobError.message)
  } else if (jobTest && jobTest.length > 0) {
    console.log('🎯 Test job query results:')
    jobTest.forEach(job => {
      const company = job.companies
      const rating = Array.isArray(company) ? company[0]?.average_rating : company?.average_rating
      const total = Array.isArray(company) ? company[0]?.total_ratings : company?.total_ratings
      const name = Array.isArray(company) ? company[0]?.name : company?.name
      console.log(`   ${job.title} @ ${name}: ${rating || 0} stars (${total || 0} ratings)`)
    })
  }
}

checkRatings().catch(console.error)
