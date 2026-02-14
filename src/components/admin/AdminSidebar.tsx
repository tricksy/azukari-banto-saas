'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/admin/dashboard', label: 'ダッシュボード' },
  { href: '/admin/statuses', label: 'ステータス一覧' },
  { href: '/admin/claims', label: 'クレーム管理' },
  { href: '/admin/paid-storage', label: '有料預かり管理' },
  { href: '/admin/partners', label: '取引先管理' },
  { href: '/admin/vendors', label: '業者管理' },
  { href: '/admin/customers', label: '顧客管理' },
  { href: '/admin/workers', label: '担当者管理' },
  { href: '/admin/logs', label: '操作ログ' },
  { href: '/admin/email-logs', label: 'メール送信履歴' },
  { href: '/admin/manual', label: '使い方マニュアル' },
  { href: '/admin/settings', label: 'システム設定' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const navContent = (
    <nav className="p-2 flex-1 overflow-y-auto">
      <ul className="space-y-1">
        {navItems.map(item => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`block px-4 py-3 hover:bg-[hsl(0,0%,18%)] hover:text-[hsl(43,60%,65%)] ${
                pathname === item.href
                  ? 'bg-[hsl(0,0%,18%)] text-[hsl(43,60%,65%)] border-l-2 border-[hsl(43,60%,65%)]'
                  : ''
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  const userContent = (
    <div className="p-4 border-t border-white/10 flex-shrink-0">
      <button
        onClick={handleLogout}
        className="w-full px-3 py-2 text-xs bg-[hsl(0,0%,18%)] hover:bg-[hsl(0,0%,22%)] text-[hsl(0,0%,65%)] border border-white/10"
      >
        ログアウト
      </button>
    </div>
  );

  return (
    <>
      {/* モバイル用ヘッダー */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[hsl(0,0%,12%)] text-[hsl(0,0%,65%)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 -ml-1 hover:bg-[hsl(0,0%,18%)] rounded"
            aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <Link href="/admin/dashboard">
            <h1 className="text-lg font-mincho text-[hsl(43,60%,65%)] hover:text-[hsl(43,60%,75%)] transition-colors">
              預かり番頭
            </h1>
          </Link>
        </div>

        <span className="text-xs text-[hsl(0,0%,60%)]">管理者</span>
      </header>

      {/* モバイル用オーバーレイ */}
      <div
        className={`lg:hidden fixed top-14 left-0 right-0 bottom-0 z-40 bg-black/50 transition-opacity duration-150 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* モバイル用サイドバー */}
      <aside
        className={`lg:hidden fixed top-14 bottom-0 left-0 z-50 w-64 bg-[hsl(0,0%,12%)] text-[hsl(0,0%,65%)] flex flex-col transform transition-transform duration-150 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
        {userContent}
      </aside>

      {/* デスクトップ用サイドバー */}
      <aside className="hidden lg:flex w-64 bg-[hsl(0,0%,12%)] text-[hsl(0,0%,65%)] flex-shrink-0 flex-col h-screen sticky top-0">
        <div className="p-4 border-b border-white/10 flex-shrink-0">
          <h1 className="text-lg font-mincho text-[hsl(43,60%,65%)]">
            預かり番頭
          </h1>
          <p className="text-xs mt-1">管理者</p>
        </div>
        {navContent}
        {userContent}
      </aside>
    </>
  );
}
