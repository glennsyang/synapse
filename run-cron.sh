#!/bin/bash
set -e

# Log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "🚀 Starting email notifications cron job..."

# Run the script and capture exit code
if node /app/build/scripts/email-notifications.js; then
  log "✅ Notifications completed successfully"
  exit 0
else
  EXIT_CODE=$?
  log "❌ Notifications failed with exit code: $EXIT_CODE"
  exit $EXIT_CODE
fi