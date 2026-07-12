import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as tables from './schema';

// Singleton pool — prevents exhausting DB connections during Next.js dev
// hot-reload and NestJS watch mode.
const globalForDb = globalThis as unknown as { pool: Pool | undefined };

const pool =
  globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema: tables });

// The subset the Better Auth Drizzle adapter maps (model name -> table).
export const schema = {
  user: tables.user,
  session: tables.session,
  account: tables.account,
  verification: tables.verification,
};

export * from './schema';
