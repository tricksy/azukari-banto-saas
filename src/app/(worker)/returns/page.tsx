'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProductTypeLabel } from '@/types';
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
  is_paid_storage?: boolean;
  photo_front_url?: string;
  photo_back_url?: string;
  additional_photos?: string;
  created_at: string;
  scheduled_ship_date?: string;
  scheduled_return_date?: string;
  vendor_id?: string;
  vendor_name?: string;
  vendor_tracking_number?: string;
  vendor_carrier?: string;
  return_from_vendor_date?: string;
  condition_note?: string;
  ship_to_vendor_date?: string;
}

interface VendorData {
  id: string;
  vendor_id: string;
  name: string;
}

/** 経過日数を計算 */
function getDaysElapsed(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const shipDate = new Date(dateStr);
  const today = new Date();
  const diffTime = today.getTime() - shipDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/** 預かり番号の短縮表示 */
function shortenItemNumber(itemNumber: string): string {
  const parts = itemNumber.split('-');
  if (parts.length >= 3) {
    return `${parts[0]}-${itemNumber.slice(-9)}`;
  }
  return itemNumber;
}

export default function WorkerReturnsPage() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 検索・フィルタ
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');

  // Modal states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemData | null>(null);
  const [detailItemNumber, setDetailItemNumber] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/items?status=processing&limit=100');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '商品の取得に失敗しました');
      }
      const data = await res.json();
      setItems((data.items || []).filter((item: ItemData) => item.item_number));
    } catch (err) {
      setError(err instanceof Error ? err.message : '商品の取得に失敗しました');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchVendors = useCallback(async () => {
    try {
      const res = await fetch('/api/vendors');
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors || []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchVendors();
    fetchItems();
  }, [fetchVendors, fetchItems]);

  // 検索・業者フィルタ
  const filteredItems = items.filter((item) => {
    // 業者フィルタ（vendor_idはUUID）
    if (selectedVendorId && item.vendor_id !== selectedVendorId) {
      return false;
    }
    // テキスト検索
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.item_number.toLowerCase().includes(query) ||
      item.customer_name?.toLowerCase().includes(query) ||
      item.vendor_name?.toLowerCase().includes(query) ||
      false
    );
  });

  // 返却モーダルを開く
  const openReturnModal = (item: ItemData) => {
    setSelectedItem(item);
    setShowReturnModal(true);
  };

  const handleSuccess = () => {
    setSelectedItem(null);
    fetchItems();
  };

  return (
    <div className="p-6 pb-32">
      <header className="mb-8">
        <div className="flex items-start gap-3">
          <div className="w-1 h-12 bg-shu shrink-0 mt-1"></div>
          <div>
            <h1 className="text-2xl font-mincho text-sumi tracking-wide">業者からの返却</h1>
            <p className="text-sm text-ginnezumi mt-1">加工後の写真撮影・返送予定日の設定</p>
          </div>
        </div>
      </header>

      {/* 検索・フィルタ */}
      <section className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="form-select sm:w-48 input"
            >
              <option value="">すべての業者</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input flex-1"
              placeholder="預かり番号・顧客名で検索"
            />
          </div>
        </div>
      </section>

      {/* エラー */}
      {error && (
        <div className="text-sm text-kokiake bg-kokiake/10 p-3 mb-4">
          {error}
        </div>
      )}

      {/* 商品リスト（カード形式） */}
      <section className="space-y-3">
        {isLoading ? (
          <div className="card p-8 text-center text-ginnezumi">読み込み中...</div>
        ) : filteredItems.length === 0 ? (
          <div className="card p-8 text-center text-ginnezumi">加工中の商品はありません</div>
        ) : (
          filteredItems.map((item) => {
            const shortItemNumber = shortenItemNumber(item.item_number);
            const daysElapsed = getDaysElapsed(item.ship_to_vendor_date);
            const isOverdue = daysElapsed !== null && daysElapsed > 14;

            return (
              <div
                key={item.item_number}
                onClick={() => openReturnModal(item)}
                className={`card p-3 cursor-pointer hover:bg-shironeri active:bg-shu/10 ${
                  isOverdue ? 'border-l-4 border-l-kokiake' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* サムネイル */}
                  <div className="flex gap-1 flex-shrink-0">
                    <div className="w-12 h-12 bg-shironeri flex items-center justify-center overflow-hidden">
                      {item.photo_front_url ? (
                        <img
                          src={item.photo_front_url}
                          alt="表"
                          className="w-12 h-12 object-cover"
                        />
                      ) : (
                        <span className="text-xs text-ginnezumi">表</span>
                      )}
                    </div>
                  </div>

                  {/* 情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0">
                        {item.partner_name && (
                          <div className="text-xs text-ginnezumi truncate">{item.partner_name}</div>
                        )}
                        <div className="font-medium text-base truncate">
                          {item.customer_name || '顧客未設定'}
                        </div>
                      </div>
                      <span className="text-xs px-1.5 py-0.5 bg-kinari text-aitetsu flex-shrink-0">
                        {ProductTypeLabel[item.product_type] || item.product_type}
                      </span>
                      {item.is_paid_storage && (
                        <span className="text-xs px-1.5 py-0.5 bg-oudo/20 text-oudo border border-oudo/30 flex-shrink-0">
                          有料
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ginnezumi mt-1">
                      <span className="font-mono">{shortItemNumber}</span>
                      <span>業者: {item.vendor_name || '-'}</span>
                    </div>
                    <div className={`text-xs mt-1 ${isOverdue ? 'text-kokiake font-medium' : 'text-ginnezumi'}`}>
                      経過: {daysElapsed !== null ? `${daysElapsed}日` : '-'}
                    </div>
                  </div>

                  {/* 矢印 */}
                  <svg
                    className="w-5 h-5 text-ginnezumi flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* 件数表示 */}
      {!isLoading && filteredItems.length > 0 && (
        <div className="mt-3 text-sm text-ginnezumi text-right">
          全{filteredItems.length}件
        </div>
      )}

      {/* 返却受入モーダル */}
      <ReturnAcceptModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        selectedItem={selectedItem}
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
