export type TemplateElementType = 'photo' | 'title' | 'body' | 'quote' | 'page' | 'shape';
export type TemplateElement = {
  id: string; type: TemplateElementType; page: 0 | 1;
  x: number; y: number; w: number; h: number;
  text: string; hidden: boolean; locked: boolean; fit: 'cover' | 'contain';
  rotation: number; radius: number; stroke: number; opacity: number; focusX: number; focusY: number;
};
export type TemplateSettings = {
  top: number; right: number; bottom: number; left: number;
  bleed: number; columns: number; grid: boolean; snap: boolean;
};

export const defaultTemplateSettings: TemplateSettings = { top: 18, right: 22, bottom: 18, left: 16, bleed: 3, columns: 6, grid: true, snap: true };
export const defaultTemplateElements: TemplateElement[] = [
  { id: 'photo-main', type: 'photo', page: 0, x: 16, y: 18, w: 176, h: 246, text: 'Foto Utama', hidden: false, locked: false, fit: 'cover', rotation: 0, radius: 0, stroke: 0, opacity: 100, focusX: 50, focusY: 50 },
  { id: 'left-page', type: 'page', page: 0, x: 92, y: 277, w: 24, h: 8, text: '12', hidden: false, locked: false, fit: 'contain', rotation: 0, radius: 0, stroke: 0, opacity: 100, focusX: 50, focusY: 50 },
  { id: 'title-main', type: 'title', page: 1, x: 20, y: 40, w: 170, h: 63, text: 'Cerita di\nSudut Kota', hidden: false, locked: false, fit: 'contain', rotation: 0, radius: 0, stroke: 0, opacity: 100, focusX: 50, focusY: 50 },
  { id: 'body-main', type: 'body', page: 1, x: 20, y: 128, w: 170, h: 123, text: 'Kota selalu punya cara sendiri untuk bercerita. Di antara hiruk pikuk kendaraan, langkah kaki, dan cahaya yang berubah, setiap sudut menyimpan kisah kehidupan.', hidden: false, locked: false, fit: 'contain', rotation: 0, radius: 0, stroke: 0, opacity: 100, focusX: 50, focusY: 50 },
  { id: 'right-page', type: 'page', page: 1, x: 92, y: 277, w: 24, h: 8, text: '13', hidden: false, locked: false, fit: 'contain', rotation: 0, radius: 0, stroke: 0, opacity: 100, focusX: 50, focusY: 50 },
];

export const builtInTemplates = [
  { name: 'Editorial', detail: 'Ritme foto dan caption dengan margin seimbang.', margin: 18 },
  { name: 'Minimal', detail: 'Ruang putih lebih luas untuk tiap foto.', margin: 25 },
  { name: 'Gallery', detail: 'Tampilan foto besar dengan caption ringkas.', margin: 12 },
  { name: 'Full Bleed', detail: 'Foto memenuhi halaman hingga tepi.', margin: 0 },
];

export function validateTemplatePayload(settings: unknown, elements: unknown): { settings: TemplateSettings; elements: TemplateElement[] } {
  if (!settings || typeof settings !== 'object') throw new Error('Pengaturan template tidak valid.');
  const input = settings as Record<string, unknown>;
  const number = (key: keyof TemplateSettings, min: number, max: number) => {
    const value = Number(input[key]);
    if (!Number.isFinite(value) || value < min || value > max) throw new Error(`Nilai ${key} tidak valid.`);
    return value;
  };
  const cleanSettings: TemplateSettings = {
    top: number('top', 0, 50), right: number('right', 0, 50), bottom: number('bottom', 0, 50), left: number('left', 0, 50),
    bleed: number('bleed', 0, 10), columns: number('columns', 1, 12), grid: Boolean(input.grid), snap: Boolean(input.snap),
  };
  if (!Array.isArray(elements) || elements.length > 80) throw new Error('Jumlah elemen template tidak valid.');
  const allowed = ['photo', 'title', 'body', 'quote', 'page', 'shape'];
  const cleanElements: TemplateElement[] = elements.map((item: unknown, index) => {
    if (!item || typeof item !== 'object') throw new Error(`Elemen ${index + 1} tidak valid.`);
    const element = item as Record<string, unknown>;
    const type = String(element.type);
    if (!allowed.includes(type)) throw new Error('Jenis elemen tidak valid.');
    const page = Number(element.page);
    if (page !== 0 && page !== 1) throw new Error('Halaman elemen tidak valid.');
    const n = (key: 'x' | 'y' | 'w' | 'h') => Number(element[key]);
    const [x, y, w, h] = [n('x'), n('y'), n('w'), n('h')];
    if (![x, y, w, h].every(Number.isFinite) || x < 0 || y < 0 || w < 1 || h < 1 || x + w > 210.01 || y + h > 297.01) throw new Error(`Posisi elemen ${index + 1} di luar halaman.`);
    const bounded = (key: string, fallback: number, min: number, max: number) => { const value = Number(element[key] ?? fallback); if (!Number.isFinite(value) || value < min || value > max) throw new Error(`Nilai ${key} tidak valid.`); return value; };
    return { id: String(element.id || '').slice(0, 80) || `element-${index}`, type: type as TemplateElementType, page, x, y, w, h, text: String(element.text || '').slice(0, 3000), hidden: Boolean(element.hidden), locked: Boolean(element.locked), fit: element.fit === 'contain' ? 'contain' : 'cover', rotation: bounded('rotation', 0, -360, 360), radius: bounded('radius', 0, 0, 100), stroke: bounded('stroke', 0, 0, 30), opacity: bounded('opacity', 100, 0, 100), focusX: bounded('focusX', 50, 0, 100), focusY: bounded('focusY', 50, 0, 100) };
  });
  if (!cleanElements.some(element => element.type === 'photo' && !element.hidden)) throw new Error('Template memerlukan sedikitnya satu frame foto.');
  return { settings: cleanSettings, elements: cleanElements };
}
