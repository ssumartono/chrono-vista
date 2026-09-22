import type { ResolvedElement, ResolvedPage } from '@/lib/photo-book-layout';

export type BookSpreadPhoto = { assetId: string | null; filename: string; caption: string | null };

function TemplatePage({ page, assetPrefix }: { page: ResolvedPage<BookSpreadPhoto>; assetPrefix: string }) {
  return <div className="relative aspect-[210/297] w-1/2 overflow-hidden bg-white shadow-sm" style={{ containerType: 'inline-size' }} aria-label={`Halaman ${page.number}`}>
    {page.elements.map(({ element, photo, text }: ResolvedElement<BookSpreadPhoto>) => <div key={element.id} className="absolute overflow-hidden" style={{ left: `${element.x / 210 * 100}%`, top: `${element.y / 297 * 100}%`, width: `${element.w / 210 * 100}%`, height: `${element.h / 297 * 100}%`, transform: `rotate(${element.rotation}deg)`, opacity: element.opacity / 100, borderRadius: element.radius, border: element.stroke ? `${element.stroke}px solid #17352f` : undefined, background: element.type === 'shape' ? '#0d6656' : undefined }}>
      {element.type === 'photo' ? photo?.assetId ? <img src={`${assetPrefix}/${photo.assetId}`} alt={photo.caption || photo.filename} className="h-full w-full grayscale" style={{ objectFit: element.fit, objectPosition: `${element.focusX}% ${element.focusY}%` }}/> : <div className="grid h-full place-items-center bg-[#e5eae7] text-[3cqw] text-[#667a72]">Foto belum tersedia</div>
        : element.type === 'shape' ? null
          : <div className={`h-full whitespace-pre-wrap break-words text-[#162027] ${element.type === 'title' ? 'font-serif font-bold leading-[1.08]' : element.type === 'quote' ? 'font-serif italic leading-tight' : element.type === 'body' ? 'font-serif leading-[1.45]' : 'text-center font-sans'}`} style={{ fontSize: element.type === 'title' ? '8cqw' : element.type === 'quote' ? '4cqw' : element.type === 'body' ? '3.2cqw' : '2.7cqw', columnCount: element.type === 'body' && element.w >= 120 ? 2 : 1, columnGap: '4cqw' }}>{text}</div>}
    </div>)}
  </div>;
}

export function BookTemplateSpreads({ pages, assetPrefix }: { pages: ResolvedPage<BookSpreadPhoto>[]; assetPrefix: string }) {
  const spreads = Array.from({ length: Math.ceil(pages.length / 2) }, (_, index) => pages.slice(index * 2, index * 2 + 2));
  return <div className="space-y-8">{spreads.map((spread, index) => <figure key={index} className="mx-auto max-w-[980px]"><div className="flex gap-1.5 bg-[#e4e9e7] p-2 shadow-sm sm:gap-2 sm:p-4">{spread.map(page => <TemplatePage key={page.number} page={page} assetPrefix={assetPrefix}/>)}</div><figcaption className="mt-2 text-center text-xs text-[#607078]">Spread {index + 1} · Halaman {spread[0]?.number}–{spread[spread.length - 1]?.number}</figcaption></figure>)}</div>;
}
