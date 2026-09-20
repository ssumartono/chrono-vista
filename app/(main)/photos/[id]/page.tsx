import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, ImageIcon, LockKeyhole, MapPin } from 'lucide-react';
import { db } from '@/db';
import { assets, exifMetadata, issuePagePhotos, locations, photos } from '@/db/schema';
import { and, asc, eq, gte, isNull, lt, sql } from 'drizzle-orm';
import { PhotoViewer } from '@/components/PhotoViewer';

const panel = 'rounded-md border border-[#d9dfdc] bg-white';
function dateParts(date: Date | null) { return date ? { date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) } : { date: 'Tanggal belum ada', time: '' }; }

export default async function PhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = db.select().from(photos).where(and(eq(photos.id, id), isNull(photos.deletedAt))).get();
  if (!photo) notFound();
  const photoAssets = db.select().from(assets).where(eq(assets.photoId, id)).all();
  const viewer = photoAssets.find(asset => asset.type === 'viewer') ?? photoAssets.find(asset => asset.type === 'thumbnail');
  const original = photoAssets.find(asset => asset.type === 'original');
  const exif = db.select().from(exifMetadata).where(eq(exifMetadata.photoId, id)).get();
  const location = db.select().from(locations).where(eq(locations.photoId, id)).get();
  const issueCount = db.select({ value: sql<number>`count(*)` }).from(issuePagePhotos).where(eq(issuePagePhotos.photoId, id)).get()?.value ?? 0;
  const ordered = db.select({ id: photos.id, capturedAt: photos.capturedAt }).from(photos).where(isNull(photos.deletedAt)).orderBy(asc(photos.capturedAt), asc(photos.id)).all();
  const index = ordered.findIndex(item => item.id === id);
  const previous = index > 0 ? ordered[index - 1] : null;
  const next = index < ordered.length - 1 ? ordered[index + 1] : null;
  const start = photo.capturedAt ? new Date(photo.capturedAt.getFullYear(), photo.capturedAt.getMonth(), photo.capturedAt.getDate()) : null;
  const end = start ? new Date(start.getTime() + 86400000) : null;
  const sameDay = start && end ? db.select({ id: photos.id, filename: photos.filename }).from(photos).where(and(isNull(photos.deletedAt), gte(photos.capturedAt, start), lt(photos.capturedAt, end))).orderBy(asc(photos.capturedAt), asc(photos.id)).limit(12).all() : [];
  const thumbnails = sameDay.map(item => ({ ...item, assetId: db.select({ id: assets.id }).from(assets).where(and(eq(assets.photoId, item.id), eq(assets.type, 'thumbnail'))).get()?.id }));
  const details = dateParts(photo.capturedAt);
  const info = [['Filename', photo.filename], ['Dimensi', viewer?.width && viewer.height ? `${viewer.width} × ${viewer.height} px` : undefined], ['Ukuran', original?.bytes ? `${(original.bytes / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB` : undefined], ['Format', original?.mime ?? viewer?.mime]];
  const exifRows = [['Kamera', exif?.camera], ['Lensa', exif?.lens], ['Aperture', exif?.aperture], ['Shutter', exif?.shutter], ['ISO', exif?.iso?.toString()], ['Focal', exif?.focal]];
  return <div className="mx-auto max-w-[1600px] pb-4">
    <div className="flex min-h-10 items-center justify-between gap-3 pb-3 text-sm"><div className="flex min-w-0 items-center gap-3"><Link href="/archive" aria-label="Kembali ke arsip" className="shrink-0"><ArrowLeft size={20}/></Link><Link href="/archive" className="whitespace-nowrap">Arsip Foto</Link><span>/</span><strong className="truncate">Detail Foto</strong></div><Link href="/archive" className="flex shrink-0 items-center gap-2 hover:text-[#116a5c]"><ArrowLeft size={18}/>Kembali</Link></div>
    <div className="grid gap-3 xl:grid-cols-[minmax(0,2.5fr)_minmax(310px,1fr)]">
      <div className="min-w-0 space-y-3"><PhotoViewer src={viewer ? `/api/assets/${viewer.id}` : null} alt={photo.filename} filename={photo.filename} index={index + 1} total={ordered.length} previous={previous?.id} next={next?.id}/>
        <section className={`${panel} p-3`}><div className="mb-2 flex justify-between"><h2 className="text-sm font-semibold">Foto di hari yang sama</h2><span className="text-xs text-[#617273]">{sameDay.length} foto</span></div>{thumbnails.length ? <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">{thumbnails.map(item => <Link key={item.id} href={`/photos/${item.id}`} aria-label={`Buka ${item.filename}`} aria-current={item.id === id ? 'page' : undefined} className={`aspect-square overflow-hidden rounded bg-[#e9eeeb] ${item.id === id ? 'outline-2 outline-offset-2 outline-[#117461]' : ''}`}>{item.assetId ? <img src={`/api/assets/${item.assetId}`} alt="" loading="lazy" className="h-full w-full object-cover"/> : <span className="flex h-full items-center justify-center"><ImageIcon size={23}/></span>}</Link>)}</div> : <p className="py-5 text-sm text-[#68767a]">Tanggal pengambilan belum tersedia.</p>}</section>
      </div>
      <aside className={`${panel} min-w-0 p-5 xl:min-h-[calc(100dvh-140px)]`}><div className="flex items-center justify-between border-b border-[#dce2df] pb-3"><h1 className="text-xl font-bold">Detail Foto</h1><span className="rounded bg-[#e5f2ec] px-2 py-1 text-xs font-semibold text-[#126354]">{photo.status}</span></div><h2 className="mt-4 break-words text-lg font-bold">{photo.filename}</h2><p className="text-sm text-[#63717a]">{details.date}{details.time && ` · ${details.time}`}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">{original && <a href={`/api/assets/${original.id}?download=1`} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded border border-[#dce2df] text-xs hover:bg-[#eef5f1]"><Download size={20}/>Unduh original</a>}{location?.latitude != null && location.longitude != null && <a href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=14/${location.latitude}/${location.longitude}`} target="_blank" rel="noreferrer" className="flex min-h-16 flex-col items-center justify-center gap-1 rounded border border-[#dce2df] text-xs hover:bg-[#eef5f1]"><MapPin size={20}/>Buka peta</a>}</div>
        <DetailSection title="INFORMASI FILE" rows={info}/><DetailSection title="EXIF" rows={exifRows}/>
        {location?.label && <section className="mt-6"><h3 className="text-xs font-bold tracking-widest">LOKASI</h3><div className="mt-2 flex items-center justify-between gap-2 text-sm"><span>{location.label}</span><span className="flex shrink-0 items-center gap-1 rounded bg-[#e5f1ec] px-2 py-1 text-xs"><LockKeyhole size={12}/>{location.visibility}</span></div></section>}
        <section className="mt-6 border-t border-[#dce2df] pt-5"><h3 className="text-xs font-bold tracking-widest">ARSIP</h3><dl className="mt-2 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-[#65737b]">Status</dt><dd>{photo.status}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#65737b]">Visibilitas</dt><dd>{photo.visibility}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#65737b]">Issue</dt><dd>{issueCount}</dd></div></dl></section>
      </aside>
    </div>
  </div>;
}

function DetailSection({ title, rows }: { title: string; rows: (string | undefined | null)[][] }) { const filled = rows.filter(row => row[1]); if (!filled.length) return null; return <section className="mt-6"><h3 className="text-xs font-bold tracking-widest">{title}</h3><dl className="mt-2 space-y-1.5">{filled.map(([label, value]) => <div key={label} className="grid grid-cols-[105px_1fr] gap-3 text-sm"><dt className="text-[#65737b]">{label}</dt><dd className="break-all">{value}</dd></div>)}</dl></section>; }
