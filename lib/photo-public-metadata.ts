import { inArray, eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';

const key = (photoId: string) => `photo-public-metadata:${photoId}`;

export function isPhotoMetadataPublic(photoId: string) {
  const row = db.select({ valueJson: settings.valueJson }).from(settings).where(eq(settings.key, key(photoId))).get();
  return row?.valueJson === 'true';
}

export function publicMetadataPhotoIds(photoIds: string[]) {
  if (!photoIds.length) return new Set<string>();
  const keys = photoIds.map(key);
  const rows = db.select({ key: settings.key, valueJson: settings.valueJson }).from(settings).where(inArray(settings.key, keys)).all();
  return new Set(rows.filter(row => row.valueJson === 'true').map(row => row.key.slice('photo-public-metadata:'.length)));
}

export function setPhotoMetadataPublic(photoId: string, enabled: boolean) {
  const valueJson = JSON.stringify(enabled);
  db.insert(settings).values({ key: key(photoId), valueJson, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { valueJson, updatedAt: new Date() } }).run();
}
