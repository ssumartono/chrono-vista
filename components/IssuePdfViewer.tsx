'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Maximize, Minus, Monitor, Plus, Smartphone, Tablet } from 'lucide-react';

type Page = { pageNumber: number; assetId: string | null; filename: string };

export function IssuePdfViewer({ issueId, title, pages, revision }: { issueId: string; title: string; pages: Page[]; revision?: string }) {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [full, setFull] = useState(false);
  const url = `/api/issues/${issueId}/pdf?view=1${revision ? `&updated=${encodeURIComponent(revision)}` : ''}#page=${page}&zoom=${zoom}&toolbar=0`;
  const maxWidth = device === 'mobile' ? 'max-w-[420px]' : device === 'tablet' ? 'max-w-[700px]' : 'max-w-full';
  const move = (next: number) => setPage(Math.max(1, Math.min(pages.length, next)));
  return <section className={full ? 'fixed inset-0 z-[100] flex flex-col bg-[#f5f5f1] p-4' : 'min-w-0'}>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-semibold">Pratinjau PDF</h2><p className="text-xs text-[#667477]">A4 · {pages.length} halaman · sama dengan hasil ekspor</p></div><div className="flex overflow-hidden rounded border border-[#cbd5cf] bg-white text-xs">{[{ key: 'desktop', label: 'Desktop', icon: Monitor }, { key: 'tablet', label: 'Tablet', icon: Tablet }, { key: 'mobile', label: 'Mobile', icon: Smartphone }].map(item => <button key={item.key} type="button" onClick={() => setDevice(item.key as typeof device)} aria-pressed={device === item.key} className={`flex items-center gap-2 border-l border-[#d7dfda] px-3 py-2 first:border-l-0 ${device === item.key ? 'bg-[#e7f3ec] text-[#0b6b59]' : ''}`}><item.icon size={15}/>{item.label}</button>)}</div></div>
    <div className={`mx-auto w-full flex-1 overflow-hidden rounded border border-[#d9dfdc] bg-[#d7d8d4] shadow-[0_12px_35px_#17232920] ${maxWidth}`}><iframe key={url} title={`Pratinjau PDF ${title}`} src={url} className={`w-full bg-white ${full ? 'h-full' : 'h-[min(62vh,720px)] min-h-[440px]'}`}/></div>
    <div className="my-3 flex flex-wrap items-center justify-center gap-2 text-xs"><button type="button" onClick={() => move(page - 1)} disabled={page <= 1} aria-label="Halaman sebelumnya" className="rounded p-2 disabled:opacity-30"><ArrowLeft size={18}/></button><button type="button" onClick={() => move(page + 1)} disabled={page >= pages.length} aria-label="Halaman berikutnya" className="rounded p-2 disabled:opacity-30"><ArrowRight size={18}/></button><span className="mx-2">{page} / {pages.length} halaman</span><span className="mx-2 h-5 border-l border-[#cbd5cf]"/><button type="button" onClick={() => setZoom(value => Math.max(50, value - 10))} aria-label="Perkecil" className="rounded p-2"><Minus size={18}/></button><span>{zoom}%</span><button type="button" onClick={() => setZoom(value => Math.min(200, value + 10))} aria-label="Perbesar" className="rounded p-2"><Plus size={18}/></button><span className="mx-2 h-5 border-l border-[#cbd5cf]"/><button type="button" onClick={() => setFull(value => !value)} className="flex items-center gap-1 rounded p-2"><Maximize size={17}/>{full ? 'Tutup layar penuh' : 'Layar penuh'}</button></div>
    <div className="flex gap-2 overflow-x-auto pb-2">{pages.map(item => <button key={item.pageNumber} type="button" onClick={() => move(item.pageNumber)} className="w-15 shrink-0 text-center text-[10px]"><span className={`relative block h-18 overflow-hidden rounded border bg-white ${page === item.pageNumber ? 'border-[#076b5c] ring-2 ring-[#076b5c]' : 'border-[#d7dfda]'}`}>{item.assetId ? <Image src={`/api/assets/${item.assetId}`} alt={item.filename} fill unoptimized sizes="60px" className="object-cover grayscale"/> : null}</span><span className="mt-1 block">{item.pageNumber}</span></button>)}</div>
  </section>;
}
