const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceKey)

async function checkCompanyTable() {
  console.log('Checking companies table structure...\n')
  
  // Get all columns with constraints
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: `
      SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        (SELECT COUNT(*) 
         FROM information_schema.key_column_usage kcu
         JOIN information_schema.table_constraints tc 
           ON kcu.constraint_name = tc.constraint_name
         WHERE tc.constraint_type = 'PRIMARY KEY'
           AND kcu.table_name = 'companies'
           AND kcu.column_name = c.column_name) as is_pk,
        (SELECT COUNT(*) 
         FROM information_schema.key_column_usage kcu
         JOIN information_schema.table_constraints tc 
           ON kcu.constraint_name = tc.constraint_name
         WHERE tc.constraint_type = 'FOREIGN KEY'
           AND kcu.table_name = 'companies'
           AND kcu.column_name = c.column_name) as is_fk
      FROM information_schema.columns c
      WHERE c.table_schema = 'public' 
        AND c.table_name = 'companies'
      ORDER BY c.ordinal_position;
    `
  })
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('Columns:')
  data.forEach(col => {
    const nullable = col.is_nullable === 'YES' ? '✓ nullable' : '✗ required'
    const pk = col.is_pk > 0 ? ' [PK]' : ''
    const fk = col.is_fk > 0 ? ' [FK]' : ''
    const def = col.column_default ? ` (default: ${col.column_default})` : ''
    console.log(`  ${col.column_name}: ${col.data_type} ${nullable}${pk}${fk}${def}`)
  })
  
  console.log('\n\nChecking RLS policies...\n')
  
  const { data: policies, error: polError } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT 
        policyname,
        cmd,
        roles::text[],
        qual,
        with_check
      FROM pg_policies
      WHERE tablename = 'companies';
    `
  })
  
  if (polError) {
    console.error('Error fetching policies:', polError)
  } else {
    console.log('RLS Policies on companies table:')
    policies.forEach(p => {
      console.log(`\n  Policy: ${p.policyname}`)
      console.log(`    Command: ${p.cmd}`)
      console.log(`    Roles: ${p.roles}`)
      console.log(`    Using (qual): ${p.qual || 'none'}`)
      console.log(`    With check: ${p.with_check || 'none'}`)
    })
  }
}

checkCompanyTable()
