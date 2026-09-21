'use server';

import { randomUUID } from 'node:crypto';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, dbPath } from '@/db';
import { backups, users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { getAppPreferences, saveAppPreferences, type AppPreferences } from '@/lib/app-preferences';

const string = (form: FormData, name: string, max: number) => String(form.get(name) ?? '').trim().slice(0, max);
const checked = (form: FormData, name: string) => form.get(name) === 'on';

export async function saveSettingsAction(form: FormData) {
  const user = await getSession();
  if (!user) throw new Error('Sesi berakhir. Masuk kembali.');
  const photographer = string(form, 'photographer', 120);
  if (!photographer) throw new Error('Nama fotografer wajib diisi.');
  const previous = getAppPreferences();
  const theme = string(form, 'theme', 10);
  const gridSize = string(form, 'gridSize', 10);
  const precision = string(form, 'publicPrecision', 10);
  const accent = string(form, 'accent', 20);
  const preferences: AppPreferences = {
    ...previous,
    archiveName: string(form, 'archiveName', 120) || 'ChronoVista',
    description: string(form, 'description', 500),
    yearRange: string(form, 'yearRange', 40),
    language: 'id',
    showStats: checked(form, 'showStats'),
    theme: theme === 'dark' || theme === 'system' ? theme : 'light',
    accent: /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : previous.accent,
    gridSize: gridSize === 'small' || gridSize === 'large' ? gridSize : 'medium',
    monochromeCover: checked(form, 'monochromeCover'),
    gpsDefault: 'private',
    stripSensitiveExif: true,
    showCameraLens: checked(form, 'showCameraLens'),
    showExactCoordinates: false,
    publicPrecision: precision === 'area' || precision === 'exact' ? precision : 'city',
  };
  db.update(users).set({ displayName: photographer }).where(eq(users.id, user.id)).run();
  saveAppPreferences(preferences);
  revalidatePath('/settings'); revalidatePath('/dashboard'); revalidatePath('/archive'); revalidatePath('/issues');
  redirect('/settings?saved=1');
}

export async function checkDatabaseIntegrityAction() {
  if (!await getSession()) throw new Error('Sesi berakhir. Masuk kembali.');
  const database = new Database(dbPath, { readonly: true, fileMustExist: true });
  try { const result = database.pragma('integrity_check') as { integrity_check: string }[]; redirect(`/settings?integrity=${result.every(row => row.integrity_check === 'ok') ? 'ok' : 'fail'}`); }
  finally { database.close(); }
}

export async function backupDatabaseAction() {
  if (!await getSession()) throw new Error('Sesi berakhir. Masuk kembali.');
  const directory = path.join(process.cwd(), 'backups');
  await mkdir(directory, { recursive: true });
  const id = randomUUID();
  const filename = `chronovista-${new Date().toISOString().replace(/[:.]/g, '-')}-${id.slice(0, 8)}.db`;
  const target = path.join(directory, filename);
  const database = new Database(dbPath, { readonly: true, fileMustExist: true });
  try { await database.backup(target); } finally { database.close(); }
  const file = await stat(target);
  db.insert(backups).values({ id, name: filename, type: 'manual', path: target, bytes: file.size, status: 'Completed', createdAt: new Date() }).run();
  revalidatePath('/settings');
  redirect('/settings?backup=1');
}
