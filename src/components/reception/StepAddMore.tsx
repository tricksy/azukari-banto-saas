'use client';

import { ProductTypeLabel, ProcessingTypeLabel } from '@/types';
import type { WizardItem } from './ReceptionWizard';

// ============================================
// Types
// ============================================

interface StepAddMoreProps {
  items: WizardItem[];
  customerName?: string;
  partnerName?: string;
  onAddMore: () => void;
  onFinish: () => void;
  onBack: () => void;
}

// ============================================
// Helpers
// ============================================

function getProductTypeLabel(value: string): string {
  return ProductTypeLabel[value] || value || '未設定';
}

function getRequestTypeLabel(value: string): string {
  return ProcessingTypeLabel[value] || value || '';
}

// ============================================
// Component
// ============================================

export function StepAddMore({
  items,
  customerName,
  partnerName,
  onAddMore,
  onFinish,
  onBack,
}: StepAddMoreProps) {
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg">登録済み商品</h2>
          {(partnerName || customerName) && (
            <span className="text-sm text-ginnezumi">
              紐付け先: {partnerName && <span>{partnerName} / </span>}
              {customerName}
            </span>
          )}
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-shironeri">
                {item.photoFrontUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photoFrontUrl} alt="" className="w-16 h-20 object-cover rounded" />
                )}
                <div className="flex-1">
                  <div className="font-medium">
                    {getProductTypeLabel(item.productType)} - {item.productName}
                  </div>
                  {item.requestType && (
                    <div className="text-sm text-ginnezumi">
                      {getRequestTypeLabel(item.requestType)}
                    </div>
                  )}
                </div>
                <span className="text-sm text-ginnezumi">{i + 1}点目</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body text-center py-6">
          <p className="text-lg">商品を追加しますか？</p>
        </div>
      </div>

      {/* Action buttons (bottom fixed) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gofun border-t border-usuzumi/20 p-4">
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onAddMore}>
            + 追加する
          </button>
          <button className="btn-primary flex-1" onClick={onFinish}>
            確認へ進む →
          </button>
        </div>
        <button
          className="text-sm text-ginnezumi hover:text-aitetsu text-center mt-3 w-full"
          onClick={onBack}
        >
          ← 戻る
        </button>
      </div>
    </div>
  );
}
