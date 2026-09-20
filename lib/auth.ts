import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'chronovista_session';

export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId: string) {
  const token = generateSessionToken();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  // 30 days expiry
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  
  const sessionId = crypto.randomUUID();
  
  db.insert(sessions).values({
    id: sessionId,
    userId: userId,
    tokenHash: tokenHash,
    expiresAt: expiresAt,
  }).run();
  
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
  
  return sessionId;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) return null;
  
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  const result = db.select({
    user: users,
    session: sessions
  })
  .from(sessions)
  .innerJoin(users, eq(sessions.userId, users.id))
  .where(eq(sessions.tokenHash, tokenHash))
  .get();
  
  if (!result) return null;
  
  if (result.session.expiresAt.getTime() < Date.now() || result.session.revokedAt) {
    return null;
  }
  
  return result.user;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    db.update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.tokenHash, tokenHash))
      .run();
  }
  
  cookieStore.delete(SESSION_COOKIE_NAME);
}
