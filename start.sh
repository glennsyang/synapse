#!/bin/sh
set -e

echo "🚀 Starting Synapse..."

# Run database migrations
echo "📦 Running database migrations..."
npx drizzle-kit migrate

# Start supercronic in the background
echo "⏰ Starting cron jobs..."
supercronic /app/crontab &

# Start the SvelteKit app in the foreground
echo "🚀 Starting SvelteKit server..."
exec node build/index.js