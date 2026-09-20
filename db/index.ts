import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

// Define paths
export const dbPath = path.join(process.cwd(), 'chronovista.db');

// Initialize better-sqlite3 connection
const sqlite = new Database(dbPath);

// Apply recommended pragmas
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = NORMAL');
sqlite.pragma('busy_timeout = 5000');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
