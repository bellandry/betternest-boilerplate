# BetterNest Boilerplate — template system

The Phase-0 golden-path monorepo (Next.js 16 + NestJS + Better Auth + Prisma)
extracted into **composable templates** plus a **generator** that assembles a
project from a selection of auth providers and a database, and an interactive
**CLI** that drives it.

## Quick start

Scaffold a new project with the CLI:

```bash
pnpm cli:dev my-app        # build + run the CLI locally
# published equivalent: npx create-betternest-app my-app
```

Or drive the generator directly with the hardcoded default selection:

```bash
pnpm install
pnpm generate:default     # -> examples/mvp/ (committed reference output)
pnpm smoke-test           # generate + install + build + lint in a temp dir
```

The generated project is a fully working monorepo. To run it:

```bash
cd examples/mvp
pnpm install
cp .env.example .env && cp apps/api/.env.example apps/api/.env && cp apps/web/.env.example apps/web/.env
# set BETTER_AUTH_SECRET, start Postgres (docker compose up -d), then:
pnpm db:push
pnpm dev                  # web :3000, api :4000
```

## What's where

| Path                     | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `templates/base/`        | files in every generated project (token-substituted) |
| `templates/db/`          | database choices (Prisma; Drizzle skeleton)          |
| `templates/auth-providers/` | auth methods (email-password, Google, GitHub)     |
| `packages/generator/`    | the assembly engine (pure logic, no CLI)             |
| `packages/cli/`          | interactive CLI (`create-betternest-app`) — prompts + flags |
| `scripts/`               | `generate-default`, `smoke-test`                     |
| `examples/mvp/`          | committed generated reference — do not edit by hand  |

The anti-CORS / cookies / `trustedOrigins` architecture (the whole point of the
starter) is documented in the generated project's own README —
see `examples/mvp/README.md`.

## Extending

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to add an auth provider or a
database choice.
