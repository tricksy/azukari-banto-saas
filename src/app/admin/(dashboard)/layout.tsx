import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { adminPath } from '@/lib/admin-path';

export const metadata: Metadata = {
  title: '預かり番頭β - 管理者',
  description: '着物・帯預かり管理システム - 管理者用画面',
  robots: 'noindex, nofollow',
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    redirect(adminPath('/login'));
  }

  return (
    <div className="min-h-screen flex bg-gofun">
      <AdminSidebar />
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
