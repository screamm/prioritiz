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

// Types for database records
interface DbTodo {
  id: string
  user_token: string
  text: string
  completed: number
  priority_id: string | null
  order: number
  created_at: number
  updated_at: number
}

interface DbPriority {
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

// Types for conflict tracking
interface TodoConflict {
  id: string
  clientVersion: z.infer<typeof todoSchema>
  serverVersion: z.infer<typeof todoSchema>
}

interface PriorityConflict {
  id: string
  clientVersion: z.infer<typeof prioritySchema>
  serverVersion: z.infer<typeof prioritySchema>
}

// Convert DB record to client format
function dbTodoToClient(dbTodo: DbTodo): z.infer<typeof todoSchema> {
  return {
    id: dbTodo.id,
    text: dbTodo.text,
    completed: dbTodo.completed === 1,
    priorityId: dbTodo.priority_id,
    order: dbTodo.order,
    createdAt: dbTodo.created_at,
    updatedAt: dbTodo.updated_at,
  }
}

function dbPriorityToClient(dbPriority: DbPriority): z.infer<typeof prioritySchema> {
  return {
    id: dbPriority.id,
    name: dbPriority.name,
    color: dbPriority.color,
    icon: dbPriority.icon,
    order: dbPriority.order,
    isDefault: dbPriority.is_default === 1,
  }
}

export const syncRoute = new Hono<{ Bindings: Bindings }>()

syncRoute.post('/', zValidator('json', syncSchema), async (c) => {
  const { token, todos, priorities, lastSyncAt } = c.req.valid('json')
  const db = c.env.DB
  const now = Date.now()

  try {
    console.log(`[SYNC] Starting sync for token ${token.substring(0, 3)}***`)
    console.log(`[SYNC] Client priorities: ${priorities.length}, todos: ${todos.length}`)
    console.log(`[SYNC] Last sync at: ${lastSyncAt || 'never'}`)

    // Step 1: Fetch existing server data for conflict detection
    const [existingTodosResult, existingPrioritiesResult] = await Promise.all([
      db.prepare('SELECT * FROM todos WHERE user_token = ?').bind(token).all<DbTodo>(),
      db.prepare('SELECT * FROM priorities WHERE user_token = ?').bind(token).all<DbPriority>(),
    ])

    const existingTodos = existingTodosResult.results || []
    const existingPriorities = existingPrioritiesResult.results || []

    console.log(`[SYNC] Server priorities: ${existingPriorities.length}, todos: ${existingTodos.length}`)

    // Create lookup maps for existing records
    const serverTodoMap = new Map<string, DbTodo>()
    for (const todo of existingTodos) {
      serverTodoMap.set(todo.id, todo)
    }

    const serverPriorityMap = new Map<string, DbPriority>()
    for (const priority of existingPriorities) {
      serverPriorityMap.set(priority.id, priority)
    }

    // Step 2: Perform conflict resolution
    const todoConflicts: TodoConflict[] = []
    const priorityConflicts: PriorityConflict[] = []

    const todosToInsert: z.infer<typeof todoSchema>[] = []
    const todosToUpdate: z.infer<typeof todoSchema>[] = []
    const prioritiesToInsert: z.infer<typeof prioritySchema>[] = []
    const prioritiesToUpdate: z.infer<typeof prioritySchema>[] = []

    // Process priorities
    const clientPriorityIds = new Set<string>()
    for (const clientPriority of priorities) {
      clientPriorityIds.add(clientPriority.id)
      const serverPriority = serverPriorityMap.get(clientPriority.id)

      if (!serverPriority) {
        // New priority from client - insert it
        prioritiesToInsert.push(clientPriority)
      } else {
        // Priority exists on both sides - check for conflicts
        const serverUpdatedAt = serverPriority.updated_at

        if (lastSyncAt && serverUpdatedAt > lastSyncAt) {
          // Server has been modified since last sync - potential conflict
          // Check if client also modified it (client updatedAt > lastSyncAt)
          // For simplicity, we use "last write wins" with server priority for conflicts
          // But we report the conflict so client can handle it if needed
          priorityConflicts.push({
            id: clientPriority.id,
            clientVersion: clientPriority,
            serverVersion: dbPriorityToClient(serverPriority),
          })
          // Keep server version - don't update
        } else {
          // No conflict - client version wins
          prioritiesToUpdate.push(clientPriority)
        }
      }
    }

    // Process todos
    const clientTodoIds = new Set<string>()
    for (const clientTodo of todos) {
      clientTodoIds.add(clientTodo.id)
      const serverTodo = serverTodoMap.get(clientTodo.id)

      if (!serverTodo) {
        // New todo from client - insert it
        todosToInsert.push(clientTodo)
      } else {
        // Todo exists on both sides - check for conflicts
        const serverUpdatedAt = serverTodo.updated_at

        if (lastSyncAt && serverUpdatedAt > lastSyncAt) {
          // Server has been modified since last sync - potential conflict
          todoConflicts.push({
            id: clientTodo.id,
            clientVersion: clientTodo,
            serverVersion: dbTodoToClient(serverTodo),
          })
          // Keep server version - don't update
        } else {
          // No conflict - client version wins
          todosToUpdate.push(clientTodo)
        }
      }
    }

    // Identify records deleted on client (exist on server but not in client payload)
    const prioritiesToDelete: string[] = []
    for (const serverPriority of existingPriorities) {
      if (!clientPriorityIds.has(serverPriority.id)) {
        // Check if server record was modified after last sync
        if (lastSyncAt && serverPriority.updated_at > lastSyncAt) {
          // Server modified after last sync but client deleted - conflict
          // For safety, we keep the server version and report conflict
          priorityConflicts.push({
            id: serverPriority.id,
            clientVersion: {
              id: serverPriority.id,
              name: '[DELETED]',
              color: '#000000',
              icon: null,
              order: 0,
              isDefault: false,
            },
            serverVersion: dbPriorityToClient(serverPriority),
          })
        } else {
          // Safe to delete
          prioritiesToDelete.push(serverPriority.id)
        }
      }
    }

    const todosToDelete: string[] = []
    for (const serverTodo of existingTodos) {
      if (!clientTodoIds.has(serverTodo.id)) {
        // Check if server record was modified after last sync
        if (lastSyncAt && serverTodo.updated_at > lastSyncAt) {
          // Server modified after last sync but client deleted - conflict
          todoConflicts.push({
            id: serverTodo.id,
            clientVersion: {
              id: serverTodo.id,
              text: '[DELETED]',
              completed: false,
              priorityId: null,
              order: 0,
              createdAt: serverTodo.created_at,
              updatedAt: now,
            },
            serverVersion: dbTodoToClient(serverTodo),
          })
        } else {
          // Safe to delete
          todosToDelete.push(serverTodo.id)
        }
      }
    }

    console.log(`[SYNC] Priorities - insert: ${prioritiesToInsert.length}, update: ${prioritiesToUpdate.length}, delete: ${prioritiesToDelete.length}, conflicts: ${priorityConflicts.length}`)
    console.log(`[SYNC] Todos - insert: ${todosToInsert.length}, update: ${todosToUpdate.length}, delete: ${todosToDelete.length}, conflicts: ${todoConflicts.length}`)

    // Step 3: Build batch operations for atomic transaction
    const batchStatements: D1PreparedStatement[] = []

    // Upsert user
    batchStatements.push(
      db
        .prepare(
          `INSERT INTO users (token, created_at, last_sync_at)
           VALUES (?, ?, ?)
           ON CONFLICT(token) DO UPDATE SET last_sync_at = excluded.last_sync_at`
        )
        .bind(token, now, now)
    )

    // Delete priorities (must happen before todos due to foreign key)
    for (const priorityId of prioritiesToDelete) {
      batchStatements.push(
        db.prepare('DELETE FROM priorities WHERE id = ? AND user_token = ?').bind(priorityId, token)
      )
    }

    // Delete todos
    for (const todoId of todosToDelete) {
      batchStatements.push(
        db.prepare('DELETE FROM todos WHERE id = ? AND user_token = ?').bind(todoId, token)
      )
    }

    // Insert new priorities
    for (const priority of prioritiesToInsert) {
      batchStatements.push(
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

    // Update existing priorities
    for (const priority of prioritiesToUpdate) {
      batchStatements.push(
        db
          .prepare(
            `UPDATE priorities
             SET name = ?, color = ?, icon = ?, "order" = ?, is_default = ?, updated_at = ?
             WHERE id = ? AND user_token = ?`
          )
          .bind(
            priority.name,
            priority.color,
            priority.icon || null,
            priority.order,
            priority.isDefault ? 1 : 0,
            now,
            priority.id,
            token
          )
      )
    }

    // Insert new todos
    for (const todo of todosToInsert) {
      batchStatements.push(
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

    // Update existing todos
    for (const todo of todosToUpdate) {
      batchStatements.push(
        db
          .prepare(
            `UPDATE todos
             SET text = ?, completed = ?, priority_id = ?, "order" = ?, updated_at = ?
             WHERE id = ? AND user_token = ?`
          )
          .bind(
            todo.text,
            todo.completed ? 1 : 0,
            todo.priorityId,
            todo.order,
            todo.updatedAt,
            todo.id,
            token
          )
      )
    }

    // Step 4: Execute all statements as a batch (atomic transaction)
    if (batchStatements.length > 0) {
      console.log(`[SYNC] Executing batch with ${batchStatements.length} statements`)
      const batchResults = await db.batch(batchStatements)

      // Check for any failures in batch
      for (let i = 0; i < batchResults.length; i++) {
        if (!batchResults[i].success) {
          console.error(`[SYNC] Batch statement ${i} failed:`, batchResults[i].error)
          throw new Error(`Batch operation failed at statement ${i}: ${batchResults[i].error}`)
        }
      }
    }

    console.log('[SYNC] Batch sync completed successfully')

    // Step 5: Prepare response with conflicts if any
    const hasConflicts = todoConflicts.length > 0 || priorityConflicts.length > 0

    const response = {
      syncedAt: now,
      todosCount: todosToInsert.length + todosToUpdate.length,
      prioritiesCount: prioritiesToInsert.length + prioritiesToUpdate.length,
      deletedTodos: todosToDelete.length,
      deletedPriorities: prioritiesToDelete.length,
      hasConflicts,
      ...(hasConflicts && {
        conflicts: {
          todos: todoConflicts,
          priorities: priorityConflicts,
        },
      }),
    }

    return successResponse(c, response)
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
