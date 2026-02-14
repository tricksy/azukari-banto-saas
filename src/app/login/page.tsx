'use client';

import { useState, useEffect } from 'react';

const REMEMBER_TOKEN_KEY = 'kuratsugi_remember_token';

/**
 * 担当者ログイン画面（マルチテナント対応）
 * PINコード認証 + テナント自動解決
 */
export default function WorkerLoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoLogging, setIsAutoLogging] = useState(true);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null
  );
  const [lockExpiresIn, setLockExpiresIn] = useState<number | null>(null);
  const [tenantName, setTenantName] = useState<string>('');
  const [tenantSlug, setTenantSlug] = useState<string>('');
  const [tenantError, setTenantError] = useState(false);

  // テナント情報を取得
  useEffect(() => {
    const resolveTenant = async () => {
      // サブドメインからslugを取得
      const host = window.location.hostname;
      const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'kuratsugi.app';
      let slug: string | null = null;

      if (host.endsWith(`.${baseDomain}`)) {
        slug = host.replace(`.${baseDomain}`, '');
      }

      // 開発環境: URLパラメータまたはlocalStorageから
      if (!slug) {
        const params = new URLSearchParams(window.location.search);
        slug = params.get('tenant') || localStorage.getItem('kuratsugi:dev:tenant');
      }

      if (!slug) {
        setTenantError(true);
        setIsAutoLogging(false);
        return;
      }

      // 開発用にslugを保存
      localStorage.setItem('kuratsugi:dev:tenant', slug);
      setTenantSlug(slug);

      // テナント名を取得
      try {
        const res = await fetch(`/api/tenant?slug=${slug}`);
        if (res.ok) {
          const { tenant } = await res.json();
          setTenantName(tenant.name);

          if (tenant.status !== 'active') {
            setError('この店舗は現在利用停止中です');
            setIsAutoLogging(false);
            return;
          }
        } else {
          setTenantError(true);
          setIsAutoLogging(false);
          return;
        }
      } catch {
        setTenantError(true);
        setIsAutoLogging(false);
        return;
      }

      // 記憶トークンによる自動ログイン
      const token = localStorage.getItem(REMEMBER_TOKEN_KEY);
      if (!token) {
        setIsAutoLogging(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/worker/remember', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          window.location.href = '/dashboard';
          return;
        }

        localStorage.removeItem(REMEMBER_TOKEN_KEY);
      } catch {
        localStorage.removeItem(REMEMBER_TOKEN_KEY);
      }

      setIsAutoLogging(false);
    };

    resolveTenant();
  }, []);

  // ロック時間のカウントダウン
  useEffect(() => {
    if (lockExpiresIn === null || lockExpiresIn <= 0) return;

    const timer = setInterval(() => {
      setLockExpiresIn((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setError('');
          setRemainingAttempts(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockExpiresIn]);

  const handlePinInput = (digit: string) => {
    if (pin.length < 10) {
      setPin((prev) => prev + digit);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = async () => {
    if (pin.length !== 8) {
      setError('PINコードは8桁で入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, tenantSlug }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'ログインに失敗しました');
        setPin('');

        if (data.isLocked && data.lockExpiresIn) {
          setLockExpiresIn(data.lockExpiresIn);
          setRemainingAttempts(0);
        } else if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
          setLockExpiresIn(null);
        }
        return;
      }

      setRemainingAttempts(null);
      setLockExpiresIn(null);

      if (data.rememberToken) {
        localStorage.setItem(REMEMBER_TOKEN_KEY, data.rememberToken);
      }

      window.location.href = '/dashboard';
    } catch {
      setError('通信エラーが発生しました');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  // テナントエラー
  if (tenantError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gofun">
        <div
          className="card w-full max-w-sm bg-white/95 backdrop-blur-sm text-center py-12"
          style={{ border: '1px solid rgba(139, 35, 50, 0.5)' }}
        >
          <p className="text-kokiake text-lg font-mincho mb-2">
            店舗が見つかりません
          </p>
          <p className="text-aitetsu text-sm">
            URLを確認してください
          </p>
        </div>
      </div>
    );
  }

  // 自動ログイン試行中
  if (isAutoLogging) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gofun">
        <div
          className="card w-full max-w-sm bg-white/95 backdrop-blur-sm text-center py-12"
          style={{ border: '1px solid rgba(139, 35, 50, 0.5)' }}
        >
          <p className="text-aitetsu">自動ログイン中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gofun">
      <div
        className="card w-full max-w-sm bg-white/95 backdrop-blur-sm"
        style={{ border: '1px solid rgba(139, 35, 50, 0.5)' }}
      >
        <div className="card-header text-center">
          <h1 className="text-2xl font-mincho">預かり番頭</h1>
          {tenantName && (
            <p className="text-sm text-shu mt-1 font-mincho">{tenantName}</p>
          )}
          <p className="text-sm text-aitetsu mt-1">担当者ログイン</p>
        </div>
        <div className="card-body">
          {/* PIN表示 */}
          <div className="flex justify-center gap-1 mb-6">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div
                key={i}
                className={`w-7 h-10 border-b-2 flex items-center justify-center text-lg
                  ${i < pin.length ? 'border-shu' : 'border-sumi'}`}
              >
                {i < pin.length ? '\u25CF' : ''}
              </div>
            ))}
          </div>

          {/* エラー表示 */}
          {error && (
            <p className="text-kokiake text-sm text-center mb-4">{error}</p>
          )}

          {/* 残り試行回数の警告 */}
          {remainingAttempts !== null &&
            remainingAttempts > 0 &&
            remainingAttempts <= 3 &&
            !lockExpiresIn && (
              <p className="text-oudo text-sm text-center mb-4">
                残り{remainingAttempts}回の試行でロックされます
              </p>
            )}

          {/* ロック中のカウントダウン */}
          {lockExpiresIn !== null && lockExpiresIn > 0 && (
            <div className="bg-kokiake/10 border border-kokiake/30 p-3 mb-4 text-center">
              <p className="text-kokiake text-sm">
                ロック中: {Math.floor(lockExpiresIn / 60)}分
                {lockExpiresIn % 60}秒後に再試行可能
              </p>
            </div>
          )}

          {/* テンキー */}
          <div className="grid grid-cols-3 gap-2">
            {[
              '1',
              '2',
              '3',
              '4',
              '5',
              '6',
              '7',
              '8',
              '9',
              'C',
              '0',
              '\u2190',
            ].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (key === 'C') handleClear();
                  else if (key === '\u2190') handleBackspace();
                  else handlePinInput(key);
                }}
                className={`h-14 text-xl font-mono rounded-none border
                  ${
                    key === 'C' || key === '\u2190'
                      ? 'bg-shironeri text-aitetsu border-sumi/50'
                      : 'bg-white text-sumi border-sumi/40 hover:bg-shironeri'
                  }`}
              >
                {key}
              </button>
            ))}
          </div>

          {/* ログインボタン */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              pin.length < 4 ||
              isLoading ||
              (lockExpiresIn !== null && lockExpiresIn > 0)
            }
            className="btn-primary w-full mt-6 disabled:opacity-50"
          >
            {isLoading
              ? '認証中...'
              : lockExpiresIn !== null && lockExpiresIn > 0
                ? 'ロック中'
                : 'ログイン'}
          </button>
        </div>
      </div>
    </div>
  );
}
