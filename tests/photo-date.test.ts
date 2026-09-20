import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { readExifDate, resolvePhotoDate } from '../lib/photo-date';

test('reads capture date from EXIF TIFF metadata', async () => {
  const jpeg = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } })
    .jpeg().withExif({ IFD0: { DateTime: '2020:01:02 03:04:05' } }).toBuffer();
  const exif = (await sharp(jpeg).metadata()).exif;
  const result = readExifDate(exif);
  assert.equal(result?.source, 'exif');
  assert.equal(result?.date.toISOString(), '2020-01-01T20:04:05.000Z');
  assert.equal(result?.timezoneAssumed, true);
});

test('uses file modification time when EXIF has no date', () => {
  const fileTime = Date.UTC(2021, 4, 6, 7, 8, 9);
  const result = resolvePhotoDate(undefined, fileTime);
  assert.equal(result.source, 'file');
  assert.equal(result.date.getTime(), fileTime);
});

test('prefers DateTimeOriginal over file modification time', async () => {
  const jpeg = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } })
    .jpeg().withExif({ IFD2: { DateTimeOriginal: '2022:07:08 09:10:11' } }).toBuffer();
  const exif = (await sharp(jpeg).metadata()).exif;
  const result = resolvePhotoDate(exif, Date.UTC(2025, 0, 1));
  assert.equal(result.source, 'exif');
  assert.equal(result.date.toISOString(), '2022-07-08T02:10:11.000Z');
});
