'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { ProductTypeLabel, ProcessingTypeLabel } from '@/types';
import type { ItemStatus } from '@/types';

interface ItemDetailModalProps {
  itemNumber: string | null;
  onClose: () => void;
}

interface ItemData {
  item_number: string;
  reception_number?: string;
  customer_name?: string;
  customer_name_kana?: string;
  partner_name?: string;
  product_type: string;
  product_name: string;
  color?: string;
  material?: string;
  size?: string;
  condition_note?: string;
  request_type?: string;
  request_detail?: string;
  vendor_name?: string;
  status: ItemStatus;
  is_claim_active?: boolean;
  scheduled_ship_date?: string;
  scheduled_return_date?: string;
  ship_to_vendor_date?: string;
  return_from_vendor_date?: string;
  return_to_customer_date?: string;
  photo_front_url?: string;
  photo_back_url?: string;
  photo_after_front_url?: string;
  photo_after_back_url?: string;
  created_at: string;
}

interface LogEntry {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  changes?: Record<string, unknown>;
  created_at: string;
  worker_id?: string;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const actionLabels: Record<string, string> = {
  create: '作成',
  update: '更新',
  status_change: 'ステータス変更',
  delete: '削除',
};

function summarizeChanges(changes: Record<string, unknown> | undefined): string {
  if (!changes) return '';
  const before = changes.before as Record<string, unknown> | undefined;
  const after = changes.after as Record<string, unknown> | undefined;
  if (before && after) {
    const keys = Object.keys(after);
    return keys.map((k) => `${k}: ${String(before[k] ?? '---')} → ${String(after[k] ?? '---')}`).join(', ');
  }
  const entries = Object.entries(changes).filter(([k]) => k !== 'before' && k !== 'after');
  if (entries.length > 0) {
    return entries.map(([k, v]) => `${k}: ${String(v)}`).join(', ');
  }
  return '';
}

export function ItemDetailModal({ itemNumber, onClose }: ItemDetailModalProps) {
  const [item, setItem] = useState<ItemData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItem = useCallback(async (num: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/${encodeURIComponent(num)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '商品の取得に失敗しました');
      }
      const data = await res.json();
      setItem(data.item);
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '商品の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (itemNumber) {
      fetchItem(itemNumber);
    } else {
      setItem(null);
      setLogs([]);
    }
  }, [itemNumber, fetchItem]);

  const isOpen = itemNumber !== null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="商品詳細" size="lg">
      {isLoading && (
        <div className="space-y-4">
          <div className="h-6 bg-shironeri animate-pulse" />
          <div className="h-4 bg-shironeri animate-pulse w-3/4" />
          <div className="h-4 bg-shironeri animate-pulse w-1/2" />
          <div className="h-20 bg-shironeri animate-pulse" />
          <div className="h-4 bg-shironeri animate-pulse w-2/3" />
          <div className="h-4 bg-shironeri animate-pulse w-1/3" />
        </div>
      )}

      {error && (
        <div className="text-kokiake text-sm py-4 text-center">{error}</div>
      )}

      {!isLoading && item && (
        <div className="space-y-6">
          {/* 基本情報 */}
          <section>
            <h3 className="font-mincho text-sm text-sumi border-b border-usuzumi/20 pb-1 mb-3">
              基本情報
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-ginnezumi">預かり番号</dt>
              <dd className="font-mono text-xs text-sumi">{item.item_number}</dd>
              {item.reception_number && (
                <>
                  <dt className="text-ginnezumi">受付番号</dt>
                  <dd className="font-mono text-xs text-sumi">{item.reception_number}</dd>
                </>
              )}
              <dt className="text-ginnezumi">商品種別</dt>
              <dd className="text-sumi">{ProductTypeLabel[item.product_type] || item.product_type}</dd>
              <dt className="text-ginnezumi">商品名</dt>
              <dd className="text-sumi">{item.product_name}</dd>
              {item.color && (
                <>
                  <dt className="text-ginnezumi">色・柄</dt>
                  <dd className="text-sumi">{item.color}</dd>
                </>
              )}
              {item.material && (
                <>
                  <dt className="text-ginnezumi">素材</dt>
                  <dd className="text-sumi">{item.material}</dd>
                </>
              )}
              {item.size && (
                <>
                  <dt className="text-ginnezumi">サイズ</dt>
                  <dd className="text-sumi">{item.size}</dd>
                </>
              )}
              {item.condition_note && (
                <>
                  <dt className="text-ginnezumi">状態メモ</dt>
                  <dd className="text-sumi col-span-2">{item.condition_note}</dd>
                </>
              )}
            </dl>
          </section>

          {/* 顧客情報 */}
          <section>
            <h3 className="font-mincho text-sm text-sumi border-b border-usuzumi/20 pb-1 mb-3">
              顧客情報
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-ginnezumi">顧客名</dt>
              <dd className="text-sumi">{item.customer_name || '---'}</dd>
              {item.customer_name_kana && (
                <>
                  <dt className="text-ginnezumi">フリガナ</dt>
                  <dd className="text-sumi">{item.customer_name_kana}</dd>
                </>
              )}
              {item.partner_name && (
                <>
                  <dt className="text-ginnezumi">取引先</dt>
                  <dd className="text-sumi">{item.partner_name}</dd>
                </>
              )}
            </dl>
          </section>

          {/* 加工依頼 */}
          {(item.request_type || item.request_detail || item.vendor_name) && (
            <section>
              <h3 className="font-mincho text-sm text-sumi border-b border-usuzumi/20 pb-1 mb-3">
                加工依頼
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {item.request_type && (
                  <>
                    <dt className="text-ginnezumi">依頼種別</dt>
                    <dd className="text-sumi">{ProcessingTypeLabel[item.request_type] || item.request_type}</dd>
                  </>
                )}
                {item.request_detail && (
                  <>
                    <dt className="text-ginnezumi">依頼詳細</dt>
                    <dd className="text-sumi col-span-2">{item.request_detail}</dd>
                  </>
                )}
                {item.vendor_name && (
                  <>
                    <dt className="text-ginnezumi">加工業者</dt>
                    <dd className="text-sumi">{item.vendor_name}</dd>
                  </>
                )}
              </dl>
            </section>
          )}

          {/* ステータス */}
          <section>
            <h3 className="font-mincho text-sm text-sumi border-b border-usuzumi/20 pb-1 mb-3">
              ステータス
            </h3>
            <div className="mb-3">
              <StatusBadge status={item.status} isClaimActive={item.is_claim_active} />
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-ginnezumi">発送予定日</dt>
              <dd className="text-sumi">{formatDate(item.scheduled_ship_date)}</dd>
              <dt className="text-ginnezumi">返送予定日</dt>
              <dd className="text-sumi">{formatDate(item.scheduled_return_date)}</dd>
              <dt className="text-ginnezumi">業者発送日</dt>
              <dd className="text-sumi">{formatDate(item.ship_to_vendor_date)}</dd>
              <dt className="text-ginnezumi">業者返却日</dt>
              <dd className="text-sumi">{formatDate(item.return_from_vendor_date)}</dd>
              <dt className="text-ginnezumi">顧客返送日</dt>
              <dd className="text-sumi">{formatDate(item.return_to_customer_date)}</dd>
            </dl>
          </section>

          {/* 写真 */}
          {(item.photo_front_url || item.photo_back_url || item.photo_after_front_url || item.photo_after_back_url) && (
            <section>
              <h3 className="font-mincho text-sm text-sumi border-b border-usuzumi/20 pb-1 mb-3">
                写真
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {item.photo_front_url && (
                  <div>
                    <p className="text-xs text-ginnezumi mb-1">受入時（表）</p>
                    <img src={item.photo_front_url} alt="受入時 表面" className="w-full object-cover border border-usuzumi/20" />
                  </div>
                )}
                {item.photo_back_url && (
                  <div>
                    <p className="text-xs text-ginnezumi mb-1">受入時（裏）</p>
                    <img src={item.photo_back_url} alt="受入時 裏面" className="w-full object-cover border border-usuzumi/20" />
                  </div>
                )}
                {item.photo_after_front_url && (
                  <div>
                    <p className="text-xs text-ginnezumi mb-1">加工後（表）</p>
                    <img src={item.photo_after_front_url} alt="加工後 表面" className="w-full object-cover border border-usuzumi/20" />
                  </div>
                )}
                {item.photo_after_back_url && (
                  <div>
                    <p className="text-xs text-ginnezumi mb-1">加工後（裏）</p>
                    <img src={item.photo_after_back_url} alt="加工後 裏面" className="w-full object-cover border border-usuzumi/20" />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 操作ログ */}
          {logs.length > 0 && (
            <section>
              <h3 className="font-mincho text-sm text-sumi border-b border-usuzumi/20 pb-1 mb-3">
                操作ログ
              </h3>
              <div className="space-y-0">
                {logs.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="flex gap-3 py-2 border-b border-usuzumi/10 last:border-b-0"
                  >
                    {/* タイムライン */}
                    <div className="flex flex-col items-center flex-shrink-0 w-3">
                      <div className="w-2 h-2 bg-usuzumi/40 mt-1.5" />
                      {idx < logs.length - 1 && <div className="w-px flex-1 bg-usuzumi/20" />}
                    </div>
                    {/* ログ内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-ginnezumi">{formatDateTime(log.created_at)}</span>
                        <span className="text-aitetsu font-medium">
                          {actionLabels[log.action] || log.action}
                        </span>
                      </div>
                      {log.changes && (
                        <p className="text-xs text-ginnezumi mt-0.5 truncate">
                          {summarizeChanges(log.changes)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
