import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'drizzle-kit';

const packageDir = __dirname;
const rootDir = path.resolve(packageDir, '..', '..');
const rootEnv = path.join(rootDir, '.env');
if (fs.existsSync(rootEnv)) { process.loadEnvFile(rootEnv); }

let dbUrl = process.env.DATABASE_URL ?? '';
if (!dbUrl.includes('://')) {
  dbUrl = path.resolve(rootDir, dbUrl);
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: { url: dbUrl },
});
