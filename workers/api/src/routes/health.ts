import { Hono } from 'hono'
import type { Bindings } from '../index'

export const healthRoute = new Hono<{ Bindings: Bindings }>()

healthRoute.get('/', async (c) => {
  const timestamp = Date.now()

  // Basic health check
  const healthData = {
    status: 'ok',
    timestamp,
    environment: c.env.ENVIRONMENT || 'unknown',
    version: '1.0.0',
  }

  // Optionally check database connectivity
  try {
    const dbCheck = await c.env.DB.prepare('SELECT 1 as check_value').first()
    if (dbCheck) {
      return c.json({
        ...healthData,
        database: 'connected',
      })
    }
  } catch (error) {
    // Database check failed, but API is still running
    console.error('Database health check failed:', error)
    return c.json(
      {
        ...healthData,
        status: 'degraded',
        database: 'disconnected',
      },
      503
    )
  }

  return c.json(healthData)
})

// Detailed health check endpoint for monitoring
healthRoute.get('/detailed', async (c) => {
  const timestamp = Date.now()
  const checks: Record<string, { status: string; latency?: number }> = {}

  // Check database
  const dbStart = Date.now()
  try {
    await c.env.DB.prepare('SELECT 1').first()
    checks.database = {
      status: 'healthy',
      latency: Date.now() - dbStart,
    }
  } catch {
    checks.database = {
      status: 'unhealthy',
      latency: Date.now() - dbStart,
    }
  }

  // Check if Mailgun credentials are configured
  checks.email = {
    status: c.env.MAILGUN_API_KEY && c.env.MAILGUN_DOMAIN ? 'configured' : 'not_configured',
  }

  const allHealthy = Object.values(checks).every(
    (check) => check.status === 'healthy' || check.status === 'configured'
  )

  return c.json(
    {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp,
      environment: c.env.ENVIRONMENT || 'unknown',
      version: '1.0.0',
      checks,
    },
    allHealthy ? 200 : 503
  )
})
