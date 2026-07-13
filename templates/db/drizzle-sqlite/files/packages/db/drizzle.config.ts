import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'drizzle-kit';

const rootEnv = path.join(process.cwd(), '..', '..', '.env');
if (fs.existsSync(rootEnv)) { process.loadEnvFile(rootEnv); }

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
