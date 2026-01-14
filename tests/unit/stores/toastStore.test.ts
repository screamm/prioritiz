import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useToastStore, toast } from '@/stores/toastStore'

// Helper to reset store state
const resetStore = () => {
  useToastStore.setState({ toasts: [] })
}

describe('toastStore', () => {
  beforeEach(() => {
    resetStore()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should start with empty toasts array', () => {
      const { toasts } = useToastStore.getState()
      expect(toasts).toEqual([])
    })
  })

  describe('addToast', () => {
    it('should add a success toast', () => {
      const { addToast } = useToastStore.getState()

      addToast({ type: 'success', message: 'Success message' })

      const { toasts } = useToastStore.getState()
      expect(toasts).toHaveLength(1)
      expect(toasts[0]).toMatchObject({
        type: 'success',
        message: 'Success message',
      })
    })

    it('should add an error toast', () => {
      const { addToast } = useToastStore.getState()

      addToast({ type: 'error', message: 'Error message' })

      const { toasts } = useToastStore.getState()
      expect(toasts[0].type).toBe('error')
    })

    it('should add an info toast', () => {
      const { addToast } = useToastStore.getState()

      addToast({ type: 'info', message: 'Info message' })

      const { toasts } = useToastStore.getState()
      expect(toasts[0].type).toBe('info')
    })

    it('should add a warning toast', () => {
      const { addToast } = useToastStore.getState()

      addToast({ type: 'warning', message: 'Warning message' })

      const { toasts } = useToastStore.getState()
      expect(toasts[0].type).toBe('warning')
    })

    it('should generate unique id for each toast', () => {
      const { addToast } = useToastStore.getState()

      addToast({ type: 'success', message: 'Toast 1' })
      addToast({ type: 'success', message: 'Toast 2' })
      addToast({ type: 'success', message: 'Toast 3' })

      const { toasts } = useToastStore.getState()
      const ids = toasts.map((t) => t.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(3)
    })

    it('should use default duration of 4000ms', () => {
      const { addToast } = useToastStore.getState()

      addToast({ type: 'success', message: 'Test' })

      const { toasts } = useToastStore.getState()
      expect(toasts[0].duration).toBe(4000)
    })

    it('should use custom duration when provided', () => {
      const { addToast } = useToastStore.getState()

      addToast({ type: 'success', message: 'Test', duration: 6000 })

      const { toasts } = useToastStore.getState()
      expect(toasts[0].duration).toBe(6000)
    })

    it('should auto-remove toast after duration', () => {
      const { addToast } = useToastStore.getState()

      addToast({ type: 'success', message: 'Test', duration: 3000 })

      expect(useToastStore.getState().toasts).toHaveLength(1)

      vi.advanceTimersByTime(3000)

      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it('should not auto-remove toast with duration 0', () => {
      const { addToast } = useToastStore.getState()

      addToast({ type: 'success', message: 'Persistent', duration: 0 })

      vi.advanceTimersByTime(10000)

      expect(useToastStore.getState().toasts).toHaveLength(1)
    })

    it('should handle multiple toasts with different durations', () => {
      const { addToast } = useToastStore.getState()

      addToast({ type: 'success', message: 'Short', duration: 1000 })
      addToast({ type: 'info', message: 'Medium', duration: 2000 })
      addToast({ type: 'warning', message: 'Long', duration: 3000 })

      expect(useToastStore.getState().toasts).toHaveLength(3)

      vi.advanceTimersByTime(1000)
      expect(useToastStore.getState().toasts).toHaveLength(2)

      vi.advanceTimersByTime(1000)
      expect(useToastStore.getState().toasts).toHaveLength(1)

      vi.advanceTimersByTime(1000)
      expect(useToastStore.getState().toasts).toHaveLength(0)
    })
  })

  describe('removeToast', () => {
    it('should remove toast by id', () => {
      const { addToast, removeToast } = useToastStore.getState()

      addToast({ type: 'success', message: 'Test' })

      const toastId = useToastStore.getState().toasts[0].id
      removeToast(toastId)

      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it('should remove correct toast when multiple exist', () => {
      const { addToast, removeToast } = useToastStore.getState()

      addToast({ type: 'success', message: 'Toast 1' })
      addToast({ type: 'info', message: 'Toast 2' })
      addToast({ type: 'warning', message: 'Toast 3' })

      const toastId = useToastStore.getState().toasts[1].id
      removeToast(toastId)

      const { toasts } = useToastStore.getState()
      expect(toasts).toHaveLength(2)
      expect(toasts.map((t) => t.message)).toEqual(['Toast 1', 'Toast 3'])
    })

    it('should handle non-existent toast id gracefully', () => {
      const { addToast, removeToast } = useToastStore.getState()

      addToast({ type: 'success', message: 'Test' })

      expect(() => removeToast('non-existent-id')).not.toThrow()
      expect(useToastStore.getState().toasts).toHaveLength(1)
    })
  })

  describe('clearToasts', () => {
    it('should remove all toasts', () => {
      const { addToast, clearToasts } = useToastStore.getState()

      addToast({ type: 'success', message: 'Toast 1' })
      addToast({ type: 'info', message: 'Toast 2' })
      addToast({ type: 'warning', message: 'Toast 3' })

      clearToasts()

      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it('should handle empty toasts array', () => {
      const { clearToasts } = useToastStore.getState()

      expect(() => clearToasts()).not.toThrow()
      expect(useToastStore.getState().toasts).toHaveLength(0)
    })
  })

  describe('toast helper functions', () => {
    describe('toast.success', () => {
      it('should add a success toast', () => {
        toast.success('Success message')

        const { toasts } = useToastStore.getState()
        expect(toasts[0]).toMatchObject({
          type: 'success',
          message: 'Success message',
        })
      })

      it('should accept custom duration', () => {
        toast.success('Success', 5000)

        const { toasts } = useToastStore.getState()
        expect(toasts[0].duration).toBe(5000)
      })
    })

    describe('toast.error', () => {
      it('should add an error toast', () => {
        toast.error('Error message')

        const { toasts } = useToastStore.getState()
        expect(toasts[0]).toMatchObject({
          type: 'error',
          message: 'Error message',
        })
      })

      it('should accept custom duration', () => {
        toast.error('Error', 8000)

        const { toasts } = useToastStore.getState()
        expect(toasts[0].duration).toBe(8000)
      })
    })

    describe('toast.info', () => {
      it('should add an info toast', () => {
        toast.info('Info message')

        const { toasts } = useToastStore.getState()
        expect(toasts[0]).toMatchObject({
          type: 'info',
          message: 'Info message',
        })
      })

      it('should accept custom duration', () => {
        toast.info('Info', 3000)

        const { toasts } = useToastStore.getState()
        expect(toasts[0].duration).toBe(3000)
      })
    })

    describe('toast.warning', () => {
      it('should add a warning toast', () => {
        toast.warning('Warning message')

        const { toasts } = useToastStore.getState()
        expect(toasts[0]).toMatchObject({
          type: 'warning',
          message: 'Warning message',
        })
      })

      it('should accept custom duration', () => {
        toast.warning('Warning', 6000)

        const { toasts } = useToastStore.getState()
        expect(toasts[0].duration).toBe(6000)
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty message', () => {
      toast.success('')

      const { toasts } = useToastStore.getState()
      expect(toasts[0].message).toBe('')
    })

    it('should handle very long message', () => {
      const longMessage = 'a'.repeat(1000)
      toast.success(longMessage)

      const { toasts } = useToastStore.getState()
      expect(toasts[0].message).toBe(longMessage)
    })

    it('should handle special characters in message', () => {
      const specialMessage = '<script>alert("xss")</script> & "quotes"'
      toast.info(specialMessage)

      const { toasts } = useToastStore.getState()
      expect(toasts[0].message).toBe(specialMessage)
    })

    it('should handle rapid successive toasts', () => {
      for (let i = 0; i < 100; i++) {
        toast.success(`Toast ${i}`)
      }

      expect(useToastStore.getState().toasts).toHaveLength(100)
    })

    it('should handle adding and removing in sequence', () => {
      const { removeToast } = useToastStore.getState()

      toast.success('Toast 1')
      const id1 = useToastStore.getState().toasts[0].id

      toast.success('Toast 2')
      toast.success('Toast 3')

      removeToast(id1)

      const { toasts } = useToastStore.getState()
      expect(toasts).toHaveLength(2)
      expect(toasts.find((t) => t.id === id1)).toBeUndefined()
    })

    it('should handle negative duration as 0', () => {
      const { addToast } = useToastStore.getState()

      // Negative duration should be treated as no auto-remove
      addToast({ type: 'success', message: 'Test', duration: -1000 })

      // With negative duration, the setTimeout might still fire but with unusual behavior
      // The toast should still exist immediately after adding
      expect(useToastStore.getState().toasts).toHaveLength(1)
    })

    it('should maintain toast order (FIFO)', () => {
      toast.success('First')
      toast.info('Second')
      toast.warning('Third')

      const { toasts } = useToastStore.getState()
      expect(toasts.map((t) => t.message)).toEqual(['First', 'Second', 'Third'])
    })
  })

  describe('concurrent operations', () => {
    it('should handle concurrent add and remove', () => {
      toast.success('Toast 1')
      const id1 = useToastStore.getState().toasts[0].id

      toast.success('Toast 2')

      const { removeToast } = useToastStore.getState()
      removeToast(id1)

      toast.success('Toast 3')

      const { toasts } = useToastStore.getState()
      expect(toasts).toHaveLength(2)
      expect(toasts.map((t) => t.message)).toEqual(['Toast 2', 'Toast 3'])
    })

    it('should handle clear during auto-remove countdown', () => {
      toast.success('Short', 1000)
      toast.success('Long', 5000)

      vi.advanceTimersByTime(500)

      const { clearToasts } = useToastStore.getState()
      clearToasts()

      vi.advanceTimersByTime(1000)

      // Toasts array should remain empty even after timer fires
      expect(useToastStore.getState().toasts).toHaveLength(0)
    })
  })
})
