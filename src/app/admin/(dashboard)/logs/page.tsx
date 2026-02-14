'use client';

import { useState, useEffect } from 'react';
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';

type Tab = 'operations' | 'auth';

export default function AdminLogsPage() {
  const [activeTab, setActiveTab] = usePersistedState<Tab>(
    STORAGE_KEYS.ADMIN_LOGS_TAB,
    'operations'
  );
  const [logs, setLogs] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Supabase APIからデータ取得
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, dateFrom, dateTo]);

  const tabs = [
    { key: 'operations' as Tab, label: '操作ログ' },
    { key: 'auth' as Tab, label: 'ログイン履歴' },
  ];

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-mincho text-sumi">操作ログ</h2>

      {/* フィルター */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-aitetsu block mb-1">開始日</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="text-xs text-aitetsu block mb-1">終了日</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* タブ */}
      <div className="flex border-b border-usuzumi/20">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-shu text-shu'
                : 'border-transparent text-ginnezumi hover:text-aitetsu'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-shironeri animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-ginnezumi text-sm">
          ログがありません
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* TODO: ログテーブル */}
        </div>
      )}
    </div>
  );
}
