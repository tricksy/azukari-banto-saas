'use client';

import type { ItemStatus } from '@/types';
import { ProductTypeLabel } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';

interface ItemCardProps {
  item: {
    item_number: string;
    reception_number?: string;
    customer_name?: string;
    customer_name_kana?: string;
    partner_name?: string;
    product_type: string;
    product_name: string;
    status: ItemStatus;
    is_claim_active?: boolean;
    photo_front_url?: string;
    created_at: string;
    scheduled_ship_date?: string;
    scheduled_return_date?: string;
  };
  onClick?: () => void;
}

const statusBorderColor: Record<string, string> = {
  draft: 'border-l-oudo',
  received: 'border-l-aitetsu',
  pending_ship: 'border-l-oudo',
  processing: 'border-l-shu',
  returned: 'border-l-oitake',
  paid_storage: 'border-l-kin',
  completed: 'border-l-oitake',
  rework: 'border-l-shu',
  on_hold: 'border-l-oudo',
  awaiting_customer: 'border-l-oudo',
  cancelled: 'border-l-ginnezumi',
  cancelled_completed: 'border-l-ginnezumi',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'short',
    day: 'numeric',
  });
}

function shortenItemNumber(itemNumber: string): string {
  // 短縮表示: {担当者ID}-{末尾9文字}
  const parts = itemNumber.split('-');
  if (parts.length >= 3) {
    const suffix = itemNumber.slice(-12);
    return `${parts[0]}-${suffix}`;
  }
  return itemNumber;
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const borderColor = statusBorderColor[item.status] || 'border-l-ginnezumi';

  return (
    <div
      className={`card border-l-4 ${borderColor} ${onClick ? 'cursor-pointer hover:bg-kinari/50 transition-colors' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className="card-body py-3 px-3">
        <div className="flex gap-3">
          {/* 写真サムネイル */}
          <div className="flex-shrink-0 w-12 h-12 bg-shironeri flex items-center justify-center overflow-hidden">
            {item.photo_front_url ? (
              <img
                src={item.photo_front_url}
                alt={item.product_name}
                className="w-12 h-12 object-cover"
              />
            ) : (
              <svg className="w-6 h-6 text-ginnezumi" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          {/* 情報 */}
          <div className="flex-1 min-w-0">
            {/* 上段: 預かり番号 + ステータス */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-mono text-xs text-ginnezumi truncate">
                {shortenItemNumber(item.item_number)}
              </span>
              <StatusBadge status={item.status} isClaimActive={item.is_claim_active} />
            </div>

            {/* 中段: 商品名 + 種別 */}
            <div className="mb-1">
              <span className="text-sm font-medium text-sumi truncate block">
                {item.product_name}
              </span>
              <span className="text-xs text-aitetsu">
                {ProductTypeLabel[item.product_type] || item.product_type}
              </span>
            </div>

            {/* 下段: 顧客名/取引先名 + 日付 */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-ginnezumi truncate">
                {item.customer_name || item.partner_name || '顧客未設定'}
              </span>
              <span className="text-xs text-ginnezumi flex-shrink-0">
                {item.scheduled_return_date
                  ? `返送予定 ${formatDate(item.scheduled_return_date)}`
                  : item.scheduled_ship_date
                    ? `発送予定 ${formatDate(item.scheduled_ship_date)}`
                    : formatDate(item.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
