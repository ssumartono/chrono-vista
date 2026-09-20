import Link from 'next/link';
import { Activity, CheckCircle2, ImageIcon, Plus, TriangleAlert } from 'lucide-react';
import { db } from '@/db';
import { assets, livePhotos, liveSessions, locations, photos } from '@/db/schema';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { startLiveAction } from './actions';
import { LiveWorkspace } from '@/components/LiveWorkspace';

export default function LivePage() {
  const session = db.select().from(liveSessions).where(eq(liveSessions.status, 'Active')).get();
  const selected = session ? db.select({ id: photos.id, filename: photos.filename, capturedAt: photos.capturedAt, status: photos.status, thumbnailId: assets.id, location: locations.label }).from(livePhotos).innerJoin(photos, eq(livePhotos.photoId, photos.id)).leftJoin(assets, and(eq(assets.photoId, photos.id), eq(assets.type, 'thumbnail'))).leftJoin(locations, eq(locations.photoId, photos.id)).where(and(eq(livePhotos.liveSessionId, session.id), isNull(photos.deletedAt))).orderBy(asc(livePhotos.position)).all() : [];
  const currentIds = new Set(selected.map(photo => photo.id));
  const available = db.select({ id: photos.id, filename: photos.filename, capturedAt: photos.capturedAt, status: photos.status, thumbnailId: assets.id, location: locations.label }).from(photos).leftJoin(assets, and(eq(assets.photoId, photos.id), eq(assets.type, 'thumbnail'))).leftJoin(locations, eq(locations.photoId, photos.id)).where(isNull(photos.deletedAt)).orderBy(sql`photos.rowid desc`).limit(100).all().filter(photo => !currentIds.has(photo.id));
  const toItem = (photo: typeof selected[number]) => ({ ...photo, date: photo.capturedAt?.toLocaleDateString('id-ID') ?? 'Tanggal belum ada', time: photo.capturedAt?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) ?? '' });
  const ready = selected.filter(photo => photo.status === 'Ready').length;
  const review = selected.length - ready;

  return <div className="mx-auto max-w-[1600px] space-y-4 pb-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight"><span className="h-3 w-3 rounded-full bg-[#12735e]"/>LIVE</h1><p className="text-sm text-[#64767a]">Foto terbaru yang sedang dikurasi sebelum masuk Issue.</p></div><Link href="/import" className="flex items-center gap-2 rounded bg-[#116a5c] px-5 py-2.5 text-sm font-semibold text-white"><Plus size={18}/>Import Foto</Link></div>
    {!session ? <section className="rounded-md border border-[#d8dfdc] bg-white p-12 text-center"><Activity size={39} className="mx-auto text-[#176b5d]"/><h2 className="mt-4 text-xl font-bold">Belum ada sesi LIVE</h2><p className="mx-auto mt-2 max-w-md text-sm text-[#697a7b]">Mulai sesi untuk memilih foto dari Arsip. Sesi baru bersifat privat dan tidak menyalin file original.</p><form action={startLiveAction}><button className="mt-5 rounded bg-[#116a5c] px-6 py-2.5 text-sm font-semibold text-white">Mulai LIVE</button></form></section> : <><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[{ icon: Activity, value: selected.length, label: 'Foto LIVE' }, { icon: CheckCircle2, value: ready, label: 'Metadata Siap' }, { icon: TriangleAlert, value: review, label: 'Perlu Diperiksa' }, { icon: ImageIcon, value: available.length, label: 'Foto Tersedia' }].map(stat => <div key={stat.label} className="flex min-h-20 items-center gap-4 rounded-md border border-[#d8dfdc] bg-white px-5"><stat.icon size={27} className="text-[#176b5d]" strokeWidth={1.6}/><div><strong className="block text-2xl leading-none">{stat.value}</strong><span className="text-xs text-[#65747a]">{stat.label}</span></div></div>)}</div><div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-[#e6f0eb] px-5 py-3 text-sm"><p>Foto LIVE tetap berada di Arsip. Tambahkan foto baru tanpa menggandakan original.</p><span className="rounded bg-white px-3 py-1 text-xs text-[#176b5d]">Sesi privat</span></div><LiveWorkspace current={selected.map(toItem)} available={available.map(toItem)}/></>}
  </div>;
}
