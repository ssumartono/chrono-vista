'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/(main)/actions';
import { Aperture, BookOpen, CalendarDays, ImageIcon, LayoutDashboard, LogOut, Radio, Settings, Upload } from 'lucide-react';

const navItems = [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { href: '/archive', label: 'Arsip Foto', icon: ImageIcon }, { href: '/timeline', label: 'Timeline', icon: CalendarDays }, { href: '/issues', label: 'Issue', icon: BookOpen }, { href: '/live', label: 'LIVE', icon: Radio }, { href: '/import', label: 'Import', icon: Upload }, { href: '/settings', label: 'Pengaturan', icon: Settings }];

export function Sidebar({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  return <aside className="flex w-60 shrink-0 flex-col border-r border-[#dce1de] bg-[#fffefa] max-lg:w-18 max-sm:w-15">
    <Link href="/dashboard" className="flex min-h-27 items-center gap-3 px-6 max-lg:justify-center max-lg:px-2"><Aperture size={42} fill="#20333a" color="#fffefa" strokeWidth={1.2} className="shrink-0 max-lg:h-9 max-lg:w-9"/><span className="max-lg:hidden"><strong className="block text-xl font-extrabold tracking-tight">ChronoVista</strong><small className="block text-[9px] tracking-[.22em] text-[#607579]">SETIAP FOTO<br/>PUNYA CERITA</small></span></Link>
    <nav aria-label="Navigasi ruang kerja" className="flex-1 space-y-1 px-3 pt-4 max-lg:px-2">{navItems.map(item => { const Icon = item.icon; const active = pathname === item.href || pathname.startsWith(item.href + '/'); return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} title={item.label} className={`flex items-center gap-4 rounded px-4 py-3 text-sm transition-colors max-lg:justify-center max-lg:px-2 ${active ? 'bg-[#e2f0eb] font-semibold text-[#115c54]' : 'text-[#253941] hover:bg-[#edf3f0]'}`}><Icon size={22} strokeWidth={1.8}/><span className="max-lg:hidden">{item.label}</span></Link>; })}</nav>
    <div className="mx-5 border-t border-[#dce1de] pt-4 max-lg:mx-2"><Link href="/profile" className="flex items-center gap-3 text-sm max-lg:justify-center" title={displayName}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dce8e3] font-bold text-[#195e55]">{displayName.charAt(0).toUpperCase()}</span><span className="truncate max-lg:hidden">{displayName}<small className="block text-[#71817f]">Pengguna</small></span></Link><form action={logoutAction}><button className="mt-4 flex w-full items-center gap-4 px-2 py-3 text-sm hover:text-[#116a5c] max-lg:justify-center" title="Keluar"><LogOut size={20}/><span className="max-lg:hidden">Keluar</span></button></form></div>
    <p className="px-6 pb-6 pt-6 font-mono text-[9px] tracking-[.22em] text-[#6e8583] max-lg:hidden">MOMEN HARI INI<br/>JADI MASA DEPAN NANTI</p>
  </aside>;
}
