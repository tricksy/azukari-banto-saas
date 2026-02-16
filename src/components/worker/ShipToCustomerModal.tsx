'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CARRIER_OPTIONS } from '@/types';
import type { ItemStatus, CarrierType } from '@/types';

interface SelectedItem {
  item_number: string;
  product_name: string;
  product_type: string;
  status: ItemStatus;
}

interface ShipToCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: SelectedItem[];
  onSuccess: () => void;
  /** Target status after shipping. Defaults to 'completed'. Use 'cancelled_completed' for cancelled items. */
  targetStatus?: 'completed' | 'cancelled_completed';
}

function getTodayString(): string {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function ShipToCustomerModal({
  isOpen,
  onClose,
  selectedItems,
  onSuccess,
  targetStatus = 'completed',
}: ShipToCustomerModalProps) {
  const [shipDate, setShipDate] = useState(getTodayString);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState<CarrierType | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!shipDate) {
      setError('返送日を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const results = await Promise.allSettled(
        selectedItems.map((item) =>
          fetch(`/api/items/${encodeURIComponent(item.item_number)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: targetStatus,
              return_to_customer_date: shipDate,
              ...(trackingNumber && { customer_tracking_number: trackingNumber }),
              ...(carrier && { customer_carrier: carrier }),
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || `${item.item_number} の更新に失敗しました`);
            }
            return res.json();
          })
        )
      );

      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        const messages = failures
          .map((r) => (r as PromiseRejectedResult).reason?.message || '不明なエラー')
          .join('\n');
        setError(`一部の更新に失敗しました:\n${messages}`);
        return;
      }

      // Reset form
      setShipDate(getTodayString());
      setTrackingNumber('');
      setCarrier('');

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  const isCancelledFlow = targetStatus === 'cancelled_completed';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isCancelledFlow ? 'キャンセル品返送' : '顧客へ返送'}
      size="md"
    >
      <div className="space-y-5">
        {/* 選択商品サマリー */}
        <div className="bg-shironeri p-3">
          <p className="text-sm text-aitetsu">
            <span className="font-medium text-sumi">{selectedItems.length}</span> 件の商品を
            {isCancelledFlow ? 'キャンセル品として返送' : '顧客へ返送'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedItems.slice(0, 5).map((item) => (
              <span key={item.item_number} className="text-xs font-mono text-ginnezumi bg-kinari px-1.5 py-0.5">
                {item.item_number.slice(-12)}
              </span>
            ))}
            {selectedItems.length > 5 && (
              <span className="text-xs text-ginnezumi">
                ...他 {selectedItems.length - 5} 件
              </span>
            )}
          </div>
        </div>

        {/* 返送日 */}
        <div>
          <label className="block text-sm font-medium text-sumi mb-1">
            返送日 <span className="text-kokiake">*</span>
          </label>
          <input
            type="date"
            value={shipDate}
            onChange={(e) => setShipDate(e.target.value)}
            className="input w-full"
            required
          />
        </div>

        {/* 送り状番号 */}
        <div>
          <label className="block text-sm font-medium text-sumi mb-1">
            送り状番号（任意）
          </label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="input w-full"
            placeholder="例: 1234-5678-9012"
          />
        </div>

        {/* 配送業者 */}
        <div>
          <label className="block text-sm font-medium text-sumi mb-1">
            配送業者（任意）
          </label>
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value as CarrierType | '')}
            className="input w-full"
          >
            <option value="">選択してください</option>
            {CARRIER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* エラー */}
        {error && (
          <div className="text-sm text-kokiake bg-kokiake/10 p-3 whitespace-pre-line">
            {error}
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary"
            disabled={isSubmitting || !shipDate}
          >
            {isSubmitting ? '処理中...' : `${selectedItems.length} 件を返送`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
