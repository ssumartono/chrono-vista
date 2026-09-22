import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { layoutTemplates } from '@/db/schema';
import { type TemplateElement, type TemplateSettings, validateTemplatePayload } from '@/lib/photo-book-template';

export type AppliedTemplate = { id: string; name: string; settings: TemplateSettings; elements: TemplateElement[] };
export type BookLayoutData = { title: string; description: string | null };
export type LayoutPhoto = { caption: string | null };
export type ResolvedElement<T extends LayoutPhoto> = { element: TemplateElement; photo: T | null; text: string };
export type ResolvedPage<T extends LayoutPhoto> = { number: number; spread: number; side: 0 | 1; elements: ResolvedElement<T>[] };

export function loadAppliedTemplate(value: string): AppliedTemplate | null {
  if (!value.startsWith('custom:')) return null;
  const id = value.slice(7);
  const row = db.select().from(layoutTemplates).where(eq(layoutTemplates.id, id)).get();
  if (!row) return null;
  try {
    const { settings, elements } = validateTemplatePayload(JSON.parse(row.settingsJson), JSON.parse(row.elementsJson));
    return { id, name: row.name, settings, elements };
  } catch { return null; }
}

export function resolveBookPages<T extends LayoutPhoto>(book: BookLayoutData, photos: T[], template: AppliedTemplate): ResolvedPage<T>[] {
  const frames = template.elements.filter(element => element.type === 'photo' && !element.hidden);
  if (!frames.length || !photos.length) return [];
  const pages: ResolvedPage<T>[] = [];
  const spreadCount = Math.ceil(photos.length / frames.length);
  for (let spread = 0; spread < spreadCount; spread++) {
    const assigned = new Map(frames.map((frame, index) => [frame.id, photos[spread * frames.length + index] ?? null]));
    const firstPhoto = photos[spread * frames.length];
    for (const side of [0, 1] as const) {
      const number = spread * 2 + side + 1;
      const elements = template.elements.filter(element => element.page === side && !element.hidden).map(element => {
        const photo = element.type === 'photo' ? assigned.get(element.id) ?? null : null;
        let text = element.text;
        if (element.type === 'title') text = spread === 0 ? book.title : firstPhoto.caption || element.text;
        if (element.type === 'body') text = spread === 0 ? book.description || element.text : firstPhoto.caption || element.text;
        if (element.type === 'page') text = String(number);
        return { element, photo, text };
      });
      pages.push({ number, spread, side, elements });
    }
  }
  return pages;
}
