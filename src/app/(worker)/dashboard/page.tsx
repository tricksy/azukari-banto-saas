'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  received: number;
  pendingShip: number;
  processing: number;
  returned: number;
  paidStorage: number;
  claimActive: number;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Supabase APIからデータ取得
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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
    <div className="p-4 space-y-6">
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
