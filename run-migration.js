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

async function runMigration() {
  console.log('Running RLS policies fix...\n')
  
  // Read the migration file
  const sqlContent = fs.readFileSync('migrations/fix-jobseeker-access.sql', 'utf8')
  
  // Split into individual statements (rough split, but should work)
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s !== '')
  
  console.log(`Found ${statements.length} SQL statements to execute\n`)
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';'
    
    // Skip comments and empty lines
    if (stmt.trim().startsWith('--') || stmt.trim() === ';') {
      continue
    }
    
    console.log(`Executing statement ${i + 1}/${statements.length}...`)
    console.log(stmt.substring(0, 80) + (stmt.length > 80 ? '...' : ''))
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query: stmt })
      
      if (error) {
        // Try alternative: direct query
        const { data: data2, error: error2 } = await supabase.from('_').select('*').limit(0)
        console.log('  Note: exec_sql not available, trying manual execution')
        console.log('  You may need to run this SQL in the Supabase SQL Editor')
        errorCount++
      } else {
        console.log('  ✓ Success')
        successCount++
      }
    } catch (e) {
      console.log('  ✗ Error:', e.message)
      errorCount++
    }
    
    console.log('')
  }
  
  console.log(`\n========================================`)
  console.log(`Migration Complete`)
  console.log(`Success: ${successCount} statements`)
  console.log(`Errors: ${errorCount} statements`)
  console.log(`========================================\n`)
  
  if (errorCount > 0) {
    console.log('⚠️  Some statements failed.')
    console.log('Please run the SQL file manually in your Supabase SQL Editor:')
    console.log('  1. Go to your Supabase project dashboard')
    console.log('  2. Click on "SQL Editor" in the left sidebar')
    console.log('  3. Create a new query')
    console.log('  4. Copy and paste the content of migrations/fix-jobseeker-access.sql')
    console.log('  5. Click "Run" to execute\n')
  } else {
    console.log('✓ All policies have been applied successfully!')
  }
  
  // Test the fix
  console.log('\nTesting the fix...')
  const testUserId = 'ee6c6478-5052-4bff-8122-f4014ad5c302'
  
  const { data: testApps, error: testError } = await supabase
    .from('job_applications')
    .select('id, status, user_id')
    .eq('user_id', testUserId)
  
  console.log('Test query result:', testApps?.length, 'applications found')
  console.log('Test error:', testError)
}

runMigration()
