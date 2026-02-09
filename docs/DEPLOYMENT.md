# Fly.io Deployment Guide for Synapse

## Prerequisites

1. Install the Fly CLI:

   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Authenticate with Fly.io:
   ```bash
   fly auth login
   ```

## Initial Deploy

### 1. Create the Fly.io app

```bash
fly apps create synapse-second-brain
```

### 2. Create persistent volume for SQLite database

```bash
fly volumes create synapse_data --region sjc --size 1
```

### 3. Set secrets

```bash
# Generate a random secret for Better Auth
fly secrets set BETTER_AUTH_SECRET=$(openssl rand -base64 32)

# Set your Resend API key
fly secrets set RESEND_API_KEY=re_your_api_key_here

# Set the base URL for Better Auth (replace with your actual domain)
fly secrets set BETTER_AUTH_BASE_URL=https://synapse-second-brain.fly.dev

# Set database URL (points to mounted volume)
fly secrets set DATABASE_URL=/data/synapse.db

# Set Node environment
fly secrets set NODE_ENV=production
```

### 4. Deploy the application

```bash
fly deploy
```

### 5. View deployment status

```bash
fly status
```

### 6. Open the deployed app

```bash
fly open
```

## Post-Deployment

### View logs

```bash
fly logs
```

### SSH into the machine

```bash
fly ssh console
```

### Run database migrations (if needed)

```bash
fly ssh console -C "cd /app && node build/server/db/migrate.js"
```

### Scale the app

```bash
# Scale to 2 machines for high availability
fly scale count 2

# Scale machine resources
fly scale vm shared-cpu-2x --memory 1024
```

### Monitor the app

```bash
# View metrics
fly dashboard

# View health checks
fly checks list
```

## Database Backups

### Manual backup

```bash
# SSH into the machine and copy database
fly ssh console -C "cat /data/synapse.db" > backup.db
```

### Automatic backups

Consider using Fly.io's snapshot feature or setting up automated backups to S3/R2.

## Troubleshooting

### App won't start

```bash
# Check logs for errors
fly logs

# Verify secrets are set
fly secrets list

# Check machine status
fly status
```

### Database errors

```bash
# SSH into machine and check database
fly ssh console
cd /data
ls -lah
```

### Health check failures

```bash
# Test health endpoint locally
curl https://synapse-second-brain.fly.dev/api/healthz
```

## Rolling Back

```bash
# List releases
fly releases

# Rollback to previous version
fly releases rollback <version>
```

## Scaling Down

```bash
# Scale to 0 machines (pause app)
fly scale count 0

# Destroy the app completely
fly apps destroy synapse-second-brain
```

## Environment-Specific Configuration

For staging/production environments, create separate apps:

```bash
# Staging
fly apps create synapse-staging
fly deploy --app synapse-staging

# Production
fly apps create synapse-production
fly deploy --app synapse-production
```

## Custom Domain

```bash
# Add custom domain
fly certs create yourdomain.com

# Follow DNS instructions
fly certs show yourdomain.com
```

## Notes

- The SQLite database is stored in the mounted `/data` volume
- Volumes are persistent and survive deployments
- Multi-region deployments require database replication strategy
- For high traffic, consider scaling horizontally with read replicas
