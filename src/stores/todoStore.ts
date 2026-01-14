import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Todo } from '@/types'
import { generateId } from '@/utils'
import { STORAGE_KEYS } from '@/utils/constants'

interface TodoState {
  todos: Todo[]

  // Actions
  addTodo: (text: string) => void
  updateTodo: (id: string, updates: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  toggleTodo: (id: string) => void
  moveTodo: (id: string, priorityId: string | null, newOrder: number) => void
  reorderTodos: (priorityId: string | null, orderedIds: string[]) => void

  // Bulk operations
  importTodos: (todos: Todo[]) => void
  clearAll: () => void

  // Selectors
  getTodosByPriority: (priorityId: string | null) => Todo[]
  getInboxTodos: () => Todo[]
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: [],

      addTodo: (text: string) => {
        const newTodo: Todo = {
          id: generateId(),
          text: text.trim(),
          completed: false,
          priorityId: null, // Goes to inbox
          order: get().todos.filter((t) => t.priorityId === null).length,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        set((state) => ({
          todos: [...state.todos, newTodo],
        }))
      },

      updateTodo: (id: string, updates: Partial<Todo>) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, ...updates, updatedAt: Date.now() } : todo
          ),
        }))
      },

      deleteTodo: (id: string) => {
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        }))
      },

      toggleTodo: (id: string) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed, updatedAt: Date.now() } : todo
          ),
        }))
      },

      moveTodo: (id: string, priorityId: string | null, newOrder: number) => {
        set((state) => {
          const todos = [...state.todos]
          const todoIndex = todos.findIndex((t) => t.id === id)
          if (todoIndex === -1) return state

          const todo = todos[todoIndex]!
          const oldPriorityId = todo.priorityId

          // Update the moved todo
          todos[todoIndex] = {
            ...todo,
            priorityId,
            order: newOrder,
            updatedAt: Date.now(),
          }

          // Reorder todos in the target priority
          const targetTodos = todos
            .filter((t) => t.priorityId === priorityId && t.id !== id)
            .sort((a, b) => a.order - b.order)

          targetTodos.splice(newOrder, 0, todos[todoIndex]!)

          // Update orders for target priority
          targetTodos.forEach((t, index) => {
            const idx = todos.findIndex((x) => x.id === t.id)
            if (idx !== -1) {
              todos[idx] = { ...todos[idx]!, order: index }
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
                todos[idx] = { ...todos[idx]!, order: index }
              }
            })
          }

          return { todos }
        })
      },

      reorderTodos: (priorityId: string | null, orderedIds: string[]) => {
        set((state) => ({
          todos: state.todos.map((todo) => {
            if (todo.priorityId !== priorityId) return todo
            const newOrder = orderedIds.indexOf(todo.id)
            if (newOrder === -1) return todo
            return { ...todo, order: newOrder, updatedAt: Date.now() }
          }),
        }))
      },

      importTodos: (todos: Todo[]) => {
        set({ todos })
      },

      clearAll: () => {
        set({ todos: [] })
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
    }),
    {
      name: STORAGE_KEYS.TODOS,
    }
  )
)
