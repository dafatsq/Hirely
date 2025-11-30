const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

async function runSQL() {
  try {
    console.log('Running SQL to fix company policy...\n')
    
    // We'll use POST to the PostgREST endpoint directly
    const sql = `
-- Drop old policy
DROP POLICY IF EXISTS "auth_users_insert_companies" ON public.companies;

-- Create new policy requiring employer role
CREATE POLICY "employers_insert_companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'employer'
  )
);
`
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    })
    
    if (!response.ok) {
      // Try alternative: Just tell user to run it manually
      console.log('⚠️  Cannot execute SQL automatically.')
      console.log('\n📝 Please run this SQL in your Supabase SQL Editor:\n')
      console.log('='.repeat(60))
      console.log(sql)
      console.log('='.repeat(60))
      console.log('\nOR go to: https://supabase.com/dashboard/project/_/sql')
      return
    }
    
    console.log('✅ Policy updated successfully!')
    
  } catch (error) {
    console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:\n')
    console.log('='.repeat(60))
    console.log(`
-- Drop old policy
DROP POLICY IF EXISTS "auth_users_insert_companies" ON public.companies;

-- Create new policy requiring employer role
CREATE POLICY "employers_insert_companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'employer'
  )
);
`)
    console.log('='.repeat(60))
  }
}

runSQL()
