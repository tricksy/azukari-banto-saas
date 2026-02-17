'use client';

import { ProductTypeLabel, ProcessingTypeLabel } from '@/types';
import type { WizardItem } from './ReceptionWizard';

// ============================================
// Types
// ============================================

interface StepConfirmProps {
  items: WizardItem[];
  customerName?: string;
  partnerName?: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
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

export function StepConfirm({
  items,
  customerName,
  partnerName,
  notes,
  onNotesChange,
  onConfirm,
  onBack,
  isSubmitting,
}: StepConfirmProps) {
  const hasValidationError = items.some(
    (item) => !item.productType || !item.productName?.trim()
  );

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header"><h2 className="text-lg">登録内容の確認</h2></div>
        <div className="card-body space-y-4">
          {/* Partner */}
          {partnerName && (
            <div>
              <h3 className="text-sm text-ginnezumi">取引先</h3>
              <p className="font-medium">{partnerName}</p>
            </div>
          )}

          {/* Customer */}
          <div>
            <h3 className="text-sm text-ginnezumi">顧客</h3>
            <p className="font-medium">{customerName || '未選択'}</p>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm text-ginnezumi">商品（{items.length}点）</h3>
            <div className="mt-2 space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-shironeri">
                  <div className="flex gap-1">
                    {item.photoFrontUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.photoFrontUrl} alt="表面" className="w-12 h-16 object-cover" />
                    )}
                    {item.photoBackUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.photoBackUrl} alt="裏面" className="w-12 h-16 object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{getProductTypeLabel(item.productType)}</span>
                      {item.productName && <span>{item.productName}</span>}
                      {item.requestType && (
                        <span className="text-sm text-ginnezumi">
                          （{getRequestTypeLabel(item.requestType)}）
                        </span>
                      )}
                      {item.isPaidStorage && (
                        <span className="inline-block px-2 py-0.5 text-xs bg-oudo/20 text-oudo border border-oudo/30">
                          有料預かり
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes (editable) */}
          <div>
            <label className="text-sm text-ginnezumi">備考</label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="受付に関する備考"
              className="form-input w-full h-20"
            />
          </div>
        </div>
      </div>

      {/* Validation warning */}
      {hasValidationError && (
        <div className="card border-kokiake/30">
          <div className="card-body">
            <p className="text-sm text-kokiake">
              商品種別と商品名が未入力の商品があります。戻って入力してください。
            </p>
          </div>
        </div>
      )}

      {/* Action buttons (bottom fixed) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gofun border-t border-usuzumi/20 p-4">
        <div className="flex gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={onBack}
            disabled={isSubmitting}
          >
            ← 戻る
          </button>
          <button
            type="button"
            className="btn-primary flex-1"
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
