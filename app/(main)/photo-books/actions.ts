'use server';

import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { assets, auditLogs, bookPages, issuePagePhotos, issuePages, issues, layoutTemplates, photoBooks, photos } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { builtInTemplates, defaultTemplateSettings, type TemplateSettings } from '@/lib/photo-book-template';

async function owner() { const user = await getSession(); if (!user) throw new Error('Masuk kembali untuk mengelola Photo Book.'); return user; }
const value = (form: FormData, key: string, length: number) => String(form.get(key) ?? '').trim().slice(0, length);
const sizes = ['A4', 'A5', 'Square'];
function resolveTemplate(value: string): { name: string; margin: number } {
  if (value.startsWith('custom:')) {
    const row = db.select().from(layoutTemplates).where(eq(layoutTemplates.id, value.slice(7))).get();
    if (row) {
      let settings: TemplateSettings = defaultTemplateSettings;
      try { settings = { ...defaultTemplateSettings, ...JSON.parse(row.settingsJson) as Partial<TemplateSettings> }; } catch {}
      return { name: value, margin: settings.top };
    }
  }
  const found = builtInTemplates.find(template => template.name === value) ?? builtInTemplates[0];
  return { name: found.name, margin: found.margin };
}

export async function createPhotoBookAction(form: FormData) {
  const user = await owner();
  const title = value(form, 'title', 150);
  if (!title) throw new Error('Judul Photo Book wajib diisi.');
  const year = Number(value(form, 'year', 4));
  if (!Number.isInteger(year) || year < 1900 || year > 2200) throw new Error('Tahun tidak valid.');
  const template = value(form, 'template', 50);
  const selectedTemplate = resolveTemplate(template);
  const pageSize = value(form, 'pageSize', 20);
  const sourceIssueId = value(form, 'sourceIssueId', 100);
  const id = randomUUID();
  const slugBase = title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 65) || 'photo-book';
  const slug = `${slugBase}-${id.slice(0, 8)}`;
  const now = new Date();
  db.transaction(tx => {
    const sourceIssue = sourceIssueId ? tx.select({ id: issues.id }).from(issues).where(eq(issues.id, sourceIssueId)).get() : null;
    const sourcePhotos = sourceIssue ? tx.select({ photoId: issuePagePhotos.photoId, caption: issuePagePhotos.caption }).from(issuePages).innerJoin(issuePagePhotos, eq(issuePagePhotos.pageId, issuePages.id)).innerJoin(photos, eq(photos.id, issuePagePhotos.photoId)).where(and(eq(issuePages.issueId, sourceIssue.id), isNull(photos.deletedAt))).orderBy(asc(issuePages.pageNumber)).all() : [];
    tx.insert(photoBooks).values({ id, slug, title, subtitle: value(form, 'subtitle', 250) || null, photographer: value(form, 'photographer', 120) || user.displayName || user.username, year, description: value(form, 'description', 3000) || null, template: selectedTemplate.name, marginMm: selectedTemplate.margin, pageSize: sizes.includes(pageSize) ? pageSize : 'A4', sourceIssueId: sourceIssue?.id ?? null, coverPhotoId: sourcePhotos[0]?.photoId ?? null, createdAt: now, updatedAt: now }).run();
    sourcePhotos.forEach((photo, index) => tx.insert(bookPages).values({ id: randomUUID(), bookId: id, pageNumber: index + 1, photoId: photo.photoId, caption: photo.caption }).run());
    tx.insert(auditLogs).values({ id: randomUUID(), actorId: user.id, action: 'photo_book_created', entityType: 'photo_book', entityId: id, detailsJson: JSON.stringify({ title }), createdAt: now }).run();
  });
  revalidatePath('/photo-books');
  redirect(`/photo-books/${id}/edit`);
}

export async function savePhotoBookAction(id: string, form: FormData) {
  const user = await owner();
  const book = db.select().from(photoBooks).where(eq(photoBooks.id, id)).get();
  if (!book || book.status === 'Archived') throw new Error('Photo Book tidak dapat diedit.');
  const title = value(form, 'title', 150);
  if (!title) throw new Error('Judul wajib diisi.');
  const year = Number(value(form, 'year', 4));
  if (!Number.isInteger(year) || year < 1900 || year > 2200) throw new Error('Tahun tidak valid.');
  const raw = value(form, 'photoIds', 50000);
  let submitted: unknown;
  try { submitted = JSON.parse(raw); } catch { submitted = []; }
  const ids = [...new Set((Array.isArray(submitted) ? submitted : []).filter((item): item is string => typeof item === 'string'))].slice(0, 200);
  const valid = ids.length ? db.select({ id: photos.id }).from(photos).where(and(inArray(photos.id, ids), isNull(photos.deletedAt))).all() : [];
  const validIds = new Set(valid.map(item => item.id));
  if (validIds.size !== ids.length) throw new Error('Ada foto yang tidak tersedia.');
  const viewerPhotos = ids.length ? db.select({ photoId: assets.photoId }).from(assets).where(and(inArray(assets.photoId, ids), eq(assets.type, 'viewer'))).all() : [];
  const needsReview = ids.some(photoId => !viewerPhotos.some(asset => asset.photoId === photoId));
  const template = value(form, 'template', 50);
  const selectedTemplate = resolveTemplate(template);
  const pageSize = value(form, 'pageSize', 20);
  const marginMm = Number(value(form, 'marginMm', 3));
  if (!Number.isInteger(marginMm) || marginMm < 0 || marginMm > 50) throw new Error('Margin harus 0–50 mm.');
  const now = new Date();
  db.transaction(tx => {
    tx.update(photoBooks).set({ title, subtitle: value(form, 'subtitle', 250) || null, photographer: value(form, 'photographer', 120) || user.displayName || user.username, year, description: value(form, 'description', 3000) || null, template: selectedTemplate.name, pageSize: sizes.includes(pageSize) ? pageSize : 'A4', marginMm, coverPhotoId: ids[0] ?? null, status: needsReview ? 'Needs Review' : 'Draft', visibility: 'Private', publishedAt: null, updatedAt: now }).where(eq(photoBooks.id, id)).run();
    tx.delete(bookPages).where(eq(bookPages.bookId, id)).run();
    ids.forEach((photoId, index) => tx.insert(bookPages).values({ id: randomUUID(), bookId: id, pageNumber: index + 1, photoId, caption: value(form, `caption-${photoId}`, 500) || null }).run());
    tx.insert(auditLogs).values({ id: randomUUID(), actorId: user.id, action: 'photo_book_saved', entityType: 'photo_book', entityId: id, createdAt: now }).run();
  });
  revalidatePath('/photo-books'); revalidatePath(`/photo-books/${id}/preview`);
  redirect(`/photo-books/${id}/preview`);
}

export async function publishPhotoBookAction(id: string) {
  const user = await owner();
  const book = db.select().from(photoBooks).where(eq(photoBooks.id, id)).get();
  if (!book || book.status === 'Archived') throw new Error('Photo Book tidak ditemukan.');
  const pages = db.select({ photoId: bookPages.photoId, deletedAt: photos.deletedAt, viewerPath: assets.path }).from(bookPages).leftJoin(photos, eq(photos.id, bookPages.photoId)).leftJoin(assets, and(eq(assets.photoId, photos.id), eq(assets.type, 'viewer'))).where(eq(bookPages.bookId, id)).all();
  if (!book.title.trim() || !book.photographer.trim() || !book.coverPhotoId || !pages.length) throw new Error('Lengkapi judul, fotografer, sampul, dan halaman sebelum publikasi.');
  if (pages.some(page => !page.photoId || page.deletedAt || !page.viewerPath || !existsSync(page.viewerPath))) throw new Error('Ada halaman dengan foto yang tidak tersedia. Periksa buku sebelum publikasi.');
  const now = new Date();
  db.update(photoBooks).set({ status: 'Published', visibility: 'Public', publishedAt: now, updatedAt: now }).where(eq(photoBooks.id, id)).run();
  db.insert(auditLogs).values({ id: randomUUID(), actorId: user.id, action: 'photo_book_published', entityType: 'photo_book', entityId: id, createdAt: now }).run();
  revalidatePath('/photo-books');
  redirect(`/photo-books/${id}/preview`);
}

export async function unpublishPhotoBookAction(id: string) {
  const user = await owner();
  const book = db.select().from(photoBooks).where(eq(photoBooks.id, id)).get();
  if (!book || book.status !== 'Published') throw new Error('Photo Book tidak sedang terbit.');
  db.update(photoBooks).set({ status: 'Draft', visibility: 'Private', publishedAt: null, updatedAt: new Date() }).where(eq(photoBooks.id, id)).run();
  db.insert(auditLogs).values({ id: randomUUID(), actorId: user.id, action: 'photo_book_unpublished', entityType: 'photo_book', entityId: id, createdAt: new Date() }).run();
  revalidatePath('/photo-books');
  redirect(`/photo-books/${id}/preview`);
}

export async function archivePhotoBookAction(id: string) {
  await owner();
  db.update(photoBooks).set({ status: 'Archived', visibility: 'Private', publishedAt: null, updatedAt: new Date() }).where(eq(photoBooks.id, id)).run();
  revalidatePath('/photo-books');
  redirect('/photo-books');
}
