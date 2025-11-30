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
    console.log('Fixing company verified default value...\n')
    
    const sql = `ALTER TABLE public.companies ALTER COLUMN verified SET DEFAULT false;`
    
    console.log('Executing:', sql)
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('Error:', error)
      console.log('\n📝 Please run this SQL in Supabase SQL Editor:')
      console.log('='.repeat(60))
      console.log(sql)
      console.log('='.repeat(60))
      throw error
    }
    
    if (data) {
      console.log('Result:', JSON.stringify(data, null, 2))
    }
    
    console.log('\n✅ Default value changed successfully!')
    console.log('New companies will now default to verified = false')
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\nRun this SQL in Supabase Dashboard:')
    console.log('ALTER TABLE public.companies ALTER COLUMN verified SET DEFAULT false;')
    process.exit(1)
  }
}

runMigration()
