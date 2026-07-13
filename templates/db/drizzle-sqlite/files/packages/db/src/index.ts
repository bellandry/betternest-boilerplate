import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as tables from './schema';

const sqlite = new Database(process.env.DATABASE_URL ?? 'data.db');
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema: tables });
export const schema = { user: tables.user, session: tables.session, account: tables.account, verification: tables.verification };
export * from './schema';
