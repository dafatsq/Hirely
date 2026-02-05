import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIP, rateLimitExceeded } from '@/lib/rate-limit'
import { uuidSchema } from '@/lib/validations'
import { validateUUID, secureErrorResponse } from '@/lib/security'
import { z } from 'zod'

const saveJobSchema = z.object({
  jobId: uuidSchema,
})

export async function POST(request: Request) {
  // Rate limiting
  const ip = getClientIP(request)
  const rateLimitResult = checkRateLimit(ip, 'default')
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult) as unknown as NextResponse
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate input
  let body: { jobId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const result = saveJobSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.issues },
      { status: 400 }
    )
  }

  const { jobId } = result.data

  try {
    // TODO: Insert into saved_jobs table or toggle
    return NextResponse.json({ success: true, saved: true })
  } catch {
    return secureErrorResponse('Failed to save job')
  }
}

export async function DELETE(request: Request) {
  // Rate limiting
  const ip = getClientIP(request)
  const rateLimitResult = checkRateLimit(ip, 'default')
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult) as unknown as NextResponse
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
  }

  // Validate UUID format
  const uuidError = validateUUID(jobId)
  if (uuidError) return uuidError

  try {
    // TODO: Delete from saved_jobs table
    return NextResponse.json({ success: true })
  } catch {
    return secureErrorResponse('Failed to remove saved job')
  }
}
