import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

// prisma.config.ts disables Prisma's automatic .env loading, so we load the
// monorepo-root .env ourselves (single source of truth). No extra dependency:
// process.loadEnvFile is built into Node. Guarded so `prisma generate` still
// works in environments without a root .env (e.g. CI).
const rootEnv = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
});
