# Environment Variables

Canonical reference for every environment variable this app or its CI/CD pipeline uses. `src/env.ts` (via SvelteKit's `defineEnvVars`) is the source of truth for app-runtime vars; this doc also covers the CI/infra-only vars that live outside that schema. See `.env.example` for a copy-pasteable local `.env` template.

## App runtime (validated in `src/env.ts`)

| Variable                 | Subsystem               | Where it's set in prod         | Required | Notes                                                                              |
| ------------------------ | ----------------------- | ------------------------------ | -------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`           | Database                | Dockerfile `ENV`               | Yes      | Path to the SQLite file                                                            |
| `BETTER_AUTH_SECRET`     | Auth                    | Fly secret                     | Yes      | Min 32 characters                                                                  |
| `BETTER_AUTH_BASE_URL`   | Auth                    | Fly secret                     | Yes      | Base URL Better Auth issues links against                                          |
| `AUTH_ALERTS_URL`        | Notifications (ntfy.sh) | Fly secret                     | Yes      | Push alert topic for auth events                                                   |
| `REMINDER_ALERTS_URL`    | Notifications (ntfy.sh) | Fly secret                     | Yes      | Push alert topic for reminder events                                               |
| `BREVO_API_KEY`          | Email                   | Fly secret                     | Yes      | Brevo API key for transactional email                                              |
| `BREVO_FROM_ADDRESS`     | Email                   | Fly secret                     | Yes      | Must be a confirmed Brevo sender                                                   |
| `BREVO_NEW_USER_ADDRESS` | Email                   | Fly secret                     | Yes      | Recipient for new-signup notifications                                             |
| `CRON_SECRET`            | Cron auth               | Fly secret                     | Yes      | Bearer token for `/api/cron/*`                                                     |
| `NODE_ENV`               | Runtime                 | Dockerfile `ENV`               | Yes      | `development` \| `production` \| `test`; defaults to `development`                 |
| `SENTRY_DSN`             | Observability (Sentry)  | Dockerfile `ENV`               | Yes      | Not secret — Sentry DSNs are safe to expose publicly                               |
| `LOG_LEVEL`              | Logging                 | Not set in prod (uses default) | No       | `debug` \| `info` \| `warn` \| `error`; defaults to `debug` in dev, `info` in prod |

## CI / infra only (not in `src/env.ts`, not read by the app at runtime)

| Variable                       | Used by                                                                         | Where it's set        | Required | Notes                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------- | --------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `APP_URL`                      | `.github/workflows/cron.yml`                                                    | GitHub Actions secret | Yes      | Deployed URL the cron job curls                                                                                         |
| `FLY_API_TOKEN`                | `.github/workflows/fly-deploy.yml`, `backup-database.yml`                       | GitHub Actions secret | Yes      | Auth for `flyctl`                                                                                                       |
| `BACKUP_ENCRYPTION_PASSPHRASE` | `.github/workflows/backup-database.yml`                                         | GitHub Actions secret | Yes      | Encrypts DB dumps before upload; the workflow fails closed if unset                                                     |
| `SENTRY_AUTH_TOKEN`            | `.github/workflows/fly-deploy.yml` → Dockerfile build secret → `vite.config.ts` | GitHub Actions secret | No       | Enables Sentry source-map upload during the Docker build (see below); deploy succeeds without it, just skips the upload |

### Sentry source-map upload

The Dockerfile strips `.map` files from the shipped image (`adapter-node` hardcodes `sourcemap: true`), so source maps are never served publicly regardless of this setting. When `SENTRY_AUTH_TOKEN` is present, `fly-deploy.yml` passes it to `flyctl deploy --build-secret`, which the Dockerfile mounts via BuildKit (`RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN`) so the Sentry vite plugin can upload maps to Sentry _before_ they're stripped — giving readable (non-minified) stack traces in Sentry without exposing source structure publicly.

To enable it: create a Sentry **Organization Auth Token** (Settings → Auth Tokens, org `sheppakai`) scoped for `project:releases`, then `gh secret set SENTRY_AUTH_TOKEN --repo <owner>/synapse`.

## Verification

- `fly secrets list -a synapse-dev` should list exactly the Fly-secret rows in the table above (`BETTER_AUTH_SECRET`, `BETTER_AUTH_BASE_URL`, `CRON_SECRET`, `AUTH_ALERTS_URL`, `REMINDER_ALERTS_URL`, `BREVO_API_KEY`, `BREVO_FROM_ADDRESS`, `BREVO_NEW_USER_ADDRESS`) — no more, no less. `NODE_ENV`, `DATABASE_URL`, and `SENTRY_DSN` intentionally don't appear there since they're baked into the Dockerfile.
- `cp .env.example .env`, fill in real values, `npm run dev` should boot with no missing-var errors.
