import { useMemo, useCallback } from 'react'
import { usePriorityStore } from '@/stores/priorityStore'
import { useTodoStore } from '@/stores/todoStore'
import type { Priority } from '@/types'

/**
 * Extended priority type with computed todo counts.
 */
export interface PriorityWithCounts extends Priority {
  todoCount: number
  completedCount: number
  activeCount: number
}

/**
 * Custom hook for managing priorities with todo count statistics.
 * Provides memoized selectors and safe action wrappers.
 *
 * @returns Priority data, actions, and utility functions
 */
export function usePriorities() {
  const priorities = usePriorityStore((state) => state.priorities)
  const addPriority = usePriorityStore((state) => state.addPriority)
  const updatePriority = usePriorityStore((state) => state.updatePriority)
  const deletePriority = usePriorityStore((state) => state.deletePriority)
  const reorderPriorities = usePriorityStore((state) => state.reorderPriorities)
  const resetToDefaults = usePriorityStore((state) => state.resetToDefaults)

  const todos = useTodoStore((state) => state.todos)

  // Get sorted priorities
  const sortedPriorities = useMemo(() => {
    return [...priorities].sort((a, b) => a.order - b.order)
  }, [priorities])

  // Get priorities with todo counts
  const prioritiesWithCounts = useMemo((): PriorityWithCounts[] => {
    return sortedPriorities.map((priority) => {
      const priorityTodos = todos.filter((t) => t.priorityId === priority.id)
      return {
        ...priority,
        todoCount: priorityTodos.length,
        completedCount: priorityTodos.filter((t) => t.completed).length,
        activeCount: priorityTodos.filter((t) => !t.completed).length,
      }
    })
  }, [sortedPriorities, todos])

  // Check if can delete (must have more than 1 priority)
  const canDelete = useMemo(() => priorities.length > 1, [priorities])

  // Get priority by ID
  const getPriority = useCallback(
    (id: string): Priority | undefined => {
      return priorities.find((p) => p.id === id)
    },
    [priorities]
  )

  // Get priority color by ID (with fallback)
  const getPriorityColor = useCallback(
    (id: string | null): string => {
      if (!id) return '#6b7280' // Gray for inbox
      const priority = priorities.find((p) => p.id === id)
      return priority?.color || '#6b7280'
    },
    [priorities]
  )

  // Get priority name by ID (with fallback)
  const getPriorityName = useCallback(
    (id: string | null): string => {
      if (!id) return 'Inbox'
      const priority = priorities.find((p) => p.id === id)
      return priority?.name || 'Okänd'
    },
    [priorities]
  )

  // Safe delete with return value indicating success
  const safeDelete = useCallback(
    (id: string): boolean => {
      if (!canDelete) {
        console.warn('Cannot delete the last priority')
        return false
      }
      return deletePriority(id)
    },
    [canDelete, deletePriority]
  )

  // Add priority with validation
  const safeAdd = useCallback(
    (name: string, color: string): boolean => {
      const trimmedName = name.trim()
      if (!trimmedName) {
        console.warn('Priority name cannot be empty')
        return false
      }
      addPriority(trimmedName, color)
      return true
    },
    [addPriority]
  )

  return {
    // Data
    priorities: sortedPriorities,
    prioritiesWithCounts,
    canDelete,

    // Actions
    addPriority: safeAdd,
    updatePriority,
    deletePriority: safeDelete,
    reorderPriorities,
    resetToDefaults,

    // Utilities
    getPriority,
    getPriorityColor,
    getPriorityName,
  }
}

/**
 * Hook to get a single priority with its associated todos and stats.
 *
 * @param priorityId - The ID of the priority
 * @returns Priority object, associated todos, and statistics
 */
export function usePriority(priorityId: string) {
  const priority = usePriorityStore((state) =>
    state.priorities.find((p) => p.id === priorityId)
  )

  const todos = useTodoStore((state) =>
    state.todos
      .filter((t) => t.priorityId === priorityId)
      .sort((a, b) => a.order - b.order)
  )

  const stats = useMemo(
    () => ({
      total: todos.length,
      completed: todos.filter((t) => t.completed).length,
      active: todos.filter((t) => !t.completed).length,
      completionRate:
        todos.length > 0
          ? Math.round((todos.filter((t) => t.completed).length / todos.length) * 100)
          : 0,
    }),
    [todos]
  )

  return {
    priority,
    todos,
    stats,
  }
}
