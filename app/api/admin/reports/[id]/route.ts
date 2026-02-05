import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIP, rateLimitExceeded } from '@/lib/rate-limit'
import { updateReportStatusSchema } from '@/lib/validations'
import { validateUUID, secureErrorResponse, logSecurityEvent } from '@/lib/security'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const ip = getClientIP(request)
  const rateLimitResult = checkRateLimit(ip, 'admin')
  if (!rateLimitResult.success) {
    logSecurityEvent('rate_limit_exceeded', { ip, endpoint: 'admin_reports' }, 'warn')
    return rateLimitExceeded(rateLimitResult) as unknown as NextResponse
  }

  try {
    const supabase = await createClient()
    const { id } = await params

    // Validate UUID format
    const uuidError = validateUUID(id)
    if (uuidError) return uuidError

    // Validate input
    let body: { status?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const result = updateReportStatusSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      )
    }

    const { status } = result.data

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      logSecurityEvent('unauthorized_admin_access', { userId: user.id, endpoint: 'reports' }, 'warn')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update report status
    const { error } = await supabase
      .from('company_reports')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      logSecurityEvent('report_update_error', { reportId: id }, 'error')
      return secureErrorResponse('Failed to update report')
    }

    logSecurityEvent('report_status_updated', { reportId: id, status, adminId: user.id }, 'info')
    return NextResponse.json({ success: true, status })
  } catch {
    return secureErrorResponse('Internal server error')
  }
}
