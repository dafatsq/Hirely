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

async function testQuery() {
  console.log('Testing applications query...')
  
  // First, let's see what users we have
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('role', 'jobseeker')
    .limit(5)
  
  console.log('\nJobseekers:', users)
  
  if (users && users.length > 0) {
    const testUserId = users[0].id
    console.log('\nTesting with user:', testUserId)
    
    // Test the current query
    const { data: applications, error } = await supabase
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
      .order('applied_at', { ascending: false })
    
    console.log('\nApplications:', applications)
    console.log('\nError:', error)
    
    // Try simpler query
    const { data: simple, error: simpleError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', testUserId)
    
    console.log('\nSimple query applications:', simple)
    console.log('Simple query error:', simpleError)
  }
}

testQuery()
