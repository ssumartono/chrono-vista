import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { assets, photos } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { DERIVATIVES_DIR, ORIGINALS_DIR } from '@/lib/storage';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  const asset = db.select({ path: assets.path, mime: assets.mime, type: assets.type, filename: photos.filename }).from(assets).innerJoin(photos, eq(assets.photoId, photos.id)).where(and(eq(assets.id, id), isNull(photos.deletedAt))).get();
  if (!asset) return new Response('Not found', { status: 404 });
  const download = new URL(request.url).searchParams.get('download') === '1';
  if (asset.type === 'original' && !download) return new Response('Not found', { status: 404 });
  if (!['original', 'viewer', 'thumbnail'].includes(asset.type)) return new Response('Not found', { status: 404 });
  if (asset.type !== 'original' && !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(asset.mime)) return new Response('Not found', { status: 404 });
  try {
    const root = await realpath(asset.type === 'original' ? ORIGINALS_DIR : DERIVATIVES_DIR);
    const filename = path.isAbsolute(asset.path) ? asset.path : path.resolve(process.cwd(), asset.path);
    const resolved = await realpath(filename);
    if (!resolved.startsWith(root + path.sep)) return new Response('Not found', { status: 404 });
    const data = await readFile(resolved);
    return new Response(data, { headers: { 'Content-Type': asset.type === 'original' ? 'application/octet-stream' : asset.mime, 'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff', ...(download ? { 'Content-Disposition': `attachment; filename="${asset.filename.replace(/["\r\n]/g, '_')}"` } : {}) } });
  } catch { return new Response('Not found', { status: 404 }); }
}
