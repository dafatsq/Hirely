const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCompanyInsert() {
  console.log('Testing company insert...\n')
  
  // First, let's check the current policies
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const adminClient = createClient(supabaseUrl, serviceKey)
  
  const { data: policies, error: policiesError } = await adminClient
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'companies')
  
  if (policiesError) {
    console.log('Note: Could not fetch policies (expected if pg_policies not accessible)')
  } else {
    console.log('Current policies on companies table:')
    policies.forEach(p => {
      console.log(`  - ${p.policyname} (${p.cmd})`)
    })
    console.log()
  }
  
  // Check table structure
  const { data: columns, error: columnsError } = await adminClient
    .rpc('exec_sql', { 
      sql_query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'companies'
        ORDER BY ordinal_position;
      `
    })
  
  if (!columnsError && columns) {
    console.log('Companies table columns:')
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`)
    })
    console.log()
  }
  
  // Try to insert a test company (without auth - will fail)
  console.log('Attempting insert without authentication...')
  const { data: noAuthData, error: noAuthError } = await supabase
    .from('companies')
    .insert({
      name: 'Test Company',
      description: 'Test description',
      website: 'https://test.com'
    })
    .select()
  
  if (noAuthError) {
    console.log('❌ Expected error (no auth):', noAuthError.message)
  } else {
    console.log('✅ Surprisingly succeeded without auth:', noAuthData)
  }
  
  console.log('\n📝 Summary:')
  console.log('To test with actual authentication, you need to:')
  console.log('1. Be logged in as an employer in the browser')
  console.log('2. Try creating a company through the UI')
  console.log('3. Check the browser console (F12) for detailed error messages')
}

testCompanyInsert()
