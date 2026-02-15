'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { adminPath } from '@/lib/admin-path';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
              locale?: string;
            }
          ) => void;
        };
      };
    };
  }
}

/**
 * 管理者ログイン画面（Google Sign-In）
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gisReady, setGisReady] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      setIsLoading(true);
      setError('');

      try {
        const res = await fetch('/api/auth/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'ログインに失敗しました');
          return;
        }

        router.push(adminPath('/dashboard'));
      } catch {
        setError('ログイン処理でエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!gisReady || !clientId) return;

    window.google?.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
    });

    const buttonDiv = document.getElementById('google-signin-button');
    if (buttonDiv) {
      window.google?.accounts.id.renderButton(buttonDiv, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'signin_with',
        shape: 'rectangular',
        locale: 'ja',
      });
    }
  }, [gisReady, clientId, handleCredentialResponse]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gofun">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGisReady(true)}
      />
      <div
        className="card w-full max-w-sm bg-white/95 backdrop-blur-sm"
        style={{ borderColor: 'rgba(26, 26, 26, 0.3)' }}
      >
        <div className="card-header text-center">
          <h1 className="text-2xl font-mincho">預かり番頭β</h1>
          <p className="text-sm text-aitetsu mt-1">管理者ログイン</p>
        </div>
        <div className="card-body">
          {error && (
            <div className="mb-4 p-3 bg-kokiake/10 border border-kokiake/30 text-kokiake text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="text-sm text-aitetsu">認証中...</div>
            </div>
          ) : !clientId ? (
            <div className="p-3 bg-kokiake/10 border border-kokiake/30 text-kokiake text-sm">
              Google Client IDが設定されていません
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <div id="google-signin-button" />
            </div>
          )}

          <p className="text-xs text-aitetsu/60 text-center mt-4">
            登録済みの管理者アカウントでログインしてください
          </p>
        </div>
      </div>
    </div>
  );
}
