'use client';

import { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Pagination, usePagination } from '@/components/ui/Pagination';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  plan: 'standard' | 'premium';
  status: 'active' | 'suspended' | 'cancelled';
  redirect_url: string | null;
  created_at: string;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editPlan, setEditPlan] = useState<'standard' | 'premium'>('standard');
  const [editUrl, setEditUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newPlan, setNewPlan] = useState<'standard' | 'premium'>('standard');
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
  const [showPremiumGuide, setShowPremiumGuide] = useState(false);

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
    setEditPlan(tenant.plan === 'premium' ? 'premium' : 'standard');
    setEditUrl(tenant.redirect_url || '');
  };

  const handleCloseModal = () => {
    setEditingTenant(null);
    setEditPlan('standard');
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
          plan: editPlan,
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
            ? { ...t, plan: editPlan, redirect_url: editUrl || null }
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
    setNewPlan('standard');
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
                        {tenant.slug}
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

      {/* Premiumプラン対応ガイド */}
      <div className="card">
        <button
          type="button"
          className="w-full px-6 py-4 flex items-center justify-between text-left"
          onClick={() => setShowPremiumGuide(!showPremiumGuide)}
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 flex items-center justify-center bg-kokiake text-white rounded-full text-sm font-bold">P</span>
            <div>
              <h3 className="font-medium text-sumi">Premiumプラン対応ガイド</h3>
              <p className="text-xs text-ginnezumi">テナントを専用サーバーに分離する手順</p>
            </div>
          </div>
          <svg className={`w-5 h-5 text-ginnezumi transition-transform ${showPremiumGuide ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showPremiumGuide && (
          <div className="px-6 pb-6 space-y-6 border-t border-shironeri pt-6">

            {/* 概要 */}
            <div className="bg-kinari p-4 rounded text-sm text-sumi space-y-2">
              <p className="font-medium">Standard と Premium の違い</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-usuzumi/20">
                    <th className="py-2 text-left text-aitetsu font-normal w-1/4">項目</th>
                    <th className="py-2 text-left text-aitetsu font-normal">Standard（共有SaaS）</th>
                    <th className="py-2 text-left text-aitetsu font-normal">Premium（専用サーバー分離）</th>
                  </tr>
                </thead>
                <tbody className="text-ginnezumi">
                  <tr className="border-b border-usuzumi/10"><td className="py-2 text-sumi">Vercel</td><td>共有プロジェクト</td><td>専用プロジェクト</td></tr>
                  <tr className="border-b border-usuzumi/10"><td className="py-2 text-sumi">Supabase</td><td>共有DB（RLSで分離）</td><td>専用Supabaseプロジェクト</td></tr>
                  <tr className="border-b border-usuzumi/10"><td className="py-2 text-sumi">R2ストレージ</td><td>共有バケット（tenant_idプレフィックス）</td><td>専用バケット</td></tr>
                  <tr className="border-b border-usuzumi/10"><td className="py-2 text-sumi">ドメイン</td><td>共有ドメイン</td><td>専用カスタムドメイン可</td></tr>
                  <tr><td className="py-2 text-sumi">データ</td><td>他テナントと同一DB</td><td>完全独立（他テナントの影響なし）</td></tr>
                </tbody>
              </table>
            </div>

            {/* STEP 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-shu text-white rounded-full font-bold text-sm flex-shrink-0">1</span>
                <h4 className="font-medium text-sumi">Supabaseプロジェクト作成</h4>
              </div>
              <div className="ml-11 space-y-2 text-sm text-ginnezumi">
                <ol className="list-decimal list-inside space-y-1">
                  <li><a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-shu hover:underline">supabase.com/dashboard</a> で新規プロジェクト作成</li>
                  <li>リージョン: <code className="bg-shironeri px-1 rounded">Northeast Asia (Tokyo)</code> を選択</li>
                  <li>Database Password を安全に保管</li>
                  <li>プロジェクト作成完了後、<code className="bg-shironeri px-1 rounded">Project URL</code> と <code className="bg-shironeri px-1 rounded">anon key</code>、<code className="bg-shironeri px-1 rounded">service_role key</code> をメモ</li>
                </ol>
                <div className="bg-shironeri p-3 rounded mt-2">
                  <p className="text-xs font-medium text-sumi mb-1">マイグレーション実行:</p>
                  <pre className="text-xs font-mono overflow-x-auto whitespace-pre">{`# リンク先を専用プロジェクトに変更
supabase link --project-ref <新しいproject-ref>

# マイグレーション適用
supabase db push

# シードデータは不要（データ移行で対応）`}</pre>
                </div>
              </div>
            </div>

            {/* STEP 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-shu text-white rounded-full font-bold text-sm flex-shrink-0">2</span>
                <h4 className="font-medium text-sumi">Cloudflare R2バケット作成</h4>
              </div>
              <div className="ml-11 space-y-2 text-sm text-ginnezumi">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Cloudflareダッシュボード → R2 → バケット作成</li>
                  <li>バケット名: <code className="bg-shironeri px-1 rounded">azukari-banto-{"<tenant-slug>"}</code></li>
                  <li>APIトークン作成（Object Read & Write 権限）</li>
                  <li>パブリックアクセス設定（カスタムドメイン or r2.dev URL）</li>
                </ol>
                <div className="bg-shironeri p-3 rounded mt-2">
                  <p className="text-xs font-medium text-sumi mb-1">必要な情報:</p>
                  <pre className="text-xs font-mono overflow-x-auto whitespace-pre">{`R2_ACCOUNT_ID=<CloudflareアカウントID>
R2_ACCESS_KEY_ID=<新しいAPIトークンのアクセスキー>
R2_SECRET_ACCESS_KEY=<新しいAPIトークンのシークレット>
R2_BUCKET_NAME=azukari-banto-<tenant-slug>
R2_PUBLIC_URL=https://<カスタムドメイン or r2.dev URL>`}</pre>
                </div>
              </div>
            </div>

            {/* STEP 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-shu text-white rounded-full font-bold text-sm flex-shrink-0">3</span>
                <h4 className="font-medium text-sumi">データ移行</h4>
              </div>
              <div className="ml-11 space-y-2 text-sm text-ginnezumi">
                <p>共有DBから専用DBへテナントデータを移行する。</p>
                <div className="bg-shironeri p-3 rounded">
                  <p className="text-xs font-medium text-sumi mb-1">移行対象テーブル（tenant_id でフィルタ）:</p>
                  <pre className="text-xs font-mono overflow-x-auto whitespace-pre">{`-- 1. テナント本体
INSERT INTO tenants SELECT * FROM shared_db.tenants WHERE id = '<tenant-uuid>';

-- 2. マスタデータ
INSERT INTO workers SELECT * FROM shared_db.workers WHERE tenant_id = '<tenant-uuid>';
INSERT INTO vendors SELECT * FROM shared_db.vendors WHERE tenant_id = '<tenant-uuid>';
INSERT INTO customers SELECT * FROM shared_db.customers WHERE tenant_id = '<tenant-uuid>';
INSERT INTO partners SELECT * FROM shared_db.partners WHERE tenant_id = '<tenant-uuid>';

-- 3. トランザクションデータ
INSERT INTO receptions SELECT * FROM shared_db.receptions WHERE tenant_id = '<tenant-uuid>';
INSERT INTO items SELECT * FROM shared_db.items WHERE tenant_id = '<tenant-uuid>';
INSERT INTO status_logs SELECT * FROM shared_db.status_logs WHERE tenant_id = '<tenant-uuid>';
INSERT INTO claims SELECT * FROM shared_db.claims WHERE tenant_id = '<tenant-uuid>';
INSERT INTO claim_logs SELECT * FROM shared_db.claim_logs WHERE tenant_id = '<tenant-uuid>';

-- 4. 設定データ
INSERT INTO tenant_settings SELECT * FROM shared_db.tenant_settings WHERE tenant_id = '<tenant-uuid>';

-- 5. 写真データはR2間でコピー
-- rclone や wrangler r2 object get/put で移行`}</pre>
                </div>
                <div className="bg-kokiake/5 border border-kokiake/20 p-3 rounded mt-2">
                  <p className="text-xs text-kokiake font-medium">注意: 移行作業中はテナントを「停止中」にして、担当者のアクセスを遮断すること。</p>
                </div>
              </div>
            </div>

            {/* STEP 4 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-shu text-white rounded-full font-bold text-sm flex-shrink-0">4</span>
                <h4 className="font-medium text-sumi">Vercelプロジェクト作成・デプロイ</h4>
              </div>
              <div className="ml-11 space-y-2 text-sm text-ginnezumi">
                <ol className="list-decimal list-inside space-y-1">
                  <li><a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="text-shu hover:underline">vercel.com/new</a> で同じGitリポジトリからImport</li>
                  <li>プロジェクト名: <code className="bg-shironeri px-1 rounded">azukari-banto-{"<tenant-slug>"}</code></li>
                  <li>Framework: Next.js（自動検出）</li>
                  <li>環境変数を設定（下記参照）</li>
                  <li>デプロイ実行</li>
                </ol>
                <div className="bg-shironeri p-3 rounded mt-2">
                  <p className="text-xs font-medium text-sumi mb-1">環境変数一覧:</p>
                  <pre className="text-xs font-mono overflow-x-auto whitespace-pre">{`# Supabase（専用プロジェクト）
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<専用anon key>
SUPABASE_SERVICE_ROLE_KEY=<専用service_role key>

# Cloudflare R2（専用バケット）
R2_ACCOUNT_ID=<CloudflareアカウントID>
R2_ACCESS_KEY_ID=<専用アクセスキー>
R2_SECRET_ACCESS_KEY=<専用シークレット>
R2_BUCKET_NAME=azukari-banto-<tenant-slug>
R2_PUBLIC_URL=https://<専用R2パブリックURL>

# 認証
JWT_SECRET=<新しいランダムシークレット>
NEXT_PUBLIC_ADMIN_PREFIX=<新しい管理者URLプレフィックス>

# Google OAuth（管理者ログイン）
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<同じ or 新しいClient ID>
GOOGLE_CLIENT_SECRET=<同じ or 新しいClient Secret>

# メール（テナント個別設定で管理するため不要な場合あり）
# RESEND_API_KEY はtenant_settingsテーブルで管理`}</pre>
                </div>
              </div>
            </div>

            {/* STEP 5 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-shu text-white rounded-full font-bold text-sm flex-shrink-0">5</span>
                <h4 className="font-medium text-sumi">ドメイン設定</h4>
              </div>
              <div className="ml-11 space-y-2 text-sm text-ginnezumi">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Vercelプロジェクト → Settings → Domains</li>
                  <li>カスタムドメインを追加（例: <code className="bg-shironeri px-1 rounded">kimono.example.com</code>）</li>
                  <li>DNSレコード設定: <code className="bg-shironeri px-1 rounded">CNAME → cname.vercel-dns.com</code></li>
                  <li>SSL証明書は自動発行（Let&apos;s Encrypt）</li>
                </ol>
                <p className="mt-2">カスタムドメインが不要な場合はVercelの自動ドメイン（<code className="bg-shironeri px-1 rounded">azukari-banto-{"<slug>"}.vercel.app</code>）をそのまま使用。</p>
              </div>
            </div>

            {/* STEP 6 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-shu text-white rounded-full font-bold text-sm flex-shrink-0">6</span>
                <h4 className="font-medium text-sumi">共有プラットフォーム側の設定</h4>
              </div>
              <div className="ml-11 space-y-2 text-sm text-ginnezumi">
                <ol className="list-decimal list-inside space-y-1">
                  <li>上記テナント一覧でテナントの「編集」を開く</li>
                  <li>プランを <code className="bg-shironeri px-1 rounded">Premium</code> に変更</li>
                  <li>分離先URLに専用デプロイのURLを入力（例: <code className="bg-shironeri px-1 rounded">https://kimono.example.com</code>）</li>
                  <li>保存</li>
                </ol>
                <div className="bg-oudo/5 border border-oudo/20 p-3 rounded mt-2">
                  <p className="text-xs text-oudo font-medium">設定後の動作: 担当者が共有SaaSでこのテナントIDを入力すると、自動的に専用サーバーにリダイレクトされます。</p>
                </div>
              </div>
            </div>

            {/* STEP 7 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-shu text-white rounded-full font-bold text-sm flex-shrink-0">7</span>
                <h4 className="font-medium text-sumi">動作確認</h4>
              </div>
              <div className="ml-11 space-y-2 text-sm text-ginnezumi">
                <div className="space-y-1">
                  <p className="text-sumi font-medium text-xs">チェックリスト:</p>
                  <ul className="space-y-1">
                    <li className="flex items-start gap-2"><span className="text-sumi">&#9744;</span> 専用URLで担当者ログインできる</li>
                    <li className="flex items-start gap-2"><span className="text-sumi">&#9744;</span> 移行データ（商品・顧客・業者）が正しく表示される</li>
                    <li className="flex items-start gap-2"><span className="text-sumi">&#9744;</span> 写真が正しく表示される（R2パブリックURL）</li>
                    <li className="flex items-start gap-2"><span className="text-sumi">&#9744;</span> 新規受付登録 → 写真アップロードが動作する</li>
                    <li className="flex items-start gap-2"><span className="text-sumi">&#9744;</span> 管理者ログイン（Google OAuth）が動作する</li>
                    <li className="flex items-start gap-2"><span className="text-sumi">&#9744;</span> 共有SaaS側でテナントID入力 → リダイレクトされる</li>
                    <li className="flex items-start gap-2"><span className="text-sumi">&#9744;</span> アラートメール送信が動作する（設定済みの場合）</li>
                  </ul>
                </div>
                <div className="bg-oitake/5 border border-oitake/20 p-3 rounded mt-2">
                  <p className="text-xs text-oitake font-medium">全項目確認後、テナントのステータスを「有効」に戻して運用開始。</p>
                </div>
              </div>
            </div>

            {/* Standardへの切り戻し */}
            <div className="border-t border-usuzumi/20 pt-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-ginnezumi text-white rounded-full text-sm flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                </span>
                <h4 className="font-medium text-sumi">Standardへの切り戻し</h4>
              </div>
              <div className="ml-11 text-sm text-ginnezumi space-y-2">
                <ol className="list-decimal list-inside space-y-1">
                  <li>専用DBのデータを共有DBに再移行</li>
                  <li>R2写真を共有バケットにコピー</li>
                  <li>テナント編集 → プランを <code className="bg-shironeri px-1 rounded">Standard</code> に変更</li>
                  <li>分離先URLをクリア</li>
                  <li>専用Vercelプロジェクト・Supabaseプロジェクトを削除</li>
                </ol>
              </div>
            </div>

          </div>
        )}
      </div>

      <Modal
        isOpen={editingTenant !== null}
        onClose={handleCloseModal}
        title="テナント編集"
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
              <label className="block text-sm text-aitetsu mb-1">プラン</label>
              <select
                className="input w-full"
                value={editPlan}
                onChange={(e) => setEditPlan(e.target.value as 'standard' | 'premium')}
              >
                <option value="standard">Standard（共有SaaS）</option>
                <option value="premium">Premium（専用サーバー分離）</option>
              </select>
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
              onChange={(e) => setNewPlan(e.target.value as 'standard' | 'premium')}
            >
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
