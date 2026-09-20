'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Expand, ImageIcon } from 'lucide-react';

export function PhotoViewer({ src, alt, filename, index, total, previous, next }: { src: string | null; alt: string; filename: string; index: number; total: number; previous?: string; next?: string }) {
  const viewer = useRef<HTMLDivElement>(null);
  return <div ref={viewer} className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-md bg-[#202525] text-white xl:h-[calc(100dvh-285px)] xl:min-h-[500px]"><span className="absolute left-5 top-4 z-10 text-sm tracking-wider">{index.toString().padStart(3, '0')} / {total.toLocaleString('id-ID')}</span>
    {src ? <img src={src} alt={alt} className="max-h-full max-w-full object-contain"/> : <div className="flex flex-col items-center gap-3 text-[#bec9c5]"><ImageIcon size={48}/><span>Pratinjau belum tersedia</span></div>}
    {previous && <Link href={`/photos/${previous}`} aria-label="Foto sebelumnya" className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 hover:bg-black/70"><ChevronLeft size={25}/></Link>}
    {next && <Link href={`/photos/${next}`} aria-label="Foto berikutnya" className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 hover:bg-black/70"><ChevronRight size={25}/></Link>}
    <span className="absolute bottom-3 left-1/2 max-w-[70%] -translate-x-1/2 truncate text-sm text-white/85">{filename}</span><button type="button" onClick={() => viewer.current?.requestFullscreen()} aria-label="Tampilkan layar penuh" className="absolute bottom-3 right-4 rounded p-1 hover:bg-white/15"><Expand size={21}/></button>
  </div>;
}
