import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getClientIP, rateLimitExceeded } from '@/lib/rate-limit'
import { validateUUID, secureErrorResponse, logSecurityEvent } from '@/lib/security'
import { updateCompanyVerificationSchema } from '@/lib/validations'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const ip = getClientIP(request)
  const rateLimitResult = checkRateLimit(ip, 'admin')
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult) as unknown as NextResponse
  }

  try {
    const supabase = await createClient()
    const { id } = await params

    // Validate UUID
    const uuidError = validateUUID(id)
    if (uuidError) return uuidError

    // Validate input
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const result = updateCompanyVerificationSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      )
    }

    const { verified } = result.data

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
      logSecurityEvent('unauthorized_admin_access', { userId: user.id, endpoint: 'companies' }, 'warn')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update company verification status using admin client
    const adminClient = createAdminClient()
    
    const { data, error } = await adminClient
      .from('companies')
      // @ts-expect-error - Supabase admin client type inference issue
      .update({ verified })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return secureErrorResponse('Failed to update company')
    }

    logSecurityEvent('company_verification_updated', { companyId: id, verified, adminId: user.id }, 'info')
    return NextResponse.json({ success: true, data })
  } catch {
    return secureErrorResponse('Internal server error')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const ip = getClientIP(request)
  const rateLimitResult = checkRateLimit(ip, 'admin')
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult) as unknown as NextResponse
  }

  try {
    const supabase = await createClient()
    const { id } = await params

    // Validate UUID
    const uuidError = validateUUID(id)
    if (uuidError) return uuidError

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
      logSecurityEvent('unauthorized_admin_access', { userId: user.id, endpoint: 'companies_delete' }, 'warn')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete company (cascade will handle related records)
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)

    if (error) {
      return secureErrorResponse('Failed to delete company')
    }

    logSecurityEvent('company_deleted', { companyId: id, adminId: user.id }, 'info')
    return NextResponse.json({ success: true })
  } catch {
    return secureErrorResponse('Internal server error')
  }
}
