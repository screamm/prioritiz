import { useMemo, useCallback } from 'react'
import { useTodoStore } from '@/stores/todoStore'
import type { Todo } from '@/types'

/**
 * Custom hook for managing todos with filtering and statistics.
 * Provides memoized selectors and convenient action wrappers.
 *
 * @param priorityId - Optional priority ID to filter todos
 * @returns Todo data, actions, and computed statistics
 */
export function useTodos(priorityId?: string | null) {
  const todos = useTodoStore((state) => state.todos)
  const addTodo = useTodoStore((state) => state.addTodo)
  const updateTodo = useTodoStore((state) => state.updateTodo)
  const deleteTodo = useTodoStore((state) => state.deleteTodo)
  const toggleTodo = useTodoStore((state) => state.toggleTodo)
  const moveTodo = useTodoStore((state) => state.moveTodo)
  const reorderTodos = useTodoStore((state) => state.reorderTodos)
  const clearAll = useTodoStore((state) => state.clearAll)

  // Filter and sort todos by priority if priorityId is provided
  const filteredTodos = useMemo(() => {
    if (priorityId === undefined) return [...todos].sort((a, b) => a.order - b.order)
    return todos
      .filter((todo) => todo.priorityId === priorityId)
      .sort((a, b) => a.order - b.order)
  }, [todos, priorityId])

  // Get todos in inbox (no priority assigned)
  const inboxTodos = useMemo(() => {
    return todos
      .filter((todo) => todo.priorityId === null)
      .sort((a, b) => a.order - b.order)
  }, [todos])

  // Get completed todos
  const completedTodos = useMemo(() => {
    return todos.filter((todo) => todo.completed)
  }, [todos])

  // Get active (uncompleted) todos
  const activeTodos = useMemo(() => {
    return todos.filter((todo) => !todo.completed)
  }, [todos])

  // Statistics
  const stats = useMemo(
    () => ({
      total: todos.length,
      completed: completedTodos.length,
      active: activeTodos.length,
      inbox: inboxTodos.length,
      completionRate:
        todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0,
    }),
    [todos, completedTodos, activeTodos, inboxTodos]
  )

  // Quick add todo (uses store's addTodo which adds to inbox)
  const quickAdd = useCallback(
    (text: string, toPriorityId?: string | null) => {
      addTodo(text)
      // If a priority is specified, move the todo after creation
      if (toPriorityId !== undefined && toPriorityId !== null) {
        // Note: This requires getting the newly created todo ID
        // For now, addTodo adds to inbox - use moveTodo separately if needed
      }
    },
    [addTodo]
  )

  // Clear completed todos
  const clearCompleted = useCallback(() => {
    completedTodos.forEach((todo) => deleteTodo(todo.id))
  }, [completedTodos, deleteTodo])

  // Get ordered IDs for reordering operations
  const getOrderedIds = useCallback(
    (forPriorityId: string | null) => {
      return todos
        .filter((t) => t.priorityId === forPriorityId)
        .sort((a, b) => a.order - b.order)
        .map((t) => t.id)
    },
    [todos]
  )

  return {
    // Data
    todos: filteredTodos,
    allTodos: todos,
    inboxTodos,
    completedTodos,
    activeTodos,
    stats,

    // Actions
    addTodo: quickAdd,
    updateTodo,
    deleteTodo,
    toggleTodo,
    moveTodo,
    reorderTodos,
    clearCompleted,
    clearAll,

    // Utilities
    getOrderedIds,
  }
}

/**
 * Hook to get a single todo by ID.
 * Returns undefined if todo not found.
 *
 * @param todoId - The ID of the todo to retrieve
 * @returns The todo object or undefined
 */
export function useTodo(todoId: string): Todo | undefined {
  return useTodoStore((state) => state.todos.find((todo) => todo.id === todoId))
}
