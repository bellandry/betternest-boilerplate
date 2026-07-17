import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as tables from './schema';
import path from 'node:path';

let dbUrl = process.env.DATABASE_URL ?? 'data.db';
if (!dbUrl.includes('://')) {
  dbUrl = path.resolve(__dirname, '..', '..', dbUrl);
}

const sqlite = new Database(dbUrl);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema: tables });
export const schema = { user: tables.user, session: tables.session, account: tables.account, verification: tables.verification };
export * from './schema';

import { sql } from 'drizzle-orm'

export async function ping(): Promise<void> {
  db.get(sql`SELECT 1`)
}
