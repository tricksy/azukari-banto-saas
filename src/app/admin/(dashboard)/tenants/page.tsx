'use client';

import { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from '@/components/ui/Modal';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  plan: 'free' | 'standard' | 'premium';
  status: 'active' | 'suspended' | 'cancelled';
  redirect_url: string | null;
  created_at: string;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newPlan, setNewPlan] = useState<'free' | 'standard' | 'premium'>('free');
  const [createError, setCreateError] = useState('');
  const [statusTarget, setStatusTarget] = useState<Tenant | null>(null);
  const [isStatusChanging, setIsStatusChanging] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/tenants');
        if (!res.ok) throw new Error('Failed to fetch tenants');
        const data = await res.json();
        setTenants(data.tenants);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setEditUrl(tenant.redirect_url || '');
  };

  const handleCloseModal = () => {
    setEditingTenant(null);
    setEditUrl('');
  };

  const handleSave = async () => {
    if (!editingTenant) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTenant.id,
          redirect_url: editUrl || null,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || '保存に失敗しました');
      }
      setTenants((prev) =>
        prev.map((t) =>
          t.id === editingTenant.id
            ? { ...t, redirect_url: editUrl || null }
            : t
        )
      );
      handleCloseModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateOpen = () => {
    setIsCreateOpen(true);
    setNewName('');
    setNewSlug('');
    setNewPlan('free');
    setCreateError('');
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) {
      setCreateError('店舗名とテナントIDは必須です');
      return;
    }
    setIsSaving(true);
    setCreateError('');
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim(), plan: newPlan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || '作成に失敗しました');
        return;
      }
      setTenants((prev) => [...prev, data.tenant]);
      setIsCreateOpen(false);
    } catch {
      setCreateError('通信エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: Tenant['status']) => {
    const styles: Record<Tenant['status'], string> = {
      active: 'bg-green-100 text-green-700',
      suspended: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-gray-100 text-gray-500',
    };
    const labels: Record<Tenant['status'], string> = {
      active: '有効',
      suspended: '停止中',
      cancelled: '解約済',
    };
    return (
      <span
        className={`inline-block px-2 py-0.5 text-xs rounded-full ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const handleStatusToggle = async () => {
    if (!statusTarget) return;
    const newStatus = statusTarget.status === 'active' ? 'suspended' : 'active';
    setIsStatusChanging(true);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: statusTarget.id, status: newStatus }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'ステータスの変更に失敗しました');
      }
      setTenants((prev) =>
        prev.map((t) =>
          t.id === statusTarget.id ? { ...t, status: newStatus } : t
        )
      );
      setStatusTarget(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'ステータスの変更に失敗しました');
    } finally {
      setIsStatusChanging(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-mincho text-sumi">テナント管理</h2>
        <button className="btn-primary text-sm" onClick={handleCreateOpen}>
          + 新規テナント
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-12 bg-shironeri animate-pulse rounded" />
              <div className="h-12 bg-shironeri animate-pulse rounded" />
              <div className="h-12 bg-shironeri animate-pulse rounded" />
            </div>
          ) : tenants.length === 0 ? (
            <p className="text-center text-ginnezumi py-8">
              テナントが登録されていません
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-shironeri">
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">
                      テナントID
                    </th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">
                      店舗名
                    </th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">
                      プラン
                    </th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">
                      ステータス
                    </th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">
                      分離状態
                    </th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="border-b border-shironeri last:border-b-0"
                    >
                      <td className="px-4 py-3 text-sumi">
                        {tenant.id.slice(0, 4).toUpperCase()} ({tenant.slug})
                      </td>
                      <td className="px-4 py-3 text-sumi">{tenant.name}</td>
                      <td className="px-4 py-3 text-sumi">{tenant.plan}</td>
                      <td className="px-4 py-3">
                        {getStatusBadge(tenant.status)}
                      </td>
                      <td className="px-4 py-3">
                        {tenant.redirect_url === null ? (
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                            SaaS
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                              分離済み
                            </span>
                            <span
                              className="text-xs text-ginnezumi truncate max-w-[160px]"
                              title={tenant.redirect_url}
                            >
                              {tenant.redirect_url}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            className="btn-secondary text-xs"
                            onClick={() => handleEdit(tenant)}
                          >
                            編集
                          </button>
                          {tenant.status !== 'cancelled' && (
                            <button
                              className={`text-xs px-3 py-1.5 rounded ${
                                tenant.status === 'active'
                                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                              onClick={() => setStatusTarget(tenant)}
                            >
                              {tenant.status === 'active' ? '停止' : '有効化'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={editingTenant !== null}
        onClose={handleCloseModal}
        title="テナント分離設定"
      >
        {editingTenant && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-aitetsu mb-1">
                テナントID
              </label>
              <p className="text-sumi">
                {editingTenant.id.slice(0, 4).toUpperCase()} (
                {editingTenant.slug})
              </p>
            </div>
            <div>
              <label className="block text-sm text-aitetsu mb-1">店舗名</label>
              <p className="text-sumi">{editingTenant.name}</p>
            </div>
            <div>
              <label className="block text-sm text-aitetsu mb-1">
                分離先URL
              </label>
              <input
                type="text"
                className="input w-full"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://example.com"
              />
              {editUrl && (
                <button
                  type="button"
                  className="mt-1 text-xs text-blue-600 hover:underline"
                  onClick={() => setEditUrl('')}
                >
                  URLをクリア（SaaSに戻す）
                </button>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                className="btn-secondary"
                onClick={handleCloseModal}
                disabled={isSaving}
              >
                キャンセル
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="新規テナント作成"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-aitetsu mb-1">店舗名 *</label>
            <input
              type="text"
              className="input w-full"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例: 京都きもの屋"
            />
          </div>
          <div>
            <label className="block text-sm text-aitetsu mb-1">テナントID *</label>
            <input
              type="text"
              className="input w-full font-mono tracking-widest"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 4))}
              placeholder="例: A3F0"
              maxLength={4}
            />
            <p className="text-xs text-ginnezumi mt-1">4桁の16進数（0-9, A-F）</p>
          </div>
          <div>
            <label className="block text-sm text-aitetsu mb-1">プラン</label>
            <select
              className="input w-full"
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value as 'free' | 'standard' | 'premium')}
            >
              <option value="free">free</option>
              <option value="standard">standard</option>
              <option value="premium">premium</option>
            </select>
          </div>
          {createError && (
            <p className="text-kokiake text-sm">{createError}</p>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button
              className="btn-secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSaving}
            >
              キャンセル
            </button>
            <button
              className="btn-primary"
              onClick={handleCreate}
              disabled={isSaving || newSlug.length !== 4 || !newName.trim()}
            >
              {isSaving ? '作成中...' : '作成'}
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmModal
        isOpen={statusTarget !== null}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusToggle}
        title={statusTarget?.status === 'active' ? 'テナント停止' : 'テナント有効化'}
        message={
          statusTarget?.status === 'active'
            ? `「${statusTarget.name}」を停止しますか？担当者がログインできなくなります。`
            : `「${statusTarget?.name}」を有効化しますか？担当者がログインできるようになります。`
        }
        confirmText={statusTarget?.status === 'active' ? '停止する' : '有効化する'}
        variant={statusTarget?.status === 'active' ? 'warning' : 'default'}
        isLoading={isStatusChanging}
      />
    </div>
  );
}
