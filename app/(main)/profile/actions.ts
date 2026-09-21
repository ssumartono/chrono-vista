'use server';

import path from 'node:path';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import * as argon2 from 'argon2';
import sharp from 'sharp';
import { and, eq, ne } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createHash } from 'node:crypto';
import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { getSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getUserProfileDetails, saveUserProfileDetails } from '@/lib/user-profile';

const text = (form: FormData, key: string, limit: number) => String(form.get(key) ?? '').trim().slice(0, limit);
async function owner() { const user = await getSession(); if (!user) throw new Error('Sesi berakhir. Masuk kembali.'); return user; }
async function currentSessionId() { const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value; if (!token) return ''; return db.select({ id: sessions.id }).from(sessions).where(eq(sessions.tokenHash, createHash('sha256').update(token).digest('hex'))).get()?.id ?? ''; }

export async function saveProfileAction(form: FormData) {
  const user = await owner();
  const displayName = text(form, 'displayName', 120);
  if (!displayName) throw new Error('Nama tampilan wajib diisi.');
  const email = text(form, 'email', 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Alamat email tidak valid.');
  const previous = getUserProfileDetails(user.id);
  saveUserProfileDetails(user.id, { phone: text(form, 'phone', 40), location: text(form, 'location', 160), timezone: text(form, 'timezone', 80) || 'Asia/Jakarta', bio: text(form, 'bio', 500), website: text(form, 'website', 200), twoFactorEnabled: previous.twoFactorEnabled, loginAlerts: previous.loginAlerts });
  db.update(users).set({ displayName, email: email || null }).where(eq(users.id, user.id)).run();
  revalidatePath('/profile'); revalidatePath('/settings');
  redirect('/profile?saved=1');
}

export async function uploadAvatarAction(form: FormData) {
  const user = await owner();
  const file = form.get('avatar');
  if (!(file instanceof File) || !file.size) redirect('/profile?avatarError=missing');
  if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) redirect('/profile?avatarError=invalid');
  const directory = path.join(process.cwd(), 'media', 'profiles');
  await mkdir(directory, { recursive: true });
  const filename = path.join(directory, `${user.id}.webp`);
  await writeFile(filename, await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize(512, 512, { fit: 'cover' }).webp({ quality: 86 }).toBuffer());
  db.update(users).set({ avatarPath: filename }).where(eq(users.id, user.id)).run();
  revalidatePath('/profile'); redirect('/profile?avatarSaved=1');
}

export async function deleteAvatarAction() {
  const user = await owner();
  if (user.avatarPath) await rm(user.avatarPath, { force: true }).catch(() => {});
  db.update(users).set({ avatarPath: null }).where(eq(users.id, user.id)).run();
  revalidatePath('/profile'); redirect('/profile?avatarDeleted=1');
}

export async function changePasswordAction(form: FormData) {
  const user = await owner();
  const current = String(form.get('currentPassword') ?? '');
  const next = String(form.get('newPassword') ?? '');
  const confirmation = String(form.get('confirmPassword') ?? '');
  if (!await argon2.verify(user.passwordHash, current)) redirect('/profile?passwordError=current');
  if (next.length < 12 || !/[a-z]/.test(next) || !/[A-Z]/.test(next) || !/\d/.test(next) || !/[^A-Za-z0-9]/.test(next)) redirect('/profile?passwordError=weak');
  if (next !== confirmation) redirect('/profile?passwordError=confirm');
  db.update(users).set({ passwordHash: await argon2.hash(next) }).where(eq(users.id, user.id)).run();
  const activeId = await currentSessionId();
  if (activeId) db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, user.id), ne(sessions.id, activeId))).run();
  revalidatePath('/profile'); redirect('/profile?passwordSaved=1');
}

export async function saveSecurityAction(form: FormData) {
  const user = await owner();
  const previous = getUserProfileDetails(user.id);
  saveUserProfileDetails(user.id, { ...previous, twoFactorEnabled: form.get('twoFactorEnabled') === 'on', loginAlerts: form.get('loginAlerts') === 'on' });
  revalidatePath('/profile'); redirect('/profile?securitySaved=1');
}

export async function revokeOtherSessionsAction() {
  const user = await owner();
  const activeId = await currentSessionId();
  if (activeId) db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, user.id), ne(sessions.id, activeId))).run();
  revalidatePath('/profile'); redirect('/profile?sessionsRevoked=1');
}
