'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';

interface SelectedItem {
  item_number: string;
  product_name: string;
  status: string;
  condition_note?: string;
}

interface CancelItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: SelectedItem[];
  onSuccess: () => void;
}

export function CancelItemModal({
  isOpen,
  onClose,
  selectedItems,
  onSuccess,
}: CancelItemModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // モーダル開閉時のリセット
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('キャンセル理由を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError('');

    let successCount = 0;
    let failCount = 0;

    for (const item of selectedItems) {
      try {
        const existingNote = item.condition_note || '';
        const newNote = existingNote
          ? `キャンセル理由: ${trimmedReason}\n${existingNote}`
          : `キャンセル理由: ${trimmedReason}`;

        const res = await fetch(`/api/items/${encodeURIComponent(item.item_number)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'cancelled',
            condition_note: newNote,
          }),
        });

        if (res.ok) {
          successCount++;
        } else {
          const data = await res.json();
          console.error(`Failed to cancel ${item.item_number}:`, data.error);
          failCount++;
        }
      } catch (err) {
        console.error(`Error cancelling ${item.item_number}:`, err);
        failCount++;
      }
    }

    setIsSubmitting(false);

    if (failCount === 0) {
      toast.success(`${successCount}件の商品をキャンセルしました`);
      onClose();
      onSuccess();
    } else if (successCount > 0) {
      toast.warning(`${successCount}件成功、${failCount}件失敗しました`);
      onClose();
      onSuccess();
    } else {
      setError('キャンセル処理に失敗しました。もう一度お試しください');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="キャンセル" size="md">
      <div className="space-y-4">
        {/* エラー表示 */}
        {error && (
          <div className="p-3 bg-kokiake/10 border border-kokiake/30 text-kokiake text-sm">
            {error}
          </div>
        )}

        {/* 選択商品サマリー */}
        <div className="p-3 bg-shironeri">
          <p className="text-sm text-aitetsu mb-1">
            キャンセル対象: <span className="font-bold text-sumi">{selectedItems.length}件</span>
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedItems.map((item) => (
              <span
                key={item.item_number}
                className="inline-block text-xs bg-kinari px-2 py-0.5 text-ginnezumi font-mono"
              >
                {item.item_number}
              </span>
            ))}
          </div>
        </div>

        {/* キャンセル理由 */}
        <div className="w-full">
          <label htmlFor="cancel-reason" className="block text-sm mb-1 text-aitetsu">
            キャンセル理由 <span className="text-kokiake">*</span>
          </label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="キャンセルの理由を入力してください"
            rows={3}
            className="form-input w-full resize-y"
            required
          />
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            戻る
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-white bg-kokiake hover:bg-kokiake/90 disabled:opacity-50"
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? '処理中...' : `${selectedItems.length}件をキャンセル`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
