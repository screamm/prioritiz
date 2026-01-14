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
  icon: z.string().max(50).optional().nullable(),
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
  todos: z.array(todoSchema).max(1000),
  priorities: z.array(prioritySchema).max(50),
  lastSyncAt: z.number().int().positive().nullable().optional(),
})

export const syncRoute = new Hono<{ Bindings: Bindings }>()

syncRoute.post('/', zValidator('json', syncSchema), async (c) => {
  const { token, todos, priorities } = c.req.valid('json')
  const db = c.env.DB
  const now = Date.now()

  try {
    // Step 1: Upsert user
    console.log(`[SYNC] Starting sync for token ${token.substring(0, 3)}***`)
    console.log(`[SYNC] Priorities: ${priorities.length}, Todos: ${todos.length}`)

    await db
      .prepare(
        `INSERT INTO users (token, created_at, last_sync_at)
         VALUES (?, ?, ?)
         ON CONFLICT(token) DO UPDATE SET last_sync_at = excluded.last_sync_at`
      )
      .bind(token, now, now)
      .run()

    console.log('[SYNC] User upserted successfully')

    // Step 2: Delete existing data for this user
    await db.prepare('DELETE FROM todos WHERE user_token = ?').bind(token).run()
    console.log('[SYNC] Todos deleted')

    await db.prepare('DELETE FROM priorities WHERE user_token = ?').bind(token).run()
    console.log('[SYNC] Priorities deleted')

    // Step 3: Insert priorities one by one with error handling
    for (let i = 0; i < priorities.length; i++) {
      const priority = priorities[i]
      try {
        await db
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
          .run()
      } catch (priorityError) {
        console.error(`[SYNC] Error inserting priority ${i}:`, priority)
        console.error(`[SYNC] Priority error:`, priorityError)
        throw priorityError
      }
    }
    console.log(`[SYNC] ${priorities.length} priorities inserted`)

    // Step 4: Insert todos one by one with error handling
    for (let i = 0; i < todos.length; i++) {
      const todo = todos[i]
      try {
        await db
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
          .run()
      } catch (todoError) {
        console.error(`[SYNC] Error inserting todo ${i}:`, todo)
        console.error(`[SYNC] Todo error:`, todoError)
        throw todoError
      }
    }
    console.log(`[SYNC] ${todos.length} todos inserted`)

    console.log('[SYNC] Sync completed successfully')

    return successResponse(c, {
      syncedAt: now,
      todosCount: todos.length,
      prioritiesCount: priorities.length,
    })
  } catch (error) {
    // Log the full error for debugging
    console.error('[SYNC] Full error:', error)
    console.error('[SYNC] Error name:', error instanceof Error ? error.name : 'Unknown')
    console.error('[SYNC] Error message:', error instanceof Error ? error.message : String(error))

    // Return more specific error message in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error'

    return errorResponse(
      c,
      ErrorCodes.DATABASE_ERROR,
      `Database error: ${errorMessage}`,
      500
    )
  }
})

// GET endpoint to check last sync time for a token
syncRoute.get('/:token', async (c) => {
  const token = c.req.param('token')

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
