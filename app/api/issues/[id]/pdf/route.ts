import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { assets, issuePagePhotos, issuePages, issues, photos } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { buildIssuePdf } from '@/lib/issue-pdf';
import { DERIVATIVES_DIR } from '@/lib/storage';
import { getIssuePdfMargins } from '@/lib/issue-pdf-settings';

export const runtime = 'nodejs';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return new Response('Masuk terlebih dahulu.', { status: 401 });
  const { id } = await context.params;
  const issue = db.select().from(issues).where(eq(issues.id, id)).get();
  if (!issue) return new Response('Issue tidak ditemukan.', { status: 404 });
  const pages = db.select({ imagePath: assets.path, caption: issuePagePhotos.caption, filename: photos.filename }).from(issuePages).innerJoin(issuePagePhotos, eq(issuePagePhotos.pageId, issuePages.id)).innerJoin(photos, eq(photos.id, issuePagePhotos.photoId)).innerJoin(assets, and(eq(assets.photoId, photos.id), eq(assets.type, 'viewer'))).where(eq(issuePages.issueId, id)).orderBy(asc(issuePages.pageNumber)).all();
  if (!pages.length) return new Response('Issue belum memiliki halaman.', { status: 422 });
  try {
    const bytes = await buildIssuePdf({ code: issue.code, title: issue.title, subtitle: issue.subtitle, pages, assetRoot: DERIVATIVES_DIR, margins: getIssuePdfMargins(id) });
    const disposition = new URL(request.url).searchParams.get('view') === '1' ? 'inline' : 'attachment';
    return new Response(Buffer.from(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `${disposition}; filename="${issue.code}.pdf"`, 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('PDF export:', error);
    return new Response('PDF gagal dibuat. Periksa aset viewer.', { status: 500 });
  }
}
