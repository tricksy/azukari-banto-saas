'use client';

import { useState, useEffect } from 'react';
import { Pagination, usePagination } from '@/components/ui/Pagination';

interface EmailLogRow {
  id: string;
  tenant_id: string;
  email_type: string;
  to_address: string;
  subject: string;
  body: string | null;
  status: string;
  error_message: string | null;
  sent_at: string;
  created_at: string;
  tenant_name: string;
  tenant_slug: string;
}

interface TenantOption {
  id: string;
  slug: string;
  name: string;
}

const emailTypeLabels: Record<string, string> = {
  alert: 'アラート',
  paid_storage: '有料預かり',
  claim: 'クレーム',
  custom: 'カスタム',
};

const statusLabels: Record<string, { label: string; className: string }> = {
  sent: { label: '送信済', className: 'bg-green-100 text-green-700' },
  failed: { label: '失敗', className: 'bg-red-100 text-red-700' },
  bounced: { label: 'バウンス', className: 'bg-yellow-100 text-yellow-700' },
};

export default function AdminEmailLogsPage() {
  const [logs, setLogs] = useState<EmailLogRow[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTenant, setFilterTenant] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

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

  // メールログ取得（フィルタ変更時に再取得）
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterTenant) params.set('tenant_id', filterTenant);
        if (typeFilter !== 'all') params.set('email_type', typeFilter);

        const res = await fetch(`/api/admin/email-logs?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs);
        }
      } catch (error) {
        console.error('Failed to fetch email logs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [filterTenant, typeFilter]);

  const { paginatedItems: paginatedLogs, resetPage, ...pagination } =
    usePagination(logs);

  useEffect(() => {
    resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTenant, typeFilter]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-mincho text-sumi">メール送信履歴</h2>

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
          <label className="text-xs text-aitetsu block mb-1">種別</label>
          <select
            className="form-input form-input-sm w-40"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">すべて</option>
            <option value="alert">アラート</option>
            <option value="paid_storage">有料預かり</option>
            <option value="claim">クレーム</option>
            <option value="custom">カスタム</option>
          </select>
        </div>
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
              メール送信履歴はありません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-shironeri">
                    <th className="px-4 py-3 text-left text-aitetsu font-normal whitespace-nowrap">送信日時</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal whitespace-nowrap">テナント</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal whitespace-nowrap">種別</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal whitespace-nowrap">宛先</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">件名</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal whitespace-nowrap">ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log) => {
                    const statusInfo = statusLabels[log.status] || {
                      label: log.status,
                      className: 'bg-gray-100 text-gray-700',
                    };
                    return (
                      <tr
                        key={log.id}
                        className="border-b border-shironeri last:border-b-0"
                      >
                        <td className="px-4 py-3 text-sumi text-xs whitespace-nowrap">
                          {formatDate(log.sent_at)}
                        </td>
                        <td className="px-4 py-3 text-sumi whitespace-nowrap">
                          {log.tenant_name}
                        </td>
                        <td className="px-4 py-3 text-sumi whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                            {emailTypeLabels[log.email_type] || log.email_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sumi text-xs">
                          {log.to_address}
                        </td>
                        <td className="px-4 py-3 text-sumi text-xs max-w-xs truncate">
                          {log.subject}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs rounded-full ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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
