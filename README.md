# Synapse

A modern second-brain application for personal knowledge management and productivity tracking.

## Purpose

Synapse helps you capture and organize your life in one place: daily journal entries, todos across multiple cadences, fitness and nutrition tracking, meditation routines, and visit tracking for maintaining personal connections.

## Features

- **Authentication** - Secure email/password authentication with session management
- **Daily Journal** - Create rich journal entries with tags, location, and weather context
- **Todo Management** - Organize tasks by daily, weekly, and monthly cadences with projects, priorities, and kanban views
- **Fitness & Nutrition** - Track workouts, meals, weight, and biometrics with visualizations and goals
- **Meditation Routines** - Define and schedule meditation practices with mood tracking
- **Visit Tracking** - Log visits to people with status indicators and follow-up reminders
- **Cloud Sync** - Offline-first architecture with cloud synchronization

## Tech Stack

**Frontend**

- [SvelteKit](https://kit.svelte.dev/) - Full-stack framework
- [Svelte 5](https://svelte.dev/) - Reactive UI with runes
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [shadcn-svelte](https://www.shadcn-svelte.com/) - UI components
- [Superforms](https://superforms.rocks/) + [Zod](https://zod.dev/) - Form handling and validation
- [TanStack Table](https://tanstack.com/table) - Data tables

**Backend**

- [Better-auth](https://www.better-auth.com/) - Authentication
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe database queries
- [SQLite](https://www.sqlite.org/) - Local database with better-sqlite3
- [Resend](https://resend.com/) - Email notifications

**Development**

- TypeScript
- Vitest - Unit/integration testing
- Lefthook - Git hooks
- ESLint + Prettier - Code quality

## Getting Started

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

Hosted on [fly.io](https://fly.io) with automatic TLS and persistent SQLite volumes.
