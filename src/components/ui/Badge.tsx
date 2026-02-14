import { ReactNode } from 'react';
import type { ItemStatus } from '@/types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-shironeri text-sumi',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
};

/**
 * バッジコンポーネント
 */
export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span className={`badge ${variantStyles[variant]}`}>
      {children}
    </span>
  );
}

/**
 * ステータスに応じたバッジを返す
 */
export function StatusBadge({ status, isClaimActive }: { status: ItemStatus; isClaimActive?: boolean }) {
  const statusConfig: Record<ItemStatus, { label: string; variant: BadgeVariant }> = {
    draft: { label: '顧客未設定', variant: 'warning' },
    received: { label: '受付済', variant: 'info' },
    pending_ship: { label: '業者への発送待ち', variant: 'warning' },
    processing: { label: '加工中', variant: 'info' },
    returned: { label: '業者からの返却済', variant: 'success' },
    paid_storage: { label: '有料預かり', variant: 'warning' },
    completed: { label: '完了', variant: 'success' },
    rework: { label: '再加工', variant: 'warning' },
    on_hold: { label: '顧客への返送保留', variant: 'warning' },
    awaiting_customer: { label: '顧客確認待ち', variant: 'warning' },
    cancelled: { label: 'キャンセル', variant: 'default' },
    cancelled_completed: { label: 'キャンセル完了', variant: 'danger' },
  };

  const config = statusConfig[status];
  const claimActive = isClaimActive === true || String(isClaimActive).toLowerCase() === 'true';

  return (
    <span className="inline-flex items-center gap-1">
      <Badge variant={config.variant}>{config.label}</Badge>
      {claimActive && (
        <span className="badge bg-kokiake/20 text-kokiake border border-kokiake/30">
          クレーム対応中
        </span>
      )}
    </span>
  );
}
