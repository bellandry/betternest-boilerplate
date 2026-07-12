import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'drizzle-kit';

// Mirror packages/db's runtime: load the monorepo-root .env ourselves so
// drizzle-kit (generate/push/studio/migrate) sees DATABASE_URL. Guarded so it
// still works where DATABASE_URL is provided directly (e.g. CI). cwd is the
// package dir when run via `pnpm --filter @repo/db` or turbo.
const rootEnv = path.join(process.cwd(), '..', '..', '.env');
if (fs.existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
