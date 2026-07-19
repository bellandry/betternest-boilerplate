# BetterNest Boilerplate

The **production-ready Next.js + NestJS + Better Auth monorepo starter** with a
zero-CORS same-origin proxy, 6 database combos (Prisma/Drizzle ×
PostgreSQL/MySQL/SQLite), and one-command deployment anywhere: Vercel +
Railway, Fly.io, Render, or your own VPS.

[![npm version](https://img.shields.io/npm/v/create-betternest-app?color=blue)](https://www.npmjs.com/package/create-betternest-app)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](./CONTRIBUTING.md)

---

## What is BetterNest?

You get a fully scaffolded monorepo where the **browser talks to a single
origin** (your Vercel domain), and Next.js transparently proxies every `/api/*`
request to the NestJS backend — wherever it's hosted.

**No CORS. No cross-site cookies. No `trustedOrigins` debugging.** The session
cookie stays first-party on your Vercel domain, even though the backend runs on
a completely different host.

Choose your stack from the CLI and start building in 30 seconds:

```bash
npx create-betternest-app my-app
# or pick your database and go non-interactive
npx create-betternest-app my-app --db=prisma-sqlite --yes
```

## Why BetterNest?

### Zero CORS — by architecture, not configuration

Every `/api/*` call from the browser stays same-origin because Next.js
rewrites it server-side. CORS is a fallback for non-browser clients, never a
blocker for your users.

### Cross-host deployment

Deploy `apps/web` on **Vercel** and `apps/api` on **any host** — Railway,
Fly.io, Render, or a Docker Compose VPS. The proxy works identically
everywhere. One `Dockerfile` covers all three managed platforms.

### 6 database combos

| Engine | ORM | Docker needed |
|---|---|---|
| PostgreSQL | Prisma v7 | yes |
| PostgreSQL | Drizzle | yes |
| MySQL | Prisma v7 | yes |
| MySQL | Drizzle | yes |
| SQLite | Prisma v7 | no |
| SQLite | Drizzle | no |

### Monorepo that ships ready

- **`apps/web`** — Next.js 16, Tailwind CSS v4, shadcn/ui components
- **`apps/api`** — NestJS 11, Express 5, health endpoints
- **`packages/auth`** — Better Auth (email/password, Google, GitHub OAuth)
- **`packages/db`** — Prisma or Drizzle with schema migrations
- **`packages/email`** — Resend or SMTP driver
- **`packages/ui`** — Reusable component library
- **Turborepo** — parallel builds, shared configs

## Deployment

### Frontend → Vercel

Set Root Directory to `apps/web` in the Vercel dashboard. `vercel.json` is
already included with the correct Turborepo build command and `turbo-ignore`
for preview deployments.

### Backend → Railway / Fly.io / Render

A multi-stage `Dockerfile` (`turbo prune` → build → runner) is included.
Platform configs are ready:

| Host | Config file | Setup |
|---|---|---|
| **Railway** | `railway.json` | Auto-detected. Add Postgres from the dashboard. |
| **Fly.io** | `fly.toml` | `fly launch`, then `fly postgres create`. |
| **Render** | `render.yaml` | Blueprint provisions API + managed Postgres. |

### Backend → VPS (Docker Compose)

```yaml
# docker-compose.prod.yml
services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      WEB_URL: ${WEB_URL}
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

For zero-downtime deploys, add a reverse proxy (nginx, Caddy, Traefik) for
TLS termination and scale behind a load balancer. See the generated
`DEPLOYMENT.md` for the full 11-section production guide.

## What's included

Every scaffolded project comes with:

- **Authentication** — email/password sign-up + sign-in, Google OAuth, GitHub
  OAuth, email verification, password reset, session management
- **Health endpoints** — `GET /api/health` (no DB, platform probes) and
  `GET /api/health/db` (DB ping, diagnostics)
- **CSS-first Tailwind v4** — `@theme` in CSS (no `tailwind.config.ts`),
  shadcn/ui components (Button, Input, Label, Card)
- **Single `.env`** — all configuration at the project root, one source of
  truth for every package
- **SQLite zero-setup** — no Docker, no external database. The DB file
  lives at the project root and Just Works.
- **Vercel previews** — `VERCEL_URL` trusted origins injected automatically,
  email/password auth works on every preview branch
- **Migration-safe Docker entrypoint** — `prisma migrate deploy` before
  server start, cached in non-root runner stage

## Quick start

```bash
npx create-betternest-app my-app
cd my-app
cp .env.example .env             # set BETTER_AUTH_SECRET in .env
pnpm install
docker compose up -d              # skip for SQLite
pnpm db:push
pnpm dev                          # API :4000, Web :3000
```

## Contributing

This repository is the **template system** that powers `create-betternest-app`.
It contains composable template fragments, a generator engine, and the
interactive CLI — not a runnable application at the root.

To add a new auth provider, database choice, or modify the generator, see
**[CONTRIBUTING.md](./CONTRIBUTING.md)** for the full authoring guide,
assembly rules, versioning policy, and the mandatory `test:pack` gate.

## Links

- [npm package](https://www.npmjs.com/package/create-betternest-app) — `npx create-betternest-app`
- [GitHub Issues](https://github.com/bellandry/betternest-boilerplate/issues) — feature requests & bug reports
- [CONTRIBUTING.md](./CONTRIBUTING.md) — extending the template system
