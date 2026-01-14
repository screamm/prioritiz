import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTodoStore } from '@/stores/todoStore'
import type { Todo } from '@/types'

// Helper to reset store state
const resetStore = () => {
  useTodoStore.setState({ todos: [] })
}

// Helper to create a mock todo
const createMockTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: `todo-${Date.now()}-${Math.random()}`,
  text: 'Test todo',
  completed: false,
  priorityId: null,
  order: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
})

describe('todoStore', () => {
  beforeEach(() => {
    resetStore()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should start with empty todos array', () => {
      const { todos } = useTodoStore.getState()
      expect(todos).toEqual([])
    })
  })

  describe('addTodo', () => {
    it('should add a new todo with correct properties', () => {
      const { addTodo } = useTodoStore.getState()

      addTodo('Test todo')

      const { todos } = useTodoStore.getState()
      expect(todos).toHaveLength(1)
      expect(todos[0]).toMatchObject({
        text: 'Test todo',
        completed: false,
        priorityId: null,
        order: 0,
      })
      expect(todos[0].id).toBeDefined()
      expect(todos[0].createdAt).toBeDefined()
      expect(todos[0].updatedAt).toBeDefined()
    })

    it('should trim whitespace from todo text', () => {
      const { addTodo } = useTodoStore.getState()

      addTodo('  Whitespace todo  ')

      const { todos } = useTodoStore.getState()
      expect(todos[0].text).toBe('Whitespace todo')
    })

    it('should generate unique ids for each todo', () => {
      const { addTodo } = useTodoStore.getState()

      addTodo('Todo 1')
      addTodo('Todo 2')
      addTodo('Todo 3')

      const { todos } = useTodoStore.getState()
      const ids = todos.map((t) => t.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(3)
    })

    it('should assign correct order for inbox todos', () => {
      const { addTodo } = useTodoStore.getState()

      addTodo('First')
      addTodo('Second')
      addTodo('Third')

      const { todos } = useTodoStore.getState()
      expect(todos[0].order).toBe(0)
      expect(todos[1].order).toBe(1)
      expect(todos[2].order).toBe(2)
    })

    it('should add new todos to inbox (priorityId = null)', () => {
      const { addTodo } = useTodoStore.getState()

      addTodo('Inbox todo')

      const { todos } = useTodoStore.getState()
      expect(todos[0].priorityId).toBeNull()
    })
  })

  describe('updateTodo', () => {
    it('should update todo text', () => {
      const { addTodo, updateTodo } = useTodoStore.getState()
      addTodo('Original text')

      const todoId = useTodoStore.getState().todos[0].id
      updateTodo(todoId, { text: 'Updated text' })

      const { todos } = useTodoStore.getState()
      expect(todos[0].text).toBe('Updated text')
    })

    it('should update todo priority', () => {
      const { addTodo, updateTodo } = useTodoStore.getState()
      addTodo('Test todo')

      const todoId = useTodoStore.getState().todos[0].id
      updateTodo(todoId, { priorityId: 'priority-high' })

      const { todos } = useTodoStore.getState()
      expect(todos[0].priorityId).toBe('priority-high')
    })

    it('should update updatedAt timestamp', () => {
      const { addTodo, updateTodo } = useTodoStore.getState()
      addTodo('Test todo')

      const todoId = useTodoStore.getState().todos[0].id
      const originalUpdatedAt = useTodoStore.getState().todos[0].updatedAt

      vi.advanceTimersByTime(1000)
      updateTodo(todoId, { text: 'Updated' })

      const { todos } = useTodoStore.getState()
      expect(todos[0].updatedAt).toBeGreaterThan(originalUpdatedAt)
    })

    it('should not affect other todos', () => {
      const { addTodo, updateTodo } = useTodoStore.getState()
      addTodo('Todo 1')
      addTodo('Todo 2')

      const todoId = useTodoStore.getState().todos[0].id
      updateTodo(todoId, { text: 'Updated Todo 1' })

      const { todos } = useTodoStore.getState()
      expect(todos[1].text).toBe('Todo 2')
    })

    it('should handle non-existent todo id gracefully', () => {
      const { addTodo, updateTodo } = useTodoStore.getState()
      addTodo('Test todo')

      // Should not throw
      expect(() => updateTodo('non-existent-id', { text: 'Updated' })).not.toThrow()

      const { todos } = useTodoStore.getState()
      expect(todos[0].text).toBe('Test todo')
    })
  })

  describe('deleteTodo', () => {
    it('should remove todo from list', () => {
      const { addTodo, deleteTodo } = useTodoStore.getState()
      addTodo('Test todo')

      const todoId = useTodoStore.getState().todos[0].id
      deleteTodo(todoId)

      const { todos } = useTodoStore.getState()
      expect(todos).toHaveLength(0)
    })

    it('should remove correct todo when multiple exist', () => {
      const { addTodo, deleteTodo } = useTodoStore.getState()
      addTodo('Todo 1')
      addTodo('Todo 2')
      addTodo('Todo 3')

      const todoId = useTodoStore.getState().todos[1].id
      deleteTodo(todoId)

      const { todos } = useTodoStore.getState()
      expect(todos).toHaveLength(2)
      expect(todos.map((t) => t.text)).toEqual(['Todo 1', 'Todo 3'])
    })

    it('should handle non-existent todo id gracefully', () => {
      const { addTodo, deleteTodo } = useTodoStore.getState()
      addTodo('Test todo')

      expect(() => deleteTodo('non-existent-id')).not.toThrow()

      const { todos } = useTodoStore.getState()
      expect(todos).toHaveLength(1)
    })
  })

  describe('toggleTodo', () => {
    it('should toggle todo completion from false to true', () => {
      const { addTodo, toggleTodo } = useTodoStore.getState()
      addTodo('Test todo')

      const todoId = useTodoStore.getState().todos[0].id
      expect(useTodoStore.getState().todos[0].completed).toBe(false)

      toggleTodo(todoId)

      expect(useTodoStore.getState().todos[0].completed).toBe(true)
    })

    it('should toggle todo completion from true to false', () => {
      const { addTodo, toggleTodo } = useTodoStore.getState()
      addTodo('Test todo')

      const todoId = useTodoStore.getState().todos[0].id
      toggleTodo(todoId) // false -> true
      toggleTodo(todoId) // true -> false

      expect(useTodoStore.getState().todos[0].completed).toBe(false)
    })

    it('should update updatedAt timestamp on toggle', () => {
      const { addTodo, toggleTodo } = useTodoStore.getState()
      addTodo('Test todo')

      const todoId = useTodoStore.getState().todos[0].id
      const originalUpdatedAt = useTodoStore.getState().todos[0].updatedAt

      vi.advanceTimersByTime(1000)
      toggleTodo(todoId)

      expect(useTodoStore.getState().todos[0].updatedAt).toBeGreaterThan(originalUpdatedAt)
    })
  })

  describe('moveTodo', () => {
    it('should move todo to different priority', () => {
      const { addTodo, moveTodo } = useTodoStore.getState()
      addTodo('Test todo')

      const todoId = useTodoStore.getState().todos[0].id
      moveTodo(todoId, 'priority-high', 0)

      expect(useTodoStore.getState().todos[0].priorityId).toBe('priority-high')
    })

    it('should move todo from priority back to inbox', () => {
      useTodoStore.setState({
        todos: [createMockTodo({ priorityId: 'priority-high' })],
      })

      const { moveTodo } = useTodoStore.getState()
      const todoId = useTodoStore.getState().todos[0].id

      moveTodo(todoId, null, 0)

      expect(useTodoStore.getState().todos[0].priorityId).toBeNull()
    })

    it('should update order when moving', () => {
      const { addTodo, moveTodo } = useTodoStore.getState()
      addTodo('Test todo')

      const todoId = useTodoStore.getState().todos[0].id
      moveTodo(todoId, 'priority-high', 5)

      expect(useTodoStore.getState().todos[0].order).toBe(0) // Only todo in priority
    })

    it('should update updatedAt timestamp on move', () => {
      const { addTodo, moveTodo } = useTodoStore.getState()
      addTodo('Test todo')

      const todoId = useTodoStore.getState().todos[0].id
      const originalUpdatedAt = useTodoStore.getState().todos[0].updatedAt

      vi.advanceTimersByTime(1000)
      moveTodo(todoId, 'priority-high', 0)

      expect(useTodoStore.getState().todos[0].updatedAt).toBeGreaterThan(originalUpdatedAt)
    })

    it('should handle non-existent todo gracefully', () => {
      const { moveTodo } = useTodoStore.getState()

      expect(() => moveTodo('non-existent', 'priority-high', 0)).not.toThrow()
    })

    it('should reorder todos in target priority correctly', () => {
      useTodoStore.setState({
        todos: [
          createMockTodo({ id: 'todo-1', priorityId: 'priority-high', order: 0 }),
          createMockTodo({ id: 'todo-2', priorityId: 'priority-high', order: 1 }),
          createMockTodo({ id: 'todo-3', priorityId: null, order: 0 }),
        ],
      })

      const { moveTodo } = useTodoStore.getState()
      moveTodo('todo-3', 'priority-high', 1)

      const { todos } = useTodoStore.getState()
      const highPriorityTodos = todos
        .filter((t) => t.priorityId === 'priority-high')
        .sort((a, b) => a.order - b.order)

      expect(highPriorityTodos.map((t) => t.id)).toEqual(['todo-1', 'todo-3', 'todo-2'])
    })
  })

  describe('reorderTodos', () => {
    it('should reorder todos within a priority', () => {
      useTodoStore.setState({
        todos: [
          createMockTodo({ id: 'todo-1', priorityId: 'priority-high', order: 0 }),
          createMockTodo({ id: 'todo-2', priorityId: 'priority-high', order: 1 }),
          createMockTodo({ id: 'todo-3', priorityId: 'priority-high', order: 2 }),
        ],
      })

      const { reorderTodos } = useTodoStore.getState()
      reorderTodos('priority-high', ['todo-3', 'todo-1', 'todo-2'])

      const { todos } = useTodoStore.getState()
      const orderedTodos = todos.sort((a, b) => a.order - b.order)

      expect(orderedTodos.map((t) => t.id)).toEqual(['todo-3', 'todo-1', 'todo-2'])
    })

    it('should not affect todos in other priorities', () => {
      useTodoStore.setState({
        todos: [
          createMockTodo({ id: 'todo-1', priorityId: 'priority-high', order: 0 }),
          createMockTodo({ id: 'todo-2', priorityId: 'priority-low', order: 0 }),
        ],
      })

      const { reorderTodos } = useTodoStore.getState()
      reorderTodos('priority-high', ['todo-1'])

      const { todos } = useTodoStore.getState()
      const lowPriorityTodo = todos.find((t) => t.id === 'todo-2')

      expect(lowPriorityTodo?.order).toBe(0)
    })
  })

  describe('importTodos', () => {
    it('should replace all todos with imported ones', () => {
      const { addTodo, importTodos } = useTodoStore.getState()
      addTodo('Existing todo')

      const importedTodos = [
        createMockTodo({ id: 'imported-1', text: 'Imported 1' }),
        createMockTodo({ id: 'imported-2', text: 'Imported 2' }),
      ]

      importTodos(importedTodos)

      const { todos } = useTodoStore.getState()
      expect(todos).toHaveLength(2)
      expect(todos.map((t) => t.text)).toEqual(['Imported 1', 'Imported 2'])
    })
  })

  describe('clearAll', () => {
    it('should remove all todos', () => {
      const { addTodo, clearAll } = useTodoStore.getState()
      addTodo('Todo 1')
      addTodo('Todo 2')
      addTodo('Todo 3')

      clearAll()

      const { todos } = useTodoStore.getState()
      expect(todos).toHaveLength(0)
    })
  })

  describe('getTodosByPriority', () => {
    it('should return todos for specific priority sorted by order', () => {
      useTodoStore.setState({
        todos: [
          createMockTodo({ id: 'todo-1', priorityId: 'priority-high', order: 2 }),
          createMockTodo({ id: 'todo-2', priorityId: 'priority-high', order: 0 }),
          createMockTodo({ id: 'todo-3', priorityId: 'priority-low', order: 0 }),
          createMockTodo({ id: 'todo-4', priorityId: 'priority-high', order: 1 }),
        ],
      })

      const { getTodosByPriority } = useTodoStore.getState()
      const highPriorityTodos = getTodosByPriority('priority-high')

      expect(highPriorityTodos).toHaveLength(3)
      expect(highPriorityTodos.map((t) => t.id)).toEqual(['todo-2', 'todo-4', 'todo-1'])
    })

    it('should return empty array for priority with no todos', () => {
      const { getTodosByPriority } = useTodoStore.getState()
      const result = getTodosByPriority('non-existent-priority')

      expect(result).toEqual([])
    })
  })

  describe('getInboxTodos', () => {
    it('should return todos with null priorityId sorted by order', () => {
      useTodoStore.setState({
        todos: [
          createMockTodo({ id: 'todo-1', priorityId: null, order: 2 }),
          createMockTodo({ id: 'todo-2', priorityId: 'priority-high', order: 0 }),
          createMockTodo({ id: 'todo-3', priorityId: null, order: 0 }),
          createMockTodo({ id: 'todo-4', priorityId: null, order: 1 }),
        ],
      })

      const { getInboxTodos } = useTodoStore.getState()
      const inboxTodos = getInboxTodos()

      expect(inboxTodos).toHaveLength(3)
      expect(inboxTodos.map((t) => t.id)).toEqual(['todo-3', 'todo-4', 'todo-1'])
    })

    it('should return empty array when inbox is empty', () => {
      useTodoStore.setState({
        todos: [
          createMockTodo({ priorityId: 'priority-high' }),
        ],
      })

      const { getInboxTodos } = useTodoStore.getState()
      const inboxTodos = getInboxTodos()

      expect(inboxTodos).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should handle empty text gracefully', () => {
      const { addTodo } = useTodoStore.getState()

      addTodo('')

      const { todos } = useTodoStore.getState()
      expect(todos).toHaveLength(1)
      expect(todos[0].text).toBe('')
    })

    it('should handle very long todo text', () => {
      const { addTodo } = useTodoStore.getState()
      const longText = 'a'.repeat(1000)

      addTodo(longText)

      const { todos } = useTodoStore.getState()
      expect(todos[0].text).toBe(longText)
    })

    it('should handle special characters in todo text', () => {
      const { addTodo } = useTodoStore.getState()
      const specialText = '<script>alert("xss")</script> & "quotes" \'single\''

      addTodo(specialText)

      const { todos } = useTodoStore.getState()
      expect(todos[0].text).toBe(specialText)
    })

    it('should handle rapid successive operations', () => {
      const { addTodo, toggleTodo, deleteTodo } = useTodoStore.getState()

      // Add 100 todos rapidly
      for (let i = 0; i < 100; i++) {
        addTodo(`Todo ${i}`)
      }

      expect(useTodoStore.getState().todos).toHaveLength(100)

      // Toggle all
      useTodoStore.getState().todos.forEach((todo) => {
        toggleTodo(todo.id)
      })

      expect(useTodoStore.getState().todos.every((t) => t.completed)).toBe(true)

      // Delete half
      const todosToDelete = useTodoStore.getState().todos.slice(0, 50)
      todosToDelete.forEach((todo) => {
        deleteTodo(todo.id)
      })

      expect(useTodoStore.getState().todos).toHaveLength(50)
    })
  })
})
