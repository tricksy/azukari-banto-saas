'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

const REMEMBER_TOKEN_KEY = 'kuratsugi_remember_token';

interface HeaderProps {
  workerName?: string;
  tenantName?: string;
}

export function WorkerHeader({ workerName, tenantName }: HeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        localStorage.removeItem(REMEMBER_TOKEN_KEY);
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="bg-shironeri border-b border-usuzumi/20 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <h1 className="text-lg font-mincho text-sumi hover:text-shu transition-colors cursor-pointer">
              預かり番頭
            </h1>
          </Link>
          {tenantName && (
            <span className="text-xs text-ginnezumi">{tenantName}</span>
          )}
        </div>

        {workerName && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-ginnezumi hover:bg-kinari/50 rounded transition-colors"
            >
              <span>{workerName}</span>
              <svg
                className={`w-3 h-3 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-usuzumi/20 shadow-lg z-50">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full text-left px-4 py-3 text-sm text-kokiake hover:bg-kinari/50 transition-colors disabled:opacity-50"
                >
                  {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
