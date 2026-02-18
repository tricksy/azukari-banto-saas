'use client';

import { useState, useEffect } from 'react';

interface TenantOption {
  id: string;
  slug: string;
  name: string;
}

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

interface LogRow {
  id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  worker_name: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTenant, setSelectedTenant] = useState('');
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
  const [recentLogs, setRecentLogs] = useState<LogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // テナント一覧取得
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await fetch('/api/admin/tenants');
        if (!res.ok) return;
        const data = await res.json();
        setTenants(
          (data.tenants || []).map((t: TenantOption) => ({
            id: t.id,
            slug: t.slug,
            name: t.name,
          }))
        );
      } catch (error) {
        console.error('テナント一覧の取得に失敗:', error);
      }
    };
    fetchTenants();
  }, []);

  // ダッシュボードデータ取得
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedTenant) params.set('tenant_id', selectedTenant);
        const res = await fetch(`/api/admin/dashboard?${params.toString()}`);
        if (!res.ok) throw new Error('データ取得失敗');
        const data = await res.json();
        setAlerts(data.alerts);
        setWorkflow(data.workflow);
        setRecentLogs(data.recentLogs || []);
      } catch (error) {
        console.error('ダッシュボードデータの取得に失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedTenant]);

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-mincho text-sumi">ダッシュボード</h2>
        <select
          className="input text-sm w-48"
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
        >
          <option value="">全テナント</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}（{t.slug}）
            </option>
          ))}
        </select>
      </div>

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
          <div className="card-body">
            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-ginnezumi text-sm">
                操作ログはありません
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-shironeri">
                      <th className="px-3 py-2 text-left text-aitetsu font-normal">日時</th>
                      <th className="px-3 py-2 text-left text-aitetsu font-normal">テナント</th>
                      <th className="px-3 py-2 text-left text-aitetsu font-normal">担当者</th>
                      <th className="px-3 py-2 text-left text-aitetsu font-normal">操作</th>
                      <th className="px-3 py-2 text-left text-aitetsu font-normal">対象</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="border-b border-shironeri last:border-b-0">
                        <td className="px-3 py-2 text-ginnezumi whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="px-3 py-2 text-sumi whitespace-nowrap">
                          {log.tenant_name}
                        </td>
                        <td className="px-3 py-2 text-sumi whitespace-nowrap">
                          {log.worker_name || '-'}
                        </td>
                        <td className="px-3 py-2 text-sumi">
                          {log.action}
                        </td>
                        <td className="px-3 py-2 text-ginnezumi">
                          <span className="text-xs">{log.target_type}</span>
                          {log.target_id && (
                            <span className="ml-1 text-xs text-aitetsu">{log.target_id}</span>
                          )}
                          {log.details && (
                            <span className="ml-1 text-xs text-ginnezumi">({log.details})</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
