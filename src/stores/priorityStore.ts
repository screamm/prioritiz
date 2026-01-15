import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Priority } from '@/types'
import { DEFAULT_PRIORITIES } from '@/types'
import { generateId } from '@/utils'
import { STORAGE_KEYS } from '@/utils/constants'
import { useTodoStore } from './todoStore'

interface DeletePriorityResult {
  success: boolean
  error?: string
  movedTodoCount?: number
}

interface PriorityState {
  priorities: Priority[]

  // Actions
  addPriority: (name: string, color: string) => void
  updatePriority: (id: string, updates: Partial<Priority>) => void
  deletePriority: (id: string) => boolean
  deletePriorityWithTodos: (
    priorityId: string,
    targetPriorityId: string | null
  ) => DeletePriorityResult
  reorderPriorities: (orderedIds: string[]) => void

  // Bulk operations
  importPriorities: (priorities: Priority[]) => void
  resetToDefaults: () => void

  // Selectors
  getPriorityById: (id: string) => Priority | undefined
  getSortedPriorities: () => Priority[]
}

export const usePriorityStore = create<PriorityState>()(
  persist(
    (set, get) => ({
      priorities: DEFAULT_PRIORITIES,

      addPriority: (name: string, color: string) => {
        const maxOrder = Math.max(...get().priorities.map((p) => p.order), -1)

        const newPriority: Priority = {
          id: generateId(),
          name: name.trim(),
          color,
          order: maxOrder + 1,
          isDefault: false,
        }

        set((state) => ({
          priorities: [...state.priorities, newPriority],
        }))
      },

      updatePriority: (id: string, updates: Partial<Priority>) => {
        set((state) => ({
          priorities: state.priorities.map((priority) =>
            priority.id === id ? { ...priority, ...updates } : priority
          ),
        }))
      },

      deletePriority: (id: string) => {
        const priorities = get().priorities

        // Cannot delete if only one priority remains
        if (priorities.length <= 1) {
          return false
        }

        // Check if there are any todos in this priority
        const todosInPriority = useTodoStore.getState().getTodosByPriority(id)
        if (todosInPriority.length > 0) {
          console.warn(
            'deletePriority: Cannot delete priority with todos. Use deletePriorityWithTodos instead.'
          )
          return false
        }

        try {
          set((state) => ({
            priorities: state.priorities.filter((p) => p.id !== id),
          }))
          return true
        } catch (error) {
          console.error('Error deleting priority:', error)
          return false
        }
      },

      deletePriorityWithTodos: (
        priorityId: string,
        targetPriorityId: string | null
      ): DeletePriorityResult => {
        const priorities = get().priorities

        // Cannot delete if only one priority remains
        if (priorities.length <= 1) {
          return {
            success: false,
            error: 'Cannot delete the last priority',
          }
        }

        // Validate the priority exists
        const priorityToDelete = priorities.find((p) => p.id === priorityId)
        if (!priorityToDelete) {
          return {
            success: false,
            error: 'Priority not found',
          }
        }

        // Validate target priority exists (if not inbox)
        if (
          targetPriorityId !== null &&
          !priorities.find((p) => p.id === targetPriorityId)
        ) {
          return {
            success: false,
            error: 'Target priority not found',
          }
        }

        // Cannot move todos to the same priority being deleted
        if (targetPriorityId === priorityId) {
          return {
            success: false,
            error: 'Cannot move todos to the priority being deleted',
          }
        }

        try {
          // Get todos in the priority being deleted
          const todoStore = useTodoStore.getState()
          const todosToMove = todoStore.getTodosByPriority(priorityId)
          const todoIds = todosToMove.map((t) => t.id)

          // Step 1: Move all todos to target priority atomically
          if (todoIds.length > 0) {
            const moveSuccess = todoStore.moveTodosToPriority(
              todoIds,
              targetPriorityId
            )

            if (!moveSuccess) {
              return {
                success: false,
                error: 'Failed to move todos to target priority',
              }
            }

            // Verify todos were actually moved
            const remainingTodos = useTodoStore
              .getState()
              .getTodosByPriority(priorityId)
            if (remainingTodos.length > 0) {
              return {
                success: false,
                error: 'Some todos were not moved successfully',
              }
            }
          }

          // Step 2: Only delete priority after todos are successfully moved
          set((state) => ({
            priorities: state.priorities.filter((p) => p.id !== priorityId),
          }))

          return {
            success: true,
            movedTodoCount: todoIds.length,
          }
        } catch (error) {
          console.error('Error in deletePriorityWithTodos:', error)
          return {
            success: false,
            error:
              error instanceof Error ? error.message : 'Unknown error occurred',
          }
        }
      },

      reorderPriorities: (orderedIds: string[]) => {
        set((state) => ({
          priorities: state.priorities.map((priority) => {
            const newOrder = orderedIds.indexOf(priority.id)
            if (newOrder === -1) return priority
            return { ...priority, order: newOrder }
          }),
        }))
      },

      importPriorities: (priorities: Priority[]) => {
        set({ priorities })
      },

      resetToDefaults: () => {
        set({ priorities: DEFAULT_PRIORITIES })
      },

      getPriorityById: (id: string) => {
        return get().priorities.find((p) => p.id === id)
      },

      getSortedPriorities: () => {
        return [...get().priorities].sort((a, b) => a.order - b.order)
      },
    }),
    {
      name: STORAGE_KEYS.PRIORITIES,
    }
  )
)
