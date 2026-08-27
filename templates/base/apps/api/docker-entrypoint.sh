#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
pnpm db:migrate:deploy

if [ "${SEED_ADMIN_ON_STARTUP:-false}" = "true" ]; then
  echo "[entrypoint] SEED_ADMIN_ON_STARTUP=true; seeding the admin user"
  pnpm db:seed
fi

echo "[entrypoint] Starting API server..."
exec node apps/api/dist/main.js
