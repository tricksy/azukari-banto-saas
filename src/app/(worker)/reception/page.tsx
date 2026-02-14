'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ReceptionContent() {
  const searchParams = useSearchParams();
  const isDraft = searchParams.get('draft') === 'true';

  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-mincho text-sumi mb-6">
          {isDraft ? '顧客紐づけ' : '預かり受付'}
        </h2>

        {/* TODO: ReceptionWizardコンポーネントの実装 */}
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-aitetsu">受付ウィザードは準備中です</p>
            <p className="text-sm text-ginnezumi mt-2">
              取引先選択 → 顧客選択 → 商品情報入力 → 写真撮影 → 確認
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReceptionPage() {
  return (
    <Suspense fallback={
      <div className="p-4">
        <div className="h-8 bg-shironeri animate-pulse mb-6" />
        <div className="h-64 bg-shironeri animate-pulse" />
      </div>
    }>
      <ReceptionContent />
    </Suspense>
  );
}
