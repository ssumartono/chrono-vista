# Product Requirements Document

## ChronoVista — Personal Photography Archive & Publishing Studio

**Versi:** 2.0 — Personal Publishing & Archive Edition  
**Tanggal:** 19 September 2026  
**Status:** Implementation-ready draft  
**Platform:** Local-first responsive web application / optional single-host  
**Pengguna utama:** Satu owner/fotografer  
**Database:** SQLite  
**Bahasa awal:** Indonesia

---

## 0. Riwayat perubahan

| Versi | Perubahan |
|---|---|
| 1.0 | Eksplorasi arsip dan timeline berdasarkan FLUX Explore |
| 1.1 | SQLite sebagai source of truth, FTS5, import lokal, backup dan integrity check |
| 2.0 | Menyatukan seluruh mockup: autentikasi, dashboard, arsip, Detail Foto dan peta, Timeline, LIVE, Issue Builder, preview/publish, import report/history, profil, pengaturan, backup/restore, notifikasi, pencarian global, empty/error states, dan dialog konfirmasi |

---

## 1. Ringkasan produk

ChronoVista adalah aplikasi personal untuk mengelola perjalanan fotografi dari file sumber hingga publikasi editorial. Owner dapat mengimpor foto, memperbaiki metadata, menelusuri arsip berdasarkan waktu dan lokasi, menyusun Issue, menampilkan koleksi LIVE, serta menerbitkan Issue sebagai halaman web atau PDF.

Produk bersifat **single-owner dan local-first**. SQLite menjadi source of truth untuk metadata, relasi, konfigurasi, audit, notifikasi, dan status workflow. File foto disimpan pada filesystem dan tidak dimasukkan sebagai BLOB.

> Setiap foto punya waktunya. Setiap waktu punya cerita.

### 1.1 Nilai utama

- Menemukan foto berdasarkan waktu, lokasi, kamera, filename, tag, dan Issue.
- Menyatukan arsip, kurasi, dan publikasi dalam satu aplikasi.
- Menyimpan data utama secara lokal tanpa ketergantungan cloud.
- Menyediakan import yang dapat diaudit dan dipulihkan.
- Melindungi GPS, original, dan metadata sensitif secara default.
- Menghasilkan pengalaman publik modern, minimalis, dan editorial.

### 1.2 Prinsip produk

1. Foto adalah pusat perhatian.
2. Local-first, bukan cloud-dependent.
3. Tindakan berisiko harus jelas dan dapat dipulihkan bila memungkinkan.
4. Metadata sensitif private secara default.
5. Proses panjang memiliki status, laporan, dan jalur pemulihan.
6. Tidak ada duplikasi foto antara LIVE dan Published.

---

## 2. Masalah yang diselesaikan

1. Arsip folder sulit ditelusuri saat jumlah foto bertambah.
2. EXIF, lokasi, cerita, dan publikasi tersebar di alat berbeda.
3. Foto baru tidak memiliki ruang kurasi sebelum menjadi Issue.
4. Penyusunan zine terpisah dari arsip sumber.
5. Import massal menghasilkan duplikat, metadata ambigu, dan file rusak.
6. Backup SQLite sering dilakukan dengan penyalinan file aktif yang tidak aman.
7. Owner membutuhkan workflow lengkap tanpa kompleksitas DAM enterprise.

---

## 3. Sasaran dan non-sasaran

### 3.1 Sasaran V2.0

- Mengelola minimum 10.000 foto; target lanjutan 100.000.
- Mengimpor foto, membaca EXIF, membuat derivative, dan mendeteksi duplikat.
- Menyediakan Arsip, Timeline, Detail Foto, peta, LIVE, dan pencarian global.
- Menyusun, mem-preview, menerbitkan, membatalkan publikasi, dan mengekspor Issue.
- Menyediakan Import Report dan Riwayat Import.
- Menyediakan backup konsisten, integrity check, restore preview, dan pemulihan.
- Menampilkan notifikasi operasional yang dapat ditindaklanjuti.
- Mendukung desktop, tablet, dan mobile.
- Menjaga metadata sensitif keluar dari output publik.

### 3.2 Non-sasaran V2.0

- Multi-user dan collaborative editing realtime.
- Marketplace, pembayaran, cetak, dan lisensi.
- Likes, komentar, DM, follower, dan feed sosial.
- Face recognition.
- RAW editor, color grading, dan manipulasi piksel.
- SQLite pada network filesystem atau serverless ephemeral storage.
- Sinkronisasi cloud dua arah realtime.

---

## 4. Persona dan peran

### Owner/Fotografer

- Mengelola foto, metadata, Issue, LIVE, backup, dan pengaturan.
- Satu-satunya akun pada V2.0.
- Dapat mengakses original dan koordinat GPS private.

### Pengunjung publik

- Membaca Issue dan LIVE publik tanpa akun.
- Tidak dapat melihat original, GPS exact, audit log, atau konfigurasi.

---

## 5. Terminologi

| Istilah | Definisi |
|---|---|
| Photo/Frame | Satu foto, metadata, dan aset turunannya |
| Original | File sumber yang tidak dimodifikasi |
| Derivative | Thumbnail, viewer image, cover, atau aset publik |
| Issue | Publikasi editorial berisi halaman dan foto |
| LIVE | Foto yang ditampilkan tanpa terhubung ke Issue final |
| Import Session | Satu proses import beserta sumber, hasil, dan laporan |
| Integrity Check | Pemeriksaan database, relasi, checksum, dan aset |
| Backup Set | Snapshot SQLite konsisten dan manifest media |
| Archive | Seluruh koleksi foto owner |

---

## 6. Arsitektur informasi dan route

### 6.1 Public

| Route | Layar |
|---|---|
| / | Landing page, informasi produk, dan login |
| /issues/:slug | Detail Issue publik |
| /issues/:slug/read | Reader Issue |
| /live/:slug | LIVE publik jika diaktifkan |

### 6.2 Owner

| Route | Layar |
|---|---|
| /login | Login |
| /dashboard | Dashboard |
| /archive | Arsip Foto |
| /photos/:id | Detail Foto |
| /photos/:id/map | Peta Detail Foto |
| /timeline | Timeline |
| /issues | Daftar Issue |
| /issues/new | Issue Builder |
| /issues/:id/edit | Edit Issue |
| /issues/:id/preview | Preview & Publish |
| /issues/:id | Detail Issue owner |
| /live | Pengelolaan LIVE |
| /import | Import Foto |
| /import/history | Riwayat Import |
| /import/:id/report | Import Report |
| /search | Pencarian Global |
| /notifications | Notifikasi |
| /profile | Profile dan password |
| /settings | Pengaturan |
| /settings/backup | Backup & Pemulihan |

---

## 7. Navigasi dan design system

Sidebar desktop: Dashboard, Timeline, Issue, LIVE, Import, Arsip Foto, Profile, dan Pengaturan. Pada mobile sidebar menjadi drawer. Header menyediakan pencarian global, notifikasi, dan menu profil.

### Visual

- Background warm ivory, teks charcoal, accent deep emerald.
- Amber untuk warning; merah hanya untuk error/destructive.
- Serif untuk judul editorial; sans-serif untuk UI.
- Ikon outline dengan label pada aksi penting.
- Tidak memakai glassmorphism, neon, atau dekorasi berlebihan.

### Accessibility

- Target WCAG 2.2 AA.
- Semua fungsi dapat diakses keyboard.
- Focus ring, focus trap, dan focus return wajib.
- Foto publik memiliki alt text atau ditandai decorative.
- Reduced motion dihormati.
- Status tidak disampaikan hanya melalui warna.

---

## 8. Landing, autentikasi, dan profil

### Landing

- Menjelaskan nilai ChronoVista dan menampilkan contoh Issue.
- Tombol Masuk menuju login owner.
- Konten publik tidak membocorkan data private.

### Login

- Username/email dan password.
- Session secure dengan HTTP-only cookie pada mode server.
- Rate limit dan delay progresif setelah kegagalan.
- Pesan tidak mengungkap apakah username terdaftar.

### Profile User

- Nama, nama tampilan, bio, lokasi umum, avatar, dan email.
- Ganti password membutuhkan password saat ini.
- Password baru minimum 12 karakter.
- Semua session lain dapat dicabut.
- Perubahan masuk AuditLog.

---

## 9. Dashboard

- Total foto, Issue, foto LIVE, dan storage.
- Foto dan aktivitas terbaru.
- Status import dan backup terakhir.
- Foto yang perlu diperiksa.
- Shortcut Import Foto, Buat Issue, dan Mulai LIVE.
- Notifikasi prioritas.

Agregasi statistik diperbarui setelah import/publish dan tidak dihitung berat pada setiap render.

---

## 10. Arsip Foto

### Grid

- Default terbaru ke terlama.
- Tampilan grid dan daftar.
- Lazy loading dan virtualisasi setelah 500 tile aktif.
- Cursor pagination; default 100 item.
- Pengelompokan per bulan/tahun.
- Status Published, LIVE, Private, dan Perlu Diperiksa.

### Filter

- Tahun, tanggal, kamera, lensa, orientasi, lokasi, tag, Issue, dan status.
- Filter aktif berupa chip dan dapat dihapus satu per satu.
- Query, filter, sort, dan page tercermin pada URL.

### Aksi

- Favorit, koleksi, tambah ke Issue, edit metadata, visibility, dan download.
- Multi-select dan bulk action.
- Hapus memindahkan foto ke Sampah selama 30 hari.

---

## 11. Detail Foto dan peta

### Detail Foto

- Foto resolusi viewer dan previous/next dalam dataset terfilter.
- Filename, tanggal, EXIF, ukuran, tag, koleksi, Issue, status, dan catatan.
- Favorit, edit metadata, buka peta, tambah ke Issue, download, dan hapus.
- Metadata kosong tidak menghasilkan baris kosong.

### Buka Peta

- Marker, koordinat, label, akurasi, serta foto sekitar.
- Owner dapat mengubah marker, precision, dan visibility.
- Hapus Lokasi hanya menghapus data Location; foto tetap ada.
- Publik melihat exact, approximate, city-only, atau hidden sesuai policy.

---

## 12. Timeline

- Hierarki tahun, bulan, dan hari dengan jumlah foto.
- Expand/collapse dan jump-to-date.
- Scope memengaruhi grid, search, dan Detail Foto.
- Dapat menampilkan event Issue dan import.
- Scope serta scroll dipulihkan setelah kembali.
- Tanggal kosong menampilkan empty state dan tanggal terdekat.

---

## 13. LIVE

- Membuat sesi LIVE dengan nama, slug, sampul, visibility, dan urutan.
- Menambah foto dari Arsip.
- Reorder, remove, preview, publish, pause, dan end.
- Publikasi tidak menduplikasi Photo.

~~~mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Active: Mulai LIVE
    Active --> Paused: Jeda
    Paused --> Active: Lanjutkan
    Active --> Ended: Akhiri
    Draft --> Archived: Arsipkan
    Ended --> Archived: Arsipkan
~~~

---

## 14. Issue dan Issue Builder

### Daftar Issue

- Status Draft, Scheduled, Published, Unpublished, dan Archived.
- Search, filter, sort, duplicate, preview, edit, dan archive.

### Issue Builder

- Judul, subtitle, code, slug, deskripsi, cover, tag, dan tanggal.
- Memilih foto dari Arsip melalui search dan filter.
- Menyusun halaman dengan drag-and-drop.
- Layout cover, single, full bleed, two-photo, text, quote, dan closing.
- Caption, alt text, page number, dan credit.
- Autosave ke SQLite.
- Undo/redo dalam session.
- Validasi foto hilang, duplikat, resolusi rendah, dan alt text.

### Preview & Publish

- Preview Desktop, Tablet, dan Mobile.
- Navigasi halaman, thumbnail, zoom, dan fullscreen.
- Checklist Detail, Susunan, Pemeriksaan, dan Publikasi.
- Visibility Public, Private, atau Link-only.
- Terbit sekarang atau terjadwal.
- Opsi PDF dan metadata publik.
- Publish diblokir bila cover, judul, atau halaman tidak valid.

### Detail Issue

- Cover, sinopsis, fotografer, metadata, tag, status, dan daftar isi.
- Baca, edit, bagikan, salin URL, download PDF, dan unpublish.
- Statistik tayangan, pembaca, completion, dan share bersifat opsional.

~~~mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Scheduled: Jadwalkan
    Draft --> Published: Terbitkan
    Scheduled --> Published: Waktu tercapai
    Scheduled --> Draft: Batalkan jadwal
    Published --> Unpublished: Unpublish
    Unpublished --> Published: Publish ulang
    Draft --> Archived: Arsipkan
~~~

---

## 15. Import Foto

### Sumber

- Folder lokal.
- SD card atau removable storage.
- Manifest JSON.
- Folder jaringan hanya untuk source; SQLite aktif tetap lokal.

### Pipeline

1. Scan MIME.
2. Buat ImportSession.
3. Hitung SHA-256.
4. Deteksi duplicate exact dan possible duplicate.
5. Baca EXIF melalui ExifTool.
6. Normalisasi tanggal/timezone tanpa membuang nilai sumber.
7. Salin original bila managed storage aktif.
8. Buat derivative melalui Sharp.
9. Strip metadata sensitif.
10. Simpan data dalam transaksi batch.
11. Perbarui FTS5 dan agregasi.
12. Integrity check ringan.
13. Buat report dan notifikasi.

### Import Report

- Ringkasan berhasil, duplikat, gagal, dan perlu diperiksa.
- Tabel per file berisi status, masalah, metadata, lokasi, dan tindakan.
- Perbaiki, Bandingkan, Coba Lagi, Tambah Lokasi, dan Lewati.
- Bulk action tidak mengubah original source.
- Export JSON/CSV.

### Riwayat Import

- Daftar seluruh ImportSession.
- Filter tanggal, status, dan sumber.
- Statistik file, ukuran, durasi, dan hasil.
- Hapus Riwayat tidak menghapus foto.
- Retry menjadi session baru yang menautkan parent session.

~~~mermaid
stateDiagram-v2
    [*] --> Queued
    Queued --> Scanning
    Scanning --> Processing
    Processing --> Completed
    Processing --> CompletedWithWarnings
    Processing --> Failed
    Processing --> Cancelled
    Failed --> Queued: Coba lagi
~~~

---

## 16. Pencarian Global

SQLite FTS5 mencari:

- Foto: filename, caption, tag, kamera, lensa, dan lokasi.
- Issue: judul, subtitle, deskripsi, tag, dan code.
- Lokasi: label dan area.
- Tanggal: tanggal, bulan, dan tahun.

UI menyediakan tab Semua, Foto, Issue, Lokasi, dan Tanggal; highlight istilah; filter tanggal, kamera, lokasi, orientasi, status; recent searches; serta waktu update index. Data private hanya dapat dicari owner.

---

## 17. Notifikasi

### Kategori

- Import selesai/gagal.
- Backup berhasil/gagal.
- Metadata perlu diperiksa.
- Integrity check.
- Issue dipublikasikan atau jadwal gagal.
- Storage hampir penuh.

### Perilaku

- Read/unread, tandai semua dibaca, dan filter kategori.
- Deep link serta aksi relevan.
- Severity info, success, warning, dan critical.
- Notifikasi duplikat satu proses digabung.
- Retensi default 90 hari.
- Quiet hours 22:00–07:00; critical tetap muncul.
- Email default nonaktif dan di luar scope awal.

---

## 18. Backup & Pemulihan

### Backup

- Menggunakan SQLite Backup API atau VACUUM INTO.
- Full backup dan incremental manifest media.
- Jadwal harian.
- Retensi default 7 harian, 4 mingguan, 12 bulanan.
- Lokasi berbeda dari database aktif.
- Setiap backup memiliki checksum dan integrity result.

### Daftar backup

- Tanggal, nama, tipe, ukuran, status, lokasi, dan tindakan.
- Status Valid, Belum Diverifikasi, atau Gagal.
- Verify, preview restore, copy/download, dan delete sesuai retensi.

### Restore preview

- Membandingkan jumlah foto, Issue, setting, schema version, dan timestamp.
- Menjelaskan data yang akan diganti.
- Wajib integrity check.
- Safety backup aktif secara default.
- Restore kritis membutuhkan input PULIHKAN.
- Aplikasi read-only selama restore.
- Kegagalan melakukan rollback ke safety backup.

---

## 19. Pengaturan

- Umum: bahasa, timezone, format tanggal, tema.
- Arsip: folder media, derivative quality, batch size.
- Metadata: GPS, EXIF visibility, alt text.
- Issue: default visibility, PDF, slug.
- LIVE: tampilan dan visibility.
- Import: duplicate policy, managed/reference mode.
- Penyimpanan: penggunaan disk, Sampah, cleanup.
- Backup: lokasi, jadwal, retensi.
- Notifikasi: kategori dan quiet hours.
- Keamanan: session dan password.

Perubahan kritis memerlukan konfirmasi dan AuditLog.

---

## 20. Empty, loading, dan error states

### Empty states

| Kondisi | Aksi utama |
|---|---|
| Arsip kosong | Import Foto |
| Belum ada Issue | Buat Issue Pertama |
| LIVE kosong | Mulai LIVE |
| Search kosong | Hapus Filter |
| Timeline kosong | Import Foto |
| Notifikasi kosong | Kembali ke Dashboard |

### Loading

- Skeleton untuk grid dan tabel.
- Progress deterministik untuk import, backup, restore, dan publish.
- Proses panjang dapat berjalan background dan menghasilkan notifikasi.

### Error states

| Kode | Kondisi | Pemulihan |
|---|---|---|
| DB-LOCK-01 | Database terkunci | Coba lagi atau mode baca saja |
| STORAGE-02 | Storage penuh | Kelola penyimpanan atau pilih lokasi |
| FILE-RAW-07 | File rusak | Coba ulang atau lewati |
| BACKUP-04 | Backup gagal | Coba ulang atau ubah lokasi |

Error menjelaskan penyebab, dampak, keamanan data, dan langkah berikutnya. Detail teknis dapat disalin tanpa rahasia.

---

## 21. Konfirmasi tindakan dan Sampah

| Tindakan | Tingkat | Aturan |
|---|---|---|
| Hapus foto | Rendah | Pindahkan ke Sampah 30 hari |
| Hapus lokasi | Sedang | Foto tetap ada; Location dihapus |
| Unpublish Issue | Tinggi | URL publik ditutup; Issue menjadi Unpublished |
| Restore database | Kritis | Preview, safety backup, integrity check, typed confirmation |

- Aksi destructive berada di kanan dan berlabel spesifik.
- Batal selalu tersedia.
- Modal kritis tidak ditutup dengan backdrop atau Escape.
- Aksi selesai menghasilkan toast dan AuditLog.
- Undo ditawarkan bila aman.

---

## 22. Model data SQLite

| Tabel | Field penting |
|---|---|
| users | id, username, password_hash, display_name, email, avatar_path |
| sessions | id, user_id, token_hash, expires_at, revoked_at |
| photos | id, filename, captured_at, status, visibility, checksum, deleted_at |
| assets | id, photo_id, type, path, mime, width, height, bytes, checksum |
| exif_metadata | photo_id, camera, lens, focal, aperture, shutter, iso, ev, raw_json |
| locations | id, photo_id, label, latitude, longitude, precision, visibility |
| tags | id, name, slug |
| photo_tags | photo_id, tag_id |
| collections | id, name, type |
| collection_photos | collection_id, photo_id, position |
| issues | id, code, slug, title, subtitle, description, status, visibility, scheduled_at, published_at |
| issue_pages | id, issue_id, page_number, layout_type, content_json |
| issue_page_photos | page_id, photo_id, position, caption, alt_text |
| live_sessions | id, slug, title, status, visibility, started_at, ended_at |
| live_photos | live_session_id, photo_id, position |
| import_sessions | id, source, status, started_at, completed_at, totals_json, parent_id |
| import_items | id, session_id, source_path, photo_id, status, error_code, details_json |
| backups | id, name, type, path, bytes, checksum, status, schema_version, created_at |
| notifications | id, category, severity, title, message, action_url, read_at, created_at |
| settings | key, value_json, updated_at |
| audit_logs | id, actor_id, action, entity_type, entity_id, details_json, created_at |
| trash_items | id, entity_type, entity_id, purge_at, snapshot_json |

### Index

- photos(captured_at DESC)
- photos(status, visibility)
- photos(checksum UNIQUE)
- issues(slug UNIQUE)
- import_items(session_id, status)
- notifications(read_at, created_at DESC)
- audit_logs(entity_type, entity_id, created_at DESC)
- FTS5 virtual tables untuk photo, Issue, dan location.

### Konfigurasi

~~~sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
~~~

Satu writer pada satu waktu. Import memakai lock aplikasi dan transaksi batch. Database aktif wajib berada pada local persistent disk.

---

## 23. Arsitektur teknis

~~~mermaid
flowchart TD
    A[Browser/PWA] --> B[Next.js local or single-host]
    B --> C[Application services]
    C --> D[SQLite + FTS5]
    C --> E[Local media filesystem]
    C --> F[ExifTool + Sharp workers]
    C --> G[Static publication build]
    G --> H[Optional public hosting]
~~~

### Stack

- Next.js, React, dan TypeScript.
- Tailwind CSS atau CSS Modules dengan design tokens.
- better-sqlite3 dan Drizzle ORM.
- SQLite FTS5.
- ExifTool dan Sharp.
- MapLibre GL atau Leaflet.
- Zod.
- Playwright, Vitest, dan axe-core.

### Mode A — personal local app

- Semua admin feature berjalan pada komputer owner.
- Public Issue diekspor menjadi static bundle.
- Menjadi mode default.

### Mode B — single-host

- App, SQLite, dan media berada pada satu mesin dengan persistent disk.
- Admin digunakan melalui HTTPS.
- Tidak menjalankan banyak writer instance.

---

## 24. Service/API contracts

### Foto dan search

- GET /api/photos
- GET /api/photos/:id
- PATCH /api/photos/:id
- DELETE /api/photos/:id
- PATCH /api/photos/:id/location
- GET /api/search

### Issue dan LIVE

- GET dan POST /api/issues
- GET dan PATCH /api/issues/:id
- PUT /api/issues/:id/pages
- POST /api/issues/:id/validate
- POST /api/issues/:id/publish
- POST /api/issues/:id/unpublish
- GET dan POST /api/live
- PATCH /api/live/:id

### Import

- POST /api/import
- GET /api/import/:id
- GET /api/import/:id/items
- POST /api/import/:id/retry

### Operasional

- GET /api/notifications
- PATCH /api/notifications/:id/read
- GET dan POST /api/backups
- POST /api/backups/:id/verify
- POST /api/backups/:id/restore-preview
- POST /api/backups/:id/restore
- POST /api/integrity-check

Browser tidak pernah menerima file SQLite atau path original absolut.

---

## 25. Persyaratan fungsional

| ID | Persyaratan | Prioritas |
|---|---|---|
| FR-001 | Owner dapat login dan logout | Must |
| FR-002 | Dashboard menampilkan ringkasan operasional | Must |
| FR-003 | Arsip menyediakan grid, filter, sort, dan pagination | Must |
| FR-004 | Owner dapat melakukan bulk action | Must |
| FR-005 | Detail Foto menampilkan metadata dan relasi | Must |
| FR-006 | Owner dapat melihat dan mengubah lokasi | Must |
| FR-007 | Timeline mendukung tahun, bulan, hari, dan scope | Must |
| FR-008 | Owner dapat mengelola sesi LIVE | Must |
| FR-009 | Owner dapat membuat dan menyusun Issue | Must |
| FR-010 | Issue Builder melakukan autosave dan validasi | Must |
| FR-011 | Owner dapat preview dan publish Issue | Must |
| FR-012 | Owner dapat menjadwalkan dan unpublish Issue | Must |
| FR-013 | Import bersifat idempotent | Must |
| FR-014 | Sistem menghasilkan Import Report | Must |
| FR-015 | Sistem menyimpan Riwayat Import | Must |
| FR-016 | Search menggabungkan Foto, Issue, Lokasi, dan Tanggal | Must |
| FR-017 | Sistem menghasilkan notifikasi operasional | Must |
| FR-018 | Sistem membuat backup konsisten | Must |
| FR-019 | Restore memiliki preview dan safety backup | Must |
| FR-020 | Owner dapat mengubah profile dan password | Must |
| FR-021 | Empty/error state menyediakan recovery action | Must |
| FR-022 | Tindakan berisiko memakai confirmation pattern | Must |
| FR-023 | Sampah mempertahankan foto selama 30 hari | Should |
| FR-024 | Issue dapat diekspor PDF | Should |
| FR-025 | Public Issue dapat diekspor static | Must |

---

## 26. Persyaratan nonfungsional

### Performa

- LCP public page di bawah 2,5 detik pada 4G.
- INP di bawah 200 ms.
- Search p95 di bawah 300 ms untuk 100.000 foto pada mesin target.
- Grid awal maksimum 100 thumbnail.
- Import tidak memblokir navigasi read-only.

### Reliabilitas

- Import idempotent berdasarkan checksum.
- Publish memakai versioned output dan atomic switch.
- Restore tidak menimpa database sebelum validasi.
- Original tidak pernah diubah oleh derivative pipeline.
- Kegagalan satu item tidak menggagalkan seluruh session.

### Privasi dan keamanan

- GPS exact private secara default.
- Password menggunakan Argon2id.
- Original di luar public root.
- Serial number dan owner EXIF dihapus dari derivative.
- AuditLog untuk perubahan sensitif.
- Session dapat dicabut.

### Portabilitas

- Relative media path.
- Metadata dapat diekspor JSON/CSV.
- Issue dapat diekspor static/PDF.
- Backup memiliki schema version dan manifest.

---

## 27. Acceptance criteria

### AC-001 — Import

Given folder berisi file valid, duplikat, dan rusak; when import selesai; then setiap file memiliki status, file valid masuk arsip, duplikat tidak digandakan, file rusak tercatat, dan report tersedia.

### AC-002 — Arsip

Given filter kamera dan lokasi aktif; when owner membuka foto lalu kembali; then filter, urutan, dan scroll dipulihkan.

### AC-003 — Lokasi

Given GPS private; when halaman publik dibuka; then koordinat serta tombol peta tidak terdapat pada HTML, JSON, atau aset publik.

### AC-004 — Issue Builder

Given Issue memiliki beberapa halaman; when owner mengubah urutan; then perubahan autosave dan refresh memulihkan susunan terakhir.

### AC-005 — Publish

Given judul, cover, dan halaman valid; when owner memilih Publikasikan Issue; then output dibuat atomik, status Published, URL aktif, dan notifikasi dibuat.

### AC-006 — Unpublish

Given Issue Published; when owner mengonfirmasi Unpublish; then URL publik ditutup dan Issue menjadi Unpublished tanpa kehilangan statistik.

### AC-007 — Pencarian Global

Given query Jakarta malam; when search selesai; then Foto, Issue, Lokasi, dan Tanggal muncul sesuai izin serta dapat difilter.

### AC-008 — Backup

Given SQLite memakai WAL; when backup dijalankan; then snapshot menggunakan SQLite API, memiliki checksum, dan lolos integrity check.

### AC-009 — Restore

Given backup valid; when preview dibuka; then perbandingan data tampil, safety backup aktif, dan restore baru berjalan setelah input PULIHKAN.

### AC-010 — Database terkunci

Given writer lain melewati busy timeout; when owner menyimpan; then DB-LOCK-01 tampil dan menawarkan retry atau read-only tanpa kehilangan draft.

### AC-011 — Storage penuh

Given ruang bebas di bawah threshold; when import berjalan; then import berhenti aman dan original source tidak berubah.

### AC-012 — Empty states

Given tidak ada foto, Issue, LIVE, atau hasil search; when layar dibuka; then empty state menjelaskan kondisi dan menyediakan satu aksi utama.

---

## 28. Analytics dan observability

- Jumlah foto per periode.
- Import success/failure rate.
- Persentase metadata lengkap.
- Issue selesai dan dipublikasikan.
- Storage growth.
- Backup success rate.
- Structured local logs dan correlation ID.
- Log tidak menyimpan password, token, atau GPS private.
- Owner dapat menyalin detail error.

Analytics publik bersifat opt-in dan privacy-preserving.

---

## 29. Roadmap

### Fase 0 — Foundation

- Design tokens, shell, schema, migration, seed.
- Authentication, profile, filesystem abstraction, AuditLog.

### Fase 1 — Archive Core

- Import dasar, Arsip, Detail Foto, Timeline, peta.
- FTS5, Pencarian Global, empty/error/loading states.

### Fase 2 — Import Operations

- Import Report, Riwayat Import, duplicate review, retry, metadata repair, notifikasi.

### Fase 3 — Publishing

- Issue Builder, preview, validation, publish, schedule, unpublish.
- Public Detail Issue, PDF, static export, dan LIVE.

### Fase 4 — Resilience

- Backup, retensi, integrity check, restore preview, safety restore.
- Storage management dan Sampah.

### Fase 5 — Hardening

- Accessibility audit.
- Uji 100.000 foto.
- Security review dan recovery drill.
- Mobile/tablet refinement.

---

## 30. Risiko dan mitigasi

| Risiko | Mitigasi |
|---|---|
| SQLite lock saat import | Single writer lock, batch transaction, busy timeout |
| WAL atau storage penuh | Monitoring, checkpoint, stop-safe import |
| Database pada cloud-sync folder | Validasi path dan warning/block |
| Duplicate photo | Unique checksum dan duplicate review |
| Timezone ambigu | Simpan raw value, correction UI, audit |
| GPS bocor | Private default dan public projection tests |
| Publish setengah jadi | Staging directory dan atomic switch |
| Restore kehilangan perubahan | Preview dan safety backup |
| Original berubah | Read-only ingestion dan checksum |
| Builder terlalu kompleks | Layout terbatas dan template reusable |
| Statistik berat | Precomputed aggregates |

---

## 31. Definition of Done

V2.0 selesai apabila:

- Seluruh route pada bagian 6 tersedia.
- Seluruh FR Must lulus acceptance test.
- Import 10.000 foto dapat melanjutkan setelah item gagal tanpa duplikasi.
- Search gabungan konsisten.
- Issue dapat dibuat, dipreview, dipublikasikan, dibaca, dan di-unpublish.
- LIVE dapat dimulai, dijeda, diakhiri, dan diarsipkan.
- Import Report serta Riwayat Import akurat.
- Backup dapat diverifikasi dan direstore dalam recovery drill.
- Empty, error, dan confirmation states diimplementasikan.
- GPS/private metadata tidak muncul pada output publik.
- Keyboard dan screen-reader flow tidak memiliki masalah kritis.
- Migration berjalan dari database kosong.

---

## Lampiran A — Cakupan mockup

| Mockup | Bagian |
|---|---|
| Landing dan Login | 8 |
| Dashboard | 9 |
| Arsip Foto | 10 |
| Detail Foto dan Buka Peta | 11 |
| Timeline | 12 |
| LIVE | 13 |
| Issue, Builder, Preview & Publish, Detail Issue | 14 |
| Import, Import Report, Riwayat Import | 15 |
| Pencarian Global | 16 |
| Notifikasi | 17 |
| Backup & Pemulihan | 18 |
| Pengaturan dan Profile | 8 dan 19 |
| Empty dan Error States | 20 |
| Konfirmasi tindakan | 21 |

## Lampiran B — Keputusan produk

1. SQLite tetap menjadi source of truth.
2. Media disimpan sebagai file, bukan BLOB.
3. Personal local app adalah mode default.
4. Issue Builder termasuk scope V2.0.
5. Multi-user bukan scope V2.0.
6. GPS exact private secara default.
7. Hapus foto menggunakan Sampah 30 hari.
8. Restore selalu melalui preview dan safety backup.
9. Static public output tidak mengandung admin API atau data private.
10. Seluruh mockup yang disetujui menjadi referensi UI implementasi.

