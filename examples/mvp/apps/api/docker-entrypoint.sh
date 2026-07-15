#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
pnpm --filter @repo/db exec prisma migrate deploy

echo "[entrypoint] Starting API server..."
exec node apps/api/dist/main.js
