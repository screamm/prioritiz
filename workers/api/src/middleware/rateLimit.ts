import type { Context, Next } from 'hono'
import type { Bindings } from '../index'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Separate in-memory stores per limit tier
// Note: Each CF Workers instance has its own store — this is per-instance limiting.
// For true distributed rate limiting, migrate to Cloudflare Durable Objects or KV.
const globalStore = new Map<string, RateLimitEntry>()
const sensitiveStore = new Map<string, RateLimitEntry>()

// Global limit: 30 req/min per IP
const GLOBAL_WINDOW_MS = 60 * 1000
const GLOBAL_MAX = 30

// Sensitive endpoint limit: 5 req/min per IP (restore — brute force protection)
const SENSITIVE_WINDOW_MS = 60 * 1000
const SENSITIVE_MAX = 5

const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

// Paths that use the tighter sensitive limit
const SENSITIVE_PATH_PATTERN = /^\/restore\//

function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [ip, entry] of globalStore.entries()) {
    if (entry.resetAt < now) globalStore.delete(ip)
  }
  for (const [ip, entry] of sensitiveStore.entries()) {
    if (entry.resetAt < now) sensitiveStore.delete(ip)
  }
}

function getClientIP(c: Context<{ Bindings: Bindings }>): string {
  const cfConnectingIp = c.req.header('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp

  const xForwardedFor = c.req.header('x-forwarded-for')
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim()

  const xRealIp = c.req.header('x-real-ip')
  if (xRealIp) return xRealIp

  return 'unknown'
}

function checkLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  max: number,
  windowMs: number,
  now: number
): { allowed: boolean; remaining: number; resetAt: number } {
  let entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs }
    store.set(key, entry)
  } else {
    entry.count++
  }

  const remaining = Math.max(0, max - entry.count)
  return {
    allowed: entry.count <= max,
    remaining,
    resetAt: entry.resetAt,
  }
}

export async function rateLimiter(
  c: Context<{ Bindings: Bindings }>,
  next: Next
): Promise<Response | void> {
  const now = Date.now()

  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanupExpiredEntries()
    lastCleanup = now
  }

  // Health checks bypass rate limiting
  if (c.req.path === '/health') {
    return next()
  }

  const ip = getClientIP(c)
  const isSensitivePath = SENSITIVE_PATH_PATTERN.test(c.req.path)

  // Always apply global limit
  const global = checkLimit(globalStore, ip, GLOBAL_MAX, GLOBAL_WINDOW_MS, now)

  c.header('X-RateLimit-Limit', GLOBAL_MAX.toString())
  c.header('X-RateLimit-Remaining', global.remaining.toString())
  c.header('X-RateLimit-Reset', Math.ceil(global.resetAt / 1000).toString())

  if (!global.allowed) {
    const retryAfter = Math.ceil((global.resetAt - now) / 1000)
    return c.json(
      {
        error: 'Too Many Requests',
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      429
    )
  }

  // Apply tighter limit on sensitive paths (restore brute-force protection)
  if (isSensitivePath) {
    const sensitive = checkLimit(sensitiveStore, ip, SENSITIVE_MAX, SENSITIVE_WINDOW_MS, now)

    if (!sensitive.allowed) {
      const retryAfter = Math.ceil((sensitive.resetAt - now) / 1000)
      c.header('X-RateLimit-Limit', SENSITIVE_MAX.toString())
      c.header('X-RateLimit-Remaining', '0')
      c.header('X-RateLimit-Reset', Math.ceil(sensitive.resetAt / 1000).toString())
      return c.json(
        {
          error: 'Too Many Requests',
          code: 'RATE_LIMITED',
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        429
      )
    }
  }

  return next()
}
