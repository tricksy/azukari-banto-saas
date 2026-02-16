'use client';

import { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Pagination, usePagination } from '@/components/ui/Pagination';

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
  const [settingsTenant, setSettingsTenant] = useState<Tenant | null>(null);
  const [tenantSettings, setTenantSettings] = useState({
    resendApiKey: '',
    emailFrom: '',
    alertEmailEnabled: false,
    alertEmail: '',
  });
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

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

  const { paginatedItems: paginatedTenants, ...pagination } = usePagination(tenants);

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

  const handleSettingsOpen = async (tenant: Tenant) => {
    setSettingsTenant(tenant);
    setIsSettingsLoading(true);
    setSettingsMessage(null);
    setShowApiKey(false);
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}/settings`);
      if (!res.ok) throw new Error('取得失敗');
      const data = await res.json();
      const s = data.settings || {};
      setTenantSettings({
        resendApiKey: s.resendApiKey || '',
        emailFrom: s.emailFrom || '',
        alertEmailEnabled: s.alertEmailEnabled === 'true',
        alertEmail: s.alertEmail || '',
      });
    } catch {
      setSettingsMessage({ type: 'error', text: '設定の取得に失敗しました' });
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const handleSettingsSave = async () => {
    if (!settingsTenant) return;
    setIsSettingsSaving(true);
    setSettingsMessage(null);
    try {
      const res = await fetch(`/api/admin/tenants/${settingsTenant.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            resendApiKey: tenantSettings.resendApiKey,
            emailFrom: tenantSettings.emailFrom,
            alertEmailEnabled: String(tenantSettings.alertEmailEnabled),
            alertEmail: tenantSettings.alertEmail,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存失敗');
      }
      setSettingsMessage({ type: 'success', text: '設定を保存しました' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存に失敗しました';
      setSettingsMessage({ type: 'error', text: msg });
    } finally {
      setIsSettingsSaving(false);
    }
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
                  {paginatedTenants.map((tenant) => (
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
                          <button
                            className="btn-secondary text-xs"
                            onClick={() => handleSettingsOpen(tenant)}
                          >
                            設定
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
              <Pagination {...pagination} onPageChange={pagination.setCurrentPage} />
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
      <Modal
        isOpen={settingsTenant !== null}
        onClose={() => setSettingsTenant(null)}
        title={`メール設定 — ${settingsTenant?.name || ''}`}
      >
        {settingsTenant && (
          <div className="space-y-4">
            {settingsMessage && (
              <div className={`p-3 text-sm ${settingsMessage.type === 'success' ? 'bg-oitake/10 text-oitake' : 'bg-kokiake/10 text-kokiake'}`}>
                {settingsMessage.text}
              </div>
            )}
            {isSettingsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-shironeri animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <>
                <p className="text-xs text-ginnezumi">
                  Resend（resend.com）のAPIキーを設定すると、このテナントのアラートメールが有効になります。
                  無料枠（月3,000通）で運用できます。
                </p>
                <div>
                  <label className="text-xs text-aitetsu block mb-1">Resend APIキー</label>
                  <div className="flex gap-2">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={tenantSettings.resendApiKey}
                      onChange={(e) => setTenantSettings({ ...tenantSettings, resendApiKey: e.target.value })}
                      className="form-input flex-1"
                      placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="btn-ghost btn-sm whitespace-nowrap"
                    >
                      {showApiKey ? '隠す' : '表示'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-aitetsu block mb-1">送信元メールアドレス</label>
                  <input
                    type="email"
                    value={tenantSettings.emailFrom}
                    onChange={(e) => setTenantSettings({ ...tenantSettings, emailFrom: e.target.value })}
                    className="form-input w-full"
                    placeholder="noreply@your-domain.com"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-aitetsu">アラートメール送信</label>
                  <button
                    type="button"
                    onClick={() => setTenantSettings({ ...tenantSettings, alertEmailEnabled: !tenantSettings.alertEmailEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center transition-colors ${
                      tenantSettings.alertEmailEnabled ? 'bg-oitake' : 'bg-usuzumi/30'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 bg-white transition-transform ${
                        tenantSettings.alertEmailEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div>
                  <label className="text-xs text-aitetsu block mb-1">通知先メールアドレス</label>
                  <input
                    type="email"
                    value={tenantSettings.alertEmail}
                    onChange={(e) => setTenantSettings({ ...tenantSettings, alertEmail: e.target.value })}
                    className="form-input w-full"
                    placeholder="alert@example.com"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    className="btn-secondary"
                    onClick={() => setSettingsTenant(null)}
                    disabled={isSettingsSaving}
                  >
                    閉じる
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleSettingsSave}
                    disabled={isSettingsSaving}
                  >
                    {isSettingsSaving ? '保存中...' : '保存'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
