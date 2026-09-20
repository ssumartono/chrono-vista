'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Camera, Crosshair, Expand, Layers, LockKeyhole, MapPin, Minus, Plus, Search, Trash2 } from 'lucide-react';
import type * as Leaflet from 'leaflet';
import { deletePhotoLocationAction, savePhotoLocationAction } from '@/app/(main)/photos/actions';
import type { MapPoint } from '@/lib/photo-map';

export type MapPhoto = { id: string; filename: string; date: string; latitude: number | null; longitude: number | null; thumbnailUrl: string | null; distance: number };
type SearchResult = { lat: string; lon: string; display_name: string };

function MapCanvas({ currentId, point, focus, nearby, dark, onPick }: { currentId: string; point: MapPoint | null; focus: MapPoint | null; nearby: MapPhoto[]; dark: boolean; onPick: (point: MapPoint) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const leaflet = useRef<typeof Leaflet | null>(null);
  const selectedMarker = useRef<Leaflet.Marker | null>(null);
  const privacyCircle = useRef<Leaflet.Circle | null>(null);
  const pointLatest = useRef<MapPoint | null>(point);
  const router = useRouter();

  useEffect(() => {
    pointLatest.current = point;
    if (!map.current || !leaflet.current) return;
    if (!point) { selectedMarker.current?.remove(); privacyCircle.current?.remove(); selectedMarker.current = null; privacyCircle.current = null; return; }
    const position: Leaflet.LatLngExpression = [point.latitude, point.longitude];
    if (selectedMarker.current) selectedMarker.current.setLatLng(position);
    else selectedMarker.current = leaflet.current.marker(position, { icon: leaflet.current.divIcon({ className: '', html: '<span class="chrono-map-pin current">📷</span>', iconSize: [44, 44], iconAnchor: [22, 22] }) }).addTo(map.current);
    if (privacyCircle.current) privacyCircle.current.setLatLng(position);
    else privacyCircle.current = leaflet.current.circle(position, { radius: 500, color: '#116a5c', fillColor: '#8dc2ad', fillOpacity: .14, weight: 1 }).addTo(map.current);
  }, [point]);

  useEffect(() => {
    let disposed = false;
    let instance: Leaflet.Map | null = null;
    import('leaflet').then(L => {
      if (disposed || !container.current) return;
      leaflet.current = L;
      const center = pointLatest.current;
      instance = L.map(container.current, { zoomControl: false, scrollWheelZoom: true }).setView(center ? [center.latitude, center.longitude] : [-6.2088, 106.8456], center ? 14 : 11);
      map.current = instance;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(instance);
      instance.on('click', event => onPick({ latitude: Number(event.latlng.lat.toFixed(6)), longitude: Number(event.latlng.lng.toFixed(6)) }));
      for (const photo of nearby) {
        if (photo.latitude === null || photo.longitude === null) continue;
        const marker = L.marker([photo.latitude, photo.longitude], { icon: L.divIcon({ className: '', html: '<span class="chrono-map-pin">📷</span>', iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(instance);
        marker.on('click', () => router.push(`/photos/${photo.id}/map`));
      }
      if (center) {
        selectedMarker.current = L.marker([center.latitude, center.longitude], { icon: L.divIcon({ className: '', html: '<span class="chrono-map-pin current">📷</span>', iconSize: [44, 44], iconAnchor: [22, 22] }) }).addTo(instance);
        privacyCircle.current = L.circle([center.latitude, center.longitude], { radius: 500, color: '#116a5c', fillColor: '#8dc2ad', fillOpacity: .14, weight: 1 }).addTo(instance);
      }
      window.setTimeout(() => instance?.invalidateSize(), 100);
    }).catch(() => {});
    const onFullscreen = () => map.current?.invalidateSize();
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => { disposed = true; document.removeEventListener('fullscreenchange', onFullscreen); instance?.remove(); map.current = null; leaflet.current = null; selectedMarker.current = null; privacyCircle.current = null; };
  }, [currentId, nearby, onPick, router]);

  useEffect(() => { if (focus && map.current) map.current.setView([focus.latitude, focus.longitude], 15); }, [focus]);

  return <div className={`relative h-full w-full ${dark ? 'chrono-map-dark' : ''}`}><div ref={container} className="h-full w-full bg-[#ebece6]"/><div className="absolute right-4 top-4 z-[500] flex flex-col gap-2"><div className="overflow-hidden rounded border border-[#d6dfda] bg-white shadow-sm"><button type="button" onClick={() => map.current?.zoomIn()} aria-label="Perbesar peta" className="flex h-10 w-10 items-center justify-center border-b border-[#d6dfda]"><Plus size={19}/></button><button type="button" onClick={() => map.current?.zoomOut()} aria-label="Perkecil peta" className="flex h-10 w-10 items-center justify-center"><Minus size={19}/></button></div><button type="button" onClick={() => point && map.current?.setView([point.latitude, point.longitude], 14)} aria-label="Pusatkan pada foto" className="flex h-10 w-10 items-center justify-center rounded border border-[#d6dfda] bg-white shadow-sm"><Crosshair size={19}/></button><button type="button" onClick={() => container.current?.parentElement?.requestFullscreen()} aria-label="Peta layar penuh" className="flex h-10 w-10 items-center justify-center rounded border border-[#d6dfda] bg-white shadow-sm"><Expand size={18}/></button></div><div className="absolute bottom-7 left-4 z-[500] flex items-center gap-3 rounded border border-[#d6dfda] bg-white px-3 py-2 text-xs shadow-sm"><span className="flex items-center gap-1 text-[#116a5c]"><MapPin size={15}/>Foto</span><span className="flex items-center gap-1"><span className="h-4 w-4 rounded-full border border-dashed border-[#116a5c] bg-[#dcece6]"/>Area privat</span><span>{nearby.length} foto sekitar</span></div></div>;
}

export function PhotoMapWorkspace({ current, nearby, label, hasSavedLocation, saved, deleted, error }: { current: MapPhoto; nearby: MapPhoto[]; label: string; hasSavedLocation: boolean; saved: boolean; deleted: boolean; error: string | null }) {
  const [name, setName] = useState(label);
  const [latitude, setLatitude] = useState(current.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(current.longitude?.toString() ?? '');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchMessage, setSearchMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [focus, setFocus] = useState<MapPoint | null>(null);
  const [dark, setDark] = useState(false);
  const [carouselStart, setCarouselStart] = useState(0);
  const lastSearch = useRef(0);
  const cache = useRef(new Map<string, SearchResult[]>());
  const latitudeNumber = latitude.trim() ? Number(latitude) : NaN;
  const longitudeNumber = longitude.trim() ? Number(longitude) : NaN;
  const point = Number.isFinite(latitudeNumber) && Number.isFinite(longitudeNumber) && Math.abs(latitudeNumber) <= 90 && Math.abs(longitudeNumber) <= 180 ? { latitude: latitudeNumber, longitude: longitudeNumber } : null;
  const gallery = [current, ...nearby];

  const choosePoint = useCallback((next: MapPoint) => { setLatitude(next.latitude.toFixed(6)); setLongitude(next.longitude.toFixed(6)); setFocus(next); }, []);
  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    if (term.length < 3) { setSearchMessage('Masukkan sedikitnya 3 karakter.'); return; }
    if (cache.current.has(term.toLowerCase())) { setResults(cache.current.get(term.toLowerCase()) ?? []); setSearchMessage(''); return; }
    if (Date.now() - lastSearch.current < 1100) { setSearchMessage('Tunggu sebentar sebelum mencari lagi.'); return; }
    lastSearch.current = Date.now();
    setSearching(true); setSearchMessage(''); setResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(term)}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Pencarian lokasi tidak tersedia.');
      const data = await response.json() as SearchResult[];
      cache.current.set(term.toLowerCase(), data);
      setResults(data); if (!data.length) setSearchMessage('Lokasi tidak ditemukan. Anda dapat memilih titik pada peta.');
    } catch { setSearchMessage('Pencarian gagal. Pilih titik pada peta atau isi koordinat manual.'); }
    finally { setSearching(false); }
  }
  function selectResult(result: SearchResult) {
    const latitude = Number(result.lat), longitude = Number(result.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    setName(result.display_name.split(',').slice(0, 3).join(',').slice(0, 160));
    choosePoint({ latitude, longitude });
    setResults([]); setQuery('');
  }

  return <div className="grid min-h-[calc(100dvh-185px)] grid-cols-1 border-b border-[#d9dfdc] bg-white xl:h-[calc(100dvh-185px)] xl:grid-cols-[minmax(0,1fr)_350px]">
    <div className="flex min-w-0 flex-col"><div className="relative h-[50vh] min-h-[430px] flex-1 overflow-hidden xl:min-h-0"><MapCanvas currentId={current.id} point={point} focus={focus} nearby={nearby} dark={dark} onPick={choosePoint}/><div className="absolute left-4 top-4 z-[500] rounded border border-[#d6dfda] bg-white px-3 py-2 text-xs font-semibold shadow-sm">{nearby.length} foto di sekitar lokasi ini</div><div className="absolute left-4 right-18 top-16 z-[500] flex max-w-xl flex-col gap-2 sm:left-auto sm:right-18 sm:top-4 sm:w-[min(45vw,460px)]"><form onSubmit={search} className="flex gap-2"><div className="relative min-w-0 flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5f7176]"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari lokasi..." aria-label="Cari lokasi pada peta" className="h-10 w-full rounded border border-[#cbd4d1] bg-white pl-9 pr-3 text-sm shadow-sm"/></div><button type="submit" disabled={searching} className="rounded border border-[#cbd4d1] bg-white px-3 text-xs font-semibold shadow-sm disabled:opacity-50">Cari</button><button type="button" onClick={() => setDark(value => !value)} aria-label="Ubah tampilan peta" className="flex h-10 w-10 items-center justify-center rounded border border-[#cbd4d1] bg-white shadow-sm"><Layers size={18}/></button></form>{results.length > 0 && <div className="max-h-48 overflow-auto rounded border border-[#cbd4d1] bg-white shadow-lg">{results.map((result, index) => <button key={`${result.lat}-${result.lon}-${index}`} type="button" onClick={() => selectResult(result)} className="block w-full border-b border-[#e5ebe8] px-3 py-2 text-left text-xs hover:bg-[#edf5f1]">{result.display_name}</button>)}</div>}{searchMessage && <p role="status" className="rounded bg-white px-3 py-2 text-xs shadow-sm">{searchMessage}</p>}</div></div>
      <section className="border-t border-[#d9dfdc] bg-white p-3"><div className="mb-2 flex items-center justify-between text-xs"><h2 className="font-semibold">Foto di sekitar {name || 'lokasi ini'}</h2><span className="text-[#657579]">{nearby.length} foto · radius 10 km</span></div><div className="flex items-center gap-2"><button type="button" onClick={() => setCarouselStart(value => Math.max(0, value - 1))} aria-label="Foto sebelumnya" className="flex h-12 w-8 shrink-0 items-center justify-center rounded border border-[#d9dfdc]"><ArrowLeft size={17}/></button><div className="flex min-w-0 flex-1 gap-2 overflow-hidden">{gallery.slice(carouselStart, carouselStart + 8).map(photo => <Link key={photo.id} href={`/photos/${photo.id}/map`} className={`w-30 shrink-0 ${photo.id === current.id ? 'text-[#116a5c]' : ''}`}><div className={`relative h-19 overflow-hidden rounded bg-[#e9efec] ${photo.id === current.id ? 'ring-2 ring-[#116a5c] ring-offset-1' : ''}`}>{photo.thumbnailUrl ? <Image src={photo.thumbnailUrl} alt="" fill unoptimized className="object-cover"/> : <span className="flex h-full items-center justify-center"><Camera size={22}/></span>}</div><p className="mt-1 truncate font-mono text-[10px]">{photo.filename}</p><p className="truncate text-[10px] text-[#657579]">{photo.date}</p></Link>)}</div><button type="button" onClick={() => setCarouselStart(value => Math.min(Math.max(0, gallery.length - 8), value + 1))} aria-label="Foto berikutnya" className="flex h-12 w-8 shrink-0 items-center justify-center rounded border border-[#d9dfdc]"><ArrowRight size={17}/></button></div></section>
    </div>
    <aside className="min-w-0 overflow-y-auto border-l border-[#d9dfdc] bg-white p-5"><h2 className="text-lg font-bold">Lokasi Foto</h2><div className="relative mt-4 aspect-[1.65] overflow-hidden rounded bg-[#e9efec]">{current.thumbnailUrl ? <Image src={current.thumbnailUrl} alt="Foto terpilih" fill unoptimized className="object-cover"/> : <span className="flex h-full items-center justify-center"><Camera size={32}/></span>}</div><h3 className="mt-3 break-words text-lg font-bold">{current.filename}</h3><p className="text-sm text-[#657579]">{current.date}</p><p className="mt-3 flex items-center gap-2 text-sm"><MapPin size={16}/>{name || 'Lokasi belum diberi nama'}</p><span className="mt-3 inline-flex items-center gap-1 rounded bg-[#e5f1ec] px-2 py-1 text-xs text-[#116a5c]"><LockKeyhole size={12}/>GPS Privat</span><div className="mt-3 rounded border border-[#d2e6de] bg-[#f1f8f5] p-3 text-xs text-[#4b6560]">Lingkaran pada peta menunjukkan area 500 meter untuk membantu meninjau titik. Koordinat exact hanya terlihat di arsip pribadi.</div>
      <form action={savePhotoLocationAction.bind(null, current.id)} className="mt-5 space-y-3"><input type="hidden" name="returnTo" value="map"/><label className="block text-xs font-semibold text-[#405153]">Nama lokasi<input name="label" value={name} onChange={event => setName(event.target.value)} maxLength={160} placeholder="Contoh: Stasiun Manggarai, Jakarta" className="mt-1 w-full rounded border border-[#cbd4d1] px-3 py-2 text-sm font-normal"/></label><div className="grid grid-cols-2 gap-2"><label className="block text-xs font-semibold text-[#405153]">Lintang<input name="latitude" type="number" min="-90" max="90" step="any" value={latitude} onChange={event => setLatitude(event.target.value)} placeholder="-6.2088" className="mt-1 w-full rounded border border-[#cbd4d1] px-2 py-2 text-sm font-normal"/></label><label className="block text-xs font-semibold text-[#405153]">Bujur<input name="longitude" type="number" min="-180" max="180" step="any" value={longitude} onChange={event => setLongitude(event.target.value)} placeholder="106.8456" className="mt-1 w-full rounded border border-[#cbd4d1] px-2 py-2 text-sm font-normal"/></label></div><p className="text-xs text-[#657579]">Klik peta untuk memilih titik, atau isi koordinat manual.</p>{error && <p role="alert" className="rounded bg-[#fff3df] p-2 text-xs text-[#81571c]">{error}</p>}{saved && <p role="status" className="text-xs text-[#116a5c]">Lokasi tersimpan.</p>}{deleted && <p role="status" className="text-xs text-[#116a5c]">Lokasi dihapus.</p>}<div className="flex gap-2">{point && <a href={`https://www.openstreetmap.org/?mlat=${point.latitude}&mlon=${point.longitude}#map=15/${point.latitude}/${point.longitude}`} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center rounded border border-[#116a5c] px-2 py-2 text-xs font-semibold text-[#116a5c]">Buka di OSM</a>}<button className="flex-1 rounded bg-[#116a5c] px-3 py-2 text-xs font-semibold text-white">Simpan Perubahan</button></div></form>{hasSavedLocation && <form action={deletePhotoLocationAction.bind(null, current.id)} className="mt-3"><button className="flex items-center gap-2 text-xs text-[#b24133]"><Trash2 size={14}/>Hapus Lokasi</button></form>}
      <section className="mt-6 border-t border-[#d9dfdc] pt-4"><h4 className="text-xs font-bold">Foto di Sekitar</h4><p className="mt-1 text-xs text-[#657579]">{nearby.length} foto dalam radius 10 km</p><div className="mt-3 grid grid-cols-3 gap-2">{nearby.slice(0, 3).map(photo => <Link key={photo.id} href={`/photos/${photo.id}/map`} className="relative aspect-square overflow-hidden rounded bg-[#e9efec]">{photo.thumbnailUrl ? <Image src={photo.thumbnailUrl} alt={photo.filename} fill unoptimized className="object-cover"/> : <Camera className="m-auto mt-5" size={20}/>}</Link>)}</div></section>
    </aside>
  </div>;
}
