'use client';

import { useState, useEffect, useCallback } from 'react';

interface Settings {
  alertEmailEnabled: boolean;
  alertEmail: string;
  resendApiKey: string;
  emailFrom: string;
  shipDeadlineDays: number;
  returnDeadlineDays: number;
  stagnationThresholdDays: number;
  autoArchiveDays: number;
  paidStorageGraceDays: number;
}

const defaultSettings: Settings = {
  alertEmailEnabled: false,
  alertEmail: '',
  resendApiKey: '',
  emailFrom: '',
  shipDeadlineDays: 7,
  returnDeadlineDays: 14,
  stagnationThresholdDays: 30,
  autoArchiveDays: 365,
  paidStorageGraceDays: 7,
};

function parseSettings(raw: Record<string, string>): Settings {
  return {
    alertEmailEnabled: raw.alertEmailEnabled === 'true',
    alertEmail: raw.alertEmail || '',
    resendApiKey: raw.resendApiKey || '',
    emailFrom: raw.emailFrom || '',
    shipDeadlineDays: Number(raw.shipDeadlineDays) || 7,
    returnDeadlineDays: Number(raw.returnDeadlineDays) || 14,
    stagnationThresholdDays: Number(raw.stagnationThresholdDays) || 30,
    autoArchiveDays: Number(raw.autoArchiveDays) || 365,
    paidStorageGraceDays: Number(raw.paidStorageGraceDays) || 7,
  };
}

function serializeSettings(s: Settings): Record<string, string> {
  return {
    alertEmailEnabled: String(s.alertEmailEnabled),
    alertEmail: s.alertEmail,
    resendApiKey: s.resendApiKey,
    emailFrom: s.emailFrom,
    shipDeadlineDays: String(s.shipDeadlineDays),
    returnDeadlineDays: String(s.returnDeadlineDays),
    stagnationThresholdDays: String(s.stagnationThresholdDays),
    autoArchiveDays: String(s.autoArchiveDays),
    paidStorageGraceDays: String(s.paidStorageGraceDays),
  };
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('取得失敗');
      const data = await res.json();
      setSettings(parseSettings(data.settings || {}));
    } catch {
      setMessage({ type: 'error', text: '設定の取得に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: serializeSettings(settings) }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存失敗');
      }
      setMessage({ type: 'success', text: '設定を保存しました' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存に失敗しました';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-shironeri animate-pulse w-48" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-shironeri animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-mincho text-sumi">システム設定</h2>

      {message && (
        <div className={`p-3 text-sm ${message.type === 'success' ? 'bg-oitake/10 text-oitake' : 'bg-kokiake/10 text-kokiake'}`}>
          {message.text}
        </div>
      )}

      {/* メール送信設定 */}
      <section className="card">
        <div className="card-header">
          <h3 className="font-mincho">メール送信設定</h3>
        </div>
        <div className="card-body space-y-4">
          <p className="text-xs text-ginnezumi">
            Resend（resend.com）のAPIキーを設定すると、アラートメール送信が有効になります。
            テナントごとに個別のアカウントを使用でき、無料枠（月3,000通）で運用できます。
          </p>
          <div>
            <label className="text-xs text-aitetsu block mb-1">Resend APIキー</label>
            <div className="flex gap-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={settings.resendApiKey}
                onChange={(e) =>
                  setSettings({ ...settings, resendApiKey: e.target.value })
                }
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
              value={settings.emailFrom}
              onChange={(e) =>
                setSettings({ ...settings, emailFrom: e.target.value })
              }
              className="form-input w-full"
              placeholder="noreply@your-domain.com（Resendでドメイン認証が必要）"
            />
          </div>
        </div>
      </section>

      {/* アラート設定 */}
      <section className="card">
        <div className="card-header">
          <h3 className="font-mincho">アラート設定</h3>
        </div>
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-aitetsu">アラートメール送信</label>
            <button
              type="button"
              onClick={() =>
                setSettings({ ...settings, alertEmailEnabled: !settings.alertEmailEnabled })
              }
              className={`relative inline-flex h-6 w-11 items-center transition-colors ${
                settings.alertEmailEnabled ? 'bg-oitake' : 'bg-usuzumi/30'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 bg-white transition-transform ${
                  settings.alertEmailEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div>
            <label className="text-xs text-aitetsu block mb-1">通知先メールアドレス</label>
            <input
              type="email"
              value={settings.alertEmail}
              onChange={(e) =>
                setSettings({ ...settings, alertEmail: e.target.value })
              }
              className="form-input w-full"
              placeholder="alert@example.com"
            />
          </div>
        </div>
      </section>

      {/* 期限設定 */}
      <section className="card">
        <div className="card-header">
          <h3 className="font-mincho">期限設定</h3>
        </div>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-aitetsu block mb-1">発送期限（日）</label>
              <input
                type="number"
                value={settings.shipDeadlineDays}
                onChange={(e) =>
                  setSettings({ ...settings, shipDeadlineDays: Number(e.target.value) })
                }
                className="form-input w-full"
                min={1}
              />
            </div>
            <div>
              <label className="text-xs text-aitetsu block mb-1">返送期限（日）</label>
              <input
                type="number"
                value={settings.returnDeadlineDays}
                onChange={(e) =>
                  setSettings({ ...settings, returnDeadlineDays: Number(e.target.value) })
                }
                className="form-input w-full"
                min={1}
              />
            </div>
            <div>
              <label className="text-xs text-aitetsu block mb-1">長期滞留閾値（日）</label>
              <input
                type="number"
                value={settings.stagnationThresholdDays}
                onChange={(e) =>
                  setSettings({ ...settings, stagnationThresholdDays: Number(e.target.value) })
                }
                className="form-input w-full"
                min={1}
              />
            </div>
            <div>
              <label className="text-xs text-aitetsu block mb-1">自動アーカイブ（日）</label>
              <input
                type="number"
                value={settings.autoArchiveDays}
                onChange={(e) =>
                  setSettings({ ...settings, autoArchiveDays: Number(e.target.value) })
                }
                className="form-input w-full"
                min={1}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 有料預かり設定 */}
      <section className="card">
        <div className="card-header">
          <h3 className="font-mincho">有料預かり設定</h3>
        </div>
        <div className="card-body">
          <div>
            <label className="text-xs text-aitetsu block mb-1">猶予日数</label>
            <input
              type="number"
              value={settings.paidStorageGraceDays}
              onChange={(e) =>
                setSettings({ ...settings, paidStorageGraceDays: Number(e.target.value) })
              }
              className="form-input w-32"
              min={0}
            />
          </div>
        </div>
      </section>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary disabled:opacity-50"
        >
          {isSaving ? '保存中...' : '設定を保存'}
        </button>
      </div>
    </div>
  );
}
