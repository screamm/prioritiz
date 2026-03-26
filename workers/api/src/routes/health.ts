import { Hono } from 'hono'
import type { Bindings } from '../index'

export const healthRoute = new Hono<{ Bindings: Bindings }>()

healthRoute.get('/', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1 as check_value').first()
    return c.json({ status: 'ok' })
  } catch {
    return c.json({ status: 'degraded' }, 503)
  }
})
