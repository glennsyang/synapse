# synapse Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-02

## Active Technologies

- TypeScript (latest stable) + SvelteKit (full-stack framework), Drizzle ORM (database), Superforms + Zod (form handling/validation), Shadcn-svelte (UI components), Tailwind CSS (styling), TanStack Table (data tables) (001-synapse-second-brain)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript (latest stable): Follow standard conventions

## Recent Changes

- 001-synapse-second-brain: Added TypeScript (latest stable) + SvelteKit (full-stack framework), Drizzle ORM (database), Superforms + Zod (form handling/validation), Shadcn-svelte (UI components), Tailwind CSS (styling), TanStack Table (data tables)

<!-- MANUAL ADDITIONS START -->

## Critical Architecture Patterns

### Authentication Flow

- Session stored in cookies (`event.cookies.get('session')`) with JSON-serialized user data
- `hooks.server.ts` populates `event.locals.user` on every request
- Route protection in `(app)/+layout.server.ts` redirects unauthenticated users to `/(auth)/sign-in`

### Database Patterns

- **Audit fields**: All tables have `createdBy`, `updatedBy`, `createdAt`, `updatedAt`
- Use `withAuditFieldsForCreate(data, user)` and `withAuditFieldsForUpdate(data, user)` from `$lib/server/db/utils.ts`
- Foreign keys reference `user.id` for audit fields
- Schema defined in `/src/lib/server/db/schema`
- Use Drizzle's relational query API: `db.query.journalEntries.findMany({ with: { user: true } })`

### Form Actions (SvelteKit Pattern)

- Use `export const actions = { create, update, delete }` in `+page.server.ts`
- Check `locals.user` before processing: `if (!locals.user) return fail(401, { error: 'Unauthorized' })`
- For all forms: use superforms + zod validation (see `(auth)/sign-in/+page.server.ts`)
- Always perform server-side validation with Zod schemas in `/src/lib/schemas/`. Avoid client-side validation.

### Component Structure

- UI primitives in `/src/lib/components/ui/` (shadcn-svelte based): Button, Dialog, Table, Select, etc.
- Business components in `/src/lib/components/app`: Header, Sidebar, etc.
- Use `$bindable()` for two-way binding (Svelte 5 runes): `open = $bindable()`
- Toast notifications via `svelte-sonner`: `import { toast } from 'svelte-sonner'`

## Code Conventions

- **TypeScript**: Use for all new files with semicolons and single quotes
- **No 'any' types**: Avoid using `any` type entirely - use proper typing, generics, or `unknown` instead
- **Naming**: `snake_case` for DB columns, `camelCase` for TypeScript
- **Styling**: Tailwind classes via `cn()` utility from `$lib/utils.ts`
- **Type imports**: Use `type` keyword: `import type { PageServerLoad } from './$types'`
- **Database types**: Defined in `$lib/server/db/types.ts`

**For reactivity:** Use Svelte 5 runes:

- `$state()` for reactive state
- `$derived()` for computed values
- `$effect()` for side effects (replaces most onMount use cases)

## Environment & Config

- Required env vars: `DATABASE_URL`, `NODE_ENV`, `BETTER_AUTH_SECRET`
- Validated in `src/env.ts` using Zod schema
- Node.js version: **22.21.1** (required for better-sqlite3 compatibility)
<!-- MANUAL ADDITIONS END -->
