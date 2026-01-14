# Prioritiz

> A beautiful, animated todo app with priority management and cloud sync.

![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20D1-f38020)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Priority-based Organization** - Customizable priority levels with drag and drop
- **Stunning Backgrounds** - 5 animated themes (Starfall, Star Wars, Summer, Aurora, Ocean)
- **Cloud Sync** - Automatic backup to Cloudflare D1 database
- **Token Recovery** - Unique XXX-XXX-XXX token for data restoration
- **QR Code Export** - Share your recovery token easily
- **Email Backup** - Send recovery token to your email
- **Keyboard Accessible** - Full keyboard navigation support
- **Mobile Responsive** - Works beautifully on all devices

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Cloudflare account (for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/prioritiz.git
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
- **tsParticles** - Particle effects

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
└── tests/
    ├── unit/             # Vitest unit tests
    └── e2e/              # Playwright E2E tests
```

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage
npm run test:e2e     # Run E2E tests

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript check
npm run format       # Format with Prettier
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
   wrangler d1 execute prioritiz-db --file=./migrations/0002_indexes.sql
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

You can customize these levels, add new ones, or remove existing ones to fit your workflow.

## Recovery Token

Your unique recovery token uses the format: `XXX-XXX-XXX`

- Displayed in the settings panel
- Scannable via QR code for easy sharing
- Can be emailed to you for safekeeping
- Use at `/restore/:token` endpoint to recover your data on a new device

## Data Storage

Prioritiz uses a dual-storage approach:

1. **localStorage** - Primary storage for instant access and offline functionality
2. **Cloudflare D1** - Cloud backup for data recovery and cross-device sync

Your data is always available locally, with automatic cloud backup when online.

## Background Themes

Choose from 5 animated background themes:

- **Starfall** - Gentle falling stars animation
- **Star Wars** - Hyperspace star field effect
- **Summer** - Warm, floating particles
- **Aurora** - Northern lights color waves
- **Ocean** - Calm underwater ambiance

## Accessibility

Prioritiz is built with accessibility in mind:

- Full keyboard navigation support
- Screen reader compatible
- High contrast color options
- Focus indicators on all interactive elements
- ARIA labels and roles throughout

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
- [tsParticles](https://particles.js.org/) for particle effects
- [Cloudflare](https://cloudflare.com/) for serverless infrastructure
- [Zustand](https://zustand-demo.pmnd.rs/) for simple state management
