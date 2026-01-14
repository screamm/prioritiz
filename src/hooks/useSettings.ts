import { useCallback, useMemo } from 'react'
import { useSettingsStore, ensureToken } from '@/stores/settingsStore'
import { THEME_CONFIGS } from '@/types'

/**
 * Sync status information with formatted display values.
 */
export interface SyncStatus {
  lastSyncAt: number | null
  formattedLastSync: string
  timeSinceSync: string | null
}

/**
 * Custom hook for managing application settings.
 * Provides theme management, token handling, and sync status.
 *
 * @returns Settings data, actions, and computed values
 */
export function useSettings() {
  const theme = useSettingsStore((state) => state.theme)
  const token = useSettingsStore((state) => state.token)
  const tokenCreatedAt = useSettingsStore((state) => state.tokenCreatedAt)
  const lastSyncAt = useSettingsStore((state) => state.lastSyncAt)

  const setTheme = useSettingsStore((state) => state.setTheme)
  const setToken = useSettingsStore((state) => state.setToken)
  const generateNewToken = useSettingsStore((state) => state.generateNewToken)
  const setLastSyncAt = useSettingsStore((state) => state.setLastSyncAt)
  const clearSettings = useSettingsStore((state) => state.clearSettings)

  // Get current theme config
  const currentThemeConfig = useMemo(() => {
    return THEME_CONFIGS.find((t) => t.id === theme) || THEME_CONFIGS[0]
  }, [theme])

  // Available themes list
  const availableThemes = useMemo(() => THEME_CONFIGS, [])

  // Cycle to next theme
  const cycleTheme = useCallback(() => {
    const themes = THEME_CONFIGS.map((t) => t.id)
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    const nextTheme = themes[nextIndex]
    if (nextTheme) {
      setTheme(nextTheme)
    }
  }, [theme, setTheme])

  // Format time since last sync
  const formatTimeSince = useCallback((timestamp: number | null): string | null => {
    if (!timestamp) return null

    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d sedan`
    if (hours > 0) return `${hours}h sedan`
    if (minutes > 0) return `${minutes}m sedan`
    return 'Just nu'
  }, [])

  // Sync status with formatted values
  const syncStatus = useMemo(
    (): SyncStatus => ({
      lastSyncAt,
      formattedLastSync: lastSyncAt
        ? new Date(lastSyncAt).toLocaleString('sv-SE')
        : 'Aldrig synkad',
      timeSinceSync: formatTimeSince(lastSyncAt),
    }),
    [lastSyncAt, formatTimeSince]
  )

  // Token info
  const tokenInfo = useMemo(
    () => ({
      token,
      hasToken: token !== null,
      createdAt: tokenCreatedAt,
      formattedCreatedAt: tokenCreatedAt
        ? new Date(tokenCreatedAt).toLocaleString('sv-SE')
        : null,
    }),
    [token, tokenCreatedAt]
  )

  // Ensure token exists (creates one if needed)
  const ensureUserToken = useCallback(() => {
    return ensureToken()
  }, [])

  return {
    // Settings
    theme,
    currentThemeConfig,
    availableThemes,
    tokenInfo,
    syncStatus,

    // Actions
    setTheme,
    cycleTheme,
    setToken,
    generateNewToken,
    ensureUserToken,
    setLastSyncAt,
    clearSettings,
  }
}

/**
 * Lightweight hook for theme management only.
 *
 * @returns Theme value and setter
 */
export function useTheme() {
  const theme = useSettingsStore((state) => state.theme)
  const setTheme = useSettingsStore((state) => state.setTheme)

  const currentConfig = useMemo(() => {
    return THEME_CONFIGS.find((t) => t.id === theme) || THEME_CONFIGS[0]
  }, [theme])

  // Cycle to next theme
  const cycleTheme = useCallback(() => {
    const themes = THEME_CONFIGS.map((t) => t.id)
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    const nextTheme = themes[nextIndex]
    if (nextTheme) {
      setTheme(nextTheme)
    }
  }, [theme, setTheme])

  return {
    theme,
    setTheme,
    currentConfig,
    cycleTheme,
    availableThemes: THEME_CONFIGS,
  }
}

/**
 * Lightweight hook for token management only.
 *
 * @returns Token value and management functions
 */
export function useUserToken() {
  const token = useSettingsStore((state) => state.token)
  const tokenCreatedAt = useSettingsStore((state) => state.tokenCreatedAt)
  const setToken = useSettingsStore((state) => state.setToken)
  const generateNewToken = useSettingsStore((state) => state.generateNewToken)

  const hasToken = token !== null

  // Ensure token exists
  const ensureUserToken = useCallback(() => {
    return ensureToken()
  }, [])

  return {
    token,
    hasToken,
    tokenCreatedAt,
    setToken,
    generateNewToken,
    ensureUserToken,
  }
}

/**
 * Hook for sync status monitoring.
 *
 * @returns Sync status information
 */
export function useSyncStatus() {
  const lastSyncAt = useSettingsStore((state) => state.lastSyncAt)
  const setLastSyncAt = useSettingsStore((state) => state.setLastSyncAt)

  const formattedLastSync = useMemo(() => {
    return lastSyncAt ? new Date(lastSyncAt).toLocaleString('sv-SE') : 'Aldrig synkad'
  }, [lastSyncAt])

  const isSynced = lastSyncAt !== null

  return {
    lastSyncAt,
    formattedLastSync,
    isSynced,
    setLastSyncAt,
  }
}
