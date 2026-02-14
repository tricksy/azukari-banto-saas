'use client';

import { useState, useEffect } from 'react';

interface AlertSummary {
  shipOverdue: number;
  returnOverdue: number;
  longStagnation: number;
  onHold: number;
  claimActive: number;
}

interface WorkflowStats {
  received: number;
  pendingShip: number;
  processing: number;
  returned: number;
  completed: number;
  paidStorage: number;
}

export default function AdminDashboardPage() {
  const [alerts, setAlerts] = useState<AlertSummary>({
    shipOverdue: 0,
    returnOverdue: 0,
    longStagnation: 0,
    onHold: 0,
    claimActive: 0,
  });
  const [workflow, setWorkflow] = useState<WorkflowStats>({
    received: 0,
    pendingShip: 0,
    processing: 0,
    returned: 0,
    completed: 0,
    paidStorage: 0,
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
      <div className="p-6 space-y-6">
        <div className="h-8 bg-shironeri animate-pulse w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-shironeri animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const alertCards = [
    { label: '発送予定超過', value: alerts.shipOverdue, color: 'text-kokiake', bg: 'bg-kokiake/10' },
    { label: '返送予定超過', value: alerts.returnOverdue, color: 'text-kokiake', bg: 'bg-kokiake/10' },
    { label: '長期滞留', value: alerts.longStagnation, color: 'text-oudo', bg: 'bg-oudo/10' },
    { label: '返送保留', value: alerts.onHold, color: 'text-oudo', bg: 'bg-oudo/10' },
    { label: 'クレーム対応中', value: alerts.claimActive, color: 'text-kokiake', bg: 'bg-kokiake/10' },
  ];

  const workflowCards = [
    { label: '受付済', value: workflow.received },
    { label: '発送待ち', value: workflow.pendingShip },
    { label: '加工中', value: workflow.processing },
    { label: '返却済', value: workflow.returned },
    { label: '完了', value: workflow.completed },
  ];

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-xl font-mincho text-sumi">ダッシュボード</h2>

      {/* アラート */}
      <section>
        <h3 className="text-sm font-bold text-aitetsu mb-3 border-l-4 border-kokiake pl-3">
          アラート
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {alertCards.map((card) => (
            <div key={card.label} className={`card ${card.bg}`}>
              <div className="card-body py-3">
                <p className="text-xs text-aitetsu">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ワークフロー */}
      <section>
        <h3 className="text-sm font-bold text-aitetsu mb-3 border-l-4 border-shu pl-3">
          ワークフロー状況
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {workflowCards.map((card) => (
            <div key={card.label} className="card">
              <div className="card-body py-3">
                <p className="text-xs text-aitetsu">{card.label}</p>
                <p className="text-2xl font-bold text-sumi">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 有料預かり */}
      <section>
        <h3 className="text-sm font-bold text-aitetsu mb-3 border-l-4 border-kin pl-3">
          有料預かり
        </h3>
        <div className="card">
          <div className="card-body py-3">
            <p className="text-xs text-aitetsu">有料預かり中</p>
            <p className="text-2xl font-bold text-sumi">{workflow.paidStorage}</p>
          </div>
        </div>
      </section>

      {/* 最近の操作ログ */}
      <section>
        <h3 className="text-sm font-bold text-aitetsu mb-3 border-l-4 border-aitetsu pl-3">
          最近の操作
        </h3>
        <div className="card">
          <div className="card-body text-center py-8 text-ginnezumi text-sm">
            操作ログは準備中です
          </div>
        </div>
      </section>
    </div>
  );
}
