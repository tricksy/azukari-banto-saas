'use client';

import { useState } from 'react';
import { ProductTypeLabel, ProcessingTypeLabel } from '@/types';
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

/** 商品種別の選択肢（日本語キーのみ） */
const PRODUCT_TYPE_OPTIONS = Object.entries(ProductTypeLabel)
  .filter(([key]) => !['kimono', 'obi', 'other'].includes(key))
  .map(([value, label]) => ({ value, label }));

/** 加工種別の選択肢（日本語キーのみ） */
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

  const today = getJSTDateString();

  const handleChange = (field: keyof WizardItem, value: string | boolean) => {
    onUpdate({ ...item, [field]: value });
    if (field === 'productType' && value) {
      setError(null);
    }
  };

  const handleNext = () => {
    if (!item.productType) {
      setError('商品種別を選択してください');
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-mincho text-sumi">
          商品情報入力
          {itemIndex > 0 && (
            <span className="text-sm text-aitetsu font-sans ml-2">
              （{itemIndex + 1}点目）
            </span>
          )}
        </h3>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 商品種別（必須） */}
          <div className="w-full">
            <label className="form-label form-label-required">商品種別</label>
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
            {error && (
              <p className="text-xs text-kokiake mt-1" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* 商品名・品目 */}
          <div className="w-full">
            <label className="form-label">商品名・品目</label>
            <input
              type="text"
              className="form-input w-full"
              placeholder="例：訪問着、名古屋帯"
              value={item.productName}
              onChange={(e) => handleChange('productName', e.target.value)}
            />
          </div>

          {/* 色・柄 */}
          <div className="w-full">
            <label className="form-label">色・柄</label>
            <input
              type="text"
              className="form-input w-full"
              placeholder="例：薄紫、牡丹柄"
              value={item.color || ''}
              onChange={(e) => handleChange('color', e.target.value)}
            />
          </div>

          {/* 素材 */}
          <div className="w-full">
            <label className="form-label">素材</label>
            <input
              type="text"
              className="form-input w-full"
              placeholder="例：正絹、ポリエステル"
              value={item.material || ''}
              onChange={(e) => handleChange('material', e.target.value)}
            />
          </div>

          {/* サイズ */}
          <div className="w-full">
            <label className="form-label">サイズ</label>
            <input
              type="text"
              className="form-input w-full"
              placeholder="例：身丈160cm"
              value={item.size || ''}
              onChange={(e) => handleChange('size', e.target.value)}
            />
          </div>

          {/* 発送予定日 */}
          <div className="w-full">
            <label className="form-label">発送予定日</label>
            <input
              type="date"
              className="form-input w-full"
              value={item.scheduledShipDate || today}
              onChange={(e) => handleChange('scheduledShipDate', e.target.value)}
            />
          </div>

          {/* 状態メモ（全幅） */}
          <div className="w-full md:col-span-2">
            <label className="form-label">状態メモ</label>
            <textarea
              className="form-input w-full"
              rows={3}
              placeholder="気になる箇所、シミ・汚れ・ほつれ等の状態を記入"
              value={item.conditionNote || ''}
              onChange={(e) => handleChange('conditionNote', e.target.value)}
            />
          </div>

          {/* 加工種別 */}
          <div className="w-full">
            <label className="form-label">加工種別</label>
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

          {/* 有料預かり */}
          <div className="w-full flex items-end">
            <label className="flex items-center gap-2 cursor-pointer py-2">
              <input
                type="checkbox"
                className="w-4 h-4 accent-shu"
                checked={item.isPaidStorage || false}
                onChange={(e) => handleChange('isPaidStorage', e.target.checked)}
              />
              <span className="text-sm text-sumi">長期保管（有料預かり）</span>
            </label>
          </div>

          {/* 加工指示（全幅） */}
          <div className="w-full md:col-span-2">
            <label className="form-label">加工指示</label>
            <textarea
              className="form-input w-full"
              rows={3}
              placeholder="加工に関する詳細な指示を記入"
              value={item.requestDetail || ''}
              onChange={(e) => handleChange('requestDetail', e.target.value)}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t border-usuzumi/20">
          <button className="btn-secondary" onClick={onBack}>
            戻る
          </button>
          <button className="btn-primary" onClick={handleNext}>
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
