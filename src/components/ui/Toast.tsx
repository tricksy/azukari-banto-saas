'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

/**
 * トースト通知の種類
 */
type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * トースト通知のデータ
 */
interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

/**
 * トーストコンテキストの型
 */
interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * トースト通知を使用するためのフック
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * トーストプロバイダー
 * アプリケーションのルートに配置
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
}

/**
 * トースト通知のコンテナ
 * 画面右下に固定表示
 */
function ToastContainer({ toasts, onHide }: { toasts: Toast[]; onHide: (id: string) => void }) {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
      role="region"
      aria-label="通知"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onHide={onHide} />
      ))}
    </div>
  );
}

/**
 * 個別のトースト通知
 */
function ToastItem({ toast, onHide }: { toast: Toast; onHide: (id: string) => void }) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onHide(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onHide]);

  const typeStyles: Record<ToastType, string> = {
    success: 'bg-oitake text-white border-oitake',
    error: 'bg-kokiake text-white border-kokiake',
    warning: 'bg-oudo text-white border-oudo',
    info: 'bg-aitetsu text-white border-aitetsu',
  };

  const typeIcons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i',
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-l-4 shadow-lg animate-fusuma-in ${typeStyles[toast.type]}`}
      role="alert"
    >
      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-sm font-bold rounded-full bg-white/20">
        {typeIcons[toast.type]}
      </span>
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        onClick={() => onHide(toast.id)}
        className="flex-shrink-0 p-1 hover:bg-white/20 rounded"
        aria-label="閉じる"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}

/**
 * 簡易トースト表示用のユーティリティ関数
 * ToastProviderの外から使用する場合向け
 */
export const toast = {
  success: (message: string) => {
    // ToastProviderが必要なため、直接DOMに追加する簡易実装
    showGlobalToast(message, 'success');
  },
  error: (message: string) => {
    showGlobalToast(message, 'error');
  },
  warning: (message: string) => {
    showGlobalToast(message, 'warning');
  },
  info: (message: string) => {
    showGlobalToast(message, 'info');
  },
};

/**
 * グローバルトースト表示（Provider外からの呼び出し用）
 */
function showGlobalToast(message: string, type: ToastType) {
  const container = document.getElementById('global-toast-container') || createGlobalContainer();

  const toastEl = document.createElement('div');
  const id = `global-toast-${Date.now()}`;
  toastEl.id = id;

  const typeStyles: Record<ToastType, string> = {
    success: 'background: #5A6650; border-color: #5A6650;',
    error: 'background: #7B2D26; border-color: #7B2D26;',
    warning: 'background: #B68D40; border-color: #B68D40;',
    info: 'background: #2F3A46; border-color: #2F3A46;',
  };

  const typeIcons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i',
  };

  toastEl.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-left: 4px solid;
    color: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: fusumaIn 400ms cubic-bezier(0.4, 0.0, 0.2, 1);
    ${typeStyles[type]}
  `;
  toastEl.setAttribute('role', 'alert');

  toastEl.innerHTML = `
    <span style="flex-shrink: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border-radius: 9999px; background: rgba(255,255,255,0.2);">
      ${typeIcons[type]}
    </span>
    <p style="flex: 1; font-size: 14px; margin: 0;">${message}</p>
    <button onclick="document.getElementById('${id}').remove()" style="flex-shrink: 0; padding: 4px; cursor: pointer; background: transparent; border: none; color: white; font-size: 18px;" aria-label="閉じる">
      ×
    </button>
  `;

  container.appendChild(toastEl);

  setTimeout(() => {
    toastEl.remove();
  }, 4000);
}

function createGlobalContainer(): HTMLElement {
  const container = document.createElement('div');
  container.id = 'global-toast-container';
  container.style.cssText = `
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 384px;
  `;
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', '通知');
  container.setAttribute('aria-live', 'polite');
  document.body.appendChild(container);
  return container;
}
