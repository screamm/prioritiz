// === CORE ENTITIES ===

export interface Todo {
  id: string
  text: string
  completed: boolean
  priorityId: string | null
  order: number
  createdAt: number
  updatedAt: number
}

export interface Priority {
  id: string
  name: string
  color: string
  icon?: string
  order: number
  isDefault: boolean
}

export interface Settings {
  theme: ThemeType
  token: string | null
  tokenCreatedAt: number | null
  lastSyncAt: number | null
}

// === THEME ===

export type ThemeType = 'sunset' | 'starwars' | 'atat' | 'starfall' | 'stars' | 'stars2' | 'aurora' | 'ocean'

export interface ThemeConfig {
  id: ThemeType
  name: string
  description: string
  preview: string
}

export const THEME_CONFIGS: ThemeConfig[] = [
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Rogivande solnedgång',
    preview: '/themes/sunset.jpg',
  },
  {
    id: 'starwars',
    name: 'Hyperspace',
    description: 'Resa genom hyperrymden',
    preview: '/themes/starwars.jpg',
  },
  {
    id: 'atat',
    name: 'AT-AT Walker',
    description: 'Imperial AT-AT på Hoth',
    preview: '/themes/atat.jpg',
  },
  {
    id: 'starfall',
    name: 'Star Fall',
    description: 'Fallande stjärnor och meteorer',
    preview: '/themes/starfall.jpg',
  },
  {
    id: 'stars',
    name: 'Stars',
    description: 'Glittrande stjärnhimmel',
    preview: '/themes/stars.jpg',
  },
  {
    id: 'stars2',
    name: 'Stars 2',
    description: 'Kosmisk stjärnnatt',
    preview: '/themes/stars2.jpg',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Norrsken dansar på himlen',
    preview: '/themes/aurora.jpg',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Djupt under havsytan',
    preview: '/themes/ocean.jpg',
  },
]

// === API ===

export interface SyncRequest {
  token: string
  todos: Todo[]
  priorities: Priority[]
  lastSyncAt: number | null
}

export interface SyncResponse {
  success: boolean
  syncedAt: number
}

export interface RestoreResponse {
  todos: Todo[]
  priorities: Priority[]
  settings: Partial<Settings>
}

export interface EmailRequest {
  email: string
  token: string
}

export interface ApiError {
  error: string
  code?: string
}

// === UI STATE ===

export interface DragState {
  activeId: string | null
  overId: string | null
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

// === DEFAULT DATA ===

export const DEFAULT_PRIORITIES: Priority[] = [
  {
    id: 'must-do',
    name: 'Must do asap',
    color: '#ef4444',
    order: 0,
    isDefault: true,
  },
  {
    id: 'todo',
    name: 'Todo',
    color: '#eab308',
    order: 1,
    isDefault: true,
  },
  {
    id: 'spare-time',
    name: 'Only do in spare time',
    color: '#22c55e',
    order: 2,
    isDefault: true,
  },
]
