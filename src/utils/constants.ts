// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'https://api-prioritiz.pages.dev'

// Sync Configuration
export const SYNC_DEBOUNCE_MS = 5000 // 5 seconds after last change
export const SYNC_RETRY_DELAY_MS = 10000 // 10 seconds on failure

// Storage Keys
export const STORAGE_KEYS = {
  TODOS: 'prioritiz_todos',
  PRIORITIES: 'prioritiz_priorities',
  SETTINGS: 'prioritiz_settings',
} as const

// Validation Limits
export const LIMITS = {
  TODO_TEXT_MAX: 500,
  PRIORITY_NAME_MAX: 50,
  MAX_TODOS: 1000,
  MAX_PRIORITIES: 20,
} as const

// Animation Durations (ms)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const

// Z-Index Layers
export const Z_INDEX = {
  BACKGROUND: 0,
  CONTENT: 10,
  DRAG_OVERLAY: 100,
  MODAL_BACKDROP: 200,
  MODAL: 210,
  TOAST: 300,
} as const
