import { useCallback, useEffect, useMemo, useState } from 'react'
import { syncService, type SyncState, type SyncStatusType, type SyncError } from '@/services/sync'

/**
 * Enhanced sync status with formatted display values
 */
export interface UseSyncStatusResult {
  // Core status
  status: SyncStatusType
  isOnline: boolean
  isSyncing: boolean
  isSynced: boolean
  isFailed: boolean
  isOffline: boolean

  // Timing
  lastSyncAt: number | null
  formattedLastSync: string
  timeSinceSync: string | null

  // Error information
  error: SyncError | null
  hasError: boolean

  // Retry information
  retryCount: number
  pendingSync: boolean

  // Actions
  forceSync: () => Promise<boolean>
  clearError: () => void
}

/**
 * Format a timestamp to a relative time string (Swedish)
 */
function formatTimeSince(timestamp: number | null): string | null {
  if (!timestamp) return null

  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d sedan`
  if (hours > 0) return `${hours}h sedan`
  if (minutes > 0) return `${minutes}m sedan`
  if (seconds > 10) return `${seconds}s sedan`
  return 'Just nu'
}

/**
 * Format a timestamp to a localized date/time string
 */
function formatDateTime(timestamp: number | null): string {
  if (!timestamp) return 'Aldrig synkad'
  return new Date(timestamp).toLocaleString('sv-SE')
}

/**
 * Hook for monitoring sync status with formatted values and actions.
 *
 * Provides real-time sync status updates from the sync service,
 * including online/offline detection, error handling, and retry status.
 *
 * @returns Sync status information and actions
 *
 * @example
 * ```tsx
 * function SyncIndicator() {
 *   const { status, isOnline, error, forceSync } = useSyncStatus()
 *
 *   return (
 *     <div>
 *       {!isOnline && <span>Offline</span>}
 *       {status === 'syncing' && <span>Syncing...</span>}
 *       {error && <span>Error: {error.message}</span>}
 *       <button onClick={forceSync}>Sync Now</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useSyncStatus(): UseSyncStatusResult {
  const [syncState, setSyncState] = useState<SyncState>(() => syncService.getState())

  // Subscribe to sync state changes
  useEffect(() => {
    const unsubscribe = syncService.subscribe((state) => {
      setSyncState(state)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Update time since sync periodically (every 30 seconds)
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Computed status booleans
  const isSyncing = syncState.status === 'syncing'
  const isSynced = syncState.status === 'synced'
  const isFailed = syncState.status === 'failed'
  const isOffline = syncState.status === 'offline' || !syncState.isOnline

  // Formatted time values
  const formattedLastSync = useMemo(
    () => formatDateTime(syncState.lastSyncAt),
    [syncState.lastSyncAt]
  )

  const timeSinceSync = useMemo(
    () => formatTimeSince(syncState.lastSyncAt),
    [syncState.lastSyncAt]
  )

  // Actions
  const forceSync = useCallback(async () => {
    return syncService.forceSync()
  }, [])

  const clearError = useCallback(() => {
    syncService.clearError()
  }, [])

  return {
    // Core status
    status: syncState.status,
    isOnline: syncState.isOnline,
    isSyncing,
    isSynced,
    isFailed,
    isOffline,

    // Timing
    lastSyncAt: syncState.lastSyncAt,
    formattedLastSync,
    timeSinceSync,

    // Error information
    error: syncState.lastError,
    hasError: syncState.lastError !== null,

    // Retry information
    retryCount: syncState.retryCount,
    pendingSync: syncState.pendingSync,

    // Actions
    forceSync,
    clearError,
  }
}

/**
 * Lightweight hook for just checking online status.
 *
 * @returns Current online status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
