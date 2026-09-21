import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { assets, bookPages, photoBooks, photos } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { buildPhotoBookPdf } from '@/lib/photo-book-pdf';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return new Response('Masuk terlebih dahulu.', { status: 401 });
  const { id } = await params;
  const book = db.select().from(photoBooks).where(eq(photoBooks.id, id)).get();
  if (!book) return new Response('Photo Book tidak ditemukan.', { status: 404 });
  const pages = db.select({ imagePath: assets.path, caption: bookPages.caption }).from(bookPages).innerJoin(photos, eq(photos.id, bookPages.photoId)).innerJoin(assets, and(eq(assets.photoId, photos.id), eq(assets.type, 'viewer'))).where(and(eq(bookPages.bookId, id), isNull(photos.deletedAt))).orderBy(asc(bookPages.pageNumber)).all();
  if (!pages.length) return new Response('Photo Book belum memiliki halaman.', { status: 422 });
  try {
    const pdf = await buildPhotoBookPdf(book, pages);
    return new Response(Buffer.from(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="photo-book-${book.slug}.pdf"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) { console.error('Photo Book PDF:', error); return new Response('PDF gagal dibuat.', { status: 500 }); }
}
