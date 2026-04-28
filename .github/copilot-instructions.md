# Synapse Copilot Instructions

Last updated: 2026-03-12

## Active Technologies

- TypeScript + SvelteKit 2 + Svelte 5 (runes mode)
- Drizzle ORM + SQLite (`better-sqlite3`)
- Better Auth (`better-auth`) with Drizzle adapter
- Superforms + Zod (`zod4` adapter)
- Tailwind CSS v4 + shadcn-svelte UI components
- LayerChart + D3 for charts

## Project Structure

```text
src/
	routes/                 # SvelteKit pages and API routes
		(app)/                # Authenticated app routes
		(auth)/               # Sign-in/register/reset flows
		(splash)/             # Landing route group
		api/                  # API endpoints (auth/healthz/cron)
	lib/
		components/
			ui/                 # shadcn-svelte primitives
			app/                # App-shell/business components
			shared/             # Reusable shared components
		server/
			db/                 # Drizzle schema, migrations, DB setup
			actions/            # Server-side action helpers (auth-guard)
			email/              # Email templates + notification jobs
		schemas/              # Zod schemas for server validation
```

## Commands

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run check`
- `npm run lint`
- `npm run lint:fix`
- `npm run test`
- `npm run test:unit`
- `npm run db:generate`
- `npm run db:migrate`

## Code Style

- Use semicolons and single quotes.
- Never use `any`; prefer strict typing or `unknown`.
- Use `type` imports where applicable.
- Use `snake_case` for DB columns and `camelCase` for TypeScript.
- Use logger utility in `src/lib/utils/logger.ts`; avoid direct `console.log()` in app code.

## Recent Changes

- Updated to Better Auth session flow through `hooks.server.ts` + `svelteKitHandler(...)`.
- Standardized action auth with `requireAuth(...)` in `src/lib/server/actions/auth-guard.ts`.
- Added operational endpoints: `/api/healthz` and `/api/cron/email-notifications`.
- Expanded runtime env requirements for email notifications and cron security.

<!-- MANUAL ADDITIONS START -->

## Svelte/SvelteKit Reactive Patterns

### ❌ AVOID: EventListener and onMount Anti-Patterns

**NEVER** use global `window.addEventListener()` / DOM listeners for form revalidation flows.

**Minimize `onMount()`** usage unless truly needed for browser-only integrations.

### ✅ CORRECT: SvelteKit Form + Runes Patterns

1. Use `use:enhance` on forms.
2. Use `$state`, `$derived`, `$effect` for reactivity.
3. Use element-scoped event handlers (e.g. `onclick={...}`).

## Critical Architecture Patterns

### Authentication Flow

- Sessions are resolved via `auth.api.getSession(...)` and request handling is routed through `svelteKitHandler(...)` in `hooks.server.ts`.
- `hooks.server.ts` populates `event.locals.session`, `event.locals.user`, and `event.locals.requestId`.
- `(app)/+layout.server.ts` redirects unauthenticated users to `/sign-in`.
- Auth API passthrough is in `src/routes/api/auth/[...all]/+server.ts`.

### Database Patterns

- Use `userId`/`user_id` foreign keys to `user.id` for record ownership.
- Timestamps vary by table: `createdAt`/`updatedAt` and `created_at`/`updated_at`.
- `withAuditFieldsForCreate(...)` and `withAuditFieldsForUpdate(...)` exist for explicit audit metadata usage.
- Source of truth schema: `src/lib/server/db/schema.ts`.
- Prefer Drizzle relational query API (`db.query.<table>.findMany(...)`).

### Form Actions (SvelteKit Pattern)

- Use `export const actions = { ... }` in `+page.server.ts`.
- Prefer `requireAuth(...)` wrapper from `src/lib/server/actions/auth-guard.ts`; otherwise explicitly guard `locals.user`.
- Use Superforms + `zod4(...)` for validation in server actions.
- Keep validation in `src/lib/schemas/*` and always validate server-side.

### API/Operations Patterns

- Health endpoint: `src/routes/api/healthz/+server.ts`.
- Cron endpoint: `src/routes/api/cron/email-notifications/+server.ts`.
- Cron route requires `Authorization: Bearer ${CRON_SECRET}`.
- `hooks.server.ts` sets request/security headers and request ID tracing.

### Component Structure

- Always check `src/lib/components/ui/` before creating new primitives.
- Reuse app-level components from `src/lib/components/app` and shared helpers from `src/lib/components/shared`.
- Use `$bindable()` for two-way Svelte 5 bindings.
- Toasts are via `svelte-sonner`.

## Code Conventions

- Use TypeScript for new files with semicolons and single quotes.
- Avoid `any`.
- Use `cn()` utility from `$lib/utils.ts` for class composition.
- Keep database types in `src/lib/server/db/types.ts` and app/domain types in `src/lib/types.ts`.

**For reactivity:** Use Svelte 5 runes exclusively:

- `$state()` for reactive state
- `$derived()` for computed values
- `$effect()` for side effects (replaces most onMount use cases)
- Do not use Svelte options-style reactive statements (`$:`)

## Environment & Config

- Required env vars: `DATABASE_URL`, `NODE_ENV`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_BASE_URL`, `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`, `RESEND_NEW_USER_ADDRESS`
- Runtime/ops env var: `CRON_SECRET` (for `/api/cron/email-notifications`)
- Validated in `src/env.ts` (production fail-fast + build/dev fallbacks)
- Node.js version: **22.21.1** (required for better-sqlite3 compatibility)
- Application timezone is fixed to Pacific time: `America/Los_Angeles`
- All app-level date boundaries, `getTodayString()`-style helpers, week calculations, reminder cutoffs, and editability rules must use Pacific time instead of server local time or UTC

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

<!-- MANUAL ADDITIONS END -->
