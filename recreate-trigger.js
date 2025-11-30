import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

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

async function recreateTrigger() {
  console.log('🔧 Recreating company rating trigger...\n')

  // Read the migration file
  const migrationSQL = readFileSync('migrations/create-company-ratings.sql', 'utf8')
  
  // Extract just the function and trigger parts
  const functionSQL = `
CREATE OR REPLACE FUNCTION update_company_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update company average rating and total count
  UPDATE public.companies
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.company_ratings
      WHERE company_id = COALESCE(NEW.company_id, OLD.company_id)
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.company_ratings
      WHERE company_id = COALESCE(NEW.company_id, OLD.company_id)
    )
  WHERE id = COALESCE(NEW.company_id, OLD.company_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_company_rating ON public.company_ratings;

CREATE TRIGGER trigger_update_company_rating
AFTER INSERT OR UPDATE OR DELETE ON public.company_ratings
FOR EACH ROW
EXECUTE FUNCTION update_company_rating();
`

  console.log('Executing SQL...\n')
  
  // Execute via RPC if available, otherwise show SQL to run manually
  const { data, error } = await supabase.rpc('exec_sql', { query: functionSQL })
  
  if (error) {
    console.log('⚠️  Cannot execute via RPC. Please run this SQL manually:\n')
    console.log('=' .repeat(80))
    console.log(functionSQL)
    console.log('=' .repeat(80))
    console.log('\nYou can run it in Supabase SQL Editor or via psql\n')
  } else {
    console.log('✅ Trigger recreated successfully!\n')
  }

  // Now manually trigger an update for all existing ratings
  console.log('🔄 Manually updating all company ratings...\n')
  
  const { data: ratings } = await supabase
    .from('company_ratings')
    .select('company_id, rating')

  if (ratings && ratings.length > 0) {
    const companyIds = [...new Set(ratings.map(r => r.company_id))]
    
    for (const companyId of companyIds) {
      const companyRatings = ratings.filter(r => r.company_id === companyId)
      const avgRating = companyRatings.reduce((sum, r) => sum + r.rating, 0) / companyRatings.length
      
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          average_rating: Math.round(avgRating * 10) / 10,
          total_ratings: companyRatings.length
        })
        .eq('id', companyId)

      if (updateError) {
        console.error(`❌ Error updating company ${companyId}:`, updateError.message)
      } else {
        console.log(`✅ Updated company: ${avgRating.toFixed(1)} ⭐ (${companyRatings.length} ratings)`)
      }
    }
  }

  // Test the trigger by doing a dummy update
  console.log('\n🧪 Testing trigger with dummy update...\n')
  
  const { data: testRating } = await supabase
    .from('company_ratings')
    .select('*')
    .limit(1)
    .single()

  if (testRating) {
    // Touch the rating to trigger update
    const { error: touchError } = await supabase
      .from('company_ratings')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', testRating.id)

    if (touchError) {
      console.error('❌ Trigger test failed:', touchError.message)
    } else {
      console.log('✅ Trigger test successful!')
      
      // Check if company was updated
      const { data: company } = await supabase
        .from('companies')
        .select('name, average_rating, total_ratings')
        .eq('id', testRating.company_id)
        .single()

      if (company) {
        console.log(`   Company: ${company.name}`)
        console.log(`   Rating: ${company.average_rating} ⭐ (${company.total_ratings} ratings)`)
      }
    }
  }
}

recreateTrigger().catch(console.error)
