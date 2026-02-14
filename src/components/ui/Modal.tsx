'use client';

import { useEffect, ReactNode } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
  /** モーダルのタイトル */
  title: string;
  /** モーダルのコンテンツ */
  children: ReactNode;
  /** モーダルのサイズ */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 背景クリックで閉じるかどうか */
  closeOnBackdrop?: boolean;
  /** Escapeキーで閉じるかどうか */
  closeOnEscape?: boolean;
}

/**
 * アクセシブルなモーダルコンポーネント
 *
 * 機能:
 * - フォーカストラップ（Tab/Shift+Tabでモーダル内を循環）
 * - Escapeキーで閉じる
 * - 背景クリックで閉じる（オプション）
 * - aria-modal, aria-labelledby, role="dialog"
 * - 開閉時のフォーカス管理
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="確認"
 * >
 *   <p>本当に削除しますか？</p>
 *   <button onClick={handleDelete}>削除</button>
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
}: ModalProps) {
  const { ref } = useFocusTrap<HTMLDivElement>(isOpen);

  // Escapeキーでのクローズ
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // 背景スクロールの防止
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose();
    }
  };

  const titleId = `modal-title-${title.replace(/\s/g, '-').toLowerCase()}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sumi/50 animate-kiri-fade"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`card w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col animate-fusuma-in`}
      >
        {/* ヘッダー */}
        <div className="card-header flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-mincho">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-shironeri rounded"
            aria-label="閉じる"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="card-body overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/**
 * 確認ダイアログ用のモーダル
 */
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '確認',
  cancelText = 'キャンセル',
  variant = 'default',
  isLoading = false,
}: ConfirmModalProps) {
  const variantClasses = {
    danger: 'bg-kokiake hover:bg-kokiake/90',
    warning: 'bg-oudo hover:bg-oudo/90',
    default: 'bg-shu hover:bg-shu-light',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-aitetsu mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="btn-secondary"
          disabled={isLoading}
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 text-white ${variantClasses[variant]} disabled:opacity-50`}
          disabled={isLoading}
        >
          {isLoading ? '処理中...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
