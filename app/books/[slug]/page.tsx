import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { db } from '@/db';
import { assets, bookPages, photoBooks, photos } from '@/db/schema';
import { BookTemplateSpreads } from '@/components/BookTemplateSpreads';
import { loadAppliedTemplate, resolveBookPages } from '@/lib/photo-book-layout';

export const dynamic = 'force-dynamic';

export default async function PublicPhotoBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = db.select().from(photoBooks).where(and(eq(photoBooks.slug, slug), eq(photoBooks.status, 'Published'), eq(photoBooks.visibility, 'Public'))).get();
  if (!book) notFound();
  const pages = db.select({ pageNumber: bookPages.pageNumber, caption: bookPages.caption, filename: photos.filename, assetId: assets.id }).from(bookPages).innerJoin(photos, eq(photos.id, bookPages.photoId)).innerJoin(assets, and(eq(assets.photoId, photos.id), eq(assets.type, 'viewer'))).where(and(eq(bookPages.bookId, book.id), isNull(photos.deletedAt))).orderBy(asc(bookPages.pageNumber)).all();
  const template = loadAppliedTemplate(book.template);
  if (book.template.startsWith('custom:') && !template) notFound();
  const layoutPages = template ? resolveBookPages(book, pages, template) : [];
  return <main className="min-h-screen bg-[#fffefa] px-5 pb-15 font-serif text-[#172027] sm:px-10">
    <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-[#aeb8b3] py-5"><Link href="/" className="text-3xl font-bold tracking-tight">ChronoVista</Link><Link href="/published" className="flex items-center gap-2 text-sm"><ArrowLeft size={17}/>Beranda</Link></header>
    <section className="mx-auto max-w-3xl py-14 text-center"><BookOpen className="mx-auto text-[#0b6254]" size={32}/><p className="mt-4 font-sans text-[11px] tracking-[.25em] text-[#0b6254]">PHOTO BOOK · {book.year}</p><h1 className="mt-3 text-5xl leading-tight sm:text-7xl">{book.title}</h1>{book.subtitle && <p className="mt-4 text-xl text-[#52616a]">{book.subtitle}</p>}<p className="mt-4 text-sm">Foto oleh {book.photographer}</p>{book.description && <p className="mt-7 whitespace-pre-wrap text-base leading-7 text-[#52616a]">{book.description}</p>}</section>
    {template ? <BookTemplateSpreads pages={layoutPages} assetPrefix="/api/book-assets"/> : <div className="mx-auto max-w-3xl space-y-18">{pages.map(page => <figure key={page.pageNumber} className="scroll-mt-8" id={`page-${page.pageNumber}`}><div className="bg-[#e7ebe8] p-3 sm:p-7"><img src={`/api/book-assets/${page.assetId}`} alt={page.caption || page.filename} className="mx-auto max-h-[82vh] w-auto max-w-full object-contain grayscale"/></div><figcaption className="mt-3 flex justify-between gap-4 text-sm"><span>{page.caption || ''}</span><span>{page.pageNumber} / {pages.length}</span></figcaption></figure>)}</div>}
    <footer className="mx-auto mt-20 max-w-6xl border-t border-[#aeb8b3] py-5 text-center text-xs tracking-widest">CHRONOVISTA · FOTO. CERITA. MASA DEPAN.</footer>
  </main>;
}
