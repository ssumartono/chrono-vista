import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { assets, importItems, importSessions } from '@/db/schema';
import { ImportHistoryWorkspace, type ImportSessionView } from '@/components/ImportHistoryWorkspace';

export default function ImportHistoryPage() {
  const rows = db.select().from(importSessions).orderBy(desc(importSessions.startedAt)).limit(500).all();
  const sizes = db.select({ sessionId: importItems.sessionId, bytes: sql<number>`coalesce(sum(${assets.bytes}), 0)` }).from(importItems).leftJoin(assets, sql`${assets.photoId} = ${importItems.photoId} and ${assets.type} = 'original'`).where(eq(importItems.status, 'Imported')).groupBy(importItems.sessionId).all();
  const bySession = new Map(sizes.map(row => [row.sessionId, row.bytes]));
  const sessions: ImportSessionView[] = rows.map(row => {
    let totals: { imported?: number; duplicate?: number; failed?: number } = {};
    try { totals = JSON.parse(row.totalsJson ?? '{}'); } catch {}
    return { id: row.id, source: row.source, status: row.status, startedAt: row.startedAt.toISOString(), completedAt: row.completedAt?.toISOString() ?? null, imported: totals.imported ?? 0, duplicate: totals.duplicate ?? 0, failed: totals.failed ?? 0, bytes: bySession.get(row.id) ?? 0 };
  });
  return <ImportHistoryWorkspace sessions={sessions}/>;
}
