import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveBookPages, type AppliedTemplate } from '../lib/photo-book-layout';
import { defaultTemplateElements, defaultTemplateSettings } from '../lib/photo-book-template';

const template: AppliedTemplate = { id: 'test', name: 'Spread A4', settings: defaultTemplateSettings, elements: defaultTemplateElements };

test('template spread applies every photo once and fills book text', () => {
  const photos = [{ caption: 'Foto pertama' }, { caption: 'Foto kedua' }, { caption: 'Foto ketiga' }];
  const pages = resolveBookPages({ title: 'Cerita Jakarta', description: 'Pembuka buku' }, photos, template);
  assert.equal(pages.length, 6);
  assert.deepEqual(pages.flatMap(page => page.elements.filter(item => item.element.type === 'photo').map(item => item.photo)), photos);
  assert.equal(pages[1].elements.find(item => item.element.type === 'title')?.text, 'Cerita Jakarta');
  assert.equal(pages[1].elements.find(item => item.element.type === 'body')?.text, 'Pembuka buku');
  assert.equal(pages[3].elements.find(item => item.element.type === 'title')?.text, 'Foto kedua');
  assert.equal(pages[5].elements.find(item => item.element.type === 'page')?.text, '6');
});

test('multiple photo frames consume photos across spreads without duplication', () => {
  const twoFrames: AppliedTemplate = { ...template, elements: [...template.elements, { ...template.elements[0], id: 'photo-second', page: 1 }] };
  const photos = [{ caption: 'A' }, { caption: 'B' }, { caption: 'C' }];
  const pages = resolveBookPages({ title: 'Buku', description: null }, photos, twoFrames);
  assert.equal(pages.length, 4);
  assert.deepEqual(pages.flatMap(page => page.elements.filter(item => item.element.type === 'photo' && item.photo).map(item => item.photo)), photos);
});
