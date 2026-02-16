'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ItemStatus } from '@/types';
import { ItemCard } from '@/components/worker/ItemCard';
import { ItemDetailModal } from '@/components/worker/ItemDetailModal';
import { Pagination } from '@/components/ui/Pagination';

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
  photo_front_url?: string;
  created_at: string;
  scheduled_ship_date?: string;
  scheduled_return_date?: string;
}

const ITEMS_PER_PAGE = 20;

export default function WorkerItemsPage() {
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [items, setItems] = useState<ItemResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedItemNumber, setSelectedItemNumber] = useState<string | null>(null);

  const fetchItems = useCallback(async (q: string, status: string, p: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status && status !== 'all') params.set('status', status);
      params.set('page', String(p));
      params.set('limit', String(ITEMS_PER_PAGE));

      const res = await fetch(`/api/items?${params.toString()}`);
      if (!res.ok) throw new Error('検索に失敗しました');

      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total ?? 0);
      setHasSearched(true);
    } catch (error) {
      console.error('Failed to search items:', error);
      setItems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初回: URLにパラメータがあれば自動検索
  useEffect(() => {
    const q = searchParams.get('q');
    const status = searchParams.get('status');
    if (q || status) {
      fetchItems(q || '', status || 'all', 1);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setPage(1);
    fetchItems(searchQuery, statusFilter, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchItems(searchQuery, statusFilter, newPage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-mincho text-sumi">商品検索</h2>

      {/* 検索フォーム */}
      <div className="card">
        <div className="card-body space-y-3">
          <div>
            <label className="text-xs text-aitetsu block mb-1">キーワード検索</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="預かり番号、取引先名、顧客名..."
              className="input w-full"
            />
          </div>
          <div>
            <label className="text-xs text-aitetsu block mb-1">ステータス</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full"
            >
              <option value="all">すべて</option>
              <option value="draft">顧客未設定</option>
              <option value="received">受付済</option>
              <option value="pending_ship">発送待ち</option>
              <option value="processing">加工中</option>
              <option value="returned">返却済</option>
              <option value="paid_storage">有料預かり</option>
              <option value="completed">完了</option>
              <option value="rework">再加工</option>
              <option value="on_hold">返送保留</option>
              <option value="awaiting_customer">顧客確認待ち</option>
              <option value="cancelled">キャンセル</option>
            </select>
          </div>
          <button
            className="btn-primary w-full"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? '検索中...' : '検索'}
          </button>
        </div>
      </div>

      {/* 検索結果 */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-shironeri animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && hasSearched && (
        <>
          <p className="text-sm text-aitetsu">
            {total}件の商品が見つかりました
          </p>

          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item) => (
                <ItemCard
                  key={item.item_number}
                  item={item}
                  onClick={() => setSelectedItemNumber(item.item_number)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-ginnezumi text-sm">
              条件に一致する商品がありません
            </div>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {!isLoading && !hasSearched && (
        <div className="text-center py-8 text-ginnezumi text-sm">
          検索条件を入力してください
        </div>
      )}

      {/* 商品詳細モーダル */}
      <ItemDetailModal
        itemNumber={selectedItemNumber}
        onClose={() => setSelectedItemNumber(null)}
      />
    </div>
  );
}
