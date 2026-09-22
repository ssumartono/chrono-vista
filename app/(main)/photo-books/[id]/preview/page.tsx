import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, asc, count, eq, isNull } from 'drizzle-orm';
import { ArrowLeft, CheckCircle2, Download, Globe2, Pencil, TriangleAlert } from 'lucide-react';
import { db } from '@/db';
import { assets, bookPages, photoBooks, photos } from '@/db/schema';
import { BookTemplateSpreads } from '@/components/BookTemplateSpreads';
import { loadAppliedTemplate, resolveBookPages } from '@/lib/photo-book-layout';
import { publishPhotoBookAction, unpublishPhotoBookAction } from '../../actions';

export default async function PhotoBookPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = db.select().from(photoBooks).where(eq(photoBooks.id, id)).get();
  if (!book) notFound();
  const photosInBook = db.select({ pageNumber: bookPages.pageNumber, caption: bookPages.caption, filename: photos.filename, assetId: assets.id })
    .from(bookPages).innerJoin(photos, eq(photos.id, bookPages.photoId))
    .leftJoin(assets, and(eq(assets.photoId, photos.id), eq(assets.type, 'viewer')))
    .where(and(eq(bookPages.bookId, id), isNull(photos.deletedAt))).orderBy(asc(bookPages.pageNumber)).all();
  const storedPages = db.select({ value: count() }).from(bookPages).where(eq(bookPages.bookId, id)).get()?.value ?? 0;
  const missing = storedPages - photosInBook.length + photosInBook.filter(page => !page.assetId).length;
  const template = loadAppliedTemplate(book.template);
  const templateMissing = book.template.startsWith('custom:') && !template;
  const layoutPages = template ? resolveBookPages(book, photosInBook, template) : [];
  const outputPageCount = template ? layoutPages.length : photosInBook.length;
  const checks = [
    { okay: !!book.title.trim(), label: 'Judul lengkap' },
    { okay: !!book.photographer.trim(), label: 'Fotografer lengkap' },
    { okay: !!book.coverPhotoId && photosInBook.length > 0, label: 'Sampul dan halaman tersedia' },
    { okay: missing === 0, label: 'Aset foto siap' },
    { okay: !templateMissing, label: 'Template tersedia' },
  ];
  const ready = checks.every(check => check.okay);
  return <div className="mx-auto max-w-6xl pb-10">
    <Link href="/photo-books" className="flex items-center gap-2 text-sm text-[#0b6254]"><ArrowLeft size={16}/>Photo Book</Link>
    <div className="mt-4 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-serif text-4xl">Preview Photo Book</h1><p className="mt-1 text-sm text-[#617078]">{book.title} · {outputPageCount} halaman · {book.pageSize} · {template?.name || book.template}</p></div><div className="flex gap-2"><Link href={`/photo-books/${id}/edit`} className="flex items-center gap-2 rounded border border-[#aec2b8] bg-white px-4 py-2 text-sm"><Pencil size={16}/>Edit Buku</Link>{!templateMissing && <a href={`/api/photo-books/${id}/pdf`} className="flex items-center gap-2 rounded bg-[#075b4d] px-4 py-2 text-sm text-white"><Download size={16}/>Unduh PDF</a>}</div></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px]"><div>{template && photosInBook.length ? <BookTemplateSpreads pages={layoutPages} assetPrefix="/api/assets"/> : photosInBook.length ? <div className="space-y-6">{photosInBook.map((page, index) => <figure key={page.pageNumber} className="mx-auto max-w-[630px] border border-[#d5dfd9] bg-white p-5 shadow-sm" style={{ aspectRatio: book.pageSize === 'Square' ? '1' : book.pageSize === 'A5' ? '148/210' : '210/297' }}><div className="flex h-full flex-col">{index === 0 && <div className="pb-4"><h2 className="font-serif text-3xl">{book.title}</h2><p className="text-sm">{book.photographer} · {book.year}</p></div>}{page.assetId ? <img src={`/api/assets/${page.assetId}`} alt={page.caption || page.filename} className="min-h-0 w-full flex-1 object-contain grayscale"/> : <div className="grid flex-1 place-items-center bg-[#eef1ef] text-sm">Aset tidak tersedia</div>}<figcaption className="flex justify-between gap-3 pt-3 text-sm"><span>{page.caption || page.filename}</span><span>{page.pageNumber} / {photosInBook.length}</span></figcaption></div></figure>)}</div> : <div className="rounded border border-[#d9dfdc] bg-white p-16 text-center text-sm">Belum ada halaman. <Link href={`/photo-books/${id}/edit`} className="text-[#0b6254] underline">Pilih foto dari arsip.</Link></div>}</div>
      <aside className="h-fit rounded border border-[#d9dfdc] bg-white p-5"><h2 className="font-serif text-xl">Pemeriksaan Buku</h2><div className="mt-4 space-y-3 text-sm">{checks.map(check => <p key={check.label} className="flex items-center gap-2">{check.okay ? <CheckCircle2 size={18} className="text-[#0b6254]"/> : <TriangleAlert size={18} className="text-[#a96817]"/>}{check.label}</p>)}</div><div className="mt-5 border-t border-[#d9dfdc] pt-4 text-sm"><p>Status: <strong>{book.status === 'Published' ? 'Dipublikasikan' : book.status}</strong></p><p>Visibilitas: {book.visibility === 'Public' ? 'Publik' : 'Privat'}</p>{template && <p className="mt-2 text-xs text-[#607078]">{photosInBook.length} foto disusun ke {layoutPages.length / 2} spread sesuai frame template.</p>}{book.status === 'Published' ? <><Link href={`/books/${book.slug}`} className="mt-4 flex items-center gap-2 text-[#0b6254]"><Globe2 size={16}/>Buka pembaca publik</Link><form action={unpublishPhotoBookAction.bind(null, id)}><button className="mt-4 w-full rounded border border-[#a96817] px-3 py-2 text-[#945918]">Batalkan Publikasi</button></form></> : <form action={publishPhotoBookAction.bind(null, id)}><button disabled={!ready} className="mt-4 w-full rounded bg-[#075b4d] px-3 py-2 text-white disabled:opacity-40">Publikasikan Photo Book</button></form>}</div></aside>
    </div>
  </div>;
}
