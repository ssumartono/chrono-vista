import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/db';
import { importSessions } from '@/db/schema';
import { desc } from 'drizzle-orm';

export default function ImportHistoryPage() {
  const sessions = db.select().from(importSessions).orderBy(desc(importSessions.startedAt)).limit(100).all();
  return <div className="mx-auto max-w-5xl space-y-5"><Link href="/import" className="flex items-center gap-2 text-sm text-[#116a5c]"><ArrowLeft size={17}/>Kembali ke Import</Link><div><h1 className="text-3xl font-extrabold">Riwayat Import</h1><p className="text-sm text-[#65747a]">Proses import terbaru yang tersimpan di SQLite.</p></div><div className="overflow-x-auto rounded border border-[#d8dfdc] bg-white"><table className="w-full min-w-150 text-left text-sm"><thead className="bg-[#f4f8f5] text-[#586b6b]"><tr><th className="p-4">Waktu</th><th className="p-4">Sumber</th><th className="p-4">Status</th><th className="p-4">Hasil</th></tr></thead><tbody className="divide-y divide-[#e2e8e4]">{sessions.map(session => { let totals: { imported?: number; duplicate?: number; failed?: number } = {}; try { totals = JSON.parse(session.totalsJson ?? '{}'); } catch {} return <tr key={session.id}><td className="p-4">{session.startedAt.toLocaleString('id-ID')}</td><td className="p-4">{session.source}</td><td className="p-4">{session.status}</td><td className="p-4">{totals.imported ?? 0} berhasil · {totals.duplicate ?? 0} duplikat · {totals.failed ?? 0} gagal</td></tr>; })}</tbody></table>{!sessions.length && <p className="p-8 text-center text-[#65747a]">Belum ada riwayat import.</p>}</div></div>;
}
