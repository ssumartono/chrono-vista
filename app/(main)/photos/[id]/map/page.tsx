import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { assets, locations, photos } from '@/db/schema';
import { distanceMeters } from '@/lib/photo-map';
import { PhotoMapWorkspace, type MapPhoto } from '@/components/PhotoMapWorkspace';

export default async function PhotoMapPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ locationSaved?: string; locationError?: string; locationDeleted?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const photo = db.select({ id: photos.id, filename: photos.filename, capturedAt: photos.capturedAt }).from(photos).where(and(eq(photos.id, id), isNull(photos.deletedAt))).get();
  if (!photo) notFound();
  const location = db.select().from(locations).where(eq(locations.photoId, id)).get();
  const viewer = db.select({ id: assets.id }).from(assets).where(and(eq(assets.photoId, id), eq(assets.type, 'viewer'))).get();
  const thumb = db.select({ id: assets.id }).from(assets).where(and(eq(assets.photoId, id), eq(assets.type, 'thumbnail'))).get();
  const center = location?.latitude != null && location.longitude != null ? { latitude: location.latitude, longitude: location.longitude } : null;
  const rows = db.select({ id: photos.id, filename: photos.filename, capturedAt: photos.capturedAt, latitude: locations.latitude, longitude: locations.longitude, thumbnailId: assets.id }).from(locations)
    .innerJoin(photos, eq(photos.id, locations.photoId))
    .leftJoin(assets, and(eq(assets.photoId, photos.id), eq(assets.type, 'thumbnail')))
    .where(and(isNull(photos.deletedAt), isNotNull(locations.latitude), isNotNull(locations.longitude))).all();
  const nearby: MapPhoto[] = center ? [...new Map(rows.filter(row => row.id !== id && row.latitude != null && row.longitude != null)
    .map(row => [row.id, { id: row.id, filename: row.filename, date: row.capturedAt?.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' }) ?? 'Tanggal belum ada', latitude: row.latitude!, longitude: row.longitude!, thumbnailUrl: row.thumbnailId ? `/api/assets/${row.thumbnailId}` : null, distance: distanceMeters(center, { latitude: row.latitude!, longitude: row.longitude! }) }])).values()]
    .filter(item => item.distance <= 10000).sort((a, b) => a.distance - b.distance).slice(0, 40) : [];
  const current: MapPhoto = { id, filename: photo.filename, date: photo.capturedAt?.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'short' }) ?? 'Tanggal belum ada', latitude: center?.latitude ?? null, longitude: center?.longitude ?? null, thumbnailUrl: thumb ? `/api/assets/${thumb.id}` : viewer ? `/api/assets/${viewer.id}` : null, distance: 0 };
  return <div className="-mx-7 -mb-5 max-sm:-mx-4"><header className="flex h-12 items-center justify-between border-b border-[#d9dfdc] bg-white px-5"><div className="flex items-center gap-2 text-sm"><Link href="/archive" className="hover:text-[#116a5c]">Arsip Foto</Link><span>/</span><Link href={`/photos/${id}`} className="hover:text-[#116a5c]">Detail Foto</Link><span>/</span><strong>Peta</strong></div><Link href={`/photos/${id}`} className="flex items-center gap-2 rounded border border-[#cbd4d1] px-3 py-1.5 text-xs hover:bg-[#eef5f1]"><ArrowLeft size={15}/>Kembali ke Detail Foto</Link></header><PhotoMapWorkspace current={current} nearby={nearby} label={location?.label ?? ''} hasSavedLocation={Boolean(location)} saved={Boolean(query.locationSaved)} deleted={Boolean(query.locationDeleted)} error={query.locationError ?? null}/></div>;
}
