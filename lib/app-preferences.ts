import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';

export type AppPreferences = {
  archiveName: string; description: string; yearRange: string; language: string;
  showStats: boolean; theme: 'light' | 'dark' | 'system'; accent: string; gridSize: 'small' | 'medium' | 'large'; monochromeCover: boolean;
  gpsDefault: 'private' | 'public'; stripSensitiveExif: boolean; showCameraLens: boolean; showExactCoordinates: boolean; publicPrecision: 'city' | 'area' | 'exact';
};
export const defaultAppPreferences: AppPreferences = { archiveName: 'ChronoVista', description: 'Arsip fotografi, waktu, dan cerita.', yearRange: '2011 — 2026', language: 'id', showStats: true, theme: 'light', accent: '#0b6b5a', gridSize: 'medium', monochromeCover: true, gpsDefault: 'private', stripSensitiveExif: true, showCameraLens: true, showExactCoordinates: false, publicPrecision: 'city' };
const key = 'app-preferences';
export function getAppPreferences(): AppPreferences {
  const row = db.select({ valueJson: settings.valueJson }).from(settings).where(eq(settings.key, key)).get();
  if (!row) return defaultAppPreferences;
  try { return { ...defaultAppPreferences, ...JSON.parse(row.valueJson) as Partial<AppPreferences> }; } catch { return defaultAppPreferences; }
}
export function saveAppPreferences(value: AppPreferences) {
  db.insert(settings).values({ key, valueJson: JSON.stringify(value), updatedAt: new Date() }).onConflictDoUpdate({ target: settings.key, set: { valueJson: JSON.stringify(value), updatedAt: new Date() } }).run();
}
