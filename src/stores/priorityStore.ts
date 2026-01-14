import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Priority } from '@/types'
import { DEFAULT_PRIORITIES } from '@/types'
import { generateId } from '@/utils'
import { STORAGE_KEYS } from '@/utils/constants'

interface PriorityState {
  priorities: Priority[]

  // Actions
  addPriority: (name: string, color: string) => void
  updatePriority: (id: string, updates: Partial<Priority>) => void
  deletePriority: (id: string) => boolean
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

        set((state) => ({
          priorities: state.priorities.filter((p) => p.id !== id),
        }))

        return true
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
