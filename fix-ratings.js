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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixRatings() {
  console.log('🔧 Checking and fixing company ratings...\n')

  // Get all ratings
  const { data: ratings, error: ratingsError } = await supabase
    .from('company_ratings')
    .select('*, companies(name)')

  if (ratingsError) {
    console.error('❌ Error fetching ratings:', ratingsError.message)
    return
  }

  if (!ratings || ratings.length === 0) {
    console.log('ℹ️  No ratings found in database\n')
    return
  }

  console.log(`📊 Found ${ratings.length} rating(s):\n`)
  ratings.forEach(rating => {
    const companyName = Array.isArray(rating.companies) 
      ? rating.companies[0]?.name 
      : rating.companies?.name
    console.log(`   - ${companyName}: ${rating.rating} stars`)
    console.log(`     Review: ${rating.review || 'No review'}`)
    console.log(`     Company ID: ${rating.company_id}\n`)
  })

  // Manually update each company's rating
  console.log('🔄 Manually updating company ratings...\n')

  const companyIds = [...new Set(ratings.map(r => r.company_id))]

  for (const companyId of companyIds) {
    const companyRatings = ratings.filter(r => r.company_id === companyId)
    const avgRating = companyRatings.reduce((sum, r) => sum + r.rating, 0) / companyRatings.length
    const totalRatings = companyRatings.length

    const { error: updateError } = await supabase
      .from('companies')
      .update({
        average_rating: Math.round(avgRating * 10) / 10,
        total_ratings: totalRatings
      })
      .eq('id', companyId)

    if (updateError) {
      console.error(`❌ Error updating company ${companyId}:`, updateError.message)
    } else {
      const companyName = Array.isArray(companyRatings[0].companies)
        ? companyRatings[0].companies[0]?.name
        : companyRatings[0].companies?.name
      console.log(`✅ Updated ${companyName}: ${avgRating.toFixed(1)} stars (${totalRatings} ratings)`)
    }
  }

  console.log('\n✨ Done! Checking results...\n')

  // Verify
  const { data: updatedCompanies } = await supabase
    .from('companies')
    .select('name, average_rating, total_ratings')
    .gt('total_ratings', 0)

  if (updatedCompanies && updatedCompanies.length > 0) {
    console.log('📊 Companies with ratings:')
    updatedCompanies.forEach(company => {
      console.log(`   ${company.name}: ${company.average_rating} stars (${company.total_ratings} ratings)`)
    })
  }
}

fixRatings().catch(console.error)
