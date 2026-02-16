'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';
import { ItemCard } from '@/components/worker/ItemCard';
import { ShipToCustomerModal } from '@/components/worker/ShipToCustomerModal';
import { StatusChangeModal } from '@/components/worker/StatusChangeModal';
import { ItemDetailModal } from '@/components/worker/ItemDetailModal';
import { ItemStatusLabel } from '@/types';
import type { ItemStatus } from '@/types';

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
  return_to_customer_date?: string;
  customer_tracking_number?: string;
  customer_carrier?: string;
  condition_note?: string;
}

type Tab = 'pending' | 'cancelled' | 'completed';

const statusByTab: Record<Tab, string> = {
  pending: 'returned,on_hold,awaiting_customer',
  cancelled: 'cancelled',
  completed: 'completed',
};

const limitByTab: Record<Tab, number> = {
  pending: 100,
  cancelled: 100,
  completed: 50,
};

/** Group items by status for visual separation */
function groupByStatus(items: ItemData[]): { status: ItemStatus; label: string; items: ItemData[] }[] {
  const groups: Record<string, ItemData[]> = {};
  for (const item of items) {
    if (!groups[item.status]) {
      groups[item.status] = [];
    }
    groups[item.status].push(item);
  }

  // Order: returned first, then on_hold, then awaiting_customer
  const order: ItemStatus[] = ['returned', 'on_hold', 'awaiting_customer'];
  return order
    .filter((s) => groups[s] && groups[s].length > 0)
    .map((s) => ({
      status: s,
      label: ItemStatusLabel[s],
      items: groups[s],
    }));
}

export default function WorkerShippingPage() {
  const [activeTab, setActiveTab] = usePersistedState<Tab>(
    STORAGE_KEYS.WORKER_SHIPPING_TAB,
    'pending'
  );
  const [items, setItems] = useState<ItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [showShipModal, setShowShipModal] = useState(false);
  const [showCancelShipModal, setShowCancelShipModal] = useState(false);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    targetStatus: ItemStatus;
    statusLabel: string;
  } | null>(null);
  const [detailItemNumber, setDetailItemNumber] = useState<string | null>(null);

  const fetchItems = useCallback(async (tab: Tab) => {
    setIsLoading(true);
    setError(null);
    try {
      const statusParam = statusByTab[tab];
      const limit = limitByTab[tab];
      const res = await fetch(`/api/items?status=${statusParam}&limit=${limit}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '商品の取得に失敗しました');
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '商品の取得に失敗しました');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
    fetchItems(activeTab);
  }, [activeTab, fetchItems]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const handleToggleSelect = (itemNumber: string) => {
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

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.item_number)));
    }
  };

  const selectedItems = items.filter((item) => selectedIds.has(item.item_number));

  const handleSuccess = () => {
    setSelectedIds(new Set());
    fetchItems(activeTab);
  };

  const tabs = [
    { key: 'pending' as Tab, label: '返送待ち' },
    { key: 'cancelled' as Tab, label: 'キャンセル' },
    { key: 'completed' as Tab, label: '返送済み' },
  ];

  // Whether current tab supports selection
  const isSelectableTab = activeTab === 'pending' || activeTab === 'cancelled';

  // Grouped items for pending tab
  const groupedItems = activeTab === 'pending' ? groupByStatus(items) : null;

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      month: 'short',
      day: 'numeric',
    });
  }

  const renderItemWithCheckbox = (item: ItemData, showCheckbox: boolean) => (
    <div key={item.item_number} className="flex items-start gap-2">
      {showCheckbox && (
        <div className="flex-shrink-0 pt-4">
          <input
            type="checkbox"
            checked={selectedIds.has(item.item_number)}
            onChange={() => handleToggleSelect(item.item_number)}
            className="w-4 h-4 accent-shu"
            aria-label={`${item.product_name} を選択`}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <ItemCard
          item={item}
          onClick={() => setDetailItemNumber(item.item_number)}
        />
        {/* Completed tab: show return info */}
        {activeTab === 'completed' && item.return_to_customer_date && (
          <div className="mt-1 px-3 text-xs text-ginnezumi flex items-center gap-2">
            <span>返送日: {formatDate(item.return_to_customer_date)}</span>
            {item.customer_tracking_number && (
              <span className="font-mono">伝票: {item.customer_tracking_number}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4 pb-24">
      <h2 className="text-xl font-mincho text-sumi">返送管理</h2>

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
            {!isLoading && activeTab === tab.key && (
              <span className="ml-1 text-xs">({items.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* エラー */}
      {error && (
        <div className="text-sm text-kokiake bg-kokiake/10 p-3">
          {error}
        </div>
      )}

      {/* 全選択 */}
      {!isLoading && items.length > 0 && isSelectableTab && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="text-xs text-aitetsu hover:text-shu transition-colors"
          >
            {selectedIds.size === items.length ? '全選択解除' : '全て選択'}
          </button>
          {selectedIds.size > 0 && (
            <span className="text-xs text-ginnezumi">
              {selectedIds.size} 件選択中
            </span>
          )}
        </div>
      )}

      {/* コンテンツ */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-shironeri animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-ginnezumi text-sm">
          {activeTab === 'pending' && '返送待ちの商品はありません'}
          {activeTab === 'cancelled' && 'キャンセル商品はありません'}
          {activeTab === 'completed' && '返送済みの商品はありません'}
        </div>
      ) : activeTab === 'pending' && groupedItems ? (
        /* Pending tab: grouped by status */
        <div className="space-y-6">
          {groupedItems.map((group) => (
            <div key={group.status}>
              <h3 className="text-sm font-medium text-aitetsu mb-2 border-b border-usuzumi/10 pb-1">
                {group.label}
                <span className="ml-1 text-xs text-ginnezumi">({group.items.length})</span>
              </h3>
              <div className="space-y-2">
                {group.items.map((item) => renderItemWithCheckbox(item, true))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Other tabs: flat list */
        <div className="space-y-2">
          {items.map((item) => renderItemWithCheckbox(item, isSelectableTab))}
        </div>
      )}

      {/* Fixed action bar - pending tab */}
      {activeTab === 'pending' && selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-kinari border-t border-usuzumi/20 p-4 shadow-lg z-40">
          <div className="max-w-lg mx-auto">
            <p className="text-xs text-ginnezumi mb-2">{selectedIds.size} 件選択中</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowShipModal(true)}
                className="btn-primary text-sm"
              >
                顧客へ返送
              </button>
              <button
                onClick={() => setStatusChangeTarget({ targetStatus: 'on_hold', statusLabel: '返送保留' })}
                className="btn-secondary text-sm"
              >
                保留にする
              </button>
              <button
                onClick={() => setStatusChangeTarget({ targetStatus: 'awaiting_customer', statusLabel: '顧客確認待ち' })}
                className="btn-secondary text-sm"
              >
                顧客確認待ち
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed action bar - cancelled tab */}
      {activeTab === 'cancelled' && selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-kinari border-t border-usuzumi/20 p-4 shadow-lg z-40">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <span className="text-sm text-sumi">
              {selectedIds.size} 件選択中
            </span>
            <button
              onClick={() => setShowCancelShipModal(true)}
              className="btn-primary text-sm"
            >
              キャンセル品返送
            </button>
          </div>
        </div>
      )}

      {/* Ship To Customer Modal (normal flow) */}
      <ShipToCustomerModal
        isOpen={showShipModal}
        onClose={() => setShowShipModal(false)}
        selectedItems={selectedItems}
        onSuccess={handleSuccess}
        targetStatus="completed"
      />

      {/* Ship To Customer Modal (cancelled flow) */}
      <ShipToCustomerModal
        isOpen={showCancelShipModal}
        onClose={() => setShowCancelShipModal(false)}
        selectedItems={selectedItems}
        onSuccess={handleSuccess}
        targetStatus="cancelled_completed"
      />

      {/* Status Change Modal */}
      {statusChangeTarget && (
        <StatusChangeModal
          isOpen={true}
          onClose={() => setStatusChangeTarget(null)}
          selectedItems={selectedItems}
          targetStatus={statusChangeTarget.targetStatus}
          statusLabel={statusChangeTarget.statusLabel}
          onSuccess={handleSuccess}
        />
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        itemNumber={detailItemNumber}
        onClose={() => setDetailItemNumber(null)}
      />
    </div>
  );
}
