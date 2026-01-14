import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { syncRoute } from './routes/sync'
import { restoreRoute } from './routes/restore'
import { emailRoute } from './routes/email'
import { healthRoute } from './routes/health'
import { rateLimiter } from './middleware/rateLimit'
import { corsConfig } from './middleware/cors'
import { securityHeaders } from './middleware/security'

export type Bindings = {
  DB: D1Database
  MAILGUN_API_KEY: string
  MAILGUN_DOMAIN: string
  ENVIRONMENT: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Global middleware
// Order matters: CORS first, then security headers, then rate limiting
app.use('*', cors(corsConfig))
app.use('*', securityHeaders)
app.use('*', rateLimiter)

// Mount routes
app.route('/sync', syncRoute)
app.route('/restore', restoreRoute)
app.route('/email', emailRoute)
app.route('/health', healthRoute)

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Prioritiz API',
    version: '1.0.0',
    status: 'running',
    endpoints: ['/health', '/sync', '/restore/:token', '/email'],
  })
})

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      code: 'NOT_FOUND',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404
  )
})

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json(
    {
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      message:
        c.env.ENVIRONMENT === 'development'
          ? err.message
          : 'An unexpected error occurred',
    },
    500
  )
})

export default app
