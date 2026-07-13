---
"create-betternest-app": minor
---

Add **Drizzle** as a database choice (`--db=drizzle`). It scaffolds a `@repo/db` package backed by Drizzle ORM + node-postgres with the Better Auth schema (`user`/`session`/`account`/`verification` + `role` enum), `drizzle-kit` tooling (`db:push`/`db:generate`/`db:studio`/`db:migrate`), and Better Auth's Drizzle adapter — functionally identical to the Prisma option. Prisma stays the default. The generated README now reflects whichever database you pick.
