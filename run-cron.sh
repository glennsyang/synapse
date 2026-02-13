#!/bin/bash
set -e

echo "Starting the twice-daily notifications..."

node /app/scripts/email-notifications.js

echo "Notifications complete!"