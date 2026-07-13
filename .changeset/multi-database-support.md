---
"create-betternest-app": minor
---

Add multi-database support. The CLI now asks you to pick a **database engine** (SQLite, PostgreSQL, or MySQL — SQLite is the default, no Docker needed) and then an **ORM** (Prisma or Drizzle). Six combos are available, each with its own schema, adapter dialect, Docker Compose (for server DBs only; SQLite skips it entirely), and driver dependencies.
