'use client';

import { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Pagination, usePagination } from '@/components/ui/Pagination';

interface WorkerRow {
  id: string;
  tenant_id: string;
  worker_id: string;
  name: string;
  email: string | null;
  is_active: boolean;
  last_login_at: string | null;
  tenant_name: string;
  tenant_slug: string;
  created_at: string;
}

interface TenantOption {
  id: string;
  slug: string;
  name: string;
}

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTenant, setFilterTenant] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 新規作成
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTenantId, setNewTenantId] = useState('');
  const [newWorkerId, setNewWorkerId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [createError, setCreateError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 編集
  const [editTarget, setEditTarget] = useState<WorkerRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editError, setEditError] = useState('');

  // PIN再設定
  const [pinTarget, setPinTarget] = useState<WorkerRow | null>(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [pinError, setPinError] = useState('');

  // 有効/無効切替
  const [statusTarget, setStatusTarget] = useState<WorkerRow | null>(null);
  const [isStatusChanging, setIsStatusChanging] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workersRes, tenantsRes] = await Promise.all([
          fetch('/api/admin/workers'),
          fetch('/api/admin/tenants'),
        ]);
        if (workersRes.ok) {
          const wd = await workersRes.json();
          setWorkers(wd.workers);
        }
        if (tenantsRes.ok) {
          const td = await tenantsRes.json();
          setTenants(td.tenants.map((t: TenantOption & Record<string, unknown>) => ({ id: t.id, slug: t.slug, name: t.name })));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredWorkers = workers.filter((w) => {
    if (filterTenant && w.tenant_id !== filterTenant) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return w.name.toLowerCase().includes(q) || w.tenant_name.toLowerCase().includes(q);
    }
    return true;
  });

  const { paginatedItems: paginatedWorkers, resetPage, ...pagination } = usePagination(filteredWorkers);

  useEffect(() => {
    resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTenant, searchQuery]);

  // --- 新規作成 ---
  const handleCreateOpen = () => {
    setIsCreateOpen(true);
    setNewTenantId(tenants[0]?.id || '');
    setNewWorkerId('');
    setNewName('');
    setNewPin('');
    setNewEmail('');
    setCreateError('');
  };

  const handleCreate = async () => {
    if (!newTenantId || !newWorkerId.trim() || !newName.trim() || !newPin) {
      setCreateError('テナント、担当者ID、担当者名、PINは必須です');
      return;
    }
    if (!/^\d{8}$/.test(newPin)) {
      setCreateError('PINコードは8桁の数字で入力してください');
      return;
    }
    setIsSaving(true);
    setCreateError('');
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: newTenantId,
          worker_id: newWorkerId.trim(),
          name: newName.trim(),
          pin: newPin,
          email: newEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || '作成に失敗しました');
        return;
      }
      const tenant = tenants.find((t) => t.id === newTenantId);
      setWorkers((prev) => [
        ...prev,
        {
          ...data.worker,
          tenant_name: tenant?.name || '',
          tenant_slug: tenant?.slug || '',
        },
      ]);
      setIsCreateOpen(false);
    } catch {
      setCreateError('通信エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // --- 編集 ---
  const handleEditOpen = (worker: WorkerRow) => {
    setEditTarget(worker);
    setEditName(worker.name);
    setEditEmail(worker.email || '');
    setEditError('');
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    if (!editName.trim()) {
      setEditError('担当者名は必須です');
      return;
    }
    setIsSaving(true);
    setEditError('');
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editTarget.id,
          name: editName.trim(),
          email: editEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || '更新に失敗しました');
        return;
      }
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === editTarget.id
            ? { ...w, name: data.worker.name, email: data.worker.email }
            : w
        )
      );
      setEditTarget(null);
    } catch {
      setEditError('通信エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // --- PIN再設定 ---
  const handlePinOpen = (worker: WorkerRow) => {
    setPinTarget(worker);
    setNewPinValue('');
    setPinError('');
  };

  const handlePinReset = async () => {
    if (!pinTarget) return;
    if (!/^\d{8}$/.test(newPinValue)) {
      setPinError('PINコードは8桁の数字で入力してください');
      return;
    }
    setIsSaving(true);
    setPinError('');
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pinTarget.id,
          action: 'reset_pin',
          pin: newPinValue,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error || 'PIN再設定に失敗しました');
        return;
      }
      setPinTarget(null);
    } catch {
      setPinError('通信エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // --- 有効/無効切替 ---
  const handleStatusToggle = async () => {
    if (!statusTarget) return;
    setIsStatusChanging(true);
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: statusTarget.id,
          action: 'toggle_active',
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'ステータスの変更に失敗しました');
      }
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === statusTarget.id ? { ...w, is_active: !w.is_active } : w
        )
      );
      setStatusTarget(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'ステータスの変更に失敗しました');
    } finally {
      setIsStatusChanging(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-mincho text-sumi">担当者管理</h2>
        <button className="btn-primary text-sm" onClick={handleCreateOpen}>
          + 新規担当者
        </button>
      </div>

      {/* テナントフィルター + 検索 */}
      <div className="flex gap-4 items-center">
        <select
          className="form-input form-input-sm w-56"
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
        <input
          type="text"
          className="form-input form-input-sm w-56"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="担当者名・テナント名で検索"
        />
      </div>

      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-12 bg-shironeri animate-pulse rounded" />
              <div className="h-12 bg-shironeri animate-pulse rounded" />
              <div className="h-12 bg-shironeri animate-pulse rounded" />
            </div>
          ) : filteredWorkers.length === 0 ? (
            <p className="text-center text-ginnezumi py-8">
              担当者が登録されていません
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-shironeri">
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">担当者ID</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">担当者名</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">メール</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">テナント</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">ステータス</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">最終ログイン</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedWorkers.map((worker) => (
                    <tr
                      key={worker.id}
                      className="border-b border-shironeri last:border-b-0"
                    >
                      <td className="px-4 py-3 text-sumi font-mono">{worker.worker_id}</td>
                      <td className="px-4 py-3 text-sumi">{worker.name}</td>
                      <td className="px-4 py-3 text-sumi">{worker.email || '—'}</td>
                      <td className="px-4 py-3 text-sumi">
                        {worker.tenant_name}（{worker.tenant_slug}）
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                            worker.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {worker.is_active ? '有効' : '無効'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sumi text-xs">
                        {formatDate(worker.last_login_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            className="btn-secondary text-xs"
                            onClick={() => handleEditOpen(worker)}
                          >
                            編集
                          </button>
                          <button
                            className="text-xs px-3 py-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            onClick={() => handlePinOpen(worker)}
                          >
                            PIN再設定
                          </button>
                          <button
                            className={`text-xs px-3 py-1.5 rounded ${
                              worker.is_active
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            onClick={() => setStatusTarget(worker)}
                          >
                            {worker.is_active ? '無効化' : '有効化'}
                          </button>
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

      {/* 新規作成モーダル */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="新規担当者作成"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-aitetsu mb-1">テナント *</label>
            <select
              className="input w-full"
              value={newTenantId}
              onChange={(e) => setNewTenantId(e.target.value)}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}（{t.slug}）
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-aitetsu mb-1">担当者ID *</label>
            <input
              type="text"
              className="input w-full font-mono"
              value={newWorkerId}
              onChange={(e) => setNewWorkerId(e.target.value)}
              placeholder="例: T01"
            />
          </div>
          <div>
            <label className="block text-sm text-aitetsu mb-1">担当者名 *</label>
            <input
              type="text"
              className="input w-full"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例: 田中太郎"
            />
          </div>
          <div>
            <label className="block text-sm text-aitetsu mb-1">PINコード *</label>
            <input
              type="password"
              className="input w-full font-mono tracking-widest"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="8桁の数字"
              maxLength={8}
            />
            <p className="text-xs text-ginnezumi mt-1">8桁の数字</p>
          </div>
          <div>
            <label className="block text-sm text-aitetsu mb-1">メールアドレス</label>
            <input
              type="email"
              className="input w-full"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="例: tanaka@example.com"
            />
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
              disabled={isSaving || !newTenantId || !newWorkerId.trim() || !newName.trim() || newPin.length !== 8}
            >
              {isSaving ? '作成中...' : '作成'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 編集モーダル */}
      <Modal
        isOpen={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="担当者編集"
      >
        {editTarget && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-aitetsu mb-1">担当者ID</label>
              <p className="text-sumi font-mono">{editTarget.worker_id}</p>
            </div>
            <div>
              <label className="block text-sm text-aitetsu mb-1">テナント</label>
              <p className="text-sumi">{editTarget.tenant_name}（{editTarget.tenant_slug}）</p>
            </div>
            <div>
              <label className="block text-sm text-aitetsu mb-1">担当者名 *</label>
              <input
                type="text"
                className="input w-full"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-aitetsu mb-1">メールアドレス</label>
              <input
                type="email"
                className="input w-full"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="例: tanaka@example.com"
              />
            </div>
            {editError && (
              <p className="text-kokiake text-sm">{editError}</p>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <button
                className="btn-secondary"
                onClick={() => setEditTarget(null)}
                disabled={isSaving}
              >
                キャンセル
              </button>
              <button
                className="btn-primary"
                onClick={handleEditSave}
                disabled={isSaving || !editName.trim()}
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* PIN再設定モーダル */}
      <Modal
        isOpen={pinTarget !== null}
        onClose={() => setPinTarget(null)}
        title="PIN再設定"
      >
        {pinTarget && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-aitetsu mb-1">対象担当者</label>
              <p className="text-sumi">
                {pinTarget.name}（{pinTarget.worker_id}）
              </p>
            </div>
            <div>
              <label className="block text-sm text-aitetsu mb-1">新しいPINコード *</label>
              <input
                type="password"
                className="input w-full font-mono tracking-widest"
                value={newPinValue}
                onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="8桁の数字"
                maxLength={8}
              />
              <p className="text-xs text-ginnezumi mt-1">8桁の数字</p>
            </div>
            {pinError && (
              <p className="text-kokiake text-sm">{pinError}</p>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <button
                className="btn-secondary"
                onClick={() => setPinTarget(null)}
                disabled={isSaving}
              >
                キャンセル
              </button>
              <button
                className="btn-primary"
                onClick={handlePinReset}
                disabled={isSaving || newPinValue.length !== 8}
              >
                {isSaving ? '再設定中...' : '再設定'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 有効/無効切替 */}
      <ConfirmModal
        isOpen={statusTarget !== null}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusToggle}
        title={statusTarget?.is_active ? '担当者無効化' : '担当者有効化'}
        message={
          statusTarget?.is_active
            ? `「${statusTarget.name}」（${statusTarget.worker_id}）を無効化しますか？ログインできなくなります。`
            : `「${statusTarget?.name}」（${statusTarget?.worker_id}）を有効化しますか？ログインできるようになります。`
        }
        confirmText={statusTarget?.is_active ? '無効化する' : '有効化する'}
        variant={statusTarget?.is_active ? 'warning' : 'default'}
        isLoading={isStatusChanging}
      />
    </div>
  );
}
