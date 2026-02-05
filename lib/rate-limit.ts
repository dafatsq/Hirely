/**
 * Rate limiting utility for API routes
 * Uses in-memory store (suitable for single-server deployment)
 * For production with multiple servers, use Redis
 */

// Store for tracking requests per IP
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  retryAfter?: number // Seconds until rate limit resets
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // General API endpoints
  default: { windowMs: 60000, maxRequests: 100 },
  
  // Auth endpoints (stricter)
  auth: { windowMs: 60000, maxRequests: 5 },
  
  // Login (very strict to prevent brute force)
  login: { windowMs: 300000, maxRequests: 5 }, // 5 attempts per 5 minutes
  
  // Register (prevent spam accounts)
  register: { windowMs: 3600000, maxRequests: 3 }, // 3 per hour
  
  // Chatbot (moderate - AI calls are expensive)
  chatbot: { windowMs: 60000, maxRequests: 20 },
  
  // File uploads (strict)
  upload: { windowMs: 60000, maxRequests: 10 },
  
  // Search/expensive operations
  search: { windowMs: 60000, maxRequests: 30 },
  
  // Admin operations
  admin: { windowMs: 60000, maxRequests: 50 },
} as const

/**
 * Check if a request is within rate limits
 * @param identifier - Unique identifier (usually IP address)
 * @param endpoint - Key from RATE_LIMITS or custom config
 * @param config - Optional custom config
 */
export function checkRateLimit(
  identifier: string,
  endpoint: keyof typeof RATE_LIMITS = 'default',
  config?: RateLimitConfig
): RateLimitResult {
  const { windowMs, maxRequests } = config || RATE_LIMITS[endpoint]
  const now = Date.now()
  const key = `${identifier}:${endpoint}`
  
  const current = rateLimitStore.get(key)
  
  // If no record or window expired, create new window
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    }
  }
  
  // Check if within limits
  if (current.count < maxRequests) {
    current.count++
    rateLimitStore.set(key, current)
    return {
      success: true,
      remaining: maxRequests - current.count,
      resetTime: current.resetTime,
    }
  }
  
  // Rate limited
  const retryAfter = Math.ceil((current.resetTime - now) / 1000)
  return {
    success: false,
    remaining: 0,
    resetTime: current.resetTime,
    retryAfter,
  }
}

/**
 * Get client IP from request headers
 * Works with Vercel, Cloudflare, and direct connections
 */
export function getClientIP(request: Request): string {
  // Vercel forwards the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // Take the first IP in case of multiple proxies
    return forwarded.split(',')[0].trim()
  }
  
  // Cloudflare
  const cfConnecting = request.headers.get('cf-connecting-ip')
  if (cfConnecting) {
    return cfConnecting
  }
  
  // Real IP header (nginx)
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Fallback
  return 'unknown'
}

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  }
  
  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString()
  }
  
  return headers
}

/**
 * Create a 429 Too Many Requests response
 */
export function rateLimitExceeded(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...rateLimitHeaders(result),
      },
    }
  )
}
