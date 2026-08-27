import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as tables from './schema';
import path from 'node:path';

let dbUrl = process.env.DATABASE_URL ?? 'data.db';
if (!dbUrl.includes('://')) {
  dbUrl = path.resolve(__dirname, '..', '..', '..', dbUrl);
}

const sqlite = new Database(dbUrl);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema: tables });
export const schema = {
  user: tables.user,
  session: tables.session,
  account: tables.account,
  verification: tables.verification,
};
export * from './schema';

import { eq, sql } from 'drizzle-orm';

export async function ping(): Promise<void> {
  db.get(sql`SELECT 1`);
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
  sqlite.close();
}
