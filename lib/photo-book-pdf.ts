import { readFile, realpath } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { degrees, PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import sharp from 'sharp';
import { DERIVATIVES_DIR } from '@/lib/storage';
import { loadAppliedTemplate, resolveBookPages } from '@/lib/photo-book-layout';

type Page = { imagePath: string; caption: string | null };
type Book = { title: string; subtitle: string | null; description: string | null; photographer: string; year: number; pageSize: string; marginMm: number; template: string };
const pt = (mm: number) => mm * 72 / 25.4;
const sizes: Record<string, [number, number]> = { A4: [pt(210), pt(297)], A5: [pt(148), pt(210)], Square: [pt(200), pt(200)] };
const clean = (text: string) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, ' ');

function wrapText(value: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of value.split('\n')) {
    let line = '';
    for (const word of clean(paragraph).split(/\s+/).filter(Boolean)) {
      const next = `${line} ${word}`.trim();
      if (line && font.widthOfTextAtSize(next, size) > maxWidth) { lines.push(line); line = word; }
      else line = next;
    }
    if (line) lines.push(line);
  }
  return lines;
}

async function buildAppliedTemplatePdf(book: Book, photos: Page[]) {
  const template = loadAppliedTemplate(book.template);
  if (!template) throw new Error('Template tidak tersedia.');
  const pages = resolveBookPages(book, photos, template);
  const pdf = await PDFDocument.create();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const root = await realpath(DERIVATIVES_DIR);
  const pageWidth = pt(210), pageHeight = pt(297);
  pdf.setTitle(clean(book.title));
  pdf.setAuthor(clean(book.photographer));
  for (const pageModel of pages) {
    const page = pdf.addPage([pageWidth, pageHeight]);
    for (const { element, photo, text } of pageModel.elements) {
      const x = pt(element.x), y = pageHeight - pt(element.y + element.h);
      const width = pt(element.w), height = pt(element.h);
      if (element.type === 'shape') {
        page.drawRectangle({ x, y, width, height, color: rgb(.05, .39, .32), opacity: element.opacity / 100 });
        continue;
      }
      if (element.type === 'photo') {
        if (!photo) continue;
        const file = await realpath(resolve(photo.imagePath));
        if (!file.startsWith(root + sep)) throw new Error('Aset foto berada di luar penyimpanan.');
        const source = await sharp(await readFile(file)).rotate().jpeg({ quality: 90 }).toBuffer();
        const metadata = await sharp(source).metadata();
        if (!metadata.width || !metadata.height) throw new Error('Dimensi foto tidak tersedia.');
        let imageBytes = source;
        let drawX = x, drawY = y, drawW = width, drawH = height;
        if (element.fit === 'cover') {
          const aspect = element.w / element.h;
          const cropW = Math.max(1, Math.min(metadata.width, Math.round(metadata.height * aspect)));
          const cropH = Math.max(1, Math.min(metadata.height, Math.round(metadata.width / aspect)));
          const left = Math.round((metadata.width - cropW) * element.focusX / 100);
          const top = Math.round((metadata.height - cropH) * element.focusY / 100);
          imageBytes = await sharp(source).extract({ left, top, width: cropW, height: cropH }).resize(Math.max(1, Math.round(width * 2)), Math.max(1, Math.round(height * 2))).jpeg({ quality: 86 }).toBuffer();
        } else {
          const scale = Math.min(width / metadata.width, height / metadata.height);
          drawW = metadata.width * scale; drawH = metadata.height * scale;
          drawX = x + (width - drawW) / 2; drawY = y + (height - drawH) / 2;
        }
        const image = await pdf.embedJpg(imageBytes);
        page.drawImage(image, { x: drawX, y: drawY, width: drawW, height: drawH, opacity: element.opacity / 100, rotate: degrees(element.rotation) });
        if (element.stroke) page.drawRectangle({ x, y, width, height, borderColor: rgb(.08, .23, .2), borderWidth: element.stroke * .75, opacity: element.opacity / 100 });
        continue;
      }
      const font = element.type === 'title' ? bold : element.type === 'page' ? regular : serif;
      const size = element.type === 'title' ? 28 : element.type === 'quote' ? 15 : element.type === 'body' ? 10.5 : 9;
      const lineHeight = size * (element.type === 'body' ? 1.42 : 1.18);
      const columns = element.type === 'body' && element.w >= 120 ? 2 : 1;
      const gap = columns === 2 ? pt(6) : 0;
      const columnWidth = (width - gap) / columns;
      const lines = wrapText(text, font, size, columnWidth);
      const rows = Math.max(1, Math.floor(height / lineHeight));
      lines.slice(0, rows * columns).forEach((line, index) => {
        const column = Math.floor(index / rows);
        const row = index % rows;
        page.drawText(line, { x: x + column * (columnWidth + gap), y: y + height - size - row * lineHeight, size, font, color: rgb(.08, .12, .14), opacity: element.opacity / 100, rotate: degrees(element.rotation) });
      });
    }
  }
  return pdf.save();
}

export async function buildPhotoBookPdf(book: Book, pages: Page[]) {
  if (book.template.startsWith('custom:')) return buildAppliedTemplatePdf(book, pages);
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
