'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CameraCapture } from '@/components/reception/CameraCapture';
import { uploadPhoto } from '@/lib/upload-photo';
import { CarrierTypeLabel, getTrackingUrl } from '@/types';
import type { ItemStatus, CarrierType } from '@/types';

interface SelectedItem {
  item_number: string;
  product_name: string;
  product_type: string;
  status: ItemStatus;
  customer_name?: string;
  vendor_name?: string;
  vendor_tracking_number?: string;
  vendor_carrier?: string;
  is_paid_storage?: boolean;
}

interface ReturnAcceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: SelectedItem | null;
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
  selectedItem,
  onSuccess,
}: ReturnAcceptModalProps) {
  const [returnDate, setReturnDate] = useState(getTodayString);
  const [photoAfterFront, setPhotoAfterFront] = useState<{ blob: Blob; previewUrl: string; mimeType: string } | null>(null);
  const [photoAfterBack, setPhotoAfterBack] = useState<{ blob: Blob; previewUrl: string; mimeType: string } | null>(null);
  const [isPaidStorage, setIsPaidStorage] = useState(false);
  const [scheduledReturnDate, setScheduledReturnDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnDeadlineDays, setReturnDeadlineDays] = useState(14);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraSide, setCameraSide] = useState<'front' | 'back'>('front');

  // 有料預かり設定を引き継ぐ
  useEffect(() => {
    if (isOpen && selectedItem) {
      setIsPaidStorage(selectedItem.is_paid_storage === true);
    }
  }, [isOpen, selectedItem]);

  // テナント設定を取得
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/settings')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.settings?.returnDeadlineDays !== undefined) {
          setReturnDeadlineDays(Number(data.settings.returnDeadlineDays) || 14);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  /**
   * 返送予定日の最大値を計算
   * - 有料預かりの場合: 制限なし（undefined）
   * - 通常の場合: 業者返却日 + returnDeadlineDays日
   */
  const getMaxScheduledReturnDate = useCallback((): string | undefined => {
    if (isPaidStorage) return undefined;
    if (!returnDate) return undefined;

    const d = new Date(returnDate);
    d.setDate(d.getDate() + returnDeadlineDays);
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }, [isPaidStorage, returnDate, returnDeadlineDays]);

  const openCamera = (side: 'front' | 'back') => {
    setCameraSide(side);
    setIsCameraOpen(true);
  };

  const handleCameraCapture = (data: { blob: Blob; previewUrl: string; mimeType: string }) => {
    if (cameraSide === 'front') {
      if (photoAfterFront?.previewUrl) URL.revokeObjectURL(photoAfterFront.previewUrl);
      setPhotoAfterFront(data);
    } else {
      if (photoAfterBack?.previewUrl) URL.revokeObjectURL(photoAfterBack.previewUrl);
      setPhotoAfterBack(data);
    }
    setIsCameraOpen(false);
  };

  const handleCameraCancel = () => {
    setIsCameraOpen(false);
  };

  const removePhoto = (side: 'front' | 'back') => {
    if (side === 'front') {
      if (photoAfterFront?.previewUrl) URL.revokeObjectURL(photoAfterFront.previewUrl);
      setPhotoAfterFront(null);
    } else {
      if (photoAfterBack?.previewUrl) URL.revokeObjectURL(photoAfterBack.previewUrl);
      setPhotoAfterBack(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;

    if (!returnDate) {
      setError('返却日を入力してください');
      return;
    }
    if (!photoAfterFront) {
      setError('加工後写真（表面）を撮影してください');
      return;
    }
    if (!photoAfterBack) {
      setError('加工後写真（裏面）を撮影してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload photos to R2
      let photoAfterFrontUrl: string | undefined;
      let photoAfterBackUrl: string | undefined;

      if (photoAfterFront) {
        photoAfterFrontUrl = await uploadPhoto(
          photoAfterFront.blob,
          selectedItem.item_number,
          'after_front',
          photoAfterFront.mimeType
        );
      }
      if (photoAfterBack) {
        photoAfterBackUrl = await uploadPhoto(
          photoAfterBack.blob,
          selectedItem.item_number,
          'after_back',
          photoAfterBack.mimeType
        );
      }

      const res = await fetch(`/api/items/${encodeURIComponent(selectedItem.item_number)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'returned',
          return_from_vendor_date: returnDate,
          ...(photoAfterFrontUrl && { photo_after_front_url: photoAfterFrontUrl }),
          ...(photoAfterBackUrl && { photo_after_back_url: photoAfterBackUrl }),
          is_paid_storage: isPaidStorage,
          ...(scheduledReturnDate && { scheduled_return_date: scheduledReturnDate }),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '返却登録に失敗しました');
      }

      // Reset form
      setReturnDate(getTodayString());
      if (photoAfterFront?.previewUrl) URL.revokeObjectURL(photoAfterFront.previewUrl);
      if (photoAfterBack?.previewUrl) URL.revokeObjectURL(photoAfterBack.previewUrl);
      setPhotoAfterFront(null);
      setPhotoAfterBack(null);
      setIsPaidStorage(false);
      setScheduledReturnDate('');

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '返却登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      if (photoAfterFront?.previewUrl) URL.revokeObjectURL(photoAfterFront.previewUrl);
      if (photoAfterBack?.previewUrl) URL.revokeObjectURL(photoAfterBack.previewUrl);
      setPhotoAfterFront(null);
      setPhotoAfterBack(null);
      setIsPaidStorage(false);
      setScheduledReturnDate('');
      setError(null);
      onClose();
    }
  };

  // CameraCapture全画面表示
  if (isCameraOpen) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onCancel={handleCameraCancel}
        label={cameraSide === 'front' ? '加工後の写真（表面）' : '加工後の写真（裏面）'}
      />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="業者からの返却登録" size="lg">
      <div className="space-y-5">
        {/* 商品情報 */}
        {selectedItem && (
          <div className="bg-kinari p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex">
                <dt className="w-24 text-ginnezumi">預かり番号</dt>
                <dd className="font-mono text-xs">{selectedItem.item_number}</dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-ginnezumi">顧客名</dt>
                <dd>{selectedItem.customer_name || '-'}</dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-ginnezumi">商品</dt>
                <dd>{selectedItem.product_name || '-'}</dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-ginnezumi">発注先</dt>
                <dd>{selectedItem.vendor_name || '-'}</dd>
              </div>
              {/* 発送時の送り状情報 */}
              {(selectedItem.vendor_tracking_number || selectedItem.vendor_carrier) && (
                <div className="flex items-center">
                  <dt className="w-24 text-ginnezumi">発送送り状</dt>
                  <dd className="flex items-center gap-2">
                    {selectedItem.vendor_carrier && (
                      <span className="text-xs px-2 py-0.5 bg-white text-aitetsu">
                        {CarrierTypeLabel[selectedItem.vendor_carrier as CarrierType] || selectedItem.vendor_carrier}
                      </span>
                    )}
                    {(() => {
                      const trackingUrl = selectedItem.vendor_carrier && selectedItem.vendor_tracking_number
                        ? getTrackingUrl(selectedItem.vendor_carrier as CarrierType, selectedItem.vendor_tracking_number)
                        : null;
                      return trackingUrl ? (
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-shu hover:underline"
                        >
                          {selectedItem.vendor_tracking_number}
                          <span className="ml-1">&#8599;</span>
                        </a>
                      ) : (
                        <span className="font-mono text-xs">{selectedItem.vendor_tracking_number}</span>
                      );
                    })()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* 加工後の写真（必須） */}
        <div>
          <label className="block text-sm font-medium text-sumi mb-2">
            加工後の写真（必須）
          </label>
          <div className="grid grid-cols-2 gap-4">
            {/* 表面 */}
            <div>
              <p className="text-xs text-ginnezumi mb-2 text-center">表面</p>
              {photoAfterFront ? (
                <div className="relative aspect-[3/4] bg-shironeri">
                  <img
                    src={photoAfterFront.previewUrl}
                    alt="加工後 表面"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto('front')}
                    className="absolute top-1 right-1 w-6 h-6 bg-kokiake text-white text-xs flex items-center justify-center"
                    aria-label="表面の写真を削除"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openCamera('front')}
                  className="w-full aspect-[3/4] border-2 border-dashed border-usuzumi/30 flex flex-col items-center justify-center text-ginnezumi hover:border-shu hover:text-shu transition-colors"
                >
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">撮影</span>
                </button>
              )}
            </div>

            {/* 裏面 */}
            <div>
              <p className="text-xs text-ginnezumi mb-2 text-center">裏面</p>
              {photoAfterBack ? (
                <div className="relative aspect-[3/4] bg-shironeri">
                  <img
                    src={photoAfterBack.previewUrl}
                    alt="加工後 裏面"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto('back')}
                    className="absolute top-1 right-1 w-6 h-6 bg-kokiake text-white text-xs flex items-center justify-center"
                    aria-label="裏面の写真を削除"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openCamera('back')}
                  className="w-full aspect-[3/4] border-2 border-dashed border-usuzumi/30 flex flex-col items-center justify-center text-ginnezumi hover:border-shu hover:text-shu transition-colors"
                >
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">撮影</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 業者からの返却日 */}
        <div>
          <label className="block text-sm font-medium text-sumi mb-1">
            業者からの返却日
          </label>
          <input
            type="date"
            value={returnDate}
            max={getTodayString()}
            onChange={(e) => setReturnDate(e.target.value)}
            className="input w-full"
          />
        </div>

        {/* 有料預かり設定 */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPaidStorage}
              onChange={(e) => setIsPaidStorage(e.target.checked)}
              className="w-5 h-5 accent-oudo"
            />
            <span className="text-sm font-medium text-sumi">有料預かりにする</span>
          </label>
          <p className="text-xs text-ginnezumi mt-1 ml-8">
            ※有料預かりの場合、返送予定日の制限がなくなります
          </p>
        </div>

        {/* 顧客への返送予定日 */}
        <div>
          <label className="block text-sm font-medium text-sumi mb-1">
            顧客への返送予定日
          </label>
          {/* 有料預かり対象バッジ */}
          {isPaidStorage && (
            <div className="mb-2">
              <span className="inline-block px-2 py-0.5 text-xs bg-oudo/20 text-oudo border border-oudo/30">
                有料預かり対象
              </span>
            </div>
          )}
          <input
            type="date"
            value={scheduledReturnDate}
            min={getTodayString()}
            max={getMaxScheduledReturnDate()}
            onChange={(e) => setScheduledReturnDate(e.target.value)}
            className="input w-full"
          />
          {/* ヘルプテキスト */}
          {isPaidStorage ? (
            <p className="text-xs text-oudo mt-1">
              ※有料預かり対象のため、返送予定日の制限はありません
            </p>
          ) : (
            <p className="text-xs text-ginnezumi mt-1">
              ※返却日から{returnDeadlineDays}日以内で設定してください
            </p>
          )}
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
            className="btn-outline"
            disabled={isSubmitting}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary disabled:opacity-50"
            disabled={isSubmitting || !returnDate || !photoAfterFront || !photoAfterBack}
          >
            {isSubmitting ? '処理中...' : '返却登録'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
