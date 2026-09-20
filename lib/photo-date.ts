export type PhotoDate = { date: Date; source: 'exif' | 'file'; original?: string; offset?: string; timezoneAssumed?: boolean };

export function readExifDate(exif?: Buffer): PhotoDate | null {
  if (!exif || exif.length < 8) return null;
  const data = exif;
  const base = exif.subarray(0, 6).toString('ascii') === 'Exif\0\0' ? 6 : 0;
  const endian = exif.toString('ascii', base, base + 2);
  if (endian !== 'II' && endian !== 'MM') return null;
  const little = endian === 'II';
  const inBounds = (offset: number, bytes: number) => Number.isInteger(offset) && offset >= 0 && bytes >= 0 && offset + bytes <= exif.length;
  const u16 = (offset: number) => inBounds(offset, 2) ? (little ? exif.readUInt16LE(offset) : exif.readUInt16BE(offset)) : null;
  const u32 = (offset: number) => inBounds(offset, 4) ? (little ? exif.readUInt32LE(offset) : exif.readUInt32BE(offset)) : null;
  if (u16(base + 2) !== 42) return null;
  const ifd0 = u32(base + 4);
  if (ifd0 == null) return null;
  function entries(relative: number) {
    const start = base + relative;
    const length = u16(start);
    if (length == null || length > 1024 || !inBounds(start + 2, length * 12)) return [];
    return Array.from({ length }, (_, index) => start + 2 + index * 12);
  }
  function ascii(entry: number) {
    if (entry < base || !inBounds(entry, 12)) return undefined;
    if (u16(entry + 2) !== 2) return undefined;
    const length = u32(entry + 4);
    if (!length || length > 256) return undefined;
    const value = length <= 4 ? entry + 8 : base + (u32(entry + 8) ?? -1);
    if (!inBounds(value, length)) return undefined;
    return data.toString('ascii', value, value + length).replace(/\0+$/, '').trim();
  }
  const root = entries(ifd0);
  const pointer = root.find(entry => u16(entry) === 0x8769);
  const exifIfd = pointer ? u32(pointer + 8) : null;
  const capture = exifIfd == null ? [] : entries(exifIfd);
  const original = ascii(capture.find(entry => u16(entry) === 0x9003) ?? -1)
    ?? ascii(capture.find(entry => u16(entry) === 0x9004) ?? -1)
    ?? ascii(root.find(entry => u16(entry) === 0x0132) ?? -1);
  if (!original) return null;
  const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(original);
  if (!match || Number(match[1]) < 1900 || Number(match[1]) > 2100) return null;
  const offsetTag = ascii(capture.find(entry => u16(entry) === 0x9011) ?? -1);
  const offset = offsetTag && /^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(offsetTag) ? offsetTag : undefined;
  const iso = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}${offset ?? '+07:00'}`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : { date, source: 'exif', original, offset, timezoneAssumed: !offset };
}

export function resolvePhotoDate(exif: Buffer | undefined, lastModified: number): PhotoDate {
  const fromExif = readExifDate(exif);
  if (fromExif) return fromExif;
  const fileDate = new Date(lastModified);
  const date = Number.isFinite(lastModified) && fileDate.getFullYear() >= 1900 && fileDate.getTime() <= Date.now() + 86400000 ? fileDate : new Date();
  return { date, source: 'file' };
}
