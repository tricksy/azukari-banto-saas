'use client';

import { useState } from 'react';
import { CameraCapture } from './CameraCapture';

interface StepPhotoProps {
  photoFrontUrl?: string;
  photoBackUrl?: string;
  photoFrontMemo?: string;
  photoBackMemo?: string;
  photoFrontBlob?: Blob;
  photoFrontMimeType?: string;
  photoBackBlob?: Blob;
  photoBackMimeType?: string;
  additionalPhotos: Array<{ url: string; memo?: string; blob?: Blob; mimeType?: string }>;
  onUpdate: (photos: {
    photoFrontUrl?: string;
    photoBackUrl?: string;
    photoFrontMemo?: string;
    photoBackMemo?: string;
    photoFrontBlob?: Blob;
    photoFrontMimeType?: string;
    photoBackBlob?: Blob;
    photoBackMimeType?: string;
    additionalPhotos: Array<{ url: string; memo?: string; blob?: Blob; mimeType?: string }>;
  }) => void;
  onNext: () => void;
  onBack?: () => void;
  itemIndex: number;
  customerName?: string;
}

type CaptureTarget = 'front' | 'back' | 'additional';

/**
 * 写真撮影ステップ
 *
 * 表面・裏面（必須）+ 追加写真（任意）の撮影・管理を行う。
 * KURATSUGIの1枚ずつ撮影フローに統一。
 */
export function StepPhoto({
  photoFrontUrl,
  photoBackUrl,
  photoFrontMemo,
  photoBackMemo,
  photoFrontBlob,
  photoFrontMimeType,
  photoBackBlob,
  photoBackMimeType,
  additionalPhotos,
  onUpdate,
  onNext,
  onBack,
  itemIndex,
  customerName,
}: StepPhotoProps) {
  const [captureTarget, setCaptureTarget] = useState<CaptureTarget | null>(null);

  const canProceed = !!photoFrontUrl && !!photoBackUrl;

  function handleCapture(data: { blob: Blob; previewUrl: string; mimeType: string }) {
    if (captureTarget === 'front') {
      onUpdate({
        photoFrontUrl: data.previewUrl,
        photoBackUrl,
        photoFrontMemo,
        photoBackMemo,
        photoFrontBlob: data.blob,
        photoFrontMimeType: data.mimeType,
        photoBackBlob,
        photoBackMimeType,
        additionalPhotos,
      });
    } else if (captureTarget === 'back') {
      onUpdate({
        photoFrontUrl,
        photoBackUrl: data.previewUrl,
        photoFrontMemo,
        photoBackMemo,
        photoFrontBlob,
        photoFrontMimeType,
        photoBackBlob: data.blob,
        photoBackMimeType: data.mimeType,
        additionalPhotos,
      });
    } else if (captureTarget === 'additional') {
      onUpdate({
        photoFrontUrl,
        photoBackUrl,
        photoFrontMemo,
        photoBackMemo,
        photoFrontBlob,
        photoFrontMimeType,
        photoBackBlob,
        photoBackMimeType,
        additionalPhotos: [...additionalPhotos, { url: data.previewUrl, blob: data.blob, mimeType: data.mimeType }],
      });
    }
    setCaptureTarget(null);
  }

  function handleCancelCapture() {
    setCaptureTarget(null);
  }

  function handleMemoChange(
    target: 'front' | 'back' | number,
    memo: string
  ) {
    if (target === 'front') {
      onUpdate({
        photoFrontUrl,
        photoBackUrl,
        photoFrontMemo: memo,
        photoBackMemo,
        photoFrontBlob,
        photoFrontMimeType,
        photoBackBlob,
        photoBackMimeType,
        additionalPhotos,
      });
    } else if (target === 'back') {
      onUpdate({
        photoFrontUrl,
        photoBackUrl,
        photoFrontMemo,
        photoBackMemo: memo,
        photoFrontBlob,
        photoFrontMimeType,
        photoBackBlob,
        photoBackMimeType,
        additionalPhotos,
      });
    } else {
      const updated = [...additionalPhotos];
      updated[target] = { ...updated[target], memo };
      onUpdate({
        photoFrontUrl,
        photoBackUrl,
        photoFrontMemo,
        photoBackMemo,
        photoFrontBlob,
        photoFrontMimeType,
        photoBackBlob,
        photoBackMimeType,
        additionalPhotos: updated,
      });
    }
  }

  function handleDeleteAdditional(index: number) {
    const updated = additionalPhotos.filter((_, i) => i !== index);
    onUpdate({
      photoFrontUrl,
      photoBackUrl,
      photoFrontMemo,
      photoBackMemo,
      photoFrontBlob,
      photoFrontMimeType,
      photoBackBlob,
      photoBackMimeType,
      additionalPhotos: updated,
    });
  }

  function handleClearFront() {
    onUpdate({
      photoFrontUrl: undefined,
      photoBackUrl,
      photoFrontMemo: '',
      photoBackMemo,
      photoFrontBlob: undefined,
      photoFrontMimeType: undefined,
      photoBackBlob,
      photoBackMimeType,
      additionalPhotos,
    });
  }

  function handleClearBack() {
    onUpdate({
      photoFrontUrl,
      photoBackUrl: undefined,
      photoFrontMemo,
      photoBackMemo: '',
      photoFrontBlob,
      photoFrontMimeType,
      photoBackBlob: undefined,
      photoBackMimeType: undefined,
      additionalPhotos,
    });
  }

  // Camera capture mode
  if (captureTarget) {
    const labels: Record<CaptureTarget, string> = {
      front: '表面を撮影してください',
      back: '裏面を撮影してください',
      additional: '追加写真を撮影してください',
    };
    return (
      <CameraCapture
        onCapture={handleCapture}
        onCancel={handleCancelCapture}
        label={labels[captureTarget]}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header info */}
      {customerName && (
        <div className="bg-shironeri border border-usuzumi/20 p-3 text-sm">
          <span className="text-ginnezumi">紐付け先：</span>
          <span className="font-medium ml-1">{customerName}</span>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg">
            {itemIndex === 0 ? '商品を撮影' : `商品を撮影（${itemIndex + 1}点目）`}
          </h2>
          <p className="text-sm text-ginnezumi">
            まず写真を撮影してください
            <span className="ml-2 text-kokiake font-medium">[必須] 表面・裏面の両方</span>
          </p>
        </div>
        <div className="card-body">
          {/* Sequential photo capture flow */}
          {!photoFrontUrl ? (
            // Step 1: Capture front
            <div>
              <div className="text-center mb-3">
                <span className="inline-block px-3 py-1 bg-shu/10 text-shu text-sm font-medium rounded-full">
                  1/2 表面を撮影
                </span>
              </div>
              <div
                className="aspect-[3/4] bg-shironeri border-2 border-dashed border-usuzumi/40 flex items-center justify-center cursor-pointer hover:border-shu hover:bg-shu/5 transition-colors overflow-hidden"
                onClick={() => setCaptureTarget('front')}
              >
                <div className="text-center text-ginnezumi p-4">
                  <div className="text-6xl mb-3">📷</div>
                  <div className="text-lg font-medium">タップして表面を撮影</div>
                </div>
              </div>
            </div>
          ) : !photoBackUrl ? (
            // Step 2: Front done, capture back
            <div>
              <div className="text-center mb-3">
                <span className="inline-block px-3 py-1 bg-shu/10 text-shu text-sm font-medium rounded-full">
                  1/2 表面 ✓
                </span>
              </div>
              {/* Front preview */}
              <div className="aspect-[3/4] bg-shironeri border border-usuzumi/20 overflow-hidden mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoFrontUrl} alt="表面" className="w-full h-full object-contain" />
              </div>
              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClearFront}
                  className="btn-secondary flex-1"
                >
                  撮り直す
                </button>
                <button
                  type="button"
                  onClick={() => setCaptureTarget('back')}
                  className="btn-primary flex-1"
                >
                  裏面を撮影 →
                </button>
              </div>
            </div>
          ) : (
            // Both captured: review + memos + additional photos
            <div className="space-y-6">
              <div className="text-center mb-3">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  ✓ 必須写真 撮影完了
                </span>
              </div>

              {/* Required photos (front/back) + memo */}
              <div className="grid grid-cols-2 gap-3">
                {/* Front */}
                <div>
                  <span className="text-sm text-ginnezumi block mb-1 text-center">表面</span>
                  <div className="aspect-[3/4] bg-shironeri border border-usuzumi/20 overflow-hidden mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoFrontUrl} alt="表面" className="w-full h-full object-contain" />
                  </div>
                  <input
                    type="text"
                    value={photoFrontMemo || ''}
                    onChange={(e) => handleMemoChange('front', e.target.value)}
                    placeholder="メモ（任意）"
                    className="form-input w-full text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleClearFront}
                    className="w-full mt-2 px-3 py-1.5 bg-kokiake/10 border border-kokiake/30 rounded text-xs text-kokiake hover:bg-kokiake hover:text-white hover:border-kokiake transition-colors flex items-center justify-center gap-1"
                  >
                    <span>🔄</span>
                    <span>撮り直す</span>
                  </button>
                </div>
                {/* Back */}
                <div>
                  <span className="text-sm text-ginnezumi block mb-1 text-center">裏面</span>
                  <div className="aspect-[3/4] bg-shironeri border border-usuzumi/20 overflow-hidden mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoBackUrl} alt="裏面" className="w-full h-full object-contain" />
                  </div>
                  <input
                    type="text"
                    value={photoBackMemo || ''}
                    onChange={(e) => handleMemoChange('back', e.target.value)}
                    placeholder="メモ（任意）"
                    className="form-input w-full text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleClearBack}
                    className="w-full mt-2 px-3 py-1.5 bg-kokiake/10 border border-kokiake/30 rounded text-xs text-kokiake hover:bg-kokiake hover:text-white hover:border-kokiake transition-colors flex items-center justify-center gap-1"
                  >
                    <span>🔄</span>
                    <span>撮り直す</span>
                  </button>
                </div>
              </div>

              {/* Additional photos section */}
              <div className="border-t border-usuzumi/20 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">追加写真（任意）</span>
                  <span className="text-xs text-ginnezumi">気になる箇所など</span>
                </div>

                {/* Additional photos list */}
                {additionalPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {additionalPhotos.map((photo, index) => (
                      <div key={index}>
                        <div className="aspect-square bg-shironeri border border-usuzumi/20 overflow-hidden relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.url} alt={`追加${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleDeleteAdditional(index)}
                            className="absolute top-1 right-1 w-5 h-5 bg-sumi/70 text-white flex items-center justify-center text-xs hover:bg-sumi"
                            aria-label={`追加写真${index + 1}を削除`}
                          >
                            ×
                          </button>
                        </div>
                        <input
                          type="text"
                          value={photo.memo || ''}
                          onChange={(e) => handleMemoChange(index, e.target.value)}
                          placeholder="メモ"
                          className="form-input w-full text-xs mt-1"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Add additional photo button */}
                <button
                  type="button"
                  onClick={() => setCaptureTarget('additional')}
                  className="w-full py-3 border-2 border-dashed border-usuzumi/30 text-ginnezumi hover:border-shu hover:text-shu transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-lg">📷</span>
                  <span className="text-sm">追加写真を撮影</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action button (bottom fixed) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gofun border-t border-usuzumi/20 p-4">
        <div className="flex gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary"
            >
              ← 戻る
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            className="btn-primary flex-1 text-lg py-4"
          >
            商品情報を入力 →
          </button>
        </div>
      </div>
    </div>
  );
}
