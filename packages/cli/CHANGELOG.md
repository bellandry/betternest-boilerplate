# create-betternest-app

## 0.6.1

### Patch Changes

- baa6efc: Publish cross-host deployment artifacts: Dockerfile, docker-entrypoint.sh,
  .dockerignore, health checks, platform configs (Vercel, Railway, Fly.io,
  Render), DEPLOYMENT.md guide, and VERCEL_URL trustedOrigins support.

## 0.6.0

### Minor Changes

- 2c0c9e7: Bump all dependencies to latest and migrate Tailwind CSS from v3 to v4.

  **Tailwind v4 migration:**
  - Removed `tailwind.config.ts` and `tailwind.preset.ts` — config is now CSS-first
    via `@theme` in `globals.css`
  - `postcss.config.mjs` uses `@tailwindcss/postcss` instead of the v3 plugin
  - `autoprefixer` removed (bundled in Tailwind v4)
  - Class-based dark mode preserved via `@custom-variant dark`
  - All shadcn-like color tokens and border-radius tokens are now in `@theme`

  **Dependency bumps (templates):**
  - next: ^16.0.0 → ^16.2.10
  - react / react-dom: ^19.0.0 → ^19.2.7
  - @nestjs/*: ^11.0.0 → ^11.1.28
  - prisma / @prisma/client: ^7.0.0 → ^7.8.0
  - drizzle-orm / drizzle-kit: already at latest
  - tailwindcss: ^3.4.17 → ^4.3.2
  - lucide-react: ^0.468.0 → ^1.24.0
  - zod: ^3.24.1 → ^4.4.3
  - typescript: ^5.6.3 → ^7.0.2
  - eslint: ^9.15.0 → ^10.7.0
  - dotenv: ^16.x → ^17.4.2
  - express: ^5.0.0 → ^5.2.1
  - turbo: ^2.3.3 → ^2.10.5
  - prettier: ^3.3.3 → ^3.9.5
  - tailwind-merge: ^2.5.5 → ^3.4.0
  - @types/node: ^22.10.1 → ^26.1.1
  - @types/react + @types/react-dom: updated to ^19.2.7
  - @eslint/js, typescript-eslint, eslint-config-prettier, globals: latest
  - pg: ^8.13.0 → ^8.22.0
  - postcss: ^8.4.49 → ^8.5.19

  **Monorepo bumps:**
  - jiti: ^2.4.2 → ^2.7.0
  - tsup: ^8.3.5 → ^8.5.1

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
