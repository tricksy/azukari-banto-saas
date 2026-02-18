'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';
import { Pagination, usePagination } from '@/components/ui/Pagination';

type Tab = 'all' | 'alerts' | 'schedule';

interface TenantOption {
  id: string;
  slug: string;
  name: string;
}

interface ItemRow {
  id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  item_number: string;
  reception_number: string;
  customer_name: string | null;
  partner_name: string | null;
  product_type: string | null;
  product_name: string;
  status: string;
  vendor_name: string | null;
  scheduled_ship_date: string | null;
  scheduled_return_date: string | null;
  is_paid_storage: boolean;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  draft: '下書き',
  received: '受付済',
  pending_ship: '発送待ち',
  processing: '加工中',
  returned: '返却済',
  paid_storage: '有料預かり',
  completed: '完了',
  rework: '再加工',
  on_hold: '保留',
  awaiting_customer: '顧客確認待ち',
  cancelled: 'キャンセル',
  cancelled_completed: 'キャンセル完了',
};

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_ship: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  returned: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-500',
  paid_storage: 'bg-purple-100 text-purple-700',
  rework: 'bg-red-100 text-red-700',
  on_hold: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-gray-200 text-gray-400',
  cancelled_completed: 'bg-gray-200 text-gray-400',
};

const statusOptions = [
  { value: '', label: '全ステータス' },
  { value: 'draft', label: '下書き' },
  { value: 'received', label: '受付済' },
  { value: 'pending_ship', label: '発送待ち' },
  { value: 'processing', label: '加工中' },
  { value: 'returned', label: '返却済' },
  { value: 'paid_storage', label: '有料預かり' },
  { value: 'completed', label: '完了' },
  { value: 'rework', label: '再加工' },
  { value: 'on_hold', label: '保留' },
  { value: 'awaiting_customer', label: '顧客確認待ち' },
  { value: 'cancelled', label: 'キャンセル' },
  { value: 'cancelled_completed', label: 'キャンセル完了' },
];

export default function AdminItemsPage() {
  const [activeTab, setActiveTab] = usePersistedState<Tab>(
    STORAGE_KEYS.ADMIN_ITEMS_TAB,
    'all'
  );
  const [allItems, setAllItems] = useState<ItemRow[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // テナント一覧取得
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await fetch('/api/admin/tenants');
        if (!res.ok) return;
        const data = await res.json();
        setTenants(
          (data.tenants || []).map((t: TenantOption) => ({
            id: t.id,
            slug: t.slug,
            name: t.name,
          }))
        );
      } catch (error) {
        console.error('テナント一覧の取得に失敗:', error);
      }
    };
    fetchTenants();
  }, []);

  // 商品データ取得
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedTenant) params.set('tenant_id', selectedTenant);
        if (selectedStatus) params.set('status', selectedStatus);
        if (searchQuery) params.set('search', searchQuery);
        const res = await fetch(`/api/admin/items?${params.toString()}`);
        if (!res.ok) throw new Error('商品データの取得に失敗');
        const data = await res.json();
        setAllItems(data.items || []);
      } catch (error) {
        console.error('商品一覧の取得に失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, [selectedTenant, selectedStatus, searchQuery]);

  // タブによるクライアントサイドフィルタリング
  const filteredItems = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    switch (activeTab) {
      case 'alerts':
        return allItems.filter((item) => {
          const shipOverdue =
            item.scheduled_ship_date &&
            item.scheduled_ship_date < today &&
            item.status === 'pending_ship';
          const returnOverdue =
            item.scheduled_return_date &&
            item.scheduled_return_date < today &&
            ['processing', 'returned'].includes(item.status);
          return shipOverdue || returnOverdue;
        });
      case 'schedule':
        return allItems.filter((item) => {
          const hasUpcomingShip =
            item.scheduled_ship_date && item.scheduled_ship_date >= today;
          const hasUpcomingReturn =
            item.scheduled_return_date && item.scheduled_return_date >= today;
          return hasUpcomingShip || hasUpcomingReturn;
        });
      default:
        return allItems;
    }
  }, [allItems, activeTab]);

  const {
    paginatedItems,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    resetPage,
  } = usePagination(filteredItems, 20);

  // タブ変更時にページリセット
  useEffect(() => {
    resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedTenant, selectedStatus, searchQuery]);

  const tabs = [
    { key: 'all' as Tab, label: '全商品' },
    { key: 'alerts' as Tab, label: 'アラート' },
    { key: 'schedule' as Tab, label: '予定管理' },
  ];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const style = statusStyles[status] || 'bg-gray-100 text-gray-600';
    const label = statusLabels[status] || status;
    return (
      <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${style}`}>
        {label}
      </span>
    );
  };

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-mincho text-sumi">商品一覧</h2>

      {/* フィルター */}
      <div className="flex flex-wrap gap-2">
        <select
          className="input text-sm w-40"
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
        >
          <option value="">全テナント</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}（{t.slug}）
            </option>
          ))}
        </select>
        <select
          className="input text-sm w-36"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="預かり番号、顧客名、商品名..."
            className="input flex-1"
          />
        </form>
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
            <span className="ml-1 text-xs">
              ({activeTab === tab.key ? filteredItems.length : ''})
            </span>
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
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-ginnezumi text-sm">
          {activeTab === 'alerts'
            ? 'アラート対象の商品はありません'
            : activeTab === 'schedule'
            ? '予定のある商品はありません'
            : '商品データはありません'}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-shironeri">
                  <th className="px-3 py-2 text-left text-aitetsu font-normal">預かり番号</th>
                  <th className="px-3 py-2 text-left text-aitetsu font-normal">商品名</th>
                  <th className="px-3 py-2 text-left text-aitetsu font-normal">顧客</th>
                  <th className="px-3 py-2 text-left text-aitetsu font-normal">業者</th>
                  <th className="px-3 py-2 text-left text-aitetsu font-normal">ステータス</th>
                  <th className="px-3 py-2 text-left text-aitetsu font-normal">テナント</th>
                  <th className="px-3 py-2 text-left text-aitetsu font-normal">発送予定日</th>
                  <th className="px-3 py-2 text-left text-aitetsu font-normal">返送予定日</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-shironeri last:border-b-0 hover:bg-kinari/30 transition-colors"
                  >
                    <td className="px-3 py-2 text-sumi font-mono text-xs whitespace-nowrap">
                      {item.item_number}
                    </td>
                    <td className="px-3 py-2 text-sumi">
                      {item.product_name}
                    </td>
                    <td className="px-3 py-2 text-sumi whitespace-nowrap">
                      {item.customer_name || '-'}
                    </td>
                    <td className="px-3 py-2 text-sumi whitespace-nowrap">
                      {item.vendor_name || '-'}
                    </td>
                    <td className="px-3 py-2">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-3 py-2 text-ginnezumi whitespace-nowrap text-xs">
                      {item.tenant_name}
                    </td>
                    <td
                      className={`px-3 py-2 whitespace-nowrap text-xs ${
                        isOverdue(item.scheduled_ship_date) && item.status === 'pending_ship'
                          ? 'text-kokiake font-bold'
                          : 'text-ginnezumi'
                      }`}
                    >
                      {formatDate(item.scheduled_ship_date)}
                    </td>
                    <td
                      className={`px-3 py-2 whitespace-nowrap text-xs ${
                        isOverdue(item.scheduled_return_date) &&
                        ['processing', 'returned'].includes(item.status)
                          ? 'text-kokiake font-bold'
                          : 'text-ginnezumi'
                      }`}
                    >
                      {formatDate(item.scheduled_return_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
