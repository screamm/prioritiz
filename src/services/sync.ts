import { z } from 'zod'
import { useTodoStore } from '@/stores/todoStore'
import { usePriorityStore } from '@/stores/priorityStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { api, ApiRequestError } from './api'
import { SYNC_DEBOUNCE_MS, SYNC_RETRY_DELAY_MS, LIMITS } from '@/utils/constants'

// Zod schemas for validation
const TodoSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(LIMITS.TODO_TEXT_MAX + 50), // Allow some buffer
  completed: z.boolean(),
  priorityId: z.string().nullable(),
  order: z.number().int().min(0),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
})

const PrioritySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(LIMITS.PRIORITY_NAME_MAX + 10), // Allow some buffer
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format'),
  icon: z.string().optional(),
  order: z.number().int().min(0),
  isDefault: z.boolean(),
})

export type ValidatedTodo = z.infer<typeof TodoSchema>
export type ValidatedPriority = z.infer<typeof PrioritySchema>

/**
 * Sync status states
 */
export type SyncStatusType = 'idle' | 'syncing' | 'synced' | 'failed' | 'offline'

/**
 * Sync state information for UI consumption
 */
export interface SyncState {
  status: SyncStatusType
  lastSyncAt: number | null
  lastError: SyncError | null
  isOnline: boolean
  retryCount: number
  pendingSync: boolean
}

/**
 * Sync error information
 */
export interface SyncError {
  message: string
  code: string
  timestamp: number
  isRetryable: boolean
}

/**
 * Listener callback type
 */
type SyncStateListener = (state: SyncState) => void

class SyncService {
  private syncTimer: ReturnType<typeof setTimeout> | null = null
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private isSyncing = false
  private retryCount = 0
  private maxRetries = 3
  private maxRetryDelay = 60000 // Max 1 minute between retries

  // State tracking
  private status: SyncStatusType = 'idle'
  private lastError: SyncError | null = null
  private pendingSync = false
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  // Subscriptions
  private storeUnsubscribers: Array<() => void> = []
  private stateListeners: Set<SyncStateListener> = new Set()
  private boundHandleOnline: () => void
  private boundHandleOffline: () => void

  constructor() {
    this.boundHandleOnline = this.handleOnline.bind(this)
    this.boundHandleOffline = this.handleOffline.bind(this)
  }

  /**
   * Initialize the sync service with store subscriptions and network listeners
   */
  initialize() {
    if (typeof window === 'undefined') return

    // Subscribe to store changes
    const todoUnsub = useTodoStore.subscribe(() => {
      this.scheduleSync()
    })

    const priorityUnsub = usePriorityStore.subscribe(() => {
      this.scheduleSync()
    })

    this.storeUnsubscribers.push(todoUnsub, priorityUnsub)

    // Add network status listeners
    window.addEventListener('online', this.boundHandleOnline)
    window.addEventListener('offline', this.boundHandleOffline)

    // Set initial online status
    this.isOnline = navigator.onLine
    if (!this.isOnline) {
      this.setStatus('offline')
    }
  }

  /**
   * Cleanup all subscriptions and timers
   */
  destroy() {
    // Clear timers
    this.cancelSync()
    this.cancelRetry()

    // Unsubscribe from stores
    this.storeUnsubscribers.forEach((unsub) => unsub())
    this.storeUnsubscribers = []

    // Remove network listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.boundHandleOnline)
      window.removeEventListener('offline', this.boundHandleOffline)
    }

    // Clear state listeners
    this.stateListeners.clear()
  }

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: SyncStateListener): () => void {
    this.stateListeners.add(listener)
    // Immediately call with current state
    listener(this.getState())
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return {
      status: this.status,
      lastSyncAt: useSettingsStore.getState().lastSyncAt,
      lastError: this.lastError,
      isOnline: this.isOnline,
      retryCount: this.retryCount,
      pendingSync: this.pendingSync,
    }
  }

  /**
   * Handle coming online
   */
  private handleOnline() {
    this.isOnline = true
    this.lastError = null

    // If we have a pending sync, execute it now
    if (this.pendingSync) {
      this.setStatus('idle')
      this.pendingSync = false
      this.sync()
    } else if (this.status === 'offline') {
      this.setStatus('idle')
    }

    this.notifyListeners()
  }

  /**
   * Handle going offline
   */
  private handleOffline() {
    this.isOnline = false
    this.cancelRetry()
    this.setStatus('offline')
    this.notifyListeners()
  }

  /**
   * Update status and notify listeners
   */
  private setStatus(status: SyncStatusType) {
    if (this.status !== status) {
      this.status = status
      this.notifyListeners()
    }
  }

  /**
   * Notify all state listeners
   */
  private notifyListeners() {
    const state = this.getState()
    this.stateListeners.forEach((listener) => {
      try {
        listener(state)
      } catch (error) {
        console.error('Sync state listener error:', error)
      }
    })
  }

  /**
   * Schedule a sync after debounce period
   */
  scheduleSync() {
    // If offline, mark as pending and don't attempt
    if (!this.isOnline) {
      this.pendingSync = true
      this.setStatus('offline')
      return
    }

    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
    }

    this.pendingSync = true
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null
      this.sync()
    }, SYNC_DEBOUNCE_MS)
  }

  /**
   * Perform immediate sync
   */
  async sync(): Promise<boolean> {
    // Check online status before attempting
    if (!this.isOnline) {
      this.pendingSync = true
      this.setStatus('offline')
      return false
    }

    // Prevent concurrent syncs
    if (this.isSyncing) {
      this.pendingSync = true
      return false
    }

    const token = useSettingsStore.getState().token
    if (!token) {
      this.pendingSync = false
      return false
    }

    this.isSyncing = true
    this.pendingSync = false
    this.setStatus('syncing')
    this.cancelRetry()

    try {
      const todos = useTodoStore.getState().todos
      const priorities = usePriorityStore.getState().priorities
      const lastSyncAt = useSettingsStore.getState().lastSyncAt

      const response = await api.sync({
        token,
        todos,
        priorities,
        lastSyncAt: lastSyncAt ?? null,
      })

      if (response.success) {
        useSettingsStore.getState().setLastSyncAt(response.syncedAt)
        this.retryCount = 0
        this.lastError = null
        this.setStatus('synced')
        return true
      }

      // Server returned success: false
      this.handleSyncFailure(new Error('Sync rejected by server'), false)
      return false
    } catch (error) {
      this.handleSyncError(error)
      return false
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Handle sync errors with smart retry strategy
   */
  private handleSyncError(error: unknown) {
    console.error('Sync error:', error)

    const syncError = this.createSyncError(error)
    this.lastError = syncError

    // Check if we went offline during the request
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.isOnline = false
      this.pendingSync = true
      this.setStatus('offline')
      return
    }

    if (syncError.isRetryable) {
      this.scheduleRetry()
    } else {
      // Non-retryable error (4xx client errors)
      this.setStatus('failed')
      this.retryCount = 0
    }

    this.notifyListeners()
  }

  /**
   * Handle non-error sync failures
   */
  private handleSyncFailure(error: Error, isRetryable: boolean) {
    this.lastError = {
      message: error.message,
      code: 'SYNC_FAILED',
      timestamp: Date.now(),
      isRetryable,
    }

    if (isRetryable) {
      this.scheduleRetry()
    } else {
      this.setStatus('failed')
    }

    this.notifyListeners()
  }

  /**
   * Create a SyncError from an unknown error
   */
  private createSyncError(error: unknown): SyncError {
    if (error instanceof ApiRequestError) {
      return {
        message: error.message,
        code: error.errorCode,
        timestamp: Date.now(),
        isRetryable: error.isRetryable,
      }
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'UNKNOWN',
        timestamp: Date.now(),
        isRetryable: true, // Default to retryable for unknown errors
      }
    }

    return {
      message: 'An unknown error occurred',
      code: 'UNKNOWN',
      timestamp: Date.now(),
      isRetryable: true,
    }
  }

  /**
   * Schedule a retry with exponential backoff
   */
  private scheduleRetry() {
    this.retryCount++

    if (this.retryCount > this.maxRetries) {
      console.warn(`Sync failed after ${this.maxRetries} retries`)
      this.setStatus('failed')
      this.retryCount = 0
      return
    }

    // Exponential backoff with max delay cap
    const delay = Math.min(
      SYNC_RETRY_DELAY_MS * Math.pow(2, this.retryCount - 1),
      this.maxRetryDelay
    )

    console.log(`Scheduling sync retry ${this.retryCount}/${this.maxRetries} in ${delay}ms`)

    this.cancelRetry()
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      if (this.isOnline) {
        this.sync()
      } else {
        this.pendingSync = true
      }
    }, delay)
  }

  /**
   * Cancel pending retry
   */
  private cancelRetry() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
  }

  /**
   * Validate and filter todos from restored data
   */
  private validateTodos(todos: unknown[]): ValidatedTodo[] {
    const validTodos: ValidatedTodo[] = []

    for (const todo of todos) {
      const result = TodoSchema.safeParse(todo)
      if (result.success) {
        validTodos.push(result.data)
      } else {
        console.warn('Invalid todo skipped during restore:', {
          todo,
          errors: result.error.flatten().fieldErrors,
        })
      }
    }

    return validTodos
  }

  /**
   * Validate and filter priorities from restored data
   */
  private validatePriorities(priorities: unknown[]): ValidatedPriority[] {
    const validPriorities: ValidatedPriority[] = []

    for (const priority of priorities) {
      const result = PrioritySchema.safeParse(priority)
      if (result.success) {
        validPriorities.push(result.data)
      } else {
        console.warn('Invalid priority skipped during restore:', {
          priority,
          errors: result.error.flatten().fieldErrors,
        })
      }
    }

    return validPriorities
  }

  /**
   * Restore data from server
   */
  async restore(token: string): Promise<boolean> {
    if (!this.isOnline) {
      this.lastError = {
        message: 'Cannot restore while offline',
        code: 'OFFLINE',
        timestamp: Date.now(),
        isRetryable: false,
      }
      this.notifyListeners()
      return false
    }

    this.setStatus('syncing')

    try {
      const data = await api.restore(token)

      // Validate restored data against schemas
      const validTodos = this.validateTodos(data.todos || [])
      const validPriorities = this.validatePriorities(data.priorities || [])

      // Log validation summary
      const skippedTodos = (data.todos?.length || 0) - validTodos.length
      const skippedPriorities = (data.priorities?.length || 0) - validPriorities.length

      if (skippedTodos > 0 || skippedPriorities > 0) {
        console.warn('Restore validation summary:', {
          totalTodos: data.todos?.length || 0,
          validTodos: validTodos.length,
          skippedTodos,
          totalPriorities: data.priorities?.length || 0,
          validPriorities: validPriorities.length,
          skippedPriorities,
        })
      }

      // Import only valid data
      useTodoStore.getState().importTodos(validTodos)
      usePriorityStore.getState().importPriorities(validPriorities)
      useSettingsStore.getState().setToken(token)

      if (data.settings?.lastSyncAt) {
        useSettingsStore.getState().setLastSyncAt(data.settings.lastSyncAt)
      }

      this.lastError = null
      this.setStatus('synced')
      return true
    } catch (error) {
      console.error('Restore error:', error)
      this.lastError = this.createSyncError(error)
      this.setStatus('failed')
      this.notifyListeners()
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
    this.pendingSync = false
  }

  /**
   * Force a sync attempt (bypasses debounce)
   */
  async forceSync(): Promise<boolean> {
    this.cancelSync()
    return this.sync()
  }

  /**
   * Clear the last error
   */
  clearError() {
    this.lastError = null
    if (this.status === 'failed') {
      this.setStatus(this.isOnline ? 'idle' : 'offline')
    }
    this.notifyListeners()
  }
}

export const syncService = new SyncService()

// Initialize on module load (only in browser)
if (typeof window !== 'undefined') {
  syncService.initialize()
}
