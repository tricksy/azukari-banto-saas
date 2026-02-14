'use client';

import { useState, useEffect } from 'react';
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';

type Tab = 'register' | 'active';

export default function WorkerPaidStoragePage() {
  const [activeTab, setActiveTab] = usePersistedState<Tab>(
    STORAGE_KEYS.WORKER_PAID_STORAGE_TAB,
    'register'
  );
  const [items, setItems] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Supabase APIからデータ取得
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch paid storage:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const tabs = [
    { key: 'register' as Tab, label: '有料預かり登録' },
    { key: 'active' as Tab, label: '有料預かり中' },
  ];

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-mincho text-sumi">有料預かり管理</h2>

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

      {/* コンテンツ */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-shironeri animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-ginnezumi text-sm">
          該当する商品はありません
        </div>
      ) : (
        <div className="space-y-3">
          {/* TODO: 有料預かりアイテムリスト */}
        </div>
      )}
    </div>
  );
}
