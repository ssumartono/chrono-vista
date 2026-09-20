'use server';

import { randomUUID } from 'node:crypto';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { issuePagePhotos, issuePages, issues, photos } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { publicationChecklist } from '@/lib/issue-publication';
import { parseJakartaSchedule } from '@/lib/issue-schedule';
import { saveIssuePdfMargins, validPdfMargin } from '@/lib/issue-pdf-settings';

async function owner() { if (!await getSession()) throw new Error('Sesi berakhir. Masuk kembali.'); }
const value = (form: FormData, key: string, limit: number) => String(form.get(key) ?? '').trim().slice(0, limit);

export async function createIssueAction(form: FormData) {
  await owner();
  const title = value(form, 'title', 150);
  if (!title) throw new Error('Judul Issue wajib diisi.');
  const initialPhotoId = value(form, 'photoId', 100);
  const id = randomUUID();
  db.transaction(tx => {
    const highest = tx.select({ value: sql<number>`coalesce(max(cast(substr(${issues.code}, 4) as integer)), 0)` }).from(issues).get()?.value ?? 0;
    const code = `FI_${String(highest + 1).padStart(3, '0')}`;
    const slugBase = title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'issue';
    tx.insert(issues).values({ id, code, slug: `${slugBase}-${code.toLowerCase()}`, title, status: 'Draft', visibility: 'Private' }).run();
    if (initialPhotoId) {
      const photo = tx.select({ id: photos.id, filename: photos.filename }).from(photos).where(and(eq(photos.id, initialPhotoId), isNull(photos.deletedAt))).get();
      if (!photo) throw new Error('Foto sampul tidak ditemukan.');
      const pageId = randomUUID();
      tx.insert(issuePages).values({ id: pageId, issueId: id, pageNumber: 1, layoutType: 'cover' }).run();
      tx.insert(issuePagePhotos).values({ pageId, photoId: photo.id, position: 1, altText: photo.filename }).run();
    }
  });
  revalidatePath('/issues');
  redirect(`/issues/${id}/edit`);
}

export async function saveIssueAction(id: string, form: FormData) {
  await owner();
  const issue = db.select().from(issues).where(eq(issues.id, id)).get();
  if (!issue || issue.status !== 'Draft') throw new Error('Hanya draft yang dapat diedit.');
  const title = value(form, 'title', 150);
  if (!title) throw new Error('Judul Issue wajib diisi.');
  let submitted: unknown = [];
  try { submitted = JSON.parse(value(form, 'photoIds', 50000)); } catch {}
  const ids = [...new Set((Array.isArray(submitted) ? submitted : []).filter((item): item is string => typeof item === 'string'))].slice(0, 100);
  db.transaction(tx => {
    tx.update(issues).set({ title, subtitle: value(form, 'subtitle', 250) || null, description: value(form, 'description', 5000) || null }).where(eq(issues.id, id)).run();
    const oldPages = tx.select({ id: issuePages.id }).from(issuePages).where(eq(issuePages.issueId, id)).all();
    if (oldPages.length) tx.delete(issuePagePhotos).where(inArray(issuePagePhotos.pageId, oldPages.map(page => page.id))).run();
    tx.delete(issuePages).where(eq(issuePages.issueId, id)).run();
    ids.forEach((photoId, index) => {
      const photo = tx.select({ id: photos.id }).from(photos).where(and(eq(photos.id, photoId), isNull(photos.deletedAt))).get();
      if (!photo) return;
      const pageId = randomUUID();
      tx.insert(issuePages).values({ id: pageId, issueId: id, pageNumber: index + 1, layoutType: index === 0 ? 'cover' : 'single' }).run();
      tx.insert(issuePagePhotos).values({ pageId, photoId, position: 1, caption: value(form, `caption-${photoId}`, 500) || null, altText: value(form, `alt-${photoId}`, 500) || null }).run();
    });
  });
  revalidatePath('/issues'); revalidatePath(`/issues/${id}/edit`); revalidatePath(`/issues/${id}/preview`);
  redirect('/issues');
}

export async function saveIssuePdfLayoutAction(id: string, form: FormData) {
  await owner();
  const issue = db.select({ id: issues.id, slug: issues.slug }).from(issues).where(eq(issues.id, id)).get();
  if (!issue) throw new Error('Issue tidak ditemukan.');
  const margin = (side: 'top' | 'right' | 'bottom' | 'left') => validPdfMargin(form.get(`margin-${side}`));
  const top = margin('top'), right = margin('right'), bottom = margin('bottom'), left = margin('left');
  if (top === null || right === null || bottom === null || left === null) throw new Error('Margin harus antara 5–50 mm.');
  const pages = db.select({ pageId: issuePages.id }).from(issuePages).where(eq(issuePages.issueId, id)).all();
  db.transaction(tx => {
    for (const page of pages) {
      const caption = value(form, `caption-${page.pageId}`, 500);
      tx.update(issuePagePhotos).set({ caption: caption || null }).where(eq(issuePagePhotos.pageId, page.pageId)).run();
    }
  });
  saveIssuePdfMargins(id, { top, right, bottom, left });
  revalidatePath(`/issues/${id}/preview`); revalidatePath(`/issues/${issue.slug}`);
  redirect(`/issues/${id}/preview?pdfSaved=${Date.now()}`);
}

export async function publishIssueAction(id: string) {
  await owner();
  const check = publicationChecklist(id);
  if (!check.issue || !['Draft', 'Unpublished'].includes(check.issue.status) || check.errors.length) throw new Error(check.errors.join(' ') || 'Issue tidak dapat diterbitkan.');
  db.update(issues).set({ status: 'Published', visibility: 'Public', publishedAt: new Date(), scheduledAt: null }).where(eq(issues.id, id)).run();
  revalidatePath('/issues'); revalidatePath(`/issues/${id}/preview`); revalidatePath(`/issues/${check.issue.slug}`);
  redirect(`/issues/${id}/preview`);
}

export async function scheduleIssueAction(id: string, form: FormData) {
  await owner();
  const check = publicationChecklist(id);
  if (!check.issue || !['Draft', 'Unpublished'].includes(check.issue.status) || check.errors.length) throw new Error(check.errors.join(' ') || 'Issue tidak dapat dijadwalkan.');
  const submittedAt = value(form, 'scheduledAt', 16);
  let scheduledAt: Date;
  try {
    scheduledAt = parseJakartaSchedule(submittedAt);
  } catch {
    redirect(`/issues/${id}/preview?scheduleError=invalid&scheduledAt=${encodeURIComponent(submittedAt)}`);
  }
  db.update(issues).set({ status: 'Scheduled', visibility: 'Private', scheduledAt }).where(eq(issues.id, id)).run();
  revalidatePath('/issues'); revalidatePath(`/issues/${id}/preview`);
  redirect(`/issues/${id}/preview`);
}

export async function cancelIssueScheduleAction(id: string) {
  await owner();
  const issue = db.select().from(issues).where(eq(issues.id, id)).get();
  if (!issue || issue.status !== 'Scheduled') throw new Error('Issue tidak sedang dijadwalkan.');
  db.update(issues).set({ status: 'Draft', scheduledAt: null }).where(eq(issues.id, id)).run();
  revalidatePath('/issues'); revalidatePath(`/issues/${id}/preview`);
  redirect(`/issues/${id}/preview`);
}

export async function unpublishIssueAction(id: string) {
  await owner();
  const issue = db.select().from(issues).where(eq(issues.id, id)).get();
  if (!issue || issue.status !== 'Published') throw new Error('Issue tidak sedang diterbitkan.');
  db.update(issues).set({ status: 'Unpublished', visibility: 'Private' }).where(eq(issues.id, id)).run();
  revalidatePath('/issues'); revalidatePath(`/issues/${id}/preview`); revalidatePath(`/issues/${issue.slug}`);
  redirect(`/issues/${id}/preview`);
}
