'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { createSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: any, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username dan password wajib diisi' };
  }

  try {
    const user = db.select().from(users).where(eq(users.username, username)).get();

    if (!user) {
      // Simulate checking to prevent timing attacks
      await argon2.hash(password);
      return { error: 'Username atau password salah' };
    }

    const isValid = await argon2.verify(user.passwordHash, password);

    if (!isValid) {
      return { error: 'Username atau password salah' };
    }

    await createSession(user.id);
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Terjadi kesalahan saat login' };
  }

  // Redirect should be outside try-catch
  redirect('/dashboard');
}
