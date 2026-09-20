import Link from 'next/link';
import { Aperture, ArrowRight, BookOpen, CalendarDays, FileText, Folder, Image as ImageIcon, PlayCircle, Search, UserRound } from 'lucide-react';
import styles from './landing.module.css';

const photos = {
  bridge: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=85&w=1000',
  subway: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=85&w=900',
  shadow: 'https://images.unsplash.com/photo-1517436073-3b1b1b6d9fd0?auto=format&fit=crop&q=85&w=900',
  cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=85&w=600',
};

export default function Home() {
  return <div className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}><Aperture size={35} strokeWidth={2.5}/><span>ChronoVista</span></Link>
      <span className={styles.divider}/>
      <nav className={styles.topNav} aria-label="Navigasi utama"><Link href="#fitur">Explore</Link><Link href="#fitur">Issues</Link><Link href="#tentang">Tentang</Link></nav>
      <div className={styles.headerActions}><Link href="/login">Masuk</Link><Link href="/dashboard" className={styles.primarySmall}>Buka Arsip <ArrowRight size={17}/></Link></div>
    </header>

    <main className={styles.main}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>FOTO <span>·</span> WAKTU <span>·</span> CERITA <span>·</span> SELALU BERJALAN</p>
          <h1 id="hero-title">Arsip visual,<br/>tersusun oleh waktu.</h1>
          <p className={styles.heroText}>Jelajahi perjalanan fotografi dari tahun, bulan, hingga satu frame.</p>
          <div className={styles.heroActions}><Link href="/archive" className={styles.primary}><Search size={21}/>Jelajahi Arsip</Link><Link href="#tentang" className={styles.secondary}><PlayCircle size={21}/>Pelajari ChronoVista</Link></div>
          <p className={styles.motto}><span/>SETIAP FOTO PUNYA WAKTUNYA SENDIRI</p>
        </div>
        <div className={styles.collage} aria-label="Kolase perjalanan fotografi">
          <div className={`${styles.photo} ${styles.bridge}`}><img src={photos.bridge} alt="Jalan kota dan jembatan"/><span className={styles.yearBadge}><Folder size={16}/>2026 · 428 foto</span><span className={styles.bridgeCaption}>NEW PLACES<br/>SAME CURIOSITY</span></div>
          <div className={`${styles.photo} ${styles.subway}`}><img src={photos.subway} alt="Kereta di stasiun"/><span className={styles.liveBadge}><span/> LIVE</span></div>
          <div className={`${styles.photo} ${styles.shadow}`}><img src={photos.shadow} alt="Bayangan di dinding kota"/><span className={styles.shadowCaption}>Good<br/>Photos<br/>Better<br/>Days</span></div>
          <p className={styles.sideNote}>MOMEN<br/>KECIL<br/>MEMBENTUK<br/>CERITA<br/>BESAR<br/>—</p>
          <div className={`${styles.photo} ${styles.cat}`}><img src={photos.cat} alt="Kucing di kota"/><span className={styles.dateBadge}><CalendarDays size={15}/>19 SEP 2026</span></div>
          <p className={styles.catNote}>ARSIP HARI INI<br/>UNTUK NANTI</p>
        </div>
      </section>

      <section className={styles.stats} aria-label="Contoh statistik arsip"><div><FileText/><strong>42</strong><span>ISSUE</span></div><div><ImageIcon/><strong>1.512</strong><span>FOTO</span></div><div><CalendarDays/><strong>2011–2026</strong><span>TAHUN PERJALANAN</span></div><div><UserRound/><strong>1</strong><span>ARSIP PERSONAL</span></div><p>LEBIH DARI<br/>SEKADAR FOTO</p></section>

      <section id="fitur" className={styles.features} aria-labelledby="feature-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>FITUR UTAMA</p><h2 id="feature-title">Satu arsip. Banyak cara menemukan kembali.</h2></div><p>WAKTU SELALU<br/>PUNYA CARA<br/>UNTUK MEMANGGIL KEMBALI</p></div>
        <div className={styles.featureGrid}>
          <article className={styles.featureCard}><span className={styles.iconBox}><CalendarDays/></span><div><h3>Timeline Kronologis</h3><p>Telusuri foto berdasarkan tahun, bulan, hingga satu hari secara langsung.</p></div><ArrowRight className={styles.cardArrow} size={18}/></article>
          <article className={styles.featureCard}><span className={styles.iconBox}><FileText/></span><div><h3>Metadata Bermakna</h3><p>Lihat detail di balik setiap foto: tanggal, lokasi, kamera, dan cerita singkat.</p></div><ArrowRight className={styles.cardArrow} size={18}/></article>
          <article className={styles.featureCard}><span className={styles.iconBox}><BookOpen/></span><div><h3>Issue &amp; Cerita</h3><p>Kumpulan foto dalam tema, momen, atau perjalanan tertentu.</p></div><ArrowRight className={styles.cardArrow} size={18}/></article>
          <aside className={styles.signInCard}><p className={styles.eyebrow}>SUDAH PUNYA AKUN?</p><span className={styles.userIcon}><UserRound size={22}/></span><h3>Masuk untuk melanjutkan eksplorasi.</h3><Link href="/login">Masuk <ArrowRight size={16}/></Link><Link href="/dashboard"><small>Belum punya akun?</small>Buka Arsip <ArrowRight size={16}/></Link></aside>
        </div>
      </section>
    </main>
    <footer id="tentang" className={styles.footer}><p>CHRONOVISTA　 MEREKAM HARI INI, UNTUK MASA DEPAN</p><p>FOTO · MANUSIA · WAKTU · SELALU TERHUBUNG</p></footer>
  </div>;
}
