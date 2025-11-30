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

// Create two clients - one with service role, one simulating a user
const adminClient = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

const userClient = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testPolicies() {
  const testUserId = 'ee6c6478-5052-4bff-8122-f4014ad5c302'
  
  console.log('Testing RLS policies...\n')
  
  // Check if RLS is enabled
  console.log('1. Checking if RLS is enabled on job_applications:')
  const { data: rlsStatus, error: rlsError } = await adminClient
    .from('pg_tables')
    .select('*')
    .eq('tablename', 'job_applications')
  
  console.log('RLS Check:', rlsStatus)
  console.log('Error:', rlsError)
  
  // Test with admin client (service role)
  console.log('\n2. Admin client query (service role):')
  const { data: adminData, error: adminError } = await adminClient
    .from('job_applications')
    .select('*')
    .eq('user_id', testUserId)
  
  console.log('Result:', adminData?.length, 'applications')
  console.log('Error:', adminError)
  
  // Test with user client (anon key - should fail without auth)
  console.log('\n3. User client query without auth (should be empty):')
  const { data: unauthData, error: unauthError } = await userClient
    .from('job_applications')
    .select('*')
    .eq('user_id', testUserId)
  
  console.log('Result:', unauthData?.length || 0, 'applications')
  console.log('Error:', unauthError)
  
  // Get the user's auth token to simulate authenticated request
  console.log('\n4. Getting user auth info:')
  const { data: authUsers, error: authError } = await adminClient
    .from('auth.users')
    .select('*')
    .eq('id', testUserId)
  
  console.log('Auth user found:', authUsers ? 'Yes' : 'No')
  console.log('Error:', authError)
  
  // Check policies
  console.log('\n5. Checking policies on job_applications:')
  const { data: policies, error: policyError } = await adminClient
    .rpc('pg_policies')
    .select('*')
  
  console.log('Policies:', policies)
  console.log('Error:', policyError)
}

testPolicies()
