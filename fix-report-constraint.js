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

async function checkConstraints() {
  console.log('=== CHECKING COMPANY_REPORTS CONSTRAINTS ===\n')
  
  // Try to get constraint info (this might not work via REST API)
  console.log('The constraint "company_reports_status_check" is restricting status values.')
  console.log('We need to drop the old constraint and create a new one.\n')
  console.log('Run this SQL in your Supabase SQL Editor:\n')
  
  const sql = `
-- Drop the old status constraint
ALTER TABLE public.company_reports 
DROP CONSTRAINT IF EXISTS company_reports_status_check;

-- Add new constraint with updated status values
ALTER TABLE public.company_reports 
ADD CONSTRAINT company_reports_status_check 
CHECK (status IN ('open', 'in_progress', 'closed', 'rejected'));
`
  
  console.log(sql)
}

checkConstraints()
