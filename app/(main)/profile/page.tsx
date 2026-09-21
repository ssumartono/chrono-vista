import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { getSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getUserProfileDetails } from '@/lib/user-profile';
import { ProfileWorkspace } from '@/components/ProfileWorkspace';
import { changePasswordAction, deleteAvatarAction, revokeOtherSessionsAction, saveProfileAction, saveSecurityAction, uploadAvatarAction } from './actions';

export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getSession();
  if (!user) return null;
  const query = await searchParams;
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? '';
  const tokenHash = token ? createHash('sha256').update(token).digest('hex') : '';
  const activeSessions = db.select({ id: sessions.id, expiresAt: sessions.expiresAt, current: eq(sessions.tokenHash, tokenHash) }).from(sessions).where(and(eq(sessions.userId, user.id), isNull(sessions.revokedAt))).orderBy(desc(sessions.expiresAt)).all();
  return <ProfileWorkspace user={{ username: user.username, displayName: user.displayName || user.username, email: user.email || '', hasAvatar: Boolean(user.avatarPath) }} details={getUserProfileDetails(user.id)} sessions={activeSessions.map(item => ({ id: item.id, expiresAt: item.expiresAt.toISOString(), current: Boolean(item.current) }))} messages={query} saveProfileAction={saveProfileAction} uploadAvatarAction={uploadAvatarAction} deleteAvatarAction={deleteAvatarAction} changePasswordAction={changePasswordAction} saveSecurityAction={saveSecurityAction} revokeOtherSessionsAction={revokeOtherSessionsAction}/>;
}
