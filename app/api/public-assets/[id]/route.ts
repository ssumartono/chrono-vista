import { db } from '@/db';
import { assets, issuePagePhotos, issuePages, issues, photos } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { DERIVATIVES_DIR } from '@/lib/storage';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = db.select({ path: assets.path, mime: assets.mime }).from(assets)
    .innerJoin(photos, eq(photos.id, assets.photoId))
    .innerJoin(issuePagePhotos, eq(issuePagePhotos.photoId, photos.id))
    .innerJoin(issuePages, eq(issuePages.id, issuePagePhotos.pageId))
    .innerJoin(issues, eq(issues.id, issuePages.issueId))
    .where(and(eq(assets.id, id), eq(assets.type, 'viewer'), eq(issues.status, 'Published'), eq(issues.visibility, 'Public'), isNull(photos.deletedAt))).limit(1).get();
  if (!asset || !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(asset.mime)) return new Response('Not found', { status: 404 });
  try {
    const root = await realpath(DERIVATIVES_DIR);
    const resolved = await realpath(path.isAbsolute(asset.path) ? asset.path : path.resolve(process.cwd(), asset.path));
    if (!resolved.startsWith(root + path.sep)) return new Response('Not found', { status: 404 });
    return new Response(await readFile(resolved), { headers: { 'Content-Type': asset.mime, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return new Response('Not found', { status: 404 }); }
}
