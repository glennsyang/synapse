# Quickstart Guide

**Feature**: Synapse Second-Brain App  
**Branch**: 001-synapse-second-brain  
**Date**: 2026-02-02

## Prerequisites

- **Node.js**: v22.21.1 (exact version required)
- **npm** or **pnpm**: Latest version
- **fly.io CLI**: For deployment (install: `brew install flyctl` or `curl -L https://fly.io/install.sh | sh`)
- **Git**: For version control
- **Resend API Key**: For email notifications (sign up at https://resend.com)

---

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd synapse
git checkout 001-synapse-second-brain
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

**Key Dependencies**:

- `svelte@^5.0.0` - Reactive UI framework (Svelte 5 with runes)
- `@sveltejs/kit@^2.0.0` - Full-stack framework
- `better-auth@^1.0.0` - Authentication framework
- `drizzle-orm@^0.29.0` - TypeScript ORM
- `better-sqlite3@^9.2.0` - SQLite driver (synchronous)
- `sveltekit-superforms@^2.0.0` - Form handling
- `zod@^3.22.0` - Schema validation
- `resend@^3.0.0` - Email service
- `shadcn-svelte@latest` - UI component library
- `@tanstack/svelte-table@^8.10.0` - Data tables
- `chart.js@^4.4.0` + `svelte-chartjs@^3.1.0` - Charts
- `vitest@^1.0.0` - Testing framework
- `eslint@^8.0.0` + `prettier@^3.0.0` - Code quality
- `lefthook@^1.5.0` - Git hooks
- `lint-staged@^15.0.0` - Pre-commit linting

**Dev Dependencies**:

- `@sveltejs/adapter-node@^2.0.0` - Node.js adapter for production
- `drizzle-kit@^0.20.0` - Database migrations
- `typescript@^5.0.0` - Type checking
- `tailwindcss@^3.4.0` - Utility-first CSS

### 3. Environment Configuration

Create `.env` file in project root:

```bash
# Database
DATABASE_URL="file:./data/synapse.db"

# Better-Auth
BETTER_AUTH_SECRET="your-random-secret-here"  # Generate with: openssl rand -base64 32
BETTER_AUTH_BASE_URL="http://localhost:5173"       # Production: https://synapse.fly.dev

# Resend (Email)
RESEND_API_KEY="re_..."  # Get from https://resend.com

# App
PUBLIC_APP_URL="http://localhost:5173"

# Optional: Weather API (for journal location/weather)
WEATHER_API_KEY=""
```

**For Production (fly.io)**:

```bash
fly secrets set BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
fly secrets set BETTER_AUTH_BASE_URL="https://synapse.fly.dev"
fly secrets set RESEND_API_KEY="re_..."
fly secrets set DATABASE_URL="file:/data/synapse.db"
```

### 4. Database Setup

Initialize SQLite database and run migrations:

```bash
# Create database directory
mkdir -p data

# Generate migration from schema (application tables only - better-auth creates its own)
npm run db:generate

# Apply migrations
npm run db:push

# Optional: Seed predefined meditation routines (with UUID IDs)
npm run db:seed
```

**Note**: Better-auth automatically creates and manages its tables (`user`, `session`, `account`, `verification`) on first run. Do not manually create these tables.

### 5. Lefthook Setup

Install Lefthook git hooks for pre-commit linting:

```bash
# Install Lefthook globally (one-time)
brew install lefthook  # macOS
# or
curl -1sLf 'https://dl.cloudsmith.io/public/evilmartians/lefthook/setup.rpm.sh' | sudo -E bash
sudo yum install lefthook  # Linux

# Install git hooks
npx lefthook install
```

Lefthook configuration (`.lefthook.yml`) should be in repo root:

```yaml
pre-commit:
  parallel: true
  commands:
    lint-staged:
      glob: '*.{js,ts,svelte}'
      run: npx lint-staged
```

**package.json scripts**:

```json
{
	"scripts": {
		"dev": "vite dev",
		"build": "vite build",
		"preview": "vite preview",
		"db:generate": "drizzle-kit generate:sqlite",
		"db:push": "drizzle-kit push:sqlite",
		"db:studio": "drizzle-kit studio",
		"db:seed": "node scripts/seed.js",
		"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
		"check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
		"lint": "eslint .",
		"format": "prettier --write .",
		"test": "vitest",
		"test:unit": "vitest run",
		"test:watch": "vitest watch",
		"test:coverage": "vitest run --coverage"
	}
}
```

**lint-staged configuration** (package.json):

```json
{
	"lint-staged": {
		"*.{js,ts,svelte}": ["eslint --fix", "prettier --write"],
		"*.{json,md,css}": ["prettier --write"]
	}
}
```

---

## Development

### Start Dev Server

```bash
npm run dev
# or
pnpm dev

# Server starts at http://localhost:5173
```

**What Happens**:

- SvelteKit dev server with HMR (Hot Module Replacement)
- Vite builds frontend + backend
- SQLite database at `./data/synapse.db`
- Auto-reload on file changes

### Code Quality

**Linting**:

```bash
npm run lint
```

**Formatting**:

```bash
npm run format
```

**Type Checking**:

```bash
npm run check
```

### Testing

**Run All Tests**:

```bash
npm test
# or
npm run test:unit
```

**Watch Mode**:

```bash
npm run test:watch
```

**Coverage**:

```bash
npm run test:coverage
```

**Test Structure**:

- `tests/unit/` - Unit tests for schemas, utilities
- `tests/integration/` - Integration tests for form actions, database
- `tests/e2e/` - End-to-end tests with Playwright (optional)

---

## Project Structure

```
synapse/
├── src/
│   ├── lib/
│   │   ├── components/       # Svelte components
│   │   │   ├── ui/          # Shadcn primitives
│   │   │   ├── journal/
│   │   │   ├── todos/
│   │   │   ├── fitness/
│   │   │   ├── meditation/
│   │   │   └── visits/
│   │   ├── server/          # Server-only code
│   │   │   ├── db/          # Drizzle schema + client
│   │   │   ├── auth.ts      # Better-auth configuration
│   │   │   ├── email/       # Resend email templates
│   │   │   └── sync/        # Sync & conflict resolution
│   │   ├── client/          # Client-side code
│   │   │   └── auth.ts      # Better-auth client
│   │   ├── schemas/         # Zod validation schemas
│   │   ├── state/           # Svelte 5 runes state (no stores!)
│   │   └── utils/           # Shared utilities
│   ├── routes/
│   │   ├── (auth)/          # Auth route group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── verify-email/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (app)/           # Protected app routes
│   │   │   ├── journal/
│   │   │   ├── todos/
│   │   │   ├── fitness/
│   │   │   ├── meditation/
│   │   │   └── visits/
│   │   └── api/
│   │       └── auth/        # Better-auth auto-generated endpoints
│   ├── hooks.server.ts      # Server hooks (better-auth session middleware)
│   └── app.html             # HTML template
├── tests/                   # Test files
├── drizzle/                 # Database migrations
├── static/                  # Static assets
├── data/                    # SQLite database (gitignored)
├── .env                     # Environment variables (gitignored)
├── .lefthook.yml            # Lefthook git hooks configuration
├── svelte.config.js         # SvelteKit configuration
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── drizzle.config.ts        # Drizzle Kit configuration
├── vitest.config.ts         # Vitest configuration
└── package.json
```

---

## Database Management

### Drizzle Studio (GUI)

Explore database with web UI:

```bash
npm run db:studio
# Opens at https://local.drizzle.studio
```

### Create Migration

After updating schema in `src/lib/server/db/schema.ts`:

```bash
npm run db:generate
# Review migration in drizzle/migrations/
npm run db:push
```

### Seed Database

Run seed script to populate predefined meditation routines (with UUID IDs):

```bash
npm run db:seed
```

**Seed Script** (`scripts/seed.js`):

```javascript
import { db } from './src/lib/server/db';
import { meditationRoutines } from './src/lib/server/db/schema';
import { randomUUID } from 'crypto';

const predefinedRoutines = [
	{
		id: randomUUID(), // Generate UUID v4 for predefined routine
		title: '5-Minute Breath Awareness',
		description: 'Focus on your breath to center your mind',
		link_url: 'https://example.com/breath-awareness',
		duration_minutes: 5,
		mood_tags: JSON.stringify(['Focused', 'General']),
		is_predefined: 1,
		user_id: null
	},
	{
		id: randomUUID(),
		title: '10-Minute Anxiety Relief',
		description: 'Guided meditation for calming anxious thoughts',
		link_url: 'https://example.com/anxiety-relief',
		duration_minutes: 10,
		mood_tags: JSON.stringify(['Anxious']),
		is_predefined: 1,
		user_id: null
	}
	// ... more routines
];

await db.insert(meditationRoutines).values(predefinedRoutines);
console.log('Seeded predefined meditation routines');
```

---

## Building for Production

### Local Build

```bash
npm run build
npm run preview
```

### Production Checklist

- [ ] Set `BETTER_AUTH_SECRET` environment variable
- [ ] Set `BETTER_AUTH_BASE_URL` to production URL
- [ ] Set `RESEND_API_KEY` for email notifications
- [ ] Configure `DATABASE_URL` for persistent storage
- [ ] Enable HTTPS/TLS (fly.io provides automatically)
- [ ] Set up database backups (fly.io volumes)
- [ ] Configure CORS if needed (for future API access)
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure logging (structured logs)
- [ ] Verify email verification flow works in production
- [ ] Test password reset flow with production emails

---

## Deployment (fly.io)

### First-Time Deployment

**1. Create fly.io App**:

```bash
fly launch
# Follow prompts:
# - App name: synapse-<username>
# - Region: Choose closest to users
# - Database: Skip (we use SQLite on volume)
# - Deploy: No (we'll configure first)
```

**2. Create Persistent Volume**:

```bash
fly volumes create synapse_data --size 1
```

**3. Update fly.toml**:

```toml
app = "synapse-<username>"
primary_region = "sjc"

[build]
  [build.args]
    NODE_VERSION = "22.21.1"  # Exact version required

[env]
  PORT = "8080"
  DATABASE_URL = "file:/data/synapse.db"
  BETTER_AUTH_BASE_URL = "https://synapse-<username>.fly.dev"

[mounts]
  source = "synapse_data"
  destination = "/data"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80
    force_https = true

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

  [[services.tcp_checks]]
    interval = "15s"
    timeout = "2s"
    grace_period = "5s"
    restart_limit = 6

  [[services.http_checks]]
    interval = "30s"
    timeout = "5s"
    grace_period = "10s"
    method = "get"
    path = "/api/health"
    protocol = "http"
```

**4. Set Secrets**:

```bash
fly secrets set BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
fly secrets set RESEND_API_KEY="re_..."  # Your Resend API key
```

**5. Deploy**:

```bash
fly deploy
```

**6. Open App**:

```bash
fly open
```

### Subsequent Deployments

```bash
# Deploy latest code
fly deploy

# View logs
fly logs

# SSH into instance
fly ssh console

# Scale instances
fly scale count 2

# Check status
fly status
```

### Database Backups

**Manual Backup**:

```bash
fly ssh console
cd /data
sqlite3 synapse.db ".backup synapse_backup_$(date +%Y%m%d).db"
exit

# Download backup
fly sftp get /data/synapse_backup_*.db
```

**Automated Backups** (future):

- Set up cron job in fly.io
- Upload to S3 or similar

---

## Health Check Endpoint

Create `/api/health` for fly.io monitoring:

**File**: `src/routes/api/health/+server.ts`

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async () => {
	try {
		// Test database connection
		const result = await db.execute('SELECT 1');

		return json({
			status: 'healthy',
			timestamp: new Date().toISOString(),
			database: 'connected'
		});
	} catch (error) {
		return json(
			{
				status: 'unhealthy',
				timestamp: new Date().toISOString(),
				error: error.message
			},
			{ status: 503 }
		);
	}
};
```

---

## Common Tasks

### Add New Migration

1. Edit schema in `src/lib/server/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review migration in `drizzle/migrations/`
4. Apply: `npm run db:push`
5. Commit migration files

### Add Shadcn Component

```bash
npx shadcn-svelte@latest add button
npx shadcn-svelte@latest add card
npx shadcn-svelte@latest add dialog
# etc.
```

Components are copied to `src/lib/components/ui/`

### Create New Route

1. Create directory: `src/routes/(app)/new-route/`
2. Add `+page.svelte` (UI)
3. Add `+page.server.ts` (load function + form actions)
4. Add `+page.ts` (client-side load, if needed)
5. Define schemas in `src/lib/schemas/`

### Add New Test

**Unit Test**:

```bash
# Create tests/unit/schemas/new-schema.test.ts
import { describe, it, expect } from 'vitest';
import { mySchema } from '$lib/schemas/my-schema';

describe('mySchema', () => {
  it('validates valid input', () => {
    const result = mySchema.safeParse({ field: 'value' });
    expect(result.success).toBe(true);
  });
});
```

**Integration Test**:

```bash
# Create tests/integration/routes/my-route.test.ts
import { describe, it, expect } from 'vitest';
import { actions } from '$routes/(app)/my-route/+page.server';

describe('/my-route actions', () => {
  it('handles form submission', async () => {
    const result = await actions.default({ request, locals });
    expect(result).toBeDefined();
  });
});
```

---

## Troubleshooting

### Database Locked Error

**Symptom**: `database is locked` error

**Solution**:

- Close Drizzle Studio if running
- Ensure only one process accesses DB
- For production: Use WAL mode (Write-Ahead Logging)

```typescript
// src/lib/server/db/index.ts
import Database from 'better-sqlite3';
const sqlite = new Database(process.env.DATABASE_URL);
sqlite.pragma('journal_mode = WAL');
```

### Session Cookie Not Set

**Symptom**: User logged in but session not persisting

**Solution**:

- Verify `SESSION_SECRET` is set
- Check cookie settings (Secure flag requires HTTPS)
- In dev: Use `Secure: false` or use HTTPS locally

### Migration Conflicts

**Symptom**: Migration fails with "table already exists"

**Solution**:

- Reset database (dev only): `rm data/synapse.db && npm run db:push`
- For production: Write manual migration to handle existing state

### Vite Build Errors

**Symptom**: Build fails with module resolution errors

**Solution**:

- Clear `.svelte-kit` cache: `rm -rf .svelte-kit`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check import paths use `$lib` alias

---

## Additional Resources

- **SvelteKit Docs**: https://kit.svelte.dev/docs
- **Drizzle ORM Docs**: https://orm.drizzle.team/docs
- **Superforms Guide**: https://superforms.rocks
- **Shadcn-svelte**: https://shadcn-svelte.com
- **fly.io Docs**: https://fly.io/docs
- **Vitest Docs**: https://vitest.dev

---

## Next Steps

After setup, proceed to:

1. **Implement authentication** (User Story 1 - P1)
2. **Create journal CRUD** (User Story 2 - P2)
3. **Build todos module** (User Story 3 - P3)
4. **Add fitness tracking** (User Story 4 - P4)
5. **Implement meditation routines** (User Story 5 - P5)
6. **Add visit tracking** (User Story 6 - P6)

Refer to `tasks.md` (generated via `/speckit.tasks`) for detailed implementation tasks.
