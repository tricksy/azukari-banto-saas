'use client';

import { useState, useEffect } from 'react';
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';

type Tab = 'active' | 'resolved';

export default function AdminClaimsPage() {
  const [activeTab, setActiveTab] = usePersistedState<Tab>(
    STORAGE_KEYS.ADMIN_CLAIMS_TAB,
    'active'
  );
  const [claims, setClaims] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Supabase APIからデータ取得
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch claims:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const tabs = [
    { key: 'active' as Tab, label: '対応中' },
    { key: 'resolved' as Tab, label: '解決済' },
  ];

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-mincho text-sumi">クレーム管理</h2>

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
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-shironeri animate-pulse" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-12 text-ginnezumi text-sm">
          {activeTab === 'active' ? '対応中のクレームはありません' : '解決済のクレームはありません'}
        </div>
      ) : (
        <div className="space-y-3">
          {/* TODO: クレームリスト */}
        </div>
      )}
    </div>
  );
}
