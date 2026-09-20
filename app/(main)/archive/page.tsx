import { and, desc, eq, isNull, like, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { assets, exifMetadata, locations, photos } from '@/db/schema';
import { ArchiveWorkspace, type ArchivePhoto } from '@/components/ArchiveWorkspace';

type SearchParams = { q?: string; status?: string; year?: string; camera?: string; location?: string; sort?: string; view?: string; page?: string };
const hasIssue = sql<boolean>`exists(select 1 from issue_page_photos ipp where ipp.photo_id = ${photos.id})`;

export default async function ArchivePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const q = (query.q ?? '').trim().slice(0, 100);
  const status = ['review', 'ready', 'private', 'no-issue'].includes(query.status ?? '') ? query.status! : '';
  const year = /^\d{4}$/.test(query.year ?? '') ? query.year! : '';
  const camera = (query.camera ?? '').trim().slice(0, 80);
  const location = (query.location ?? '').trim().slice(0, 80);
  const sort = query.sort === 'oldest' ? 'oldest' : 'newest';
  const view = ['grid', 'compact', 'list'].includes(query.view ?? '') ? query.view! : 'grid';
  const page = Math.max(1, Math.min(10000, Number.parseInt(query.page ?? '1', 10) || 1));
  const statusFilter = status === 'review' ? eq(photos.status, 'Need Review') : status === 'ready' ? eq(photos.status, 'Ready') : status === 'private' ? eq(photos.visibility, 'Private') : status === 'no-issue' ? sql`not ${hasIssue}` : undefined;
  const where = and(isNull(photos.deletedAt), q ? or(like(photos.filename, `%${q}%`), like(locations.label, `%${q}%`), like(exifMetadata.camera, `%${q}%`)) : undefined, statusFilter, year ? sql`strftime('%Y', ${photos.capturedAt}, 'unixepoch') = ${year}` : undefined, camera ? like(exifMetadata.camera, `%${camera}%`) : undefined, location ? like(locations.label, `%${location}%`) : undefined);
  const base = db.select({ id: photos.id }).from(photos).leftJoin(exifMetadata, eq(exifMetadata.photoId, photos.id)).leftJoin(locations, eq(locations.photoId, photos.id)).where(where);
  const total = db.select({ value: sql<number>`count(*)` }).from(base.as('archive_filter')).get()?.value ?? 0;
  const rows = db.select({ id: photos.id, filename: photos.filename, capturedAt: photos.capturedAt, status: photos.status, visibility: photos.visibility, assetId: assets.id, location: locations.label, latitude: locations.latitude, longitude: locations.longitude, camera: exifMetadata.camera, lens: exifMetadata.lens, iso: exifMetadata.iso, aperture: exifMetadata.aperture, shutter: exifMetadata.shutter, focal: exifMetadata.focal, inIssue: hasIssue }).from(photos).leftJoin(assets, and(eq(assets.photoId, photos.id), eq(assets.type, 'thumbnail'))).leftJoin(locations, eq(locations.photoId, photos.id)).leftJoin(exifMetadata, eq(exifMetadata.photoId, photos.id)).where(where).orderBy(sort === 'oldest' ? sql`${photos.capturedAt} asc` : desc(photos.capturedAt), desc(photos.id)).limit(50).offset((page - 1) * 50).all();
  const items: ArchivePhoto[] = rows.map(row => ({ ...row, capturedAt: row.capturedAt?.toISOString() ?? null, thumbnailUrl: row.assetId ? `/api/assets/${row.assetId}` : null }));
  const stats = db.select({ total: sql<number>`count(*)`, review: sql<number>`sum(case when ${photos.status} = 'Need Review' then 1 else 0 end)`, privateCount: sql<number>`sum(case when ${photos.visibility} = 'Private' then 1 else 0 end)`, noIssue: sql<number>`sum(case when not ${hasIssue} then 1 else 0 end)` }).from(photos).where(isNull(photos.deletedAt)).get();
  const years = db.select({ year: sql<string>`strftime('%Y', ${photos.capturedAt}, 'unixepoch')`, count: sql<number>`count(*)` }).from(photos).where(and(isNull(photos.deletedAt), sql`${photos.capturedAt} is not null`)).groupBy(sql`strftime('%Y', ${photos.capturedAt}, 'unixepoch')`).orderBy(desc(sql`strftime('%Y', ${photos.capturedAt}, 'unixepoch')`)).all();
  return <ArchiveWorkspace items={items} total={total} stats={{ total: stats?.total ?? 0, review: stats?.review ?? 0, privateCount: stats?.privateCount ?? 0, noIssue: stats?.noIssue ?? 0 }} years={years} filters={{ q, status, year, camera, location, sort, view, page }} />;
}
