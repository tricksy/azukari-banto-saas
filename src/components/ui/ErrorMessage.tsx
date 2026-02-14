/**
 * エラーメッセージコンポーネント
 *
 * エラー情報を詳細に表示し、対処方法とリトライ機能を提供
 */

'use client';

import { useState } from 'react';

/**
 * エラーの種類
 */
export type ErrorType =
  | 'network'      // ネットワークエラー
  | 'server'       // サーバーエラー
  | 'validation'   // バリデーションエラー
  | 'permission'   // 権限エラー
  | 'notFound'     // 見つからない
  | 'timeout'      // タイムアウト
  | 'unknown';     // 不明なエラー

/**
 * エラーコードからエラータイプを推測
 */
export function getErrorType(error: unknown): ErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'timeout';
    }
    if (message.includes('permission') || message.includes('forbidden') || message.includes('401') || message.includes('403')) {
      return 'permission';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'notFound';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    if (message.includes('500') || message.includes('server')) {
      return 'server';
    }
  }
  return 'unknown';
}

/**
 * HTTPステータスコードからエラータイプを取得
 */
export function getErrorTypeFromStatus(status: number): ErrorType {
  if (status === 401 || status === 403) return 'permission';
  if (status === 404) return 'notFound';
  if (status === 400 || status === 422) return 'validation';
  if (status >= 500) return 'server';
  if (status === 408) return 'timeout';
  return 'unknown';
}

/**
 * エラータイプ別の情報
 */
const ERROR_INFO: Record<ErrorType, { icon: string; title: string; description: string; suggestion: string }> = {
  network: {
    icon: '🌐',
    title: 'ネットワークエラー',
    description: 'インターネット接続に問題があります',
    suggestion: 'ネットワーク接続を確認して、もう一度お試しください',
  },
  server: {
    icon: '🖥️',
    title: 'サーバーエラー',
    description: 'サーバーで問題が発生しました',
    suggestion: 'しばらく待ってから、もう一度お試しください',
  },
  validation: {
    icon: '⚠️',
    title: '入力エラー',
    description: '入力内容に問題があります',
    suggestion: '入力内容を確認して、もう一度お試しください',
  },
  permission: {
    icon: '🔒',
    title: 'アクセス権限エラー',
    description: 'この操作を行う権限がありません',
    suggestion: '再度ログインするか、管理者にお問い合わせください',
  },
  notFound: {
    icon: '🔍',
    title: 'データが見つかりません',
    description: '要求されたデータが存在しません',
    suggestion: 'URLを確認するか、前のページに戻ってください',
  },
  timeout: {
    icon: '⏱️',
    title: 'タイムアウト',
    description: '処理に時間がかかりすぎました',
    suggestion: 'しばらく待ってから、もう一度お試しください',
  },
  unknown: {
    icon: '❌',
    title: 'エラーが発生しました',
    description: '予期しないエラーが発生しました',
    suggestion: '問題が続く場合は、管理者にお問い合わせください',
  },
};

interface ErrorMessageProps {
  /** エラーの種類 */
  type?: ErrorType;
  /** カスタムタイトル */
  title?: string;
  /** カスタムメッセージ */
  message?: string;
  /** 詳細情報（開発者向け） */
  details?: string;
  /** リトライ可能か */
  retryable?: boolean;
  /** リトライ時のコールバック */
  onRetry?: () => void;
  /** リトライ中か */
  isRetrying?: boolean;
  /** 閉じるボタンを表示するか */
  dismissible?: boolean;
  /** 閉じた時のコールバック */
  onDismiss?: () => void;
  /** コンパクト表示 */
  compact?: boolean;
  /** インライン表示（フォーム内用） */
  inline?: boolean;
}

/**
 * エラーメッセージコンポーネント
 *
 * @example
 * // 基本的な使用
 * <ErrorMessage type="network" onRetry={handleRetry} />
 *
 * // カスタムメッセージ付き
 * <ErrorMessage
 *   type="validation"
 *   message="メールアドレスの形式が正しくありません"
 *   inline
 * />
 *
 * // リトライ機能付き
 * <ErrorMessage
 *   type="server"
 *   retryable
 *   onRetry={() => fetchData()}
 *   isRetrying={loading}
 * />
 */
export function ErrorMessage({
  type = 'unknown',
  title,
  message,
  details,
  retryable = false,
  onRetry,
  isRetrying = false,
  dismissible = false,
  onDismiss,
  compact = false,
  inline = false,
}: ErrorMessageProps) {
  const [showDetails, setShowDetails] = useState(false);
  const info = ERROR_INFO[type];

  // インライン表示（フォームエラー用）
  if (inline) {
    return (
      <div className="flex items-start gap-2 text-kokiake text-sm py-1">
        <span className="flex-shrink-0">⚠️</span>
        <span>{message || info.description}</span>
      </div>
    );
  }

  // コンパクト表示
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-4 p-3 bg-kokiake/10 border border-kokiake/30 text-sumi">
        <div className="flex items-center gap-2">
          <span>{info.icon}</span>
          <span className="text-sm">{message || info.description}</span>
        </div>
        <div className="flex items-center gap-2">
          {retryable && onRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="text-sm text-shu hover:underline disabled:opacity-50"
            >
              {isRetrying ? '再試行中...' : '再試行'}
            </button>
          )}
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className="text-ginnezumi hover:text-sumi"
              aria-label="閉じる"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

  // 通常表示
  return (
    <div className="bg-kokiake/5 border border-kokiake/30 p-6">
      <div className="flex items-start gap-4">
        <span className="text-3xl">{info.icon}</span>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-sumi mb-1">
            {title || info.title}
          </h3>
          <p className="text-sumi mb-2">
            {message || info.description}
          </p>
          <p className="text-sm text-ginnezumi">
            {info.suggestion}
          </p>

          {/* 詳細情報（開発用） */}
          {details && (
            <div className="mt-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-ginnezumi hover:text-sumi flex items-center gap-1"
              >
                <span>{showDetails ? '▼' : '▶'}</span>
                <span>詳細情報</span>
              </button>
              {showDetails && (
                <pre className="mt-2 p-3 bg-sumi/5 text-xs text-ginnezumi overflow-x-auto whitespace-pre-wrap break-all">
                  {details}
                </pre>
              )}
            </div>
          )}

          {/* アクションボタン */}
          {(retryable || dismissible) && (
            <div className="mt-4 flex gap-3">
              {retryable && onRetry && (
                <button
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="btn-primary"
                >
                  {isRetrying ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⟳</span>
                      再試行中...
                    </span>
                  ) : (
                    '再試行'
                  )}
                </button>
              )}
              {dismissible && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="btn-secondary"
                >
                  閉じる
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * API レスポンスエラー用のヘルパー
 */
export interface ApiError {
  type: ErrorType;
  title: string;
  message: string;
  details?: string;
}

/**
 * fetch レスポンスからエラー情報を抽出
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  const type = getErrorTypeFromStatus(response.status);

  try {
    const data = await response.json();
    return {
      type,
      title: data.title || ERROR_INFO[type].title,
      message: data.error || data.message || ERROR_INFO[type].description,
      details: data.details || undefined,
    };
  } catch {
    return {
      type,
      title: ERROR_INFO[type].title,
      message: ERROR_INFO[type].description,
    };
  }
}

/**
 * エラーをキャッチしてApiError形式に変換
 */
export function toApiError(error: unknown): ApiError {
  const type = getErrorType(error);
  const message = error instanceof Error ? error.message : String(error);

  return {
    type,
    title: ERROR_INFO[type].title,
    message,
    details: error instanceof Error ? error.stack : undefined,
  };
}
