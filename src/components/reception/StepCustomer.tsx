'use client';

import { useState } from 'react';
import { PartnerSelector } from './PartnerSelector';
import { CustomerSelector } from './CustomerSelector';
import type { CustomerType } from '@/types';

interface StepCustomerProps {
  customerId?: string;
  customerName?: string;
  customerNameKana?: string;
  partnerId?: string;
  partnerName?: string;
  onUpdate: (data: {
    customerId: string;
    customerName: string;
    customerNameKana?: string;
    partnerId?: string;
    partnerName?: string;
  }) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

type SubStep =
  | 'type-select'
  | 'partner-select'
  | 'customer-select'
  | 'new-customer-form';

interface SelectedPartner {
  id: string;
  name: string;
  partner_code: string;
}

interface NewCustomerForm {
  name: string;
  nameKana: string;
  phone: string;
  address: string;
  email: string;
}

const INITIAL_FORM: NewCustomerForm = {
  name: '',
  nameKana: '',
  phone: '',
  address: '',
  email: '',
};

/**
 * 顧客選択ステップ
 *
 * 顧客区分（取引先経由/個人）を選択し、
 * 取引先経由の場合は取引先 → 顧客の順に選択させる。
 */
export function StepCustomer({
  customerId,
  customerName,
  customerNameKana,
  partnerId,
  partnerName,
  onUpdate,
  onNext,
  onBack,
  onSkip,
}: StepCustomerProps) {
  const [customerType, setCustomerType] = useState<CustomerType | null>(null);
  const [subStep, setSubStep] = useState<SubStep>('type-select');
  const [selectedPartner, setSelectedPartner] = useState<SelectedPartner | null>(null);
  const [formData, setFormData] = useState<NewCustomerForm>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewCustomerForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleTypeSelect(type: CustomerType) {
    setCustomerType(type);
    if (type === 'partner') {
      setSubStep('partner-select');
    } else {
      setSubStep('customer-select');
    }
  }

  function handlePartnerSelect(partner: { id: string; name: string; partner_code: string }) {
    setSelectedPartner(partner);
    setSubStep('customer-select');
  }

  function handleCustomerSelect(customer: { id: string; name: string; name_kana?: string }) {
    onUpdate({
      customerId: customer.id,
      customerName: customer.name,
      customerNameKana: customer.name_kana,
      partnerId: selectedPartner?.id,
      partnerName: selectedPartner?.name,
    });
    onNext();
  }

  function handleCreateNew() {
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setSubmitError(null);
    setSubStep('new-customer-form');
  }

  function handleCancelSubStep() {
    if (subStep === 'customer-select' && customerType === 'partner') {
      setSubStep('partner-select');
    } else if (subStep === 'new-customer-form') {
      setSubStep('customer-select');
    } else {
      setSubStep('type-select');
      setCustomerType(null);
      setSelectedPartner(null);
    }
  }

  function validateForm(): boolean {
    const errors: Partial<Record<keyof NewCustomerForm, string>> = {};

    if (!formData.name.trim()) {
      errors.name = '顧客名は必須です';
    }

    if (customerType === 'individual') {
      if (!formData.phone.trim()) {
        errors.phone = '電話番号は必須です';
      }
      if (!formData.address.trim()) {
        errors.address = '住所は必須です';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const body: Record<string, string | undefined> = {
        name: formData.name.trim(),
        name_kana: formData.nameKana.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        email: formData.email.trim() || undefined,
      };

      if (customerType === 'partner' && selectedPartner) {
        body.partner_id = selectedPartner.id;
        body.partner_name = selectedPartner.name;
      }

      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '顧客の登録に失敗しました');
      }

      const data = await res.json();
      const newCustomer = data.customer || data;

      onUpdate({
        customerId: newCustomer.id,
        customerName: newCustomer.name,
        customerNameKana: newCustomer.name_kana,
        partnerId: selectedPartner?.id,
        partnerName: selectedPartner?.name,
      });
      onNext();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : '顧客の登録に失敗しました'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleFormChange(field: keyof NewCustomerForm, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 入力時にエラーをクリア
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  // --- 顧客区分選択 ---
  if (subStep === 'type-select') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-mincho text-sumi">顧客区分を選択</h3>

        {/* 既に顧客が選択済みの場合 */}
        {customerId && customerName && (
          <div className="card">
            <div className="card-body">
              <p className="text-xs text-ginnezumi mb-1">選択中の顧客</p>
              <p className="text-sm font-medium text-sumi">{customerName}</p>
              {customerNameKana && (
                <p className="text-xs text-ginnezumi">{customerNameKana}</p>
              )}
              {partnerName && (
                <p className="text-xs text-ginnezumi">取引先: {partnerName}</p>
              )}
              <button
                type="button"
                onClick={onNext}
                className="btn-primary w-full mt-3"
              >
                この顧客で続ける
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleTypeSelect('partner')}
            className="card card-interactive p-6 text-center"
          >
            <div className="text-2xl mb-2" aria-hidden="true">
              🏢
            </div>
            <p className="text-sm font-medium text-sumi">取引先経由</p>
            <p className="text-xs text-ginnezumi mt-1">
              取引先を選択して顧客を紐付け
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelect('individual')}
            className="card card-interactive p-6 text-center"
          >
            <div className="text-2xl mb-2" aria-hidden="true">
              👤
            </div>
            <p className="text-sm font-medium text-sumi">個人</p>
            <p className="text-xs text-ginnezumi mt-1">
              個人のお客様を直接選択
            </p>
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary flex-1"
          >
            戻る
          </button>
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="btn-outline flex-1"
            >
              あとで選択
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- 取引先選択 ---
  if (subStep === 'partner-select') {
    return (
      <PartnerSelector
        onSelect={handlePartnerSelect}
        onCancel={handleCancelSubStep}
      />
    );
  }

  // --- 新規顧客登録フォーム ---
  if (subStep === 'new-customer-form') {
    const isPartner = customerType === 'partner';
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-mincho text-sumi">新規顧客登録</h3>
          <button
            type="button"
            onClick={handleCancelSubStep}
            className="btn-ghost btn-sm"
          >
            戻る
          </button>
        </div>

        {isPartner && selectedPartner && (
          <p className="text-xs text-ginnezumi">
            取引先: {selectedPartner.name}
          </p>
        )}

        {submitError && (
          <div className="alert alert-danger">
            <p className="text-sm">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* 顧客名（必須） */}
          <div>
            <label className="form-label form-label-required">顧客名</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder="山田太郎"
              className={`form-input ${formErrors.name ? 'form-input-error' : ''}`}
            />
            {formErrors.name && (
              <p className="form-error">{formErrors.name}</p>
            )}
          </div>

          {/* フリガナ（任意） */}
          <div>
            <label className="form-label">フリガナ</label>
            <input
              type="text"
              value={formData.nameKana}
              onChange={(e) => handleFormChange('nameKana', e.target.value)}
              placeholder="ヤマダタロウ"
              className="form-input"
            />
          </div>

          {/* 電話番号（個人は必須） */}
          <div>
            <label className={`form-label ${!isPartner ? 'form-label-required' : ''}`}>
              電話番号
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleFormChange('phone', e.target.value)}
              placeholder="090-1234-5678"
              className={`form-input ${formErrors.phone ? 'form-input-error' : ''}`}
            />
            {formErrors.phone && (
              <p className="form-error">{formErrors.phone}</p>
            )}
          </div>

          {/* 住所（個人は必須） */}
          <div>
            <label className={`form-label ${!isPartner ? 'form-label-required' : ''}`}>
              住所
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleFormChange('address', e.target.value)}
              placeholder="東京都千代田区..."
              className={`form-input ${formErrors.address ? 'form-input-error' : ''}`}
            />
            {formErrors.address && (
              <p className="form-error">{formErrors.address}</p>
            )}
          </div>

          {/* メールアドレス（任意） */}
          <div>
            <label className="form-label">メールアドレス</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              placeholder="example@mail.com"
              className="form-input"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancelSubStep}
              className="btn-secondary flex-1"
              disabled={submitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={submitting}
            >
              {submitting ? '登録中...' : '登録'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- 顧客選択 ---
  return (
    <CustomerSelector
      partnerId={customerType === 'partner' ? selectedPartner?.id : undefined}
      partnerName={selectedPartner?.name}
      customerType={customerType || 'individual'}
      onSelect={handleCustomerSelect}
      onCreateNew={handleCreateNew}
      onCancel={handleCancelSubStep}
    />
  );
}
