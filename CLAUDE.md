# Prioritiz - Projekt Instruktioner

## Projektöversikt
**Typ**: Todo-app med prioriteringssystem och cinematiska animationer
**Stack**: React + Vite + TypeScript + Tailwind + Cloudflare (Pages, Workers, D1)
**Status**: Planering

## Master Plan
Se **claudedocs/PRIORITIZ_MASTER_PLAN.md** för komplett implementeringsplan.

## Snabbreferens

### Kärnfunktioner
- Todo CRUD med drag & drop
- Anpassningsbara prioriteringsnivåer (vertikal layout)
- 5 animerade bakgrundsteman (starfall, star wars, summer, aurora, ocean)
- localStorage + D1 backup
- Token-baserad återställning (format: XXX-XXX-XXX)
- QR-kod + e-post för token

### Default Prioriteringar
1. **Must do asap** (röd) - Högst prioritet
2. **Todo** (gul) - Normal prioritet
3. **Only do in spare time** (grön) - Lägst prioritet

### Projektstruktur
```
src/
  components/    # UI komponenter
  hooks/         # Custom React hooks
  stores/        # Zustand stores
  services/      # API & sync
  types/         # TypeScript typer
  utils/         # Helpers

workers/
  api/           # Cloudflare Worker
  migrations/    # D1 SQL migrations
```

## Regler

### Kod
- TypeScript strict mode
- Framer Motion för animationer
- dnd-kit för drag & drop
- Zod för validering
- Zustand för state

### Styling
- Tailwind CSS
- Glassmorphism design
- Inga multicolored emojis i UI
- Konsekvent färgschema per tema

### Backend
- Cloudflare Workers med Hono
- D1 för persistens
- Mailgun för e-post (temp) → Cloudflare Email (framtid)
- Rate limiting: 30 req/min

### Git
- Feature branches
- Conventional commits
- Kör tester innan commit

## Aktuell Fas
**Fas 1: Projektsetup** - Ej påbörjad

## Kommande
Se checklista i claudedocs/PRIORITIZ_MASTER_PLAN.md § 19
