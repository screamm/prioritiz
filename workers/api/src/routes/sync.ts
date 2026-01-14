import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Bindings } from '../index'
import { successResponse, errorResponse, ErrorCodes } from '../utils/response'

// Schema for todo items
const todoSchema = z.object({
  id: z.string().min(1).max(100),
  text: z.string().min(1).max(500),
  completed: z.boolean(),
  priorityId: z.string().max(100).nullable(),
  order: z.number().int().min(0),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
})

// Schema for priority items
const prioritySchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  icon: z.string().max(50).optional(),
  order: z.number().int().min(0),
  isDefault: z.boolean(),
})

// Schema for sync request body
const syncSchema = z.object({
  token: z
    .string()
    .min(11)
    .max(11)
    .regex(/^[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}$/, 'Invalid token format'),
  todos: z.array(todoSchema).max(1000), // Limit to 1000 todos
  priorities: z.array(prioritySchema).max(50), // Limit to 50 priorities
  lastSyncAt: z.number().int().positive().nullable(),
})

export const syncRoute = new Hono<{ Bindings: Bindings }>()

syncRoute.post('/', zValidator('json', syncSchema), async (c) => {
  const { token, todos, priorities } = c.req.valid('json')
  const db = c.env.DB
  const now = Date.now()

  try {
    // Use a batch for better performance and atomicity
    const statements: D1PreparedStatement[] = []

    // Upsert user
    statements.push(
      db
        .prepare(
          `INSERT INTO users (token, created_at, last_sync_at)
           VALUES (?, ?, ?)
           ON CONFLICT(token) DO UPDATE SET last_sync_at = excluded.last_sync_at`
        )
        .bind(token, now, now)
    )

    // Delete existing priorities for this user
    statements.push(
      db.prepare('DELETE FROM priorities WHERE user_token = ?').bind(token)
    )

    // Delete existing todos for this user
    statements.push(
      db.prepare('DELETE FROM todos WHERE user_token = ?').bind(token)
    )

    // Insert all priorities
    for (const priority of priorities) {
      statements.push(
        db
          .prepare(
            `INSERT INTO priorities (id, user_token, name, color, icon, "order", is_default, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            priority.id,
            token,
            priority.name,
            priority.color,
            priority.icon || null,
            priority.order,
            priority.isDefault ? 1 : 0,
            now,
            now
          )
      )
    }

    // Insert all todos
    for (const todo of todos) {
      statements.push(
        db
          .prepare(
            `INSERT INTO todos (id, user_token, text, completed, priority_id, "order", created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            todo.id,
            token,
            todo.text,
            todo.completed ? 1 : 0,
            todo.priorityId,
            todo.order,
            todo.createdAt,
            todo.updatedAt
          )
      )
    }

    // Execute all statements in batch
    await db.batch(statements)

    return successResponse(c, {
      syncedAt: now,
      todosCount: todos.length,
      prioritiesCount: priorities.length,
    })
  } catch (error) {
    console.error('Sync error:', error)
    return errorResponse(
      c,
      ErrorCodes.DATABASE_ERROR,
      'Failed to sync data. Please try again.',
      500
    )
  }
})

// Optional: GET endpoint to check last sync time for a token
syncRoute.get('/:token', async (c) => {
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
    const user = await c.env.DB.prepare(
      'SELECT last_sync_at FROM users WHERE token = ?'
    )
      .bind(token)
      .first<{ last_sync_at: number | null }>()

    if (!user) {
      return errorResponse(
        c,
        ErrorCodes.TOKEN_NOT_FOUND,
        'No data found for this token',
        404
      )
    }

    return successResponse(c, {
      lastSyncAt: user.last_sync_at,
    })
  } catch (error) {
    console.error('Sync status check error:', error)
    return errorResponse(
      c,
      ErrorCodes.DATABASE_ERROR,
      'Failed to check sync status',
      500
    )
  }
})
