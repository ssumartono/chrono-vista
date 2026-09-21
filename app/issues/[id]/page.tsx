import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Aperture, ArrowLeft } from 'lucide-react';
import { db } from '@/db';
import { assets, exifMetadata, issuePagePhotos, issuePages, issues, photos, users } from '@/db/schema';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { publicMetadataPhotoIds } from '@/lib/photo-public-metadata';
import { getAppPreferences } from '@/lib/app-preferences';

export default async function PublicIssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;
  const issue = db.select().from(issues).where(and(eq(issues.slug, slug), eq(issues.status, 'Published'), eq(issues.visibility, 'Public'))).get();
  if (!issue) notFound();
  const pages = db.select({
    photoId: photos.id,
    pageNumber: issuePages.pageNumber,
    caption: issuePagePhotos.caption,
    altText: issuePagePhotos.altText,
    assetId: assets.id,
    capturedAt: photos.capturedAt,
    camera: exifMetadata.camera,
    lens: exifMetadata.lens,
    aperture: exifMetadata.aperture,
    shutter: exifMetadata.shutter,
    iso: exifMetadata.iso,
    focal: exifMetadata.focal,
  }).from(issuePages)
    .innerJoin(issuePagePhotos, eq(issuePagePhotos.pageId, issuePages.id))
    .innerJoin(photos, eq(photos.id, issuePagePhotos.photoId))
    .innerJoin(assets, and(eq(assets.photoId, photos.id), eq(assets.type, 'viewer')))
    .leftJoin(exifMetadata, eq(exifMetadata.photoId, photos.id))
    .where(and(eq(issuePages.issueId, issue.id), isNull(photos.deletedAt)))
    .orderBy(asc(issuePages.pageNumber)).all();
  const metadataPublic = publicMetadataPhotoIds(pages.map(page => page.photoId));
  const showCameraLens = getAppPreferences().showCameraLens;
  const author = db.select({ displayName: users.displayName, username: users.username }).from(users).limit(1).get();
  return <main className="min-h-screen bg-[#f7f6f1] text-[#192326]">
    <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-[#d7deda] px-5 py-5"><Link href="/" className="flex items-center gap-2 text-lg font-bold"><Aperture size={27}/>ChronoVista</Link><Link href="/" className="flex items-center gap-2 text-sm text-[#116a5c]"><ArrowLeft size={16}/>Beranda</Link></header>
    <div className="mx-auto max-w-4xl px-5 pb-18">
      <div className="py-14 text-center"><p className="font-mono text-xs font-semibold tracking-[.25em] text-[#116a5c]">{issue.code} · FINAL ISSUE</p><h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">{issue.title}</h1>{issue.subtitle && <p className="mt-4 text-lg text-[#68777a]">{issue.subtitle}</p>}<p className="mt-5 text-sm text-[#657579]">{author?.displayName || author?.username || 'ChronoVista'}{issue.publishedAt && ` · ${issue.publishedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}</p>{issue.description && <p className="mx-auto mt-6 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-[#4d5e61]">{issue.description}</p>}</div>
      <div className="space-y-16">{pages.map(page => {
        const showMetadata = metadataPublic.has(page.photoId);
        const details = [page.capturedAt?.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), showCameraLens ? page.camera : null, showCameraLens ? page.lens : null, page.aperture, page.shutter, page.iso ? `ISO ${page.iso}` : null, page.focal].filter(Boolean);
        return <figure key={page.pageNumber}><div className="flex min-h-70 items-center justify-center bg-[#202525]"><img src={`/api/public-assets/${page.assetId}`} alt={page.altText || ''} className="max-h-[85vh] max-w-full object-contain"/></div><figcaption className="mt-3 flex items-start justify-between gap-4 text-sm"><span>{page.caption || ''}</span><span className="font-mono text-xs text-[#788884]">{String(page.pageNumber).padStart(2, '0')}</span></figcaption>{showMetadata && details.length > 0 && <p className="mt-2 text-xs text-[#657579]">{details.join(' · ')}</p>}</figure>;
      })}</div>
      <footer className="mt-18 border-t border-[#d7deda] pt-5 text-center font-mono text-xs tracking-widest text-[#71817d]">CHRONOVISTA · SETIAP FOTO PUNYA CERITA</footer>
    </div>
  </main>;
}
