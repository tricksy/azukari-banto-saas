'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 管理者ログイン画面
 * SaaS版ではメール+パスワード認証（将来的にOAuth追加予定）
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // TODO: Supabase Auth でのログイン実装
      console.log('Admin login:', email);
      setError('管理者認証は準備中です');
    } catch {
      setError('ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gofun">
      <div
        className="card w-full max-w-sm bg-white/95 backdrop-blur-sm"
        style={{ borderColor: 'rgba(26, 26, 26, 0.3)' }}
      >
        <div className="card-header text-center">
          <h1 className="text-2xl font-mincho">預かり番頭</h1>
          <p className="text-sm text-aitetsu mt-1">管理者ログイン</p>
        </div>
        <div className="card-body">
          {error && (
            <div className="mb-4 p-3 bg-kokiake/10 border border-kokiake/30 text-kokiake text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-aitetsu block mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="text-xs text-aitetsu block mb-1">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
