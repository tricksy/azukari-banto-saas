'use client';

import { useState, useEffect } from 'react';

export default function AdminEmailLogsPage() {
  const [logs, setLogs] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Supabase APIからデータ取得
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch email logs:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [typeFilter]);

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-mincho text-sumi">メール送信履歴</h2>

      {/* フィルター */}
      <div className="flex gap-3">
        <div>
          <label className="text-xs text-aitetsu block mb-1">種別</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input"
          >
            <option value="all">すべて</option>
            <option value="alert">アラート</option>
            <option value="paid_storage">有料預かり</option>
            <option value="claim">クレーム</option>
            <option value="custom">カスタム</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-shironeri animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-ginnezumi text-sm">
          メール送信履歴はありません
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* TODO: メールログテーブル */}
        </div>
      )}
    </div>
  );
}
