import { existsSync } from 'node:fs';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { assets, issuePagePhotos, issuePages, issues, photos } from '@/db/schema';

export function publicationChecklist(issueId: string) {
  const issue = db.select().from(issues).where(eq(issues.id, issueId)).get();
  if (!issue) return { issue: null, pages: [], errors: ['Issue tidak ditemukan.'] };
  const pages = db.select({ pageNumber: issuePages.pageNumber, layoutType: issuePages.layoutType, photoId: issuePagePhotos.photoId, altText: issuePagePhotos.altText, viewerId: assets.id, viewerPath: assets.path, deletedAt: photos.deletedAt }).from(issuePages).innerJoin(issuePagePhotos, eq(issuePagePhotos.pageId, issuePages.id)).innerJoin(photos, eq(photos.id, issuePagePhotos.photoId)).leftJoin(assets, and(eq(assets.photoId, photos.id), eq(assets.type, 'viewer'))).where(eq(issuePages.issueId, issueId)).orderBy(asc(issuePages.pageNumber)).all();
  const errors: string[] = [];
  if (!issue.title.trim()) errors.push('Judul Issue wajib diisi.');
  if (!pages.length) errors.push('Tambahkan sedikitnya satu foto.');
  if (pages.length && (pages[0].pageNumber !== 1 || pages[0].layoutType !== 'cover')) errors.push('Halaman pertama harus menjadi sampul.');
  if (pages.some(page => page.deletedAt)) errors.push('Ada foto yang sudah dihapus.');
  if (pages.some(page => !page.viewerId || !page.viewerPath || !existsSync(page.viewerPath))) errors.push('Ada foto tanpa aset viewer yang tersedia.');
  if (pages.some(page => !page.altText?.trim())) errors.push('Lengkapi alt text untuk setiap foto.');
  if (new Set(pages.map(page => page.photoId)).size !== pages.length) errors.push('Satu foto tidak boleh muncul dua kali.');
  return { issue, pages, errors };
}
