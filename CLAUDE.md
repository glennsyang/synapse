# Synapse — Claude Code Guide

A personal life-management app: fitness (workouts/weight/meals), journal, meditation, tasks, visits, and an admin dashboard, gated behind auth. Not fitness-only despite the name.

---

## Tech Stack

| Concern     | Choice                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| Framework   | SvelteKit + TypeScript (strict)                                                                           |
| Database    | SQLite via Drizzle ORM (better-sqlite3)                                                                   |
| Auth        | better-auth v1 (email + password), Brevo for auth emails                                                  |
| UI          | bits-ui (shadcn-svelte style) + Tailwind CSS v4                                                           |
| Charts      | layerchart + d3-scale/d3-shape                                                                            |
| Forms       | sveltekit-superforms v2 + Zod v4                                                                          |
| Testing     | Vitest (unit, `src/**/*.test.ts` colocated) + Playwright (e2e)                                            |
| Lint/format | oxlint + oxfmt, plus custom static checks (below)                                                         |
| Deployment  | fly.io, `adapter-node` (an unused `adapter-cloudflare` devDependency is present — don't assume it's live) |

---

## Non-Negotiable Conventions

### TypeScript / Svelte

- Strict TypeScript, no `any` — enforced repo-wide by oxlint's `typescript/no-explicit-any` rule.
- Svelte 5 runes only (`$state`, `$derived`, `$effect`, `$props`, `$bindable`).
- Env vars: import from **`$app/env/private`** (SvelteKit's typed env, via `experimental.explicitEnvironmentVariables` in `svelte.config.js`) — not `$env/static/private`.

### Database — camelCase columns

Unlike some of the other sibling repos, **DB column names here are camelCase**, not snake_case (e.g. `emailVerified`, `userId`, `createdAt` in `src/lib/server/db/schema.ts`). Don't port snake_case conventions in from another repo.

### SvelteKit redirects

`npm run check:redirect-throws` statically enforces that `+page.server.ts` / `+layout.server.ts` / `+server.ts` files always `throw redirect(...)` (not call it bare). Always `if (isRedirect(err)) throw err` when catching around auth calls.

### Logging

Never use `console.log`/`console.error`/etc. directly — import `logger` from `$lib/server/logger` (a server-only module; SvelteKit's import guard blocks it from client bundles, so client-side code can't reach it — see `src/lib/utils/journal-context.ts` for the one deliberate exception). In production (`NODE_ENV === 'production'`) it strips `userId`, `id`, `email`, `password`, `token`, `createdBy`, and `updatedBy` from log output and from what's sent to Sentry — `requestId` is the only supported cross-log correlation key in prod. The `LOG_LEVEL` env var sets the minimum level logged (`debug`/`info`/`warn`/`error`); defaults to `debug` in dev, `info` in prod.

### Custom static checks

Beyond oxlint (which now also enforces `no-explicit-any`), this repo runs `scripts/check-redirect-throws.mjs` and `fallow dead-code`. `npm run lint` runs oxlint + `fallow dead-code`; `check-redirect-throws.mjs` runs full-repo via `npm run check:redirect-throws`, and separately at commit time scoped to just the staged SvelteKit server files via `lint-staged.config.ts`.

### Git hooks (lefthook)

- **pre-commit**: `lint-staged` runs on staged files.
- **pre-push**: full `vitest run` — a push will be blocked if tests fail.

---

## Project Structure

```
src/
├── hooks.server.ts
├── lib/
│   ├── components/
│   │   ├── ui/              # bits-ui/shadcn-svelte components, $lib/components/ui/*
│   │   └── fitness/dialogs/ # see "Log-entry dialog pattern" below
│   ├── schemas/              # Zod schemas per domain (fitness.ts, etc.)
│   └── server/
│       ├── db/schema.ts      # Drizzle tables — camelCase columns
│       ├── auth.ts           # betterAuth instance (drizzleAdapter, Brevo emails)
│       ├── auth/             # form-helpers, auth-guard
│       ├── email/            # digests: daily-agenda, tasks-due-today, visit-warning
│       └── notifications/    # admin alert pings (new user, verification sent, etc.)
└── routes/
    ├── (auth)/
    ├── (splash)/
    ├── (app)/
    │   ├── fitness/ journal/ meditation/ tasks/ visits/ dashboard/ profile/ admin/
    └── api/
```

---

## Log-entry dialog pattern (`src/lib/components/fitness/dialogs/`)

`LogWorkoutDialog`, `LogMealDialog`, `LogWeightDialog`, `CreateReminderDialog`, `SetCalorieTargetDialog`, `SetGoalWeightDialog` all follow one identical skeleton — **match it exactly** when adding a new one. The shared toolkit's `/scaffold-form` command's "dialog-based entry form" flavor targets this exact shape — point it at one of these dialogs as the exemplar rather than hand-rolling a new one from scratch:

```ts
let {
  formData,             // SuperValidated<Infer<typeof someSchema>>
  editEntry = null,     // non-null → editing an existing row
  onClose,
  open = $bindable(false),
  instanceId = 'default'
}: { ... } = $props();

const isEditing = $derived(editEntry !== null);
let internalOpen = $state(false);
const dialogOpen = $derived(open !== undefined ? open : internalOpen);

// externally-controlled open when editing
$effect(() => { if (editEntry && open === undefined) internalOpen = true; });

const formId = $derived(editEntry ? `edit-<thing>-${editEntry.id}` : `log-<thing>-${instanceId}`);

const { form, errors, enhance, message, submitting } = superForm(formData, {
  id: formId,
  resetForm: !isEditing,
  onUpdate: ({ form }) => { /* toast.success/error, call onClose */ },
  onError: ({ result }) => { /* toast.error */ }
});

// populate fields from editEntry via a second $effect
```

Server actions are named `?/log<Thing>` and `?/update<Thing>` on the same route.

---

## Authentication

- better-auth v1, email+password, `minPasswordLength: 12`, `revokeSessionsOnPasswordReset: true`.
- Drizzle adapter (`drizzleAdapter`) reusing the app's own SQLite DB.
- Auth emails (verification, password reset, new-user notice) sent via **Brevo** (`src/lib/server/email/`), not built-in better-auth email.
- Internal ops alerts (`src/lib/server/notifications/`) ping on auth events like verification-sent — separate from the user-facing emails.

### Env vars required

```
DATABASE_URL=data/synapse.db
BETTER_AUTH_SECRET=...
BETTER_AUTH_BASE_URL=http://localhost   # or the fly.io URL in prod
BREVO_API_KEY=...
BREVO_FROM_ADDRESS=...
BREVO_NEW_USER_ADDRESS=...
SENTRY_AUTH_TOKEN=...
```

Sentry (`@sentry/sveltekit`) is now actually wired up — `vite.config.ts` (`sentrySvelteKit({ org: 'sheppakai', project: 'synapse' })`), `src/hooks.client.ts`, and `src/hooks.server.ts` all reference it, and `$lib/server/logger`'s `warn()`/`error()` forward to it in production. The `dsn` in both files points at the real `synapse` project under the `sheppakai` org.

---

## Common Commands

```bash
npm run dev
npm run check          # svelte-check
npm run lint           # oxlint + all custom static checks
npm run fmt:check       # oxfmt --check
npm run test            # vitest run
npm run test:e2e        # playwright
npm run db:generate     # drizzle-kit generate
npm run db:migrate      # drizzle-kit migrate
```

---

## Shared toolkit

This repo uses the shared `sveltekit-toolkit` plugin (see `.claude/settings.json`) for skills (svelte5-best-practices, better-auth-best-practices, shadcn-svelte-components, tailwind-patterns, frontend-design, web-design-reviewer, svelte-code-writer), two review agents, a `/propagate` command for replicating a shared-dependency fix across the sibling repos (`meal-planner`, `sheppakai-budget`), a `/propagate-shared` command for syncing a change to a byte-identical shared source file (currently just `src/lib/server/logger.ts`) out to those same siblings, and a `/scaffold-form` command for scaffolding a new form/CRUD/dialog feature — see the "Log-entry dialog pattern" above for this repo's dialog flavor.

The `code-structure-reviewer` and `security-reviewer` agents (from the shared plugin) are available on demand — invoke them when you want a structural or security pass, not automatically on every PR. They aren't wired into any automated hook.
