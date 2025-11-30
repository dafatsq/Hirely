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

async function checkApplications() {
  console.log('Checking job_applications table...\n')
  
  // Get all applications
  const { data: allApps, error: allError } = await supabase
    .from('job_applications')
    .select('*')
    .limit(10)
  
  console.log('Total applications found:', allApps?.length || 0)
  console.log('Applications:', JSON.stringify(allApps, null, 2))
  console.log('Error:', allError)
  
  // Check if table exists and its structure
  const { data: columns, error: schemaError } = await supabase
    .rpc('exec_sql', { 
      sql: `SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'job_applications' 
            ORDER BY ordinal_position` 
    })
  
  console.log('\nTable schema:', columns)
  console.log('Schema error:', schemaError)
}

checkApplications()
