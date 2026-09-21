import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = await getSession();
  if (!user?.avatarPath) return new Response('Not found', { status: 404 });
  const root = path.resolve(process.cwd(), 'media', 'profiles');
  const target = path.resolve(user.avatarPath);
  if (!target.startsWith(`${root}${path.sep}`)) return new Response('Not found', { status: 404 });
  try { return new Response(await readFile(target), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } }); }
  catch { return new Response('Not found', { status: 404 }); }
}
