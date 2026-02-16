'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { ItemStatus } from '@/types';
import { ItemCard } from '@/components/worker/ItemCard';
import { ItemDetailModal } from '@/components/worker/ItemDetailModal';

interface Stats {
  received: number;
  pendingShip: number;
  processing: number;
  returned: number;
  paidStorage: number;
  claimActive: number;
}

interface DraftItem {
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
}

export default function WorkerDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    received: 0,
    pendingShip: 0,
    processing: 0,
    returned: 0,
    paidStorage: 0,
    claimActive: 0,
  });
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemNumber, setSelectedItemNumber] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const statuses: ItemStatus[] = ['received', 'pending_ship', 'processing', 'returned', 'paid_storage'];

      const [statusResults, draftResult] = await Promise.all([
        Promise.all(
          statuses.map((s) =>
            fetch(`/api/items?status=${s}&limit=1`)
              .then((r) => r.json())
              .then((data) => ({ status: s, total: data.total ?? 0 }))
              .catch(() => ({ status: s, total: 0 }))
          )
        ),
        fetch('/api/items?status=draft&limit=20')
          .then((r) => r.json())
          .catch(() => ({ items: [], total: 0 })),
      ]);

      const statsMap: Record<string, number> = {};
      for (const r of statusResults) {
        statsMap[r.status] = r.total;
      }

      setStats({
        received: statsMap['received'] || 0,
        pendingShip: statsMap['pending_ship'] || 0,
        processing: statsMap['processing'] || 0,
        returned: statsMap['returned'] || 0,
        paidStorage: statsMap['paid_storage'] || 0,
        claimActive: 0,
      });

      setDraftItems(draftResult.items || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-8 bg-shironeri animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-shironeri animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: '受付済', value: stats.received, color: 'border-l-aitetsu' },
    { label: '発送待ち', value: stats.pendingShip, color: 'border-l-oudo' },
    { label: '加工中', value: stats.processing, color: 'border-l-shu' },
    { label: '返却済', value: stats.returned, color: 'border-l-oitake' },
    { label: '有料預かり', value: stats.paidStorage, color: 'border-l-kin' },
    { label: 'クレーム', value: stats.claimActive, color: 'border-l-kokiake' },
  ];

  return (
    <div className="p-4 space-y-6 pb-24">
      <h2 className="text-xl font-mincho text-sumi">ダッシュボード</h2>

      {/* ステータス概要 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`card border-l-4 ${card.color}`}
          >
            <div className="card-body py-3">
              <p className="text-xs text-aitetsu">{card.label}</p>
              <p className="text-2xl font-bold text-sumi">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 顧客未設定の商品 */}
      {draftItems.length > 0 && (
        <div>
          <h3 className="text-sm font-mincho text-sumi mb-3">
            顧客未設定の商品
            <span className="ml-2 text-xs text-ginnezumi font-sans">
              {draftItems.length}件
            </span>
          </h3>
          <div className="space-y-2">
            {draftItems.map((item) => (
              <ItemCard
                key={item.item_number}
                item={item}
                onClick={() => setSelectedItemNumber(item.item_number)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 商品詳細モーダル */}
      <ItemDetailModal
        itemNumber={selectedItemNumber}
        onClose={() => setSelectedItemNumber(null)}
      />

      {/* クイックアクション */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-usuzumi/20 p-3 z-40">
        <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto">
          <Link href="/reception" className="btn-primary text-center text-xs py-2">
            受付
          </Link>
          <Link href="/orders" className="btn-secondary text-center text-xs py-2">
            発注
          </Link>
          <Link href="/returns" className="btn-secondary text-center text-xs py-2">
            返却
          </Link>
          <Link href="/shipping" className="btn-secondary text-center text-xs py-2">
            返送
          </Link>
        </div>
      </div>
    </div>
  );
}
