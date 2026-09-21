import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { assets, bookPages, photoBooks, photos } from '@/db/schema';
import { DERIVATIVES_DIR } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = db.select({ path: assets.path, mime: assets.mime }).from(assets)
    .innerJoin(photos, eq(photos.id, assets.photoId))
    .innerJoin(bookPages, eq(bookPages.photoId, photos.id))
    .innerJoin(photoBooks, eq(photoBooks.id, bookPages.bookId))
    .where(and(eq(assets.id, id), eq(assets.type, 'viewer'), eq(photoBooks.status, 'Published'), eq(photoBooks.visibility, 'Public'), isNull(photos.deletedAt))).limit(1).get();
  if (!asset || !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(asset.mime)) return new Response('Not found', { status: 404 });
  try {
    const root = await realpath(DERIVATIVES_DIR);
    const file = await realpath(path.isAbsolute(asset.path) ? asset.path : path.resolve(process.cwd(), asset.path));
    if (!file.startsWith(root + path.sep)) return new Response('Not found', { status: 404 });
    return new Response(await readFile(file), { headers: { 'Content-Type': asset.mime, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return new Response('Not found', { status: 404 }); }
}
