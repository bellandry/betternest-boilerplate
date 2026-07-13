Drizzle tables user, session, ccount, erification (in
packages/db/src/schema.ts) match the Better Auth adapter exactly. One addition:
user.role (a ole MySQL enum of user | admin, default user), wired via
Better Auth user.additionalFields.role with input: false so clients can't
self-assign a role. **No UI reads ole yet** — it is RBAC groundwork for later.

Schema changes are synced with pnpm db:push (used in setup above). For
versioned migrations instead, run pnpm db:generate (writes SQL to
packages/db/drizzle/) then pnpm --filter @repo/db db:migrate.
