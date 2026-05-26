# GitHub Actions Configuration

This directory contains GitHub Actions workflows for automated CI/CD.

## Workflows

### CI/CD Pipeline (`ci-cd.yml`)

Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**

1. **Lint** - Runs oxlint checks
2. **Type Check** - Validates TypeScript types
3. **Test** - Runs unit tests with Vitest
4. **Build** - Builds the application
5. **Deploy** - Deploys to Fly.io (only on `main` branch pushes)

### Dependency Review (`dependency-review.yml`)

Runs on pull requests to review dependency changes for security vulnerabilities.

### Security Audit (`security-audit.yml`)

Runs `npm audit` weekly and on pushes/PRs to `main` to check for vulnerable dependencies.

## Required Secrets

Configure these secrets in your GitHub repository settings:

- `FLY_API_TOKEN` - Fly.io API token for deployments (get from `fly auth token`)
- `BETTER_AUTH_SECRET` - Secret for Better Auth (optional for builds)

## Setup

1. Go to your repository settings
2. Navigate to **Security** > **Secrets and variables** > **Actions**
3. Add the required secrets

## Manual Deployment

You can manually trigger deployments from the Actions tab by re-running the deploy job.

## Disabling Workflows

To disable a workflow, add a `if: false` condition to the workflow file or delete it.
