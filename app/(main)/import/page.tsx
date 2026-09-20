'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, FileImage, FolderUp, ImagePlus, Info, LockKeyhole, UploadCloud } from 'lucide-react';

type Result = { sessionId: string; imported: number; duplicate: number; failed: number; results: { filename: string; status: string; message?: string }[] };
const maxBytes = 100 * 1024 * 1024;
export default function ImportPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  function select(list: FileList | null) { if (!list) return; setResult(null); setError(''); setFiles(Array.from(list)); }
  async function upload() {
    if (!files.length || busy) return;
    if (files.length > 50 || totalBytes > maxBytes) { setError('Maksimal 50 foto dan 100 MB per proses.'); return; }
    setBusy(true); setError('');
    try {
      const form = new FormData(); files.forEach(file => form.append('files', file));
      const response = await fetch('/api/import', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Import gagal.');
      setResult(data); setFiles([]);
      if (fileInput.current) fileInput.current.value = '';
      if (folderInput.current) folderInput.current.value = '';
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Import gagal.'); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-[1500px] space-y-4 pb-8">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-extrabold tracking-tight">Import Foto</h1><p className="text-sm text-[#65747a]">Tambahkan foto baru ke arsip ChronoVista.</p></div><Link href="/import/history" className="flex items-center gap-2 rounded border border-[#cbd7d2] bg-white px-4 py-2 text-sm hover:bg-[#edf5f1]"><Clock3 size={17}/>Riwayat Import</Link></div>
    <ol className="flex flex-wrap items-center justify-center gap-3 py-2 text-xs text-[#697a7b]"><li className="font-semibold text-[#0e6a5b]">① Pilih Foto</li><span className="h-px w-12 bg-[#b8c8c2]"/><li>② Periksa File</li><span className="h-px w-12 bg-[#b8c8c2]"/><li>③ Simpan ke Arsip</li></ol>
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.85fr)]"><section className="rounded-md border border-[#d8dfdc] bg-white p-3"><div className="flex min-h-65 flex-col items-center justify-center rounded border border-dashed border-[#adbfba] bg-[#fcfdfb] p-6 text-center" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); select(event.dataTransfer.files); }}><UploadCloud size={38} strokeWidth={1.5} className="text-[#14685a]"/><h2 className="mt-3 text-lg font-bold">Tarik foto atau folder ke sini</h2><p className="mt-1 text-sm text-[#65747a]">JPEG, PNG, WebP · maksimal 25 MB per file</p><div className="mt-5 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => folderInput.current?.click()} className="flex items-center gap-2 rounded bg-[#116a5c] px-5 py-2 text-sm font-semibold text-white"><FolderUp size={18}/>Pilih Folder</button><button type="button" onClick={() => fileInput.current?.click()} className="flex items-center gap-2 rounded border border-[#116a5c] px-5 py-2 text-sm font-semibold text-[#125f53]"><FileImage size={18}/>Pilih File</button></div><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={event => select(event.target.files)}/><input ref={node => { folderInput.current = node; node?.setAttribute('webkitdirectory', ''); }} type="file" multiple className="sr-only" onChange={event => select(event.target.files)}/>{files.length > 0 && <p className="mt-5 text-sm text-[#176b5d]">{files.length} file dipilih · {(totalBytes / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB</p>}</div></section>
      <section className="rounded-md border border-[#d8dfdc] bg-white p-5"><h2 className="text-lg font-bold">Pengaturan Import</h2><dl className="mt-4 space-y-4 text-sm"><div className="flex justify-between gap-3"><dt>Tujuan</dt><dd className="font-semibold">Arsip privat</dd></div><div className="flex justify-between gap-3"><dt>Simpan original</dt><dd className="flex items-center gap-1 text-[#126d5c]"><CheckCircle2 size={17}/>Aktif</dd></div><div className="flex justify-between gap-3"><dt>Thumbnail & viewer</dt><dd className="flex items-center gap-1 text-[#126d5c]"><CheckCircle2 size={17}/>Dibuat</dd></div><div className="flex justify-between gap-3"><dt>Metadata derivative</dt><dd className="flex items-center gap-1 text-[#126d5c]"><LockKeyhole size={17}/>Dihapus</dd></div><div className="flex justify-between gap-3"><dt>Duplikat identik</dt><dd>Dilewati</dd></div></dl><div className="mt-6 flex gap-2 rounded bg-[#edf4f0] p-3 text-xs text-[#466a63]"><Info size={17} className="shrink-0"/><p>Tanggal pengambilan dibaca dari EXIF. Jika tidak ada, waktu modifikasi file digunakan dan ditandai “Perlu diperiksa”.</p></div></section></div>
    <section className="rounded-md border border-[#d8dfdc] bg-white"><div className="flex flex-wrap items-center gap-3 border-b border-[#d8dfdc] p-4"><h2 className="text-lg font-bold">{result ? 'Hasil Import' : `${files.length} file dipilih`}</h2>{result && <><span className="rounded-full bg-[#e4f2e9] px-3 py-1 text-xs text-[#146858]">{result.imported} berhasil</span><span className="rounded-full bg-[#f2f2ef] px-3 py-1 text-xs">{result.duplicate} duplikat</span><span className="rounded-full bg-[#fff0e5] px-3 py-1 text-xs text-[#9a5e19]">{result.failed} gagal</span></>}</div><div className="max-h-80 overflow-auto"><table className="w-full min-w-125 text-left text-sm"><thead className="sticky top-0 bg-[#f8faf8] text-xs uppercase text-[#617374]"><tr><th className="px-4 py-3">Foto</th><th className="px-4 py-3">Ukuran</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-[#e5eae7]">{result ? result.results.map((item, i) => <tr key={`${item.filename}-${i}`}><td className="px-4 py-3 font-medium">{item.filename}</td><td className="px-4 py-3 text-[#647579]">—</td><td className="px-4 py-3"><span className={item.status === 'Imported' ? 'text-[#126c5b]' : item.status === 'Duplicate' ? 'text-[#647579]' : 'text-[#ac5f1b]'}>{item.status}</span>{item.message && <span className="ml-2 text-xs text-[#72817f]">{item.message}</span>}</td></tr>) : files.map((file, i) => <tr key={`${file.name}-${i}`}><td className="flex items-center gap-2 px-4 py-3"><ImagePlus size={18} className="text-[#67817b]"/><span className="truncate">{file.name}</span></td><td className="px-4 py-3">{(file.size / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB</td><td className="px-4 py-3 text-[#65747a]">Menunggu</td></tr>)}</tbody></table>{!files.length && !result && <p className="p-8 text-center text-sm text-[#6a797b]">Belum ada file dipilih.</p>}</div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d8dfdc] p-4"><p className="text-xs text-[#697a7b]">Original lokal · derivative untuk pratinjau</p><div className="flex gap-2">{result && <Link href="/archive" className="flex items-center gap-2 rounded border border-[#116a5c] px-5 py-2 text-sm text-[#125f53]">Lihat Arsip <ArrowRight size={16}/></Link>}<button type="button" disabled={!files.length || busy} onClick={upload} className="rounded bg-[#116a5c] px-6 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Mengimpor...' : `Import ${files.length} Foto`}</button></div></div></section>
    {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  </div>;
}
