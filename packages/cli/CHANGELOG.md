# create-betternest-app

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
