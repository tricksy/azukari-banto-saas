'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { CARRIER_OPTIONS } from '@/types';
import type { CarrierType } from '@/types';
import { toast } from '@/components/ui/Toast';

interface VendorData {
  id: string;
  vendor_id: string;
  name: string;
  name_kana?: string;
  phone?: string;
  email?: string;
  postal_code?: string;
  address?: string;
  specialty?: string;
}

interface SelectedItem {
  item_number: string;
  product_name: string;
  status: string;
}

interface ShipToVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: SelectedItem[];
  onSuccess: () => void;
}

function formatToday(): string {
  const now = new Date();
  const jst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const y = jst.getFullYear();
  const m = String(jst.getMonth() + 1).padStart(2, '0');
  const d = String(jst.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function ShipToVendorModal({
  isOpen,
  onClose,
  selectedItems,
  onSuccess,
}: ShipToVendorModalProps) {
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [shipDate, setShipDate] = useState(formatToday());
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedVendor = vendors.find((v) => v.vendor_id === selectedVendorId);

  // 業者一覧を取得
  const fetchVendors = useCallback(async () => {
    setVendorsLoading(true);
    try {
      const res = await fetch('/api/vendors');
      if (!res.ok) throw new Error('業者一覧の取得に失敗しました');
      const data = await res.json();
      setVendors(data.vendors || []);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
      setError('業者一覧の取得に失敗しました');
    } finally {
      setVendorsLoading(false);
    }
  }, []);

  // モーダル開閉時のリセット
  useEffect(() => {
    if (isOpen) {
      fetchVendors();
      setSelectedVendorId('');
      setShipDate(formatToday());
      setTrackingNumber('');
      setCarrier('');
      setError('');
    }
  }, [isOpen, fetchVendors]);

  const handleSubmit = async () => {
    if (!selectedVendorId) {
      setError('業者を選択してください');
      return;
    }
    if (!shipDate) {
      setError('発送日を入力してください');
      return;
    }
    if (!selectedVendor) {
      setError('選択された業者が見つかりません');
      return;
    }

    setIsSubmitting(true);
    setError('');

    let successCount = 0;
    let failCount = 0;

    for (const item of selectedItems) {
      try {
        const body: Record<string, string> = {
          status: 'processing',
          vendor_id: selectedVendor.id,
          vendor_name: selectedVendor.name,
          ship_to_vendor_date: shipDate,
        };

        if (trackingNumber) {
          body.vendor_tracking_number = trackingNumber;
        }
        if (carrier) {
          body.vendor_carrier = carrier;
        }

        const res = await fetch(`/api/items/${encodeURIComponent(item.item_number)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          successCount++;
        } else {
          const data = await res.json();
          console.error(`Failed to update ${item.item_number}:`, data.error);
          failCount++;
        }
      } catch (err) {
        console.error(`Error updating ${item.item_number}:`, err);
        failCount++;
      }
    }

    setIsSubmitting(false);

    if (failCount === 0) {
      toast.success(`${successCount}件の商品を業者へ発送しました`);
      onClose();
      onSuccess();
    } else if (successCount > 0) {
      toast.warning(`${successCount}件成功、${failCount}件失敗しました`);
      onClose();
      onSuccess();
    } else {
      setError('発送処理に失敗しました。もう一度お試しください');
    }
  };

  const vendorOptions = vendors.map((v) => ({
    value: v.vendor_id,
    label: v.specialty ? `${v.name}（${v.specialty}）` : v.name,
  }));

  const carrierOptions = CARRIER_OPTIONS.map((c) => ({
    value: c.value,
    label: c.label,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="業者へ発送" size="lg">
      <div className="space-y-4">
        {/* エラー表示 */}
        {error && (
          <div className="p-3 bg-kokiake/10 border border-kokiake/30 text-kokiake text-sm">
            {error}
          </div>
        )}

        {/* 選択商品サマリー */}
        <div className="p-3 bg-shironeri">
          <p className="text-sm text-aitetsu mb-1">
            選択中の商品: <span className="font-bold text-sumi">{selectedItems.length}件</span>
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedItems.map((item) => (
              <span
                key={item.item_number}
                className="inline-block text-xs bg-kinari px-2 py-0.5 text-ginnezumi font-mono"
              >
                {item.item_number}
              </span>
            ))}
          </div>
        </div>

        {/* 業者選択 */}
        <Select
          label="業者"
          options={vendorOptions}
          placeholder={vendorsLoading ? '読み込み中...' : '業者を選択'}
          value={selectedVendorId}
          onChange={(e) => setSelectedVendorId(e.target.value)}
          disabled={vendorsLoading}
          required
        />

        {/* 選択した業者の情報表示 */}
        {selectedVendor && (
          <div className="p-3 bg-kinari/50 border border-usuzumi/20 text-sm space-y-1">
            <p className="font-medium text-sumi">{selectedVendor.name}</p>
            {selectedVendor.address ? (
              <p className="text-aitetsu">
                {selectedVendor.postal_code && `〒${selectedVendor.postal_code} `}
                {selectedVendor.address}
              </p>
            ) : (
              <p className="text-oudo">住所が未登録です</p>
            )}
            {selectedVendor.phone && (
              <p className="text-aitetsu">TEL: {selectedVendor.phone}</p>
            )}
          </div>
        )}

        {/* 発送日 */}
        <Input
          label="発送日"
          type="date"
          value={shipDate}
          onChange={(e) => setShipDate(e.target.value)}
          required
        />

        {/* 送り状番号 */}
        <Input
          label="送り状番号（任意）"
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="例: 1234-5678-9012"
        />

        {/* 配送業者 */}
        <Select
          label="配送業者（任意）"
          options={carrierOptions}
          placeholder="選択してください"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value as CarrierType | '')}
        />

        {/* アクションボタン */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={isSubmitting || !selectedVendorId || !shipDate}
          >
            {isSubmitting ? '処理中...' : `${selectedItems.length}件を発送`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
