'use client';

import { useState, useEffect } from 'react';
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';
import { Pagination, usePagination } from '@/components/ui/Pagination';

interface PaidStorageRow {
  id: string;
  tenant_id: string;
  item_number: string;
  reception_number: string;
  customer_name: string | null;
  product_name: string;
  product_type: string | null;
  vendor_name: string | null;
  status: string;
  paid_storage_start_date: string | null;
  created_at: string;
  tenant_name: string;
  tenant_slug: string;
}

interface TenantOption {
  id: string;
  slug: string;
  name: string;
}

type Tab = 'active' | 'completed';

export default function AdminPaidStoragePage() {
  const [activeTab, setActiveTab] = usePersistedState<Tab>(
    STORAGE_KEYS.ADMIN_PAID_STORAGE_TAB,
    'active'
  );
  const [items, setItems] = useState<PaidStorageRow[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTenant, setSelectedTenant] = useState('');
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
        params.set('status', activeTab === 'active' ? 'paid_storage' : 'completed');

        const res = await fetch(`/api/admin/paid-storage?${params}`);
        if (!res.ok) throw new Error('取得失敗');
        const data = await res.json();
        setItems(data.items || []);
      } catch (error) {
        console.error('有料預かりデータの取得に失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, selectedTenant]);

  const { paginatedItems, ...pagination } = usePagination(items);

  // 経過日数を計算
  const calcElapsedDays = (startDate: string | null): number | null => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    pagination.resetPage();
  };

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId);
    pagination.resetPage();
  };

  const tabs = [
    { key: 'active' as Tab, label: '預かり中' },
    { key: 'completed' as Tab, label: '完了' },
  ];

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-mincho text-sumi">有料預かり管理</h2>

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
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-ginnezumi text-sm">
          {activeTab === 'active'
            ? '預かり中の有料預かりはありません'
            : '完了した有料預かりはありません'}
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-shironeri">
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">預かり番号</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">商品名</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">顧客</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">業者</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">開始日</th>
                    <th className="px-4 py-3 text-right text-aitetsu font-normal">経過日数</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">テナント</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item) => {
                    const elapsed = calcElapsedDays(item.paid_storage_start_date);
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-shironeri last:border-b-0"
                      >
                        <td className="px-4 py-3 text-sumi font-mono text-xs">
                          {item.item_number}
                        </td>
                        <td className="px-4 py-3 text-sumi">
                          {item.product_name}
                          {item.product_type && (
                            <span className="ml-1 text-xs text-ginnezumi">
                              ({item.product_type})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sumi">
                          {item.customer_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sumi">
                          {item.vendor_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sumi whitespace-nowrap">
                          {item.paid_storage_start_date
                            ? new Date(item.paid_storage_start_date).toLocaleDateString('ja-JP')
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {elapsed !== null ? (
                            <span
                              className={`font-mono ${
                                elapsed >= 180
                                  ? 'text-kokiake font-bold'
                                  : elapsed >= 90
                                    ? 'text-oudo'
                                    : 'text-sumi'
                              }`}
                            >
                              {elapsed}日
                            </span>
                          ) : (
                            <span className="text-ginnezumi">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-kinari text-aitetsu">
                            {item.tenant_name}
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
