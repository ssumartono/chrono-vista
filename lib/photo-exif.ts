import * as exifr from 'exifr';
import { resolvePhotoDate } from '@/lib/photo-date';

type Tags = Record<string, unknown>;
const string = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : null;
const text = (value: string) => value || null;

function cameraName(tags: Tags) {
  const make = string(tags.Make);
  const model = string(tags.Model);
  return text(make && model && !model.toLowerCase().startsWith(make.toLowerCase()) ? `${make} ${model}` : model || make);
}

function shutter(value: number | null) {
  if (value === null || value <= 0) return null;
  return value < 1 ? `1/${Math.round(1 / value)} s` : `${Number(value.toFixed(3))} s`;
}

function serializableTags(tags: Tags) {
  return JSON.parse(JSON.stringify(tags, (_key, value: unknown) => {
    if (value instanceof Uint8Array) return Array.from(value.slice(0, 1024));
    if (typeof value === 'bigint') return value.toString();
    return value;
  })) as Tags;
}

export async function readPhotoExif(exif: Buffer | undefined, lastModified: number) {
  const photoDate = resolvePhotoDate(exif, lastModified);
  let tags: Tags = {};
  let parseError: string | undefined;
  try {
    if (exif) {
      const tiff = exif.subarray(0, 6).toString('ascii') === 'Exif\0\0' ? exif.subarray(6) : exif;
      tags = await exifr.parse(tiff, { tiff: true, ifd0: {}, exif: true, gps: true, makerNote: false, reviveValues: false }) ?? {};
    }
  } catch (error) {
    parseError = error instanceof Error ? error.message.slice(0, 200) : 'EXIF tidak dapat dibaca.';
  }
  const fNumber = number(tags.FNumber);
  const apertureValue = number(tags.ApertureValue);
  const focal = number(tags.FocalLength);
  const iso = number(tags.ISO) ?? number(tags.ISOSpeedRatings);
  const latitude = number(tags.latitude);
  const longitude = number(tags.longitude);
  const hasGps = latitude !== null && longitude !== null && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  return {
    photoDate,
    exif: {
      camera: cameraName(tags),
      lens: text(string(tags.LensModel) || string(tags.LensSpecification)),
      focal: focal !== null && focal > 0 ? `${Number(focal.toFixed(2))} mm` : null,
      aperture: fNumber !== null && fNumber > 0 ? `f/${Number(fNumber.toFixed(2))}` : apertureValue !== null ? `f/${Number((2 ** (apertureValue / 2)).toFixed(2))}` : null,
      shutter: shutter(number(tags.ExposureTime)),
      iso: iso !== null && Number.isInteger(iso) && iso > 0 ? iso : null,
      ev: number(tags.ExposureBiasValue),
      rawJson: JSON.stringify({ tags: serializableTags(tags), dateSource: photoDate.source, originalDate: photoDate.original, offset: photoDate.offset, timezoneAssumed: photoDate.timezoneAssumed, parseError }),
    },
    location: hasGps ? { latitude, longitude, precision: 'exact', visibility: 'Private' } : null,
  };
}
