'use client';

import { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Pagination, usePagination } from '@/components/ui/Pagination';

interface CustomerRow {
  id: string;
  tenant_id: string;
  customer_id: string;
  partner_id: string | null;
  partner_name: string | null;
  name: string;
  name_kana: string | null;
  phone: string | null;
  email: string | null;
  postal_code: string | null;
  address: string | null;
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

interface PartnerOption {
  id: string;
  tenant_id: string;
  partner_id: string;
  partner_name: string;
  is_active: boolean;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [allPartners, setAllPartners] = useState<PartnerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTenant, setFilterTenant] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 新規作成
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTenantId, setNewTenantId] = useState('');
  const [newName, setNewName] = useState('');
  const [newNameKana, setNewNameKana] = useState('');
  const [newPartnerId, setNewPartnerId] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPostalCode, setNewPostalCode] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [createError, setCreateError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 編集
  const [editTarget, setEditTarget] = useState<CustomerRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameKana, setEditNameKana] = useState('');
  const [editPartnerId, setEditPartnerId] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');

  // 有効/無効切替
  const [statusTarget, setStatusTarget] = useState<CustomerRow | null>(null);
  const [isStatusChanging, setIsStatusChanging] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, tenantsRes, partnersRes] = await Promise.all([
          fetch('/api/admin/customers'),
          fetch('/api/admin/tenants'),
          fetch('/api/admin/partners'),
        ]);
        if (customersRes.ok) {
          const cd = await customersRes.json();
          setCustomers(cd.customers);
        }
        if (tenantsRes.ok) {
          const td = await tenantsRes.json();
          setTenants(td.tenants.map((t: TenantOption & Record<string, unknown>) => ({ id: t.id, slug: t.slug, name: t.name })));
        }
        if (partnersRes.ok) {
          const pd = await partnersRes.json();
          setAllPartners(
            (pd.partners || []).map((p: PartnerOption & Record<string, unknown>) => ({
              id: p.id,
              tenant_id: p.tenant_id,
              partner_id: p.partner_id,
              partner_name: p.partner_name,
              is_active: p.is_active,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    if (filterTenant && c.tenant_id !== filterTenant) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.name_kana || '').toLowerCase().includes(q) ||
        (c.partner_name || '').toLowerCase().includes(q) ||
        c.tenant_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const { paginatedItems: paginatedCustomers, resetPage, ...pagination } = usePagination(filteredCustomers);

  useEffect(() => {
    resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTenant, searchQuery]);

  // テナントIDでフィルタされた取引先リスト
  const getFilteredPartners = (tenantId: string) => {
    return allPartners.filter((p) => p.tenant_id === tenantId && p.is_active);
  };

  // --- 新規作成 ---
  const handleCreateOpen = () => {
    setIsCreateOpen(true);
    setNewTenantId(tenants[0]?.id || '');
    setNewName('');
    setNewNameKana('');
    setNewPartnerId('');
    setNewPhone('');
    setNewEmail('');
    setNewPostalCode('');
    setNewAddress('');
    setNewNotes('');
    setCreateError('');
  };

  const handleCreate = async () => {
    if (!newTenantId || !newName.trim()) {
      setCreateError('テナントと顧客名は必須です');
      return;
    }
    setIsSaving(true);
    setCreateError('');

    // 選択された取引先の名前を取得
    const selectedPartner = allPartners.find((p) => p.partner_id === newPartnerId && p.tenant_id === newTenantId);

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: newTenantId,
          name: newName.trim(),
          name_kana: newNameKana.trim() || undefined,
          partner_id: newPartnerId || undefined,
          partner_name: selectedPartner?.partner_name || undefined,
          phone: newPhone.trim() || undefined,
          email: newEmail.trim() || undefined,
          postal_code: newPostalCode.trim() || undefined,
          address: newAddress.trim() || undefined,
          notes: newNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || '作成に失敗しました');
        return;
      }
      const tenant = tenants.find((t) => t.id === newTenantId);
      setCustomers((prev) => [
        ...prev,
        {
          ...data.customer,
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
  const handleEditOpen = (customer: CustomerRow) => {
    setEditTarget(customer);
    setEditName(customer.name);
    setEditNameKana(customer.name_kana || '');
    setEditPartnerId(customer.partner_id || '');
    setEditPhone(customer.phone || '');
    setEditEmail(customer.email || '');
    setEditPostalCode(customer.postal_code || '');
    setEditAddress(customer.address || '');
    setEditNotes(customer.notes || '');
    setEditError('');
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    if (!editName.trim()) {
      setEditError('顧客名は必須です');
      return;
    }
    setIsSaving(true);
    setEditError('');

    // 選択された取引先の名前を取得
    const selectedPartner = allPartners.find((p) => p.partner_id === editPartnerId && p.tenant_id === editTarget.tenant_id);

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editTarget.id,
          name: editName.trim(),
          name_kana: editNameKana.trim() || undefined,
          partner_id: editPartnerId || undefined,
          partner_name: selectedPartner?.partner_name || undefined,
          phone: editPhone.trim() || undefined,
          email: editEmail.trim() || undefined,
          postal_code: editPostalCode.trim() || undefined,
          address: editAddress.trim() || undefined,
          notes: editNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || '更新に失敗しました');
        return;
      }
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editTarget.id
            ? {
                ...c,
                name: data.customer.name,
                name_kana: data.customer.name_kana,
                partner_id: data.customer.partner_id,
                partner_name: data.customer.partner_name,
                phone: data.customer.phone,
                email: data.customer.email,
                postal_code: data.customer.postal_code,
                address: data.customer.address,
                notes: data.customer.notes,
              }
            : c
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
      const res = await fetch('/api/admin/customers', {
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
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === statusTarget.id ? { ...c, is_active: !c.is_active } : c
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
        <h2 className="text-xl font-mincho text-sumi">顧客管理</h2>
        <button className="btn-primary text-sm" onClick={handleCreateOpen}>
          + 新規顧客
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
          placeholder="顧客名・フリガナ・取引先で検索"
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
          ) : filteredCustomers.length === 0 ? (
            <p className="text-center text-ginnezumi py-8">
              顧客が登録されていません
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-shironeri">
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">顧客名</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">フリガナ</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">取引先</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">電話</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">テナント</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">ステータス</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-shironeri last:border-b-0"
                    >
                      <td className="px-4 py-3 text-sumi">{customer.name}</td>
                      <td className="px-4 py-3 text-sumi">{customer.name_kana || '—'}</td>
                      <td className="px-4 py-3 text-sumi">{customer.partner_name || '—'}</td>
                      <td className="px-4 py-3 text-sumi">{customer.phone || '—'}</td>
                      <td className="px-4 py-3 text-sumi">
                        {customer.tenant_name}（{customer.tenant_slug}）
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                            customer.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {customer.is_active ? '有効' : '無効'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            className="btn-secondary text-xs"
                            onClick={() => handleEditOpen(customer)}
                          >
                            編集
                          </button>
                          <button
                            className={`text-xs px-3 py-1.5 rounded ${
                              customer.is_active
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            onClick={() => setStatusTarget(customer)}
                          >
                            {customer.is_active ? '無効化' : '有効化'}
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
        title="新規顧客作成"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-aitetsu mb-1">テナント *</label>
            <select
              className="input w-full"
              value={newTenantId}
              onChange={(e) => {
                setNewTenantId(e.target.value);
                setNewPartnerId('');
              }}
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
              <label className="block text-sm text-aitetsu mb-1">顧客名 *</label>
              <input
                type="text"
                className="input w-full"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例: 鈴木花子"
              />
            </div>
            <div>
              <label className="block text-sm text-aitetsu mb-1">フリガナ</label>
              <input
                type="text"
                className="input w-full"
                value={newNameKana}
                onChange={(e) => setNewNameKana(e.target.value)}
                placeholder="例: スズキハナコ"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-aitetsu mb-1">取引先</label>
            <select
              className="input w-full"
              value={newPartnerId}
              onChange={(e) => setNewPartnerId(e.target.value)}
            >
              <option value="">選択なし</option>
              {getFilteredPartners(newTenantId).map((p) => (
                <option key={p.id} value={p.partner_id}>
                  {p.partner_name}（{p.partner_id}）
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-aitetsu mb-1">電話番号</label>
              <input
                type="text"
                className="input w-full"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="例: 090-1234-5678"
              />
            </div>
            <div>
              <label className="block text-sm text-aitetsu mb-1">メール</label>
              <input
                type="email"
                className="input w-full"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="例: hanako@example.com"
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
        title="顧客編集"
        size="lg"
      >
        {editTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-aitetsu mb-1">顧客ID</label>
                <p className="text-sumi font-mono">{editTarget.customer_id}</p>
              </div>
              <div>
                <label className="block text-sm text-aitetsu mb-1">テナント</label>
                <p className="text-sumi">{editTarget.tenant_name}（{editTarget.tenant_slug}）</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-aitetsu mb-1">顧客名 *</label>
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
              <label className="block text-sm text-aitetsu mb-1">取引先</label>
              <select
                className="input w-full"
                value={editPartnerId}
                onChange={(e) => setEditPartnerId(e.target.value)}
              >
                <option value="">選択なし</option>
                {getFilteredPartners(editTarget.tenant_id).map((p) => (
                  <option key={p.id} value={p.partner_id}>
                    {p.partner_name}（{p.partner_id}）
                  </option>
                ))}
              </select>
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
        title={statusTarget?.is_active ? '顧客無効化' : '顧客有効化'}
        message={
          statusTarget?.is_active
            ? `「${statusTarget.name}」（${statusTarget.customer_id}）を無効化しますか？`
            : `「${statusTarget?.name}」（${statusTarget?.customer_id}）を有効化しますか？`
        }
        confirmText={statusTarget?.is_active ? '無効化する' : '有効化する'}
        variant={statusTarget?.is_active ? 'warning' : 'default'}
        isLoading={isStatusChanging}
      />
    </div>
  );
}
