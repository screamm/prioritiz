import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings, ThemeType } from '@/types'
import { generateToken } from '@/utils'
import { STORAGE_KEYS } from '@/utils/constants'

interface SettingsState extends Settings {
  // Actions
  setTheme: (theme: ThemeType) => void
  setToken: (token: string) => void
  generateNewToken: () => string
  setLastSyncAt: (timestamp: number) => void
  clearSettings: () => void
}

const initialSettings: Settings = {
  theme: 'starfall',
  token: null,
  tokenCreatedAt: null,
  lastSyncAt: null,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, _get) => ({
      ...initialSettings,

      setTheme: (theme: ThemeType) => {
        set({ theme })
      },

      setToken: (token: string) => {
        set({
          token,
          tokenCreatedAt: Date.now(),
        })
      },

      generateNewToken: () => {
        const token = generateToken()
        set({
          token,
          tokenCreatedAt: Date.now(),
        })
        return token
      },

      setLastSyncAt: (timestamp: number) => {
        set({ lastSyncAt: timestamp })
      },

      clearSettings: () => {
        set(initialSettings)
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
    }
  )
)

// Ensure token exists on first todo creation
export function ensureToken(): string {
  const { token, generateNewToken } = useSettingsStore.getState()
  if (token) return token
  return generateNewToken()
}
