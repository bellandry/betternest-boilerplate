# create-betternest-app

Interactive CLI that scaffolds a **BetterNest Boilerplate** monorepo
(Next.js 16 + NestJS + Better Auth) with the same-origin auth proxy that makes
CORS, session cookies, and `trustedOrigins` non-issues.

```bash
npx create-betternest-app my-app
# or fully scripted:
npx create-betternest-app my-app --db=prisma --auth=email-password,google,github --pm=pnpm --yes
```

The CLI contains **no template logic** — it collects a selection and calls
`@repo/generator`. All template knowledge (which databases/providers exist,
their status) is read from the generator's catalog.

## Flags

| Flag             | Values                                    | Default            | Description                                              |
| ---------------- | ----------------------------------------- | ------------------ | -------------------------------------------------------- |
| `[project-name]` | valid npm/folder name                     | prompted           | Positional. Pre-fills and skips the name prompt.         |
| `--db`           | `prisma` (`drizzle` = coming soon)        | `prisma`           | Database template id.                                    |
| `--auth`         | `email-password,google,github` (CSV)      | all three          | Auth provider ids. `email-password` is always included.  |
| `--pm`           | `pnpm` \| `npm` \| `yarn` \| `bun`        | detected → `pnpm`  | Package manager for install + printed commands.          |
| `--no-install`   | —                                         | install runs       | Skip dependency installation.                            |
| `--no-git`       | —                                         | git init runs      | Skip `git init` + first commit.                          |
| `-y`, `--yes`    | —                                         | interactive        | Skip all prompts; use defaults + provided flags.         |
| `-v`, `--verbose`| —                                         | off                | Print full stack traces on error.                        |
| `-h`, `--help`   | —                                         | —                  | Show usage.                                              |

Notes:

- **Coming-soon** choices (e.g. `drizzle`) appear disabled in prompts as a
  roadmap preview and are rejected if passed via a flag.
- Invalid values fail fast with a non-zero exit and a list of valid values.
- An existing non-empty target directory is never overwritten silently:
  interactively you confirm; with `--yes` it errors.

## Local development / testing (before publishing)

From the monorepo root:

```bash
# Build the bundle and run it in one step (iterate quickly):
pnpm cli:dev my-test-app

# Just build the bundle (dist/index.js + dist/templates):
pnpm cli:build
```

To test the exact `npx` behavior, link it globally:

```bash
cd packages/cli
pnpm build
pnpm link --global
create-betternest-app my-test-app     # runs the linked bin like a published package
pnpm unlink --global                  # when done
```

## Packaging

- `tsup` bundles `src/index.ts` (+ the inlined generator) into a single
  `dist/index.js` (CJS, Node 20+) with a `#!/usr/bin/env node` shebang.
- `templates/` is copied to `dist/templates` at build time, so the published
  package is self-contained (the CLI reads templates from beside the bundle).
- Only `dist/` is published (`files` field). Runtime deps: `@clack/prompts`,
  `jiti`. No monorepo devDependencies are needed at runtime.
