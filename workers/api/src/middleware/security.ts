import type { Context, Next } from 'hono'

/**
 * Security headers middleware for Cloudflare Workers
 * Implements OWASP recommended security headers
 *
 * Headers implemented:
 * - Content-Security-Policy: Restricts resource loading to prevent XSS/injection
 * - X-Frame-Options: Prevents clickjacking attacks
 * - X-Content-Type-Options: Prevents MIME-type sniffing
 * - X-XSS-Protection: Legacy XSS filter for older browsers
 * - Referrer-Policy: Controls referrer information leakage
 * - Permissions-Policy: Disables unnecessary browser features
 * - Strict-Transport-Security: Enforces HTTPS connections
 */
export async function securityHeaders(c: Context, next: Next): Promise<void> {
  await next()

  // Content Security Policy - Strict but allows inline styles for Tailwind
  // Note: 'unsafe-inline' for styles is required by Tailwind CSS
  // script-src 'unsafe-inline' may be needed for Vite HMR in development
  c.header(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://*.pages.dev",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  )

  // Prevent clickjacking - deny all framing attempts
  c.header('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing - forces browser to respect declared content-type
  c.header('X-Content-Type-Options', 'nosniff')

  // Enable XSS filter - block page rendering if attack detected
  // Note: Deprecated in modern browsers but still provides protection for older ones
  c.header('X-XSS-Protection', '1; mode=block')

  // Control referrer information - send full URL only on same-origin requests
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions Policy - disable unused browser features
  // camera, microphone, geolocation: Not needed for todo app
  // interest-cohort: Opt out of FLoC tracking
  c.header(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // HSTS - Strict Transport Security
  // max-age: 1 year (31536000 seconds)
  // includeSubDomains: Apply to all subdomains
  // preload: Allow inclusion in browser preload lists
  c.header(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
}
