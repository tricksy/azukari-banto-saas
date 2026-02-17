'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';
import { ItemCard } from '@/components/worker/ItemCard';
import { ShipToCustomerModal } from '@/components/worker/ShipToCustomerModal';
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
  return_from_vendor_date?: string;
}

type Tab = 'pending' | 'cancelled' | 'completed';

const statusByTab: Record<Tab, string> = {
  pending: 'returned,paid_storage,on_hold,awaiting_customer',
  cancelled: 'cancelled',
  completed: 'completed,cancelled_completed',
};

const limitByTab: Record<Tab, number> = {
  pending: 100,
  cancelled: 100,
  completed: 50,
};

// 例外ステータスの定義
type ExceptionStatus = 'on_hold' | 'awaiting_customer';
const EXCEPTION_STATUSES: { value: ExceptionStatus; label: string; description: string }[] = [
  { value: 'on_hold', label: '顧客への返送保留', description: '顧客都合等で返送を一時保留する' },
  { value: 'awaiting_customer', label: '顧客確認待ち', description: '顧客からの確認・連絡を待つ' },
];

/** Group items by status for visual separation */
function groupByStatus(items: ItemData[]): { status: ItemStatus; label: string; items: ItemData[] }[] {
  const groups: Record<string, ItemData[]> = {};
  for (const item of items) {
    if (!groups[item.status]) {
      groups[item.status] = [];
    }
    groups[item.status].push(item);
  }

  // Order: returned first, then paid_storage, then on_hold, then awaiting_customer
  const order: ItemStatus[] = ['returned', 'paid_storage', 'on_hold', 'awaiting_customer'];
  return order
    .filter((s) => groups[s] && groups[s].length > 0)
    .map((s) => ({
      status: s,
      label: ItemStatusLabel[s],
      items: groups[s],
    }));
}

/** 業者返却からの経過日数を計算 */
function getDaysFromReturn(dateStr?: string): number | null {
  if (!dateStr) return null;
  const returnDate = new Date(dateStr);
  const today = new Date();
  const diffTime = today.getTime() - returnDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/** 返送予定日を超過しているか */
function isOverdue(scheduledReturnDate?: string): boolean {
  if (!scheduledReturnDate) return false;
  const deadline = new Date(scheduledReturnDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  return today > deadline;
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
  const [detailItemNumber, setDetailItemNumber] = useState<string | null>(null);

  // 例外処理インラインモーダル
  const [exceptionItemNumber, setExceptionItemNumber] = useState<string | null>(null);
  const [exceptionStatus, setExceptionStatus] = useState<ExceptionStatus | ''>('');
  const [exceptionNote, setExceptionNote] = useState('');
  const [submittingException, setSubmittingException] = useState(false);

  // 再加工モーダル
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkNote, setReworkNote] = useState('');
  const [submittingRework, setSubmittingRework] = useState(false);

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

  // 選択された商品のうち returned ステータスのもの
  const selectedReturnedCount = selectedItems.filter((item) => item.status === 'returned').length;

  const handleSuccess = () => {
    setSelectedIds(new Set());
    fetchItems(activeTab);
  };

  // 例外処理モーダルを開く
  const openExceptionModal = (itemNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExceptionItemNumber(itemNumber);
    setExceptionStatus('');
    setExceptionNote('');
  };

  // 例外処理を閉じる
  const closeExceptionModal = () => {
    setExceptionItemNumber(null);
    setExceptionStatus('');
    setExceptionNote('');
  };

  // 例外処理実行
  const handleException = async () => {
    if (!exceptionItemNumber || !exceptionStatus) return;

    const item = items.find((i) => i.item_number === exceptionItemNumber);
    if (!item) return;

    setSubmittingException(true);
    try {
      const existingNote = item.condition_note || '';
      const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
      const statusLabel = ItemStatusLabel[exceptionStatus as ItemStatus];
      const noteText = exceptionNote.trim()
        ? `[${statusLabel} ${timestamp}] ${exceptionNote.trim()}`
        : '';
      const appendedNote = noteText
        ? (existingNote ? `${existingNote}\n${noteText}` : noteText)
        : existingNote;

      const body: Record<string, string> = {
        status: exceptionStatus,
      };
      if (appendedNote !== existingNote) {
        body.condition_note = appendedNote;
      }

      const res = await fetch(`/api/items/${encodeURIComponent(exceptionItemNumber)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || '処理に失敗しました');
        return;
      }

      closeExceptionModal();
      fetchItems(activeTab);
    } catch (err) {
      setError(err instanceof Error ? err.message : '処理に失敗しました');
    } finally {
      setSubmittingException(false);
    }
  };

  // 再加工モーダルを開く
  const openReworkModal = () => {
    if (selectedReturnedCount === 0) return;
    setReworkNote('');
    setShowReworkModal(true);
  };

  // 再加工実行
  const handleRework = async () => {
    const returnedItems = selectedItems.filter((item) => item.status === 'returned');
    if (returnedItems.length === 0) return;

    setSubmittingRework(true);
    try {
      const results = await Promise.allSettled(
        returnedItems.map((item) => {
          const existingNote = item.condition_note || '';
          const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
          const noteText = reworkNote.trim()
            ? `[${timestamp} 再加工依頼] ${reworkNote.trim()}`
            : '';
          const appendedNote = noteText
            ? (existingNote ? `${existingNote}\n${noteText}` : noteText)
            : existingNote;

          const body: Record<string, string> = {
            status: 'rework',
          };
          if (appendedNote !== existingNote) {
            body.condition_note = appendedNote;
          }

          return fetch(`/api/items/${encodeURIComponent(item.item_number)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }).then(async (res) => {
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || `${item.item_number} の更新に失敗しました`);
            }
            return res.json();
          });
        })
      );

      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        const messages = failures
          .map((r) => (r as PromiseRejectedResult).reason?.message || '不明なエラー')
          .join('\n');
        setError(`一部の更新に失敗しました:\n${messages}`);
      }

      setShowReworkModal(false);
      setReworkNote('');
      handleSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setSubmittingRework(false);
    }
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

  const renderItemWithCheckbox = (item: ItemData, showCheckbox: boolean) => {
    const days = getDaysFromReturn(item.return_from_vendor_date);
    const overdue = isOverdue(item.scheduled_return_date);

    return (
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
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <ItemCard
                item={item}
                onClick={() => setDetailItemNumber(item.item_number)}
              />
            </div>
            {/* 例外ボタン（returned ステータスのみ） */}
            {activeTab === 'pending' && item.status === 'returned' && (
              <button
                type="button"
                onClick={(e) => openExceptionModal(item.item_number, e)}
                className="flex-shrink-0 px-2 py-1 text-xs border border-usuzumi/30 text-ginnezumi hover:bg-kinari hover:text-sumi"
              >
                例外
              </button>
            )}
          </div>
          {/* 経過日数表示（returned ステータスのみ） */}
          {activeTab === 'pending' && item.status !== 'paid_storage' && days !== null && (
            <div className={`mt-1 px-3 text-xs flex items-center gap-2 ${overdue ? 'text-kokiake font-medium' : 'text-ginnezumi'}`}>
              <span>返却から {days}日経過</span>
              {overdue && item.scheduled_return_date && (
                <span className="text-kokiake">（返送期限 {formatDate(item.scheduled_return_date)} 超過）</span>
              )}
            </div>
          )}
          {/* 例外処理インラインモーダル */}
          {exceptionItemNumber === item.item_number && (
            <div className="mt-2 p-3 bg-shironeri border border-usuzumi/20 space-y-3">
              <h4 className="text-sm font-medium text-sumi">例外処理</h4>
              <div className="space-y-2">
                {EXCEPTION_STATUSES.map((status) => (
                  <label
                    key={status.value}
                    className={`block p-2 border cursor-pointer transition-colors ${
                      exceptionStatus === status.value
                        ? 'border-shu bg-shu/5'
                        : 'border-usuzumi/30 hover:border-usuzumi/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`exception-${item.item_number}`}
                        value={status.value}
                        checked={exceptionStatus === status.value}
                        onChange={(e) => setExceptionStatus(e.target.value as ExceptionStatus)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">{status.label}</span>
                    </div>
                    <p className="text-xs text-ginnezumi mt-0.5 ml-6">{status.description}</p>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-sumi mb-1">
                  メモ <span className="text-ginnezumi font-normal">（任意）</span>
                </label>
                <textarea
                  value={exceptionNote}
                  onChange={(e) => setExceptionNote(e.target.value)}
                  placeholder="理由や詳細を記録..."
                  className="input w-full h-16 resize-none text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeExceptionModal}
                  className="btn-secondary btn-sm text-xs"
                  disabled={submittingException}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleException}
                  disabled={submittingException || !exceptionStatus}
                  className="btn-primary btn-sm text-xs disabled:opacity-50"
                >
                  {submittingException ? '処理中...' : '登録'}
                </button>
              </div>
            </div>
          )}
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
  };

  return (
    <div className="p-4 space-y-4 pb-32">
      <header className="mb-2">
        <div className="flex items-start gap-3">
          <div className="w-1 h-12 bg-shu shrink-0 mt-1"></div>
          <div>
            <h1 className="text-2xl font-mincho text-sumi tracking-wide">返送管理</h1>
            <p className="text-sm text-ginnezumi mt-1">顧客への返送処理</p>
          </div>
        </div>
      </header>

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
          <input
            type="checkbox"
            id="selectAll"
            className="w-4 h-4 accent-shu"
            checked={items.length > 0 && selectedIds.size === items.length}
            onChange={handleSelectAll}
          />
          <label htmlFor="selectAll" className="text-sm text-ginnezumi">
            すべて選択 ({selectedIds.size}/{items.length})
          </label>
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
        <div className="fixed bottom-14 left-0 right-0 bg-kinari border-t border-usuzumi/20 p-4 shadow-lg z-40">
          <div className="max-w-lg mx-auto">
            <p className="text-xs text-ginnezumi mb-2">{selectedIds.size} 件選択中</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowShipModal(true)}
                className="btn-primary text-sm"
              >
                返送登録 ({selectedIds.size})
              </button>
              <button
                onClick={openReworkModal}
                disabled={selectedReturnedCount === 0}
                className="px-4 py-2 text-sm border border-kokiake text-kokiake hover:bg-kokiake/10 disabled:opacity-50"
              >
                再加工 ({selectedReturnedCount})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed action bar - cancelled tab */}
      {activeTab === 'cancelled' && selectedIds.size > 0 && (
        <div className="fixed bottom-14 left-0 right-0 bg-kinari border-t border-usuzumi/20 p-4 shadow-lg z-40">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <span className="text-sm text-sumi">
              {selectedIds.size} 件選択中
            </span>
            <button
              onClick={() => setShowCancelShipModal(true)}
              className="btn-primary text-sm"
            >
              返送登録 ({selectedIds.size})
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

      {/* 再加工モーダル */}
      {showReworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sumi/50 animate-kiri-fade">
          <div className="card w-full max-w-md animate-fusuma-in">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-mincho">再加工依頼</h2>
              <button
                onClick={() => setShowReworkModal(false)}
                className="p-1 hover:bg-shironeri"
                aria-label="閉じる"
              >
                <span aria-hidden="true" className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="card-body space-y-4">
              <p className="text-sm text-aitetsu">
                <span className="font-medium text-sumi">{selectedReturnedCount}</span> 件の商品を再加工に回します
              </p>
              <p className="text-xs text-kokiake">
                ※ 再加工依頼後は発注管理画面から業者へ発送してください
              </p>
              <div>
                <label className="block text-sm font-medium text-sumi mb-1">
                  再加工理由 <span className="text-ginnezumi font-normal">（任意）</span>
                </label>
                <textarea
                  value={reworkNote}
                  onChange={(e) => setReworkNote(e.target.value)}
                  placeholder="再加工が必要な理由を記録..."
                  className="input w-full h-20 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowReworkModal(false)}
                  className="btn-secondary"
                  disabled={submittingRework}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleRework}
                  disabled={submittingRework}
                  className="px-4 py-2 text-sm bg-kokiake text-white hover:bg-kokiake/90 disabled:opacity-50"
                >
                  {submittingRework ? '処理中...' : '再加工依頼'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        itemNumber={detailItemNumber}
        onClose={() => setDetailItemNumber(null)}
      />
    </div>
  );
}
