'use server';

import { randomUUID } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { locations, photos } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { parseManualLocation } from '@/lib/photo-location';

export async function savePhotoLocationAction(photoId: string, form: FormData) {
  if (!await getSession()) throw new Error('Sesi berakhir. Masuk kembali.');
  const photo = db.select({ id: photos.id }).from(photos).where(and(eq(photos.id, photoId), isNull(photos.deletedAt))).get();
  if (!photo) throw new Error('Foto tidak ditemukan.');
  const parsed = parseManualLocation({
    label: String(form.get('label') ?? ''),
    latitude: String(form.get('latitude') ?? ''),
    longitude: String(form.get('longitude') ?? ''),
  });
  if (!parsed.location) redirect(`/photos/${photoId}?locationError=${encodeURIComponent(parsed.error)}`);
  const existing = db.select({ id: locations.id }).from(locations).where(eq(locations.photoId, photoId)).get();
  if (existing) db.update(locations).set(parsed.location).where(eq(locations.id, existing.id)).run();
  else db.insert(locations).values({ id: randomUUID(), photoId, ...parsed.location }).run();
  revalidatePath(`/photos/${photoId}`); revalidatePath('/archive'); revalidatePath('/timeline');
  redirect(`/photos/${photoId}?locationSaved=1`);
}
