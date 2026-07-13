Prisma models User, Session, Account, Verification match the Better Auth
adapter exactly. ole is a String with a default of "user" (Prisma SQLite
does not support native enums). **No UI reads ole yet** — it is RBAC
groundwork for later.

SQLite stores its database file at data.db in the project root. No Docker
is needed — just run pnpm db:push after install.
