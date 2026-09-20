import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/db';
import { assets, issuePagePhotos, issuePages, issues, photos } from '@/db/schema';
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { saveIssueAction } from '../../actions';
import { IssueEditor } from '@/components/IssueEditor';

export default async function EditIssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issue = db.select().from(issues).where(eq(issues.id, id)).get();
  if (!issue) notFound();
  const pages = db.select({ photoId: issuePagePhotos.photoId, caption: issuePagePhotos.caption, altText: issuePagePhotos.altText }).from(issuePages).innerJoin(issuePagePhotos, eq(issuePagePhotos.pageId, issuePages.id)).where(eq(issuePages.issueId, id)).orderBy(asc(issuePages.pageNumber)).all();
  const available = db.select({ id: photos.id, filename: photos.filename, thumbnailId: assets.id }).from(photos).leftJoin(assets, and(eq(assets.photoId, photos.id), eq(assets.type, 'thumbnail'))).where(isNull(photos.deletedAt)).orderBy(desc(sql`photos.rowid`)).limit(100).all();
  if (issue.status !== 'Draft') return <div className="space-y-4"><Link href="/issues" className="text-[#116a5c]">← Kembali</Link><h1 className="text-2xl font-bold">Issue tidak dapat diedit</h1><p>Hanya Issue berstatus Draft yang dapat disusun.</p></div>;
  return <div className="mx-auto max-w-[1200px] space-y-5 pb-8"><Link href="/issues" className="flex items-center gap-2 text-sm text-[#116a5c]"><ArrowLeft size={17}/>Kembali ke Issue</Link><div><p className="font-mono text-xs font-bold tracking-widest text-[#116a5c]">{issue.code} · DRAFT</p><h1 className="mt-1 text-3xl font-extrabold">Susun Issue</h1><p className="text-sm text-[#65747a]">Foto pertama menjadi sampul. Urutkan foto untuk membentuk halaman.</p></div><IssueEditor issue={{ title: issue.title, subtitle: issue.subtitle ?? '', description: issue.description ?? '' }} available={available} saved={pages} action={saveIssueAction.bind(null, id)}/></div>;
}
