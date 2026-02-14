'use client';

import { useState } from 'react';

export default function WorkerItemsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-mincho text-sumi">商品検索</h2>

      {/* 検索フォーム */}
      <div className="card">
        <div className="card-body space-y-3">
          <div>
            <label className="text-xs text-aitetsu block mb-1">キーワード検索</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="預かり番号、取引先名、顧客名..."
              className="input w-full"
            />
          </div>
          <div>
            <label className="text-xs text-aitetsu block mb-1">ステータス</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full"
            >
              <option value="all">すべて</option>
              <option value="received">受付済</option>
              <option value="pending_ship">発送待ち</option>
              <option value="processing">加工中</option>
              <option value="returned">返却済</option>
              <option value="paid_storage">有料預かり</option>
              <option value="completed">完了</option>
            </select>
          </div>
          <button className="btn-primary w-full">検索</button>
        </div>
      </div>

      {/* 検索結果 */}
      <div className="text-center py-8 text-ginnezumi text-sm">
        検索条件を入力してください
      </div>
    </div>
  );
}
