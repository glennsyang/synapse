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

- The SQLite database file (`synapse.db`) in the repo is for local development and testing only.
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
  - `check`, `check:watch` – Type/lint/check project
  - `lint` – Run Prettier and ESLint
  - `test`, `test:unit` – Vitest unit tests
  - `db:migrate`, `db:generate`, `db:studio` – Drizzle database actions

## Environment & Config

- Required env vars: `DATABASE_URL`, `NODE_ENV`, `BETTER_AUTH_SECRET`
- Validated in `src/env.ts` using Zod schema
- Node.js version: **22.21.1** (required for better-sqlite3 compatibility)

## Coding Standards

- Use semicolons at the end of each statement.
- Use single quotes for strings.
- Avoid using `any` type entirely - use proper typing, generics, or `unknown` instead.
- **NEVER use `console.log()`** - always use the logger utility from `src/lib/utils/logger.ts` instead.
- Follows ESLint (`eslint.config.js`) and Prettier conventions.
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
  console.log('Data updated:', data);
});
```

4. **Event handlers on specific elements**:

```svelte
<button onclick={handleClick}>Submit</button>
```

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

- **ALWAYS check `/src/lib/components/ui/` first** for existing shadcn-svelte components before creating new UI components. Available components include: Button, Dialog, Card, Table, Popover, Dropdown, Select, Input, Label, Checkbox, Tabs, Sheet, Sidebar, Avatar, Badge, Calendar, Chart, Command, Data Table, Navigation Menu, Progress, Separator, Skeleton, Sonner (Toast), Textarea, Tooltip, and more.
- UI primitives in `/src/lib/components/ui/` (shadcn-svelte based) - reuse these extensively.
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

**For reactivity:** **MUST use Svelte 5 runes exclusively:**

- `$state()` for reactive state
- `$derived()` for computed values
- `$effect()` for side effects (replaces most onMount use cases)
- **DO NOT use** options API (`let`, `$:` reactive statements) - runes mode only

## Node.js Version

**CRITICAL**: This project requires **Node.js version 22.21.1** for development and production to ensure compatibility with better-sqlite3 and other native dependencies.

- **Before running ANY commands**, verify Node version: `node -v` should show `v22.21.1`
- **If you encounter terminal errors**, first check and switch Node version: `nvm use 22.21.1`
- Use a version manager (nvm or asdf) to manage Node versions
- This version is **non-negotiable** - other versions may cause build failures or runtime errors

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
