import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local manually
const envFile = readFileSync('.env.local', 'utf8')
const envVars = {}
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=')
  if (key && values.length) {
    envVars[key.trim()] = values.join('=').trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function findBioLifeJobs() {
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, average_rating, total_ratings')
    .eq('name', 'BioLife')
    .single()

  if (!company) {
    console.log('❌ BioLife company not found')
    return
  }

  console.log(`\n📊 ${company.name}: ${company.average_rating} ⭐ (${company.total_ratings} ratings)\n`)

  const { data: jobs } = await supabase
    .from('job_postings')
    .select('id, title, location, status')
    .eq('company_id', company.id)

  if (jobs && jobs.length > 0) {
    console.log(`🎯 Jobs at ${company.name}:`)
    jobs.forEach(job => {
      console.log(`   - ${job.title} (${job.location}) [${job.status}]`)
      console.log(`     View at: http://localhost:3000/jobs/${job.id}\n`)
    })
  } else {
    console.log(`ℹ️  No jobs found for ${company.name}`)
  }
}

findBioLifeJobs().catch(console.error)
