import Link from 'next/link';
import { and, desc, eq, sql } from 'drizzle-orm';
import { ArrowRight, BookOpen } from 'lucide-react';
import { db } from '@/db';
import { issues } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default function PublishedIssuesPage() {
  const coverId = sql<string | null>`(select a.id from issue_pages ip join issue_page_photos ipp on ipp.page_id = ip.id join assets a on a.photo_id = ipp.photo_id and a.type = 'viewer' where ip.issue_id = issues.id order by ip.page_number limit 1)`;
  const items = db.select({ slug: issues.slug, code: issues.code, title: issues.title, subtitle: issues.subtitle, publishedAt: issues.publishedAt, coverId }).from(issues)
    .where(and(eq(issues.status, 'Published'), eq(issues.visibility, 'Public'))).orderBy(desc(issues.publishedAt)).all();
  return <main className="min-h-screen bg-[#fffefa] px-5 py-6 font-serif text-[#172027] sm:px-10 lg:px-16"><header className="flex items-center justify-between border-b border-[#aeb8b3] pb-4"><Link href="/" className="text-3xl font-bold tracking-tight">ChronoVista</Link><Link href="/dashboard" className="flex items-center gap-2 text-sm">Jelajahi Arsip <ArrowRight size={16}/></Link></header><div className="mx-auto max-w-7xl py-12"><p className="font-sans text-[11px] tracking-[.3em] text-[#0b6354]">FOTO · CERITA · MASA DEPAN</p><h1 className="mt-3 text-5xl sm:text-7xl">Issue Terbit</h1><p className="mt-4 max-w-xl text-lg text-[#56616a]">Cerita visual yang telah diterbitkan dari arsip ChronoVista.</p>{items.length ? <div className="mt-12 grid gap-7 sm:grid-cols-2 xl:grid-cols-3">{items.map(item => <Link key={item.slug} href={`/issues/${item.slug}`} className="group border-b border-[#b9c4be] pb-5"><div className="aspect-[16/10] overflow-hidden bg-[#e7ece8]">{item.coverId ? <img src={`/api/public-assets/${item.coverId}`} alt="" className="h-full w-full object-cover grayscale transition-transform group-hover:scale-105"/> : <BookOpen className="m-auto mt-20 text-[#698078]" size={45}/>}</div><p className="mt-4 font-sans text-[11px] tracking-[.2em] text-[#0b6354]">{item.code} · {item.publishedAt?.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })}</p><h2 className="mt-1 text-2xl">{item.title}</h2><p className="mt-2 text-sm text-[#56616a]">{item.subtitle}</p><span className="mt-4 flex items-center gap-2 text-sm text-[#075b4d]">Baca Issue <ArrowRight size={15}/></span></Link>)}</div> : <div className="mt-12 border border-[#d1d9d4] p-12 text-center"><BookOpen className="mx-auto text-[#71867e]" size={36}/><p className="mt-4">Belum ada Issue publik yang terbit.</p></div>}</div></main>;
}
