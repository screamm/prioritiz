import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  generateId,
  generateToken,
  isValidToken,
  debounce,
  copyToClipboard,
  formatDate,
  isValidEmail,
} from '@/utils'

describe('utility functions', () => {
  describe('cn (classname merger)', () => {
    it('should merge simple class names', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const isHidden = false
      const result = cn('base', isActive && 'active', isHidden && 'hidden')
      expect(result).toBe('base active')
    })

    it('should merge tailwind classes correctly', () => {
      const result = cn('p-4', 'p-2')
      expect(result).toBe('p-2')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'])
      expect(result).toBe('class1 class2')
    })

    it('should handle object notation', () => {
      const result = cn({ active: true, hidden: false })
      expect(result).toBe('active')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle null and undefined', () => {
      const result = cn('base', null, undefined, 'end')
      expect(result).toBe('base end')
    })

    it('should merge conflicting tailwind utilities', () => {
      const result = cn('text-red-500', 'text-blue-500')
      expect(result).toBe('text-blue-500')
    })

    it('should preserve non-conflicting utilities', () => {
      const result = cn('bg-red-500', 'text-blue-500')
      expect(result).toBe('bg-red-500 text-blue-500')
    })
  })

  describe('generateId', () => {
    it('should generate a string id', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
    })

    it('should generate unique ids', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 1000; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(1000)
    })

    it('should include timestamp', () => {
      const before = Date.now()
      const id = generateId()
      const after = Date.now()

      const timestamp = parseInt(id.split('-')[0])
      expect(timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp).toBeLessThanOrEqual(after)
    })

    it('should have proper format (timestamp-random)', () => {
      const id = generateId()
      expect(id).toMatch(/^\d+-[a-z0-9]+$/)
    })
  })

  describe('generateToken', () => {
    it('should generate token in XXX-XXX-XXX format', () => {
      const token = generateToken()
      expect(token).toMatch(/^[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}$/)
    })

    it('should generate tokens of correct length', () => {
      const token = generateToken()
      expect(token.length).toBe(11) // 3 + 1 + 3 + 1 + 3
    })

    it('should generate unique tokens', () => {
      const tokens = new Set<string>()
      for (let i = 0; i < 1000; i++) {
        tokens.add(generateToken())
      }
      expect(tokens.size).toBe(1000)
    })

    it('should not include confusing characters (0, O, 1, I) in generated tokens', () => {
      // generateToken uses a restricted charset that excludes O, 0, 1, I
      const confusingChars = ['0', 'O', '1', 'I']

      for (let i = 0; i < 100; i++) {
        const token = generateToken()
        confusingChars.forEach((char) => {
          expect(token).not.toContain(char)
        })
      }
    })

    it('should only contain uppercase letters and numbers', () => {
      const token = generateToken()
      const parts = token.split('-')

      parts.forEach((part) => {
        expect(part).toMatch(/^[A-Z2-9]+$/)
      })
    })

    it('should have three segments separated by dashes', () => {
      const token = generateToken()
      const parts = token.split('-')

      expect(parts).toHaveLength(3)
      expect(parts[0]).toHaveLength(3)
      expect(parts[1]).toHaveLength(3)
      expect(parts[2]).toHaveLength(3)
    })
  })

  describe('isValidToken', () => {
    it('should validate correct token format', () => {
      expect(isValidToken('ABC-DEF-GHJ')).toBe(true)
      expect(isValidToken('XYZ-234-567')).toBe(true)
      expect(isValidToken('AAA-BBB-CCC')).toBe(true)
    })

    it('should validate tokens with numbers 2-9', () => {
      expect(isValidToken('A23-B45-C67')).toBe(true)
      expect(isValidToken('234-567-89A')).toBe(true)
    })

    it('should reject tokens without dashes', () => {
      expect(isValidToken('ABCDEFGHJ')).toBe(false)
    })

    it('should reject tokens with wrong segment lengths', () => {
      expect(isValidToken('AB-CDE-FGH')).toBe(false)
      expect(isValidToken('ABCD-EF-GHJ')).toBe(false)
      expect(isValidToken('ABC-DEFG-HJ')).toBe(false)
    })

    it('should reject tokens with lowercase letters', () => {
      expect(isValidToken('abc-def-ghj')).toBe(false)
      expect(isValidToken('ABC-def-GHJ')).toBe(false)
    })

    it('should reject tokens with invalid characters', () => {
      expect(isValidToken('AB!-DEF-GHJ')).toBe(false)
      expect(isValidToken('ABC-D F-GHJ')).toBe(false)
      expect(isValidToken('ABC-DEF-GH@')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(isValidToken('')).toBe(false)
    })

    it('should reject tokens with wrong number of segments', () => {
      expect(isValidToken('ABC-DEF')).toBe(false)
      expect(isValidToken('ABC-DEF-GHJ-KLM')).toBe(false)
    })

    it('should reject tokens with digits 0 and 1', () => {
      // The regex [A-Z2-9] rejects 0 and 1
      expect(isValidToken('ABC-DEF-GH0')).toBe(false) // 0 not allowed
      expect(isValidToken('ABC-DEF-GH1')).toBe(false) // 1 not allowed
    })

    it('should accept tokens with uppercase O and I (they are valid letters)', () => {
      // The regex [A-Z2-9] includes all uppercase A-Z
      // O and I are valid uppercase letters
      expect(isValidToken('ABC-DEF-GHO')).toBe(true)
      expect(isValidToken('ABC-DEF-GHI')).toBe(true)
    })

    it('should validate generated tokens', () => {
      for (let i = 0; i < 100; i++) {
        const token = generateToken()
        expect(isValidToken(token)).toBe(true)
      }
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should delay function execution', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      expect(mockFn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should reset timer on subsequent calls', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      vi.advanceTimersByTime(50)

      debouncedFn()
      vi.advanceTimersByTime(50)

      expect(mockFn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments to debounced function', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1', 'arg2')
      vi.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should use last arguments when called multiple times', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('first')
      debouncedFn('second')
      debouncedFn('third')

      vi.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('third')
    })

    it('should handle zero delay', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 0)

      debouncedFn()
      vi.advanceTimersByTime(0)

      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should handle long delays', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 10000)

      debouncedFn()
      vi.advanceTimersByTime(5000)
      expect(mockFn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(5000)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('copyToClipboard', () => {
    beforeEach(() => {
      vi.resetAllMocks()
    })

    it('should copy text using clipboard API', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })

      const result = await copyToClipboard('test text')

      expect(mockWriteText).toHaveBeenCalledWith('test text')
      expect(result).toBe(true)
    })

    it('should return true on success', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })

      const result = await copyToClipboard('text')
      expect(result).toBe(true)
    })

    it('should handle empty string', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })

      const result = await copyToClipboard('')

      expect(mockWriteText).toHaveBeenCalledWith('')
      expect(result).toBe(true)
    })

    it('should handle special characters', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      })

      const specialText = '<script>alert("xss")</script>'
      const result = await copyToClipboard(specialText)

      expect(mockWriteText).toHaveBeenCalledWith(specialText)
      expect(result).toBe(true)
    })
  })

  describe('formatDate', () => {
    it('should format timestamp to Swedish locale', () => {
      // January 1, 2024 12:30:00 UTC
      const timestamp = 1704109800000

      const result = formatDate(timestamp)

      // Should contain year, month, day, and time
      expect(result).toContain('2024')
      expect(result).toMatch(/\d{2}:\d{2}/)
    })

    it('should handle different timestamps', () => {
      const date1 = formatDate(0) // Unix epoch
      const date2 = formatDate(1000000000000) // Sep 2001

      expect(date1).toBeDefined()
      expect(date2).toBeDefined()
      expect(date1).not.toBe(date2)
    })

    it('should include time in 24-hour format', () => {
      // Some afternoon time
      const timestamp = 1704135000000 // 2024-01-01 19:30:00 UTC

      const result = formatDate(timestamp)

      expect(result).toMatch(/\d{2}:\d{2}/)
    })

    it('should handle current timestamp', () => {
      const now = Date.now()
      const result = formatDate(now)

      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should format consistently', () => {
      const timestamp = 1704067200000

      const result1 = formatDate(timestamp)
      const result2 = formatDate(timestamp)

      expect(result1).toBe(result2)
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.org')).toBe(true)
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true)
    })

    it('should validate emails with subdomains', () => {
      expect(isValidEmail('user@mail.example.com')).toBe(true)
      expect(isValidEmail('test@sub.domain.example.org')).toBe(true)
    })

    it('should validate emails with numbers', () => {
      expect(isValidEmail('user123@example.com')).toBe(true)
      expect(isValidEmail('test@123.com')).toBe(true)
    })

    it('should reject emails without @', () => {
      expect(isValidEmail('userexample.com')).toBe(false)
    })

    it('should reject emails without domain', () => {
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('user@.')).toBe(false)
    })

    it('should reject emails without local part', () => {
      expect(isValidEmail('@example.com')).toBe(false)
    })

    it('should reject emails with spaces', () => {
      expect(isValidEmail('user name@example.com')).toBe(false)
      expect(isValidEmail('user@exam ple.com')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(isValidEmail('')).toBe(false)
    })

    it('should reject emails without TLD', () => {
      expect(isValidEmail('user@domain')).toBe(false)
    })

    it('should reject emails with multiple @', () => {
      expect(isValidEmail('user@@example.com')).toBe(false)
      expect(isValidEmail('user@example@com')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(isValidEmail('a@b.c')).toBe(true) // minimal valid
      expect(isValidEmail('very.long.email.address.here@subdomain.example.co.uk')).toBe(true)
    })
  })
})
