'use server';

import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { layoutTemplates, photoBooks } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { validateTemplatePayload } from '@/lib/photo-book-template';

export async function saveTemplateAction(id: string | null, form: FormData) {
  if (!await getSession()) throw new Error('Masuk kembali untuk menyimpan template.');
  const name = String(form.get('name') ?? '').trim().slice(0, 100);
  const description = String(form.get('description') ?? '').trim().slice(0, 300);
  if (!name) throw new Error('Nama template wajib diisi.');
  let submittedSettings: unknown;
  let submittedElements: unknown;
  try { submittedSettings = JSON.parse(String(form.get('settings') ?? '')); submittedElements = JSON.parse(String(form.get('elements') ?? '')); }
  catch { throw new Error('Data template tidak valid.'); }
  const { settings, elements } = validateTemplatePayload(submittedSettings, submittedElements);
  const pageSize = String(form.get('pageSize') ?? 'A4');
  if (pageSize !== 'A4') throw new Error('Editor saat ini mendukung ukuran A4.');
  const now = new Date();
  const templateId = id ?? randomUUID();
  const values = { name, description: description || null, pageSize, settingsJson: JSON.stringify(settings), elementsJson: JSON.stringify(elements), updatedAt: now };
  if (id) {
    const existing = db.select({ id: layoutTemplates.id }).from(layoutTemplates).where(eq(layoutTemplates.id, id)).get();
    if (!existing) throw new Error('Template tidak ditemukan.');
    db.update(layoutTemplates).set(values).where(eq(layoutTemplates.id, id)).run();
  } else db.insert(layoutTemplates).values({ id: templateId, ...values, createdAt: now }).run();
  revalidatePath('/photo-books/templates');
  redirect(`/photo-books/templates/${templateId}/edit?saved=1`);
}

export async function deleteTemplateAction(id: string) {
  if (!await getSession()) throw new Error('Masuk kembali untuk menghapus template.');
  const used = db.select({ id: photoBooks.id }).from(photoBooks).where(eq(photoBooks.template, `custom:${id}`)).limit(1).get();
  if (used) throw new Error('Template sedang dipakai oleh Photo Book. Ganti template buku sebelum menghapusnya.');
  db.delete(layoutTemplates).where(eq(layoutTemplates.id, id)).run();
  revalidatePath('/photo-books/templates');
  redirect('/photo-books/templates');
}
