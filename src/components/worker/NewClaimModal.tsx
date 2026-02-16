'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { ClaimCategoryLabel } from '@/types';
import type { ClaimCategory } from '@/types';
import { toast } from '@/components/ui/Toast';

interface NewClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemNumber?: string;
  onSuccess: () => void;
}

const categoryOptions: { value: string; label: string }[] = (
  Object.entries(ClaimCategoryLabel) as [ClaimCategory, string][]
).map(([value, label]) => ({ value, label }));

export function NewClaimModal({
  isOpen,
  onClose,
  itemNumber: prefilledItemNumber,
  onSuccess,
}: NewClaimModalProps) {
  const [itemNumber, setItemNumber] = useState(prefilledItemNumber || '');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // モーダル開閉時のリセット
  useEffect(() => {
    if (isOpen) {
      setItemNumber(prefilledItemNumber || '');
      setCategory('');
      setDescription('');
      setDueDate('');
      setError('');
    }
  }, [isOpen, prefilledItemNumber]);

  const handleSubmit = async () => {
    if (!itemNumber.trim()) {
      setError('預かり番号を入力してください');
      return;
    }
    if (!description.trim()) {
      setError('クレーム内容を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const body: Record<string, string> = {
        item_number: itemNumber.trim(),
        description: description.trim(),
      };

      if (category) body.category = category;
      if (dueDate) body.due_date = dueDate;

      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'クレームの登録に失敗しました');
      }

      toast.success('クレームを登録しました');
      onClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'クレームの登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="クレーム登録" size="md">
      <div className="space-y-4">
        {/* エラー表示 */}
        {error && (
          <div className="p-3 bg-kokiake/10 border border-kokiake/30 text-kokiake text-sm">
            {error}
          </div>
        )}

        {/* 預かり番号 */}
        <Input
          label="預かり番号"
          type="text"
          value={itemNumber}
          onChange={(e) => setItemNumber(e.target.value)}
          placeholder="例: T01-20260118143025-01"
          disabled={!!prefilledItemNumber}
          required
        />

        {/* カテゴリ */}
        <Select
          label="カテゴリ"
          options={categoryOptions}
          placeholder="選択してください"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        {/* クレーム内容 */}
        <div className="w-full">
          <label className="form-label form-label-required">
            クレーム内容
          </label>
          <textarea
            className="form-input w-full min-h-[100px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="クレームの詳細を記入してください"
            required
          />
        </div>

        {/* 対応期限 */}
        <Input
          label="対応期限（任意）"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        {/* アクションボタン */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={isSubmitting || !itemNumber.trim() || !description.trim()}
          >
            {isSubmitting ? '登録中...' : '登録する'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
