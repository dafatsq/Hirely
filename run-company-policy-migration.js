const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    const sql = fs.readFileSync('migrations/add-company-insert-policy.sql', 'utf8')
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 100) + '...')
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement })
      
      if (error) {
        console.error('Error:', error)
        throw error
      }
      
      if (data) {
        console.log('Result:', JSON.stringify(data, null, 2))
      }
    }
    
    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

runMigration()
