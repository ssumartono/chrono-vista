import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { desc } from 'drizzle-orm';
import { db, dbPath } from '@/db';
import { backups } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { getAppPreferences } from '@/lib/app-preferences';
import { MEDIA_ROOT } from '@/lib/storage';
import { SettingsWorkspace } from '@/components/SettingsWorkspace';
import { backupDatabaseAction, checkDatabaseIntegrityAction, saveSettingsAction } from './actions';

async function directoryBytes(directory: string): Promise<number> {
  let total = 0;
  for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) total += await directoryBytes(filename);
    else if (entry.isFile()) total += (await stat(filename)).size;
  }
  return total;
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; integrity?: string; backup?: string }> }) {
  const user = await getSession();
  if (!user) return null;
  const query = await searchParams;
  const preferences = getAppPreferences();
  const databaseStat = await stat(dbPath);
  const mediaBytes = await directoryBytes(MEDIA_ROOT);
  const lastBackup = db.select({ name: backups.name, createdAt: backups.createdAt, bytes: backups.bytes }).from(backups).orderBy(desc(backups.createdAt)).limit(1).get();
  const database = new Database(dbPath, { readonly: true, fileMustExist: true });
  const journalMode = String(database.pragma('journal_mode', { simple: true }));
  database.close();
  return <SettingsWorkspace preferences={preferences} photographer={user.displayName || user.username} databasePath={dbPath} databaseBytes={databaseStat.size} mediaPath={MEDIA_ROOT} mediaBytes={mediaBytes} journalMode={journalMode} lastBackup={lastBackup ? { name: lastBackup.name, createdAt: lastBackup.createdAt.toISOString(), bytes: lastBackup.bytes ?? 0 } : null} saved={query.saved === '1'} integrity={query.integrity ?? null} backupSaved={query.backup === '1'} saveAction={saveSettingsAction} integrityAction={checkDatabaseIntegrityAction} backupAction={backupDatabaseAction}/>;
}
