import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as tables from './schema.js';

const globalForDb = globalThis as unknown as { pool: Pool | undefined };
const pool = globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== 'production') { globalForDb.pool = pool; }

export const db = drizzle(pool, { schema: tables });
export const schema = { user: tables.user, session: tables.session, account: tables.account, verification: tables.verification };
export * from './schema.js';

import { sql } from 'drizzle-orm'

export async function ping(): Promise<void> {
  await db.execute(sql`SELECT 1`)
}
