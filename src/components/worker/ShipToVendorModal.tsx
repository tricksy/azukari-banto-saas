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
  activeTab?: 'pending_ship' | 'rework';
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
  activeTab = 'pending_ship',
}: ShipToVendorModalProps) {
  const isRework = activeTab === 'rework';
  const modalTitle = isRework ? '再発送登録' : '発送登録';
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
      toast.success(`${successCount}件の商品を${isRework ? '再発送' : '発送'}登録しました`);
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
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <div className="space-y-4">
        {/* エラー表示 */}
        {error && (
          <div className="p-3 bg-kokiake/10 border border-kokiake/30 text-kokiake text-sm">
            {error}
          </div>
        )}

        {/* 説明文 */}
        <p className="text-sm text-ginnezumi">
          {selectedItems.length}件の商品を{isRework ? '再発送' : '発送'}登録します
        </p>
        {isRework && (
          <p className="text-sm text-kokiake">※ 再加工のため業者へ再発送します</p>
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
          label="発注先業者"
          options={vendorOptions}
          placeholder={vendorsLoading ? '読み込み中...' : '選択してください'}
          value={selectedVendorId}
          onChange={(e) => setSelectedVendorId(e.target.value)}
          disabled={vendorsLoading}
          required
        />

        {/* 選択した業者の発送先情報 */}
        {selectedVendor && (
          <div className="bg-shironeri p-3 text-sm">
            <p className="font-medium text-sumi mb-1">発送先</p>
            <p className="text-aitetsu">{selectedVendor.name}</p>
            {selectedVendor.postal_code && (
              <p className="text-ginnezumi">〒{selectedVendor.postal_code}</p>
            )}
            {selectedVendor.address && (
              <p className="text-ginnezumi">{selectedVendor.address}</p>
            )}
            {selectedVendor.phone && (
              <p className="text-ginnezumi">TEL: {selectedVendor.phone}</p>
            )}
            {!selectedVendor.address && (
              <p className="text-kokiake text-xs mt-1">
                ※ 住所が未登録です。管理画面から登録してください。
              </p>
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

        {/* 送り状情報（任意） */}
        <div className="border-t border-usuzumi/20 pt-4 mt-4">
          <p className="text-sm text-ginnezumi mb-3">送り状情報（任意）</p>
          <div className="space-y-4">
            <Input
              label="送り状番号"
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="例: 1234-5678-9012"
            />

            <Select
              label="配送業者"
              options={carrierOptions}
              placeholder="選択してください"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value as CarrierType | '')}
            />
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="btn-outline"
            disabled={isSubmitting}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={isSubmitting || !selectedVendorId || !shipDate}
          >
            {isSubmitting ? '処理中...' : modalTitle}
          </button>
        </div>
      </div>
    </Modal>
  );
}
