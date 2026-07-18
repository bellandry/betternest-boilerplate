---
"create-betternest-app": minor
---

Dependency refresh + Tailwind v4 + ESM compat + cross-host deploy + single .env + bug fixes.

**Dependency bumps:**
next 16.2.10, react 19.2.7, NestJS 11.1.28, prisma 7.8.0, tailwindcss 4.3.2,
lucide-react 1.24.0, zod 4.4.3, typescript 5.9.3, eslint 10.7.0,
turbo 2.10.5, prettier 3.9.5, dotenv 17.4.2, express 5.2.1,
tailwind-merge 3.6.0, better-sqlite3 12.0.0.

**Tailwind v4:** CSS-first config via @theme, @tailwindcss/postcss plugin,
CSS split in layout.tsx (two imports: tailwind + UI theme).

**Single .env:** All env vars at project root. main.ts and prisma.config.ts
resolve file: paths to absolute, fixing SQLite dual-DB-file bug.

**Cross-host deploy:** Dockerfile (multi-stage turbo prune), health checks
(/api/health, /api/health/db), platform configs (Vercel, Railway, Fly.io,
Render), DEPLOYMENT.md.

**Bug fixes:**
- PrismaMySQL adapter: direct URL (not connectionString option)
- DrizzleMySQL schema: mysqlEnum inline, mode:default
- DrizzleSQLite schema: integer timestamp columns
- SQLite path resolution: 3 levels from dist/ (not 2)
- VERCEL_URL in trustedOrigins for preview deployments
- ping() export on all 6 db combos
