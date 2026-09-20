# ChronoVista

Aplikasi arsip foto personal berbasis Next.js, SQLite, dan penyimpanan media lokal. Fitur saat ini meliputi impor foto, dashboard, LIVE, Timeline, Issue, penjadwalan terbit, dan ekspor PDF.

## Menjalankan secara lokal

```powershell
npm ci
npm run dev
```

Buka `http://localhost:3000`. Database `chronovista.db` dan folder `media/` digunakan secara lokal dan tidak disertakan dalam Git.

Untuk instalasi baru, siapkan skema database dengan `npm run db:push`, lalu buat akun pemilik menggunakan kata sandi pilihan sendiri:

```powershell
$env:CHRONOVISTA_OWNER_PASSWORD = 'kata-sandi-unik-minimal-12-karakter'
npm run db:seed
```

Pada instalasi yang sudah memiliki akun dan database lokal, seed tidak perlu dijalankan lagi.

## Pemeriksaan

```powershell
npx tsc --noEmit
npx eslint app components lib db
```

Dokumen rancangan dan mockup ada di `docs/`.
