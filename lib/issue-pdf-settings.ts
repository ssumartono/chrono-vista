import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';

export type PdfMargins = { top: number; right: number; bottom: number; left: number };
export const defaultPdfMargins: PdfMargins = { top: 18, right: 16, bottom: 18, left: 16 };
const marginKey = (issueId: string) => `issue-pdf-margins:${issueId}`;

export function validPdfMargin(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number >= 5 && number <= 50 ? Math.round(number * 10) / 10 : null;
}

export function getIssuePdfMargins(issueId: string): PdfMargins {
  const row = db.select({ valueJson: settings.valueJson }).from(settings).where(eq(settings.key, marginKey(issueId))).get();
  if (!row) return defaultPdfMargins;
  try {
    const saved = JSON.parse(row.valueJson) as Partial<PdfMargins>;
    return {
      top: validPdfMargin(saved.top) ?? defaultPdfMargins.top,
      right: validPdfMargin(saved.right) ?? defaultPdfMargins.right,
      bottom: validPdfMargin(saved.bottom) ?? defaultPdfMargins.bottom,
      left: validPdfMargin(saved.left) ?? defaultPdfMargins.left,
    };
  } catch { return defaultPdfMargins; }
}

export function saveIssuePdfMargins(issueId: string, margins: PdfMargins) {
  db.insert(settings).values({ key: marginKey(issueId), valueJson: JSON.stringify(margins), updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { valueJson: JSON.stringify(margins), updatedAt: new Date() } }).run();
}
