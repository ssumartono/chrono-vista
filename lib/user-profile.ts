import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';

export type UserProfileDetails = { phone: string; location: string; timezone: string; bio: string; website: string; twoFactorEnabled: boolean; loginAlerts: boolean };
export const defaultProfileDetails: UserProfileDetails = { phone: '', location: '', timezone: 'Asia/Jakarta', bio: '', website: '', twoFactorEnabled: false, loginAlerts: true };
const key = (userId: string) => `user-profile:${userId}`;
export function getUserProfileDetails(userId: string): UserProfileDetails {
  const row = db.select({ valueJson: settings.valueJson }).from(settings).where(eq(settings.key, key(userId))).get();
  if (!row) return defaultProfileDetails;
  try { return { ...defaultProfileDetails, ...JSON.parse(row.valueJson) as Partial<UserProfileDetails> }; } catch { return defaultProfileDetails; }
}
export function saveUserProfileDetails(userId: string, value: UserProfileDetails) {
  db.insert(settings).values({ key: key(userId), valueJson: JSON.stringify(value), updatedAt: new Date() }).onConflictDoUpdate({ target: settings.key, set: { valueJson: JSON.stringify(value), updatedAt: new Date() } }).run();
}
