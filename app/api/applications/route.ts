import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIP, rateLimitExceeded } from '@/lib/rate-limit'
import { applyJobSchema, uuidSchema } from '@/lib/validations'
import { validateBody, validateUUID, secureErrorResponse, logSecurityEvent } from '@/lib/security'

export async function POST(request: Request) {
  // Rate limiting
  const ip = getClientIP(request)
  const rateLimitResult = checkRateLimit(ip, 'default')
  if (!rateLimitResult.success) {
    logSecurityEvent('rate_limit_exceeded', { ip, endpoint: 'applications_post' }, 'warn')
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
  const validation = await validateBody(request, applyJobSchema)
  if (validation.error) return validation.error

  const { jobId, coverLetter } = validation.data

  // Validate UUID format
  const uuidError = validateUUID(jobId)
  if (uuidError) return uuidError

  try {
    const applicationData = {
      user_id: user.id,
      job_posting_id: jobId,
      status: 'pending',
      cover_letter: coverLetter || null,
      applied_at: new Date().toISOString(),
    }

    // TODO: Insert into job_applications table
    return NextResponse.json({
      success: true,
      application: applicationData,
    })
  } catch (error: unknown) {
    logSecurityEvent('application_error', { userId: user.id, jobId }, 'error')
    return secureErrorResponse('Failed to submit application')
  }
}

export async function GET(request: Request) {
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

  try {
    // TODO: Fetch from job_applications table
    const applications: unknown[] = []

    return NextResponse.json({ applications })
  } catch (error: unknown) {
    return secureErrorResponse('Failed to fetch applications')
  }
}
