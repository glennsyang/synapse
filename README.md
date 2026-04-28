# Synapse

A modern second-brain application for personal knowledge management and productivity tracking.

## Overview

Synapse is a comprehensive personal productivity app that helps you capture and organize your life in one place. Built with modern web technologies, it features secure authentication, journaling, task management, health tracking, meditation routines, and a sleek responsive interface optimized for both desktop and mobile.

## Features

- 🔐 **Secure Authentication** - Email/password auth with email verification, password reset, and session management
- 📝 **Daily Journal** - Rich journal entries with tags, location auto-capture, and optional weather integration
- ✅ **Task Management** - Organize work in a Kanban board with tags, priorities, due dates, and state-based workflows
- 💪 **Fitness & Nutrition** - Track weight with goal tracking, log workouts with exercises (sets/reps/weight), meal logging with calorie tracking, and progress charts
- 🧘 **Meditation Routines** - Predefined and custom meditation routines with scheduling, mood tracking, and session history
- 👥 **Visit Tracking** - Log visits to people with status indicators (green/yellow/red based on recency), companions, notes, and follow-up reminders
- 📱 **Responsive Design** - Mobile-optimized with touch-friendly controls and adaptive layouts

## Tech Stack

### Frontend

- [SvelteKit](https://kit.svelte.dev/) - Full-stack meta-framework
- [Svelte 5](https://svelte.dev/) - Reactive UI with runes (no options API)
- [Tailwind CSS](https://tailwindcss.com/) v4 - Utility-first styling
- [shadcn-svelte](https://www.shadcn-svelte.com/) - Comprehensive UI component library
- [Superforms](https://superforms.rocks/) + [Zod](https://zod.dev/) - Type-safe form handling and validation
- [TanStack Table](https://tanstack.com/table) - Powerful data tables
- [LayerChart](https://layerchart.com/) + [D3](https://d3js.org/) - Data visualization
- [Lucide](https://lucide.dev/) - Icon library

### Backend

- [Better-auth](https://www.better-auth.com/) - Modern authentication with Drizzle adapter
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe SQL queries and migrations
- [SQLite](https://www.sqlite.org/) with [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - Local database
- [Resend](https://resend.com/) - Transactional email delivery

### Development Tools

- **TypeScript** - Type safety
- **Vitest** - Unit and integration testing
- **Lefthook** - Fast git hooks
- **lint-staged** - Pre-commit linting
- **Biome** - Code linting and formatting

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

# Email sender and recipient configuration
RESEND_FROM_ADDRESS=noreply@example.com
RESEND_NEW_USER_ADDRESS=admin@example.com

# Cron authentication (required for scheduled notifications via /api/cron/email-notifications)
CRON_SECRET=your_cron_secret_here
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

### Code Quality

- `npm run lint` - Run Biome CI checks
- `npm run lint:fix` - Run Biome checks with auto-fixes
- `npm run format` - Format code with Biome
- `npm run update-deps` - Check outdated packages and update

### Testing

- `npm run test` - Run unit tests in non-watch mode
- `npm run test:unit` - Run unit tests only
- `npm run test:e2e` - Run focused Playwright browser tests

For Playwright runs, create a `.env.test` file with credentials for a local test user:

```env
E2E_USER_EMAIL=you@example.com
E2E_USER_PASSWORD=your-password
```

If those variables are not set, the focused Playwright spec will be skipped.

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
│   │   │   ├── tasks/        # Task-specific components
│   │   │   ├── fitness/      # Fitness-specific components
│   │   │   ├── meditation/   # Meditation-specific components
│   │   │   └── skeletons/    # Loading and placeholder components
│   │   ├── server/
│   │   │   ├── db/           # Database schema, migrations, and utils
│   │   │   ├── auth/         # Better-auth plugin configuration
│   │   │   ├── auth.ts       # Better-auth instance and exports
│   │   │   ├── actions/      # Server actions
│   │   │   ├── email/        # Email sending utilities
│   │   │   ├── notifications/ # Notification job logic
│   │   │   └── daily-agenda.ts # Daily agenda digest logic
│   │   ├── hooks/            # Shared Svelte hooks
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

Synapse is designed to be deployed on [fly.io](https://fly.io) with persistent SQLite storage. Use [fly.toml](./fly.toml) as the source of truth for app/runtime configuration.

### Quick Deploy

```sh
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly.io
fly auth login

# Create app
fly apps create synapse-dev

# Create persistent volume
fly volumes create data --region yyz --size 1

# Set secrets
fly secrets set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
fly secrets set RESEND_API_KEY=re_your_key
fly secrets set BETTER_AUTH_BASE_URL=https://synapse-dev.fly.dev
fly secrets set DATABASE_URL=/data/synapse.db
fly secrets set RESEND_FROM_ADDRESS=noreply@example.com
fly secrets set RESEND_NEW_USER_ADDRESS=admin@example.com
fly secrets set CRON_SECRET=$(openssl rand -base64 32)

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
- **Ownership fields** use `userId`/`user_id` foreign keys to `user.id`
- **Timestamp fields** use a mix of `createdAt`/`updatedAt` and `created_at`/`updated_at` by table
- **Drizzle ORM** for type-safe queries and migrations

### Operations & Observability

- **Health check endpoint** at `/api/healthz` validates DB responsiveness
- **Request IDs** are generated in `hooks.server.ts` and included via `X-Request-ID`
- **Scheduled notifications** (workout, meditation, visit warnings, and daily agenda digest at 6:00 AM PT) run via `/api/cron/email-notifications` with `Authorization: Bearer ${CRON_SECRET}`

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

For issues and questions, please [open an issue](https://github.com/glennsyang/synapse/issues).
