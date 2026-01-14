import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePriorityStore } from '@/stores/priorityStore'
import { DEFAULT_PRIORITIES } from '@/types'
import type { Priority } from '@/types'

// Helper to reset store state
const resetStore = () => {
  usePriorityStore.setState({ priorities: [...DEFAULT_PRIORITIES] })
}

// Helper to create a mock priority
const createMockPriority = (overrides: Partial<Priority> = {}): Priority => ({
  id: `priority-${Date.now()}-${Math.random()}`,
  name: 'Test Priority',
  color: '#ff0000',
  order: 0,
  isDefault: false,
  ...overrides,
})

describe('priorityStore', () => {
  beforeEach(() => {
    resetStore()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should start with default priorities', () => {
      const { priorities } = usePriorityStore.getState()

      expect(priorities).toHaveLength(DEFAULT_PRIORITIES.length)
      expect(priorities).toEqual(DEFAULT_PRIORITIES)
    })

    it('should have three default priorities', () => {
      const { priorities } = usePriorityStore.getState()

      expect(priorities).toHaveLength(3)
      expect(priorities.map((p) => p.name)).toEqual([
        'Must do asap',
        'Todo',
        'Only do in spare time',
      ])
    })

    it('should have correct default colors', () => {
      const { priorities } = usePriorityStore.getState()

      expect(priorities[0].color).toBe('#ef4444') // red
      expect(priorities[1].color).toBe('#eab308') // yellow
      expect(priorities[2].color).toBe('#22c55e') // green
    })

    it('should have correct order values', () => {
      const { priorities } = usePriorityStore.getState()

      expect(priorities[0].order).toBe(0)
      expect(priorities[1].order).toBe(1)
      expect(priorities[2].order).toBe(2)
    })

    it('should mark defaults as isDefault true', () => {
      const { priorities } = usePriorityStore.getState()

      expect(priorities.every((p) => p.isDefault)).toBe(true)
    })
  })

  describe('addPriority', () => {
    it('should add a new priority with correct properties', () => {
      const { addPriority } = usePriorityStore.getState()

      addPriority('New Priority', '#ff00ff')

      const { priorities } = usePriorityStore.getState()
      const newPriority = priorities[priorities.length - 1]

      expect(priorities).toHaveLength(DEFAULT_PRIORITIES.length + 1)
      expect(newPriority.name).toBe('New Priority')
      expect(newPriority.color).toBe('#ff00ff')
      expect(newPriority.isDefault).toBe(false)
    })

    it('should trim whitespace from priority name', () => {
      const { addPriority } = usePriorityStore.getState()

      addPriority('  Whitespace Name  ', '#ffffff')

      const { priorities } = usePriorityStore.getState()
      const newPriority = priorities[priorities.length - 1]

      expect(newPriority.name).toBe('Whitespace Name')
    })

    it('should generate unique id', () => {
      const { addPriority } = usePriorityStore.getState()

      addPriority('Priority 1', '#111111')
      addPriority('Priority 2', '#222222')

      const { priorities } = usePriorityStore.getState()
      const ids = priorities.map((p) => p.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(priorities.length)
    })

    it('should assign correct order (after existing priorities)', () => {
      const { addPriority } = usePriorityStore.getState()

      addPriority('Priority 4', '#444444')

      const { priorities } = usePriorityStore.getState()
      const newPriority = priorities[priorities.length - 1]

      expect(newPriority.order).toBe(3) // 0, 1, 2 exist, so new is 3
    })

    it('should handle adding multiple priorities', () => {
      const { addPriority } = usePriorityStore.getState()

      addPriority('Priority A', '#aaaaaa')
      addPriority('Priority B', '#bbbbbb')
      addPriority('Priority C', '#cccccc')

      const { priorities } = usePriorityStore.getState()

      expect(priorities).toHaveLength(DEFAULT_PRIORITIES.length + 3)
      expect(priorities[priorities.length - 3].order).toBe(3)
      expect(priorities[priorities.length - 2].order).toBe(4)
      expect(priorities[priorities.length - 1].order).toBe(5)
    })
  })

  describe('updatePriority', () => {
    it('should update priority name', () => {
      const { updatePriority } = usePriorityStore.getState()
      const priorityId = DEFAULT_PRIORITIES[0].id

      updatePriority(priorityId, { name: 'Updated Name' })

      const { priorities } = usePriorityStore.getState()
      const updated = priorities.find((p) => p.id === priorityId)

      expect(updated?.name).toBe('Updated Name')
    })

    it('should update priority color', () => {
      const { updatePriority } = usePriorityStore.getState()
      const priorityId = DEFAULT_PRIORITIES[0].id

      updatePriority(priorityId, { color: '#000000' })

      const { priorities } = usePriorityStore.getState()
      const updated = priorities.find((p) => p.id === priorityId)

      expect(updated?.color).toBe('#000000')
    })

    it('should update multiple fields at once', () => {
      const { updatePriority } = usePriorityStore.getState()
      const priorityId = DEFAULT_PRIORITIES[0].id

      updatePriority(priorityId, { name: 'New Name', color: '#123456' })

      const { priorities } = usePriorityStore.getState()
      const updated = priorities.find((p) => p.id === priorityId)

      expect(updated?.name).toBe('New Name')
      expect(updated?.color).toBe('#123456')
    })

    it('should not affect other priorities', () => {
      const { updatePriority } = usePriorityStore.getState()
      const priorityId = DEFAULT_PRIORITIES[0].id

      updatePriority(priorityId, { name: 'Updated' })

      const { priorities } = usePriorityStore.getState()
      const unchanged = priorities.find((p) => p.id === DEFAULT_PRIORITIES[1].id)

      expect(unchanged?.name).toBe('Todo')
    })

    it('should handle non-existent priority id gracefully', () => {
      const { updatePriority } = usePriorityStore.getState()

      expect(() => updatePriority('non-existent-id', { name: 'Updated' })).not.toThrow()

      const { priorities } = usePriorityStore.getState()
      expect(priorities).toHaveLength(DEFAULT_PRIORITIES.length)
    })

    it('should preserve other fields when updating specific field', () => {
      const { updatePriority } = usePriorityStore.getState()
      const priority = DEFAULT_PRIORITIES[0]

      updatePriority(priority.id, { name: 'Updated Name' })

      const { priorities } = usePriorityStore.getState()
      const updated = priorities.find((p) => p.id === priority.id)

      expect(updated?.color).toBe(priority.color)
      expect(updated?.order).toBe(priority.order)
      expect(updated?.isDefault).toBe(priority.isDefault)
    })
  })

  describe('deletePriority', () => {
    it('should delete a priority and return true', () => {
      const { addPriority, deletePriority } = usePriorityStore.getState()
      addPriority('Extra Priority', '#999999')

      const { priorities: beforeDelete } = usePriorityStore.getState()
      const priorityToDelete = beforeDelete.find((p) => p.name === 'Extra Priority')

      const result = deletePriority(priorityToDelete!.id)

      const { priorities: afterDelete } = usePriorityStore.getState()

      expect(result).toBe(true)
      expect(afterDelete).toHaveLength(DEFAULT_PRIORITIES.length)
      expect(afterDelete.find((p) => p.name === 'Extra Priority')).toBeUndefined()
    })

    it('should not delete the last remaining priority', () => {
      // Set only one priority
      usePriorityStore.setState({ priorities: [DEFAULT_PRIORITIES[0]] })

      const { deletePriority } = usePriorityStore.getState()
      const result = deletePriority(DEFAULT_PRIORITIES[0].id)

      const { priorities } = usePriorityStore.getState()

      expect(result).toBe(false)
      expect(priorities).toHaveLength(1)
    })

    it('should allow deleting when exactly 2 priorities exist', () => {
      usePriorityStore.setState({
        priorities: [DEFAULT_PRIORITIES[0], DEFAULT_PRIORITIES[1]],
      })

      const { deletePriority } = usePriorityStore.getState()
      const result = deletePriority(DEFAULT_PRIORITIES[0].id)

      const { priorities } = usePriorityStore.getState()

      expect(result).toBe(true)
      expect(priorities).toHaveLength(1)
    })

    it('should handle non-existent priority id gracefully', () => {
      const { deletePriority } = usePriorityStore.getState()

      expect(() => deletePriority('non-existent-id')).not.toThrow()

      const { priorities } = usePriorityStore.getState()
      expect(priorities).toHaveLength(DEFAULT_PRIORITIES.length)
    })
  })

  describe('reorderPriorities', () => {
    it('should reorder priorities according to new order array', () => {
      const { reorderPriorities } = usePriorityStore.getState()
      const originalIds = DEFAULT_PRIORITIES.map((p) => p.id)

      // Reverse the order
      reorderPriorities([originalIds[2], originalIds[1], originalIds[0]])

      const { priorities } = usePriorityStore.getState()

      expect(priorities.find((p) => p.id === originalIds[2])?.order).toBe(0)
      expect(priorities.find((p) => p.id === originalIds[1])?.order).toBe(1)
      expect(priorities.find((p) => p.id === originalIds[0])?.order).toBe(2)
    })

    it('should handle partial reorder (missing ids)', () => {
      const { reorderPriorities } = usePriorityStore.getState()
      const originalIds = DEFAULT_PRIORITIES.map((p) => p.id)

      // Only include first two
      reorderPriorities([originalIds[1], originalIds[0]])

      const { priorities } = usePriorityStore.getState()
      const third = priorities.find((p) => p.id === originalIds[2])

      // Third should keep original order
      expect(third?.order).toBe(2)
    })

    it('should update order based on array index', () => {
      const { reorderPriorities } = usePriorityStore.getState()
      const ids = DEFAULT_PRIORITIES.map((p) => p.id)

      reorderPriorities([ids[0], ids[2], ids[1]])

      const { priorities } = usePriorityStore.getState()
      const sorted = [...priorities].sort((a, b) => a.order - b.order)

      expect(sorted.map((p) => p.id)).toEqual([ids[0], ids[2], ids[1]])
    })
  })

  describe('importPriorities', () => {
    it('should replace all priorities with imported ones', () => {
      const { importPriorities } = usePriorityStore.getState()

      const importedPriorities = [
        createMockPriority({ id: 'imported-1', name: 'Imported 1' }),
        createMockPriority({ id: 'imported-2', name: 'Imported 2' }),
      ]

      importPriorities(importedPriorities)

      const { priorities } = usePriorityStore.getState()

      expect(priorities).toHaveLength(2)
      expect(priorities.map((p) => p.name)).toEqual(['Imported 1', 'Imported 2'])
    })

    it('should completely replace, not merge', () => {
      const { importPriorities } = usePriorityStore.getState()

      importPriorities([createMockPriority({ name: 'Only One' })])

      const { priorities } = usePriorityStore.getState()

      expect(priorities).toHaveLength(1)
      expect(priorities.find((p) => p.name === 'Must do asap')).toBeUndefined()
    })
  })

  describe('resetToDefaults', () => {
    it('should restore default priorities', () => {
      const { addPriority, updatePriority, resetToDefaults } = usePriorityStore.getState()

      // Modify store
      addPriority('Extra', '#999999')
      updatePriority(DEFAULT_PRIORITIES[0].id, { name: 'Modified' })

      resetToDefaults()

      const { priorities } = usePriorityStore.getState()

      expect(priorities).toEqual(DEFAULT_PRIORITIES)
    })

    it('should work even with empty priorities', () => {
      usePriorityStore.setState({ priorities: [] })

      const { resetToDefaults } = usePriorityStore.getState()
      resetToDefaults()

      const { priorities } = usePriorityStore.getState()

      expect(priorities).toEqual(DEFAULT_PRIORITIES)
    })
  })

  describe('getPriorityById', () => {
    it('should return priority for valid id', () => {
      const { getPriorityById } = usePriorityStore.getState()

      const priority = getPriorityById(DEFAULT_PRIORITIES[0].id)

      expect(priority).toEqual(DEFAULT_PRIORITIES[0])
    })

    it('should return undefined for non-existent id', () => {
      const { getPriorityById } = usePriorityStore.getState()

      const priority = getPriorityById('non-existent-id')

      expect(priority).toBeUndefined()
    })
  })

  describe('getSortedPriorities', () => {
    it('should return priorities sorted by order', () => {
      const { reorderPriorities, getSortedPriorities } = usePriorityStore.getState()
      const ids = DEFAULT_PRIORITIES.map((p) => p.id)

      // Scramble the order
      reorderPriorities([ids[2], ids[0], ids[1]])

      const sorted = getSortedPriorities()

      expect(sorted[0].id).toBe(ids[2])
      expect(sorted[1].id).toBe(ids[0])
      expect(sorted[2].id).toBe(ids[1])
    })

    it('should return new array, not mutate original', () => {
      const { getSortedPriorities } = usePriorityStore.getState()

      const sorted = getSortedPriorities()
      sorted[0] = createMockPriority({ name: 'Mutated' })

      const { priorities: afterMutation } = usePriorityStore.getState()

      expect(afterMutation[0].name).not.toBe('Mutated')
    })
  })

  describe('edge cases', () => {
    it('should handle empty priority name', () => {
      const { addPriority } = usePriorityStore.getState()

      addPriority('', '#ffffff')

      const { priorities } = usePriorityStore.getState()
      const newPriority = priorities[priorities.length - 1]

      expect(newPriority.name).toBe('')
    })

    it('should handle special characters in name', () => {
      const { addPriority } = usePriorityStore.getState()

      addPriority('<script>alert("xss")</script>', '#ffffff')

      const { priorities } = usePriorityStore.getState()
      const newPriority = priorities[priorities.length - 1]

      expect(newPriority.name).toBe('<script>alert("xss")</script>')
    })

    it('should handle various color formats', () => {
      const { addPriority } = usePriorityStore.getState()

      addPriority('Hex 3', '#fff')
      addPriority('Hex 6', '#ffffff')
      addPriority('RGB string', 'rgb(255,255,255)')

      const { priorities } = usePriorityStore.getState()

      expect(priorities[priorities.length - 3].color).toBe('#fff')
      expect(priorities[priorities.length - 2].color).toBe('#ffffff')
      expect(priorities[priorities.length - 1].color).toBe('rgb(255,255,255)')
    })

    it('should handle rapid successive operations', () => {
      const { addPriority, deletePriority, updatePriority } = usePriorityStore.getState()

      // Add 20 priorities rapidly
      for (let i = 0; i < 20; i++) {
        addPriority(`Priority ${i}`, `#${i.toString().padStart(6, '0')}`)
      }

      expect(usePriorityStore.getState().priorities).toHaveLength(DEFAULT_PRIORITIES.length + 20)

      // Update all
      usePriorityStore.getState().priorities.forEach((p) => {
        updatePriority(p.id, { name: `Updated ${p.name}` })
      })

      // Delete half (keeping at least 1)
      const prioritiesToDelete = usePriorityStore.getState().priorities.slice(0, 10)
      prioritiesToDelete.forEach((p) => {
        deletePriority(p.id)
      })

      expect(usePriorityStore.getState().priorities).toHaveLength(
        DEFAULT_PRIORITIES.length + 20 - 10
      )
    })
  })
})
