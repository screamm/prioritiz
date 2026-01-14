import { describe, it, expect } from 'vitest'
import { STORAGE_KEYS, LIMITS, ANIMATION, Z_INDEX, SYNC_DEBOUNCE_MS, SYNC_RETRY_DELAY_MS } from '@/utils/constants'

describe('constants', () => {
  describe('STORAGE_KEYS', () => {
    it('should have TODOS key', () => {
      expect(STORAGE_KEYS.TODOS).toBe('prioritiz_todos')
    })

    it('should have PRIORITIES key', () => {
      expect(STORAGE_KEYS.PRIORITIES).toBe('prioritiz_priorities')
    })

    it('should have SETTINGS key', () => {
      expect(STORAGE_KEYS.SETTINGS).toBe('prioritiz_settings')
    })

    it('should have unique values', () => {
      const values = Object.values(STORAGE_KEYS)
      const uniqueValues = new Set(values)
      expect(uniqueValues.size).toBe(values.length)
    })

    it('should be readonly', () => {
      // TypeScript ensures this at compile time with 'as const'
      // Runtime check that values are strings
      Object.values(STORAGE_KEYS).forEach((value) => {
        expect(typeof value).toBe('string')
      })
    })
  })

  describe('LIMITS', () => {
    it('should have TODO_TEXT_MAX limit', () => {
      expect(LIMITS.TODO_TEXT_MAX).toBe(500)
    })

    it('should have PRIORITY_NAME_MAX limit', () => {
      expect(LIMITS.PRIORITY_NAME_MAX).toBe(50)
    })

    it('should have MAX_TODOS limit', () => {
      expect(LIMITS.MAX_TODOS).toBe(1000)
    })

    it('should have MAX_PRIORITIES limit', () => {
      expect(LIMITS.MAX_PRIORITIES).toBe(20)
    })

    it('should have reasonable values', () => {
      expect(LIMITS.TODO_TEXT_MAX).toBeGreaterThan(0)
      expect(LIMITS.PRIORITY_NAME_MAX).toBeGreaterThan(0)
      expect(LIMITS.MAX_TODOS).toBeGreaterThan(0)
      expect(LIMITS.MAX_PRIORITIES).toBeGreaterThan(0)
    })

    it('should have TODO_TEXT_MAX greater than PRIORITY_NAME_MAX', () => {
      expect(LIMITS.TODO_TEXT_MAX).toBeGreaterThan(LIMITS.PRIORITY_NAME_MAX)
    })
  })

  describe('ANIMATION', () => {
    it('should have FAST duration', () => {
      expect(ANIMATION.FAST).toBe(150)
    })

    it('should have NORMAL duration', () => {
      expect(ANIMATION.NORMAL).toBe(300)
    })

    it('should have SLOW duration', () => {
      expect(ANIMATION.SLOW).toBe(500)
    })

    it('should be in ascending order', () => {
      expect(ANIMATION.FAST).toBeLessThan(ANIMATION.NORMAL)
      expect(ANIMATION.NORMAL).toBeLessThan(ANIMATION.SLOW)
    })

    it('should have positive values', () => {
      expect(ANIMATION.FAST).toBeGreaterThan(0)
      expect(ANIMATION.NORMAL).toBeGreaterThan(0)
      expect(ANIMATION.SLOW).toBeGreaterThan(0)
    })
  })

  describe('Z_INDEX', () => {
    it('should have BACKGROUND z-index', () => {
      expect(Z_INDEX.BACKGROUND).toBe(0)
    })

    it('should have CONTENT z-index', () => {
      expect(Z_INDEX.CONTENT).toBe(10)
    })

    it('should have DRAG_OVERLAY z-index', () => {
      expect(Z_INDEX.DRAG_OVERLAY).toBe(100)
    })

    it('should have MODAL_BACKDROP z-index', () => {
      expect(Z_INDEX.MODAL_BACKDROP).toBe(200)
    })

    it('should have MODAL z-index', () => {
      expect(Z_INDEX.MODAL).toBe(210)
    })

    it('should have TOAST z-index', () => {
      expect(Z_INDEX.TOAST).toBe(300)
    })

    it('should have layers in correct stacking order', () => {
      expect(Z_INDEX.BACKGROUND).toBeLessThan(Z_INDEX.CONTENT)
      expect(Z_INDEX.CONTENT).toBeLessThan(Z_INDEX.DRAG_OVERLAY)
      expect(Z_INDEX.DRAG_OVERLAY).toBeLessThan(Z_INDEX.MODAL_BACKDROP)
      expect(Z_INDEX.MODAL_BACKDROP).toBeLessThan(Z_INDEX.MODAL)
      expect(Z_INDEX.MODAL).toBeLessThan(Z_INDEX.TOAST)
    })

    it('should have MODAL above MODAL_BACKDROP', () => {
      expect(Z_INDEX.MODAL).toBeGreaterThan(Z_INDEX.MODAL_BACKDROP)
    })
  })

  describe('SYNC constants', () => {
    it('should have SYNC_DEBOUNCE_MS', () => {
      expect(SYNC_DEBOUNCE_MS).toBe(5000)
    })

    it('should have SYNC_RETRY_DELAY_MS', () => {
      expect(SYNC_RETRY_DELAY_MS).toBe(10000)
    })

    it('should have retry delay greater than debounce', () => {
      expect(SYNC_RETRY_DELAY_MS).toBeGreaterThan(SYNC_DEBOUNCE_MS)
    })

    it('should have reasonable sync delays', () => {
      // At least 1 second debounce
      expect(SYNC_DEBOUNCE_MS).toBeGreaterThanOrEqual(1000)
      // At least 5 seconds retry
      expect(SYNC_RETRY_DELAY_MS).toBeGreaterThanOrEqual(5000)
    })
  })

  describe('type safety', () => {
    it('should have all expected keys in STORAGE_KEYS', () => {
      expect(STORAGE_KEYS).toHaveProperty('TODOS')
      expect(STORAGE_KEYS).toHaveProperty('PRIORITIES')
      expect(STORAGE_KEYS).toHaveProperty('SETTINGS')
    })

    it('should have all expected keys in LIMITS', () => {
      expect(LIMITS).toHaveProperty('TODO_TEXT_MAX')
      expect(LIMITS).toHaveProperty('PRIORITY_NAME_MAX')
      expect(LIMITS).toHaveProperty('MAX_TODOS')
      expect(LIMITS).toHaveProperty('MAX_PRIORITIES')
    })

    it('should have all expected keys in ANIMATION', () => {
      expect(ANIMATION).toHaveProperty('FAST')
      expect(ANIMATION).toHaveProperty('NORMAL')
      expect(ANIMATION).toHaveProperty('SLOW')
    })

    it('should have all expected keys in Z_INDEX', () => {
      expect(Z_INDEX).toHaveProperty('BACKGROUND')
      expect(Z_INDEX).toHaveProperty('CONTENT')
      expect(Z_INDEX).toHaveProperty('DRAG_OVERLAY')
      expect(Z_INDEX).toHaveProperty('MODAL_BACKDROP')
      expect(Z_INDEX).toHaveProperty('MODAL')
      expect(Z_INDEX).toHaveProperty('TOAST')
    })
  })
})
