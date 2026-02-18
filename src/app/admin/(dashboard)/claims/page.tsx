'use client';

import { useState, useEffect } from 'react';
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';
import { Pagination, usePagination } from '@/components/ui/Pagination';

interface ClaimRow {
  id: string;
  tenant_id: string;
  claim_id: string;
  item_number: string;
  customer_name: string | null;
  status: 'open' | 'closed';
  category: 'quality' | 'delivery' | 'response' | 'other' | null;
  description: string;
  assignee_id: string | null;
  assignee_name: string | null;
  due_date: string | null;
  resolution: string | null;
  created_at: string;
  created_by: string | null;
  created_by_name: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolved_by_name: string | null;
  tenant_name: string;
  tenant_slug: string;
}

interface TenantOption {
  id: string;
  slug: string;
  name: string;
}

type Tab = 'active' | 'resolved';

const categoryLabels: Record<string, string> = {
  quality: '品質',
  delivery: '納期',
  response: '対応',
  other: 'その他',
};

const categoryBadgeStyles: Record<string, string> = {
  quality: 'bg-red-100 text-red-700',
  delivery: 'bg-yellow-100 text-yellow-700',
  response: 'bg-blue-100 text-blue-700',
  other: 'bg-gray-100 text-gray-600',
};

export default function AdminClaimsPage() {
  const [activeTab, setActiveTab] = usePersistedState<Tab>(
    STORAGE_KEYS.ADMIN_CLAIMS_TAB,
    'active'
  );
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // テナント一覧を初回のみ取得
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await fetch('/api/admin/tenants');
        if (res.ok) {
          const data = await res.json();
          setTenants(
            (data.tenants || []).map((t: TenantOption & Record<string, unknown>) => ({
              id: t.id, slug: t.slug, name: t.name,
            }))
          );
        }
      } catch (error) {
        console.error('テナント一覧の取得に失敗:', error);
      }
    };
    fetchTenants();
  }, []);

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedTenant) params.set('tenant_id', selectedTenant);
        params.set('status', activeTab === 'active' ? 'open' : 'closed');
        if (searchQuery) params.set('search', searchQuery);

        const res = await fetch(`/api/admin/claims?${params}`);
        if (!res.ok) throw new Error('取得失敗');
        const data = await res.json();
        setClaims(data.claims || []);
      } catch (error) {
        console.error('クレームデータの取得に失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, selectedTenant, searchQuery]);

  const { paginatedItems, ...pagination } = usePagination(claims);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    pagination.resetPage();
  };

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId);
    pagination.resetPage();
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    pagination.resetPage();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 期日超過チェック
  const isOverdue = (dueDate: string | null, status: string): boolean => {
    if (!dueDate || status !== 'open') return false;
    const due = new Date(dueDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return due < now;
  };

  const tabs = [
    { key: 'active' as Tab, label: '対応中' },
    { key: 'resolved' as Tab, label: '解決済' },
  ];

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-mincho text-sumi">クレーム管理</h2>

      {/* フィルター */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-aitetsu block mb-1">テナント</label>
          <select
            value={selectedTenant}
            onChange={(e) => handleTenantChange(e.target.value)}
            className="input"
          >
            <option value="">すべて</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}（{t.slug}）
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-aitetsu block mb-1">検索</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="クレームID、預かり番号、顧客名..."
              className="input flex-1"
            />
            <button onClick={handleSearch} className="btn-primary px-4">
              検索
            </button>
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="flex border-b border-usuzumi/20">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
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

      {/* テーブル */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-shironeri animate-pulse rounded" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-12 text-ginnezumi text-sm">
          {activeTab === 'active'
            ? '対応中のクレームはありません'
            : '解決済のクレームはありません'}
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-shironeri">
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">クレームID</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">預かり番号</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">顧客</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">カテゴリ</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">担当</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">期日</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">ステータス</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">登録日</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">テナント</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((claim) => {
                    const overdue = isOverdue(claim.due_date, claim.status);
                    return (
                      <tr
                        key={claim.id}
                        className="border-b border-shironeri last:border-b-0"
                      >
                        <td className="px-4 py-3 text-sumi font-mono text-xs">
                          {claim.claim_id}
                        </td>
                        <td className="px-4 py-3 text-sumi font-mono text-xs">
                          {claim.item_number}
                        </td>
                        <td className="px-4 py-3 text-sumi">
                          {claim.customer_name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {claim.category ? (
                            <span
                              className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                                categoryBadgeStyles[claim.category] || 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {categoryLabels[claim.category] || claim.category}
                            </span>
                          ) : (
                            <span className="text-ginnezumi">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sumi">
                          {claim.assignee_name || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {claim.due_date ? (
                            <span className={overdue ? 'text-kokiake font-bold' : 'text-sumi'}>
                              {new Date(claim.due_date).toLocaleDateString('ja-JP')}
                              {overdue && (
                                <span className="ml-1 text-xs">超過</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-ginnezumi">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                              claim.status === 'open'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {claim.status === 'open' ? '対応中' : '解決済'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sumi whitespace-nowrap">
                          {new Date(claim.created_at).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-kinari text-aitetsu">
                            {claim.tenant_name}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination {...pagination} onPageChange={pagination.setCurrentPage} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
