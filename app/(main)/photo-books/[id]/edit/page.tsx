import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/db';
import { assets, bookPages, layoutTemplates, photoBooks, photos } from '@/db/schema';
import { PhotoBookEditor } from '@/components/PhotoBookEditor';
import { builtInTemplates } from '@/lib/photo-book-template';
import { savePhotoBookAction } from '../../actions';

export default async function EditPhotoBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = db.select().from(photoBooks).where(eq(photoBooks.id, id)).get();
  if (!book) notFound();
  if (book.status === 'Archived') return <p>Photo Book diarsipkan.</p>;
  const pages = db.select({ photoId: bookPages.photoId, caption: bookPages.caption }).from(bookPages).where(eq(bookPages.bookId, id)).orderBy(asc(bookPages.pageNumber)).all();
  const available = db.select({ id: photos.id, filename: photos.filename, thumbnailId: assets.id }).from(photos).leftJoin(assets, and(eq(assets.photoId, photos.id), eq(assets.type, 'thumbnail'))).where(isNull(photos.deletedAt)).orderBy(desc(sql`photos.rowid`)).limit(250).all();
  const missing = pages.map(page => page.photoId).filter((photoId): photoId is string => Boolean(photoId) && !available.some(photo => photo.id === photoId));
  if (missing.length) available.push(...db.select({ id: photos.id, filename: photos.filename, thumbnailId: assets.id }).from(photos).leftJoin(assets, and(eq(assets.photoId, photos.id), eq(assets.type, 'thumbnail'))).where(and(inArray(photos.id, missing), isNull(photos.deletedAt))).all());
  const custom = db.select({ id: layoutTemplates.id, name: layoutTemplates.name }).from(layoutTemplates).all();
  const templates = [...builtInTemplates.map(item => ({ value: item.name, label: item.name })), ...custom.map(item => ({ value: `custom:${item.id}`, label: `${item.name} (buatan saya)` }))];
  if (!templates.some(item => item.value === book.template)) templates.push({ value: book.template, label: 'Template lama (tidak tersedia)' });
  return <div className="mx-auto max-w-6xl pb-8"><Link href="/photo-books" className="flex items-center gap-2 text-sm text-[#0b6254]"><ArrowLeft size={16}/>Kembali ke Photo Book</Link><h1 className="mt-4 font-serif text-4xl">Susun Photo Book</h1><p className="mb-5 mt-1 text-sm text-[#617078]">{book.title} · {book.status} · {pages.length} halaman</p><PhotoBookEditor book={book} saved={pages} available={available} templates={templates} action={savePhotoBookAction.bind(null, id)}/></div>;
}
