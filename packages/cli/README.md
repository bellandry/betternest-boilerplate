# create-betternest-app

Interactive CLI that scaffolds a **BetterNest Boilerplate** monorepo
(Next.js 16 + NestJS + Better Auth) with the same-origin auth proxy that makes
CORS, session cookies, and `trustedOrigins` non-issues.

```bash
npx create-betternest-app my-app
```

## What you get

- **Next.js 16** frontend with Tailwind CSS v4, shadcn/ui components
- **NestJS 11** backend with Express 5
- **Better Auth** — email/password + Google + GitHub OAuth, email verification,
  password reset, session management
- **6 database combos** — PostgreSQL, MySQL, or SQLite with Prisma OR Drizzle
- **Zero CORS** — same-origin proxy via Next.js rewrites, no cross-site cookies
- **Trusted origins** dynamic — Vercel preview deployments work out of the box
- **Health endpoints** — `/api/health` (no DB) and `/api/health/db` (ping)
- **Rate limiting** — built-in on auth endpoints (sign-in, sign-up, password reset). Per-endpoint buckets, configurable via `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW`, hot-reload (no restart), optional Redis for multi-instance
- **Monorepo** — Turborepo, pnpm workspaces, shared packages (`@repo/ui`, `@repo/auth`, `@repo/db`, `@repo/email`)

## Usage

```bash
# Interactive
npx create-betternest-app my-app

# Scripted — pick a database and auth providers
npx create-betternest-app my-app --db=prisma-sqlite --yes

# All flags
npx create-betternest-app my-app \
  --db=prisma-postgresql \
  --auth=email-password,google,github \
  --pm=pnpm \
  --yes
```

## Flags

| Flag | Values | Default | Description |
|---|---|---|---|
| `[project-name]` | valid npm/folder name | prompted | Positional |
| `--db` | `prisma-postgresql`, `prisma-mysql`, `prisma-sqlite`, `drizzle-postgresql`, `drizzle-mysql`, `drizzle-sqlite` | prompted (default: SQLite) | ORM-engine combo |
| `--auth` | `email-password,google,github` (CSV) | all three | Auth providers |
| `--pm` | `pnpm`, `npm`, `yarn`, `bun` | `pnpm` | Package manager |
| `--no-install` | — | runs install | Skip dependency install |
| `--no-git` | — | runs `git init` | Skip git init |
| `-y`, `--yes` | — | interactive | Skip prompts |
| `-h`, `--help` | — | — | Show help |

## Database combos

| ID | Engine | ORM | Docker needed |
|---|---|---|---|
| `prisma-postgresql` | PostgreSQL | Prisma v7 | yes |
| `prisma-mysql` | MySQL | Prisma v7 | yes |
| `prisma-sqlite` | SQLite | Prisma v7 | no |
| `drizzle-postgresql` | PostgreSQL | Drizzle | yes |
| `drizzle-mysql` | MySQL | Drizzle | yes |
| `drizzle-sqlite` | SQLite | Drizzle | no |

## After scaffolding

```bash
cd my-app
cp .env.example .env          # single .env at project root
# Generate a secret: openssl rand -base64 32
# Paste into BETTER_AUTH_SECRET in .env

pnpm install
docker compose up -d           # skip for SQLite
pnpm db:push                   # push schema to database
pnpm dev                       # start API (4000) + Web (3000)
```

## Deployment

The generated project includes everything needed to deploy **`apps/web` on
Vercel** and **`apps/api` on any host** — platform-managed or your own VPS. The
same-origin proxy works identically everywhere.

### Frontend — Vercel

1. Push your project to GitHub.
2. Dashboard: **Add New → Project → Import** your repo.
3. Set **Root Directory** = `apps/web`. Framework auto-detected.
4. `vercel.json` sets the correct build command automatically.
5. Add env var: `API_URL` = your backend URL (e.g. `https://api.railway.app`).
6. Deploy → copy the production Vercel URL → set `WEB_URL` on your backend → redeploy.

### Backend — Railway / Fly.io / Render

A multi-stage Dockerfile is included (`apps/api/Dockerfile`) with `turbo prune`
for minimal image size. Platform configs are ready:

| Host | Config file | Notes |
|---|---|---|
| **Railway** | `railway.json` | Auto-detected. Add Postgres via the dashboard. |
| **Fly.io** | `fly.toml` | Run `fly launch`. Attach Postgres via `fly postgres create`. |
| **Render** | `render.yaml` | Blueprint — provisions API + managed Postgres automatically. |

### Backend — VPS (Docker Compose)

Deploy anywhere with Docker Compose. Add this to your existing `docker-compose.yml`
or create a `docker-compose.prod.yml`:

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
      PORT: "4000"
    restart: unless-stopped

  # If you need a database on the VPS:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  pgdata:
```

On the VPS:

```bash
# Clone your repo
git clone https://github.com/you/project.git && cd project

# Set environment variables
cp .env.example .env
# Edit .env with real values

# Build and start
docker compose -f docker-compose.prod.yml up -d --build
```

For production, add a reverse proxy (nginx, Caddy, or Traefik) in front of
the API container to handle TLS termination. The health endpoint at
`/api/health` can be used for uptime monitoring.

### Production checklist

See the generated `DEPLOYMENT.md` for the full 11-section guide covering:
environment variables, OAuth callback URLs, circular dependency wiring
(`WEB_URL` → `API_URL` → `WEB_URL`), preview deployments, and a
post-deployment checklist.

### VPS with Ansible (automated)

For teams deploying to multiple VPS instances, an Ansible playbook skeleton:

```yaml
# deploy.yml
- hosts: production
  vars:
    project_dir: /opt/my-app
    repo_url: git@github.com:<your-username>/<your-repo>.git  # ← your project repo, not the boilerplate
  tasks:
    - name: Clone repo
      git:
        repo: "{{ repo_url }}"
        dest: "{{ project_dir }}"
        version: main

    - name: Set up .env
      template:
        src: .env.j2
        dest: "{{ project_dir }}/.env"

    - name: Build and start services
      community.docker.docker_compose_v2:
        project_src: "{{ project_dir }}"
        files:
          - docker-compose.prod.yml
        build: always
        state: present
```

For zero-downtime deploys, add a second container behind a load balancer and
rotate via Docker Compose profiles or use `docker compose up -d --scale api=2`.

## Local development

```bash
pnpm install
cp .env.example .env
# Set BETTER_AUTH_SECRET, OAuth keys, email config
docker compose up -d   # only for PostgreSQL/MySQL
pnpm db:push
pnpm dev               # API on :4000, Web on :3000
```

The Next.js dev server proxies `/api/*` to the NestJS backend automatically.
There is no CORS in your browser — the proxy makes everything same-origin.
