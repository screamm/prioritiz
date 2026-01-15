import { Hono } from 'hono'
import type { Bindings } from '../index'
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  isTokenExpired,
  TOKEN_EXPIRATION_DAYS,
} from '../utils/response'

// Database row types
interface UserRow {
  token: string
  created_at: number
  last_sync_at: number | null
  email: string | null
}

interface PriorityRow {
  id: string
  user_token: string
  name: string
  color: string
  icon: string | null
  order: number
  is_default: number
  created_at: number
  updated_at: number
}

interface TodoRow {
  id: string
  user_token: string
  text: string
  completed: number
  priority_id: string | null
  order: number
  created_at: number
  updated_at: number
}

// Response types for the API
interface Priority {
  id: string
  name: string
  color: string
  icon?: string
  order: number
  isDefault: boolean
}

interface Todo {
  id: string
  text: string
  completed: boolean
  priorityId: string | null
  order: number
  createdAt: number
  updatedAt: number
}

interface Settings {
  lastSyncAt: number | null
}

export const restoreRoute = new Hono<{ Bindings: Bindings }>()

restoreRoute.get('/:token', async (c) => {
  const token = c.req.param('token')

  // Validate token format
  if (!/^[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}$/.test(token)) {
    return errorResponse(
      c,
      ErrorCodes.INVALID_TOKEN,
      'Invalid token format. Expected format: XXX-XXX-XXX',
      400
    )
  }

  try {
    // Check if user exists
    const user = await c.env.DB.prepare(
      'SELECT token, created_at, last_sync_at, email FROM users WHERE token = ?'
    )
      .bind(token)
      .first<UserRow>()

    if (!user) {
      return errorResponse(
        c,
        ErrorCodes.TOKEN_NOT_FOUND,
        'No data found for this token. Please check that you entered the correct code.',
        404
      )
    }

    // Check if token is expired
    if (isTokenExpired(user.created_at)) {
      return errorResponse(
        c,
        ErrorCodes.TOKEN_EXPIRED,
        `This token has expired. Tokens are valid for ${TOKEN_EXPIRATION_DAYS} days. Please generate a new token on your original device.`,
        403
      )
    }

    // Fetch priorities for this user
    const prioritiesResult = await c.env.DB.prepare(
      `SELECT id, user_token, name, color, icon, "order", is_default, created_at, updated_at
       FROM priorities
       WHERE user_token = ?
       ORDER BY "order" ASC`
    )
      .bind(token)
      .all<PriorityRow>()

    // Fetch todos for this user
    const todosResult = await c.env.DB.prepare(
      `SELECT id, user_token, text, completed, priority_id, "order", created_at, updated_at
       FROM todos
       WHERE user_token = ?
       ORDER BY "order" ASC`
    )
      .bind(token)
      .all<TodoRow>()

    // Transform database rows to API response format
    const priorities: Priority[] = (prioritiesResult.results || []).map(
      (row) => ({
        id: row.id,
        name: row.name,
        color: row.color,
        icon: row.icon || undefined,
        order: row.order,
        isDefault: row.is_default === 1,
      })
    )

    const todos: Todo[] = (todosResult.results || []).map((row) => ({
      id: row.id,
      text: row.text,
      completed: row.completed === 1,
      priorityId: row.priority_id,
      order: row.order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    const settings: Settings = {
      lastSyncAt: user.last_sync_at,
    }

    return successResponse(c, {
      todos,
      priorities,
      settings,
      restoredAt: Date.now(),
    })
  } catch (error) {
    console.error('Restore error:', error)
    return errorResponse(
      c,
      ErrorCodes.DATABASE_ERROR,
      'Failed to restore data. Please try again.',
      500
    )
  }
})

// Note: HEAD requests are automatically handled by GET routes in Hono
