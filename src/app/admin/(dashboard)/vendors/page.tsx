'use client';

import { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Pagination, usePagination } from '@/components/ui/Pagination';

interface VendorRow {
  id: string;
  tenant_id: string;
  vendor_id: string;
  name: string;
  name_kana: string | null;
  phone: string | null;
  email: string | null;
  postal_code: string | null;
  address: string | null;
  specialty: string | null;
  notes: string | null;
  is_active: boolean;
  tenant_name: string;
  tenant_slug: string;
  created_at: string;
}

interface TenantOption {
  id: string;
  slug: string;
  name: string;
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTenant, setFilterTenant] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 新規作成
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTenantId, setNewTenantId] = useState('');
  const [newName, setNewName] = useState('');
  const [newNameKana, setNewNameKana] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPostalCode, setNewPostalCode] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [createError, setCreateError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 編集
  const [editTarget, setEditTarget] = useState<VendorRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameKana, setEditNameKana] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');

  // 有効/無効切替
  const [statusTarget, setStatusTarget] = useState<VendorRow | null>(null);
  const [isStatusChanging, setIsStatusChanging] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorsRes, tenantsRes] = await Promise.all([
          fetch('/api/admin/vendors'),
          fetch('/api/admin/tenants'),
        ]);
        if (vendorsRes.ok) {
          const vd = await vendorsRes.json();
          setVendors(vd.vendors);
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

  const filteredVendors = vendors.filter((v) => {
    if (filterTenant && v.tenant_id !== filterTenant) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        (v.specialty || '').toLowerCase().includes(q) ||
        v.tenant_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const { paginatedItems: paginatedVendors, resetPage, ...pagination } = usePagination(filteredVendors);

  useEffect(() => {
    resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTenant, searchQuery]);

  // --- 新規作成 ---
  const handleCreateOpen = () => {
    setIsCreateOpen(true);
    setNewTenantId(tenants[0]?.id || '');
    setNewName('');
    setNewNameKana('');
    setNewPhone('');
    setNewEmail('');
    setNewPostalCode('');
    setNewAddress('');
    setNewSpecialty('');
    setNewNotes('');
    setCreateError('');
  };

  const handleCreate = async () => {
    if (!newTenantId || !newName.trim()) {
      setCreateError('テナントと業者名は必須です');
      return;
    }
    setIsSaving(true);
    setCreateError('');
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: newTenantId,
          name: newName.trim(),
          name_kana: newNameKana.trim() || undefined,
          phone: newPhone.trim() || undefined,
          email: newEmail.trim() || undefined,
          postal_code: newPostalCode.trim() || undefined,
          address: newAddress.trim() || undefined,
          specialty: newSpecialty.trim() || undefined,
          notes: newNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || '作成に失敗しました');
        return;
      }
      const tenant = tenants.find((t) => t.id === newTenantId);
      setVendors((prev) => [
        ...prev,
        {
          ...data.vendor,
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
  const handleEditOpen = (vendor: VendorRow) => {
    setEditTarget(vendor);
    setEditName(vendor.name);
    setEditNameKana(vendor.name_kana || '');
    setEditPhone(vendor.phone || '');
    setEditEmail(vendor.email || '');
    setEditPostalCode(vendor.postal_code || '');
    setEditAddress(vendor.address || '');
    setEditSpecialty(vendor.specialty || '');
    setEditNotes(vendor.notes || '');
    setEditError('');
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    if (!editName.trim()) {
      setEditError('業者名は必須です');
      return;
    }
    setIsSaving(true);
    setEditError('');
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editTarget.id,
          name: editName.trim(),
          name_kana: editNameKana.trim() || undefined,
          phone: editPhone.trim() || undefined,
          email: editEmail.trim() || undefined,
          postal_code: editPostalCode.trim() || undefined,
          address: editAddress.trim() || undefined,
          specialty: editSpecialty.trim() || undefined,
          notes: editNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || '更新に失敗しました');
        return;
      }
      setVendors((prev) =>
        prev.map((v) =>
          v.id === editTarget.id
            ? {
                ...v,
                name: data.vendor.name,
                name_kana: data.vendor.name_kana,
                phone: data.vendor.phone,
                email: data.vendor.email,
                postal_code: data.vendor.postal_code,
                address: data.vendor.address,
                specialty: data.vendor.specialty,
                notes: data.vendor.notes,
              }
            : v
        )
      );
      setEditTarget(null);
    } catch {
      setEditError('通信エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // --- 有効/無効切替 ---
  const handleStatusToggle = async () => {
    if (!statusTarget) return;
    setIsStatusChanging(true);
    try {
      const res = await fetch('/api/admin/vendors', {
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
      setVendors((prev) =>
        prev.map((v) =>
          v.id === statusTarget.id ? { ...v, is_active: !v.is_active } : v
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-mincho text-sumi">業者管理</h2>
        <button className="btn-primary text-sm" onClick={handleCreateOpen}>
          + 新規業者
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
          placeholder="業者名・専門分野で検索"
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
          ) : filteredVendors.length === 0 ? (
            <p className="text-center text-ginnezumi py-8">
              業者が登録されていません
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-shironeri">
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">業者ID</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">業者名</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">専門分野</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">電話</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">テナント</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">ステータス</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="border-b border-shironeri last:border-b-0"
                    >
                      <td className="px-4 py-3 text-sumi font-mono">{vendor.vendor_id}</td>
                      <td className="px-4 py-3 text-sumi">{vendor.name}</td>
                      <td className="px-4 py-3 text-sumi">{vendor.specialty || '—'}</td>
                      <td className="px-4 py-3 text-sumi">{vendor.phone || '—'}</td>
                      <td className="px-4 py-3 text-sumi">
                        {vendor.tenant_name}（{vendor.tenant_slug}）
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                            vendor.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {vendor.is_active ? '有効' : '無効'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            className="btn-secondary text-xs"
                            onClick={() => handleEditOpen(vendor)}
                          >
                            編集
                          </button>
                          <button
                            className={`text-xs px-3 py-1.5 rounded ${
                              vendor.is_active
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            onClick={() => setStatusTarget(vendor)}
                          >
                            {vendor.is_active ? '無効化' : '有効化'}
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
        title="新規業者作成"
        size="lg"
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-aitetsu mb-1">業者名 *</label>
              <input
                type="text"
                className="input w-full"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例: 京都染工房"
              />
            </div>
            <div>
              <label className="block text-sm text-aitetsu mb-1">フリガナ</label>
              <input
                type="text"
                className="input w-full"
                value={newNameKana}
                onChange={(e) => setNewNameKana(e.target.value)}
                placeholder="例: キョウトソメコウボウ"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-aitetsu mb-1">専門分野</label>
            <input
              type="text"
              className="input w-full"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              placeholder="例: 染め, 仕立て, 洗い"
            />
            <p className="text-xs text-ginnezumi mt-1">カンマ区切りで複数入力可</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-aitetsu mb-1">電話番号</label>
              <input
                type="text"
                className="input w-full"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="例: 075-123-4567"
              />
            </div>
            <div>
              <label className="block text-sm text-aitetsu mb-1">メール</label>
              <input
                type="email"
                className="input w-full"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="例: info@example.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-aitetsu mb-1">郵便番号</label>
              <input
                type="text"
                className="input w-full"
                value={newPostalCode}
                onChange={(e) => setNewPostalCode(e.target.value)}
                placeholder="例: 600-8001"
              />
            </div>
            <div>
              <label className="block text-sm text-aitetsu mb-1">住所</label>
              <input
                type="text"
                className="input w-full"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="例: 京都市下京区..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-aitetsu mb-1">備考</label>
            <textarea
              className="input w-full"
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
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
              disabled={isSaving || !newTenantId || !newName.trim()}
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
        title="業者編集"
        size="lg"
      >
        {editTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-aitetsu mb-1">業者ID</label>
                <p className="text-sumi font-mono">{editTarget.vendor_id}</p>
              </div>
              <div>
                <label className="block text-sm text-aitetsu mb-1">テナント</label>
                <p className="text-sumi">{editTarget.tenant_name}（{editTarget.tenant_slug}）</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-aitetsu mb-1">業者名 *</label>
                <input
                  type="text"
                  className="input w-full"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-aitetsu mb-1">フリガナ</label>
                <input
                  type="text"
                  className="input w-full"
                  value={editNameKana}
                  onChange={(e) => setEditNameKana(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-aitetsu mb-1">専門分野</label>
              <input
                type="text"
                className="input w-full"
                value={editSpecialty}
                onChange={(e) => setEditSpecialty(e.target.value)}
              />
              <p className="text-xs text-ginnezumi mt-1">カンマ区切りで複数入力可</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-aitetsu mb-1">電話番号</label>
                <input
                  type="text"
                  className="input w-full"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-aitetsu mb-1">メール</label>
                <input
                  type="email"
                  className="input w-full"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-aitetsu mb-1">郵便番号</label>
                <input
                  type="text"
                  className="input w-full"
                  value={editPostalCode}
                  onChange={(e) => setEditPostalCode(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-aitetsu mb-1">住所</label>
                <input
                  type="text"
                  className="input w-full"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-aitetsu mb-1">備考</label>
              <textarea
                className="input w-full"
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
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

      {/* 有効/無効切替 */}
      <ConfirmModal
        isOpen={statusTarget !== null}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusToggle}
        title={statusTarget?.is_active ? '業者無効化' : '業者有効化'}
        message={
          statusTarget?.is_active
            ? `「${statusTarget.name}」（${statusTarget.vendor_id}）を無効化しますか？`
            : `「${statusTarget?.name}」（${statusTarget?.vendor_id}）を有効化しますか？`
        }
        confirmText={statusTarget?.is_active ? '無効化する' : '有効化する'}
        variant={statusTarget?.is_active ? 'warning' : 'default'}
        isLoading={isStatusChanging}
      />
    </div>
  );
}
