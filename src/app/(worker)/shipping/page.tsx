'use client';

import { useState, useEffect } from 'react';
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';

type Tab = 'pending' | 'cancelled' | 'completed';

export default function WorkerShippingPage() {
  const [activeTab, setActiveTab] = usePersistedState<Tab>(
    STORAGE_KEYS.WORKER_SHIPPING_TAB,
    'pending'
  );
  const [items, setItems] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Supabase APIからデータ取得
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch shipping:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const tabs = [
    { key: 'pending' as Tab, label: '返送待ち' },
    { key: 'cancelled' as Tab, label: 'キャンセル' },
    { key: 'completed' as Tab, label: '返送済み' },
  ];

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-mincho text-sumi">返送管理</h2>

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
          {/* TODO: 返送アイテムリスト */}
        </div>
      )}
    </div>
  );
}
