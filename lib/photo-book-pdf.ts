import { readFile, realpath } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import sharp from 'sharp';
import { DERIVATIVES_DIR } from '@/lib/storage';

type Page = { imagePath: string; caption: string | null };
type Book = { title: string; subtitle: string | null; photographer: string; year: number; pageSize: string; marginMm: number; template: string };
const pt = (mm: number) => mm * 72 / 25.4;
const sizes: Record<string, [number, number]> = { A4: [pt(210), pt(297)], A5: [pt(148), pt(210)], Square: [pt(200), pt(200)] };
const clean = (text: string) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, ' ').slice(0, 180);

export async function buildPhotoBookPdf(book: Book, pages: Page[]) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const [width, height] = sizes[book.pageSize] ?? sizes.A4;
  const root = await realpath(DERIVATIVES_DIR);
  const margin = pt(book.template === 'Full Bleed' ? 0 : book.marginMm);
  pdf.setTitle(clean(book.title));
  pdf.setAuthor(clean(book.photographer));
  for (const [index, item] of pages.entries()) {
    const file = await realpath(resolve(item.imagePath));
    if (!file.startsWith(root + sep)) throw new Error('Aset foto berada di luar penyimpanan.');
    const jpg = await sharp(await readFile(file)).rotate().flatten({ background: '#ffffff' }).jpeg({ quality: 85 }).toBuffer();
    const image = await pdf.embedJpg(jpg);
    const page = pdf.addPage([width, height]);
    const header = index === 0 ? 90 : 0;
    const footer = item.caption ? 43 : 25;
    const availableW = width - margin * 2;
    const availableH = height - margin * 2 - header - footer;
    const scale = Math.min(availableW / image.width, availableH / image.height);
    const drawW = image.width * scale, drawH = image.height * scale;
    page.drawImage(image, { x: (width - drawW) / 2, y: height - margin - header - drawH, width: drawW, height: drawH });
    if (index === 0) {
      const title = clean(book.title);
      page.drawText(title.length > 45 ? `${title.slice(0, 42)}...` : title, { x: margin || 18, y: height - (margin || 18) - 27, size: 20, font: bold });
      page.drawText(clean(`${book.photographer} · ${book.year}`), { x: margin || 18, y: height - (margin || 18) - 47, size: 10, font: regular });
      if (book.subtitle) page.drawText(clean(book.subtitle).slice(0, 70), { x: margin || 18, y: height - (margin || 18) - 64, size: 9, font: regular });
    }
    if (item.caption) page.drawText(clean(item.caption).slice(0, 105), { x: margin || 18, y: Math.max(20, margin + 16), size: 9, font: regular });
    page.drawText(`${index + 1} / ${pages.length}`, { x: width - (margin || 18) - 36, y: Math.max(12, margin / 2), size: 8, font: regular, color: rgb(.36, .43, .42) });
  }
  return pdf.save();
}
