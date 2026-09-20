import { readFile, realpath } from 'node:fs/promises';
import { basename, resolve, sep } from 'node:path';
import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import sharp from 'sharp';
import { defaultPdfMargins, PdfMargins } from '@/lib/issue-pdf-settings';

type PdfPage = { imagePath: string; caption: string | null; filename: string };
const pageWidth = 595.28;
const pageHeight = 841.89;
const mm = (value: number) => value * 72 / 25.4;
const plain = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, ' ');

function wrap(value: string, font: PDFFont, size: number, maxWidth: number) {
  const words = plain(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = `${line} ${word}`.trim();
    if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

export async function buildIssuePdf(input: { code: string; title: string; subtitle?: string | null; pages: PdfPage[]; assetRoot: string; margins?: PdfMargins }) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margins = input.margins ?? defaultPdfMargins;
  const left = mm(margins.left), right = mm(margins.right), top = mm(margins.top), bottom = mm(margins.bottom);
  const contentWidth = pageWidth - left - right;
  pdf.setTitle(plain(input.title));
  pdf.setCreator('ChronoVista');
  const root = await realpath(resolve(input.assetRoot));
  for (const [index, item] of input.pages.entries()) {
    const fullPath = await realpath(resolve(item.imagePath));
    if (!fullPath.startsWith(`${root}${sep}`)) throw new Error('Lokasi gambar tidak valid.');
    const jpeg = await sharp(await readFile(fullPath)).rotate().flatten({ background: '#ffffff' }).jpeg({ quality: 82 }).toBuffer();
    const image = await pdf.embedJpg(jpeg);
    const page = pdf.addPage([pageWidth, pageHeight]);
    let imageTop = pageHeight - top;
    if (index === 0) {
      page.drawText(plain(input.code), { x: left, y: imageTop - 10, font: regular, size: 10, color: rgb(.06, .38, .33) });
      imageTop -= 26;
      const titleLines = wrap(input.title, bold, 20, contentWidth).slice(0, 3);
      for (const line of titleLines) { page.drawText(line, { x: left, y: imageTop - 20, font: bold, size: 20 }); imageTop -= 25; }
      if (input.subtitle) { page.drawText(plain(input.subtitle).slice(0, 100), { x: left, y: imageTop - 13, font: regular, size: 10 }); imageTop -= 29; }
      imageTop -= 9;
    }
    const captionLines = wrap(item.caption || basename(item.filename), regular, 10, contentWidth).slice(0, 8);
    const captionHeight = Math.max(1, captionLines.length) * 14;
    const footerY = Math.max(15, bottom / 2);
    const captionBottom = Math.max(bottom + 14, footerY + 17);
    const imageBottom = captionBottom + captionHeight + 12;
    const maxHeight = Math.max(40, imageTop - imageBottom);
    const scale = Math.min(contentWidth / image.width, maxHeight / image.height);
    const width = image.width * scale, height = image.height * scale;
    page.drawImage(image, { x: left + (contentWidth - width) / 2, y: imageTop - height, width, height });
    captionLines.forEach((line, n) => page.drawText(line, { x: left, y: captionBottom + (captionLines.length - n - 1) * 14, font: regular, size: 10 }));
    page.drawText(`${index + 1} / ${input.pages.length}`, { x: pageWidth - right - 30, y: footerY, font: regular, size: 9, color: rgb(.38, .44, .45) });
  }
  return pdf.save();
}
