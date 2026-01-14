import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSettingsStore, ensureToken } from '@/stores/settingsStore'
import type { ThemeType } from '@/types'

// Helper to reset store state
const resetStore = () => {
  useSettingsStore.setState({
    theme: 'starfall',
    token: null,
    tokenCreatedAt: null,
    lastSyncAt: null,
  })
}

describe('settingsStore', () => {
  beforeEach(() => {
    resetStore()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have default theme as starfall', () => {
      const { theme } = useSettingsStore.getState()
      expect(theme).toBe('starfall')
    })

    it('should have null token initially', () => {
      const { token } = useSettingsStore.getState()
      expect(token).toBeNull()
    })

    it('should have null tokenCreatedAt initially', () => {
      const { tokenCreatedAt } = useSettingsStore.getState()
      expect(tokenCreatedAt).toBeNull()
    })

    it('should have null lastSyncAt initially', () => {
      const { lastSyncAt } = useSettingsStore.getState()
      expect(lastSyncAt).toBeNull()
    })
  })

  describe('setTheme', () => {
    it('should update theme to sunset', () => {
      const { setTheme } = useSettingsStore.getState()

      setTheme('sunset')

      const { theme } = useSettingsStore.getState()
      expect(theme).toBe('sunset')
    })

    it('should update theme to starwars', () => {
      const { setTheme } = useSettingsStore.getState()

      setTheme('starwars')

      const { theme } = useSettingsStore.getState()
      expect(theme).toBe('starwars')
    })

    it('should update theme to aurora', () => {
      const { setTheme } = useSettingsStore.getState()

      setTheme('aurora')

      const { theme } = useSettingsStore.getState()
      expect(theme).toBe('aurora')
    })

    it('should update theme to ocean', () => {
      const { setTheme } = useSettingsStore.getState()

      setTheme('ocean')

      const { theme } = useSettingsStore.getState()
      expect(theme).toBe('ocean')
    })

    it('should cycle through all available themes', () => {
      const themes: ThemeType[] = ['sunset', 'starwars', 'starfall', 'stars', 'stars2', 'aurora', 'ocean']
      const { setTheme } = useSettingsStore.getState()

      themes.forEach((themeName) => {
        setTheme(themeName)
        expect(useSettingsStore.getState().theme).toBe(themeName)
      })
    })
  })

  describe('setToken', () => {
    it('should set token value', () => {
      const { setToken } = useSettingsStore.getState()

      setToken('ABC-DEF-GHI')

      const { token } = useSettingsStore.getState()
      expect(token).toBe('ABC-DEF-GHI')
    })

    it('should set tokenCreatedAt timestamp', () => {
      const { setToken } = useSettingsStore.getState()
      const now = Date.now()
      vi.setSystemTime(now)

      setToken('ABC-DEF-GHI')

      const { tokenCreatedAt } = useSettingsStore.getState()
      expect(tokenCreatedAt).toBe(now)
    })

    it('should update tokenCreatedAt when setting new token', () => {
      const { setToken } = useSettingsStore.getState()

      vi.setSystemTime(1000)
      setToken('ABC-DEF-GHI')

      vi.setSystemTime(2000)
      setToken('XYZ-123-456')

      const { token, tokenCreatedAt } = useSettingsStore.getState()
      expect(token).toBe('XYZ-123-456')
      expect(tokenCreatedAt).toBe(2000)
    })
  })

  describe('generateNewToken', () => {
    it('should generate a token in XXX-XXX-XXX format', () => {
      const { generateNewToken } = useSettingsStore.getState()

      const token = generateNewToken()

      expect(token).toMatch(/^[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}$/)
    })

    it('should set the token in state', () => {
      const { generateNewToken } = useSettingsStore.getState()

      const token = generateNewToken()

      const { token: storedToken } = useSettingsStore.getState()
      expect(storedToken).toBe(token)
    })

    it('should set tokenCreatedAt', () => {
      const { generateNewToken } = useSettingsStore.getState()
      const now = Date.now()
      vi.setSystemTime(now)

      generateNewToken()

      const { tokenCreatedAt } = useSettingsStore.getState()
      expect(tokenCreatedAt).toBe(now)
    })

    it('should return the generated token', () => {
      const { generateNewToken } = useSettingsStore.getState()

      const token = generateNewToken()

      expect(typeof token).toBe('string')
      expect(token.length).toBe(11) // XXX-XXX-XXX = 11 chars
    })

    it('should generate unique tokens each time', () => {
      const { generateNewToken } = useSettingsStore.getState()
      const tokens = new Set<string>()

      for (let i = 0; i < 100; i++) {
        tokens.add(generateNewToken())
      }

      expect(tokens.size).toBe(100)
    })

    it('should not include confusing characters (0, O, 1, I)', () => {
      const { generateNewToken } = useSettingsStore.getState()
      const confusingChars = ['0', 'O', '1', 'I']

      for (let i = 0; i < 50; i++) {
        const token = generateNewToken()
        confusingChars.forEach((char) => {
          expect(token).not.toContain(char)
        })
      }
    })
  })

  describe('setLastSyncAt', () => {
    it('should set lastSyncAt timestamp', () => {
      const { setLastSyncAt } = useSettingsStore.getState()
      const timestamp = 1704067200000 // 2024-01-01 00:00:00 UTC

      setLastSyncAt(timestamp)

      const { lastSyncAt } = useSettingsStore.getState()
      expect(lastSyncAt).toBe(timestamp)
    })

    it('should update lastSyncAt when called multiple times', () => {
      const { setLastSyncAt } = useSettingsStore.getState()

      setLastSyncAt(1000)
      expect(useSettingsStore.getState().lastSyncAt).toBe(1000)

      setLastSyncAt(2000)
      expect(useSettingsStore.getState().lastSyncAt).toBe(2000)
    })
  })

  describe('clearSettings', () => {
    it('should reset theme to default', () => {
      const { setTheme, clearSettings } = useSettingsStore.getState()

      setTheme('ocean')
      clearSettings()

      const { theme } = useSettingsStore.getState()
      expect(theme).toBe('starfall')
    })

    it('should reset token to null', () => {
      const { setToken, clearSettings } = useSettingsStore.getState()

      setToken('ABC-DEF-GHI')
      clearSettings()

      const { token } = useSettingsStore.getState()
      expect(token).toBeNull()
    })

    it('should reset tokenCreatedAt to null', () => {
      const { setToken, clearSettings } = useSettingsStore.getState()

      setToken('ABC-DEF-GHI')
      clearSettings()

      const { tokenCreatedAt } = useSettingsStore.getState()
      expect(tokenCreatedAt).toBeNull()
    })

    it('should reset lastSyncAt to null', () => {
      const { setLastSyncAt, clearSettings } = useSettingsStore.getState()

      setLastSyncAt(1000)
      clearSettings()

      const { lastSyncAt } = useSettingsStore.getState()
      expect(lastSyncAt).toBeNull()
    })

    it('should reset all settings at once', () => {
      const { setTheme, setToken, setLastSyncAt, clearSettings } = useSettingsStore.getState()

      setTheme('aurora')
      setToken('ABC-DEF-GHI')
      setLastSyncAt(1000)

      clearSettings()

      const state = useSettingsStore.getState()
      expect(state.theme).toBe('starfall')
      expect(state.token).toBeNull()
      expect(state.tokenCreatedAt).toBeNull()
      expect(state.lastSyncAt).toBeNull()
    })
  })

  describe('ensureToken', () => {
    it('should return existing token if available', () => {
      const { setToken } = useSettingsStore.getState()
      setToken('EXISTING-TOKEN-123')

      const token = ensureToken()

      expect(token).toBe('EXISTING-TOKEN-123')
    })

    it('should generate new token if none exists', () => {
      const token = ensureToken()

      expect(token).toMatch(/^[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}$/)
    })

    it('should store generated token in state', () => {
      ensureToken()

      const { token } = useSettingsStore.getState()
      expect(token).not.toBeNull()
    })

    it('should not generate new token if one exists', () => {
      const { setToken } = useSettingsStore.getState()
      setToken('ABC-DEF-GHI')

      const result1 = ensureToken()
      const result2 = ensureToken()

      expect(result1).toBe('ABC-DEF-GHI')
      expect(result2).toBe('ABC-DEF-GHI')
    })
  })

  describe('state persistence', () => {
    it('should maintain state across multiple operations', () => {
      const { setTheme, setToken, setLastSyncAt } = useSettingsStore.getState()

      setTheme('aurora')
      setToken('TEST-TOK-EN1')
      setLastSyncAt(1234567890)

      const state = useSettingsStore.getState()

      expect(state.theme).toBe('aurora')
      expect(state.token).toBe('TEST-TOK-EN1')
      expect(state.lastSyncAt).toBe(1234567890)
    })
  })

  describe('edge cases', () => {
    it('should handle empty token string', () => {
      const { setToken } = useSettingsStore.getState()

      setToken('')

      const { token } = useSettingsStore.getState()
      expect(token).toBe('')
    })

    it('should handle very large timestamp', () => {
      const { setLastSyncAt } = useSettingsStore.getState()
      const largeTimestamp = Number.MAX_SAFE_INTEGER

      setLastSyncAt(largeTimestamp)

      const { lastSyncAt } = useSettingsStore.getState()
      expect(lastSyncAt).toBe(largeTimestamp)
    })

    it('should handle zero timestamp', () => {
      const { setLastSyncAt } = useSettingsStore.getState()

      setLastSyncAt(0)

      const { lastSyncAt } = useSettingsStore.getState()
      expect(lastSyncAt).toBe(0)
    })

    it('should handle rapid theme changes', () => {
      const { setTheme } = useSettingsStore.getState()
      const themes: ThemeType[] = ['sunset', 'starwars', 'aurora', 'ocean', 'starfall']

      themes.forEach((theme) => {
        setTheme(theme)
      })

      const { theme } = useSettingsStore.getState()
      expect(theme).toBe('starfall') // Last one
    })
  })
})
