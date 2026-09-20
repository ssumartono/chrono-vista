import assert from 'node:assert/strict';
import test from 'node:test';
import { parseManualLocation } from '../lib/photo-location';

test('allows a place name without coordinates', () => {
  assert.deepEqual(parseManualLocation({ label: ' Blok M, Jakarta ', latitude: '', longitude: '' }).location, {
    label: 'Blok M, Jakarta', latitude: null, longitude: null, precision: 'city', visibility: 'Private',
  });
});

test('accepts valid coordinate pairs and keeps them private', () => {
  assert.deepEqual(parseManualLocation({ label: '', latitude: '-6.2', longitude: '106.8' }).location, {
    label: null, latitude: -6.2, longitude: 106.8, precision: 'approximate', visibility: 'Private',
  });
});

test('rejects incomplete or out-of-range coordinates', () => {
  assert.ok(parseManualLocation({ label: 'Jakarta', latitude: '-6.2', longitude: '' }).error);
  assert.ok(parseManualLocation({ label: 'Jakarta', latitude: '91', longitude: '106.8' }).error);
  assert.ok(parseManualLocation({ label: '', latitude: '', longitude: '' }).error);
});
