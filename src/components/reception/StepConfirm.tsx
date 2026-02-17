'use client';

import { ProductTypeLabel } from '@/types';
import type { WizardItem } from './ReceptionWizard';

// ============================================
// Types
// ============================================

interface StepConfirmProps {
  items: WizardItem[];
  customerName?: string;
  partnerName?: string;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

// ============================================
// Component
// ============================================

export function StepConfirm({
  items,
  customerName,
  partnerName,
  onConfirm,
  onBack,
  isSubmitting,
}: StepConfirmProps) {
  const hasValidationError = items.some(
    (item) => !item.productType || !item.productName?.trim()
  );

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-mincho text-sumi">登録内容の確認</h3>
      </div>
      <div className="card-body">
        {/* Customer info */}
        <div className="mb-6 pb-4 border-b border-usuzumi/20">
          <h4 className="text-sm font-medium text-aitetsu mb-2">顧客情報</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-ginnezumi">顧客名:</span>
              <span className="text-sumi ml-2">{customerName || '未選択'}</span>
            </div>
            {partnerName && (
              <div>
                <span className="text-ginnezumi">取引先:</span>
                <span className="text-sumi ml-2">{partnerName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items list */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-aitetsu mb-3">
            登録商品（{items.length}点）
          </h4>
          <div className="space-y-3">
            {items.map((item, index) => {
              const typeLabel = ProductTypeLabel[item.productType] || item.productType || '未設定';
              return (
                <div
                  key={index}
                  className="border border-usuzumi/20 p-3 flex gap-3"
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-16 h-16 bg-shironeri border border-usuzumi/20 flex items-center justify-center">
                    {item.photoFrontUrl ? (
                      <img
                        src={item.photoFrontUrl}
                        alt={`商品${index + 1}の写真`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-ginnezumi" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                    )}
                  </div>

                  {/* Item info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-shu/10 text-shu px-1">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-sumi">{typeLabel}</span>
                      {item.productName && (
                        <span className="text-sm text-aitetsu">{item.productName}</span>
                      )}
                    </div>
                    {item.requestType && (
                      <p className="text-xs text-ginnezumi mt-1">
                        加工: {item.requestType}
                      </p>
                    )}
                    {item.conditionNote && (
                      <p className="text-xs text-ginnezumi mt-0.5 truncate">
                        状態: {item.conditionNote}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation warning */}
        {hasValidationError && (
          <div className="mb-4 p-3 bg-kokiake/10 border border-kokiake/30 text-kokiake text-sm">
            商品種別と商品名が未入力の商品があります。戻って入力してください。
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between pt-4 border-t border-usuzumi/20">
          <button
            className="btn-secondary"
            onClick={onBack}
            disabled={isSubmitting}
          >
            戻る
          </button>
          <button
            className="btn-primary"
            onClick={onConfirm}
            disabled={isSubmitting || hasValidationError}
          >
            {isSubmitting ? '登録中...' : '登録する'}
          </button>
        </div>
      </div>
    </div>
  );
}
