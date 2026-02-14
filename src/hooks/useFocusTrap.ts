import { useEffect, useRef, useCallback } from 'react';

/**
 * フォーカス可能な要素のセレクタ
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * フォーカストラップフック
 * モーダルやダイアログ内でキーボードフォーカスを閉じ込める
 *
 * @param isActive - フォーカストラップが有効かどうか
 * @returns ref - トラップするコンテナ要素に適用するref
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const trapRef = useFocusTrap(isOpen);
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div ref={trapRef} role="dialog" aria-modal="true">
 *       <h2>モーダルタイトル</h2>
 *       <button onClick={onClose}>閉じる</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(isActive: boolean) {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // フォーカス可能な要素を取得
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => el.offsetParent !== null); // 非表示要素を除外
  }, []);

  // キーダウンハンドラ
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift+Tab で最初の要素から最後の要素へ
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      // Tab で最後の要素から最初の要素へ
      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
        return;
      }
    },
    [getFocusableElements]
  );

  // Escapeキーでのクローズ用コールバック（オプション）
  const handleEscape = useCallback((callback?: () => void) => {
    return (event: KeyboardEvent) => {
      if (event.key === 'Escape' && callback) {
        callback();
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
      // 非アクティブ時にフォーカスを元に戻す
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
      return;
    }

    // 現在のフォーカス要素を保存
    previousActiveElement.current = document.activeElement;

    // 最初のフォーカス可能な要素にフォーカス
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // 少し遅延させてDOMの更新を待つ
      requestAnimationFrame(() => {
        focusableElements[0].focus();
      });
    }

    // イベントリスナーを追加
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, getFocusableElements, handleKeyDown]);

  return { ref: containerRef, handleEscape };
}

/**
 * aria-liveリージョン用のフック
 * 動的なコンテンツ変更をスクリーンリーダーに通知
 *
 * @param message - 通知するメッセージ
 * @param politeness - 'polite' | 'assertive'
 *
 * @example
 * ```tsx
 * function SearchResults({ results, loading }) {
 *   useAriaLive(
 *     loading ? '検索中...' : `${results.length}件の結果が見つかりました`,
 *     'polite'
 *   );
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useAriaLive(message: string, politeness: 'polite' | 'assertive' = 'polite') {
  useEffect(() => {
    if (!message) return;

    // aria-liveリージョンを作成または取得
    let liveRegion = document.getElementById(`aria-live-${politeness}`);

    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = `aria-live-${politeness}`;
      liveRegion.setAttribute('aria-live', politeness);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(liveRegion);
    }

    // メッセージを更新（スクリーンリーダーに通知）
    liveRegion.textContent = '';
    requestAnimationFrame(() => {
      if (liveRegion) {
        liveRegion.textContent = message;
      }
    });
  }, [message, politeness]);
}
