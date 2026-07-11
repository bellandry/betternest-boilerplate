# BetterNest Boilerplate — Next.js 16 + NestJS + Better Auth Monorepo

A reference monorepo for **cross-app authentication done right**. It pairs a
Next.js 16 frontend with a separate NestJS backend and wires Better Auth so
that the three classic production traps — CORS, session cookies, and
`trustedOrigins` — are solved *structurally*, not patched after the fact.

The core idea: **the browser never talks to the API directly for auth.** All
auth traffic is proxied same-origin through Next.js rewrites.

---

## Stack

| Layer            | Choice                                              |
| ---------------- | --------------------------------------------------- |
| Monorepo         | pnpm workspaces + Turborepo                         |
| Frontend         | Next.js 16 (App Router), TypeScript strict, Tailwind, shadcn/ui |
| Backend          | NestJS 11 (Express 5), TypeScript strict            |
| Auth             | Better Auth (email/password + Google + GitHub OAuth)|
| Database         | Prisma + PostgreSQL                                 |
| Validation       | Zod                                                 |
| Lint / format    | ESLint + Prettier (shared config packages)          |

---

## Repository structure

```
.
├── apps/
│   ├── web/                # Next.js 16 (port 3000) — also the auth proxy
│   └── api/                # NestJS   (port 4000) — Better Auth handler
├── packages/
│   ├── auth/               # THE single betterAuth() instance (server-only)
│   ├── db/                 # Prisma schema + singleton client
│   ├── ui/                 # shadcn/ui primitives + Tailwind preset
│   ├── eslint-config/      # shared ESLint flat config
│   └── typescript-config/  # shared tsconfig bases
├── docker-compose.yml      # local Postgres
├── turbo.json
└── pnpm-workspace.yaml
```

---

## The three traps, and how this starter solves them

Better Auth's docs *describe* these problems but leave you to assemble the
solution. This starter bakes the solution into the architecture.

### The request flow

```
                        Browser (only ever sees http://localhost:3000)
                                        │
              fetch('/api/auth/sign-in/email')  ← RELATIVE url, same-origin
                                        │
                                        ▼
        ┌───────────────────────────────────────────────┐
        │  Next.js (apps/web)  http://localhost:3000      │
        │                                                 │
        │  next.config.ts rewrites:                       │
        │   /api/auth/:path*  ─►  API_URL/api/auth/:path* │
        │   /api/:path*       ─►  API_URL/api/:path*       │
        └───────────────────────────────────────────────┘
                                        │  (server-side proxy, not the browser)
                                        ▼
        ┌───────────────────────────────────────────────┐
        │  NestJS (apps/api)   http://localhost:4000      │
        │                                                 │
        │  AuthController @All('/api/auth/*path')         │
        │        └─► toNodeHandler(auth)  (packages/auth) │
        │                    └─► Prisma ─► PostgreSQL      │
        └───────────────────────────────────────────────┘
```

Because the browser only ever requests its **own origin**, the following are
true by construction:

**1. CORS** — There is no cross-origin request from the browser, so there is
**no CORS preflight at all**. CORS is still enabled on NestJS
(`apps/api/src/main.ts`) but only as a *fallback* for non-browser clients
(mobile, Postman). It is scoped to `WEB_URL` with `credentials: true` and
**never** uses `origin: '*'`.

**2. Session cookies** — The session cookie is set by NestJS but travels back
through the proxy, so to the browser it is a **first-party** cookie on
`localhost:3000`. It survives refresh and navigation. Cookie attributes are set
dynamically in `packages/auth`:

- **dev**: `SameSite=Lax; Secure=false` (browsers reject `Secure` cookies on
  `http://`)
- **prod**: `SameSite=None; Secure=true` (required for any cross-site scenario
  over HTTPS)

**3. `trustedOrigins`** — Configured once in `packages/auth` from the `WEB_URL`
env var. Since the flow is same-origin, this matches cleanly and requests are
never silently rejected.

### Two more implementation details that matter

- **`bodyParser: false`** — NestJS is created with the global body parser
  disabled (`apps/api/src/main.ts`). Better Auth's node handler needs the *raw*
  request stream; Nest's parser would consume it first. We re-apply
  `express.json()` to every route **except** `/api/auth/*`.
- **Relative `baseURL`** — In the browser the Better Auth client
  (`apps/web/lib/auth-client.ts`) uses `baseURL: '/api/auth'` (same-origin).
  Never an absolute URL to the API port — that would reintroduce cross-site
  requests. (During SSR, where a relative URL has no origin, it falls back to
  the app's own `NEXT_PUBLIC_APP_URL` — still the web origin, never the API.)

---

## Local setup (step by step)

### 0. Prerequisites

- Node.js ≥ 20.9
- pnpm ≥ 9 (`npm i -g pnpm`)
- Docker (for Postgres) — or your own Postgres instance

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL

```bash
cp .env.example .env        # root env feeds docker-compose
docker compose up -d
```

### 3. Configure environment files

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Generate a secret for the API:

```bash
openssl rand -base64 32     # paste into BETTER_AUTH_SECRET in apps/api/.env
```

### 4. Push the database schema

```bash
pnpm db:push
```

(Optional) Inspect data with Prisma Studio:

```bash
pnpm db:studio
```

### 5. Run everything

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000

---

## Environment variables

### `apps/api/.env`

| Variable                | Purpose                                             |
| ----------------------- | --------------------------------------------------- |
| `DATABASE_URL`          | Prisma → Postgres connection string                 |
| `BETTER_AUTH_SECRET`    | Signing secret (`openssl rand -base64 32`)          |
| `WEB_URL`               | Public origin of the frontend → `trustedOrigins` + `baseURL` |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth credentials                          |
| `GITHUB_CLIENT_ID/SECRET` | GitHub OAuth credentials                          |
| `PORT`                  | API port (default 4000)                             |

### `apps/web/.env`

| Variable              | Purpose                                                     |
| --------------------- | ----------------------------------------------------------- |
| `API_URL`             | Internal URL of the API (proxy target + server session fetch) |
| `NEXT_PUBLIC_APP_URL` | Public URL of the web app                                   |

---

## OAuth setup

Because of the same-origin proxy, OAuth callbacks go to the **frontend origin
(`WEB_URL`)**, not the API port. The browser is redirected back to
`WEB_URL/api/auth/callback/<provider>`, which Next.js proxies to NestJS.

### Google

1. Go to **Google Cloud Console → APIs & Services → Credentials**.
2. Create an **OAuth client ID** → application type **Web application**.
3. Authorized redirect URI (exact):
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   In production use `https://your-domain.com/api/auth/callback/google`.
4. Copy the client ID/secret into `apps/api/.env`.

### GitHub

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. **Authorization callback URL** (exact):
   ```
   http://localhost:3000/api/auth/callback/github
   ```
3. Copy the client ID/secret into `apps/api/.env`.

> **No OAuth creds yet?** Email/password sign-up works without them. The Google
> and GitHub buttons will simply error on redirect until you fill in the
> credentials above.

---

## Data model

Prisma models `User`, `Session`, `Account`, `Verification` match the Better Auth
adapter exactly. One addition: `User.role` (`enum Role { user, admin }`, default
`user`), wired via Better Auth `user.additionalFields.role` with `input: false`
so clients can't self-assign a role. **No UI reads `role` yet** — it is
RBAC groundwork for later.

---

## Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `pnpm dev`        | Run web + api in parallel (Turborepo)    |
| `pnpm build`      | Build all apps and packages              |
| `pnpm db:push`    | Push Prisma schema to the database       |
| `pnpm db:studio`  | Open Prisma Studio                        |
| `pnpm lint`       | Lint all packages                         |
| `pnpm format`     | Prettier write                            |

---

## Definition of Done — how to verify

1. `pnpm install && pnpm dev` boots web (3000) + api (4000) without errors.
2. Email/password sign-up creates a `User` row and an active session (check
   `pnpm db:studio`).
3. Google and GitHub sign-in work end-to-end once credentials are set.
4. After sign-in, `/dashboard` and `/profile` load without redirect.
5. Visiting `/dashboard` without a session redirects to `/sign-in`.
6. No CORS errors appear in the browser console at any point.
7. Refreshing (`F5`) on `/dashboard` keeps the session (cookie persisted).
8. This README documents the anti-CORS / cookie / `trustedOrigins` architecture
   (see above).

---

## Scope (MVP)

**Included:** email/password, Google + GitHub OAuth, protected routes, profile
edit, RBAC-ready `role` field.

**Intentionally excluded (post-MVP):** password reset, email verification, 2FA,
admin panel, Drizzle adapter (Prisma only for this phase).

---

## Notes on Next.js 16 / NestJS 11 wildcards

- The catch-all auth route uses the Express 5 named-wildcard syntax:
  `@All('*path')` in `apps/api/src/auth/auth.controller.ts`.
- Route protection uses a two-tier pattern: a lightweight cookie-existence check
  in `apps/web/proxy.ts` (Next.js 16 renamed `middleware` → `proxy`; edge-safe,
  no DB), and real session validation in
  the `(app)` layout via `getServerSession()`.
```
