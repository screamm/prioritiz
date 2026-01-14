# Prioritiz

> A beautiful, animated todo app with priority management and cloud sync.

![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20D1-f38020)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Priority-based Organization** - Customizable priority levels with drag and drop
- **8 Animated Themes** - Starfall, Hyperspace, AT-AT Walker, Sunset, Stars, Aurora, Ocean
- **Cloud Sync** - Automatic backup to Cloudflare D1 database
- **Token Recovery** - Unique XXX-XXX-XXX token for data restoration
- **QR Code Export** - Share your recovery token easily
- **Email Backup** - Send recovery token to your email
- **Keyboard Accessible** - Full keyboard navigation support
- **Mobile Responsive** - Works beautifully on all devices

## Live Demo

**[prioritiz.pages.dev](https://prioritiz.pages.dev)**

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Cloudflare account (for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/screamm/prioritiz.git
cd prioritiz

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app.

## Tech Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **dnd-kit** - Drag and drop
- **Zustand** - State management

### Backend

- **Cloudflare Workers** - Serverless API
- **Cloudflare D1** - SQLite database
- **Hono** - Web framework
- **Zod** - Validation

## Project Structure

```
prioritiz/
├── src/
│   ├── components/       # React components
│   │   ├── backgrounds/  # Animated background themes
│   │   ├── dnd/          # Drag and drop provider
│   │   ├── inbox/        # Inbox component
│   │   ├── layout/       # Layout components
│   │   ├── priority/     # Priority management
│   │   ├── settings/     # Settings and modals
│   │   ├── todo/         # Todo components
│   │   └── ui/           # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API and sync services
│   ├── stores/           # Zustand state stores
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── workers/
│   └── api/              # Cloudflare Worker API
│       ├── src/
│       │   ├── routes/   # API routes
│       │   └── middleware/
│       └── migrations/   # D1 database migrations
└── dist/                 # Production build output
```

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript check
```

### Backend Development

```bash
cd workers/api

# Install worker dependencies
npm install

# Start local development
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## Configuration

### Environment Variables

Create `.env.local` for frontend:

```env
VITE_API_URL=http://localhost:8787
```

Create `workers/api/.dev.vars` for backend:

```env
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=your-domain
```

### Cloudflare Setup

1. Create a D1 database:

   ```bash
   wrangler d1 create prioritiz-db
   ```

2. Run migrations:

   ```bash
   wrangler d1 execute prioritiz-db --file=./migrations/0001_initial.sql
   ```

3. Set secrets:

   ```bash
   wrangler secret put MAILGUN_API_KEY
   wrangler secret put MAILGUN_DOMAIN
   ```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sync` | Sync todos and priorities |
| GET | `/restore/:token` | Restore data by token |
| POST | `/email` | Send recovery email |
| GET | `/health` | Health check |

Rate limiting: 30 requests per minute.

## Default Priorities

The app comes with three default priority levels:

1. **Must do asap** (red) - Highest priority
2. **Todo** (yellow) - Normal priority
3. **Only do in spare time** (green) - Lowest priority

You can customize these levels, add new ones (max 10), or remove existing ones to fit your workflow.

## Recovery Token

Your unique recovery token uses the format: `XXX-XXX-XXX`

- Displayed in the settings panel
- Scannable via QR code for easy sharing
- Can be emailed to you for safekeeping
- Enter in Settings to restore your data on a new device

## Data Storage

Prioritiz uses a dual-storage approach:

1. **localStorage** - Primary storage for instant access and offline functionality
2. **Cloudflare D1** - Cloud backup for data recovery and cross-device sync

Your data is always available locally, with automatic cloud backup when online.

## Background Themes

Choose from 8 animated background themes:

| Theme | Description |
|-------|-------------|
| **Sunset** | Warm sunset gradient with floating particles |
| **Hyperspace** | Star Wars-style hyperspace jump effect |
| **AT-AT Walker** | Imperial AT-AT walking on Hoth (CSS animation) |
| **Starfall** | Gentle falling stars and meteors |
| **Stars** | Glittering night sky |
| **Stars 2** | Cosmic star field variation |
| **Aurora** | Northern lights color waves |
| **Ocean** | Calm deep underwater ambiance |

## Known Issues & Roadmap

### Critical Priority

| Issue | Description | Status |
|-------|-------------|--------|
| Sync Conflict Resolution | Full DELETE then INSERT can cause data loss on simultaneous access | Planned |
| Database Transactions | Sync operations not wrapped in transactions | Planned |
| Token Expiration | Tokens never expire, security concern | Planned |

### High Priority

| Issue | Description | Status |
|-------|-------------|--------|
| DnD Reordering | Dropping within same priority column sometimes places item at end | Under Review |
| Offline Detection | No `navigator.onLine` check before sync attempts | Planned |
| API Timeout | No AbortController timeout on fetch requests | Planned |
| Silent Sync Failures | User not notified when sync fails | Planned |
| Race Conditions | Multiple rapid todo moves can corrupt order values | Under Review |

### Medium Priority

| Issue | Description | Status |
|-------|-------------|--------|
| Input Validation | Max length not enforced in UI input fields | Planned |
| Restore Validation | Restored data not validated against schemas | Planned |
| Re-render Optimization | Todo list re-renders entirely on single change | Planned |
| Rate Limiting | No rate limit on restore endpoint (brute force) | Planned |

### Planned Features

- [ ] Token expiration with renewal flow
- [ ] Offline queue with sync-when-online
- [ ] Conflict resolution UI for sync conflicts
- [ ] Virtual scrolling for large todo lists
- [ ] Database indexes for query performance
- [ ] Comprehensive test suite (Vitest + Playwright)

## Accessibility

Prioritiz is built with accessibility in mind:

- Full keyboard navigation support
- Screen reader compatible with ARIA labels
- Focus indicators on all interactive elements
- Confirmation modals for destructive actions
- High contrast glassmorphism design

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes using conventional commits (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code passes linting and type checks before submitting.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [dnd-kit](https://dndkit.com/) for accessible drag and drop
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- [Cloudflare](https://cloudflare.com/) for serverless infrastructure
- [Zustand](https://zustand-demo.pmnd.rs/) for simple state management
- [r4ms3s](https://codepen.io/r4ms3s/pen/gajVBG) for the AT-AT CSS animation
