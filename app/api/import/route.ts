import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { assets, exifMetadata, importItems, importSessions, photos } from '@/db/schema';
import { resolvePhotoDate } from '@/lib/photo-date';
import { eq } from 'drizzle-orm';
import { DERIVATIVES_DIR, ORIGINALS_DIR, ensureStorageDirectories } from '@/lib/storage';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const maxFileBytes = 25 * 1024 * 1024;
const maxBatchBytes = 100 * 1024 * 1024;
const formats: Record<string, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export async function POST(request: Request) {
  if (!await getSession()) return Response.json({ error: 'Sesi berakhir. Masuk kembali.' }, { status: 401 });
  const size = Number(request.headers.get('content-length') ?? 0);
  if (size > maxBatchBytes + 1024 * 1024) return Response.json({ error: 'Total file maksimal 100 MB.' }, { status: 413 });
  let files: File[];
  try { const form = await request.formData(); files = form.getAll('files').filter((value): value is File => value instanceof File); }
  catch { return Response.json({ error: 'Berkas unggahan tidak valid.' }, { status: 400 }); }
  if (!files.length || files.length > 50 || files.reduce((sum, file) => sum + file.size, 0) > maxBatchBytes) return Response.json({ error: 'Pilih 1–50 foto, total maksimal 100 MB.' }, { status: 400 });
  ensureStorageDirectories();
  const sessionId = randomUUID();
  const startedAt = new Date();
  db.insert(importSessions).values({ id: sessionId, source: 'Browser upload', status: 'Processing', startedAt }).run();
  const results: { filename: string; status: string; message?: string }[] = [];
  let imported = 0, duplicate = 0, failed = 0;
  for (const file of files) {
    const itemId = randomUUID();
    let photoId: string | null = null;
    let status = 'Failed';
    let errorCode: string | null = null;
    let message: string | undefined;
    const written: string[] = [];
    try {
      if (!file.size || file.size > maxFileBytes) throw new Error('Ukuran file harus 1 byte–25 MB.');
      const input = Buffer.from(await file.arrayBuffer());
      const metadata = await sharp(input, { failOn: 'error' }).metadata();
      const photoDate = resolvePhotoDate(metadata.exif, file.lastModified);
      const mime = metadata.format ? formats[metadata.format] : undefined;
      if (!mime) throw new Error('Hanya JPEG, PNG, dan WebP yang didukung.');
      const checksum = createHash('sha256').update(input).digest('hex');
      const existing = db.select({ id: photos.id }).from(photos).where(eq(photos.checksum, checksum)).get();
      if (existing) { status = 'Duplicate'; photoId = existing.id; duplicate++; message = 'Duplikat identik dilewati.'; }
      else {
        photoId = randomUUID();
        const date = new Date();
        const directory = path.join(String(date.getFullYear()), String(date.getMonth() + 1).padStart(2, '0'));
        const originalsPath = path.join(ORIGINALS_DIR, directory);
        const derivativePath = path.join(DERIVATIVES_DIR, directory);
        await mkdir(originalsPath, { recursive: true }); await mkdir(derivativePath, { recursive: true });
        const extension = metadata.format === 'jpeg' ? '.jpg' : `.${metadata.format}`;
        const originalPath = path.join(originalsPath, `${photoId}${extension}`);
        const viewerPath = path.join(derivativePath, `${photoId}-viewer.webp`);
        const thumbnailPath = path.join(derivativePath, `${photoId}-thumb.webp`);
        const viewer = await sharp(input).rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
        const thumbnail = await sharp(input).rotate().resize({ width: 480, height: 480, fit: 'cover' }).webp({ quality: 76 }).toBuffer();
        await writeFile(originalPath, input, { flag: 'wx' }); written.push(originalPath);
        await writeFile(viewerPath, viewer, { flag: 'wx' }); written.push(viewerPath);
        await writeFile(thumbnailPath, thumbnail, { flag: 'wx' }); written.push(thumbnailPath);
        db.transaction(tx => {
          tx.insert(photos).values({ id: photoId!, filename: path.basename(file.name).slice(0, 255), checksum, capturedAt: photoDate.date, status: photoDate.source === 'exif' && !photoDate.timezoneAssumed ? 'Ready' : 'Need Review', visibility: 'Private' }).run();
          tx.insert(exifMetadata).values({ photoId: photoId!, rawJson: JSON.stringify({ dateSource: photoDate.source, originalDate: photoDate.original, offset: photoDate.offset, timezoneAssumed: photoDate.timezoneAssumed }) }).run();
          tx.insert(assets).values([
            { id: randomUUID(), photoId: photoId!, type: 'original', path: originalPath, mime, width: metadata.width, height: metadata.height, bytes: input.length, checksum },
            { id: randomUUID(), photoId: photoId!, type: 'viewer', path: viewerPath, mime: 'image/webp', bytes: viewer.length },
            { id: randomUUID(), photoId: photoId!, type: 'thumbnail', path: thumbnailPath, mime: 'image/webp', bytes: thumbnail.length },
          ]).run();
        });
        status = 'Imported'; imported++; message = photoDate.source === 'exif' ? photoDate.timezoneAssumed ? 'Tanggal EXIF dibaca; zona waktu diasumsikan Asia/Jakarta.' : 'Tanggal pengambilan dibaca dari EXIF.' : 'EXIF tanpa tanggal; waktu modifikasi file digunakan dan perlu diperiksa.';
      }
    } catch (error) {
      failed++; errorCode = 'IMPORT-FAILED'; message = error instanceof Error ? error.message : 'Gagal memproses file.';
      for (const filename of written) await rm(filename, { force: true }).catch(() => {});
      photoId = null;
    }
    db.insert(importItems).values({ id: itemId, sessionId, sourcePath: path.basename(file.name).slice(0, 255), photoId, status, errorCode, detailsJson: JSON.stringify({ message }) }).run();
    results.push({ filename: file.name, status, message });
  }
  db.update(importSessions).set({ status: failed ? 'CompletedWithWarnings' : 'Completed', completedAt: new Date(), totalsJson: JSON.stringify({ imported, duplicate, failed }) }).where(eq(importSessions.id, sessionId)).run();
  return Response.json({ sessionId, imported, duplicate, failed, results });
}
