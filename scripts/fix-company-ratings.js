const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const trimmedLine = line.trim()
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const match = trimmedLine.match(/^([^=]+)=(.*)$/)
    if (match) {
      envVars[match[1].trim()] = match[2].trim()
    }
  }
})

console.log('Parsed env vars:', Object.keys(envVars))

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('Service Role Key:', supabaseServiceKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  console.error('URL:', supabaseUrl)
  console.error('Key:', supabaseServiceKey ? '***' : 'undefined')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('Running migration to fix rating policy and company defaults...')

  try {
    // Step 1: Update existing companies with NULL ratings
    console.log('\n1. Updating companies with NULL ratings to 0...')
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        average_rating: 0,
        total_ratings: 0
      })
      .or('average_rating.is.null,total_ratings.is.null')

    if (updateError) {
      console.error('Error updating companies:', updateError)
    } else {
      console.log('✓ Companies updated successfully')
    }

    // Step 2: Recalculate all company ratings to fix any discrepancies
    console.log('\n2. Recalculating all company ratings...')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id')

    if (companiesError) {
      console.error('Error fetching companies:', companiesError)
      return
    }

    for (const company of companies) {
      // Fetch all ratings for this company
      const { data: ratings, error: ratingsError } = await supabase
        .from('company_ratings')
        .select('rating')
        .eq('company_id', company.id)

      if (ratingsError) {
        console.error(`Error fetching ratings for company ${company.id}:`, ratingsError)
        continue
      }

      if (ratings && ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        
        // Update company's average rating and total count
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            average_rating: Math.round(avgRating * 10) / 10,
            total_ratings: ratings.length
          })
          .eq('id', company.id)

        if (updateError) {
          console.error(`Error updating company ${company.id}:`, updateError)
        } else {
          console.log(`✓ Company ${company.id}: ${Math.round(avgRating * 10) / 10} stars (${ratings.length} ratings)`)
        }
      } else {
        // Ensure companies with no ratings have 0
        await supabase
          .from('companies')
          .update({
            average_rating: 0,
            total_ratings: 0
          })
          .eq('id', company.id)
        console.log(`✓ Company ${company.id}: 0 stars (0 ratings)`)
      }
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('\nNote: You still need to run the SQL migration in Supabase dashboard to:')
    console.log('- Update the RLS policy (allow rating at any status)')
    console.log('- Add triggers for automatic initialization')
    console.log('\nSQL file location: migrations/fix-rating-policy-and-defaults.sql')

  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

runMigration()
