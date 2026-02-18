/**
 * Security utility functions
 * Provides common security helpers for API routes
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIP, rateLimitExceeded, RATE_LIMITS, rateLimitHeaders } from './rate-limit'
import { ZodSchema, ZodError } from 'zod'

export interface AuthResult {
  user: { id: string; email: string } | null
  profile: { id: string; role: string; email: string } | null
  error: NextResponse | null
}

export interface SecurityOptions {
  requireAuth?: boolean
  requiredRole?: 'admin' | 'employer' | 'jobseeker' | string[]
  rateLimit?: keyof typeof RATE_LIMITS
  requireCSRF?: boolean
}

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization', 'cookie']

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

export async function withSecurity<T>(
  request: Request,
  options: SecurityOptions,
  handler: (auth: AuthResult) => Promise<NextResponse>
): Promise<NextResponse> {
  const ip = getClientIP(request)
  const rateLimitKey = options.rateLimit || 'default'
  const rateLimitResult = checkRateLimit(ip, rateLimitKey)
  const headers = rateLimitHeaders(rateLimitResult)
  
  if (!rateLimitResult.success) {
    const response = rateLimitExceeded(rateLimitResult) as unknown as NextResponse
    Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
    return response
  }

  if (options.requireCSRF) {
    const csrfError = validateCSRF(request)
    if (csrfError) {
      Object.entries(headers).forEach(([key, value]) => csrfError.headers.set(key, value))
      return csrfError
    }
  }
  
  const auth = await getAuthenticatedUser()
  
  if (options.requireAuth && !auth.user) {
    const response = NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    )
    Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
    return response
  }
  
  if (options.requiredRole && auth.profile) {
    const allowedRoles = Array.isArray(options.requiredRole) 
      ? options.requiredRole 
      : [options.requiredRole]
    
    if (!allowedRoles.includes(auth.profile.role)) {
      logSecurityEvent('unauthorized_access_attempt', { 
        userId: auth.user?.id, 
        requiredRole: options.requiredRole, 
        actualRole: auth.profile.role 
      }, 'warn')
      const response = NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      return response
    }
  }
  
  const result = await handler(auth)
  Object.entries(headers).forEach(([key, value]) => result.headers.set(key, value))
  return result
}

export async function getAuthenticatedUser(): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { user: null, profile: null, error: null }
    }
    
    const { data: profile } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('id', user.id)
      .single()
    
    return {
      user: { id: user.id, email: user.email || '' },
      profile,
      error: null,
    }
  } catch {
    return { user: null, profile: null, error: null }
  }
}

export async function isAdmin(): Promise<boolean> {
  const { profile } = await getAuthenticatedUser()
  return profile?.role === 'admin'
}

export async function isEmployer(): Promise<boolean> {
  const { profile } = await getAuthenticatedUser()
  return profile?.role === 'employer'
}

export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data, error: null }
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Validation failed',
            details: err.issues.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      }
    }
    return {
      data: null,
      error: NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      ),
    }
  }
}

export function validateParams<T>(
  url: string,
  schema: ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse } {
  try {
    const { searchParams } = new URL(url)
    const params = Object.fromEntries(searchParams.entries())
    const data = schema.parse(params)
    return { data, error: null }
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Invalid parameters',
            details: err.issues.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      }
    }
    return {
      data: null,
      error: NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      ),
    }
  }
}

export function secureErrorResponse(
  message: string,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status }
  )
}

export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
  level: 'info' | 'warn' | 'error' = 'info'
): void {
  const safeDetails = sanitizeObject(details)
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    level,
    ...safeDetails,
  }
  
  if (process.env.NODE_ENV === 'development') {
    console[level]('[SECURITY]', JSON.stringify(logEntry))
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

export function validateUUID(id: string): NextResponse | null {
  if (!isValidUUID(id)) {
    return NextResponse.json(
      { error: 'Invalid ID format' },
      { status: 400 }
    )
  }
  return null
}

export function validateOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  if (!origin && !referer) {
    return null
  }
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const allowedOrigins = [
    appUrl,
    'http://localhost:3000',
    'http://localhost:3001',
  ]
  
  const isValidOrigin = origin && allowedOrigins.some(allowed => origin.startsWith(allowed))
  const isValidReferer = referer && allowedOrigins.some(allowed => referer.startsWith(allowed))
  
  if (!isValidOrigin && !isValidReferer) {
    logSecurityEvent('invalid_origin', { origin, referer }, 'warn')
    return NextResponse.json(
      { error: 'Invalid request origin' },
      { status: 403 }
    )
  }
  
  return null
}

export function validateCSRF(request: Request): NextResponse | null {
  const method = request.method.toUpperCase()
  
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return null
  }

  const originError = validateOrigin(request)
  if (originError) {
    return originError
  }

  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return null
  }

  return null
}

export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }
  return result
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}
