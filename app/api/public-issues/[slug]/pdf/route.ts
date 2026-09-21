import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { assets, issuePagePhotos, issuePages, issues, photos } from '@/db/schema';
import { buildIssuePdf } from '@/lib/issue-pdf';
import { getIssuePdfMargins } from '@/lib/issue-pdf-settings';
import { DERIVATIVES_DIR } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const issue = db.select().from(issues).where(and(eq(issues.slug, slug), eq(issues.status, 'Published'), eq(issues.visibility, 'Public'))).get();
  if (!issue) return new Response('Issue tidak ditemukan.', { status: 404 });
  const pages = db.select({ imagePath: assets.path, caption: issuePagePhotos.caption, filename: photos.filename })
    .from(issuePages).innerJoin(issuePagePhotos, eq(issuePagePhotos.pageId, issuePages.id))
    .innerJoin(photos, eq(photos.id, issuePagePhotos.photoId))
    .innerJoin(assets, and(eq(assets.photoId, photos.id), eq(assets.type, 'viewer')))
    .where(and(eq(issuePages.issueId, issue.id), isNull(photos.deletedAt))).orderBy(asc(issuePages.pageNumber)).all();
  if (!pages.length) return new Response('Issue tidak memiliki halaman.', { status: 404 });
  try {
    const bytes = await buildIssuePdf({ code: issue.code, title: issue.title, subtitle: issue.subtitle, pages, assetRoot: DERIVATIVES_DIR, margins: getIssuePdfMargins(issue.id) });
    return new Response(Buffer.from(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${issue.code}.pdf"`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) {
    console.error('Public PDF export:', error);
    return new Response('PDF gagal dibuat.', { status: 500 });
  }
}
