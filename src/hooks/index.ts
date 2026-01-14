/**
 * Custom React hooks for the Prioritiz todo app.
 *
 * These hooks provide a clean abstraction layer over the Zustand stores,
 * offering memoized selectors, computed values, and convenient action wrappers.
 */

// Todo management hooks
export { useTodos, useTodo } from './useTodos'

// Priority management hooks
export { usePriorities, usePriority } from './usePriorities'
export type { PriorityWithCounts } from './usePriorities'

// Settings management hooks
export { useSettings, useTheme, useUserToken, useSyncStatus } from './useSettings'
export type { SyncStatus } from './useSettings'
