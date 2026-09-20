'use server';

import { randomUUID } from 'node:crypto';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { issuePagePhotos, issuePages, issues, locations, photos } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { parseManualLocation } from '@/lib/photo-location';
import { setPhotoMetadataPublic } from '@/lib/photo-public-metadata';

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

export async function addPhotoToIssueAction(photoId: string, form: FormData) {
  if (!await getSession()) throw new Error('Sesi berakhir. Masuk kembali.');
  const issueId = String(form.get('issueId') ?? '');
  const result = db.transaction(tx => {
    const photo = tx.select({ id: photos.id, filename: photos.filename }).from(photos).where(and(eq(photos.id, photoId), isNull(photos.deletedAt))).get();
    const issue = tx.select({ id: issues.id, status: issues.status }).from(issues).where(eq(issues.id, issueId)).get();
    if (!photo || !issue || issue.status !== 'Draft') return 'invalid';
    const existing = tx.select({ pageId: issuePagePhotos.pageId }).from(issuePagePhotos).innerJoin(issuePages, eq(issuePagePhotos.pageId, issuePages.id)).where(and(eq(issuePages.issueId, issueId), eq(issuePagePhotos.photoId, photoId))).get();
    if (existing) return 'duplicate';
    const count = tx.select({ value: sql<number>`count(*)` }).from(issuePages).where(eq(issuePages.issueId, issueId)).get()?.value ?? 0;
    if (count >= 100) return 'full';
    const pageNumber = (tx.select({ value: sql<number>`coalesce(max(${issuePages.pageNumber}), 0)` }).from(issuePages).where(eq(issuePages.issueId, issueId)).get()?.value ?? 0) + 1;
    const pageId = randomUUID();
    tx.insert(issuePages).values({ id: pageId, issueId, pageNumber, layoutType: pageNumber === 1 ? 'cover' : 'single' }).run();
    tx.insert(issuePagePhotos).values({ pageId, photoId, position: 1, altText: photo.filename }).run();
    return 'ok';
  });
  if (result !== 'ok') redirect(`/photos/${photoId}?issueError=${result}`);
  revalidatePath('/issues'); revalidatePath(`/issues/${issueId}/edit`); revalidatePath(`/photos/${photoId}`);
  redirect(`/issues/${issueId}/edit`);
}

export async function updatePhotoArchiveStatusAction(photoId: string, form: FormData) {
  if (!await getSession()) throw new Error('Sesi berakhir. Masuk kembali.');
  const status = String(form.get('status') ?? '');
  if (!['Ready', 'Need Review'].includes(status)) throw new Error('Status arsip tidak valid.');
  const photo = db.select({ id: photos.id }).from(photos).where(and(eq(photos.id, photoId), isNull(photos.deletedAt))).get();
  if (!photo) throw new Error('Foto tidak ditemukan.');
  db.update(photos).set({ status }).where(eq(photos.id, photoId)).run();
  revalidatePath(`/photos/${photoId}`); revalidatePath('/archive'); revalidatePath('/timeline'); revalidatePath('/dashboard');
  redirect(`/photos/${photoId}?statusSaved=1`);
}

export async function togglePhotoPublicMetadataAction(photoId: string, form: FormData) {
  if (!await getSession()) throw new Error('Sesi berakhir. Masuk kembali.');
  const photo = db.select({ id: photos.id }).from(photos).where(and(eq(photos.id, photoId), isNull(photos.deletedAt))).get();
  if (!photo) throw new Error('Foto tidak ditemukan.');
  const enabled = String(form.get('enabled')) === '1';
  setPhotoMetadataPublic(photoId, enabled);
  const affected = db.select({ slug: issues.slug }).from(issuePagePhotos).innerJoin(issuePages, eq(issuePagePhotos.pageId, issuePages.id)).innerJoin(issues, eq(issuePages.issueId, issues.id)).where(eq(issuePagePhotos.photoId, photoId)).all();
  for (const issue of affected) revalidatePath(`/issues/${issue.slug}`);
  revalidatePath(`/photos/${photoId}`);
  redirect(`/photos/${photoId}?metadataSaved=1`);
}
