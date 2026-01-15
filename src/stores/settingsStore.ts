import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings, ThemeType, TokenStatus } from '@/types'
import { getTokenStatus, getDaysRemaining } from '@/types'
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
  // Token expiration helpers (based on lastSyncAt)
  getTokenStatus: () => TokenStatus
  getDaysRemaining: () => number | null
  isTokenExpired: () => boolean
  isTokenExpiring: () => boolean
  hasNeverSynced: () => boolean
}

const initialSettings: Settings = {
  theme: 'starfall',
  token: null,
  tokenCreatedAt: null,
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
function getTokenFromStorage(): { token: string; tokenCreatedAt: number; lastSyncAt: number | null } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (stored) {
      const parsed = JSON.parse(stored)
      const state = parsed.state
      if (state?.token && state?.tokenCreatedAt) {
        return {
          token: state.token,
          tokenCreatedAt: state.tokenCreatedAt,
          lastSyncAt: state.lastSyncAt || null,
        }
      }
    }
  } catch {
    // Ignore parsing errors
  }
  return null
}

function createTokenData() {
  const now = Date.now()
  return {
    token: generateToken(),
    tokenCreatedAt: now,
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
        })
      },

      generateNewToken: () => {
        // First, check localStorage for existing token (cross-tab sync)
        const existingToken = getTokenFromStorage()
        if (existingToken) {
          // Sync our store with the existing token
          set({
            token: existingToken.token,
            tokenCreatedAt: existingToken.tokenCreatedAt,
            lastSyncAt: existingToken.lastSyncAt,
          })
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
            set({
              token: retryToken.token,
              tokenCreatedAt: retryToken.tokenCreatedAt,
              lastSyncAt: retryToken.lastSyncAt,
            })
            return retryToken.token
          }
          // If still no token, generate anyway (fallback for edge cases)
        }

        try {
          // Double-check localStorage one more time after acquiring lock
          const doubleCheckToken = getTokenFromStorage()
          if (doubleCheckToken) {
            set({
              token: doubleCheckToken.token,
              tokenCreatedAt: doubleCheckToken.tokenCreatedAt,
              lastSyncAt: doubleCheckToken.lastSyncAt,
            })
            return doubleCheckToken.token
          }

          // Generate new token (expiration calculated from tokenCreatedAt until first sync)
          const tokenData = createTokenData()
          set(tokenData)
          return tokenData.token
        } finally {
          releaseTokenLock()
        }
      },

      regenerateToken: () => {
        // Force regeneration - for when user explicitly wants a new token
        // This doesn't check for existing tokens since user explicitly requested new one
        // Reset lastSyncAt since this is a new token that hasn't been synced
        const tokenData = createTokenData()
        set({ ...tokenData, lastSyncAt: null })
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
          set({
            token: storedToken.token,
            tokenCreatedAt: storedToken.tokenCreatedAt,
            lastSyncAt: storedToken.lastSyncAt,
          })
        }
      },

      // Token expiration helpers (based on lastSyncAt + 90 days)
      getTokenStatus: () => {
        const { lastSyncAt, tokenCreatedAt } = get()
        return getTokenStatus(lastSyncAt, tokenCreatedAt)
      },

      getDaysRemaining: () => {
        const { lastSyncAt, tokenCreatedAt } = get()
        return getDaysRemaining(lastSyncAt, tokenCreatedAt)
      },

      isTokenExpired: () => {
        return get().getTokenStatus() === 'expired'
      },

      isTokenExpiring: () => {
        return get().getTokenStatus() === 'expiring'
      },

      hasNeverSynced: () => {
        return get().getTokenStatus() === 'never-synced'
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
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
            lastSyncAt: parsed.state?.lastSyncAt || null,
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
