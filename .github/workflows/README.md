# GitHub Actions Configuration

This directory contains GitHub Actions workflows for automated CI/CD.

## Workflows

### PR Checks (`pr-check.yml`)

Runs on every pull request.

**Checks performed:**

1. **Security audit** - Runs `npm audit --production --audit-level=high`
2. **Formatting** - Runs `npm run fmt` and fails if files are changed
3. **Lint** - Runs `npm run lint:github`
4. **Type checks** - Runs `npm run check`
5. **Tests** - Runs `npm run test:ci`
6. **Coverage report** - Publishes Vitest coverage summary on PRs

### Fly Deploy (`fly-deploy.yml`)

Runs on pushes to `main`.

**Pipeline:**

1. Install dependencies
2. Run security audit, lint, type checks, and tests
3. Deploy to Fly.io only if all checks pass

### Scheduled Notifications (`cron.yml`)

Runs every 10 minutes and can be triggered manually.

**Job:**

1. Calls the app's scheduled notifications endpoint with cron auth

### Database Backup (`backup-database.yml`)

Manual workflow (`workflow_dispatch`) for operational backups.

**Job:**

1. Dumps the production SQLite database from Fly.io
2. Compresses and uploads backup as a workflow artifact (30-day retention)
3. Opens an issue on failure and auto-closes existing backup-failure issues on success

### Semgrep Security Scan (`semgrep.yml`)

Runs on pull requests, pushes to `main`, and manual trigger.

**Job:**

1. Runs Semgrep SAST rulesets
2. Uploads SARIF results to GitHub Security

## Required Secrets

Configure these secrets in your GitHub repository settings:

- `FLY_API_TOKEN` - Fly.io API token used by deploy and database backup workflows
- `APP_URL` - Base app URL used by the scheduled notifications workflow (for cron endpoint calls)
- `CRON_SECRET` - Bearer token used to authenticate scheduled notifications calls

## Setup

1. Go to your repository settings
2. Navigate to **Security** > **Secrets and variables** > **Actions**
3. Add the required secrets

## Manual Runs

You can manually trigger supported workflows from the Actions tab:

- **Database Backup** via `backup-database.yml`
- **Scheduled Notifications** via `cron.yml`
- **Semgrep Security Scan** via `semgrep.yml`

## Disabling Workflows

To disable a workflow, add a `if: false` condition to the workflow file or delete it.
