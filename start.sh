#!/bin/sh
set -e

# Run database migrations
echo "Running database migrations..."
npx drizzle-kit migrate

# Start the server
echo "Starting server..."
exec node ./build/index.js