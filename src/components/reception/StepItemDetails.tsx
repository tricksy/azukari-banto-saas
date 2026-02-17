'use client';

import { useState, useEffect } from 'react';
import { ProductTypeLabel, ProcessingTypeLabel } from '@/types';

interface VendorRow {
  id: string;
  vendor_id: string;
  name: string;
}
import { getJSTDateString } from '@/lib/date';
import type { WizardItem } from './ReceptionWizard';

// ============================================
// Types
// ============================================

interface StepItemDetailsProps {
  item: WizardItem;
  onUpdate: (item: WizardItem) => void;
  onNext: () => void;
  onBack: () => void;
  itemIndex: number;
}

// ============================================
// Options
// ============================================

/** Product type options (Japanese keys only) */
const PRODUCT_TYPE_OPTIONS = Object.entries(ProductTypeLabel)
  .filter(([key]) => !['kimono', 'obi', 'other'].includes(key))
  .map(([value, label]) => ({ value, label }));

/** Processing type options (Japanese keys only) */
const PROCESSING_TYPE_OPTIONS = Object.entries(ProcessingTypeLabel)
  .filter(([key]) => !['washing', 'dyeing', 'tailoring', 'stain_removal', 'alteration', 'other'].includes(key))
  .map(([value, label]) => ({ value, label }));

// ============================================
// Component
// ============================================

export function StepItemDetails({
  item,
  onUpdate,
  onNext,
  onBack,
  itemIndex,
}: StepItemDetailsProps) {
  const [error, setError] = useState<string | null>(null);
  const [vendorList, setVendorList] = useState<VendorRow[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);

  const today = getJSTDateString();

  // Load vendors on mount
  useEffect(() => {
    const loadVendors = async () => {
      setIsLoadingVendors(true);
      try {
        const res = await fetch('/api/vendors');
        const data = await res.json();
        setVendorList(data.vendors || []);
      } catch (err) {
        console.error('Load vendors error:', err);
      } finally {
        setIsLoadingVendors(false);
      }
    };
    loadVendors();
  }, []);

  const handleChange = (field: keyof WizardItem, value: string | boolean) => {
    onUpdate({ ...item, [field]: value });
    if ((field === 'productType' || field === 'productName') && value) {
      setError(null);
    }
  };

  const handleVendorChange = (vendorId: string) => {
    const selectedVendor = vendorList.find(v => v.vendor_id === vendorId);
    onUpdate({
      ...item,
      vendorId: vendorId,
      vendorName: selectedVendor?.name || '',
    });
  };

  const handleNext = () => {
    if (!item.productType) {
      setError('商品種別を選択してください');
      return;
    }
    if (!item.productName?.trim()) {
      setError('商品名を入力してください');
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg">商品情報</h2>
          {/* Photo thumbnails */}
          <div className="flex gap-2 mt-2">
            {item.photoFrontUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.photoFrontUrl} alt="表面" className="w-12 h-16 object-cover rounded border border-usuzumi/20" />
            )}
            {item.photoBackUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.photoBackUrl} alt="裏面" className="w-12 h-16 object-cover rounded border border-usuzumi/20" />
            )}
          </div>
        </div>
        <div className="card-body space-y-4">
          {/* Product type and processing type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-ginnezumi">商品種別</label>
              <select
                className={`form-input w-full ${error ? 'border-kokiake' : ''}`}
                value={item.productType}
                onChange={(e) => handleChange('productType', e.target.value)}
              >
                <option value="">選択してください</option>
                {PRODUCT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-ginnezumi">加工種別</label>
              <select
                className="form-input w-full"
                value={item.requestType || ''}
                onChange={(e) => handleChange('requestType', e.target.value)}
              >
                <option value="">選択してください</option>
                {PROCESSING_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-xs text-kokiake" role="alert">
              {error}
            </p>
          )}

          {/* Product name */}
          <div>
            <label className="text-sm text-ginnezumi">商品名・品目</label>
            <input
              type="text"
              className={`form-input w-full ${error && !item.productName?.trim() ? 'border-kokiake' : ''}`}
              placeholder="例: 訪問着、袋帯など"
              value={item.productName}
              onChange={(e) => handleChange('productName', e.target.value)}
            />
          </div>

          {/* Color and material (first item only) */}
          {itemIndex === 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-ginnezumi">色・柄</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={item.color || ''}
                  onChange={(e) => handleChange('color', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-ginnezumi">素材</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={item.material || ''}
                  onChange={(e) => handleChange('material', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Condition note + processing instructions (combined) */}
          <div>
            <label className="text-sm text-ginnezumi">状態メモ・加工指示</label>
            <textarea
              className="form-input w-full h-20"
              placeholder="シミや傷などの状態、加工の詳細指示"
              value={item.conditionNote || ''}
              onChange={(e) => handleChange('conditionNote', e.target.value)}
            />
          </div>

          {/* Vendor select */}
          <div>
            <label className="text-sm text-ginnezumi">依頼先業者（任意）</label>
            <select
              value={item.vendorId || ''}
              onChange={(e) => handleVendorChange(e.target.value)}
              className="form-input w-full"
              disabled={isLoadingVendors}
            >
              <option value="">未選択（後から設定）</option>
              {vendorList.map((v) => (
                <option key={v.vendor_id} value={v.vendor_id}>{v.name}</option>
              ))}
            </select>
            <p className="text-xs text-ginnezumi mt-1">受付時に決まっている場合は選択</p>
          </div>

          {/* Paid storage and ship date */}
          <div className="pt-4 border-t border-usuzumi/20 space-y-4">
            {/* Paid storage checkbox */}
            <div className="bg-shironeri border border-usuzumi/20 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.isPaidStorage || false}
                  onChange={(e) => handleChange('isPaidStorage', e.target.checked)}
                  className="mt-1 w-5 h-5 text-shu border-usuzumi/40 focus:ring-shu"
                />
                <div>
                  <span className="font-medium text-sumi">長期保管（有料預かり）</span>
                  <p className="text-xs text-ginnezumi mt-1">
                    お客様との合意がある長期保管の場合にチェック
                  </p>
                  <p className="text-xs text-ginnezumi">
                    ※チェックすると返送予定日の制限がなくなります
                  </p>
                </div>
              </label>
            </div>

            {/* Ship date */}
            <div>
              <label className="text-sm text-ginnezumi">発送予定日</label>
              <input
                type="date"
                className="form-input w-full"
                value={item.scheduledShipDate || today}
                onChange={(e) => handleChange('scheduledShipDate', e.target.value)}
              />
              <p className="text-xs text-ginnezumi mt-1">業者への発送予定</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons (bottom fixed) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gofun border-t border-usuzumi/20 p-4">
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={onBack}>
            ← 戻る
          </button>
          <button className="btn-primary flex-1" onClick={handleNext}>
            {itemIndex === 0 ? '顧客選択へ →' : '追加確認へ →'}
          </button>
        </div>
      </div>
    </div>
  );
}
