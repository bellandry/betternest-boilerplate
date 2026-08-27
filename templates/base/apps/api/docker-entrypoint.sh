#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
pnpm db:migrate:deploy

echo "[entrypoint] Starting API server..."
exec node apps/api/dist/main.js
