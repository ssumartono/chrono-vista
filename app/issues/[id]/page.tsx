import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, asc, desc, eq, isNull, lt, gt } from 'drizzle-orm';
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Clock3, Download, Globe2, Search } from 'lucide-react';
import { db } from '@/db';
import { assets, issuePagePhotos, issuePages, issues, photos, users } from '@/db/schema';
import { ShareIssueButton } from '@/components/ShareIssueButton';
import styles from './published.module.css';

export const dynamic = 'force-dynamic';

export default async function PublicIssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;
  const issue = db.select().from(issues).where(and(eq(issues.slug, slug), eq(issues.status, 'Published'), eq(issues.visibility, 'Public'))).get();
  if (!issue) notFound();
  const pages = db.select({ pageNumber: issuePages.pageNumber, caption: issuePagePhotos.caption, altText: issuePagePhotos.altText, assetId: assets.id, capturedAt: photos.capturedAt })
    .from(issuePages).innerJoin(issuePagePhotos, eq(issuePagePhotos.pageId, issuePages.id)).innerJoin(photos, eq(photos.id, issuePagePhotos.photoId))
    .innerJoin(assets, and(eq(assets.photoId, photos.id), eq(assets.type, 'viewer')))
    .where(and(eq(issuePages.issueId, issue.id), isNull(photos.deletedAt))).orderBy(asc(issuePages.pageNumber)).all();
  if (!pages.length) notFound();
  const author = db.select({ displayName: users.displayName, username: users.username }).from(users).limit(1).get();
  const authorName = author?.displayName || author?.username || 'ChronoVista';
  const issueNumber = issue.code.replace(/\D/g, '').padStart(2, '0');
  const published = issue.publishedAt?.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  const previous = db.select({ slug: issues.slug, code: issues.code, title: issues.title }).from(issues).where(and(eq(issues.status, 'Published'), eq(issues.visibility, 'Public'), lt(issues.publishedAt, issue.publishedAt ?? new Date()))).orderBy(desc(issues.publishedAt)).limit(1).get();
  const next = db.select({ slug: issues.slug, code: issues.code, title: issues.title }).from(issues).where(and(eq(issues.status, 'Published'), eq(issues.visibility, 'Public'), gt(issues.publishedAt, issue.publishedAt ?? new Date()))).orderBy(asc(issues.publishedAt)).limit(1).get();
  const chapterCount = Math.min(6, Math.ceil(pages.length / 4));
  const chapters = Array.from({ length: chapterCount }, (_, index) => {
    const start = Math.floor(index * pages.length / chapterCount);
    const end = Math.floor((index + 1) * pages.length / chapterCount);
    return { start, end, photo: pages[start], title: pages[start]?.caption?.trim().slice(0, 48) || `Bagian ${String(index + 1).padStart(2, '0')}` };
  });
  const image = (assetId: string) => `/api/public-assets/${assetId}`;
  return <div className={styles.site}>
    <header className={styles.header}><Link href="/" className={styles.brand}>ChronoVista</Link><span className={styles.brandTag}>FOTO. CERITA. MASA DEPAN.</span><nav aria-label="Navigasi publik"><Link href="/published">Arsip</Link><Link href="/published" aria-current="page">Issue</Link><Link href="/">LIVE</Link><Link href="/#tentang">Tentang</Link></nav><div className={styles.headerTools}><Link href="/published" aria-label="Cari issue"><Search size={22}/></Link><Link href="/login">ID⌄</Link><Link href="/dashboard" className={styles.archiveButton}>Jelajahi Arsip <ArrowRight size={16}/></Link></div></header>
    <main className={styles.main}>
      <section className={styles.hero} aria-labelledby="issue-title"><div className={styles.heroText}><p className={styles.kicker}>ISSUE #{issueNumber} · TERBIT {published?.toUpperCase() || 'CHRONOVISTA'}</p><h1 id="issue-title">{issue.title}</h1><p className={styles.subtitle}>{issue.subtitle || 'Cerita visual dari arsip ChronoVista.'}</p><p className={styles.byline}><span className={styles.authorIcon}>{authorName.charAt(0)}</span>Foto &amp; Cerita oleh {authorName}</p><div className={styles.tags}><span>Fotografi</span><span>Issue {issueNumber}</span><span>Hitam Putih</span></div><div className={styles.actions}><a href="#baca" className={styles.readButton}><BookOpen size={20}/>Baca Issue</a><ShareIssueButton title={issue.title}/><a href={`/api/public-issues/${issue.slug}/pdf`} className={styles.pdfButton}><Download size={19}/>Unduh PDF</a></div></div><div className={styles.heroPhotos}><img src={image(pages[0].assetId)} alt={pages[0].altText || issue.title}/><img src={image(pages[Math.min(1, pages.length - 1)].assetId)} alt={pages[Math.min(1, pages.length - 1)].altText || 'Foto dari issue'}/><p>{pages[0].caption || issue.subtitle || issue.title}<span>{pages.length} foto · {chapters.length} bab</span></p></div></section>
      <section className={styles.about}><div><h2>Tentang Issue</h2><p>{issue.description || issue.subtitle || 'Rangkaian fotografi dan cerita dari arsip ChronoVista.'}</p></div><blockquote>“{issue.subtitle || 'Setiap foto punya waktunya, setiap waktu punya cerita.'}”<cite>— {authorName}</cite></blockquote><div className={styles.facts}><span><BookOpen size={19}/>{pages.length} halaman</span><span><Clock3 size={19}/>± {Math.max(1, Math.ceil(pages.length / 3))} menit membaca</span><span><Globe2 size={19}/>Bahasa Indonesia</span></div></section>
      <section className={styles.contents} aria-labelledby="contents-title"><div className={styles.sectionHead}><h2 id="contents-title">Isi Issue</h2><span>Gulir untuk menjelajah <ArrowDown size={15}/></span></div><div className={styles.chapterGrid}>{chapters.map((chapter, index) => <a href={`#foto-${chapter.photo.pageNumber}`} key={chapter.photo.pageNumber}><img src={image(chapter.photo.assetId)} alt={chapter.photo.altText || chapter.title}/><strong>{String(index + 1).padStart(2, '0')} — {chapter.title}</strong><small>Halaman {chapter.start + 1}{chapter.end > chapter.start + 1 ? ` – ${chapter.end}` : ''}</small></a>)}</div></section>
      <section id="baca" className={styles.reader} aria-label="Baca isi issue"><div className={styles.readerIntro}><span>ISSUE #{issueNumber}</span><h2>{issue.title}</h2><p>{issue.subtitle}</p></div>{pages.map(page => <figure id={`foto-${page.pageNumber}`} key={page.pageNumber}><img src={image(page.assetId)} alt={page.altText || page.caption || `Foto halaman ${page.pageNumber}`}/><figcaption><span>{page.caption || `Halaman ${page.pageNumber}`}</span><small>{String(page.pageNumber).padStart(2, '0')} / {String(pages.length).padStart(2, '0')}</small></figcaption></figure>)}</section>
    </main><footer className={styles.footer}><div>{previous ? <Link href={`/issues/${previous.slug}`}><ArrowLeft size={20}/><span>Issue sebelumnya<small>{previous.code} — {previous.title}</small></span></Link> : <span/>}<Link href="/published" className={styles.allIssues}>Semua Issue</Link>{next ? <Link href={`/issues/${next.slug}`}><span>Issue berikutnya<small>{next.code} — {next.title}</small></span><ArrowRight size={20}/></Link> : <span/>}</div></footer>
  </div>;
}
