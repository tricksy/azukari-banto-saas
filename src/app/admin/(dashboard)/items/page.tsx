'use client';

import { useState, useEffect } from 'react';
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';

type Tab = 'all' | 'alerts' | 'schedule';

export default function AdminItemsPage() {
  const [activeTab, setActiveTab] = usePersistedState<Tab>(
    STORAGE_KEYS.ADMIN_ITEMS_TAB,
    'all'
  );
  const [items, setItems] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Supabase APIからデータ取得
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch items:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const tabs = [
    { key: 'all' as Tab, label: '全商品' },
    { key: 'alerts' as Tab, label: 'アラート' },
    { key: 'schedule' as Tab, label: '予定管理' },
  ];

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-mincho text-sumi">商品一覧</h2>

      {/* 検索 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="預かり番号、取引先名、顧客名..."
          className="input flex-1"
        />
        <button className="btn-primary px-4">検索</button>
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

      {/* コンテンツ */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-shironeri animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-ginnezumi text-sm">
          商品データはありません
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* TODO: 商品テーブル */}
        </div>
      )}
    </div>
  );
}
