import Link from 'next/link';
import { Bell, Search, UserRound } from 'lucide-react';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { count, isNull } from 'drizzle-orm';

export function Header() {
  const unread = db.select({ value: count() }).from(notifications).where(isNull(notifications.readAt)).get()?.value ?? 0;
  return <header className="flex h-22 shrink-0 items-center justify-end gap-5 px-7 max-sm:h-17 max-sm:gap-3 max-sm:px-4">
    <form action="/search" className="relative w-full max-w-86"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#536872]" size={19}/><input type="search" name="q" aria-label="Cari foto dan Issue" placeholder="Cari foto, issue, lokasi..." className="h-11 w-full rounded-md border border-[#d2d9d6] bg-white pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#176f60]"/></form>
    <Link href="/notifications" aria-label={`Notifikasi, ${unread} belum dibaca`} className="relative flex h-10 w-10 shrink-0 items-center justify-center"><Bell size={23} strokeWidth={1.6}/>{unread > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border border-white bg-[#16836f]"/>}</Link>
    <Link href="/profile" aria-label="Profil" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dfe7e3] text-[#2c5c55]"><UserRound size={21}/></Link>
  </header>;
}
