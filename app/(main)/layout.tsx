import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-[#faf9f5] text-[#18242a]">
      <Sidebar displayName={user.displayName || user.username} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto px-7 pb-5 max-sm:px-4">
          {children}
        </main>
      </div>
    </div>
  );
}
