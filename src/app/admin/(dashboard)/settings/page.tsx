'use client';

import { useState, useEffect } from 'react';

interface Settings {
  alertEmailEnabled: boolean;
  alertRecipients: string;
  shipDeadlineDays: number;
  returnDeadlineDays: number;
  stagnationThresholdDays: number;
  autoArchiveDays: number;
  paidStorageGraceDays: number;
}

const defaultSettings: Settings = {
  alertEmailEnabled: true,
  alertRecipients: '',
  shipDeadlineDays: 7,
  returnDeadlineDays: 14,
  stagnationThresholdDays: 30,
  autoArchiveDays: 365,
  paidStorageGraceDays: 7,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Supabase APIからデータ取得
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Supabase APIに保存
      console.log('Saving settings:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
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

      {/* アラート設定 */}
      <section className="card">
        <div className="card-header">
          <h3 className="font-mincho">アラート設定</h3>
        </div>
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-aitetsu">アラートメール送信</label>
            <input
              type="checkbox"
              checked={settings.alertEmailEnabled}
              onChange={(e) =>
                setSettings({ ...settings, alertEmailEnabled: e.target.checked })
              }
            />
          </div>
          <div>
            <label className="text-xs text-aitetsu block mb-1">送信先メールアドレス</label>
            <input
              type="text"
              value={settings.alertRecipients}
              onChange={(e) =>
                setSettings({ ...settings, alertRecipients: e.target.value })
              }
              className="input w-full"
              placeholder="カンマ区切りで複数指定可"
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
                className="input w-full"
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
                className="input w-full"
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
                className="input w-full"
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
                className="input w-full"
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
              className="input w-32"
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
