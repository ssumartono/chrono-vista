'use server';

import { randomUUID } from 'node:crypto';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { livePhotos, liveSessions, photos } from '@/db/schema';
import { getSession } from '@/lib/auth';

async function requireOwner() { if (!await getSession()) throw new Error('Sesi berakhir. Masuk kembali.'); }

export async function startLiveAction() {
  await requireOwner();
  const existing = db.select({ id: liveSessions.id }).from(liveSessions).where(eq(liveSessions.status, 'Active')).get();
  if (!existing) db.insert(liveSessions).values({ id: randomUUID(), slug: `live-${Date.now()}`, title: 'LIVE', status: 'Active', visibility: 'Private', startedAt: new Date() }).run();
  revalidatePath('/live');
}

export async function addToLiveAction(ids: string[]) {
  await requireOwner();
  const session = db.select({ id: liveSessions.id }).from(liveSessions).where(eq(liveSessions.status, 'Active')).get();
  if (!session) throw new Error('Mulai LIVE terlebih dahulu.');
  const unique = [...new Set(ids)].slice(0, 100);
  db.transaction(tx => {
    const current = tx.select({ value: sql<number>`coalesce(max(${livePhotos.position}), 0)` }).from(livePhotos).where(eq(livePhotos.liveSessionId, session.id)).get()?.value ?? 0;
    let position = current;
    for (const id of unique) {
      const photo = tx.select({ id: photos.id }).from(photos).where(and(eq(photos.id, id), isNull(photos.deletedAt))).get();
      if (!photo) continue;
      const exists = tx.select({ photoId: livePhotos.photoId }).from(livePhotos).where(and(eq(livePhotos.liveSessionId, session.id), eq(livePhotos.photoId, id))).get();
      if (!exists) tx.insert(livePhotos).values({ liveSessionId: session.id, photoId: id, position: ++position }).run();
    }
  });
  revalidatePath('/live'); revalidatePath('/dashboard');
}

export async function removeFromLiveAction(ids: string[]) {
  await requireOwner();
  const session = db.select({ id: liveSessions.id }).from(liveSessions).where(eq(liveSessions.status, 'Active')).get();
  if (!session) return;
  for (const id of [...new Set(ids)].slice(0, 100)) db.delete(livePhotos).where(and(eq(livePhotos.liveSessionId, session.id), eq(livePhotos.photoId, id))).run();
  revalidatePath('/live'); revalidatePath('/dashboard');
}
