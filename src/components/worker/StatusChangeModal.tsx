'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { ItemStatus } from '@/types';

interface SelectedItem {
  item_number: string;
  product_name: string;
  product_type: string;
  status: ItemStatus;
  condition_note?: string;
}

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: SelectedItem[];
  targetStatus: ItemStatus;
  statusLabel: string;
  onSuccess: () => void;
}

export function StatusChangeModal({
  isOpen,
  onClose,
  selectedItems,
  targetStatus,
  statusLabel,
  onSuccess,
}: StatusChangeModalProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!note.trim()) {
      setError('理由・メモを入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const results = await Promise.allSettled(
        selectedItems.map((item) => {
          // Append note to existing condition_note
          const existingNote = item.condition_note || '';
          const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
          const appendedNote = existingNote
            ? `${existingNote}\n[${statusLabel} ${timestamp}] ${note.trim()}`
            : `[${statusLabel} ${timestamp}] ${note.trim()}`;

          return fetch(`/api/items/${encodeURIComponent(item.item_number)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: targetStatus,
              condition_note: appendedNote,
            }),
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
        return;
      }

      // Reset form
      setNote('');

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`ステータス変更: ${statusLabel}`}
      size="md"
    >
      <div className="space-y-5">
        {/* 選択商品サマリー */}
        <div className="bg-shironeri p-3">
          <p className="text-sm text-aitetsu">
            <span className="font-medium text-sumi">{selectedItems.length}</span> 件の商品を
            「<span className="font-medium text-sumi">{statusLabel}</span>」に変更
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

        {/* 理由・メモ */}
        <div>
          <label className="block text-sm font-medium text-sumi mb-1">
            理由・メモ <span className="text-kokiake">*</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input w-full h-28 resize-none"
            placeholder={`${statusLabel}にする理由を入力してください`}
            required
          />
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
            disabled={isSubmitting || !note.trim()}
          >
            {isSubmitting ? '処理中...' : `${selectedItems.length} 件を変更`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
