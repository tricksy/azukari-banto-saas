'use client';

import { useState, useEffect, useCallback } from 'react';

const REMEMBER_TOKEN_KEY = 'kuratsugi_remember_token';
const LAST_TENANT_ID_KEY = 'kuratsugi_last_tenant_id';

type Step = 'tenant' | 'pin';

/**
 * 担当者ログイン画面（テナントID + PIN入力方式）
 *
 * フロー:
 * 1. テナントID入力 → 「次へ」→ 店舗名取得・表示
 * 2. PIN入力（テンキーUI）→ ログイン
 *
 * 自動ログイン（remember token有効時）はテナントID入力をスキップ
 */
export default function WorkerLoginPage() {
  const [step, setStep] = useState<Step>('tenant');
  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoLogging, setIsAutoLogging] = useState(true);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockExpiresIn, setLockExpiresIn] = useState<number | null>(null);

  // 記憶トークンによる自動ログイン
  useEffect(() => {
    const tryAutoLogin = async () => {
      const token = localStorage.getItem(REMEMBER_TOKEN_KEY);
      if (!token) {
        // 前回のテナントIDを初期値としてセット
        const lastTenantId = localStorage.getItem(LAST_TENANT_ID_KEY);
        if (lastTenantId) {
          setTenantId(lastTenantId);
        }
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

      // 自動ログイン失敗 → 前回のテナントIDを初期値としてセット
      const lastTenantId = localStorage.getItem(LAST_TENANT_ID_KEY);
      if (lastTenantId) {
        setTenantId(lastTenantId);
      }
      setIsAutoLogging(false);
    };

    tryAutoLogin();
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

  // テナントID確認（「次へ」ボタン）
  const handleTenantSubmit = useCallback(async () => {
    const trimmed = tenantId.trim();
    if (!trimmed || trimmed.length !== 4) {
      setError('テナントIDは4桁で入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/tenant?slug=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const { tenant } = await res.json();

        if (tenant.status !== 'active') {
          setError('この店舗は現在利用停止中です');
          setIsLoading(false);
          return;
        }

        // 専用サーバーへのリダイレクト
        if (tenant.redirect_url) {
          localStorage.setItem(LAST_TENANT_ID_KEY, trimmed);
          window.location.href = `${tenant.redirect_url}/login?tenant=${encodeURIComponent(trimmed)}`;
          return;
        }

        setTenantName(tenant.name);
        setTenantSlug(trimmed);
        localStorage.setItem(LAST_TENANT_ID_KEY, trimmed);
        setStep('pin');
      } else {
        setError('テナントIDが正しくありません');
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  // テナント入力でEnterキー
  const handleTenantKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleTenantSubmit();
      }
    },
    [handleTenantSubmit]
  );

  // テナント選択に戻る
  const handleBackToTenant = () => {
    setStep('tenant');
    setPin('');
    setError('');
    setRemainingAttempts(null);
    setLockExpiresIn(null);
  };

  // PIN入力
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

  // PINログイン
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

  // 自動ログイン試行中
  if (isAutoLogging) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gofun bg-cover bg-center" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.45), rgba(255,255,255,0.45)), url('/azukaribanto.webp')" }}>
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gofun bg-cover bg-center" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.45), rgba(255,255,255,0.45)), url('/azukaribanto.webp')" }}>
      <div
        className="card w-full max-w-sm bg-white/95 backdrop-blur-sm"
        style={{ border: '1px solid rgba(139, 35, 50, 0.5)' }}
      >
        <div className="card-header text-center">
          <h1 className="text-2xl font-mincho">預かり番頭β</h1>
          {step === 'pin' && tenantName && (
            <p className="text-sm text-shu mt-1 font-mincho">{tenantName}</p>
          )}
          <p className="text-sm text-aitetsu mt-1">担当者ログイン</p>
        </div>
        <div className="card-body">
          {step === 'tenant' ? (
            <>
              {/* テナントID入力 */}
              <label
                htmlFor="tenant-id"
                className="block text-sm text-sumi mb-2"
              >
                テナントID
              </label>
              <input
                id="tenant-id"
                type="text"
                value={tenantId}
                onChange={(e) => {
                  // 0-9, A-F のみ許可、大文字に変換、最大4桁
                  const v = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 4);
                  setTenantId(v);
                  setError('');
                }}
                onKeyDown={handleTenantKeyDown}
                placeholder="例: A3F0"
                maxLength={4}
                autoFocus
                autoComplete="off"
                className="w-full px-3 py-3 border border-sumi/30 bg-white text-sumi text-center font-mono text-2xl tracking-[0.5em] focus:outline-none focus:border-shu"
              />

              {/* エラー表示 */}
              {error && (
                <p className="text-kokiake text-sm text-center mt-3">
                  {error}
                </p>
              )}

              {/* 次へボタン */}
              <button
                type="button"
                onClick={handleTenantSubmit}
                disabled={tenantId.trim().length !== 4 || isLoading}
                className="btn-primary w-full mt-6 disabled:opacity-50"
              >
                {isLoading ? '確認中...' : '次へ'}
              </button>
            </>
          ) : (
            <>
              {/* 店舗変更リンク */}
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={handleBackToTenant}
                  className="text-xs text-aitetsu hover:text-shu underline"
                >
                  店舗を変更
                </button>
              </div>

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
                <p className="text-kokiake text-sm text-center mb-4">
                  {error}
                </p>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
