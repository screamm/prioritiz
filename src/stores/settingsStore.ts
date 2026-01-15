import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings, ThemeType, TokenStatus } from '@/types'
import {
  TOKEN_EXPIRATION_MS,
  getTokenStatus,
  getDaysRemaining,
} from '@/types'
import { generateToken } from '@/utils'
import { STORAGE_KEYS } from '@/utils/constants'

// Key for token lock in localStorage (prevents race conditions across tabs)
const TOKEN_LOCK_KEY = 'prioritiz_token_lock'
const TOKEN_LOCK_TIMEOUT_MS = 5000 // 5 second lock timeout

interface SettingsState extends Settings {
  // Actions
  setTheme: (theme: ThemeType) => void
  setToken: (token: string) => void
  generateNewToken: () => string
  regenerateToken: () => string
  setLastSyncAt: (timestamp: number) => void
  clearSettings: () => void
  syncFromStorage: () => void
  // Token expiration helpers
  getTokenStatus: () => TokenStatus
  getDaysRemaining: () => number | null
  isTokenExpired: () => boolean
  isTokenExpiring: () => boolean
  ensureTokenExpiration: () => void
}

const initialSettings: Settings = {
  theme: 'starfall',
  token: null,
  tokenCreatedAt: null,
  tokenExpiresAt: null,
  lastSyncAt: null,
}

/**
 * Attempts to acquire a lock for token generation using localStorage.
 * Returns true if lock acquired, false otherwise.
 */
function acquireTokenLock(): boolean {
  const now = Date.now()
  const existingLock = localStorage.getItem(TOKEN_LOCK_KEY)

  if (existingLock) {
    const lockTime = parseInt(existingLock, 10)
    // Check if lock is still valid (not expired)
    if (now - lockTime < TOKEN_LOCK_TIMEOUT_MS) {
      return false
    }
  }

  // Try to acquire lock using compare-and-swap pattern
  localStorage.setItem(TOKEN_LOCK_KEY, now.toString())

  // Verify we got the lock (another tab might have set it at the same time)
  const verifyLock = localStorage.getItem(TOKEN_LOCK_KEY)
  return verifyLock === now.toString()
}

/**
 * Releases the token generation lock.
 */
function releaseTokenLock(): void {
  localStorage.removeItem(TOKEN_LOCK_KEY)
}

/**
 * Gets the current token data from localStorage directly.
 * This bypasses the Zustand store to get the most current value across tabs.
 */
function getTokenFromStorage(): { token: string; tokenCreatedAt: number; tokenExpiresAt: number } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (stored) {
      const parsed = JSON.parse(stored)
      const state = parsed.state
      if (state?.token && state?.tokenCreatedAt && state?.tokenExpiresAt) {
        return {
          token: state.token,
          tokenCreatedAt: state.tokenCreatedAt,
          tokenExpiresAt: state.tokenExpiresAt,
        }
      }
    }
  } catch {
    // Ignore parsing errors
  }
  return null
}

function createTokenWithExpiration() {
  const now = Date.now()
  return {
    token: generateToken(),
    tokenCreatedAt: now,
    tokenExpiresAt: now + TOKEN_EXPIRATION_MS,
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...initialSettings,

      setTheme: (theme: ThemeType) => {
        set({ theme })
      },

      setToken: (token: string) => {
        const now = Date.now()
        set({
          token,
          tokenCreatedAt: now,
          tokenExpiresAt: now + TOKEN_EXPIRATION_MS,
        })
      },

      generateNewToken: () => {
        // First, check localStorage for existing token (cross-tab sync)
        const existingToken = getTokenFromStorage()
        if (existingToken) {
          // Sync our store with the existing token
          set(existingToken)
          return existingToken.token
        }

        // Also check our current state
        const currentToken = get().token
        if (currentToken) {
          return currentToken
        }

        // Try to acquire lock for token generation
        if (!acquireTokenLock()) {
          // Another tab is generating, wait briefly and check again
          const retryToken = getTokenFromStorage()
          if (retryToken) {
            set(retryToken)
            return retryToken.token
          }
          // If still no token, generate anyway (fallback for edge cases)
        }

        try {
          // Double-check localStorage one more time after acquiring lock
          const doubleCheckToken = getTokenFromStorage()
          if (doubleCheckToken) {
            set(doubleCheckToken)
            return doubleCheckToken.token
          }

          // Generate new token with expiration
          const tokenData = createTokenWithExpiration()
          set(tokenData)
          return tokenData.token
        } finally {
          releaseTokenLock()
        }
      },

      regenerateToken: () => {
        // Force regeneration - for when user explicitly wants a new token
        // This doesn't check for existing tokens since user explicitly requested new one
        const tokenData = createTokenWithExpiration()
        set(tokenData)
        return tokenData.token
      },

      setLastSyncAt: (timestamp: number) => {
        set({ lastSyncAt: timestamp })
      },

      clearSettings: () => {
        set(initialSettings)
      },

      syncFromStorage: () => {
        const storedToken = getTokenFromStorage()
        if (storedToken && storedToken.token !== get().token) {
          set(storedToken)
        }
      },

      // Token expiration helpers
      getTokenStatus: () => {
        const { tokenExpiresAt } = get()
        return getTokenStatus(tokenExpiresAt)
      },

      getDaysRemaining: () => {
        const { tokenExpiresAt } = get()
        return getDaysRemaining(tokenExpiresAt)
      },

      isTokenExpired: () => {
        return get().getTokenStatus() === 'expired'
      },

      isTokenExpiring: () => {
        return get().getTokenStatus() === 'expiring'
      },

      // Migrate existing tokens without expiration (backward compatibility)
      ensureTokenExpiration: () => {
        const { token, tokenCreatedAt, tokenExpiresAt } = get()
        if (token && !tokenExpiresAt) {
          // Set expiration based on creation date, or now if no creation date
          const baseTime = tokenCreatedAt || Date.now()
          set({
            tokenCreatedAt: baseTime,
            tokenExpiresAt: baseTime + TOKEN_EXPIRATION_MS,
          })
        }
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      onRehydrateStorage: () => (state) => {
        // Migrate existing tokens on load
        if (state) {
          state.ensureTokenExpiration()
        }
      },
    }
  )
)

// Listen for storage events to sync token across tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEYS.SETTINGS && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue)
        const newToken = parsed.state?.token
        const currentState = useSettingsStore.getState()

        // If another tab set a token and we don't have one (or have a different one), sync it
        if (newToken && !currentState.token) {
          useSettingsStore.setState({
            token: newToken,
            tokenCreatedAt: parsed.state?.tokenCreatedAt,
            tokenExpiresAt: parsed.state?.tokenExpiresAt,
          })
        }
      } catch {
        // Ignore parsing errors
      }
    }
  })
}

// Ensure token exists on first todo creation
export function ensureToken(): string {
  const state = useSettingsStore.getState()

  // First sync from storage to catch any cross-tab tokens
  state.syncFromStorage()

  // Re-check after sync
  const currentToken = useSettingsStore.getState().token
  if (currentToken) return currentToken

  return state.generateNewToken()
}
