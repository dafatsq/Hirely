import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { companyId } = await request.json()

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Fetch all ratings for this company
    // @ts-expect-error - Supabase admin client type inference issue
    const { data: ratings, error: ratingsError } = await adminClient
      .from('company_ratings')
      .select('rating')
      .eq('company_id', companyId)

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError)
      return NextResponse.json({ error: ratingsError.message }, { status: 500 })
    }

    if (ratings && ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      
      // Update company's average rating and total count
      const { error: updateError } = await adminClient
        .from('companies')
        .update({
          average_rating: Math.round(avgRating * 10) / 10,
          total_ratings: ratings.length
        })
        .eq('id', companyId)

      if (updateError) {
        console.error('Error updating company:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        average_rating: Math.round(avgRating * 10) / 10,
        total_ratings: ratings.length
      })
    }

    // No ratings found
    return NextResponse.json({ 
      success: true, 
      average_rating: 0,
      total_ratings: 0
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}
