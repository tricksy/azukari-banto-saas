import type { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import { WorkerHeader } from '@/components/worker/Header';
import { BottomNav } from '@/components/worker/BottomNav';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: '預かり番頭β - 担当者',
  description: '着物・帯預かり管理システム - 担当者用画面',
  robots: 'noindex, nofollow',
};

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isLoginPage = pathname === '/login' || pathname.endsWith('/login');

  const session = isLoginPage ? null : await getSession();

  return (
    <div className="min-h-screen bg-gofun">
      <WorkerHeader
        workerName={session?.name}
        tenantName={session?.tenantName}
        tenantSlug={session?.tenantSlug}
      />
      <main className="pb-16">{children}</main>
      {session && <BottomNav />}
    </div>
  );
}
