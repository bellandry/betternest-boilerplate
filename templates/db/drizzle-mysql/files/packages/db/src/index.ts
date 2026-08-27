import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as tables from './schema';

const globalForDb = globalThis as unknown as { pool: mysql.Pool | undefined };
const pool = globalForDb.pool ?? mysql.createPool(process.env.DATABASE_URL!);
if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema: tables, mode: 'default' });
export const schema = {
  user: tables.user,
  session: tables.session,
  account: tables.account,
  verification: tables.verification,
};
export * from './schema';

import { eq, sql } from 'drizzle-orm';

export async function ping(): Promise<void> {
  await db.execute(sql`SELECT 1`);
}

export type SeedUser = { id: string; email: string; role: string };

export async function findUserByEmail(email: string): Promise<SeedUser | null> {
  const rows = await db
    .select({ id: tables.user.id, email: tables.user.email, role: tables.user.role })
    .from(tables.user)
    .where(eq(tables.user.email, email))
    .limit(1);
  const record = rows[0];
  return record ? { ...record, role: String(record.role) } : null;
}

export async function promoteUserToAdmin(email: string): Promise<void> {
  await db
    .update(tables.user)
    .set({ role: 'admin', emailVerified: true })
    .where(eq(tables.user.email, email));
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
