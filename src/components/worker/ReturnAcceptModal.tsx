'use client';

import { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { fileToResizedBlob, createPreviewUrl } from '@/lib/image';
import { uploadPhoto } from '@/lib/upload-photo';
import type { ItemStatus } from '@/types';

interface SelectedItem {
  item_number: string;
  product_name: string;
  product_type: string;
  status: ItemStatus;
  vendor_name?: string;
}

interface ReturnAcceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: SelectedItem[];
  onSuccess: () => void;
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

export function ReturnAcceptModal({
  isOpen,
  onClose,
  selectedItems,
  onSuccess,
}: ReturnAcceptModalProps) {
  const [returnDate, setReturnDate] = useState(getTodayString);
  const [photoAfterFront, setPhotoAfterFront] = useState<{ blob: Blob; previewUrl: string; mimeType: string } | null>(null);
  const [photoAfterBack, setPhotoAfterBack] = useState<{ blob: Blob; previewUrl: string; mimeType: string } | null>(null);
  const [isPaidStorage, setIsPaidStorage] = useState(false);
  const [scheduledReturnDate, setScheduledReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (data: { blob: Blob; previewUrl: string; mimeType: string } | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { blob, mimeType } = await fileToResizedBlob(file);
      const previewUrl = createPreviewUrl(blob);
      setter({ blob, previewUrl, mimeType });
    } catch {
      setError('写真の読み込みに失敗しました');
    }
  };

  const handleSubmit = async () => {
    if (!returnDate) {
      setError('返却日を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload photos to R2 if present
      let photoAfterFrontUrl: string | undefined;
      let photoAfterBackUrl: string | undefined;

      if (photoAfterFront) {
        // Use first item's number for the photo path
        photoAfterFrontUrl = await uploadPhoto(
          photoAfterFront.blob,
          selectedItems[0].item_number,
          'after_front',
          photoAfterFront.mimeType
        );
      }
      if (photoAfterBack) {
        photoAfterBackUrl = await uploadPhoto(
          photoAfterBack.blob,
          selectedItems[0].item_number,
          'after_back',
          photoAfterBack.mimeType
        );
      }

      const results = await Promise.allSettled(
        selectedItems.map((item) =>
          fetch(`/api/items/${encodeURIComponent(item.item_number)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'returned',
              return_from_vendor_date: returnDate,
              ...(photoAfterFrontUrl && { photo_after_front_url: photoAfterFrontUrl }),
              ...(photoAfterBackUrl && { photo_after_back_url: photoAfterBackUrl }),
              is_paid_storage: isPaidStorage,
              ...(scheduledReturnDate && { scheduled_return_date: scheduledReturnDate }),
              ...(notes && { condition_note: item.vendor_name ? `[返却受入] ${notes}` : notes }),
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
      setReturnDate(getTodayString());
      if (photoAfterFront?.previewUrl) URL.revokeObjectURL(photoAfterFront.previewUrl);
      if (photoAfterBack?.previewUrl) URL.revokeObjectURL(photoAfterBack.previewUrl);
      setPhotoAfterFront(null);
      setPhotoAfterBack(null);
      setIsPaidStorage(false);
      setScheduledReturnDate('');
      setNotes('');
      if (frontInputRef.current) frontInputRef.current.value = '';
      if (backInputRef.current) backInputRef.current.value = '';

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
      if (photoAfterFront?.previewUrl) URL.revokeObjectURL(photoAfterFront.previewUrl);
      if (photoAfterBack?.previewUrl) URL.revokeObjectURL(photoAfterBack.previewUrl);
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="返却受入" size="lg">
      <div className="space-y-5">
        {/* 選択商品サマリー */}
        <div className="bg-shironeri p-3">
          <p className="text-sm text-aitetsu">
            <span className="font-medium text-sumi">{selectedItems.length}</span> 件の商品を返却受入
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

        {/* 返却日 */}
        <div>
          <label className="block text-sm font-medium text-sumi mb-1">
            返却日 <span className="text-kokiake">*</span>
          </label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            className="input w-full"
            required
          />
        </div>

        {/* 加工後写真 */}
        <div>
          <label className="block text-sm font-medium text-sumi mb-2">
            加工後写真
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* 表面 */}
            <div>
              <button
                type="button"
                onClick={() => frontInputRef.current?.click()}
                className="w-full h-24 border border-dashed border-usuzumi/40 bg-shironeri flex flex-col items-center justify-center gap-1 hover:bg-kinari/50 transition-colors"
              >
                {photoAfterFront ? (
                  <img src={photoAfterFront.previewUrl} alt="加工後 表面" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <svg className="w-6 h-6 text-ginnezumi" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs text-ginnezumi">表面</span>
                  </>
                )}
              </button>
              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChange(e, setPhotoAfterFront)}
              />
              {photoAfterFront && (
                <button
                  type="button"
                  onClick={() => {
                    if (photoAfterFront.previewUrl) URL.revokeObjectURL(photoAfterFront.previewUrl);
                    setPhotoAfterFront(null);
                    if (frontInputRef.current) frontInputRef.current.value = '';
                  }}
                  className="mt-1 text-xs text-kokiake hover:underline"
                >
                  削除
                </button>
              )}
            </div>

            {/* 裏面 */}
            <div>
              <button
                type="button"
                onClick={() => backInputRef.current?.click()}
                className="w-full h-24 border border-dashed border-usuzumi/40 bg-shironeri flex flex-col items-center justify-center gap-1 hover:bg-kinari/50 transition-colors"
              >
                {photoAfterBack ? (
                  <img src={photoAfterBack.previewUrl} alt="加工後 裏面" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <svg className="w-6 h-6 text-ginnezumi" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs text-ginnezumi">裏面</span>
                  </>
                )}
              </button>
              <input
                ref={backInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChange(e, setPhotoAfterBack)}
              />
              {photoAfterBack && (
                <button
                  type="button"
                  onClick={() => {
                    if (photoAfterBack.previewUrl) URL.revokeObjectURL(photoAfterBack.previewUrl);
                    setPhotoAfterBack(null);
                    if (backInputRef.current) backInputRef.current.value = '';
                  }}
                  className="mt-1 text-xs text-kokiake hover:underline"
                >
                  削除
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 有料預かりチェックボックス */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPaidStorage"
            checked={isPaidStorage}
            onChange={(e) => setIsPaidStorage(e.target.checked)}
            className="w-4 h-4 accent-shu"
          />
          <label htmlFor="isPaidStorage" className="text-sm text-sumi">
            有料預かり対象にする
          </label>
        </div>

        {/* 返送予定日 */}
        <div>
          <label className="block text-sm font-medium text-sumi mb-1">
            返送予定日（任意）
          </label>
          <input
            type="date"
            value={scheduledReturnDate}
            onChange={(e) => setScheduledReturnDate(e.target.value)}
            className="input w-full"
          />
        </div>

        {/* 備考 */}
        <div>
          <label className="block text-sm font-medium text-sumi mb-1">
            備考（任意）
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input w-full h-20 resize-none"
            placeholder="返却時の状態メモなど"
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
            disabled={isSubmitting || !returnDate}
          >
            {isSubmitting ? '処理中...' : `${selectedItems.length} 件を返却受入`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
