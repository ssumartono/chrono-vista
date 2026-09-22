'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, ImageIcon, Plus, Trash2 } from 'lucide-react';

type Photo = { id: string; filename: string; thumbnailId: string | null };
type Page = { photoId: string | null; caption: string | null };
type Book = { title: string; subtitle: string | null; photographer: string; year: number; description: string | null; template: string; pageSize: string; marginMm: number };
type TemplateOption = { value: string; label: string };

export function PhotoBookEditor({ book, available, saved, templates, action }: { book: Book; available: Photo[]; saved: Page[]; templates: TemplateOption[]; action: (form: FormData) => Promise<void> }) {
  const [selected, setSelected] = useState(saved.map(page => page.photoId).filter((id): id is string => Boolean(id)));
  const [query, setQuery] = useState('');
  const byId = new Map(available.map(photo => [photo.id, photo]));
  const savedCaptions = new Map(saved.map(page => [page.photoId, page.caption]));
  const inputClass = 'mt-1 w-full rounded border border-[#cbd4d1] px-3 py-2';
  function move(index: number, direction: -1 | 1) { setSelected(current => { const target = index + direction; if (target < 0 || target >= current.length) return current; const copy = [...current]; [copy[index], copy[target]] = [copy[target], copy[index]]; return copy; }); }
  return <form action={action} className="space-y-5">
    <input type="hidden" name="photoIds" value={JSON.stringify(selected)}/>
    <section className="grid gap-3 rounded border border-[#d9dfdc] bg-white p-5 sm:grid-cols-2">
      <label className="text-sm">Judul<input name="title" required maxLength={150} defaultValue={book.title} className={inputClass}/></label>
      <label className="text-sm">Subtitle<input name="subtitle" maxLength={250} defaultValue={book.subtitle || ''} className={inputClass}/></label>
      <label className="text-sm">Fotografer<input name="photographer" required maxLength={120} defaultValue={book.photographer} className={inputClass}/></label>
      <label className="text-sm">Tahun<input name="year" type="number" required min="1900" max="2200" defaultValue={book.year} className={inputClass}/></label>
      <label className="text-sm">Template<select name="template" defaultValue={book.template} className={inputClass}>{templates.map(template => <option key={template.value} value={template.value}>{template.label}</option>)}</select></label>
      <label className="text-sm">Ukuran Halaman<select name="pageSize" defaultValue={book.pageSize} className={inputClass}><option>A4</option><option>A5</option><option>Square</option></select></label>
      <label className="text-sm">Margin (mm)<input name="marginMm" type="number" required min="0" max="50" defaultValue={book.marginMm} className={inputClass}/></label>
      <label className="text-sm sm:col-span-2">Sinopsis<textarea name="description" rows={3} maxLength={3000} defaultValue={book.description || ''} className={inputClass}/></label>
    </section>
    <div className="grid gap-4 lg:grid-cols-2"><section className="rounded border border-[#d9dfdc] bg-white p-4"><h2 className="font-serif text-xl">Arsip Foto</h2><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari nama foto..." aria-label="Cari foto" className="mt-3 w-full rounded border border-[#cbd4d1] px-3 py-2 text-sm"/><div className="mt-3 grid max-h-[500px] grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">{available.filter(photo => photo.filename.toLowerCase().includes(query.toLowerCase())).map(photo => <div key={photo.id} className="rounded border border-[#d9dfdc] p-1"><div className="h-22 bg-[#e5ebe7]">{photo.thumbnailId ? <img src={`/api/assets/${photo.thumbnailId}`} alt="" className="h-full w-full object-cover"/> : <ImageIcon className="mx-auto mt-5"/>}</div><p className="mt-1 truncate text-xs">{photo.filename}</p><button type="button" disabled={selected.includes(photo.id) || selected.length >= 200} onClick={() => setSelected(items => [...items, photo.id])} className="mt-1 flex items-center gap-1 text-xs text-[#0b6254] disabled:opacity-40"><Plus size={13}/>Tambah</button></div>)}</div></section>
      <section className="rounded border border-[#d9dfdc] bg-white p-4"><h2 className="font-serif text-xl">Susunan Halaman <span className="text-sm text-[#617078]">({selected.length})</span></h2><p className="text-xs text-[#617078]">Foto pertama menjadi sampul.</p><div className="mt-3 max-h-[550px] space-y-2 overflow-auto">{selected.map((id, index) => <div key={id} className="rounded border border-[#d9dfdc] p-2"><div className="flex items-center gap-2"><span className="w-6 text-sm font-semibold">{index + 1}</span><div className="h-14 w-17 shrink-0 bg-[#e5ebe7]">{byId.get(id)?.thumbnailId && <img src={`/api/assets/${byId.get(id)?.thumbnailId}`} alt="" className="h-full w-full object-cover"/>}</div><span className="min-w-0 flex-1 truncate text-xs">{byId.get(id)?.filename || id}</span><button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Pindah ke atas" className="disabled:opacity-30"><ArrowUp size={16}/></button><button type="button" disabled={index === selected.length - 1} onClick={() => move(index, 1)} aria-label="Pindah ke bawah" className="disabled:opacity-30"><ArrowDown size={16}/></button><button type="button" onClick={() => setSelected(items => items.filter(item => item !== id))} aria-label="Hapus dari buku" className="text-red-700"><Trash2 size={16}/></button></div><input name={`caption-${id}`} maxLength={500} defaultValue={savedCaptions.get(id) || ''} placeholder="Caption halaman" className="mt-2 w-full rounded border border-[#cbd4d1] px-2 py-1.5 text-xs"/></div>)}{!selected.length && <p className="rounded bg-[#eef3ef] p-8 text-center text-sm text-[#617078]">Pilih foto dari arsip untuk membuat halaman.</p>}</div></section>
    </div><div className="sticky bottom-0 flex justify-end border-t border-[#d9dfdc] bg-[#faf9f5] py-3"><button className="rounded bg-[#075b4d] px-5 py-2.5 text-sm font-semibold text-white">Simpan dan Preview</button></div>
  </form>;
}
