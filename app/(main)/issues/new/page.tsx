import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { createIssueAction } from '../actions';

export default async function NewIssuePage({ searchParams }: { searchParams: Promise<{ photoId?: string }> }) {
  const { photoId } = await searchParams;
  return <div className="mx-auto max-w-2xl space-y-6"><Link href="/issues" className="flex items-center gap-2 text-sm text-[#116a5c]"><ArrowLeft size={17}/>Kembali ke Issue</Link><div><p className="font-mono text-xs font-bold tracking-widest text-[#116a5c]">ISSUE BUILDER</p><h1 className="mt-2 text-3xl font-extrabold">Buat Issue Baru</h1><p className="text-sm text-[#65747a]">Mulai dari judul, lalu susun foto dan halamannya.</p></div><form action={createIssueAction} className="space-y-5 rounded border border-[#d9dfdc] bg-white p-6"><BookOpen size={32} className="text-[#116a5c]"/>{photoId && <input type="hidden" name="photoId" value={photoId}/>}<div><label htmlFor="title" className="mb-2 block text-sm font-semibold">Judul Issue</label><input id="title" name="title" required maxLength={150} placeholder="Contoh: Jakarta Setelah Hujan" className="h-11 w-full rounded border border-[#cbd8d1] px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#116a5c]"/></div><p className="text-xs text-[#65747a]">{photoId ? 'Foto dari Detail Foto akan menjadi sampul draft baru.' : 'Draft disimpan sebagai privat. Anda dapat menambahkan foto setelah membuatnya.'}</p><button className="rounded bg-[#116a5c] px-6 py-2.5 text-sm font-semibold text-white">Buat Draft</button></form></div>;
}
