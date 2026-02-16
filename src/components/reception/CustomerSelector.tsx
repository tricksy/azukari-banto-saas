'use client';

import { useState, useEffect, useMemo } from 'react';

interface CustomerSelectorProps {
  partnerId?: string;
  partnerName?: string;
  customerType: 'partner' | 'individual';
  onSelect: (customer: { id: string; name: string; name_kana?: string }) => void;
  onCreateNew: () => void;
  onCancel: () => void;
}

interface CustomerData {
  id: string;
  name: string;
  name_kana?: string;
  phone?: string;
}

/**
 * 顧客選択コンポーネント
 *
 * 取引先でフィルタリングした顧客リストを表示し、選択させる。
 * 新規顧客の登録ボタンも提供。
 */
export function CustomerSelector({
  partnerId,
  partnerName,
  customerType,
  onSelect,
  onCreateNew,
  onCancel,
}: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (customerType === 'partner' && partnerId) {
          params.set('partner_id', partnerId);
        }
        if (searchQuery) {
          params.set('q', searchQuery);
        }
        const url = `/api/customers${params.toString() ? '?' + params.toString() : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('顧客の取得に失敗しました');
        const data = await res.json();
        setCustomers(data.customers || data || []);
      } catch {
        setError('顧客の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, [partnerId, customerType, searchQuery]);

  const filteredCustomers = useMemo(() => {
    // サーバーサイドで検索する設計だが、クライアント側でも追加フィルタリング可能
    return customers;
  }, [customers]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-mincho text-sumi">顧客を選択</h3>
          {customerType === 'partner' && partnerName && (
            <p className="text-xs text-ginnezumi mt-1">
              取引先: {partnerName}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost btn-sm"
        >
          キャンセル
        </button>
      </div>

      {/* 検索 */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="顧客名・フリガナ・電話番号で検索"
        className="form-input"
      />

      {/* 新規顧客登録ボタン */}
      <button
        type="button"
        onClick={onCreateNew}
        className="card card-interactive w-full text-left p-4 border-2 border-dashed border-shu/30 hover:border-shu/50"
      >
        <div className="flex items-center gap-3">
          <span className="text-shu text-xl" aria-hidden="true">+</span>
          <div>
            <p className="text-sm font-medium text-shu">
              新規顧客を登録
            </p>
            <p className="text-xs text-ginnezumi">
              顧客情報を新しく登録します
            </p>
          </div>
        </div>
      </button>

      {/* エラー */}
      {error && (
        <div className="alert alert-danger">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* ローディング */}
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-usuzumi/10 w-1/2" />
                <div className="h-3 bg-usuzumi/10 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 結果リスト */}
      {!loading && !error && (
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <p className="text-center text-ginnezumi py-8">
              該当する顧客がいません
            </p>
          ) : (
            filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() =>
                  onSelect({
                    id: customer.id,
                    name: customer.name,
                    name_kana: customer.name_kana,
                  })
                }
                className="card card-interactive w-full text-left p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-sumi">
                      {customer.name}
                    </p>
                    {customer.name_kana && (
                      <p className="text-xs text-ginnezumi">
                        {customer.name_kana}
                      </p>
                    )}
                  </div>
                  {customer.phone && (
                    <span className="font-mono text-xs text-ginnezumi">
                      {customer.phone}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
