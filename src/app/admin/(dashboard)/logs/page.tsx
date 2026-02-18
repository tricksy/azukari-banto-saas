'use client';

import { useState, useEffect } from 'react';
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';
import { Pagination, usePagination } from '@/components/ui/Pagination';

type Tab = 'operations' | 'auth';

interface LogRow {
  id: string;
  tenant_id: string;
  worker_id: string | null;
  worker_name: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: string | null;
  created_at: string;
  tenant_name: string;
  tenant_slug: string;
}

interface TenantOption {
  id: string;
  slug: string;
  name: string;
}

const targetTypeLabels: Record<string, string> = {
  item: '商品',
  reception: '受付',
  customer: '顧客',
  partner: '取引先',
  vendor: '業者',
  worker: '担当者',
  auth: '認証',
  system: 'システム',
  email: 'メール',
};

export default function AdminLogsPage() {
  const [activeTab, setActiveTab] = usePersistedState<Tab>(
    STORAGE_KEYS.ADMIN_LOGS_TAB,
    'operations'
  );
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTenant, setFilterTenant] = useState('');
  const [filterTargetType, setFilterTargetType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // テナント一覧を初回のみ取得
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await fetch('/api/admin/tenants');
        if (res.ok) {
          const data = await res.json();
          setTenants(
            data.tenants.map((t: TenantOption & Record<string, unknown>) => ({
              id: t.id,
              slug: t.slug,
              name: t.name,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
      }
    };
    fetchTenants();
  }, []);

  // ログ取得（フィルタ変更時に再取得）
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ tab: activeTab });
        if (filterTenant) params.set('tenant_id', filterTenant);
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);
        if (activeTab === 'operations' && filterTargetType !== 'all') {
          params.set('target_type', filterTargetType);
        }

        const res = await fetch(`/api/admin/logs?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs);
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [activeTab, filterTenant, dateFrom, dateTo, filterTargetType]);

  const { paginatedItems: paginatedLogs, resetPage, ...pagination } =
    usePagination(logs);

  useEffect(() => {
    resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filterTenant, dateFrom, dateTo, filterTargetType]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabs = [
    { key: 'operations' as Tab, label: '操作ログ' },
    { key: 'auth' as Tab, label: 'ログイン履歴' },
  ];

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-mincho text-sumi">操作ログ</h2>

      {/* フィルター */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-aitetsu block mb-1">テナント</label>
          <select
            className="form-input form-input-sm w-48"
            value={filterTenant}
            onChange={(e) => setFilterTenant(e.target.value)}
          >
            <option value="">全テナント</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}（{t.slug}）
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-aitetsu block mb-1">開始日</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="form-input form-input-sm"
          />
        </div>
        <div>
          <label className="text-xs text-aitetsu block mb-1">終了日</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="form-input form-input-sm"
          />
        </div>
        {activeTab === 'operations' && (
          <div>
            <label className="text-xs text-aitetsu block mb-1">対象種別</label>
            <select
              className="form-input form-input-sm w-40"
              value={filterTargetType}
              onChange={(e) => setFilterTargetType(e.target.value)}
            >
              <option value="all">すべて</option>
              <option value="item">商品</option>
              <option value="reception">受付</option>
              <option value="customer">顧客</option>
              <option value="partner">取引先</option>
              <option value="vendor">業者</option>
              <option value="worker">担当者</option>
              <option value="system">システム</option>
            </select>
          </div>
        )}
      </div>

      {/* タブ */}
      <div className="flex border-b border-usuzumi/20">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-shu text-shu'
                : 'border-transparent text-ginnezumi hover:text-aitetsu'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-shironeri animate-pulse rounded" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-ginnezumi text-sm">
              ログがありません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-shironeri">
                    <th className="px-4 py-3 text-left text-aitetsu font-normal whitespace-nowrap">日時</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal whitespace-nowrap">テナント</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal whitespace-nowrap">担当者</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal whitespace-nowrap">操作</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal whitespace-nowrap">対象種別</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal whitespace-nowrap">対象ID</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">詳細</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-shironeri last:border-b-0"
                    >
                      <td className="px-4 py-3 text-sumi text-xs whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sumi whitespace-nowrap">
                        {log.tenant_name}
                      </td>
                      <td className="px-4 py-3 text-sumi whitespace-nowrap">
                        {log.worker_name || log.worker_id || '—'}
                      </td>
                      <td className="px-4 py-3 text-sumi">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-sumi whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                          {targetTypeLabels[log.target_type] || log.target_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sumi font-mono text-xs">
                        {log.target_id || '—'}
                      </td>
                      <td className="px-4 py-3 text-sumi text-xs max-w-xs truncate">
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination {...pagination} onPageChange={pagination.setCurrentPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
