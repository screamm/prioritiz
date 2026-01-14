import { describe, it, expect } from 'vitest'
import { DEFAULT_PRIORITIES, THEME_CONFIGS } from '@/types'
import type { Todo, Priority, Settings, ThemeType, ToastMessage } from '@/types'

describe('types and default data', () => {
  describe('DEFAULT_PRIORITIES', () => {
    it('should have exactly 3 default priorities', () => {
      expect(DEFAULT_PRIORITIES).toHaveLength(3)
    })

    it('should have "Must do asap" as first priority', () => {
      expect(DEFAULT_PRIORITIES[0]).toMatchObject({
        id: 'must-do',
        name: 'Must do asap',
        color: '#ef4444',
        order: 0,
        isDefault: true,
      })
    })

    it('should have "Todo" as second priority', () => {
      expect(DEFAULT_PRIORITIES[1]).toMatchObject({
        id: 'todo',
        name: 'Todo',
        color: '#eab308',
        order: 1,
        isDefault: true,
      })
    })

    it('should have "Only do in spare time" as third priority', () => {
      expect(DEFAULT_PRIORITIES[2]).toMatchObject({
        id: 'spare-time',
        name: 'Only do in spare time',
        color: '#22c55e',
        order: 2,
        isDefault: true,
      })
    })

    it('should have unique ids', () => {
      const ids = DEFAULT_PRIORITIES.map((p) => p.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(DEFAULT_PRIORITIES.length)
    })

    it('should have sequential order values', () => {
      DEFAULT_PRIORITIES.forEach((priority, index) => {
        expect(priority.order).toBe(index)
      })
    })

    it('should all be marked as default', () => {
      expect(DEFAULT_PRIORITIES.every((p) => p.isDefault)).toBe(true)
    })

    it('should have valid hex color codes', () => {
      DEFAULT_PRIORITIES.forEach((priority) => {
        expect(priority.color).toMatch(/^#[0-9a-f]{6}$/i)
      })
    })

    it('should have colors representing traffic light pattern (red, yellow, green)', () => {
      // Red for high priority
      expect(DEFAULT_PRIORITIES[0].color).toBe('#ef4444')
      // Yellow for medium priority
      expect(DEFAULT_PRIORITIES[1].color).toBe('#eab308')
      // Green for low priority
      expect(DEFAULT_PRIORITIES[2].color).toBe('#22c55e')
    })
  })

  describe('THEME_CONFIGS', () => {
    it('should have 7 theme configurations', () => {
      expect(THEME_CONFIGS).toHaveLength(7)
    })

    it('should include sunset theme', () => {
      const sunset = THEME_CONFIGS.find((t) => t.id === 'sunset')
      expect(sunset).toMatchObject({
        id: 'sunset',
        name: 'Sunset',
        description: 'Rogivande solnedgång',
      })
    })

    it('should include starwars (hyperspace) theme', () => {
      const starwars = THEME_CONFIGS.find((t) => t.id === 'starwars')
      expect(starwars).toMatchObject({
        id: 'starwars',
        name: 'Hyperspace',
        description: 'Resa genom hyperrymden',
      })
    })

    it('should include starfall theme', () => {
      const starfall = THEME_CONFIGS.find((t) => t.id === 'starfall')
      expect(starfall).toMatchObject({
        id: 'starfall',
        name: 'Star Fall',
      })
    })

    it('should include aurora theme', () => {
      const aurora = THEME_CONFIGS.find((t) => t.id === 'aurora')
      expect(aurora).toMatchObject({
        id: 'aurora',
        name: 'Aurora',
        description: 'Norrsken dansar på himlen',
      })
    })

    it('should include ocean theme', () => {
      const ocean = THEME_CONFIGS.find((t) => t.id === 'ocean')
      expect(ocean).toMatchObject({
        id: 'ocean',
        name: 'Ocean',
        description: 'Djupt under havsytan',
      })
    })

    it('should have unique theme ids', () => {
      const ids = THEME_CONFIGS.map((t) => t.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(THEME_CONFIGS.length)
    })

    it('should have preview paths for all themes', () => {
      THEME_CONFIGS.forEach((theme) => {
        expect(theme.preview).toBeDefined()
        expect(theme.preview).toMatch(/^\/themes\//)
      })
    })

    it('should have Swedish descriptions', () => {
      // All descriptions should be non-empty strings
      THEME_CONFIGS.forEach((theme) => {
        expect(theme.description).toBeDefined()
        expect(theme.description.length).toBeGreaterThan(0)
      })
    })

    it('should have consistent preview path format', () => {
      THEME_CONFIGS.forEach((theme) => {
        expect(theme.preview).toBe(`/themes/${theme.id}.jpg`)
      })
    })
  })

  describe('type structure validation', () => {
    describe('Todo type', () => {
      it('should accept valid todo structure', () => {
        const validTodo: Todo = {
          id: 'test-id',
          text: 'Test todo',
          completed: false,
          priorityId: null,
          order: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        expect(validTodo.id).toBeDefined()
        expect(validTodo.text).toBeDefined()
        expect(typeof validTodo.completed).toBe('boolean')
      })

      it('should allow priorityId to be string or null', () => {
        const todoWithPriority: Todo = {
          id: 'test-id',
          text: 'Test',
          completed: false,
          priorityId: 'priority-1',
          order: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        const todoWithoutPriority: Todo = {
          id: 'test-id',
          text: 'Test',
          completed: false,
          priorityId: null,
          order: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        expect(todoWithPriority.priorityId).toBe('priority-1')
        expect(todoWithoutPriority.priorityId).toBeNull()
      })
    })

    describe('Priority type', () => {
      it('should accept valid priority structure', () => {
        const validPriority: Priority = {
          id: 'test-priority',
          name: 'Test Priority',
          color: '#ff0000',
          order: 0,
          isDefault: false,
        }

        expect(validPriority.id).toBeDefined()
        expect(validPriority.name).toBeDefined()
        expect(validPriority.color).toBeDefined()
      })

      it('should allow optional icon field', () => {
        const priorityWithIcon: Priority = {
          id: 'test',
          name: 'Test',
          color: '#000000',
          icon: 'star',
          order: 0,
          isDefault: false,
        }

        const priorityWithoutIcon: Priority = {
          id: 'test',
          name: 'Test',
          color: '#000000',
          order: 0,
          isDefault: false,
        }

        expect(priorityWithIcon.icon).toBe('star')
        expect(priorityWithoutIcon.icon).toBeUndefined()
      })
    })

    describe('Settings type', () => {
      it('should accept valid settings structure', () => {
        const validSettings: Settings = {
          theme: 'starfall',
          token: 'ABC-DEF-GHI',
          tokenCreatedAt: Date.now(),
          lastSyncAt: Date.now(),
        }

        expect(validSettings.theme).toBe('starfall')
        expect(validSettings.token).toBeDefined()
      })

      it('should allow null token', () => {
        const settings: Settings = {
          theme: 'aurora',
          token: null,
          tokenCreatedAt: null,
          lastSyncAt: null,
        }

        expect(settings.token).toBeNull()
        expect(settings.tokenCreatedAt).toBeNull()
        expect(settings.lastSyncAt).toBeNull()
      })
    })

    describe('ThemeType', () => {
      it('should cover all theme config ids', () => {
        const themeTypes: ThemeType[] = ['sunset', 'starwars', 'starfall', 'stars', 'stars2', 'aurora', 'ocean']
        const configIds = THEME_CONFIGS.map((t) => t.id)

        themeTypes.forEach((theme) => {
          expect(configIds).toContain(theme)
        })
      })
    })

    describe('ToastMessage type', () => {
      it('should accept all valid toast types', () => {
        const successToast: ToastMessage = {
          id: 'toast-1',
          type: 'success',
          message: 'Success message',
        }

        const errorToast: ToastMessage = {
          id: 'toast-2',
          type: 'error',
          message: 'Error message',
        }

        const infoToast: ToastMessage = {
          id: 'toast-3',
          type: 'info',
          message: 'Info message',
        }

        const warningToast: ToastMessage = {
          id: 'toast-4',
          type: 'warning',
          message: 'Warning message',
        }

        expect(successToast.type).toBe('success')
        expect(errorToast.type).toBe('error')
        expect(infoToast.type).toBe('info')
        expect(warningToast.type).toBe('warning')
      })

      it('should allow optional duration', () => {
        const toastWithDuration: ToastMessage = {
          id: 'toast-1',
          type: 'success',
          message: 'Test',
          duration: 5000,
        }

        const toastWithoutDuration: ToastMessage = {
          id: 'toast-2',
          type: 'success',
          message: 'Test',
        }

        expect(toastWithDuration.duration).toBe(5000)
        expect(toastWithoutDuration.duration).toBeUndefined()
      })
    })
  })

  describe('data consistency', () => {
    it('should have priority IDs that can be referenced', () => {
      const priorityIds = DEFAULT_PRIORITIES.map((p) => p.id)

      // Ensure we can use these IDs in todos
      const todo: Todo = {
        id: 'test',
        text: 'Test',
        completed: false,
        priorityId: priorityIds[0],
        order: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      expect(priorityIds).toContain(todo.priorityId)
    })

    it('should have theme IDs that can be used in settings', () => {
      const themeIds = THEME_CONFIGS.map((t) => t.id)

      const settings: Settings = {
        theme: themeIds[0],
        token: null,
        tokenCreatedAt: null,
        lastSyncAt: null,
      }

      expect(themeIds).toContain(settings.theme)
    })
  })
})
