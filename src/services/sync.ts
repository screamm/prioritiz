import { useTodoStore } from '@/stores/todoStore'
import { usePriorityStore } from '@/stores/priorityStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { api } from './api'
import { SYNC_DEBOUNCE_MS, SYNC_RETRY_DELAY_MS } from '@/utils/constants'

class SyncService {
  private syncTimer: ReturnType<typeof setTimeout> | null = null
  private isSyncing = false
  private retryCount = 0
  private maxRetries = 3

  /**
   * Schedule a sync after debounce period
   */
  scheduleSync() {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
    }
    this.syncTimer = setTimeout(() => this.sync(), SYNC_DEBOUNCE_MS)
  }

  /**
   * Perform immediate sync
   */
  async sync(): Promise<boolean> {
    if (this.isSyncing) return false

    const token = useSettingsStore.getState().token
    if (!token) return false

    this.isSyncing = true

    try {
      const todos = useTodoStore.getState().todos
      const priorities = usePriorityStore.getState().priorities
      const lastSyncAt = useSettingsStore.getState().lastSyncAt

      const response = await api.sync({
        token,
        todos,
        priorities,
        lastSyncAt: lastSyncAt ?? null, // Ensure null instead of undefined
      })

      if (response.success) {
        useSettingsStore.getState().setLastSyncAt(response.syncedAt)
        this.retryCount = 0
        return true
      }

      return false
    } catch (error) {
      console.error('Sync error:', error)
      this.handleSyncError()
      return false
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Handle sync errors with exponential backoff
   */
  private handleSyncError() {
    this.retryCount++
    if (this.retryCount <= this.maxRetries) {
      const delay = SYNC_RETRY_DELAY_MS * Math.pow(2, this.retryCount - 1)
      setTimeout(() => this.sync(), delay)
    }
  }

  /**
   * Restore data from server
   */
  async restore(token: string): Promise<boolean> {
    try {
      const data = await api.restore(token)

      useTodoStore.getState().importTodos(data.todos)
      usePriorityStore.getState().importPriorities(data.priorities)
      useSettingsStore.getState().setToken(token)

      if (data.settings?.lastSyncAt) {
        useSettingsStore.getState().setLastSyncAt(data.settings.lastSyncAt)
      }

      return true
    } catch (error) {
      console.error('Restore error:', error)
      return false
    }
  }

  /**
   * Clear pending sync
   */
  cancelSync() {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = null
    }
  }
}

export const syncService = new SyncService()

// Auto-sync on store changes
if (typeof window !== 'undefined') {
  useTodoStore.subscribe(() => {
    syncService.scheduleSync()
  })

  usePriorityStore.subscribe(() => {
    syncService.scheduleSync()
  })
}
