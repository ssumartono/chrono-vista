import { randomUUID } from 'node:crypto';
import { and, eq, lte } from 'drizzle-orm';
import { db } from '@/db';
import { issues, notifications } from '@/db/schema';
import { publicationChecklist } from '@/lib/issue-publication';

export function publishDueIssues(now = new Date()) {
  const due = db.select({ id: issues.id }).from(issues).where(and(eq(issues.status, 'Scheduled'), lte(issues.scheduledAt, now))).all();
  for (const item of due) {
    const check = publicationChecklist(item.id);
    if (!check.issue) continue;
    db.transaction(tx => {
      const current = tx.select().from(issues).where(eq(issues.id, item.id)).get();
      if (!current || current.status !== 'Scheduled' || !current.scheduledAt || current.scheduledAt > now) return;
      const failed = check.errors.length > 0;
      tx.update(issues).set(failed
        ? { status: 'Draft', visibility: 'Private', scheduledAt: null }
        : { status: 'Published', visibility: 'Public', publishedAt: now }
      ).where(eq(issues.id, item.id)).run();
      tx.insert(notifications).values({ id: randomUUID(), category: 'Issue', severity: failed ? 'warning' : 'success', title: failed ? 'Jadwal terbit gagal' : 'Issue telah terbit', message: failed ? `${current.title}: ${check.errors.join(' ')}` : `${current.title} berhasil diterbitkan.`, actionUrl: `/issues/${item.id}/preview`, createdAt: now }).run();
    });
  }
  return due.length;
}

declare global { var chronoVistaIssueScheduler: ReturnType<typeof setInterval> | undefined; }

export function startIssueScheduler() {
  if (globalThis.chronoVistaIssueScheduler) return;
  const run = () => { try { publishDueIssues(); } catch (error) { console.error('Issue scheduler:', error); } };
  run();
  globalThis.chronoVistaIssueScheduler = setInterval(run, 30_000);
  globalThis.chronoVistaIssueScheduler.unref();
}
