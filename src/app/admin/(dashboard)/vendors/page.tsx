'use client';

import { useState, useEffect } from 'react';

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Supabase APIからデータ取得
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch vendors:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-mincho text-sumi">業者管理</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-sm"
        >
          新規登録
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-mincho">業者登録</h3>
          </div>
          <div className="card-body space-y-3">
            <div>
              <label className="text-xs text-aitetsu block mb-1">業者名</label>
              <input type="text" className="input w-full" />
            </div>
            <div>
              <label className="text-xs text-aitetsu block mb-1">専門分野</label>
              <input type="text" className="input w-full" placeholder="染め、仕立て、洗い..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-aitetsu block mb-1">郵便番号</label>
                <input type="text" className="input w-full" placeholder="000-0000" />
              </div>
              <div>
                <label className="text-xs text-aitetsu block mb-1">電話番号</label>
                <input type="text" className="input w-full" />
              </div>
            </div>
            <div>
              <label className="text-xs text-aitetsu block mb-1">住所</label>
              <input type="text" className="input w-full" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">キャンセル</button>
              <button className="btn-primary text-sm">登録</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-shironeri animate-pulse" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-12 text-ginnezumi text-sm">
          業者が登録されていません
        </div>
      ) : (
        <div className="space-y-2">
          {/* TODO: 業者リスト */}
        </div>
      )}
    </div>
  );
}
