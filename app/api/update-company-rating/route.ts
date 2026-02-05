import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIP, rateLimitExceeded } from '@/lib/rate-limit'
import { uuidSchema } from '@/lib/validations'
import { validateUUID, secureErrorResponse, logSecurityEvent } from '@/lib/security'
import { z } from 'zod'

const updateRatingSchema = z.object({
  companyId: uuidSchema,
})

export async function POST(request: Request) {
  // Rate limiting
  const ip = getClientIP(request)
  const rateLimitResult = checkRateLimit(ip, 'default')
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult) as unknown as NextResponse
  }

  try {
    let body: { companyId?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const result = updateRatingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      )
    }

    const { companyId } = result.data

    const adminClient = createAdminClient()

    // Fetch all ratings for this company
    const { data, error: ratingsError } = await adminClient
      .from('company_ratings')
      .select('rating')
      .eq('company_id', companyId)

    const ratings = (data || []) as Array<{ rating: number }>

    if (ratingsError) {
      logSecurityEvent('rating_fetch_error', { companyId }, 'error')
      return secureErrorResponse('Failed to fetch ratings')
    }

    if (ratings && ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      
      // Update company's average rating and total count
      const { error: updateError } = await adminClient
        .from('companies')
        // @ts-expect-error - Supabase admin client type inference issue
        .update({
          average_rating: Math.round(avgRating * 10) / 10,
          total_ratings: ratings.length
        })
        .eq('id', companyId)

      if (updateError) {
        logSecurityEvent('rating_update_error', { companyId }, 'error')
        return secureErrorResponse('Failed to update company rating')
      }

      return NextResponse.json({ 
        success: true, 
        average_rating: Math.round(avgRating * 10) / 10,
        total_ratings: ratings.length
      })
    }

    // No ratings found - update company to have 0 ratings
    await adminClient
      .from('companies')
      // @ts-expect-error - Supabase admin client type inference issue
      .update({
        average_rating: 0,
        total_ratings: 0
      })
      .eq('id', companyId)

    return NextResponse.json({ 
      success: true, 
      average_rating: 0,
      total_ratings: 0
    })

  } catch {
    return secureErrorResponse('Internal server error')
  }
}
