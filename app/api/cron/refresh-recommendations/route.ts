import { NextResponse } from 'next/server'
import { secureErrorResponse, logSecurityEvent, timingSafeEqual } from '@/lib/security'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
  
  if (!authHeader || !timingSafeEqual(authHeader, expectedAuth)) {
    logSecurityEvent('cron_unauthorized_access', { 
      ip: request.headers.get('x-forwarded-for') || 'unknown' 
    }, 'warn')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    logSecurityEvent('cron_recommendations_refreshed', {}, 'info')
    return NextResponse.json({
      success: true,
      message: 'Recommendations refreshed',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return secureErrorResponse('Failed to refresh recommendations')
  }
}
