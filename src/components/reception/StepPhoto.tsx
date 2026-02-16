'use client';

import { useState } from 'react';
import { CameraCapture } from './CameraCapture';

interface StepPhotoProps {
  photoFrontUrl?: string;
  photoBackUrl?: string;
  photoFrontMemo?: string;
  photoBackMemo?: string;
  additionalPhotos: Array<{ url: string; memo?: string }>;
  onUpdate: (photos: {
    photoFrontUrl?: string;
    photoBackUrl?: string;
    photoFrontMemo?: string;
    photoBackMemo?: string;
    additionalPhotos: Array<{ url: string; memo?: string }>;
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
 */
export function StepPhoto({
  photoFrontUrl,
  photoBackUrl,
  photoFrontMemo,
  photoBackMemo,
  additionalPhotos,
  onUpdate,
  onNext,
  onBack,
  itemIndex,
  customerName,
}: StepPhotoProps) {
  const [captureTarget, setCaptureTarget] = useState<CaptureTarget | null>(null);

  const canProceed = !!photoFrontUrl && !!photoBackUrl;

  function handleCapture(dataUrl: string) {
    if (captureTarget === 'front') {
      onUpdate({
        photoFrontUrl: dataUrl,
        photoBackUrl,
        photoFrontMemo,
        photoBackMemo,
        additionalPhotos,
      });
    } else if (captureTarget === 'back') {
      onUpdate({
        photoFrontUrl,
        photoBackUrl: dataUrl,
        photoFrontMemo,
        photoBackMemo,
        additionalPhotos,
      });
    } else if (captureTarget === 'additional') {
      onUpdate({
        photoFrontUrl,
        photoBackUrl,
        photoFrontMemo,
        photoBackMemo,
        additionalPhotos: [...additionalPhotos, { url: dataUrl }],
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
        additionalPhotos,
      });
    } else if (target === 'back') {
      onUpdate({
        photoFrontUrl,
        photoBackUrl,
        photoFrontMemo,
        photoBackMemo: memo,
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
      additionalPhotos: updated,
    });
  }

  // カメラ撮影モード
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
      {/* ヘッダー情報 */}
      {customerName && (
        <div className="text-center">
          <p className="text-aitetsu">
            {customerName}さん — {itemIndex + 1}点目
          </p>
        </div>
      )}

      <h3 className="text-lg font-mincho text-sumi">写真撮影</h3>

      {/* 表面 */}
      <div className="card">
        <div className="card-body space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-aitetsu">表面</span>
            {photoFrontUrl ? (
              <span className="text-xs text-oitake">撮影済み</span>
            ) : (
              <span className="text-xs text-ginnezumi">未撮影</span>
            )}
          </div>

          {photoFrontUrl ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoFrontUrl}
                alt="表面"
                className="w-full max-h-48 object-contain bg-shironeri"
              />
              <input
                type="text"
                value={photoFrontMemo || ''}
                onChange={(e) => handleMemoChange('front', e.target.value)}
                placeholder="メモ（任意）"
                className="form-input form-input-sm"
              />
              <button
                type="button"
                onClick={() => setCaptureTarget('front')}
                className="btn-outline btn-sm w-full"
              >
                撮り直す
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCaptureTarget('front')}
              className="btn-primary w-full"
            >
              表面を撮影
            </button>
          )}
        </div>
      </div>

      {/* 裏面 */}
      <div className="card">
        <div className="card-body space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-aitetsu">裏面</span>
            {photoBackUrl ? (
              <span className="text-xs text-oitake">撮影済み</span>
            ) : (
              <span className="text-xs text-ginnezumi">未撮影</span>
            )}
          </div>

          {photoBackUrl ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoBackUrl}
                alt="裏面"
                className="w-full max-h-48 object-contain bg-shironeri"
              />
              <input
                type="text"
                value={photoBackMemo || ''}
                onChange={(e) => handleMemoChange('back', e.target.value)}
                placeholder="メモ（任意）"
                className="form-input form-input-sm"
              />
              <button
                type="button"
                onClick={() => setCaptureTarget('back')}
                className="btn-outline btn-sm w-full"
              >
                撮り直す
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCaptureTarget('back')}
              className="btn-primary w-full"
            >
              裏面を撮影
            </button>
          )}
        </div>
      </div>

      {/* 追加写真 */}
      <div className="card">
        <div className="card-body space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-aitetsu">追加写真</span>
            <span className="text-xs text-ginnezumi">
              {additionalPhotos.length}枚
            </span>
          </div>

          {additionalPhotos.map((photo, index) => (
            <div
              key={index}
              className="border border-usuzumi/20 p-2 space-y-2"
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`追加写真 ${index + 1}`}
                  className="w-full max-h-32 object-contain bg-shironeri"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteAdditional(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-sumi/70 text-white flex items-center justify-center text-xs hover:bg-sumi"
                  aria-label={`追加写真${index + 1}を削除`}
                >
                  ×
                </button>
              </div>
              <input
                type="text"
                value={photo.memo || ''}
                onChange={(e) => handleMemoChange(index, e.target.value)}
                placeholder="メモ（任意）"
                className="form-input form-input-sm"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() => setCaptureTarget('additional')}
            className="btn-outline btn-sm w-full"
          >
            追加写真を撮影
          </button>
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="flex gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary flex-1"
          >
            戻る
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="btn-primary flex-1"
        >
          次へ
        </button>
      </div>

      {!canProceed && (
        <p className="text-xs text-ginnezumi text-center">
          表面と裏面の両方を撮影してください
        </p>
      )}
    </div>
  );
}
