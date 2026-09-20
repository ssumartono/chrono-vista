import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { readPhotoExif } from '../lib/photo-exif';

test('records camera and exposure fields from JPEG EXIF', async () => {
  const image = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } })
    .jpeg().withExif({ IFD0: { Make: 'Fujifilm', Model: 'X100V' }, IFD2: { DateTimeOriginal: '2022:07:08 09:10:11', FNumber: '8', ExposureTime: '1/500', ISOSpeedRatings: '400', FocalLength: '23', LensModel: '23mm F2' } }).toBuffer();
  const result = await readPhotoExif((await sharp(image).metadata()).exif, Date.UTC(2025, 0, 1));
  assert.equal(result.photoDate.source, 'exif');
  assert.equal(result.exif.camera, 'Fujifilm X100V');
  assert.equal(result.exif.lens, '23mm F2');
  assert.equal(result.exif.aperture, 'f/8');
  assert.equal(result.exif.shutter, '1/500 s');
  assert.equal(result.exif.iso, 400);
  assert.equal(result.exif.focal, '23 mm');
  assert.equal((JSON.parse(result.exif.rawJson).tags as Record<string, unknown>).ISO, 400);
});

test('records GPS privately from WebP EXIF', async () => {
  const image = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } })
    .webp().withExif({ IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '6/1 12/1 0/1', GPSLongitudeRef: 'E', GPSLongitude: '106/1 48/1 0/1' } }).toBuffer();
  const result = await readPhotoExif((await sharp(image).metadata()).exif, Date.UTC(2025, 0, 1));
  assert.deepEqual(result.location, { latitude: -6.2, longitude: 106.8, precision: 'exact', visibility: 'Private' });
});

test('reads EXIF from PNG imports', async () => {
  const image = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } })
    .png().withExif({ IFD0: { Make: 'Nikon', Model: 'Z6' } }).toBuffer();
  const result = await readPhotoExif((await sharp(image).metadata()).exif, Date.UTC(2025, 0, 1));
  assert.equal(result.exif.camera, 'Nikon Z6');
});

test('keeps a usable fallback when EXIF is missing', async () => {
  const fallback = Date.UTC(2024, 1, 3);
  const result = await readPhotoExif(undefined, fallback);
  assert.equal(result.photoDate.date.getTime(), fallback);
  assert.equal(result.photoDate.source, 'file');
  assert.equal(result.exif.camera, null);
  assert.equal(result.location, null);
});
