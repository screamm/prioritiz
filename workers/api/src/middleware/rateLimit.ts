import type { Context, Next } from 'hono'
import type { Bindings } from '../index'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store for rate limiting
// Note: In a production environment with multiple Workers instances,
// consider using Cloudflare KV or Durable Objects for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>()

// Rate limit configuration
const WINDOW_MS = 60 * 1000 // 1 minute window
const MAX_REQUESTS = 30 // 30 requests per minute

// Cleanup old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
let lastCleanup = Date.now()

function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(ip)
    }
  }
}

function getClientIP(c: Context<{ Bindings: Bindings }>): string {
  // Cloudflare provides the real client IP in this header
  const cfConnectingIp = c.req.header('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Fallback headers for local development
  const xForwardedFor = c.req.header('x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }

  const xRealIp = c.req.header('x-real-ip')
  if (xRealIp) {
    return xRealIp
  }

  return 'unknown'
}

export async function rateLimiter(
  c: Context<{ Bindings: Bindings }>,
  next: Next
): Promise<Response | void> {
  const now = Date.now()

  // Periodic cleanup
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanupExpiredEntries()
    lastCleanup = now
  }

  const ip = getClientIP(c)

  // Skip rate limiting for health checks
  if (c.req.path === '/health') {
    return next()
  }

  let entry = rateLimitStore.get(ip)

  if (!entry || entry.resetAt < now) {
    // Create new entry or reset expired one
    entry = {
      count: 1,
      resetAt: now + WINDOW_MS,
    }
    rateLimitStore.set(ip, entry)
  } else {
    // Increment counter
    entry.count++
  }

  // Calculate remaining requests
  const remaining = Math.max(0, MAX_REQUESTS - entry.count)
  const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000)

  // Set rate limit headers
  c.header('X-RateLimit-Limit', MAX_REQUESTS.toString())
  c.header('X-RateLimit-Remaining', remaining.toString())
  c.header('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000).toString())

  // Check if rate limit exceeded
  if (entry.count > MAX_REQUESTS) {
    return c.json(
      {
        error: 'Too Many Requests',
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded. Please try again in ${resetInSeconds} seconds.`,
        retryAfter: resetInSeconds,
      },
      429
    )
  }

  return next()
}
