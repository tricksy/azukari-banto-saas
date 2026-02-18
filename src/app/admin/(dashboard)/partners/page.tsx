'use client';

import { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Pagination, usePagination } from '@/components/ui/Pagination';

interface PartnerRow {
  id: string;
  tenant_id: string;
  partner_id: string;
  partner_code: string | null;
  partner_name: string;
  name_kana: string | null;
  contact_person: string | null;
  phone: string | null;
  fax: string | null;
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

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTenant, setFilterTenant] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 新規作成
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTenantId, setNewTenantId] = useState('');
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerCode, setNewPartnerCode] = useState('');
  const [newNameKana, setNewNameKana] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newFax, setNewFax] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPostalCode, setNewPostalCode] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [createError, setCreateError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 編集
  const [editTarget, setEditTarget] = useState<PartnerRow | null>(null);
  const [editPartnerName, setEditPartnerName] = useState('');
  const [editPartnerCode, setEditPartnerCode] = useState('');
  const [editNameKana, setEditNameKana] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editFax, setEditFax] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');

  // 有効/無効切替
  const [statusTarget, setStatusTarget] = useState<PartnerRow | null>(null);
  const [isStatusChanging, setIsStatusChanging] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partnersRes, tenantsRes] = await Promise.all([
          fetch('/api/admin/partners'),
          fetch('/api/admin/tenants'),
        ]);
        if (partnersRes.ok) {
          const pd = await partnersRes.json();
          setPartners(pd.partners);
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

  const filteredPartners = partners.filter((p) => {
    if (filterTenant && p.tenant_id !== filterTenant) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.partner_name.toLowerCase().includes(q) ||
        (p.partner_code || '').toLowerCase().includes(q) ||
        (p.contact_person || '').toLowerCase().includes(q) ||
        p.tenant_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const { paginatedItems: paginatedPartners, resetPage, ...pagination } = usePagination(filteredPartners);

  useEffect(() => {
    resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTenant, searchQuery]);

  // --- 新規作成 ---
  const handleCreateOpen = () => {
    setIsCreateOpen(true);
    setNewTenantId(tenants[0]?.id || '');
    setNewPartnerName('');
    setNewPartnerCode('');
    setNewNameKana('');
    setNewContactPerson('');
    setNewPhone('');
    setNewFax('');
    setNewEmail('');
    setNewPostalCode('');
    setNewAddress('');
    setNewNotes('');
    setCreateError('');
  };

  const handleCreate = async () => {
    if (!newTenantId || !newPartnerName.trim()) {
      setCreateError('テナントと取引先名は必須です');
      return;
    }
    setIsSaving(true);
    setCreateError('');
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: newTenantId,
          partner_name: newPartnerName.trim(),
          partner_code: newPartnerCode.trim() || undefined,
          name_kana: newNameKana.trim() || undefined,
          contact_person: newContactPerson.trim() || undefined,
          phone: newPhone.trim() || undefined,
          fax: newFax.trim() || undefined,
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
      setPartners((prev) => [
        ...prev,
        {
          ...data.partner,
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
  const handleEditOpen = (partner: PartnerRow) => {
    setEditTarget(partner);
    setEditPartnerName(partner.partner_name);
    setEditPartnerCode(partner.partner_code || '');
    setEditNameKana(partner.name_kana || '');
    setEditContactPerson(partner.contact_person || '');
    setEditPhone(partner.phone || '');
    setEditFax(partner.fax || '');
    setEditEmail(partner.email || '');
    setEditPostalCode(partner.postal_code || '');
    setEditAddress(partner.address || '');
    setEditNotes(partner.notes || '');
    setEditError('');
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    if (!editPartnerName.trim()) {
      setEditError('取引先名は必須です');
      return;
    }
    setIsSaving(true);
    setEditError('');
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editTarget.id,
          partner_name: editPartnerName.trim(),
          partner_code: editPartnerCode.trim() || undefined,
          name_kana: editNameKana.trim() || undefined,
          contact_person: editContactPerson.trim() || undefined,
          phone: editPhone.trim() || undefined,
          fax: editFax.trim() || undefined,
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
      setPartners((prev) =>
        prev.map((p) =>
          p.id === editTarget.id
            ? {
                ...p,
                partner_name: data.partner.partner_name,
                partner_code: data.partner.partner_code,
                name_kana: data.partner.name_kana,
                contact_person: data.partner.contact_person,
                phone: data.partner.phone,
                fax: data.partner.fax,
                email: data.partner.email,
                postal_code: data.partner.postal_code,
                address: data.partner.address,
                notes: data.partner.notes,
              }
            : p
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
      const res = await fetch('/api/admin/partners', {
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
      setPartners((prev) =>
        prev.map((p) =>
          p.id === statusTarget.id ? { ...p, is_active: !p.is_active } : p
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
        <h2 className="text-xl font-mincho text-sumi">取引先管理</h2>
        <button className="btn-primary text-sm" onClick={handleCreateOpen}>
          + 新規取引先
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
          placeholder="取引先名・コード・担当者で検索"
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
          ) : filteredPartners.length === 0 ? (
            <p className="text-center text-ginnezumi py-8">
              取引先が登録されていません
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-shironeri">
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">取引先コード</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">取引先名</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">担当者</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">電話</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">テナント</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">ステータス</th>
                    <th className="px-4 py-3 text-left text-aitetsu font-normal">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPartners.map((partner) => (
                    <tr
                      key={partner.id}
                      className="border-b border-shironeri last:border-b-0"
                    >
                      <td className="px-4 py-3 text-sumi font-mono">{partner.partner_code || partner.partner_id}</td>
                      <td className="px-4 py-3 text-sumi">{partner.partner_name}</td>
                      <td className="px-4 py-3 text-sumi">{partner.contact_person || '—'}</td>
                      <td className="px-4 py-3 text-sumi">{partner.phone || '—'}</td>
                      <td className="px-4 py-3 text-sumi">
                        {partner.tenant_name}（{partner.tenant_slug}）
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                            partner.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {partner.is_active ? '有効' : '無効'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            className="btn-secondary text-xs"
                            onClick={() => handleEditOpen(partner)}
                          >
                            編集
                          </button>
                          <button
                            className={`text-xs px-3 py-1.5 rounded ${
                              partner.is_active
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            onClick={() => setStatusTarget(partner)}
                          >
                            {partner.is_active ? '無効化' : '有効化'}
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
        title="新規取引先作成"
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
              <label className="block text-sm text-aitetsu mb-1">取引先名 *</label>
              <input
                type="text"
                className="input w-full"
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.target.value)}
                placeholder="例: 京都染工房"
              />
            </div>
            <div>
              <label className="block text-sm text-aitetsu mb-1">取引先コード</label>
              <input
                type="text"
                className="input w-full"
                value={newPartnerCode}
                onChange={(e) => setNewPartnerCode(e.target.value)}
                placeholder="例: KYT-001"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm text-aitetsu mb-1">担当者名</label>
              <input
                type="text"
                className="input w-full"
                value={newContactPerson}
                onChange={(e) => setNewContactPerson(e.target.value)}
                placeholder="例: 山田太郎"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
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
              <label className="block text-sm text-aitetsu mb-1">FAX</label>
              <input
                type="text"
                className="input w-full"
                value={newFax}
                onChange={(e) => setNewFax(e.target.value)}
                placeholder="例: 075-123-4568"
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
              disabled={isSaving || !newTenantId || !newPartnerName.trim()}
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
        title="取引先編集"
        size="lg"
      >
        {editTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-aitetsu mb-1">取引先ID</label>
                <p className="text-sumi font-mono">{editTarget.partner_id}</p>
              </div>
              <div>
                <label className="block text-sm text-aitetsu mb-1">テナント</label>
                <p className="text-sumi">{editTarget.tenant_name}（{editTarget.tenant_slug}）</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-aitetsu mb-1">取引先名 *</label>
                <input
                  type="text"
                  className="input w-full"
                  value={editPartnerName}
                  onChange={(e) => setEditPartnerName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-aitetsu mb-1">取引先コード</label>
                <input
                  type="text"
                  className="input w-full"
                  value={editPartnerCode}
                  onChange={(e) => setEditPartnerCode(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-aitetsu mb-1">フリガナ</label>
                <input
                  type="text"
                  className="input w-full"
                  value={editNameKana}
                  onChange={(e) => setEditNameKana(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-aitetsu mb-1">担当者名</label>
                <input
                  type="text"
                  className="input w-full"
                  value={editContactPerson}
                  onChange={(e) => setEditContactPerson(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
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
                <label className="block text-sm text-aitetsu mb-1">FAX</label>
                <input
                  type="text"
                  className="input w-full"
                  value={editFax}
                  onChange={(e) => setEditFax(e.target.value)}
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
                disabled={isSaving || !editPartnerName.trim()}
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
        title={statusTarget?.is_active ? '取引先無効化' : '取引先有効化'}
        message={
          statusTarget?.is_active
            ? `「${statusTarget.partner_name}」（${statusTarget.partner_id}）を無効化しますか？`
            : `「${statusTarget?.partner_name}」（${statusTarget?.partner_id}）を有効化しますか？`
        }
        confirmText={statusTarget?.is_active ? '無効化する' : '有効化する'}
        variant={statusTarget?.is_active ? 'warning' : 'default'}
        isLoading={isStatusChanging}
      />
    </div>
  );
}
