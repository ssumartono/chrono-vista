import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { db } from '@/db';
import { issues, layoutTemplates, users } from '@/db/schema';
import { builtInTemplates } from '@/lib/photo-book-template';
import { createPhotoBookAction } from '../actions';

export default async function NewPhotoBookPage({ searchParams }: { searchParams: Promise<{ source?: string; template?: string }> }) {
  const query = await searchParams;
  const issueRows = db.select({ id: issues.id, title: issues.title, code: issues.code }).from(issues).orderBy(desc(issues.publishedAt)).limit(100).all();
  const custom = db.select({ id: layoutTemplates.id, name: layoutTemplates.name }).from(layoutTemplates).orderBy(desc(layoutTemplates.updatedAt)).all();
  const author = db.select({ name: users.displayName, username: users.username }).from(users).limit(1).get();
  const options = [...builtInTemplates.map(item => ({ value: item.name, label: item.name })), ...custom.map(item => ({ value: `custom:${item.id}`, label: `${item.name} (buatan saya)` }))];
  const selected = options.some(item => item.value === query.template) ? query.template : 'Editorial';
  const inputClass = 'mt-1 w-full rounded border border-[#cbd4d1] px-3 py-2';
  return <div className="mx-auto max-w-4xl pb-10">
    <Link href="/photo-books" className="flex items-center gap-2 text-sm text-[#0b6254]"><ArrowLeft size={16}/>Kembali ke Photo Book</Link>
    <div className="mt-5 flex items-center gap-3"><BookOpen size={35} className="text-[#0b6254]"/><div><h1 className="font-serif text-4xl">Buat Photo Book</h1><p className="text-sm text-[#63717a]">Mulai dari arsip kosong atau salin susunan foto dari Issue.</p></div></div>
    <form action={createPhotoBookAction} className="mt-6 grid gap-4 rounded border border-[#d8dedb] bg-white p-6 sm:grid-cols-2">
      <label className="text-sm">Judul *<input name="title" required maxLength={150} className={inputClass}/></label>
      <label className="text-sm">Subtitle<input name="subtitle" maxLength={250} className={inputClass}/></label>
      <label className="text-sm">Fotografer *<input name="photographer" required defaultValue={author?.name || author?.username || ''} maxLength={120} className={inputClass}/></label>
      <label className="text-sm">Tahun *<input type="number" name="year" required min="1900" max="2200" defaultValue={new Date().getFullYear()} className={inputClass}/></label>
      <label className="text-sm">Template<select name="template" defaultValue={selected} className={inputClass}>{options.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="text-sm">Ukuran Halaman<select name="pageSize" className={inputClass}><option>A4</option><option>A5</option><option>Square</option></select></label>
      <label className="text-sm sm:col-span-2">Mulai dari Issue<select name="sourceIssueId" defaultValue="" className={inputClass}><option value="">Mulai dari buku kosong</option>{issueRows.map(issue => <option key={issue.id} value={issue.id}>{issue.code} — {issue.title}</option>)}</select>{query.source === 'issue' && !issueRows.length && <small className="mt-1 block text-[#8a5a1c]">Belum ada Issue. Buku tetap dapat dibuat dari arsip foto.</small>}</label>
      <label className="text-sm sm:col-span-2">Sinopsis<textarea name="description" rows={4} maxLength={3000} className={inputClass}/></label>
      <div className="flex justify-end sm:col-span-2"><button className="rounded bg-[#075b4d] px-5 py-2.5 text-sm font-semibold text-white">Buat dan Susun Foto</button></div>
    </form>
  </div>;
}
