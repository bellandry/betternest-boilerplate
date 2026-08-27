# Architecture Decision Records

Architecture Decision Records capture durable decisions that affect the generated project contract, the support matrix, or the long-term product direction.

ADRs are intentionally short. They describe the context, the decision, its consequences, and the conditions under which it should be revisited.

| ADR | Decision |
| --- | --- |
| [0001 — Golden Path](./0001-golden-path.md) | Prisma + PostgreSQL is the reference production path; Prisma + SQLite is the fastest local path |
| [0002 — pnpm](./0002-pnpm-is-the-only-supported-generated-workspace-package-manager.md) | pnpm is the only officially supported package manager for generated workspaces |
| [0003 — Same-Origin Browser Authentication](./0003-same-origin-proxy-for-browser-auth.md) | Browser-facing authentication uses a same-origin path by default |
| [0004 — Database Variant Support Levels](./0004-support-levels-for-database-variants.md) | Database variants state their production, local-development, or experimental support contract |
| [0005 — Generated Project Contract](./0005-generated-project-contract.md) | Generated projects remain standard, readable, portable, and independent from a hosted BetterNest service |
| [0006 — Support Matrix](./0006-support-matrix.md) | Every combination has an explicit maturity level: golden path, supported, experimental, or deprecated |

Use GitHub Issues for delivery work and ADRs for decisions. Do not use an issue as the only source of truth for a decision that affects future contributors.
