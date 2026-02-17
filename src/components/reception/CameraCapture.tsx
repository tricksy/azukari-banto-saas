'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { resizeAndConvertToBlob, createPreviewUrl, fileToResizedBlob } from '@/lib/image';

interface CameraCaptureProps {
  onCapture: (data: { blob: Blob; previewUrl: string; mimeType: string }) => void;
  onCancel: () => void;
  label?: string;
}

/**
 * カメラ撮影コンポーネント
 *
 * MediaDevices APIでカメラを起動し、写真を撮影する。
 * カメラが使用できない場合はファイルアップロードにフォールバック。
 */
export function CameraCapture({ onCapture, onCancel, label }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 2560 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (!cancelled) {
              setCameraReady(true);
            }
          };
        }
      } catch {
        if (!cancelled) {
          setCameraAvailable(false);
          setError('カメラを使用できません。ファイルを選択してください。');
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [stopStream]);

  async function handleCapture() {
    const video = videoRef.current;
    if (!video) return;

    try {
      const { blob, mimeType } = await resizeAndConvertToBlob(video, video.videoWidth, video.videoHeight);
      const previewUrl = createPreviewUrl(blob);
      stopStream();
      onCapture({ blob, previewUrl, mimeType });
    } catch {
      setError('撮影に失敗しました。もう一度お試しください。');
    }
  }

  function handleCancel() {
    stopStream();
    onCancel();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { blob, mimeType } = await fileToResizedBlob(file);
      const previewUrl = createPreviewUrl(blob);
      onCapture({ blob, previewUrl, mimeType });
    } catch {
      setError('画像の処理に失敗しました。別の画像をお試しください。');
    }
  }

  // カメラ非対応時: ファイルアップロードUI
  if (!cameraAvailable) {
    return (
      <div className="fixed inset-0 z-50 bg-sumi flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {label && (
            <p className="text-white text-lg mb-6">{label}</p>
          )}
          <div className="bg-kinari p-8 w-full max-w-md">
            <p className="text-aitetsu text-center mb-6">
              {error || 'カメラを使用できません。ファイルを選択してください。'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary w-full btn-lg mb-4"
            >
              ファイルを選択
            </button>
          </div>
        </div>

        <div className="p-4 bg-sumi/90">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary w-full"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  // カメラ対応時: ビデオプレビュー + 撮影UI
  return (
    <div className="fixed inset-0 z-50 bg-sumi flex flex-col">
      {/* ラベルオーバーレイ */}
      {label && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-sumi/70 px-4 py-3">
          <p className="text-white text-center text-lg">{label}</p>
        </div>
      )}

      {/* ビデオプレビュー */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white text-lg animate-pulse">カメラ起動中...</p>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="absolute top-16 left-4 right-4 bg-kokiake/90 text-white px-4 py-2 text-sm text-center">
          {error}
        </div>
      )}

      {/* 撮影ボタンエリア */}
      <div className="p-4 bg-sumi/90 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleCancel}
          className="btn-secondary flex-shrink-0"
        >
          キャンセル
        </button>

        {/* ファイル選択（デスクトップ等の代替手段） */}
        <div className="flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost text-white text-sm"
            title="ファイルから選択"
          >
            ファイル
          </button>
        </div>

        {/* 撮影ボタン */}
        <button
          type="button"
          onClick={handleCapture}
          disabled={!cameraReady}
          className="w-16 h-16 bg-white border-4 border-white/50 rounded-full flex-shrink-0 disabled:opacity-30 hover:bg-white/90 active:bg-white/70 transition-colors"
          aria-label="撮影"
        >
          <span className="sr-only">撮影</span>
        </button>
      </div>
    </div>
  );
}
