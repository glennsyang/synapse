# Research & Technical Decisions

**Feature**: Synapse Second-Brain App  
**Branch**: 001-synapse-second-brain  
**Date**: 2026-02-02

## Overview

This document captures research findings and technical decisions for implementing the Synapse second-brain application using SvelteKit, SQLite, and the specified technology stack.

---

## 1. SvelteKit Architecture Patterns

### Decision

Use SvelteKit's unified full-stack architecture with:

- Server-side rendering (SSR) for initial page loads
- Route groups for auth vs protected app sections: `(auth)` and `(app)`
- SvelteKit hooks for authentication middleware
- Form actions for mutations (create, update, delete)
- Load functions for data fetching

### Rationale

- **Single codebase**: SvelteKit eliminates the need for separate frontend/backend projects, reducing complexity
- **Type safety**: TypeScript flows seamlessly between client and server code
- **Progressive enhancement**: Forms work without JavaScript, then enhance with client-side validation
- **File-based routing**: Intuitive structure maps directly to URL patterns
- **Built-in features**: No need for separate routing, API, or SSR libraries

### Alternatives Considered

- **Next.js**: Rejected due to larger bundle sizes and React's heavier runtime compared to Svelte's compile-time approach
- **Separate SPA + API**: Rejected as it violates "Simplicity First" principle and increases deployment complexity
- **Astro**: Rejected as it's optimized for content sites, not interactive applications

---

## 2. SQLite + Drizzle Schema Design

### Decision

Use SQLite with Drizzle ORM:

- One database file with better-sqlite3 driver (synchronous, faster for single-user scenarios)
- **UUIDs (v4)** for all primary and foreign keys
- Drizzle schema with TypeScript for type-safe queries
- Drizzle adapter for better-auth integration
- Timestamp columns (`created_at`, `updated_at`) on all entities for sync conflict resolution

### Rationale

- **Simplicity**: SQLite requires no separate database server, simplifying deployment on fly.io
- **Performance**: Better performance for single-user workloads compared to PostgreSQL
- **Type safety**: Drizzle provides excellent TypeScript integration without code generation
- **Migrations**: Drizzle Kit handles schema migrations cleanly
- **Offline-first**: SQLite file can be synced to cloud storage for backup and multi-device access
- **UUIDs**: Random UUIDs (v4) prevent collision in distributed/offline scenarios
- **better-sqlite3**: Synchronous driver is simpler and faster for Node.js server-side usage

### Alternatives Considered

- **PostgreSQL**: Rejected due to operational overhead and unnecessary for single-user app
- **Prisma**: Rejected due to code generation step and larger runtime compared to Drizzle's lighter approach
- **Raw SQL**: Rejected as it lacks type safety and migration management
- **Integer IDs**: Rejected in favor of UUIDs for better offline/sync support

### Schema Conventions

- All tables use `id` as text (UUID v4) primary key
- Foreign keys use `user_id`, `project_id`, etc. naming convention (text/UUID)
- Timestamps: `created_at`, `updated_at` (ISO 8601 strings)
- Booleans stored as integers (0/1) per SQLite convention
- JSON columns for flexible metadata (tags, mood_tags, companions)
- Better-auth tables follow their schema (user, session, account, verification)

---

## 3. Superforms + Zod Integration

### Decision

Use Superforms with Zod for all forms:

- Define Zod schemas in `src/lib/schemas/` directory
- Use `superValidate()` in load functions to pre-populate forms
- Use `message()` for server-side validation errors
- Progressive enhancement: forms work server-side, enhance with client-side validation

### Rationale

- **Type safety**: Zod schemas provide runtime validation and TypeScript types
- **DX**: Superforms provides excellent developer experience with minimal boilerplate
- **Validation**: Single source of truth for validation (client + server)
- **Error handling**: Automatic error message propagation to form fields
- **Accessibility**: Built-in support for ARIA attributes and screen readers

### Alternatives Considered

- **Plain SvelteKit form actions**: Rejected due to lack of automatic validation and error handling
- **Formsnap**: Rejected as Superforms is more mature and better documented for SvelteKit
- **Yup**: Rejected as Zod has better TypeScript integration

### Form Patterns

```typescript
// Schema definition
export const journalEntrySchema = z.object({
	date: z.string().date(),
	content: z.string().min(1),
	tags: z.array(z.string()).optional()
});

// Load function
export const load = async ({ locals }) => {
	const form = await superValidate(journalEntrySchema);
	return { form };
};

// Form action
export const actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, journalEntrySchema);
		if (!form.valid) return fail(400, { form });
		// Process form data
		return { form };
	}
};
```

---

## 4. Authentication with Better-auth + Resend

### Decision

Implement authentication using Better-auth framework:

- Email + password with built-in password hashing
- Email verification via Resend
- Password reset via Resend
- Drizzle adapter for database integration
- Session management with secure cookies
- Better-auth auto-generates `/api/auth/*` endpoints

### Rationale

- **Framework integration**: Better-auth is purpose-built for SvelteKit and provides batteries-included auth
- **Email workflows**: Built-in email verification and password reset flows
- **Type safety**: Full TypeScript support with Drizzle adapter
- **Security**: Industry-standard security practices built-in (password hashing, secure sessions, CSRF protection)
- **Resend integration**: Clean email API with excellent DX and deliverability
- **Simplicity**: No need to build auth flows from scratch, reduces security risks

### Alternatives Considered

- **Lucia**: Rejected as better-auth is more feature-complete and actively maintained
- **Auth.js (NextAuth)**: Rejected as better-auth is specifically designed for SvelteKit
- **Custom auth**: Rejected due to security complexity and time investment
- **SendGrid/Mailgun**: Rejected in favor of Resend's simpler API and better DX

### Authentication Flow

1. **Registration**:
   - User submits email + password
   - Better-auth hashes password, creates user
   - Sends verification email via Resend
   - User clicks link, email verified

2. **Login**:
   - User submits email + password
   - Better-auth verifies credentials
   - Creates session, sets HTTP-only cookie
   - Redirects to app

3. **Password Reset**:
   - User requests reset via email
   - Better-auth generates reset token
   - Sends reset email via Resend
   - User clicks link, sets new password

4. **Session Management**:
   - SvelteKit hooks verify session on each request
   - Protected routes check for valid session
   - Session stored in SQLite via Drizzle adapter

### Resend Email Templates

- Email verification
- Password reset
- Workout reminders
- Meditation session reminders
- Visit status warnings (7 days before yellow/red transition)

### Security Checklist

- [x] Passwords hashed with better-auth (argon2/bcrypt)
- [x] Session tokens secure (better-auth handles)
- [x] HTTP-only, Secure, SameSite=Strict cookies
- [x] CSRF protection via SvelteKit + better-auth
- [x] Email verification required
- [x] Password reset with time-limited tokens
- [ ] Rate limiting on auth endpoints (future enhancement)

---

## 5. Offline-First Sync Strategy

### Decision

Implement client-side sync with last-write-wins:

- Service Worker caches app shell and assets
- IndexedDB for client-side data cache
- Periodic background sync when online
- Conflict resolution: compare `updated_at` timestamps, keep latest
- Optimistic UI updates with rollback on sync failure

### Rationale

- **User experience**: App works offline, syncs when connection restored
- **Simplicity**: Last-write-wins is simple and sufficient for single-user app
- **Performance**: No waiting for server on every action

### Alternatives Considered

- **Operational Transform**: Rejected as too complex for single-user productivity app
- **CRDT**: Rejected as overkill and adds significant complexity
- **Server-only**: Rejected as offline capability is a requirement

### Sync Architecture

1. **Write path**:
   - User action → Update IndexedDB → Optimistic UI update
   - Background: Queue sync → POST to `/api/sync` → Server merges changes
2. **Read path**:
   - Load from IndexedDB (instant)
   - Background fetch from server → Merge with last-write-wins → Update IndexedDB + UI

3. **Conflict resolution**:
   - Compare `updated_at` timestamps
   - Keep record with latest timestamp
   - Log conflicts for manual review (future enhancement)

### Technology Choices

- **Service Worker**: Workbox for caching strategies
- **Client DB**: Dexie.js wrapper around IndexedDB for easier API
- **Sync queue**: Custom implementation with retry logic

---

## 6. Meditation Routine Library Patterns

### Decision

Support both predefined and user-created routines:

- Seed database with ~10-15 predefined routines on first run
- Users can create custom routines with same fields
- `is_predefined` boolean flag to distinguish types
- Users can mark predefined routines as favorites
- Mood tags: Anxious, Low Energy, Focused, Pre-Sleep, General (enum)

### Rationale

- **Flexibility**: Users have immediate value from predefined content, plus customization
- **Discovery**: Predefined routines help users explore meditation types
- **Personalization**: Custom routines support individual preferences

### Alternatives Considered

- **Predefined only**: Rejected as too limiting
- **User-created only**: Rejected as requires users to find resources themselves
- **External API**: Rejected as offline capability is required

### Predefined Routine Examples

1. 5-Minute Breath Awareness (Focused)
2. Body Scan for Sleep (Pre-Sleep)
3. Anxiety Relief Breathing (Anxious)
4. Morning Energy Boost (Low Energy)
5. Mindful Walking (General)

---

## 7. Visit Tracking Status Calculations

### Decision

Calculate status dynamically on query:

- Green: 0 to <6 months since last visit
- Yellow: 6 to <12 months since last visit
- Red: ≥12 months since last visit
- Reminders: Cron job checks daily, sends notification 7 days before status transition

### Rationale

- **Accuracy**: Always current without batch updates
- **Simplicity**: No background jobs to update status
- **Performance**: Calculation is simple date comparison

### Alternatives Considered

- **Stored status field**: Rejected as it requires background updates and can become stale
- **Real-time notifications**: Rejected as 7-day window is sufficient

### Implementation Approach

```typescript
function getVisitStatus(lastVisitDate: Date): 'green' | 'yellow' | 'red' {
	const monthsSince = differenceInMonths(new Date(), lastVisitDate);
	if (monthsSince < 6) return 'green';
	if (monthsSince < 12) return 'yellow';
	return 'red';
}

function getNextStatusTransition(lastVisitDate: Date): Date | null {
	const monthsSince = differenceInMonths(new Date(), lastVisitDate);
	if (monthsSince < 6) return addMonths(lastVisitDate, 6);
	if (monthsSince < 12) return addMonths(lastVisitDate, 12);
	return null; // Already red
}
```

### Notification Strategy

- Cron job runs daily at 9:00 AM user local time
- Check all people for upcoming transitions (7 days out)
- Send in-app notification (future: email/push)
- Store notification log to prevent duplicates

---

## 8. UI Component Architecture

### Decision

Use Shadcn-svelte + custom Svelte 5 components with runes:

- Install Shadcn-svelte primitives: Button, Input, Card, Dialog, etc.
- Create feature-specific components in `src/lib/components/{feature}/`
- Use Tailwind utility classes for layout and spacing
- TanStack Table for todo/journal/workout data tables with filtering/sorting
- **Svelte 5 runes for reactivity** (no stores)

### Rationale

- **Consistency**: Shadcn provides cohesive design system
- **Customization**: Components are copied into project, fully customizable
- **Accessibility**: Built-in ARIA attributes and keyboard navigation
- **Performance**: Svelte compiles to minimal JavaScript
- **Modern reactivity**: Svelte 5 runes ($state, $derived, $effect) provide simpler, more powerful reactivity than stores

### Alternatives Considered

- **Component library (Material UI, etc.)**: Rejected due to bundle size and less customization
- **Pure Tailwind**: Rejected as Shadcn provides better component starting points
- **Skeleton UI**: Considered but Shadcn is more mature and better maintained
- **Svelte stores**: Rejected in favor of Svelte 5 runes for state management

### Svelte 5 State Patterns

```svelte
<script lang="ts">
	// Reactive state with $state rune
	let count = $state(0);

	// Derived values with $derived rune
	let doubled = $derived(count * 2);

	// Side effects with $effect rune
	$effect(() => {
		console.log(`Count is now ${count}`);
	});

	// Props with $props rune
	let { user } = $props<{ user: User }>();
</script>

<button onclick={() => count++}>
	{count} (doubled: {doubled})
</button>
```

### Component Organization

```
src/lib/components/
├── ui/                 # Shadcn primitives (Button, Card, Input, etc.)
├── journal/
│   ├── EntryList.svelte
│   ├── EntryForm.svelte
│   └── EntryCard.svelte
├── todos/
│   ├── TodoKanban.svelte
│   ├── TodoList.svelte
│   ├── TodoGrid.svelte
│   └── TodoForm.svelte
├── fitness/
│   ├── WorkoutForm.svelte
│   ├── MealLog.svelte
│   ├── WeightChart.svelte
│   └── CalorieProgress.svelte
├── meditation/
│   ├── RoutineLibrary.svelte
│   ├── RoutineCard.svelte
│   └── SessionLog.svelte
└── visits/
    ├── PersonList.svelte
    ├── VisitForm.svelte
    └── StatusBadge.svelte
```

---

## 9. Chart & Visualization Libraries

### Decision

Use Chart.js with svelte-chartjs wrapper:

- Line charts for weight over time
- Bar charts for workout volume trends
- Progress bars for calorie tracking (native with Tailwind)
- Status badges with color coding (Shadcn Badge component)

### Rationale

- **Lightweight**: Chart.js is smaller than D3 and simpler than Recharts
- **Svelte integration**: svelte-chartjs provides reactive chart updates
- **Accessibility**: Chart.js supports ARIA labels and keyboard navigation
- **Customization**: Extensive theming options

### Alternatives Considered

- **D3.js**: Rejected as too complex for simple charts
- **Recharts**: Rejected as React-specific
- **Native SVG**: Rejected as requires more implementation effort

---

## 10. Deployment & Hosting on fly.io

### Decision

Deploy as single SvelteKit app on fly.io:

- Node.js runtime with SvelteKit adapter-node
- Persistent volume for SQLite database
- Automatic HTTPS via fly.io proxy
- Environment secrets via `fly secrets set`
- Health check endpoint at `/api/health`

### Rationale

- **Simplicity**: Single deployment artifact
- **Cost**: Free tier supports hobby projects
- **Global**: Edge locations for lower latency
- **Volume**: Persistent storage for SQLite

### Alternatives Considered

- **Vercel**: Rejected as serverless doesn't support SQLite persistence
- **DigitalOcean App Platform**: Considered but fly.io has better free tier
- **Self-hosted VPS**: Rejected due to operational overhead

### Deployment Checklist

- [ ] Install `@sveltejs/adapter-node`
- [ ] Create `fly.toml` configuration
- [ ] Set up persistent volume for SQLite
- [ ] Configure environment secrets
- [ ] Set up GitHub Actions for CI/CD (optional)
- [ ] Configure health check endpoint
- [ ] Enable automatic deployments

---

## 11. Testing Strategy

### Decision

Three-tier testing approach:

1. **Unit tests** (Vitest): Validation schemas, utilities, pure functions
2. **Integration tests** (Vitest): Database operations, form actions, sync logic
3. **E2E tests** (Playwright - optional): Critical user flows (auth, create journal entry)

### Rationale

- **Vitest**: Fast, built for Vite/SvelteKit, great DX
- **Playwright**: Best E2E tool for cross-browser testing
- **Focused**: Test critical paths without over-testing

### Alternatives Considered

- **Jest**: Rejected as Vitest is faster and better integrated with Vite
- **Cypress**: Rejected as Playwright is more modern and faster
- **No E2E**: Considered but auth + core flows warrant automated E2E coverage

### Test Coverage Goals

- Unit: 80%+ coverage of schemas, utilities
- Integration: 100% coverage of form actions, database operations
- E2E: Smoke tests for P1-P3 user stories (auth, journal, todos)

---

## 12. Code Quality & Linting

### Decision

Use ESLint + Prettier with TypeScript and Lefthook + lint-staged:

- ESLint with `@typescript-eslint` and `eslint-plugin-svelte`
- Prettier for code formatting
- Lefthook for git hooks (faster, language-agnostic alternative to Husky)
- lint-staged to run linters on staged files only
- VSCode settings for auto-format on save

### Rationale

- **Consistency**: Enforced code style across team (future)
- **Quality**: Catch common bugs early
- **DX**: Auto-formatting reduces manual work
- **Performance**: Lefthook is faster than Husky (written in Go)
- **Simplicity**: Lefthook has simpler configuration than Husky

### Alternatives Considered

- **Husky**: Rejected in favor of Lefthook's better performance and simpler config
- **Biome**: Considered but ESLint ecosystem is more mature
- **Manual formatting**: Rejected as error-prone

### Lefthook Configuration

```yaml
# lefthook.yml
pre-commit:
  parallel: true
  commands:
    lint:
      glob: '*.{js,ts,svelte}'
      run: npx lint-staged
```

### lint-staged Configuration

```json
{
	"*.{js,ts,svelte}": ["eslint --fix", "prettier --write"],
	"*.{json,md}": ["prettier --write"]
}
```

---

## 13. Email Notifications with Resend

### Decision

Use Resend for all email notifications:

- Email verification (via better-auth)
- Password reset (via better-auth)
- Workout reminders (custom)
- Meditation session reminders (custom)
- Visit status warnings (custom - 7 days before yellow/red transition)

### Rationale

- **Developer Experience**: Clean, simple API with excellent TypeScript support
- **Deliverability**: High inbox placement rates
- **Templates**: Support for React email templates with `@react-email/components`
- **Testing**: Built-in email preview and testing tools
- **Reliability**: Modern infrastructure with good uptime
- **Cost**: Generous free tier (3,000 emails/month)

### Alternatives Considered

- **SendGrid**: Rejected due to complex API and configuration
- **Mailgun**: Rejected due to steeper learning curve
- **AWS SES**: Rejected due to additional AWS complexity
- **Nodemailer + SMTP**: Rejected as Resend provides better DX and deliverability

### Email Template Structure

```typescript
// src/lib/server/email/templates/
├── verification-email.tsx      # Better-auth email verification
├── reset-password-email.tsx    # Better-auth password reset
├── workout-reminder.tsx        # Scheduled workout reminder
├── meditation-reminder.tsx     # Scheduled meditation reminder
└── visit-warning.tsx           # Visit status change warning
```

### Resend Integration Example

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWorkoutReminder(to: string, workoutType: string, scheduledTime: string) {
	await resend.emails.send({
		from: 'Synapse <notifications@synapse.app>',
		to,
		subject: `Workout Reminder: ${workoutType}`,
		react: WorkoutReminderEmail({ workoutType, scheduledTime })
	});
}
```

### Email Workflows

1. **Email Verification**: Triggered on registration (better-auth)
2. **Password Reset**: Triggered on forgot password (better-auth)
3. **Workout Reminders**: Cron job checks scheduled reminders, sends email
4. **Meditation Reminders**: Cron job checks scheduled sessions, sends email
5. **Visit Warnings**: Daily cron checks people status, sends 7-day warnings

### Notification Storage

Track sent emails to prevent duplicates:

```typescript
export const emailNotifications = sqliteTable('email_notifications', {
	id: text('id').primaryKey(), // UUID v4
	user_id: text('user_id')
		.notNull()
		.references(() => users.id),
	notification_type: text('notification_type').notNull(), // 'workout_reminder' | 'meditation_reminder' | 'visit_warning'
	entity_id: text('entity_id'), // ID of related entity (workout_reminder_id, meditation_schedule_id, person_id)
	sent_at: text('sent_at').notNull(),
	created_at: text('created_at').notNull().default("datetime('now')")
});
```

---

## Summary of Key Decisions

| Area           | Decision                                  | Rationale                                                               |
| -------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| Framework      | SvelteKit (full-stack) + Svelte 5 (runes) | Unified architecture, modern reactivity, type safety, built-in features |
| Database       | SQLite + Drizzle ORM + better-sqlite3     | Simplicity, performance, type safety, UUIDs for offline support         |
| Authentication | Better-auth + Drizzle adapter             | Batteries-included auth, email verification, password reset             |
| Email          | Resend                                    | Clean API, excellent DX, high deliverability                            |
| Forms          | Superforms + Zod                          | Type-safe validation, excellent DX                                      |
| Sync           | Last-write-wins + IndexedDB               | Simple conflict resolution, offline-first UX                            |
| UI             | Shadcn-svelte + Tailwind                  | Consistent design, customizable, accessible                             |
| State          | Svelte 5 runes                            | Modern reactivity, no stores needed                                     |
| Charts         | Chart.js                                  | Lightweight, good Svelte integration                                    |
| Testing        | Vitest + Playwright                       | Fast, modern, excellent DX                                              |
| Hosting        | fly.io                                    | Simplicity, persistent storage, free tier                               |
| Git Hooks      | Lefthook + lint-staged                    | Fast, simple, language-agnostic                                         |
| Linting        | ESLint + Prettier                         | Code quality, consistency                                               |
| Node Version   | 22.21.1                                   | Latest LTS with modern features                                         |
| IDs            | UUIDs (v4)                                | Prevents collisions in offline/distributed scenarios                    |

---

**Next Steps**: Proceed to Phase 1 (Data Model & Contracts)
