const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixCompanyPolicy() {
  try {
    console.log('Dropping old policy...')
    
    // Drop the old policy
    let { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: 'DROP POLICY IF EXISTS "auth_users_insert_companies" ON public.companies;'
    })
    
    if (error) throw error
    console.log('✓ Old policy dropped')
    
    console.log('\nCreating new employer policy...')
    
    // Create new policy
    const createPolicy = `
CREATE POLICY "employers_insert_companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'employer'
  )
);`
    
    const result = await supabase.rpc('exec_sql', { sql_query: createPolicy })
    
    if (result.error) throw result.error
    console.log('✓ New policy created')
    
    console.log('\n✅ Company insert policy fixed successfully!')
    console.log('\n📝 Now employers with role="employer" can create companies')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

fixCompanyPolicy()
