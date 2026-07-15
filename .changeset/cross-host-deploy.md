---
"create-betternest-app": minor
---

Add cross-host deployment support for Railway, Fly.io, and Render.

**New files (generated projects):**
- `apps/api/Dockerfile`: Turborepo multi-stage build with `turbo prune`,
  `pnpm install`, `turbo run build`, and `prisma generate`. Non-root runner
  (uid 1001). Exposes port 4000.
- `apps/api/docker-entrypoint.sh`: Runs `prisma migrate deploy` then starts
  the compiled API server.
- `.dockerignore`: Excludes `node_modules`, `.git`, `dist`, `.next`, `.turbo`.
- `apps/api/src/health/health.controller.ts`: `GET /api/health` (200 ok,
  no DB) for platform health probes. `GET /api/health/db` pings the DB
  via `ping()` for manual diagnostics.
- `apps/api/src/health/health.module.ts`: Registers the health controller.
- `vercel.json`: Turborepo build command (`turbo run build --filter=web`),
  `turbo-ignore` for ignored build step.
- `railway.json`: Dockerfile builder + health check path.
- `fly.toml`: App placeholder, Dockerfile build, HTTP service on port 4000,
  health check on `/api/health`.
- `render.yaml`: Blueprint with `web` Docker service + managed `pserv`
  Postgres 16, envVars with `sync: false` for secrets.

**Modified files:**
- `apps/api/src/app.module.ts`: Imports `HealthModule`.
- `packages/auth/src/index.ts.hbs`: `trustedOrigins` now includes
  `VERCEL_URL` preview deployments (dynamic via `...` spread).
- All 6 `packages/db/src/index.ts` templates: Export `ping()` function
  (`prisma.$queryRawUnsafe` for Prisma, `db.execute(sql`SELECT 1`)` for
  Drizzle PostgreSQL/MySQL, `db.get(sql`SELECT 1`)` for Drizzle SQLite).
