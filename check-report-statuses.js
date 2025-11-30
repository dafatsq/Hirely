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

async function checkReportStatuses() {
  console.log('=== CHECKING COMPANY REPORT STATUSES ===\n')
  
  // Get all reports with their statuses
  const { data: reports, error } = await supabase
    .from('company_reports')
    .select('id, reason, status, created_at')
  
  console.log('Total reports:', reports?.length || 0)
  if (error) console.log('Error:', error)
  
  if (reports && reports.length > 0) {
    console.log('\nAll reports:')
    reports.forEach(r => {
      console.log(`  - Status: "${r.status}" | Reason: ${r.reason} | Created: ${r.created_at}`)
    })
    
    // Count by status
    const statusCounts = {}
    reports.forEach(r => {
      const status = r.status || 'null'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    
    console.log('\nCounts by status:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`)
    })
  }
  
  // Test the query used in the page
  console.log('\n=== TESTING STATUS QUERIES ===\n')
  
  const statuses = ['pending', 'under_review', 'resolved', 'dismissed', 'open']
  
  for (const status of statuses) {
    const { count } = await supabase
      .from('company_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)
    
    console.log(`Status "${status}": ${count || 0} reports`)
  }
}

checkReportStatuses()
