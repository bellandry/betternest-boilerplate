# create-betternest-app

## 0.6.6

### Patch Changes

- 79e6502: Fix Tailwind v4: move @source directive before @import 'tailwindcss' so the scanner detects shadcn classes in packages/ui. Add auto port fallback: API catches EADDRINUSE and tries next port, web uses scripts/dev.mjs to find first free port starting from 3000.

## 0.6.5

### Patch Changes

- 3d7e6e3: Fix Tailwind v4 shadcn styles not being applied. Consolidated the full theme (@theme, CSS variables, @layer base) into apps/web/app/globals.css alongside the @import 'tailwindcss' + @source directive. Removed duplicate @repo/ui/globals.css import from layout.tsx that was causing a double @theme resolution conflict in the monorepo setup.

## 0.6.4

### Patch Changes

- accf17c: Add built-in rate limiting on auth endpoints (sign-in, sign-up, forget-password, reset-password). 5 attempts per IP per 15-minute sliding window per endpoint. Configurable via RATE_LIMIT_MAX / RATE_LIMIT_WINDOW env vars with hot reload. Optional Redis storage for multi-instance deploys.

## 0.6.3

### Patch Changes

- d438ac3: Update README with deployment guide: Vercel, Railway, Fly.io, Render, VPS
  (Docker Compose + Ansible). Add database combo table, flags reference,
  and local development instructions.

## 0.6.0

### Minor Changes

- fce2172: Dependency refresh + Tailwind v4 + ESM compat + cross-host deploy + single .env + bug fixes.

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

## 0.5.0

### Minor Changes

- 8db4b43: Upgrade all Prisma templates from v6 to v7.

  **Breaking changes (generated projects):**

  - Generator: `prisma-client-js` → `prisma-client` with explicit `output` and
    `generatedFileExtension = "ts"`
  - Database connection: driver adapters required (`@prisma/adapter-pg`,
    `@prisma/adapter-mariadb`, or `@prisma/adapter-better-sqlite3`)
  - Configuration: `DATABASE_URL` moved from `schema.prisma` to
    `prisma.config.ts` via `env()` helper; `import 'dotenv/config'` required
  - Imports: `@prisma/client` → `../generated/prisma/client`
  - tsconfig: `rootDir` changed to `"."` with `generated/**/*.ts` in `include`
  - `.gitignore`: `packages/db/prisma/generated` → `packages/db/generated`
  - Package paths: `dist/index.js` → `dist/src/index.js`

## 0.4.0

### Minor Changes

- b1f25a6: Add multi-database support. The CLI now asks you to pick a **database engine** (SQLite, PostgreSQL, or MySQL — SQLite is the default, no Docker needed) and then an **ORM** (Prisma or Drizzle). Six combos are available, each with its own schema, adapter dialect, Docker Compose (for server DBs only; SQLite skips it entirely), and driver dependencies.

## 0.3.1

### Patch Changes

- 6c8394f: Harden the email pipeline against silent delivery failures:

  - `sendEmail` now **requires** `EMAIL_FROM` to be explicitly set (no more silent `onboarding@resend.dev` fallback) and warns if the testing address is still used.
  - Both drivers and `sendEmail` now log every attempt to the API console — you see exactly whether `sendEmail` was called, which driver handled it, and (for Resend) the email id in the Resend dashboard.
  - The Resend driver now checks both the `error` and `data` fields from the API response; a missing email id is treated as a failure.
  - Callback‑entry logs in the server config so you know Better Auth invoked the email callback.
  - `.env.example` and README updated to document `EMAIL_FROM` per provider; `onboarding@resend.dev` is no longer a hidden default.

## 0.3.0

### Minor Changes

- 59e930a: Add **Drizzle** as a database choice (`--db=drizzle`). It scaffolds a `@repo/db` package backed by Drizzle ORM + node-postgres with the Better Auth schema (`user`/`session`/`account`/`verification` + `role` enum), `drizzle-kit` tooling (`db:push`/`db:generate`/`db:studio`/`db:migrate`), and Better Auth's Drizzle adapter — functionally identical to the Prisma option. Prisma stays the default. The generated README now reflects whichever database you pick.
- 9181791: Add email verification and password reset to the email-password provider. Generated projects now ship a new swappable `@repo/email` package with pluggable drivers — **Resend** or **SMTP/nodemailer**, selected via `EMAIL_PROVIDER` — plus forgot-password / reset-password pages, verification-aware sign-in and sign-up (with a rate-limited "resend verification" action), failed-send logging, and email env config. All of it is added only when the email-password provider is selected.

## 0.2.2

### Patch Changes

- 12d1733: Update the `@clack/prompts` runtime dependency to v1. This requires **Node.js 20+** (clack v1 is ESM-only and uses Node 20 APIs), so the CLI's minimum supported Node version is now 20 — matching the Node requirement of the projects it generates.

## 0.2.1

### Patch Changes

- 5de9a11: Fix the generated NestJS API failing to boot in production (`node dist/main.js`):

  - Declare `express` as a direct dependency of `apps/api` (it is imported at runtime in `main.ts`).
  - Compile the internal `@repo/auth` and `@repo/db` packages to CommonJS and point their `exports`/`main`/`types` at `dist/`, so the built API loads compiled JavaScript instead of raw TypeScript source.

## 0.2.0

### Minor Changes

- aee7c2f: Initial CLI release
