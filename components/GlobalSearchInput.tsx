'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock3, Search, X } from 'lucide-react';

const key = 'chronovista-recent-searches';
export function GlobalSearchInput({ initialQuery, mode = 'input' }: { initialQuery: string; mode?: 'input' | 'recent' }) {
  const [query, setQuery] = useState(initialQuery);
  const [recent, setRecent] = useState<string[]>([]);
  const router = useRouter();
  useEffect(() => { const timer = window.setTimeout(() => { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); const previous = Array.isArray(value) ? value.filter(item => typeof item === 'string') : []; const term = initialQuery.trim(); const next = term ? [term, ...previous.filter(item => item.toLowerCase() !== term.toLowerCase())].slice(0, 5) : previous.slice(0, 5); if (term) localStorage.setItem(key, JSON.stringify(next)); setRecent(next); } catch {} }, 0); return () => window.clearTimeout(timer); }, [initialQuery]);
  function search(value: string) {
    const term = value.trim().slice(0, 100);
    if (!term) return;
    const next = [term, ...recent.filter(item => item.toLowerCase() !== term.toLowerCase())].slice(0, 5);
    localStorage.setItem(key, JSON.stringify(next)); setRecent(next);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }
  if (mode === 'recent') return <div><h3 className="font-serif text-base font-bold">Pencarian terbaru</h3>{recent.length ? <div className="mt-2 space-y-1">{recent.map(item => <button key={item} type="button" onClick={() => search(item)} className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs hover:bg-[#e8f3ee]"><Clock3 size={15}/>{item}</button>)}</div> : <p className="mt-2 text-xs text-[#667477]">Belum ada pencarian di browser ini.</p>}</div>;
  return <form onSubmit={event => { event.preventDefault(); search(query); }} className="relative flex gap-2"><div className="relative min-w-0 flex-1"><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#55646a]"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari foto, cerita, lokasi, tanggal..." aria-label="Pencarian global" className="h-13 w-full rounded border border-[#ccd6d4] bg-white pl-12 pr-11 font-serif text-lg outline-none focus-visible:ring-2 focus-visible:ring-[#12685b]"/>{query && <button type="button" onClick={() => setQuery('')} aria-label="Hapus pencarian" className="absolute right-3 top-1/2 -translate-y-1/2"><X size={17}/></button>}</div><button className="rounded bg-[#0b6657] px-5 text-sm font-semibold text-white">Cari</button></form>;
}
