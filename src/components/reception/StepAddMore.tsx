'use client';

import { ProductTypeLabel } from '@/types';
import type { WizardItem } from './ReceptionWizard';

// ============================================
// Types
// ============================================

interface StepAddMoreProps {
  items: WizardItem[];
  customerName?: string;
  onAddMore: () => void;
  onFinish: () => void;
  onBack: () => void;
}

// ============================================
// Component
// ============================================

export function StepAddMore({
  items,
  customerName,
  onAddMore,
  onFinish,
  onBack,
}: StepAddMoreProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-mincho text-sumi">追加確認</h3>
      </div>
      <div className="card-body">
        {/* Summary message */}
        <div className="text-center mb-6">
          <p className="text-lg text-sumi">
            <span className="font-mono text-shu font-medium">{items.length}</span>
            <span className="ml-1">点の商品を登録しました</span>
          </p>
          {customerName && (
            <p className="text-sm text-aitetsu mt-1">
              顧客: {customerName}
            </p>
          )}
        </div>

        {/* Registered items list */}
        <div className="border border-usuzumi/20 divide-y divide-usuzumi/20 mb-6">
          {items.map((item, index) => {
            const typeLabel = ProductTypeLabel[item.productType] || item.productType || '未設定';
            return (
              <div key={index} className="flex items-center gap-3 px-4 py-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-shu/10 text-shu text-xs font-mono">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-sumi">{typeLabel}</span>
                  {item.productName && (
                    <span className="text-sm text-aitetsu ml-2">{item.productName}</span>
                  )}
                </div>
                {item.requestType && (
                  <span className="text-xs text-ginnezumi flex-shrink-0">
                    {item.requestType}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onAddMore}>
              もう1点追加する
            </button>
            <button className="btn-primary flex-1" onClick={onFinish}>
              登録を完了する
            </button>
          </div>
          <button
            className="text-sm text-ginnezumi hover:text-aitetsu text-center mt-2"
            onClick={onBack}
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
}
