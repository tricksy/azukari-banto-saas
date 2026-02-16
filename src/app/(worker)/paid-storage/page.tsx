'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';
import { ItemCard } from '@/components/worker/ItemCard';
import { ItemDetailModal } from '@/components/worker/ItemDetailModal';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import type { ItemStatus } from '@/types';

type Tab = 'register' | 'active';

interface ItemResult {
  item_number: string;
  reception_number?: string;
  customer_name?: string;
  customer_name_kana?: string;
  partner_name?: string;
  product_type: string;
  product_name: string;
  status: ItemStatus;
  is_claim_active?: boolean;
  is_paid_storage?: boolean;
  paid_storage_start_date?: string;
  photo_front_url?: string;
  created_at: string;
  scheduled_ship_date?: string;
  scheduled_return_date?: string;
}

function calculatePaidDays(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export default function WorkerPaidStoragePage() {
  const [activeTab, setActiveTab] = usePersistedState<Tab>(
    STORAGE_KEYS.WORKER_PAID_STORAGE_TAB,
    'register'
  );

  // Register tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ItemResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Active tab state
  const [activeItems, setActiveItems] = useState<ItemResult[]>([]);
  const [isLoadingActive, setIsLoadingActive] = useState(false);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [selectedDetailItem, setSelectedDetailItem] = useState<string | null>(null);

  const tabs = [
    { key: 'register' as Tab, label: '有料預かり登録' },
    { key: 'active' as Tab, label: '有料預かり中' },
  ];

  // Fetch active paid storage items
  const fetchActiveItems = useCallback(async () => {
    setIsLoadingActive(true);
    try {
      const res = await fetch('/api/items?status=paid_storage&limit=100');
      if (!res.ok) throw new Error('取得に失敗しました');
      const data = await res.json();
      const items: ItemResult[] = data.items || [];
      // Sort by paid storage days descending (longest first)
      items.sort((a, b) => {
        const daysA = a.paid_storage_start_date ? calculatePaidDays(a.paid_storage_start_date) : 0;
        const daysB = b.paid_storage_start_date ? calculatePaidDays(b.paid_storage_start_date) : 0;
        return daysB - daysA;
      });
      setActiveItems(items);
    } catch (error) {
      console.error('Failed to fetch paid storage items:', error);
      setActiveItems([]);
    } finally {
      setIsLoadingActive(false);
    }
  }, []);

  // Load active items when switching to the active tab
  useEffect(() => {
    if (activeTab === 'active') {
      fetchActiveItems();
    }
  }, [activeTab, fetchActiveItems]);

  // Search for items eligible for paid storage registration
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        status: 'returned,on_hold,awaiting_customer',
        limit: '100',
      });
      const res = await fetch(`/api/items?${params.toString()}`);
      if (!res.ok) throw new Error('検索に失敗しました');
      const data = await res.json();
      setSearchResults(data.items || []);
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Failed to search items:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Toggle item selection
  const toggleItemSelection = (itemNumber: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemNumber)) {
        next.delete(itemNumber);
      } else {
        next.add(itemNumber);
      }
      return next;
    });
  };

  // Register selected items as paid storage
  const handleRegister = async () => {
    if (selectedItems.size === 0) return;
    setIsRegistering(true);

    const today = new Date().toISOString().split('T')[0];
    let successCount = 0;
    let failCount = 0;

    for (const itemNumber of selectedItems) {
      try {
        const res = await fetch(`/api/items/${encodeURIComponent(itemNumber)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'paid_storage',
            is_paid_storage: true,
            paid_storage_start_date: today,
          }),
        });
        if (res.ok) {
          successCount++;
        } else {
          const data = await res.json();
          console.error(`Failed to register ${itemNumber}:`, data.error);
          failCount++;
        }
      } catch (error) {
        console.error(`Failed to register ${itemNumber}:`, error);
        failCount++;
      }
    }

    setIsRegistering(false);
    setShowConfirmModal(false);

    if (successCount > 0) {
      toast.success(`${successCount}件の商品を有料預かりに登録しました`);
    }
    if (failCount > 0) {
      toast.error(`${failCount}件の登録に失敗しました`);
    }

    // Refresh search results
    setSelectedItems(new Set());
    if (searchQuery.trim()) {
      handleSearch();
    }
  };

  // Filter active items by search query
  const filteredActiveItems = activeSearchQuery.trim()
    ? activeItems.filter(
        (item) =>
          item.item_number.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
          (item.customer_name && item.customer_name.toLowerCase().includes(activeSearchQuery.toLowerCase())) ||
          (item.customer_name_kana && item.customer_name_kana.toLowerCase().includes(activeSearchQuery.toLowerCase()))
      )
    : activeItems;

  // Get selected items data for confirmation modal
  const selectedItemsData = searchResults.filter((item) => selectedItems.has(item.item_number));

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
            {tab.key === 'active' && activeItems.length > 0 && (
              <span className="ml-1.5 text-xs bg-oudo/10 text-oudo px-1.5 py-0.5 inline-block">
                {activeItems.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 有料預かり登録タブ */}
      {activeTab === 'register' && (
        <div className="space-y-4">
          {/* 検索フォーム */}
          <div className="card">
            <div className="card-body space-y-3">
              <label className="text-xs text-aitetsu block">預かり番号または顧客名で検索</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="預かり番号、顧客名..."
                  className="input flex-1"
                />
                <button
                  className="btn-primary flex-shrink-0"
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? '検索中...' : '検索'}
                </button>
              </div>
              <p className="text-xs text-ginnezumi">
                返却済・返送保留・顧客確認待ちの商品が検索対象です
              </p>
            </div>
          </div>

          {/* 検索結果 */}
          {isSearching && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-shironeri animate-pulse" />
              ))}
            </div>
          )}

          {!isSearching && hasSearched && (
            <>
              <p className="text-sm text-aitetsu">
                {searchResults.length}件の商品が見つかりました
              </p>

              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((item) => (
                    <div key={item.item_number} className="flex items-start gap-3">
                      {/* チェックボックス */}
                      <label className="flex-shrink-0 mt-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.item_number)}
                          onChange={() => toggleItemSelection(item.item_number)}
                          className="w-5 h-5 accent-shu"
                        />
                      </label>
                      {/* 商品カード */}
                      <div className="flex-1">
                        <ItemCard
                          item={item}
                          onClick={() => toggleItemSelection(item.item_number)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-ginnezumi text-sm">
                  条件に一致する商品がありません
                </div>
              )}

              {/* 登録ボタン（選択中のみ表示） */}
              {selectedItems.size > 0 && (
                <div className="sticky bottom-4">
                  <button
                    className="btn-primary w-full py-3 text-base"
                    onClick={() => setShowConfirmModal(true)}
                  >
                    有料預かりに登録（{selectedItems.size}件）
                  </button>
                </div>
              )}
            </>
          )}

          {!isSearching && !hasSearched && (
            <div className="text-center py-8 text-ginnezumi text-sm">
              商品を検索して有料預かりに登録できます
            </div>
          )}
        </div>
      )}

      {/* 有料預かり中タブ */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {/* フィルタ */}
          <div className="card">
            <div className="card-body">
              <input
                type="text"
                value={activeSearchQuery}
                onChange={(e) => setActiveSearchQuery(e.target.value)}
                placeholder="預かり番号、顧客名で絞り込み..."
                className="input w-full"
              />
            </div>
          </div>

          {/* ローディング */}
          {isLoadingActive && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-shironeri animate-pulse" />
              ))}
            </div>
          )}

          {/* アイテム一覧 */}
          {!isLoadingActive && filteredActiveItems.length > 0 && (
            <>
              <p className="text-sm text-aitetsu">
                {filteredActiveItems.length}件の有料預かり中商品
              </p>
              <div className="space-y-2">
                {filteredActiveItems.map((item) => {
                  const paidDays = item.paid_storage_start_date
                    ? calculatePaidDays(item.paid_storage_start_date)
                    : 0;
                  return (
                    <div key={item.item_number} className="relative">
                      {/* 有料日数バッジ */}
                      {item.paid_storage_start_date && (
                        <div className="absolute top-2 right-2 z-10">
                          <span className="text-xs font-medium bg-oudo/10 text-oudo px-2 py-0.5 inline-block">
                            {paidDays}日目
                          </span>
                        </div>
                      )}
                      {/* ItemCard with gold border override */}
                      <div className="[&>.card]:border-l-oudo">
                        <ItemCard
                          item={item}
                          onClick={() => setSelectedDetailItem(item.item_number)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {!isLoadingActive && filteredActiveItems.length === 0 && (
            <div className="text-center py-8 text-ginnezumi text-sm">
              {activeSearchQuery.trim()
                ? '条件に一致する商品がありません'
                : '有料預かり中の商品はありません'}
            </div>
          )}
        </div>
      )}

      {/* 有料預かり登録確認モーダル */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="有料預かり登録確認"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-aitetsu">
            以下の{selectedItemsData.length}件の商品を有料預かりに登録します。よろしいですか？
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {selectedItemsData.map((item) => (
              <div
                key={item.item_number}
                className="flex items-center gap-3 py-2 border-b border-usuzumi/10 last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-ginnezumi truncate">
                    {item.item_number}
                  </p>
                  <p className="text-sm text-sumi truncate">{item.product_name}</p>
                  <p className="text-xs text-ginnezumi truncate">
                    {item.customer_name || item.partner_name || '顧客未設定'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              className="btn-secondary"
              onClick={() => setShowConfirmModal(false)}
              disabled={isRegistering}
            >
              キャンセル
            </button>
            <button
              className="btn-primary"
              onClick={handleRegister}
              disabled={isRegistering}
            >
              {isRegistering ? '登録中...' : '登録する'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 商品詳細モーダル */}
      <ItemDetailModal
        itemNumber={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
      />
    </div>
  );
}
