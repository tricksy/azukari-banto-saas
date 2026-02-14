'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * ローカルストレージに状態を永続化するカスタムフック
 *
 * @param key ローカルストレージのキー
 * @param defaultValue デフォルト値
 * @returns [state, setState] - useStateと同じインターフェース
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // 初期値は常にデフォルト値を使用（SSR/クライアント一致のため）
  const [state, setStateInternal] = useState<T>(defaultValue);

  // マウント後にローカルストレージから値を復元（ハイドレーション後）
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored) as T;
        setStateInternal(parsed);
      }
    } catch (error) {
      console.warn(`[usePersistedState] Failed to parse stored value for key "${key}":`, error);
    }
  }, [key]);

  // 状態更新時にローカルストレージにも保存
  const setState = useCallback((value: T | ((prev: T) => T)) => {
    setStateInternal((prev) => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.warn(`[usePersistedState] Failed to save value for key "${key}":`, error);
      }
      return newValue;
    });
  }, [key]);

  return [state, setState];
}

/**
 * ページの状態を永続化するためのキー定義
 */
export const STORAGE_KEYS = {
  // 担当者画面
  WORKER_DASHBOARD_PERIOD: 'kuratsugi:worker:dashboard:period',
  WORKER_ITEMS_TAB: 'kuratsugi:worker:items:tab',
  WORKER_ORDERS_TAB: 'kuratsugi:worker:orders:tab',
  WORKER_SHIPPING_TAB: 'kuratsugi:worker:shipping:tab',
  WORKER_RETURNS_TAB: 'kuratsugi:worker:returns:tab',
  WORKER_PAID_STORAGE_TAB: 'kuratsugi:worker:paid-storage:tab',

  // 管理者画面
  ADMIN_DASHBOARD_PERIOD: 'kuratsugi:admin:dashboard:period',
  ADMIN_ITEMS_TAB: 'kuratsugi:admin:items:tab',
  ADMIN_PAID_STORAGE_TAB: 'kuratsugi:admin:paid-storage:tab',
  ADMIN_CLAIMS_TAB: 'kuratsugi:admin:claims:tab',
  ADMIN_LOGS_TAB: 'kuratsugi:admin:logs:tab',
} as const;
