'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';
import { ItemCard } from '@/components/worker/ItemCard';
import { ShipToVendorModal } from '@/components/worker/ShipToVendorModal';
import { CancelItemModal } from '@/components/worker/CancelItemModal';
import type { ItemStatus } from '@/types';

type Tab = 'pending_ship' | 'rework';

interface ItemData {
  item_number: string;
  reception_number?: string;
  customer_name?: string;
  customer_name_kana?: string;
  partner_name?: string;
  product_type: string;
  product_name: string;
  status: ItemStatus;
  is_claim_active?: boolean;
  photo_front_url?: string;
  created_at: string;
  scheduled_ship_date?: string;
  scheduled_return_date?: string;
  vendor_id?: string;
  vendor_name?: string;
  condition_note?: string;
}

export default function WorkerOrdersPage() {
  const [activeTab, setActiveTab] = usePersistedState<Tab>(
    STORAGE_KEYS.WORKER_ORDERS_TAB,
    'pending_ship'
  );
  const [items, setItems] = useState<ItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tabCounts, setTabCounts] = useState<Record<Tab, number>>({
    pending_ship: 0,
    rework: 0,
  });

  // モーダル状態
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const fetchItems = useCallback(async (status: Tab) => {
    setIsLoading(true);
    setError('');
    setSelectedIds(new Set());

    try {
      const res = await fetch(`/api/items?status=${status}&limit=100`);
      if (!res.ok) throw new Error('商品一覧の取得に失敗しました');
      const data = await res.json();
      setItems(data.items || []);
      setTabCounts((prev) => ({ ...prev, [status]: data.total ?? (data.items?.length || 0) }));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('商品一覧の取得に失敗しました');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 別タブの件数をバックグラウンドで取得
  const fetchOtherTabCount = useCallback(async (otherTab: Tab) => {
    try {
      const res = await fetch(`/api/items?status=${otherTab}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        setTabCounts((prev) => ({ ...prev, [otherTab]: data.total ?? 0 }));
      }
    } catch {
      // カウント取得失敗は無視
    }
  }, []);

  useEffect(() => {
    fetchItems(activeTab);
    const otherTab: Tab = activeTab === 'pending_ship' ? 'rework' : 'pending_ship';
    fetchOtherTabCount(otherTab);
  }, [activeTab, fetchItems, fetchOtherTabCount]);

  // 選択操作
  const toggleSelect = (itemNumber: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemNumber)) {
        next.delete(itemNumber);
      } else {
        next.add(itemNumber);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.item_number)));
    }
  };

  const selectedItems = items.filter((item) => selectedIds.has(item.item_number));
  const allSelected = items.length > 0 && selectedIds.size === items.length;

  // 操作成功後のリフレッシュ
  const handleOperationSuccess = () => {
    fetchItems(activeTab);
    const otherTab: Tab = activeTab === 'pending_ship' ? 'rework' : 'pending_ship';
    fetchOtherTabCount(otherTab);
  };

  const tabs = [
    { key: 'pending_ship' as Tab, label: '発送待ち', activeColor: 'border-shu text-shu' },
    { key: 'rework' as Tab, label: '再加工', activeColor: 'border-kokiake text-kokiake' },
  ];

  return (
    <div className="p-4 pb-32 space-y-4">
      <header className="mb-2">
        <div className="flex items-start gap-3">
          <div className="w-1 h-12 bg-shu shrink-0 mt-1"></div>
          <div>
            <h2 className="text-xl font-mincho text-sumi">発注管理</h2>
            <p className="text-sm text-ginnezumi mt-1">業者への発送・加工依頼</p>
          </div>
        </div>
      </header>

      {/* タブ */}
      <div className="flex border-b border-usuzumi/20">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? tab.activeColor
                : 'border-transparent text-ginnezumi hover:text-sumi'
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs">
              ({tabCounts[tab.key]})
            </span>
          </button>
        ))}
      </div>

      {/* 全選択 */}
      {!isLoading && items.length > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="selectAll"
            className="w-4 h-4"
            checked={allSelected}
            onChange={selectAll}
          />
          <label htmlFor="selectAll" className="text-sm text-ginnezumi">
            すべて選択 ({selectedIds.size}/{items.length})
          </label>
        </div>
      )}

      {/* エラー */}
      {error && (
        <div className="p-3 bg-kokiake/10 border border-kokiake/30 text-kokiake text-sm">
          {error}
          <button
            onClick={() => fetchItems(activeTab)}
            className="ml-2 underline hover:no-underline"
          >
            再試行
          </button>
        </div>
      )}

      {/* コンテンツ */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-shironeri animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-ginnezumi text-sm">
          {activeTab === 'pending_ship'
            ? '発送待ちの商品はありません'
            : '再加工の商品はありません'}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const isSelected = selectedIds.has(item.item_number);
            const isRework = activeTab === 'rework';
            return (
              <div
                key={item.item_number}
                className={`flex items-stretch gap-0 transition-colors ${
                  isSelected ? 'bg-shu/5' : ''
                } ${isRework ? 'border-l-4 border-l-kokiake' : ''}`}
                onClick={() => toggleSelect(item.item_number)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSelect(item.item_number);
                  }
                }}
              >
                {/* チェックボックス */}
                <div className="flex items-center px-2 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.item_number)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 accent-shu"
                    aria-label={`${item.product_name}を選択`}
                  />
                </div>

                {/* カード */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <div className="flex-1 min-w-0">
                      <ItemCard item={item} />
                    </div>
                    {isRework && (
                      <span className="text-xs px-1.5 py-0.5 bg-kokiake/10 text-kokiake flex-shrink-0 mr-2">
                        再加工
                      </span>
                    )}
                  </div>
                  {/* 再加工タブ: 元業者名を表示 */}
                  {isRework && item.vendor_name && (
                    <div className="px-3 pb-2 -mt-1 text-xs text-ginnezumi">
                      元業者: {item.vendor_name}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* アクションバー（下部固定） */}
      <div className="fixed bottom-14 left-0 right-0 bg-white border-t border-usuzumi/20 p-4 shadow-lg z-40">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button
            onClick={() => setIsShipModalOpen(true)}
            disabled={selectedIds.size === 0}
            className="flex-1 btn-primary text-sm disabled:opacity-50"
          >
            {activeTab === 'rework' ? '再発送登録' : '発送登録'} ({selectedIds.size})
          </button>
          <button
            onClick={() => {
              if (selectedIds.size === 0) return;
              const itemNumbers = Array.from(selectedIds).join(',');
              window.open(`/print/processing-order/selected?itemNumbers=${itemNumbers}`, '_blank', 'width=900,height=700');
            }}
            disabled={selectedIds.size === 0}
            className="btn-outline text-sm disabled:opacity-50"
          >
            印刷
          </button>
          {activeTab === 'pending_ship' && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 text-sm border border-ginnezumi/50 text-ginnezumi hover:bg-kinari hover:text-sumi transition-colors disabled:opacity-50"
            >
              注文取消
            </button>
          )}
        </div>
      </div>

      {/* モーダル */}
      <ShipToVendorModal
        isOpen={isShipModalOpen}
        onClose={() => setIsShipModalOpen(false)}
        selectedItems={selectedItems}
        onSuccess={handleOperationSuccess}
        activeTab={activeTab}
      />

      {activeTab === 'pending_ship' && (
        <CancelItemModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          selectedItems={selectedItems}
          onSuccess={handleOperationSuccess}
        />
      )}
    </div>
  );
}
