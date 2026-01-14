# Prioritiz - Master Implementation Plan

> **Version**: 1.0.0
> **Skapad**: 2026-01-13
> **Status**: Planering
> **Uppskattad omfattning**: ~50-70 filer, ~8000-12000 rader kod

---

## Innehållsförteckning

1. [Projektöversikt](#1-projektöversikt)
2. [Teknisk Stack](#2-teknisk-stack)
3. [Projektstruktur](#3-projektstruktur)
4. [Fas 1: Projektsetup](#4-fas-1-projektsetup)
5. [Fas 2: Kärnfunktionalitet](#5-fas-2-kärnfunktionalitet)
6. [Fas 3: Drag & Drop](#6-fas-3-drag--drop)
7. [Fas 4: Tema-system & Animationer](#7-fas-4-tema-system--animationer)
8. [Fas 5: Backend & Synkronisering](#8-fas-5-backend--synkronisering)
9. [Fas 6: Token & Återställning](#9-fas-6-token--återställning)
10. [Fas 7: E-post Integration](#10-fas-7-e-post-integration)
11. [Fas 8: Säkerhet](#11-fas-8-säkerhet)
12. [Fas 9: Testning](#12-fas-9-testning)
13. [Fas 10: Deployment](#13-fas-10-deployment)
14. [Fas 11: Post-launch](#14-fas-11-post-launch)
15. [Datamodeller](#15-datamodeller)
16. [API-specifikation](#16-api-specifikation)
17. [Komponentbibliotek](#17-komponentbibliotek)
18. [Error Handling Strategy](#18-error-handling-strategy)
19. [Checklista per Fas](#19-checklista-per-fas)

---

## 1. Projektöversikt

### 1.1 Vision
En visuellt fantastisk, cinematisk todo-app med prioriteringssystem. Användaren ska känna glädje varje gång de öppnar appen tack vare vackra animationer och rörliga bakgrunder.

### 1.2 Kärnfunktioner
| Funktion | Beskrivning | Prioritet |
|----------|-------------|-----------|
| Todo CRUD | Skapa, läsa, uppdatera, ta bort todos | P0 |
| Prioriteringsnivåer | Anpassningsbara nivåer (drag & drop) | P0 |
| Drag & Drop | Flytta todos mellan nivåer | P0 |
| Animerade bakgrunder | 5+ teman med rörlig bakgrund | P0 |
| localStorage | Primär lagring | P0 |
| D1 Backup | Cloudflare D1 synk | P0 |
| Token-system | Genererad återställningskod | P0 |
| QR-kod | Visuell token för mobil | P1 |
| E-post | Skicka token via mail | P1 |
| Mobil-responsiv | Fungerar på alla enheter | P0 |

### 1.3 Icke-funktionella krav
- **Prestanda**: First Contentful Paint < 1.5s
- **Tillgänglighet**: WCAG 2.1 AA
- **Offline**: Fungerar utan nätverk (localStorage)
- **Synk**: Automatisk backup var 5:e sekund
- **Säkerhet**: Rate limiting, input sanitering

---

## 2. Teknisk Stack

### 2.1 Frontend
```yaml
Framework: React 18.3+
Build: Vite 5.x
Language: TypeScript 5.x
Styling: Tailwind CSS 3.x
Animationer:
  - Framer Motion 11.x (UI animationer)
  - tsParticles 3.x (bakgrundspartiklar)
Drag & Drop: @dnd-kit/core + @dnd-kit/sortable
State: Zustand 4.x (lightweight)
Forms: React Hook Form + Zod
Icons: Lucide React
QR: qrcode.react
```

### 2.2 Backend
```yaml
Runtime: Cloudflare Workers
Database: Cloudflare D1 (SQLite)
Email: Mailgun (nu) → Cloudflare Email (framtid)
Hosting: Cloudflare Pages
```

### 2.3 Utvecklingsverktyg
```yaml
Linting: ESLint 9.x + typescript-eslint
Formatting: Prettier 3.x
Testing: Vitest + React Testing Library + Playwright
Git Hooks: Husky + lint-staged
```

---

## 3. Projektstruktur

```
prioritiz/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Lint, test, build
│       └── deploy.yml             # Deploy till Cloudflare
│
├── claudedocs/
│   ├── PRIORITIZ_MASTER_PLAN.md   # Denna fil
│   ├── API_DOCUMENTATION.md       # API docs
│   └── CHANGELOG.md               # Ändringslogg
│
├── public/
│   ├── favicon.ico
│   ├── og-image.png               # Social sharing
│   └── manifest.json              # PWA manifest
│
├── src/
│   ├── main.tsx                   # Entry point
│   ├── App.tsx                    # Root component
│   ├── index.css                  # Global styles + Tailwind
│   │
│   ├── components/
│   │   ├── ui/                    # Återanvändbara UI-komponenter
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── todo/                  # Todo-specifika komponenter
│   │   │   ├── TodoItem.tsx
│   │   │   ├── TodoList.tsx
│   │   │   ├── TodoInput.tsx
│   │   │   ├── TodoActions.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── priority/              # Prioriteringsnivå-komponenter
│   │   │   ├── PriorityColumn.tsx
│   │   │   ├── PriorityHeader.tsx
│   │   │   ├── PriorityManager.tsx
│   │   │   ├── AddPriorityModal.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── inbox/                 # Inbox-komponenter
│   │   │   ├── Inbox.tsx
│   │   │   ├── InboxItem.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── backgrounds/           # Animerade bakgrunder
│   │   │   ├── BackgroundProvider.tsx
│   │   │   ├── StarfallBackground.tsx
│   │   │   ├── StarWarsBackground.tsx
│   │   │   ├── SummerBeachBackground.tsx
│   │   │   ├── AuroraBackground.tsx
│   │   │   ├── OceanBackground.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── settings/              # Inställningar
│   │   │   ├── SettingsModal.tsx
│   │   │   ├── ThemeSelector.tsx
│   │   │   ├── TokenDisplay.tsx
│   │   │   ├── QRCodeModal.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── restore/               # Återställning
│   │   │   ├── RestoreModal.tsx
│   │   │   ├── RestoreInput.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── layout/                # Layout-komponenter
│   │       ├── Header.tsx
│   │       ├── MainLayout.tsx
│   │       ├── MobileDrawer.tsx
│   │       └── index.ts
│   │
│   ├── hooks/                     # Custom hooks
│   │   ├── useTodos.ts
│   │   ├── usePriorities.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useSync.ts
│   │   ├── useTheme.ts
│   │   ├── useToken.ts
│   │   ├── useToast.ts
│   │   └── index.ts
│   │
│   ├── stores/                    # Zustand stores
│   │   ├── todoStore.ts
│   │   ├── priorityStore.ts
│   │   ├── settingsStore.ts
│   │   └── index.ts
│   │
│   ├── services/                  # API & externa tjänster
│   │   ├── api.ts                 # API client
│   │   ├── sync.ts                # Synkroniseringslogik
│   │   ├── storage.ts             # localStorage wrapper
│   │   ├── token.ts               # Token generering
│   │   └── index.ts
│   │
│   ├── utils/                     # Utility funktioner
│   │   ├── cn.ts                  # classnames helper
│   │   ├── validation.ts          # Zod schemas
│   │   ├── constants.ts           # App konstanter
│   │   ├── helpers.ts             # Diverse helpers
│   │   └── index.ts
│   │
│   ├── types/                     # TypeScript typer
│   │   ├── todo.ts
│   │   ├── priority.ts
│   │   ├── settings.ts
│   │   ├── api.ts
│   │   └── index.ts
│   │
│   └── styles/                    # Extra CSS
│       ├── animations.css         # Keyframe animationer
│       └── themes.css             # Tema-variabler
│
├── workers/                       # Cloudflare Workers
│   ├── api/
│   │   ├── src/
│   │   │   ├── index.ts           # Worker entry
│   │   │   ├── routes/
│   │   │   │   ├── sync.ts        # POST /sync
│   │   │   │   ├── restore.ts     # GET /restore/:token
│   │   │   │   ├── email.ts       # POST /email
│   │   │   │   └── health.ts      # GET /health
│   │   │   ├── middleware/
│   │   │   │   ├── cors.ts
│   │   │   │   ├── rateLimit.ts
│   │   │   │   └── validation.ts
│   │   │   ├── services/
│   │   │   │   ├── d1.ts          # D1 operations
│   │   │   │   └── mailgun.ts     # Mailgun integration
│   │   │   └── utils/
│   │   │       ├── response.ts
│   │   │       └── errors.ts
│   │   ├── wrangler.toml
│   │   └── package.json
│   │
│   └── migrations/                # D1 migrations
│       ├── 0001_initial.sql
│       └── 0002_indexes.sql
│
├── tests/
│   ├── unit/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── utils/
│   ├── integration/
│   │   ├── sync.test.ts
│   │   └── restore.test.ts
│   └── e2e/
│       ├── todo-crud.spec.ts
│       ├── drag-drop.spec.ts
│       ├── themes.spec.ts
│       └── restore.spec.ts
│
├── scripts/
│   ├── generate-token.ts          # Token generator för test
│   └── seed-db.ts                 # Seed D1 för utveckling
│
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── CLAUDE.md                      # Projekt-specifik Claude config
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 4. Fas 1: Projektsetup

### 4.1 Uppgifter

| # | Uppgift | Fil(er) | Beskrivning |
|---|---------|---------|-------------|
| 1.1 | Skapa Vite projekt | - | `npm create vite@latest prioritiz -- --template react-ts` |
| 1.2 | Installera dependencies | package.json | Se beroendelista nedan |
| 1.3 | Konfigurera TypeScript | tsconfig.json | Strict mode, paths |
| 1.4 | Konfigurera Tailwind | tailwind.config.ts | Tema, animationer |
| 1.5 | Konfigurera ESLint | .eslintrc.cjs | React, TypeScript regler |
| 1.6 | Konfigurera Prettier | .prettierrc | Formattering |
| 1.7 | Konfigurera Husky | .husky/ | Pre-commit hooks |
| 1.8 | Skapa mapstruktur | src/* | Alla mappar enligt struktur |
| 1.9 | Skapa CLAUDE.md | CLAUDE.md | Projektregler |
| 1.10 | Initiera Git | .git | Initial commit |

### 4.2 Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "framer-motion": "^11.0.0",
    "@tsparticles/react": "^3.0.0",
    "@tsparticles/slim": "^3.0.0",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.50.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "lucide-react": "^0.300.0",
    "qrcode.react": "^3.1.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

### 4.3 Tailwind Config

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Prioritetsfärger
        priority: {
          urgent: '#ef4444',    // Röd
          normal: '#eab308',    // Gul
          low: '#22c55e',       // Grön
        },
        // Tema-specifika
        surface: {
          DEFAULT: 'rgba(0, 0, 0, 0.4)',
          hover: 'rgba(0, 0, 0, 0.5)',
          active: 'rgba(0, 0, 0, 0.6)',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config
```

### 4.4 Verifiering Fas 1
- [ ] `npm run dev` startar utan fel
- [ ] TypeScript kompilerar utan fel
- [ ] ESLint körs utan varningar
- [ ] Prettier formaterar korrekt
- [ ] Husky hook triggas vid commit
- [ ] Alla mappar existerar

---

## 5. Fas 2: Kärnfunktionalitet

### 5.1 Typdefinitioner

```typescript
// src/types/todo.ts
export interface Todo {
  id: string
  text: string
  completed: boolean
  priorityId: string | null  // null = inbox
  createdAt: number
  updatedAt: number
  order: number
}

// src/types/priority.ts
export interface Priority {
  id: string
  name: string
  color: string
  icon?: string
  order: number
  isDefault: boolean  // Kan inte tas bort
}

// src/types/settings.ts
export interface Settings {
  theme: ThemeType
  token: string | null
  tokenCreatedAt: number | null
  lastSyncAt: number | null
}

export type ThemeType =
  | 'starfall'
  | 'starwars'
  | 'summer'
  | 'aurora'
  | 'ocean'
```

### 5.2 Zustand Store

```typescript
// src/stores/todoStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Todo } from '@/types'

interface TodoState {
  todos: Todo[]

  // Actions
  addTodo: (text: string) => void
  updateTodo: (id: string, updates: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  toggleTodo: (id: string) => void
  moveTodo: (id: string, priorityId: string | null, newOrder: number) => void
  reorderTodos: (priorityId: string | null, orderedIds: string[]) => void

  // Bulk operations
  importTodos: (todos: Todo[]) => void
  clearAll: () => void
}

// src/stores/priorityStore.ts
interface PriorityState {
  priorities: Priority[]

  addPriority: (name: string, color: string) => void
  updatePriority: (id: string, updates: Partial<Priority>) => void
  deletePriority: (id: string) => void
  reorderPriorities: (orderedIds: string[]) => void

  importPriorities: (priorities: Priority[]) => void
  resetToDefaults: () => void
}

// Default priorities
const DEFAULT_PRIORITIES: Priority[] = [
  { id: 'must-do', name: 'Must do asap', color: '#ef4444', order: 0, isDefault: true },
  { id: 'todo', name: 'Todo', color: '#eab308', order: 1, isDefault: true },
  { id: 'spare-time', name: 'Only do in spare time', color: '#22c55e', order: 2, isDefault: true },
]
```

### 5.3 Uppgifter Fas 2

| # | Uppgift | Fil(er) |
|---|---------|---------|
| 2.1 | Skapa typdefinitioner | src/types/*.ts |
| 2.2 | Implementera todoStore | src/stores/todoStore.ts |
| 2.3 | Implementera priorityStore | src/stores/priorityStore.ts |
| 2.4 | Implementera settingsStore | src/stores/settingsStore.ts |
| 2.5 | Skapa localStorage wrapper | src/services/storage.ts |
| 2.6 | Skapa useTodos hook | src/hooks/useTodos.ts |
| 2.7 | Skapa usePriorities hook | src/hooks/usePriorities.ts |
| 2.8 | Skapa TodoItem komponent | src/components/todo/TodoItem.tsx |
| 2.9 | Skapa TodoInput komponent | src/components/todo/TodoInput.tsx |
| 2.10 | Skapa TodoList komponent | src/components/todo/TodoList.tsx |
| 2.11 | Skapa PriorityColumn komponent | src/components/priority/PriorityColumn.tsx |
| 2.12 | Skapa Inbox komponent | src/components/inbox/Inbox.tsx |
| 2.13 | Skapa MainLayout | src/components/layout/MainLayout.tsx |
| 2.14 | Koppla ihop i App.tsx | src/App.tsx |

### 5.4 Verifiering Fas 2
- [ ] Kan skapa ny todo (hamnar i inbox)
- [ ] Kan redigera todo-text
- [ ] Kan toggle complete (överstrykning)
- [ ] Kan ta bort todo
- [ ] Data persisterar efter page refresh
- [ ] Prioriteringsnivåer visas vertikalt
- [ ] Inbox visas på sidan

---

## 6. Fas 3: Drag & Drop

### 6.1 DnD-kit Setup

```typescript
// src/components/dnd/DndProvider.tsx
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'

// Sensorer för mus + tangentbord
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 8px innan drag startar
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
)
```

### 6.2 Drag-scenarier

```
Scenario 1: Dra inom samma kolumn (reorder)
─────────────────────────────────────────
Inbox: [A, B, C]
Dra B ovanför A
Inbox: [B, A, C]

Scenario 2: Dra från Inbox till Priority
─────────────────────────────────────────
Inbox: [A, B]       Must Do: [X]
Dra A till Must Do
Inbox: [B]          Must Do: [A, X]

Scenario 3: Dra mellan Priorities
─────────────────────────────────────────
Must Do: [A]        Todo: [X, Y]
Dra A till Todo (mellan X och Y)
Must Do: []         Todo: [X, A, Y]
```

### 6.3 Uppgifter Fas 3

| # | Uppgift | Fil(er) |
|---|---------|---------|
| 3.1 | Skapa DndProvider | src/components/dnd/DndProvider.tsx |
| 3.2 | Gör TodoItem draggable | src/components/todo/TodoItem.tsx |
| 3.3 | Gör PriorityColumn droppable | src/components/priority/PriorityColumn.tsx |
| 3.4 | Gör Inbox droppable | src/components/inbox/Inbox.tsx |
| 3.5 | Implementera onDragEnd | src/hooks/useDragDrop.ts |
| 3.6 | Skapa DragOverlay | src/components/dnd/DragOverlay.tsx |
| 3.7 | Lägg till drag-animationer | Framer Motion |
| 3.8 | Tillgänglighet (keyboard) | aria-labels, focus |

### 6.4 Verifiering Fas 3
- [ ] Kan dra todo inom inbox
- [ ] Kan dra todo från inbox till priority
- [ ] Kan dra todo mellan priorities
- [ ] Kan dra todo tillbaka till inbox
- [ ] Visuell feedback under drag
- [ ] Keyboard navigation fungerar
- [ ] Animationer är smooth

---

## 7. Fas 4: Tema-system & Animationer

### 7.1 Bakgrundsteman

| Tema | Teknologi | Beskrivning |
|------|-----------|-------------|
| **Starfall** | tsParticles | Fallande stjärnor, mörk rymd, nebulosa-färger |
| **Star Wars** | CSS + tsParticles | Hyperspace-linjer, scrollande stjärnfält |
| **Summer Beach** | CSS gradients + SVG | Solnedgång, animerade vågor, palmblad |
| **Aurora** | CSS + Canvas | Norrsken, flytande färger, långsam rörelse |
| **Ocean** | tsParticles + CSS | Bubblor, ljusstrålar, djupblått |

### 7.2 Starfall Implementation

```typescript
// src/components/backgrounds/StarfallBackground.tsx
import Particles from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

const starfallConfig = {
  background: {
    color: { value: '#0a0a1a' },
  },
  particles: {
    number: { value: 100 },
    color: { value: '#ffffff' },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.1, max: 0.8 },
      animation: { enable: true, speed: 1, minimumValue: 0.1 },
    },
    size: {
      value: { min: 0.5, max: 2 },
    },
    move: {
      enable: true,
      direction: 'bottom',
      speed: { min: 0.5, max: 2 },
      straight: false,
    },
  },
}
```

### 7.3 Tema-kontext

```typescript
// src/components/backgrounds/BackgroundProvider.tsx
interface BackgroundContextValue {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
}

// Lazy load backgrounds
const backgrounds = {
  starfall: lazy(() => import('./StarfallBackground')),
  starwars: lazy(() => import('./StarWarsBackground')),
  summer: lazy(() => import('./SummerBeachBackground')),
  aurora: lazy(() => import('./AuroraBackground')),
  ocean: lazy(() => import('./OceanBackground')),
}
```

### 7.4 UI-animationer

```typescript
// src/components/todo/TodoItem.tsx (Framer Motion)
const todoVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -100, transition: { duration: 0.2 } },
  completed: {
    textDecoration: 'line-through',
    opacity: 0.6,
    transition: { duration: 0.3 }
  }
}

// Stagger children för listor
const listVariants = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
}
```

### 7.5 Uppgifter Fas 4

| # | Uppgift | Fil(er) |
|---|---------|---------|
| 4.1 | Skapa BackgroundProvider | src/components/backgrounds/BackgroundProvider.tsx |
| 4.2 | Implementera StarfallBackground | src/components/backgrounds/StarfallBackground.tsx |
| 4.3 | Implementera StarWarsBackground | src/components/backgrounds/StarWarsBackground.tsx |
| 4.4 | Implementera SummerBeachBackground | src/components/backgrounds/SummerBeachBackground.tsx |
| 4.5 | Implementera AuroraBackground | src/components/backgrounds/AuroraBackground.tsx |
| 4.6 | Implementera OceanBackground | src/components/backgrounds/OceanBackground.tsx |
| 4.7 | Skapa ThemeSelector | src/components/settings/ThemeSelector.tsx |
| 4.8 | Lägg till UI-animationer | TodoItem, PriorityColumn, etc |
| 4.9 | Lägg till page transitions | App.tsx |
| 4.10 | Optimera prestanda | Lazy loading, memoization |

### 7.6 Verifiering Fas 4
- [ ] Alla 5 teman fungerar
- [ ] Tema sparas i localStorage
- [ ] Tema-byte är smooth
- [ ] Animationer är 60fps
- [ ] Ingen layout shift vid tema-byte
- [ ] Bakgrund rör sig utan interaktion
- [ ] UI-animationer på todos

---

## 8. Fas 5: Backend & Synkronisering

### 8.1 D1 Schema

```sql
-- workers/migrations/0001_initial.sql

-- Användare (identifieras via token)
CREATE TABLE IF NOT EXISTS users (
  token TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  last_sync_at INTEGER,
  email TEXT
);

-- Prioriteringar
CREATE TABLE IF NOT EXISTS priorities (
  id TEXT PRIMARY KEY,
  user_token TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT,
  "order" INTEGER NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_token) REFERENCES users(token)
);

-- Todos
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  user_token TEXT NOT NULL,
  text TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  priority_id TEXT,
  "order" INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_token) REFERENCES users(token),
  FOREIGN KEY (priority_id) REFERENCES priorities(id)
);

-- workers/migrations/0002_indexes.sql
CREATE INDEX idx_priorities_user ON priorities(user_token);
CREATE INDEX idx_todos_user ON todos(user_token);
CREATE INDEX idx_todos_priority ON todos(priority_id);
```

### 8.2 Worker API

```typescript
// workers/api/src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { syncRoute } from './routes/sync'
import { restoreRoute } from './routes/restore'
import { emailRoute } from './routes/email'
import { healthRoute } from './routes/health'
import { rateLimiter } from './middleware/rateLimit'

type Bindings = {
  DB: D1Database
  MAILGUN_API_KEY: string
  MAILGUN_DOMAIN: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', cors({
  origin: ['https://prioritiz.pages.dev', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Token'],
}))
app.use('*', rateLimiter)

// Routes
app.route('/sync', syncRoute)
app.route('/restore', restoreRoute)
app.route('/email', emailRoute)
app.route('/health', healthRoute)

export default app
```

### 8.3 Sync Endpoint

```typescript
// workers/api/src/routes/sync.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const syncSchema = z.object({
  token: z.string().min(10),
  todos: z.array(z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
    priorityId: z.string().nullable(),
    order: z.number(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })),
  priorities: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    order: z.number(),
    isDefault: z.boolean(),
  })),
  lastSyncAt: z.number().nullable(),
})

export const syncRoute = new Hono()

syncRoute.post('/', zValidator('json', syncSchema), async (c) => {
  const { token, todos, priorities, lastSyncAt } = c.req.valid('json')
  const db = c.env.DB

  // Upsert user
  await db.prepare(`
    INSERT INTO users (token, created_at, last_sync_at)
    VALUES (?, ?, ?)
    ON CONFLICT(token) DO UPDATE SET last_sync_at = ?
  `).bind(token, Date.now(), Date.now(), Date.now()).run()

  // Sync priorities (full replace strategy)
  await db.prepare('DELETE FROM priorities WHERE user_token = ?')
    .bind(token).run()

  for (const p of priorities) {
    await db.prepare(`
      INSERT INTO priorities (id, user_token, name, color, icon, "order", is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(p.id, token, p.name, p.color, null, p.order, p.isDefault ? 1 : 0, Date.now(), Date.now()).run()
  }

  // Sync todos (full replace strategy)
  await db.prepare('DELETE FROM todos WHERE user_token = ?')
    .bind(token).run()

  for (const t of todos) {
    await db.prepare(`
      INSERT INTO todos (id, user_token, text, completed, priority_id, "order", created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(t.id, token, t.text, t.completed ? 1 : 0, t.priorityId, t.order, t.createdAt, t.updatedAt).run()
  }

  return c.json({ success: true, syncedAt: Date.now() })
})
```

### 8.4 Frontend Sync Service

```typescript
// src/services/sync.ts
import { useTodoStore } from '@/stores/todoStore'
import { usePriorityStore } from '@/stores/priorityStore'
import { useSettingsStore } from '@/stores/settingsStore'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.prioritiz.pages.dev'

class SyncService {
  private syncTimer: number | null = null
  private isSyncing = false

  // Debounced sync (5 sekunder efter senaste ändring)
  schedulSync() {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
    }
    this.syncTimer = window.setTimeout(() => this.sync(), 5000)
  }

  async sync() {
    if (this.isSyncing) return

    const token = useSettingsStore.getState().token
    if (!token) return

    this.isSyncing = true

    try {
      const response = await fetch(`${API_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': token,
        },
        body: JSON.stringify({
          token,
          todos: useTodoStore.getState().todos,
          priorities: usePriorityStore.getState().priorities,
          lastSyncAt: useSettingsStore.getState().lastSyncAt,
        }),
      })

      if (!response.ok) throw new Error('Sync failed')

      const { syncedAt } = await response.json()
      useSettingsStore.getState().setLastSyncAt(syncedAt)
    } catch (error) {
      console.error('Sync error:', error)
      // Tyst fel - försök igen senare
    } finally {
      this.isSyncing = false
    }
  }

  async restore(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/restore/${token}`)
      if (!response.ok) return false

      const data = await response.json()

      useTodoStore.getState().importTodos(data.todos)
      usePriorityStore.getState().importPriorities(data.priorities)
      useSettingsStore.getState().setToken(token)

      return true
    } catch {
      return false
    }
  }
}

export const syncService = new SyncService()
```

### 8.5 Uppgifter Fas 5

| # | Uppgift | Fil(er) |
|---|---------|---------|
| 5.1 | Skapa D1 migrations | workers/migrations/*.sql |
| 5.2 | Skapa Worker projekt | workers/api/ |
| 5.3 | Implementera CORS middleware | workers/api/src/middleware/cors.ts |
| 5.4 | Implementera rate limiter | workers/api/src/middleware/rateLimit.ts |
| 5.5 | Implementera /sync endpoint | workers/api/src/routes/sync.ts |
| 5.6 | Implementera /restore endpoint | workers/api/src/routes/restore.ts |
| 5.7 | Implementera /health endpoint | workers/api/src/routes/health.ts |
| 5.8 | Skapa frontend SyncService | src/services/sync.ts |
| 5.9 | Integrera sync i stores | src/stores/*.ts |
| 5.10 | Lägg till sync status UI | src/components/layout/Header.tsx |

### 8.6 Verifiering Fas 5
- [ ] Worker deployar utan fel
- [ ] D1 databas skapas korrekt
- [ ] /health returnerar 200
- [ ] /sync sparar data i D1
- [ ] /restore hämtar data från D1
- [ ] Frontend synkar automatiskt
- [ ] Sync status visas i UI
- [ ] Rate limiting fungerar

---

## 9. Fas 6: Token & Återställning

### 9.1 Token Generation

```typescript
// src/services/token.ts

// Format: XXX-XXX-XXX (lätt att läsa och skriva)
export function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Undvik 0, O, 1, I
  const segments = []

  for (let s = 0; s < 3; s++) {
    let segment = ''
    for (let i = 0; i < 3; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)]
    }
    segments.push(segment)
  }

  return segments.join('-')
}

// Validera token format
export function isValidToken(token: string): boolean {
  return /^[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}$/.test(token)
}
```

### 9.2 QR-kod

```typescript
// src/components/settings/QRCodeModal.tsx
import { QRCodeSVG } from 'qrcode.react'

interface QRCodeModalProps {
  token: string
  isOpen: boolean
  onClose: () => void
}

export function QRCodeModal({ token, isOpen, onClose }: QRCodeModalProps) {
  // QR innehåller URL för enkel restore
  const restoreUrl = `${window.location.origin}/restore/${token}`

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <h2>Din återställningskod</h2>
        <div className="bg-white p-4 rounded-lg inline-block">
          <QRCodeSVG value={restoreUrl} size={200} />
        </div>
        <p className="mt-4 font-mono text-xl">{token}</p>
        <p className="text-sm text-gray-400">
          Skanna QR-koden eller ange koden manuellt
        </p>
      </div>
    </Modal>
  )
}
```

### 9.3 Restore Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ÅTERSTÄLLNINGSFLÖDE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Användare öppnar app med tom localStorage                  │
│                    │                                        │
│                    ▼                                        │
│  ┌─────────────────────────────────────┐                   │
│  │  Har du en återställningskod?       │                   │
│  │                                      │                   │
│  │  [Ja, återställ]   [Nej, börja ny]  │                   │
│  └─────────────────────────────────────┘                   │
│           │                    │                            │
│           ▼                    ▼                            │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Ange kod:       │  │ Ny lista skapas │                  │
│  │ [___-___-___]   │  │ Ny token gen.   │                  │
│  │                 │  │ Visas i header  │                  │
│  │ [Återställ]     │  └─────────────────┘                  │
│  └────────┬────────┘                                        │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────────────────────┐                   │
│  │ Hämtar data från D1...              │                   │
│  │                                      │                   │
│  │ ✓ Hittade! Data återställd          │                   │
│  │ ✗ Ingen data hittad för denna kod   │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.4 Uppgifter Fas 6

| # | Uppgift | Fil(er) |
|---|---------|---------|
| 6.1 | Implementera token generator | src/services/token.ts |
| 6.2 | Skapa TokenDisplay komponent | src/components/settings/TokenDisplay.tsx |
| 6.3 | Skapa QRCodeModal | src/components/settings/QRCodeModal.tsx |
| 6.4 | Skapa RestoreModal | src/components/restore/RestoreModal.tsx |
| 6.5 | Skapa RestoreInput | src/components/restore/RestoreInput.tsx |
| 6.6 | Hantera /restore/:token route | src/App.tsx (routing) |
| 6.7 | Lägg till first-time UX | src/components/onboarding/ |
| 6.8 | Kopiera-till-clipboard funktion | src/utils/clipboard.ts |

### 9.5 Verifiering Fas 6
- [ ] Token genereras vid första todo
- [ ] Token visas i header
- [ ] QR-kod kan öppnas och visas
- [ ] Token kan kopieras
- [ ] /restore/:token fungerar
- [ ] Manuell token-inmatning fungerar
- [ ] Felhantering vid ogiltig token
- [ ] Success/error feedback

---

## 10. Fas 7: E-post Integration

### 10.1 Mailgun Setup

```typescript
// workers/api/src/services/mailgun.ts

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail(
  params: SendEmailParams,
  apiKey: string,
  domain: string
): Promise<boolean> {
  const formData = new FormData()
  formData.append('from', `Prioritiz <noreply@${domain}>`)
  formData.append('to', params.to)
  formData.append('subject', params.subject)
  formData.append('html', params.html)

  const response = await fetch(
    `https://api.mailgun.net/v3/${domain}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
      },
      body: formData,
    }
  )

  return response.ok
}
```

### 10.2 Email Template

```typescript
// workers/api/src/templates/tokenEmail.ts

export function createTokenEmailHtml(token: string, restoreUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a1a; color: #ffffff; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: rgba(255,255,255,0.05); border-radius: 16px; padding: 40px;">
    <h1 style="margin: 0 0 24px; font-size: 28px; text-align: center;">
      ✨ Prioritiz
    </h1>

    <p style="margin: 0 0 24px; line-height: 1.6; color: #a0a0a0;">
      Här är din återställningskod. Spara detta mail för att kunna återställa din lista om du rensar webbläsardata.
    </p>

    <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #666;">Din kod:</p>
      <p style="margin: 0; font-size: 32px; font-family: monospace; letter-spacing: 4px; color: #fff;">
        ${token}
      </p>
    </div>

    <a href="${restoreUrl}" style="display: block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 16px 24px; border-radius: 8px; text-align: center; font-weight: 500;">
      Återställ min lista
    </a>

    <p style="margin: 32px 0 0; font-size: 12px; color: #666; text-align: center;">
      Om du inte begärde denna kod kan du ignorera detta mail.
    </p>
  </div>
</body>
</html>
  `
}
```

### 10.3 Email Endpoint

```typescript
// workers/api/src/routes/email.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { sendEmail } from '../services/mailgun'
import { createTokenEmailHtml } from '../templates/tokenEmail'

const emailSchema = z.object({
  email: z.string().email(),
  token: z.string().regex(/^[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}$/),
})

export const emailRoute = new Hono()

emailRoute.post('/', zValidator('json', emailSchema), async (c) => {
  const { email, token } = c.req.valid('json')

  // Verifiera att token existerar i DB
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE token = ?'
  ).bind(token).first()

  if (!user) {
    return c.json({ error: 'Invalid token' }, 400)
  }

  // Uppdatera email i DB (för framtida notiser)
  await c.env.DB.prepare(
    'UPDATE users SET email = ? WHERE token = ?'
  ).bind(email, token).run()

  const restoreUrl = `https://prioritiz.pages.dev/restore/${token}`
  const html = createTokenEmailHtml(token, restoreUrl)

  const success = await sendEmail(
    {
      to: email,
      subject: 'Din Prioritiz återställningskod',
      html,
    },
    c.env.MAILGUN_API_KEY,
    c.env.MAILGUN_DOMAIN
  )

  if (!success) {
    return c.json({ error: 'Failed to send email' }, 500)
  }

  return c.json({ success: true })
})
```

### 10.4 Uppgifter Fas 7

| # | Uppgift | Fil(er) |
|---|---------|---------|
| 7.1 | Skapa Mailgun service | workers/api/src/services/mailgun.ts |
| 7.2 | Skapa email template | workers/api/src/templates/tokenEmail.ts |
| 7.3 | Implementera /email endpoint | workers/api/src/routes/email.ts |
| 7.4 | Skapa EmailModal frontend | src/components/settings/EmailModal.tsx |
| 7.5 | Lägg till email validation | Zod schema |
| 7.6 | Konfigurera Mailgun secrets | wrangler.toml secrets |
| 7.7 | Testa email delivery | Manuellt test |

### 10.5 Verifiering Fas 7
- [ ] Email modal öppnas från settings
- [ ] Email valideras korrekt
- [ ] Email skickas via Mailgun
- [ ] Email levereras (kolla spam)
- [ ] Email innehåller korrekt token
- [ ] Restore-länk i email fungerar
- [ ] Error handling vid misslyckad sending

---

## 11. Fas 8: Säkerhet

### 11.1 Säkerhetsåtgärder

| Åtgärd | Implementation | Prioritet |
|--------|----------------|-----------|
| Rate Limiting | Cloudflare WAF + Worker | P0 |
| Input Sanitering | Zod validation | P0 |
| CORS | Specifika origins | P0 |
| Token Entropy | 27^9 kombinationer | P0 |
| XSS Prevention | React default escaping | P0 |
| HTTPS Only | Cloudflare Pages | P0 |
| CSP Headers | Cloudflare Headers | P1 |
| Brute Force Protection | Exponentiell backoff | P1 |

### 11.2 Rate Limiter

```typescript
// workers/api/src/middleware/rateLimit.ts
import { Context, Next } from 'hono'

interface RateLimitStore {
  [ip: string]: {
    count: number
    resetAt: number
  }
}

// In-memory för nu (byt till KV för produktion)
const store: RateLimitStore = {}

const WINDOW_MS = 60 * 1000 // 1 minut
const MAX_REQUESTS = 30      // 30 requests per minut

export async function rateLimiter(c: Context, next: Next) {
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const now = Date.now()

  if (!store[ip] || store[ip].resetAt < now) {
    store[ip] = { count: 1, resetAt: now + WINDOW_MS }
  } else {
    store[ip].count++
  }

  if (store[ip].count > MAX_REQUESTS) {
    return c.json({ error: 'Too many requests' }, 429)
  }

  await next()
}
```

### 11.3 Input Validation

```typescript
// src/utils/validation.ts
import { z } from 'zod'

export const todoSchema = z.object({
  text: z.string()
    .min(1, 'Todo kan inte vara tom')
    .max(500, 'Max 500 tecken')
    .transform(text => text.trim()),
})

export const prioritySchema = z.object({
  name: z.string()
    .min(1, 'Namn krävs')
    .max(50, 'Max 50 tecken')
    .transform(name => name.trim()),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Ogiltig färg'),
})

export const emailSchema = z.object({
  email: z.string()
    .email('Ogiltig e-postadress')
    .max(254, 'E-post för lång'),
})

export const tokenSchema = z.string()
  .regex(/^[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}$/, 'Ogiltigt tokenformat')
```

### 11.4 CSP Headers

```typescript
// workers/api/src/middleware/security.ts
export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers)

  headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://api.prioritiz.pages.dev",
    "frame-ancestors 'none'",
  ].join('; '))

  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return new Response(response.body, {
    status: response.status,
    headers,
  })
}
```

### 11.5 Uppgifter Fas 8

| # | Uppgift | Fil(er) |
|---|---------|---------|
| 8.1 | Implementera rate limiter | workers/api/src/middleware/rateLimit.ts |
| 8.2 | Lägg till Zod validation | src/utils/validation.ts |
| 8.3 | Konfigurera CORS korrekt | workers/api/src/index.ts |
| 8.4 | Lägg till security headers | workers/api/src/middleware/security.ts |
| 8.5 | Audit dependencies | `npm audit` |
| 8.6 | Säkerhetstesta endpoints | Manuellt + automatiserat |

### 11.6 Verifiering Fas 8
- [ ] Rate limiting blockerar vid överanvändning
- [ ] Ogiltiga inputs avvisas
- [ ] CORS blockerar fel origins
- [ ] Security headers finns
- [ ] Inga npm audit high/critical

---

## 12. Fas 9: Testning

### 12.1 Teststrategi

```
┌─────────────────────────────────────────────────────────────┐
│                      TESTPYRAMID                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                        ╱╲                                   │
│                       ╱  ╲      E2E Tests (Playwright)      │
│                      ╱ 10 ╲     - Kritiska användarflöden   │
│                     ╱──────╲                                │
│                    ╱        ╲                               │
│                   ╱   20     ╲   Integration Tests          │
│                  ╱────────────╲  - API endpoints            │
│                 ╱              ╲ - Store + Service          │
│                ╱      70       ╲                            │
│               ╱────────────────╲ Unit Tests                 │
│              ╱                  ╲- Components               │
│             ╱                    ╲- Hooks                   │
│            ╱──────────────────────╲- Utils                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 12.2 Unit Tests

```typescript
// tests/unit/stores/todoStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useTodoStore } from '@/stores/todoStore'

describe('todoStore', () => {
  beforeEach(() => {
    useTodoStore.getState().clearAll()
  })

  describe('addTodo', () => {
    it('adds a todo to inbox (priorityId = null)', () => {
      useTodoStore.getState().addTodo('Test todo')

      const todos = useTodoStore.getState().todos
      expect(todos).toHaveLength(1)
      expect(todos[0].text).toBe('Test todo')
      expect(todos[0].priorityId).toBeNull()
      expect(todos[0].completed).toBe(false)
    })

    it('generates unique IDs', () => {
      useTodoStore.getState().addTodo('Todo 1')
      useTodoStore.getState().addTodo('Todo 2')

      const todos = useTodoStore.getState().todos
      expect(todos[0].id).not.toBe(todos[1].id)
    })
  })

  describe('toggleTodo', () => {
    it('toggles completed state', () => {
      useTodoStore.getState().addTodo('Test')
      const id = useTodoStore.getState().todos[0].id

      useTodoStore.getState().toggleTodo(id)
      expect(useTodoStore.getState().todos[0].completed).toBe(true)

      useTodoStore.getState().toggleTodo(id)
      expect(useTodoStore.getState().todos[0].completed).toBe(false)
    })
  })

  describe('moveTodo', () => {
    it('moves todo to priority', () => {
      useTodoStore.getState().addTodo('Test')
      const id = useTodoStore.getState().todos[0].id

      useTodoStore.getState().moveTodo(id, 'must-do', 0)

      expect(useTodoStore.getState().todos[0].priorityId).toBe('must-do')
    })
  })
})
```

### 12.3 Integration Tests

```typescript
// tests/integration/sync.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncService } from '@/services/sync'
import { useTodoStore } from '@/stores/todoStore'
import { useSettingsStore } from '@/stores/settingsStore'

describe('SyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTodoStore.getState().clearAll()
    useSettingsStore.getState().setToken('ABC-DEF-GHI')
  })

  it('syncs todos to API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, syncedAt: Date.now() }),
    })
    global.fetch = mockFetch

    useTodoStore.getState().addTodo('Test sync')
    await syncService.sync()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/sync'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Test sync'),
      })
    )
  })
})
```

### 12.4 E2E Tests

```typescript
// tests/e2e/todo-crud.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Todo CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Clear localStorage
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('can create a new todo', async ({ page }) => {
    await page.fill('[data-testid="todo-input"]', 'Buy groceries')
    await page.press('[data-testid="todo-input"]', 'Enter')

    await expect(page.locator('[data-testid="inbox"]')).toContainText('Buy groceries')
  })

  test('can toggle todo completion', async ({ page }) => {
    // Create todo
    await page.fill('[data-testid="todo-input"]', 'Test todo')
    await page.press('[data-testid="todo-input"]', 'Enter')

    // Toggle
    await page.click('[data-testid="todo-item"] [data-testid="toggle"]')

    await expect(page.locator('[data-testid="todo-item"]')).toHaveClass(/completed/)
  })

  test('can delete todo', async ({ page }) => {
    await page.fill('[data-testid="todo-input"]', 'To be deleted')
    await page.press('[data-testid="todo-input"]', 'Enter')

    await page.hover('[data-testid="todo-item"]')
    await page.click('[data-testid="delete-todo"]')

    await expect(page.locator('[data-testid="inbox"]')).not.toContainText('To be deleted')
  })
})

// tests/e2e/drag-drop.spec.ts
test.describe('Drag and Drop', () => {
  test('can drag todo from inbox to priority', async ({ page }) => {
    await page.goto('/')

    // Create todo
    await page.fill('[data-testid="todo-input"]', 'Urgent task')
    await page.press('[data-testid="todo-input"]', 'Enter')

    // Drag to "Must do asap"
    const todoItem = page.locator('[data-testid="todo-item"]').first()
    const targetColumn = page.locator('[data-testid="priority-must-do"]')

    await todoItem.dragTo(targetColumn)

    await expect(targetColumn).toContainText('Urgent task')
    await expect(page.locator('[data-testid="inbox"]')).not.toContainText('Urgent task')
  })
})
```

### 12.5 Uppgifter Fas 9

| # | Uppgift | Fil(er) |
|---|---------|---------|
| 9.1 | Konfigurera Vitest | vitest.config.ts |
| 9.2 | Konfigurera Playwright | playwright.config.ts |
| 9.3 | Skriv todoStore tests | tests/unit/stores/todoStore.test.ts |
| 9.4 | Skriv priorityStore tests | tests/unit/stores/priorityStore.test.ts |
| 9.5 | Skriv hook tests | tests/unit/hooks/*.test.ts |
| 9.6 | Skriv utility tests | tests/unit/utils/*.test.ts |
| 9.7 | Skriv API integration tests | tests/integration/*.test.ts |
| 9.8 | Skriv E2E CRUD tests | tests/e2e/todo-crud.spec.ts |
| 9.9 | Skriv E2E drag-drop tests | tests/e2e/drag-drop.spec.ts |
| 9.10 | Skriv E2E restore tests | tests/e2e/restore.spec.ts |
| 9.11 | Konfigurera CI test runner | .github/workflows/ci.yml |

### 12.6 Verifiering Fas 9
- [ ] `npm test` kör alla unit tests
- [ ] `npm run test:integration` passerar
- [ ] `npm run test:e2e` passerar
- [ ] Coverage > 80%
- [ ] CI kör tester automatiskt

---

## 13. Fas 10: Deployment

### 13.1 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Unit tests
        run: npm test -- --coverage

      - name: Build
        run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: prioritiz
          directory: dist

      - name: Deploy Worker
        run: |
          cd workers/api
          npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### 13.2 Wrangler Config

```toml
# workers/api/wrangler.toml
name = "prioritiz-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "prioritiz"
database_id = "<generated-id>"

[vars]
ENVIRONMENT = "production"

# Secrets (set via wrangler secret put)
# MAILGUN_API_KEY
# MAILGUN_DOMAIN
```

### 13.3 Deployment Checklist

```
PRE-DEPLOYMENT
─────────────────────────────────────────
□ Alla tester passerar lokalt
□ Build fungerar utan fel
□ Environment variables satta
□ D1 migrations körda
□ Secrets konfigurerade i Cloudflare

DEPLOYMENT
─────────────────────────────────────────
□ Push till main branch
□ CI pipeline grön
□ Pages deployment lyckad
□ Worker deployment lyckad

POST-DEPLOYMENT
─────────────────────────────────────────
□ Health check: GET /health → 200
□ Skapa test-todo → synkas till D1
□ Restore med token fungerar
□ Email skickas korrekt
□ Alla teman laddar
□ Mobilvy fungerar
□ Performance: LCP < 2.5s
```

### 13.4 Uppgifter Fas 10

| # | Uppgift | Fil(er) |
|---|---------|---------|
| 10.1 | Skapa CI workflow | .github/workflows/ci.yml |
| 10.2 | Skapa deploy workflow | .github/workflows/deploy.yml |
| 10.3 | Konfigurera Cloudflare Pages | Dashboard |
| 10.4 | Skapa D1 databas | `wrangler d1 create prioritiz` |
| 10.5 | Kör D1 migrations | `wrangler d1 migrations apply` |
| 10.6 | Sätt secrets | `wrangler secret put` |
| 10.7 | Initial deployment | Push till main |
| 10.8 | Verifiera deployment | Manuellt test |
| 10.9 | Konfigurera custom domain | Cloudflare DNS |

### 13.5 Verifiering Fas 10
- [ ] prioritiz.pages.dev fungerar
- [ ] API endpoint svarar
- [ ] D1 databas accepterar data
- [ ] Email fungerar i produktion
- [ ] Custom domain (om tillämpligt)
- [ ] SSL/HTTPS aktivt

---

## 14. Fas 11: Post-launch

### 14.1 Monitoring

```typescript
// Cloudflare Analytics automatiskt
// Lägg till custom events om behövs

// workers/api/src/utils/analytics.ts
export function logEvent(event: string, data?: Record<string, unknown>) {
  // Cloudflare Workers loggar automatiskt
  console.log(JSON.stringify({ event, ...data, timestamp: Date.now() }))
}

// Användning:
logEvent('sync', { todoCount: 10 })
logEvent('restore', { success: true })
logEvent('email_sent', { domain: 'gmail.com' })
```

### 14.2 Error Tracking

```typescript
// src/services/errorTracking.ts
export function captureError(error: Error, context?: Record<string, unknown>) {
  console.error('Error:', error.message, context)

  // Skicka till API för loggning (valfritt)
  fetch('/api/errors', {
    method: 'POST',
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
    }),
  }).catch(() => {
    // Tyst fel
  })
}
```

### 14.3 Framtida Förbättringar

| Feature | Beskrivning | Prioritet |
|---------|-------------|-----------|
| PWA | Offline support, installbar | P1 |
| Notifikationer | Push för deadlines | P2 |
| Keyboard shortcuts | Power user features | P2 |
| Undo/Redo | Ångra senaste åtgärd | P2 |
| Arkiv | Flytta completed todos | P2 |
| Labels/Tags | Kategorisera todos | P3 |
| Samarbete | Dela lista med andra | P3 |
| Cloudflare Email | Migrera från Mailgun | P3 |

---

## 15. Datamodeller

### 15.1 Complete TypeScript Types

```typescript
// src/types/index.ts

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

export type ThemeType =
  | 'starfall'
  | 'starwars'
  | 'summer'
  | 'aurora'
  | 'ocean'

export interface ThemeConfig {
  id: ThemeType
  name: string
  description: string
  preview: string // URL till preview-bild
}

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
  type: 'success' | 'error' | 'info'
  message: string
  duration?: number
}
```

---

## 16. API-specifikation

### 16.1 Endpoints

```yaml
Base URL: https://api.prioritiz.pages.dev

# Health Check
GET /health
Response: 200 OK
{
  "status": "ok",
  "timestamp": 1705152000000
}

# Sync Data
POST /sync
Headers:
  Content-Type: application/json
  X-Token: ABC-DEF-GHI
Body:
{
  "token": "ABC-DEF-GHI",
  "todos": [...],
  "priorities": [...],
  "lastSyncAt": 1705152000000
}
Response: 200 OK
{
  "success": true,
  "syncedAt": 1705152001000
}

# Restore Data
GET /restore/:token
Response: 200 OK
{
  "todos": [...],
  "priorities": [...],
  "settings": {
    "theme": "starfall"
  }
}
Response: 404 Not Found
{
  "error": "Token not found"
}

# Send Email
POST /email
Body:
{
  "email": "user@example.com",
  "token": "ABC-DEF-GHI"
}
Response: 200 OK
{
  "success": true
}
Response: 400 Bad Request
{
  "error": "Invalid email"
}
Response: 429 Too Many Requests
{
  "error": "Too many requests"
}
```

### 16.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_TOKEN` | 400 | Token format är felaktigt |
| `TOKEN_NOT_FOUND` | 404 | Token finns inte i databasen |
| `INVALID_EMAIL` | 400 | E-postadress är ogiltig |
| `EMAIL_SEND_FAILED` | 500 | Kunde inte skicka e-post |
| `RATE_LIMITED` | 429 | För många requests |
| `VALIDATION_ERROR` | 400 | Input validering misslyckades |
| `INTERNAL_ERROR` | 500 | Internt serverfel |

---

## 17. Komponentbibliotek

### 17.1 UI Komponenter

```typescript
// === BUTTON ===
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
}

// === INPUT ===
interface InputProps {
  type: 'text' | 'email'
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

// === MODAL ===
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

// === TOAST ===
interface ToastProps {
  type: 'success' | 'error' | 'info'
  message: string
  onClose: () => void
}

// === TOOLTIP ===
interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}
```

### 17.2 Todo Komponenter

```typescript
// === TODO ITEM ===
interface TodoItemProps {
  todo: Todo
  onToggle: () => void
  onDelete: () => void
  onEdit: (text: string) => void
  isDragging?: boolean
}

// === TODO INPUT ===
interface TodoInputProps {
  onAdd: (text: string) => void
  placeholder?: string
}

// === TODO LIST ===
interface TodoListProps {
  todos: Todo[]
  emptyMessage?: string
}
```

### 17.3 Priority Komponenter

```typescript
// === PRIORITY COLUMN ===
interface PriorityColumnProps {
  priority: Priority
  todos: Todo[]
  isOver?: boolean
}

// === PRIORITY HEADER ===
interface PriorityHeaderProps {
  priority: Priority
  count: number
  onEdit?: () => void
  onDelete?: () => void
}

// === ADD PRIORITY MODAL ===
interface AddPriorityModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string, color: string) => void
}
```

---

## 18. Error Handling Strategy

### 18.1 Error Typer

```typescript
// src/utils/errors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Nätverksfel') {
    super(message, 'NETWORK_ERROR', true)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', true)
    this.name = 'ValidationError'
  }
}

export class SyncError extends AppError {
  constructor(message = 'Synkronisering misslyckades') {
    super(message, 'SYNC_ERROR', true)
    this.name = 'SyncError'
  }
}
```

### 18.2 Error Boundaries

```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo)
    // Skicka till error tracking
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Något gick fel</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Försök igen
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 18.3 User-Facing Error Messages

| Scenario | Meddelande (SV) | Åtgärd |
|----------|-----------------|--------|
| Sync misslyckades | "Kunde inte synka. Försöker igen..." | Auto-retry |
| Token finns inte | "Ingen data hittades för denna kod" | Visa restore modal |
| Email kunde inte skickas | "Kunde inte skicka e-post. Försök igen." | Retry button |
| Rate limited | "För många förfrågningar. Vänta en stund." | Auto-retry efter delay |
| Nätverksfel | "Ingen internetanslutning" | Visa offline-läge |

---

## 19. Checklista per Fas

### Komplett Projektchecklista

```
FAS 1: PROJEKTSETUP
□ 1.1  Skapa Vite projekt
□ 1.2  Installera dependencies
□ 1.3  Konfigurera TypeScript
□ 1.4  Konfigurera Tailwind
□ 1.5  Konfigurera ESLint
□ 1.6  Konfigurera Prettier
□ 1.7  Konfigurera Husky
□ 1.8  Skapa mapstruktur
□ 1.9  Skapa CLAUDE.md
□ 1.10 Initiera Git
✓ Verifiering: npm run dev fungerar

FAS 2: KÄRNFUNKTIONALITET
□ 2.1  Skapa typdefinitioner
□ 2.2  Implementera todoStore
□ 2.3  Implementera priorityStore
□ 2.4  Implementera settingsStore
□ 2.5  Skapa localStorage wrapper
□ 2.6  Skapa useTodos hook
□ 2.7  Skapa usePriorities hook
□ 2.8  Skapa TodoItem komponent
□ 2.9  Skapa TodoInput komponent
□ 2.10 Skapa TodoList komponent
□ 2.11 Skapa PriorityColumn komponent
□ 2.12 Skapa Inbox komponent
□ 2.13 Skapa MainLayout
□ 2.14 Koppla ihop i App.tsx
✓ Verifiering: CRUD fungerar, data persisterar

FAS 3: DRAG & DROP
□ 3.1  Skapa DndProvider
□ 3.2  Gör TodoItem draggable
□ 3.3  Gör PriorityColumn droppable
□ 3.4  Gör Inbox droppable
□ 3.5  Implementera onDragEnd
□ 3.6  Skapa DragOverlay
□ 3.7  Lägg till drag-animationer
□ 3.8  Tillgänglighet (keyboard)
✓ Verifiering: Kan dra mellan alla zoner

FAS 4: TEMA-SYSTEM & ANIMATIONER
□ 4.1  Skapa BackgroundProvider
□ 4.2  Implementera StarfallBackground
□ 4.3  Implementera StarWarsBackground
□ 4.4  Implementera SummerBeachBackground
□ 4.5  Implementera AuroraBackground
□ 4.6  Implementera OceanBackground
□ 4.7  Skapa ThemeSelector
□ 4.8  Lägg till UI-animationer
□ 4.9  Lägg till page transitions
□ 4.10 Optimera prestanda
✓ Verifiering: Alla teman fungerar smooth

FAS 5: BACKEND & SYNKRONISERING
□ 5.1  Skapa D1 migrations
□ 5.2  Skapa Worker projekt
□ 5.3  Implementera CORS middleware
□ 5.4  Implementera rate limiter
□ 5.5  Implementera /sync endpoint
□ 5.6  Implementera /restore endpoint
□ 5.7  Implementera /health endpoint
□ 5.8  Skapa frontend SyncService
□ 5.9  Integrera sync i stores
□ 5.10 Lägg till sync status UI
✓ Verifiering: Data synkas till D1

FAS 6: TOKEN & ÅTERSTÄLLNING
□ 6.1  Implementera token generator
□ 6.2  Skapa TokenDisplay komponent
□ 6.3  Skapa QRCodeModal
□ 6.4  Skapa RestoreModal
□ 6.5  Skapa RestoreInput
□ 6.6  Hantera /restore/:token route
□ 6.7  Lägg till first-time UX
□ 6.8  Kopiera-till-clipboard funktion
✓ Verifiering: Token + restore fungerar

FAS 7: E-POST INTEGRATION
□ 7.1  Skapa Mailgun service
□ 7.2  Skapa email template
□ 7.3  Implementera /email endpoint
□ 7.4  Skapa EmailModal frontend
□ 7.5  Lägg till email validation
□ 7.6  Konfigurera Mailgun secrets
□ 7.7  Testa email delivery
✓ Verifiering: Email skickas och levereras

FAS 8: SÄKERHET
□ 8.1  Implementera rate limiter
□ 8.2  Lägg till Zod validation
□ 8.3  Konfigurera CORS korrekt
□ 8.4  Lägg till security headers
□ 8.5  Audit dependencies
□ 8.6  Säkerhetstesta endpoints
✓ Verifiering: Inga sårbarheter

FAS 9: TESTNING
□ 9.1  Konfigurera Vitest
□ 9.2  Konfigurera Playwright
□ 9.3  Skriv todoStore tests
□ 9.4  Skriv priorityStore tests
□ 9.5  Skriv hook tests
□ 9.6  Skriv utility tests
□ 9.7  Skriv API integration tests
□ 9.8  Skriv E2E CRUD tests
□ 9.9  Skriv E2E drag-drop tests
□ 9.10 Skriv E2E restore tests
□ 9.11 Konfigurera CI test runner
✓ Verifiering: Coverage > 80%

FAS 10: DEPLOYMENT
□ 10.1 Skapa CI workflow
□ 10.2 Skapa deploy workflow
□ 10.3 Konfigurera Cloudflare Pages
□ 10.4 Skapa D1 databas
□ 10.5 Kör D1 migrations
□ 10.6 Sätt secrets
□ 10.7 Initial deployment
□ 10.8 Verifiera deployment
□ 10.9 Konfigurera custom domain
✓ Verifiering: Live på prioritiz.pages.dev

FAS 11: POST-LAUNCH
□ 11.1 Sätt upp monitoring
□ 11.2 Konfigurera error tracking
□ 11.3 Dokumentera framtida features
□ 11.4 Samla initial feedback
✓ Verifiering: Appen fungerar i produktion
```

---

## Nästa steg

1. **Starta med Fas 1** - Projektsetup
2. Gå igenom varje uppgift i ordning
3. Markera som klar (□ → ✓) när verifierad
4. Vid problem: dokumentera i CHANGELOG.md
5. Kör verifiering innan nästa fas

---

*Genererad: 2026-01-13*
*Senast uppdaterad: 2026-01-13*
