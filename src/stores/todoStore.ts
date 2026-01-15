import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Todo } from '@/types'
import { generateId } from '@/utils'
import { STORAGE_KEYS } from '@/utils/constants'

// Simple mutex implementation for preventing concurrent modifications
class Mutex {
  private locked = false
  private queue: (() => void)[] = []

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true
        resolve()
      } else {
        this.queue.push(resolve)
      }
    })
  }

  release(): void {
    const next = this.queue.shift()
    if (next) {
      next()
    } else {
      this.locked = false
    }
  }
}

// Global mutex for move operations
const moveMutex = new Mutex()

interface TodoState {
  todos: Todo[]
  version: number // Version number for detecting stale updates

  // Actions
  addTodo: (text: string) => void
  updateTodo: (id: string, updates: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  toggleTodo: (id: string) => void
  moveTodo: (id: string, priorityId: string | null, newOrder: number) => Promise<boolean>
  reorderTodos: (priorityId: string | null, orderedIds: string[]) => boolean

  // Bulk operations
  importTodos: (todos: Todo[]) => void
  clearAll: () => void
  moveTodosToPriority: (todoIds: string[], targetPriorityId: string | null) => boolean

  // Selectors
  getTodosByPriority: (priorityId: string | null) => Todo[]
  getInboxTodos: () => Todo[]
  getVersion: () => number
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: [],
      version: 0,

      addTodo: (text: string) => {
        const newTodo: Todo = {
          id: generateId(),
          text: text.trim(),
          completed: false,
          priorityId: null, // Goes to inbox
          order: Math.max(0, get().todos.filter((t) => t.priorityId === null).length),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        set((state) => ({
          todos: [...state.todos, newTodo],
          version: state.version + 1,
        }))
      },

      updateTodo: (id: string, updates: Partial<Todo>) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, ...updates, updatedAt: Date.now() } : todo
          ),
          version: state.version + 1,
        }))
      },

      deleteTodo: (id: string) => {
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
          version: state.version + 1,
        }))
      },

      toggleTodo: (id: string) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed, updatedAt: Date.now() } : todo
          ),
          version: state.version + 1,
        }))
      },

      moveTodo: async (id: string, priorityId: string | null, newOrder: number): Promise<boolean> => {
        // Acquire mutex to prevent concurrent modifications
        await moveMutex.acquire()

        try {
          const currentVersion = get().version

          // Ensure order is never negative
          const safeOrder = Math.max(0, newOrder)

          set((state) => {
            // Check for stale update
            if (state.version !== currentVersion) {
              console.warn('Stale update detected in moveTodo, operation may be inconsistent')
            }

            const todos = [...state.todos]
            const todoIndex = todos.findIndex((t) => t.id === id)
            if (todoIndex === -1) return state

            const todo = todos[todoIndex]!
            const oldPriorityId = todo.priorityId

            // Update the moved todo
            todos[todoIndex] = {
              ...todo,
              priorityId,
              order: safeOrder,
              updatedAt: Date.now(),
            }

            // Reorder todos in the target priority
            const targetTodos = todos
              .filter((t) => t.priorityId === priorityId && t.id !== id)
              .sort((a, b) => a.order - b.order)

            // Clamp the insertion index to valid range
            const insertIndex = Math.min(Math.max(0, safeOrder), targetTodos.length)
            targetTodos.splice(insertIndex, 0, todos[todoIndex]!)

            // Update orders for target priority (ensure non-negative)
            targetTodos.forEach((t, index) => {
              const idx = todos.findIndex((x) => x.id === t.id)
              if (idx !== -1) {
                todos[idx] = { ...todos[idx]!, order: Math.max(0, index) }
              }
            })

            // Reorder todos in the source priority (if different)
            if (oldPriorityId !== priorityId) {
              const sourceTodos = todos
                .filter((t) => t.priorityId === oldPriorityId)
                .sort((a, b) => a.order - b.order)

              sourceTodos.forEach((t, index) => {
                const idx = todos.findIndex((x) => x.id === t.id)
                if (idx !== -1) {
                  todos[idx] = { ...todos[idx]!, order: Math.max(0, index) }
                }
              })
            }

            return { todos, version: state.version + 1 }
          })

          return true
        } catch (error) {
          console.error('Error in moveTodo:', error)
          return false
        } finally {
          moveMutex.release()
        }
      },

      reorderTodos: (priorityId: string | null, orderedIds: string[]): boolean => {
        const state = get()

        // Validate that orderedIds contains all todos for this priority
        const todosInPriority = state.todos.filter((t) => t.priorityId === priorityId)
        const todoIdsInPriority = new Set(todosInPriority.map((t) => t.id))
        const orderedIdsSet = new Set(orderedIds)

        // Check if all todos in priority are present in orderedIds
        const missingIds = todosInPriority.filter((t) => !orderedIdsSet.has(t.id))
        if (missingIds.length > 0) {
          console.warn('reorderTodos: orderedIds is incomplete, missing:', missingIds.map((t) => t.id))
          // Add missing ids at the end to prevent orphaning
          missingIds.forEach((t) => orderedIds.push(t.id))
        }

        // Check for invalid ids in orderedIds (not belonging to this priority)
        const invalidIds = orderedIds.filter((id) => !todoIdsInPriority.has(id))
        if (invalidIds.length > 0) {
          console.warn('reorderTodos: orderedIds contains invalid ids:', invalidIds)
          // Filter out invalid ids
          orderedIds = orderedIds.filter((id) => todoIdsInPriority.has(id))
        }

        set((state) => ({
          todos: state.todos.map((todo) => {
            if (todo.priorityId !== priorityId) return todo
            const newOrder = orderedIds.indexOf(todo.id)
            // Ensure order is always >= 0
            const safeOrder = newOrder === -1 ? Math.max(0, todosInPriority.length) : Math.max(0, newOrder)
            return { ...todo, order: safeOrder, updatedAt: Date.now() }
          }),
          version: state.version + 1,
        }))

        return true
      },

      importTodos: (todos: Todo[]) => {
        // Ensure all imported todos have valid order values
        const sanitizedTodos = todos.map((todo) => ({
          ...todo,
          order: Math.max(0, todo.order),
        }))
        set({ todos: sanitizedTodos, version: get().version + 1 })
      },

      clearAll: () => {
        set({ todos: [], version: get().version + 1 })
      },

      moveTodosToPriority: (todoIds: string[], targetPriorityId: string | null): boolean => {
        try {
          const state = get()
          const existingTargetTodos = state.todos
            .filter((t) => t.priorityId === targetPriorityId && !todoIds.includes(t.id))
            .sort((a, b) => a.order - b.order)

          let nextOrder = existingTargetTodos.length

          set((state) => ({
            todos: state.todos.map((todo) => {
              if (!todoIds.includes(todo.id)) return todo

              const newTodo = {
                ...todo,
                priorityId: targetPriorityId,
                order: Math.max(0, nextOrder++),
                updatedAt: Date.now(),
              }
              return newTodo
            }),
            version: state.version + 1,
          }))

          return true
        } catch (error) {
          console.error('Error in moveTodosToPriority:', error)
          return false
        }
      },

      getTodosByPriority: (priorityId: string | null) => {
        return get()
          .todos.filter((t) => t.priorityId === priorityId)
          .sort((a, b) => a.order - b.order)
      },

      getInboxTodos: () => {
        return get()
          .todos.filter((t) => t.priorityId === null)
          .sort((a, b) => a.order - b.order)
      },

      getVersion: () => {
        return get().version
      },
    }),
    {
      name: STORAGE_KEYS.TODOS,
      partialize: (state) => ({
        todos: state.todos,
        // Don't persist version - it resets on page load which is fine
      }),
    }
  )
)
