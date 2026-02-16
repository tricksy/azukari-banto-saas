'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';
import { ItemCard } from '@/components/worker/ItemCard';
import { ReturnAcceptModal } from '@/components/worker/ReturnAcceptModal';
import { ItemDetailModal } from '@/components/worker/ItemDetailModal';
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
  vendor_name?: string;
  vendor_tracking_number?: string;
  vendor_carrier?: string;
  return_from_vendor_date?: string;
  condition_note?: string;
}

type Tab = 'processing' | 'returned';

const statusByTab: Record<Tab, string> = {
  processing: 'processing',
  returned: 'returned',
};

export default function WorkerReturnsPage() {
  const [activeTab, setActiveTab] = usePersistedState<Tab>(
    STORAGE_KEYS.WORKER_RETURNS_TAB,
    'processing'
  );
  const [items, setItems] = useState<ItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [detailItemNumber, setDetailItemNumber] = useState<string | null>(null);

  const fetchItems = useCallback(async (tab: Tab) => {
    setIsLoading(true);
    setError(null);
    try {
      const statusParam = statusByTab[tab];
      const res = await fetch(`/api/items?status=${statusParam}&limit=100`);
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
    { key: 'processing' as Tab, label: '加工中' },
    { key: 'returned' as Tab, label: '返却済' },
  ];

  return (
    <div className="p-4 space-y-4 pb-24">
      <h2 className="text-xl font-mincho text-sumi">業者からの返却</h2>

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

      {/* 全選択 (processing tab only) */}
      {!isLoading && items.length > 0 && activeTab === 'processing' && (
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
          {activeTab === 'processing'
            ? '加工中の商品はありません'
            : '返却済の商品はありません'}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.item_number} className="flex items-start gap-2">
              {/* Checkbox (processing tab only) */}
              {activeTab === 'processing' && (
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
                {/* Vendor info for processing items */}
                {activeTab === 'processing' && item.vendor_name && (
                  <div className="mt-1 px-3 text-xs text-ginnezumi flex items-center gap-2">
                    <span>業者: {item.vendor_name}</span>
                    {item.vendor_tracking_number && (
                      <span className="font-mono">伝票: {item.vendor_tracking_number}</span>
                    )}
                  </div>
                )}
                {/* Return info for returned items */}
                {activeTab === 'returned' && item.return_from_vendor_date && (
                  <div className="mt-1 px-3 text-xs text-ginnezumi">
                    返却日: {new Date(item.return_from_vendor_date).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fixed action bar */}
      {activeTab === 'processing' && selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-kinari border-t border-usuzumi/20 p-4 shadow-lg z-40">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <span className="text-sm text-sumi">
              {selectedIds.size} 件選択中
            </span>
            <button
              onClick={() => setShowReturnModal(true)}
              className="btn-primary"
            >
              返却受入
            </button>
          </div>
        </div>
      )}

      {/* Return Accept Modal */}
      <ReturnAcceptModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        selectedItems={selectedItems}
        onSuccess={handleSuccess}
      />

      {/* Item Detail Modal */}
      <ItemDetailModal
        itemNumber={detailItemNumber}
        onClose={() => setDetailItemNumber(null)}
      />
    </div>
  );
}
