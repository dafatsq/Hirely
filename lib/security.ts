/**
 * Security utility functions
 * Provides common security helpers for API routes
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIP, rateLimitExceeded, RATE_LIMITS } from './rate-limit'
import { ZodSchema, ZodError } from 'zod'

// =============================================================================
// TYPES
// =============================================================================

export interface AuthResult {
  user: { id: string; email: string } | null
  profile: { id: string; role: string; email: string } | null
  error: NextResponse | null
}

export interface SecurityOptions {
  requireAuth?: boolean
  requiredRole?: 'admin' | 'employer' | 'jobseeker' | string[]
  rateLimit?: keyof typeof RATE_LIMITS
}

// =============================================================================
// SECURE API WRAPPER
// =============================================================================

/**
 * Wrap an API handler with security checks
 * Handles rate limiting, authentication, and authorization in one call
 */
export async function withSecurity<T>(
  request: Request,
  options: SecurityOptions,
  handler: (auth: AuthResult) => Promise<NextResponse>
): Promise<NextResponse> {
  // Rate limiting
  const ip = getClientIP(request)
  const rateLimitKey = options.rateLimit || 'default'
  const rateLimitResult = checkRateLimit(ip, rateLimitKey)
  
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult) as unknown as NextResponse
  }
  
  // Authentication
  const auth = await getAuthenticatedUser()
  
  if (options.requireAuth && !auth.user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    )
  }
  
  // Authorization
  if (options.requiredRole && auth.profile) {
    const allowedRoles = Array.isArray(options.requiredRole) 
      ? options.requiredRole 
      : [options.requiredRole]
    
    if (!allowedRoles.includes(auth.profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }
  }
  
  return handler(auth)
}

// =============================================================================
// AUTHENTICATION HELPERS
// =============================================================================

/**
 * Get authenticated user and profile from Supabase
 */
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

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const { profile } = await getAuthenticatedUser()
  return profile?.role === 'admin'
}

/**
 * Check if user is employer
 */
export async function isEmployer(): Promise<boolean> {
  const { profile } = await getAuthenticatedUser()
  return profile?.role === 'employer'
}

// =============================================================================
// INPUT VALIDATION
// =============================================================================

/**
 * Parse and validate request body with Zod schema
 */
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

/**
 * Parse and validate URL search params with Zod schema
 */
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

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Create a secure error response that doesn't leak internal details
 */
export function secureErrorResponse(
  message: string,
  status: number = 500
): NextResponse {
  // Never expose internal error details to client
  return NextResponse.json(
    { error: message },
    { status }
  )
}

/**
 * Log error securely (server-side only, no sensitive data)
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
  level: 'info' | 'warn' | 'error' = 'info'
): void {
  // In production, this would send to a logging service
  // Remove sensitive fields before logging
  const safeDetails = { ...details }
  delete safeDetails.password
  delete safeDetails.token
  delete safeDetails.secret
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    level,
    ...safeDetails,
  }
  
  // Only log in development, use structured logging service in production
  if (process.env.NODE_ENV === 'development') {
    console[level]('[SECURITY]', JSON.stringify(logEntry))
  }
}

// =============================================================================
// UUID VALIDATION
// =============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Validate UUID format to prevent injection
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

/**
 * Validate UUID and return error response if invalid
 */
export function validateUUID(id: string): NextResponse | null {
  if (!isValidUUID(id)) {
    return NextResponse.json(
      { error: 'Invalid ID format' },
      { status: 400 }
    )
  }
  return null
}

// =============================================================================
// CSRF PROTECTION
// =============================================================================

/**
 * Validate Origin/Referer header for CSRF protection
 */
export function validateOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  // Allow requests with no origin (same-origin requests in some browsers)
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
    return NextResponse.json(
      { error: 'Invalid request origin' },
      { status: 403 }
    )
  }
  
  return null
}
