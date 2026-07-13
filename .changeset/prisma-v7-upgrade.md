---
"create-betternest-app": major
---

Upgrade all Prisma templates from v6 to v7.

**Breaking changes (generated projects):**

- Generator: `prisma-client-js` → `prisma-client` with explicit `output` and
  `generatedFileExtension = "ts"`
- Database connection: driver adapters required (`@prisma/adapter-pg`,
  `@prisma/adapter-mariadb`, or `@prisma/adapter-better-sqlite3`)
- Configuration: `DATABASE_URL` moved from `schema.prisma` to
  `prisma.config.ts` via `env()` helper; `import 'dotenv/config'` required
- Imports: `@prisma/client` → `../generated/prisma/client`
- tsconfig: `rootDir` changed to `"."` with `generated/**/*.ts` in `include`
- `.gitignore`: `packages/db/prisma/generated` → `packages/db/generated`
- Package paths: `dist/index.js` → `dist/src/index.js`
