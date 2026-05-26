# Project Overview

Synapse is a modern second-brain application providing journaling, todo management, fitness/nutrition tracking, meditation routines, and visit tracking. Built with SvelteKit and SQLite, the app features secure authentication, and a sleek responsive UI optimized for both desktop and mobile use.

# Folder Structure

- `/src/routes`: SvelteKit frontend routes and page handlers.
- `/src/lib`: App logic—backend utilities, server/database logic, authentication, type definitions, and reusable UI components.
  - `/src/lib/components/ui/`: Extensive library of primitive and advanced Svelte UI components (Button, Dialog, Card, Table, Popover, Dropdown, etc.) for consistent, efficient interface building.
  - `/src/lib/server/db/`: Database connection, migrations, schema, and utilities.
- `/static`: Static assets (e.g., favicon.svg, images).
- `/docs` (if present): Supplementary documentation, API specs, and user guides.

### Database

- The SQLite database file (`./data/synapse.db`) in the repo is for local development and testing only.
  - Database schema/migrations can be found in `/src/lib/server/db/migrations/`.

## Libraries and Frameworks

- SvelteKit (**MUST use Svelte 5 in runes mode** - no options API)
- Tailwind CSS
- Drizzle ORM for SQLite
- Zod for validation
- Superforms and shadcn-svelte UI (see `/src/lib/components/ui/`)

## Development Basics

- See the `README.md` file for full installation, running, and build instructions—including how to migrate the database and start the dev server.
- Common scripts (run with `npm run <script>`):
  - `dev` – Start the dev server
  - `build` – Build the app
  - `preview` – Preview the production build locally
  - `check`, `check:watch` – Type/lint/check project
  - `fmt` – Format code with oxfmt
  - `lint` – Run oxlint checks
  - `lint:fix` – Run oxlint with auto-fixes
  - `test`, `test:unit` – Vitest unit tests
  - `db:migrate`, `db:generate` – Drizzle database actions

## Environment & Config

- Required env vars: `DATABASE_URL`, `NODE_ENV`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_BASE_URL`, `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`, `RESEND_NEW_USER_ADDRESS`
- Runtime/ops env var: `CRON_SECRET` (required for `/api/cron/email-notifications`)
- Validated in `src/env.ts` using Zod schema
- Node.js version: **22.22.2** (required for better-sqlite3 compatibility)
- Application timezone is fixed to Pacific time: `America/Los_Angeles`
- All app-level "today", day boundaries, week calculations, and editability cutoffs must use Pacific time, never server local time or UTC

## Coding Standards

- Use semicolons at the end of each statement.
- Use single quotes for strings.
- Avoid using `any` type entirely - use proper typing, generics, or `unknown` instead.
- **NEVER use `console.log()`** - always use the logger utility from `src/lib/utils/logger.ts` instead.
- Uses **oxlint** for linting and **oxfmt** for formatting (Oxc toolchain). Run `npm run lint` and `npm run fmt`.
- Uses Tailwind CSS for consistent styling.

## Svelte/SvelteKit Reactive Patterns

### ❌ AVOID: EventListener and onMount Anti-Patterns

**NEVER** use `window.addEventListener()` or DOM event listeners for form submissions or data revalidation:

```svelte
// ❌ BAD - Don't do this!
onMount(() => {
  const handleFormSubmit = () => {
    setTimeout(() => invalidateAll(), 500);
  };
  window.addEventListener('submit', handleFormSubmit);
  return () => window.removeEventListener('submit', handleFormSubmit);
});
```

**Minimize use of `onMount()`** - only use when absolutely necessary (e.g., initializing third-party libraries, browser-only APIs). Most reactive behavior should use Svelte's built-in reactivity.

### ✅ CORRECT: SvelteKit Form Patterns

**Use SvelteKit's built-in form handling:**

1. **Form actions with `use:enhance`** (automatically revalidates):

```svelte
<form method="POST" action="?/create" use:enhance>
	<!-- SvelteKit handles submission and revalidation -->
</form>
```

2. **Reactive state with $effect** (Svelte 5):

```svelte
let data = $state(initialData);

$effect(() => {
  // Runs when dependencies change
  void data;
});
```

3. **Event handlers on specific elements**:

```svelte
<button onclick={handleClick}>Submit</button>
```

## Critical Architecture Patterns

### Authentication Flow

- Sessions are managed by Better Auth (`auth.api.getSession`) and requests are handled through `svelteKitHandler(...)` in `hooks.server.ts`
- `hooks.server.ts` populates `event.locals.session` and `event.locals.user` on every request
- Route protection in `(app)/+layout.server.ts` redirects unauthenticated users to `/sign-in`
- API auth passthrough is handled in `/src/routes/api/auth/[...all]/+server.ts`

### Database Patterns

- Primary ownership pattern is `userId`/`user_id` foreign keys to `user.id`; timestamp fields are `createdAt`/`updatedAt` or `created_at`/`updated_at` depending on table
- Helper utilities `withAuditFieldsForCreate(...)` and `withAuditFieldsForUpdate(...)` exist in `$lib/server/db/utils.ts` for explicit audit metadata patterns
- Schema is defined in `/src/lib/server/db/schema.ts`
- Use Drizzle's relational query API: `db.query.journalEntries.findMany({ with: { user: true } })`
- Migrations are generated to `/src/lib/server/db/migrations/` via `drizzle.config.ts`

### Form Actions (SvelteKit Pattern)

- Use `export const actions = { create, update, delete }` in `+page.server.ts`
- Prefer `requireAuth(...)` from `$lib/server/actions/auth-guard` for authenticated action handlers; otherwise check `locals.user` before processing
- For all forms: use superforms + zod validation (see `(auth)/sign-in/+page.server.ts`)
- Always perform server-side validation with Zod schemas in `/src/lib/schemas/`. Avoid client-side validation.

### API/Operations Patterns

- Health checks are served from `/src/routes/api/healthz/+server.ts` and validated against DB responsiveness
- Scheduled email notifications run via `/src/routes/api/cron/email-notifications/+server.ts` and require `Authorization: Bearer ${CRON_SECRET}`
- Date-sensitive server logic must use Pacific time for app behavior consistency across local development and Fly.io production

### Component Structure

- **ALWAYS check `/src/lib/components/ui/` first** for existing shadcn-svelte components before creating new UI components. Available components include: Button, Dialog, Card, Table, Popover, Dropdown, Select, Input, Label, Checkbox, Tabs, Sheet, Sidebar, Avatar, Badge, Calendar, Chart, Command, Data Table, Navigation Menu, Progress, Separator, Skeleton, Sonner (Toast), Textarea, Tooltip, and more.
- UI primitives in `/src/lib/components/ui/` (shadcn-svelte based) - reuse these extensively.
- Business components in `/src/lib/components/app`: Header, Sidebar, etc.
- Prefer buttons with icons over text-only buttons when the action remains clear and the UI benefits from the more compact treatment.
- Every icon-only button must include a tooltip; keep an accessible label on the control as well.
- Use `$bindable()` for two-way binding (Svelte 5 runes): `open = $bindable()`
- Toast notifications via `svelte-sonner`: `import { toast } from 'svelte-sonner'`

## Code Conventions

- **TypeScript**: Use for all new files with semicolons and single quotes
- **No 'any' types**: Avoid using `any` type entirely - use proper typing, generics, or `unknown` instead
- **Naming**: `snake_case` for DB columns, `camelCase` for TypeScript
- **Styling**: Tailwind classes via `cn()` utility from `$lib/utils.ts`
- **Type imports**: Use `type` keyword: `import type { PageServerLoad } from './$types'`
- **Database types**: Defined in `$lib/server/db/types.ts`

**For reactivity:** **MUST use Svelte 5 runes exclusively:**

- `$state()` for reactive state
- `$derived()` for computed values
- `$effect()` for side effects (replaces most onMount use cases)
- **DO NOT use** options API (`let`, `$:` reactive statements) - runes mode only

## Node.js Version

**CRITICAL**: This project requires **Node.js version 22.22.2** for development and production to ensure compatibility with better-sqlite3 and other native dependencies.

- **Before running ANY commands**, verify Node version: `node -v` should show `v22.22.2`
- **If you encounter terminal errors**, first check and switch Node version: `nvm use 22.22.2`
- Use a version manager (nvm or asdf) to manage Node versions
- This version is **non-negotiable** - other versions may cause build failures or runtime errors

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Local Dev Account when using Integrated Browser

Credentials to login to the app:

Email: gsheppard.yang@gmail.com
Password: ZAH.zkf*bfv_dvt1zmt

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
