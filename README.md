# Synapse

A modern second-brain application for personal knowledge management and productivity tracking.

## Overview

Synapse is a comprehensive personal productivity app that helps you capture and organize your life in one place. Built with modern web technologies, it features secure authentication, offline-first architecture with cloud sync, and a sleek responsive interface optimized for both desktop and mobile.

## Features

- 🔐 **Secure Authentication** - Email/password auth with email verification, password reset, and session management
- 📝 **Daily Journal** - Rich journal entries with tags, location auto-capture, and optional weather integration
- ✅ **Todo Management** - Organize tasks by cadence (daily/weekly/monthly) with projects, tags, priorities, sub-steps, and multiple views (list/grid/kanban)
- 💪 **Fitness & Nutrition** - Track weight with goal tracking, log workouts with exercises (sets/reps/weight), meal logging with calorie tracking, and progress charts
- 🧘 **Meditation Routines** - Predefined and custom meditation routines with scheduling, mood tracking, and session history
- 👥 **Visit Tracking** - Log visits to people with status indicators (green/yellow/red based on recency), companions, notes, and follow-up reminders
- ☁️ **Cloud Sync** - Offline-first architecture with automatic sync and last-write-wins conflict resolution
- 📱 **Responsive Design** - Mobile-optimized with touch-friendly controls and adaptive layouts

## Tech Stack

### Frontend

- [SvelteKit](https://kit.svelte.dev/) - Full-stack meta-framework
- [Svelte 5](https://svelte.dev/) - Reactive UI with runes (no options API)
- [Tailwind CSS](https://tailwindcss.com/) v4 - Utility-first styling
- [shadcn-svelte](https://www.shadcn-svelte.com/) - Comprehensive UI component library
- [Superforms](https://superforms.rocks/) + [Zod](https://zod.dev/) - Type-safe form handling and validation
- [TanStack Table](https://tanstack.com/table) - Powerful data tables
- [Chart.js](https://www.chartjs.org/) - Data visualization
- [Lucide](https://lucide.dev/) - Icon library

### Backend

- [Better-auth](https://www.better-auth.com/) - Modern authentication with Drizzle adapter
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe SQL queries and migrations
- [SQLite](https://www.sqlite.org/) with [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - Local database
- [Resend](https://resend.com/) - Transactional email delivery
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) - Client-side offline storage

### Development Tools

- **TypeScript** - Type safety
- **Vitest** - Unit and integration testing
- **Lefthook** - Fast git hooks
- **lint-staged** - Pre-commit linting
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Prerequisites

- **Node.js**: `22.21.1` (required for better-sqlite3 compatibility)
  - Use [nvm](https://github.com/nvm-sh/nvm) or [asdf](https://asdf-vm.com/) to manage Node versions
  - Run `nvm use 22.21.1` or `asdf install nodejs 22.21.1`

## Getting Started

### 1. Clone the repository

```sh
git clone https://github.com/yourusername/synapse.git
cd synapse
```

### 2. Install dependencies

```sh
npm install
```

### 3. Set up environment variables

```sh
cp .env.example .env
```

Edit `.env` and configure:

```env
# Better-auth secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your_secret_here

# Resend API key for email notifications
RESEND_API_KEY=re_your_resend_api_key

# Database location
DATABASE_URL=./data/synapse.db

# Node environment
NODE_ENV=development

# Better-auth base URL (for email links)
BETTER_AUTH_BASE_URL=http://localhost:5173
```

### 4. Generate and apply database migrations

```sh
# Generate migrations from schema
npm run db:generate

# Apply migrations to database
npm run db:migrate
```

### 5. Seed meditation routines (optional)

```sh
node scripts/seed-meditation.js
```

### 6. Start development server

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

### Development

- `npm run dev` - Start dev server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run check` - Run TypeScript and Svelte checks
- `npm run check:watch` - Watch mode for checks

### Database

- `npm run db:generate` - Generate migrations from schema changes
- `npm run db:migrate` - Apply pending migrations
- `npm run db:push` - Push schema changes directly (dev only)
- `npm run db:studio` - Open Drizzle Studio (database GUI)

### Code Quality

- `npm run lint` - Run ESLint and Prettier
- `npm run format` - Format code with Prettier

### Testing

- `npm run test` - Run all tests
- `npm run test:unit` - Run unit tests only

## Project Structure

```
synapse/
├── src/
│   ├── lib/
│   │   ├── components/       # Svelte components
│   │   │   ├── app/          # App-level components (Header, Sidebar, etc.)
│   │   │   ├── ui/           # shadcn-svelte UI primitives
│   │   │   ├── shared/       # Shared components (LoadingSpinner, ErrorBoundary, etc.)
│   │   │   ├── journal/      # Journal-specific components
│   │   │   ├── todos/        # Todo-specific components
│   │   │   ├── fitness/      # Fitness-specific components
│   │   │   └── visits/       # Visit tracking components
│   │   ├── server/
│   │   │   ├── db/           # Database schema, migrations, and utils
│   │   │   ├── auth.ts       # Better-auth configuration
│   │   │   ├── actions/      # Server actions
│   │   │   ├── email/        # Email templates
│   │   │   └── sync/         # Sync service
│   │   ├── client/
│   │   │   ├── auth.ts       # Client-side auth
│   │   │   └── offline-db.ts # IndexedDB wrapper
│   │   ├── schemas/          # Zod validation schemas
│   │   ├── utils/            # Utility functions
│   │   └── types.ts          # TypeScript types
│   ├── routes/               # SvelteKit routes
│   │   ├── (app)/            # Authenticated routes
│   │   ├── (auth)/           # Auth routes (login, register, etc.)
│   │   ├── (splash)/         # Landing page
│   │   └── api/              # API endpoints
│   ├── app.html              # HTML template
│   ├── app.css               # Global styles
│   ├── env.ts                # Environment variable validation
│   └── hooks.server.ts       # SvelteKit server hooks
├── static/                   # Static assets
├── data/                     # SQLite database (gitignored)
├── specs/                    # Feature specifications
├── docs/                     # Documentation
├── drizzle.config.ts         # Drizzle ORM configuration
├── fly.toml                  # Fly.io deployment config
└── Dockerfile                # Docker container definition
```

## Deployment

Synapse is designed to be deployed on [fly.io](https://fly.io) with persistent SQLite storage. See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

```sh
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly.io
fly auth login

# Create app
fly apps create synapse-second-brain

# Create persistent volume
fly volumes create synapse_data --region sjc --size 1

# Set secrets
fly secrets set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
fly secrets set RESEND_API_KEY=re_your_key
fly secrets set BETTER_AUTH_BASE_URL=https://synapse-second-brain.fly.dev
fly secrets set DATABASE_URL=/data/synapse.db

# Deploy
fly deploy
```

## Architecture

### Authentication

- Better-auth handles user registration, login, password reset, and email verification
- Sessions stored in SQLite with secure HTTP-only cookies
- Protected routes check `locals.user` in `+layout.server.ts`

### Database

- **SQLite** with better-sqlite3 for simple, file-based persistence
- **UUIDs** for all primary keys to avoid conflicts in offline scenarios
- **Audit fields** on all tables: `createdBy`, `updatedBy`, `createdAt`, `updatedAt`
- **Drizzle ORM** for type-safe queries and migrations

### Sync & Offline Support

- **Offline-first**: Changes saved to IndexedDB when offline
- **Automatic sync**: Syncs when coming back online
- **Last-write-wins**: Conflict resolution based on timestamps
- **Request IDs**: All requests tracked for debugging

### Security

- HTTPS enforced in production
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Input validation with Zod schemas
- SQL injection prevention via Drizzle ORM
- Password hashing via Better-auth (bcrypt)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Support

For issues and questions, please [open an issue](https://github.com/yourusername/synapse/issues).
