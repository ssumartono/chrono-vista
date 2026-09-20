import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, Download, ImageIcon, LockKeyhole, MapPin } from 'lucide-react';
import { db } from '@/db';
import { assets, exifMetadata, issuePagePhotos, issuePages, issues, livePhotos, liveSessions, locations, photos } from '@/db/schema';
import { and, asc, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm';
import { PhotoViewer } from '@/components/PhotoViewer';
import { isPhotoMetadataPublic } from '@/lib/photo-public-metadata';
import { addPhotoToIssueAction, savePhotoLocationAction, togglePhotoPublicMetadataAction, updatePhotoArchiveStatusAction } from '../actions';

const panel = 'rounded-md border border-[#d9dfdc] bg-white';
const actionTile = 'flex min-h-18 flex-col items-center justify-center gap-1.5 rounded border border-[#dce2df] px-2 text-center text-xs hover:border-[#116a5c] hover:bg-[#eef5f1]';

function dateParts(date: Date | null) {
  if (!date) return { date: 'Tanggal belum ada', time: '' };
  return {
    date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }),
    time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }),
  };
}

function DetailSection({ title, rows }: { title: string; rows: (string | undefined | null)[][] }) {
  const filled = rows.filter(row => row[1]);
  if (!filled.length) return null;
  return <section className="mt-6"><h3 className="text-xs font-bold tracking-widest">{title}</h3><dl className="mt-3 space-y-1.5">{filled.map(([label, value]) => <div key={label} className="grid grid-cols-[105px_1fr] gap-3 text-sm"><dt className="text-[#65737b]">{label}</dt><dd className="break-words">{value}</dd></div>)}</dl></section>;
}

export default async function PhotoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ locationError?: string; locationSaved?: string; issueError?: string; statusSaved?: string; metadataSaved?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const photo = db.select().from(photos).where(and(eq(photos.id, id), isNull(photos.deletedAt))).get();
  if (!photo) notFound();
  const photoAssets = db.select().from(assets).where(eq(assets.photoId, id)).all();
  const viewer = photoAssets.find(asset => asset.type === 'viewer') ?? photoAssets.find(asset => asset.type === 'thumbnail');
  const original = photoAssets.find(asset => asset.type === 'original');
  const exif = db.select().from(exifMetadata).where(eq(exifMetadata.photoId, id)).get();
  const location = db.select().from(locations).where(eq(locations.photoId, id)).get();
  const metadataPublic = isPhotoMetadataPublic(id);
  const live = db.select({ id: liveSessions.id }).from(livePhotos).innerJoin(liveSessions, eq(liveSessions.id, livePhotos.liveSessionId)).where(and(eq(livePhotos.photoId, id), eq(liveSessions.status, 'Active'))).get();
  const memberships = db.select({ issueId: issues.id, code: issues.code, status: issues.status }).from(issuePagePhotos).innerJoin(issuePages, eq(issuePages.id, issuePagePhotos.pageId)).innerJoin(issues, eq(issues.id, issuePages.issueId)).where(eq(issuePagePhotos.photoId, id)).all();
  const drafts = db.select({ id: issues.id, code: issues.code, title: issues.title }).from(issues).where(eq(issues.status, 'Draft')).orderBy(desc(sql`issues.rowid`)).all().filter(issue => !memberships.some(member => member.issueId === issue.id));
  const ordered = db.select({ id: photos.id, capturedAt: photos.capturedAt }).from(photos).where(isNull(photos.deletedAt)).orderBy(asc(photos.capturedAt), asc(photos.id)).all();
  const index = ordered.findIndex(item => item.id === id);
  const previous = index > 0 ? ordered[index - 1] : null;
  const next = index < ordered.length - 1 ? ordered[index + 1] : null;
  const start = photo.capturedAt ? new Date(photo.capturedAt.getFullYear(), photo.capturedAt.getMonth(), photo.capturedAt.getDate()) : null;
  const end = start ? new Date(start.getTime() + 86400000) : null;
  const sameDay = start && end ? db.select({ id: photos.id, filename: photos.filename }).from(photos).where(and(isNull(photos.deletedAt), gte(photos.capturedAt, start), lt(photos.capturedAt, end))).orderBy(asc(photos.capturedAt), asc(photos.id)).limit(12).all() : [];
  const thumbnails = sameDay.map(item => ({ ...item, assetId: db.select({ id: assets.id }).from(assets).where(and(eq(assets.photoId, item.id), eq(assets.type, 'thumbnail'))).get()?.id }));
  const details = dateParts(photo.capturedAt);
  const info = [['Filename', photo.filename], ['Dimensi', original?.width && original.height ? `${original.width} × ${original.height} px` : undefined], ['Ukuran', original?.bytes ? `${(original.bytes / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB` : undefined], ['Format', original?.mime ?? viewer?.mime]];
  const exifRows = [['Kamera', exif?.camera], ['Lensa', exif?.lens], ['Aperture', exif?.aperture], ['Shutter', exif?.shutter], ['ISO', exif?.iso?.toString()], ['Focal', exif?.focal]];
  const mapUrl = location?.latitude != null && location.longitude != null
    ? `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=14/${location.latitude}/${location.longitude}`
    : location?.label ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(location.label)}` : null;
  const issueError = ({ duplicate: 'Foto ini sudah ada di Issue tersebut.', full: 'Issue sudah berisi 100 foto.', invalid: 'Draft Issue tidak tersedia.' } as Record<string, string>)[query.issueError || ''];

  return <div className="mx-auto max-w-[1600px] pb-4">
    <div className="flex min-h-10 items-center justify-between gap-3 pb-3 text-sm"><div className="flex min-w-0 items-center gap-2"><Link href="/archive" aria-label="Kembali ke arsip" className="shrink-0"><ArrowLeft size={20}/></Link><Link href="/archive" className="whitespace-nowrap">Arsip Foto</Link><span>/</span><span>{photo.capturedAt?.getFullYear() ?? '—'}</span><span>/</span><strong className="truncate">Detail Foto</strong></div><Link href="/archive" className="flex shrink-0 items-center gap-2 hover:text-[#116a5c]"><ArrowLeft size={18}/>Kembali</Link></div>
    <div className="grid gap-3 xl:grid-cols-[minmax(0,2.5fr)_minmax(330px,1fr)]">
      <div className="min-w-0 space-y-3"><PhotoViewer src={viewer ? `/api/assets/${viewer.id}` : null} alt={photo.filename} filename={photo.filename} index={index + 1} total={ordered.length} previous={previous?.id} next={next?.id}/>
        <section className={`${panel} p-3`}><div className="mb-2 flex justify-between"><h2 className="text-sm font-semibold">Foto di hari yang sama</h2><span className="text-xs text-[#617273]">{sameDay.length} foto</span></div>{thumbnails.length ? <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">{thumbnails.map(item => <Link key={item.id} href={`/photos/${item.id}`} aria-label={`Buka ${item.filename}`} aria-current={item.id === id ? 'page' : undefined} className={`aspect-square overflow-hidden rounded bg-[#e9eeeb] ${item.id === id ? 'outline-2 outline-offset-2 outline-[#117461]' : ''}`}>{item.assetId ? <img src={`/api/assets/${item.assetId}`} alt="" loading="lazy" className="h-full w-full object-cover"/> : <span className="flex h-full items-center justify-center"><ImageIcon size={23}/></span>}</Link>)}</div> : <p className="py-5 text-sm text-[#68767a]">Tanggal pengambilan belum tersedia.</p>}</section>
      </div>
      <aside className={`${panel} min-w-0 p-5 xl:h-[calc(100dvh-125px)] xl:overflow-y-auto`}><div className="flex items-center justify-between border-b border-[#dce2df] pb-3"><h1 className="text-xl font-bold">Detail Foto</h1><span className="rounded bg-[#e5f2ec] px-2 py-1 text-xs font-semibold text-[#126354]">{live ? 'LIVE' : photo.status}</span></div><h2 className="mt-4 break-words text-lg font-bold">{photo.filename}</h2><p className="text-sm text-[#63717a]">{details.date}{details.time && ` · ${details.time} WIB`}</p>
        <div className="mt-5 grid grid-cols-3 gap-2">{original ? <a href={`/api/assets/${original.id}?download=1`} className={actionTile}><Download size={20}/>Unduh Foto</a> : <span className={`${actionTile} opacity-45`}><Download size={20}/>Unduh Foto</span>}{mapUrl ? <a href={mapUrl} target="_blank" rel="noreferrer" className={actionTile}><MapPin size={20}/>Buka Peta</a> : <a href="#lokasi" className={actionTile}><MapPin size={20}/>Tambah Lokasi</a>}<a href="#issue-picker" className={actionTile}><BookOpen size={20}/>Masukkan ke Issue</a></div>
        <DetailSection title="INFORMASI FILE" rows={info}/><DetailSection title="EXIF" rows={exifRows}/>
        <section id="lokasi" className="mt-6"><div className="flex items-center justify-between gap-3"><h3 className="text-xs font-bold tracking-widest">LOKASI</h3><span className="flex shrink-0 items-center gap-1 rounded bg-[#e5f1ec] px-2 py-1 text-xs text-[#116a5c]"><LockKeyhole size={12}/>Privat</span></div>{location ? <p className="mt-2 text-sm">{location.label || 'Koordinat tersimpan'}{location.latitude !== null && location.longitude !== null && <span className="mt-1 block font-mono text-xs text-[#65737b]">{location.latitude}, {location.longitude}</span>}</p> : <p className="mt-2 text-sm text-[#65737b]">Belum ada data lokasi.</p>}<details open={!location || Boolean(query.locationError)} className="mt-3 rounded border border-[#dce2df] bg-[#fbfcfa] p-3"><summary className="cursor-pointer text-sm font-semibold text-[#116a5c]">{location ? 'Ubah Lokasi' : 'Tambah Lokasi'}</summary><form action={savePhotoLocationAction.bind(null, id)} className="mt-3 space-y-3"><label className="block text-xs font-medium text-[#405153]">Nama tempat<input name="label" maxLength={160} defaultValue={location?.label || ''} placeholder="Contoh: Blok M, Jakarta" className="mt-1 w-full rounded border border-[#cbd4d1] bg-white px-3 py-2 text-sm"/></label><div className="grid grid-cols-2 gap-2"><label className="block text-xs font-medium text-[#405153]">Lintang<input name="latitude" type="number" min="-90" max="90" step="any" defaultValue={location?.latitude ?? ''} placeholder="-6.2000" className="mt-1 w-full rounded border border-[#cbd4d1] bg-white px-3 py-2 text-sm"/></label><label className="block text-xs font-medium text-[#405153]">Bujur<input name="longitude" type="number" min="-180" max="180" step="any" defaultValue={location?.longitude ?? ''} placeholder="106.8000" className="mt-1 w-full rounded border border-[#cbd4d1] bg-white px-3 py-2 text-sm"/></label></div><p className="text-xs text-[#65737b]">Koordinat opsional. Isi keduanya bila diketahui.</p>{query.locationError && <p role="alert" className="rounded bg-[#fff3df] p-2 text-xs text-[#81571c]">{query.locationError}</p>}{query.locationSaved && <p role="status" className="text-xs text-[#116a5c]">Lokasi tersimpan.</p>}<button className="w-full rounded bg-[#116a5c] px-4 py-2 text-sm font-semibold text-white">Simpan Lokasi</button></form></details></section>
        <section id="issue-picker" className="mt-6 border-t border-[#dce2df] pt-5"><h3 className="text-xs font-bold tracking-widest">ISSUE</h3><p className="mt-2 text-sm text-[#65737b]">{memberships.length ? memberships.map(item => item.code).join(', ') : 'Belum masuk Issue.'}</p>{issueError && <p role="alert" className="mt-2 rounded bg-[#fff3df] p-2 text-xs text-[#81571c]">{issueError}</p>}{drafts.length > 0 && <form action={addPhotoToIssueAction.bind(null, id)} className="mt-3 flex gap-2"><select name="issueId" aria-label="Pilih draft Issue" className="min-w-0 flex-1 rounded border border-[#cbd4d1] px-2 py-2 text-xs">{drafts.map(issue => <option key={issue.id} value={issue.id}>{issue.code} · {issue.title}</option>)}</select><button className="rounded bg-[#116a5c] px-3 py-2 text-xs font-semibold text-white">Tambah</button></form>}<Link href={`/issues/new?photoId=${encodeURIComponent(id)}`} className="mt-3 inline-block text-xs font-semibold text-[#116a5c] underline">Buat Issue baru dengan foto ini</Link></section>
        <section className="mt-6 border-t border-[#dce2df] pt-5"><h3 className="text-xs font-bold tracking-widest">STATUS ARSIP</h3><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-[#65737b]">Penempatan</dt><dd className="text-right">{live ? 'LIVE' : 'Arsip'} · {memberships.length ? `${memberships.length} Issue` : 'Belum masuk Issue'}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#65737b]">Visibilitas foto</dt><dd>{photo.visibility}</dd></div></dl><form action={updatePhotoArchiveStatusAction.bind(null, id)} className="mt-3 flex gap-2"><select name="status" aria-label="Status arsip" defaultValue={photo.status} className="min-w-0 flex-1 rounded border border-[#cbd4d1] px-2 py-2 text-xs"><option value="Ready">Siap</option><option value="Need Review">Perlu ditinjau</option></select><button className="rounded border border-[#116a5c] px-3 py-2 text-xs font-semibold text-[#116a5c]">Simpan</button></form>{query.statusSaved && <p role="status" className="mt-2 text-xs text-[#116a5c]">Status arsip tersimpan.</p>}</section>
        <form action={togglePhotoPublicMetadataAction.bind(null, id)} className="mt-5 border-t border-[#dce2df] pt-4"><input type="hidden" name="enabled" value={metadataPublic ? '0' : '1'}/><button type="submit" role="switch" aria-checked={metadataPublic} className="flex w-full items-center gap-3 text-left text-sm"><span className={`relative h-6 w-11 shrink-0 rounded-full transition ${metadataPublic ? 'bg-[#116a5c]' : 'bg-[#aab9b4]'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${metadataPublic ? 'left-6' : 'left-1'}`}/></span><span>Tampilkan metadata publik</span></button><p className="mt-2 text-xs text-[#65737b]">{metadataPublic ? 'Tanggal dan data kamera tampil pada Issue yang diterbitkan.' : 'Metadata hanya terlihat oleh pemilik arsip.'} Koordinat GPS tetap privat.</p>{query.metadataSaved && <p role="status" className="mt-2 text-xs text-[#116a5c]">Pengaturan metadata tersimpan.</p>}</form>
      </aside>
    </div>
  </div>;
}
