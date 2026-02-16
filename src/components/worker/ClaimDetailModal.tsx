'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ClaimStatusLabel, ClaimCategoryLabel } from '@/types';
import type { ClaimStatus, ClaimCategory, ClaimLogAction } from '@/types';
import { toast } from '@/components/ui/Toast';

interface ClaimData {
  id: string;
  claim_id: string;
  item_number: string;
  status: ClaimStatus;
  category?: ClaimCategory;
  description: string;
  customer_name?: string;
  assignee_name?: string;
  due_date?: string;
  resolution?: string;
  created_by_name: string;
  resolved_at?: string;
  resolved_by_name?: string;
  created_at: string;
}

interface ClaimLogData {
  id: string;
  worker_name: string;
  action: ClaimLogAction;
  note: string;
  created_at: string;
}

interface ClaimDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string | null;
  onUpdate: () => void;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const actionLabels: Record<ClaimLogAction, string> = {
  opened: '登録',
  updated: '対応',
  resolved: '解決',
  closed: '完了',
  reopened: '再オープン',
};

const actionBadgeColors: Record<ClaimLogAction, string> = {
  opened: 'bg-aitetsu/10 text-aitetsu',
  updated: 'bg-oudo/10 text-oudo',
  resolved: 'bg-oitake/10 text-oitake',
  closed: 'bg-oitake/10 text-oitake',
  reopened: 'bg-shu/10 text-shu',
};

export function ClaimDetailModal({
  isOpen,
  onClose,
  claimId,
  onUpdate,
}: ClaimDetailModalProps) {
  const [claim, setClaim] = useState<ClaimData | null>(null);
  const [logs, setLogs] = useState<ClaimLogData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // インラインログフォーム
  const [showLogForm, setShowLogForm] = useState(false);
  const [logNote, setLogNote] = useState('');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // 解決フォーム
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolution, setResolution] = useState('');
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);

  // 再オープン
  const [isSubmittingReopen, setIsSubmittingReopen] = useState(false);

  const fetchClaim = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/claims/${encodeURIComponent(id)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'クレームの取得に失敗しました');
      }
      const data = await res.json();
      setClaim(data.claim);
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'クレームの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && claimId) {
      fetchClaim(claimId);
      setShowLogForm(false);
      setShowResolveForm(false);
      setLogNote('');
      setResolution('');
    } else {
      setClaim(null);
      setLogs([]);
    }
  }, [isOpen, claimId, fetchClaim]);

  // ログ追加
  const handleAddLog = async () => {
    if (!claimId || !logNote.trim()) return;

    setIsSubmittingLog(true);
    try {
      const res = await fetch(`/api/claims/${encodeURIComponent(claimId)}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updated', note: logNote.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'ログの追加に失敗しました');
      }

      toast.success('対応ログを追加しました');
      setLogNote('');
      setShowLogForm(false);
      fetchClaim(claimId);
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ログの追加に失敗しました');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // 解決済みにする
  const handleResolve = async () => {
    if (!claimId || !resolution.trim()) return;

    setIsSubmittingResolve(true);
    try {
      const res = await fetch(`/api/claims/${encodeURIComponent(claimId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed', resolution: resolution.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'クレームの解決に失敗しました');
      }

      toast.success('クレームを解決済みにしました');
      setResolution('');
      setShowResolveForm(false);
      fetchClaim(claimId);
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'クレームの解決に失敗しました');
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  // 再オープン
  const handleReopen = async () => {
    if (!claimId) return;

    setIsSubmittingReopen(true);
    try {
      const res = await fetch(`/api/claims/${encodeURIComponent(claimId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'open' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '再オープンに失敗しました');
      }

      toast.success('クレームを再オープンしました');
      fetchClaim(claimId);
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '再オープンに失敗しました');
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="クレーム詳細" size="lg">
      {isLoading && (
        <div className="space-y-4">
          <div className="h-6 bg-shironeri animate-pulse" />
          <div className="h-4 bg-shironeri animate-pulse w-3/4" />
          <div className="h-4 bg-shironeri animate-pulse w-1/2" />
          <div className="h-20 bg-shironeri animate-pulse" />
        </div>
      )}

      {error && (
        <div className="text-kokiake text-sm py-4 text-center">{error}</div>
      )}

      {!isLoading && claim && (
        <div className="space-y-6">
          {/* クレーム情報 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              {/* ステータスバッジ */}
              <span
                className={`badge ${
                  claim.status === 'open'
                    ? 'bg-shu/10 text-shu'
                    : 'bg-oitake/10 text-oitake'
                }`}
              >
                {ClaimStatusLabel[claim.status] || claim.status}
              </span>
              {/* カテゴリバッジ */}
              {claim.category && (
                <span
                  className={`badge ${getCategoryBadgeColor(claim.category)}`}
                >
                  {ClaimCategoryLabel[claim.category]}
                </span>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-ginnezumi">クレームID</dt>
              <dd className="font-mono text-xs text-sumi">{claim.claim_id}</dd>
              <dt className="text-ginnezumi">預かり番号</dt>
              <dd className="font-mono text-xs text-sumi">{claim.item_number}</dd>
              {claim.customer_name && (
                <>
                  <dt className="text-ginnezumi">顧客名</dt>
                  <dd className="text-sumi">{claim.customer_name}</dd>
                </>
              )}
              {claim.assignee_name && (
                <>
                  <dt className="text-ginnezumi">担当者</dt>
                  <dd className="text-sumi">{claim.assignee_name}</dd>
                </>
              )}
              <dt className="text-ginnezumi">対応期限</dt>
              <dd className="text-sumi">{formatDate(claim.due_date)}</dd>
              <dt className="text-ginnezumi">登録者</dt>
              <dd className="text-sumi">{claim.created_by_name}</dd>
              <dt className="text-ginnezumi">登録日</dt>
              <dd className="text-sumi">{formatDate(claim.created_at)}</dd>
            </dl>
          </section>

          {/* クレーム内容 */}
          <section>
            <h3 className="font-mincho text-sm text-sumi border-b border-usuzumi/20 pb-1 mb-3">
              クレーム内容
            </h3>
            <p className="text-sm text-aitetsu whitespace-pre-wrap">
              {claim.description}
            </p>
          </section>

          {/* 解決内容（closed の場合） */}
          {claim.status === 'closed' && claim.resolution && (
            <section>
              <h3 className="font-mincho text-sm text-sumi border-b border-usuzumi/20 pb-1 mb-3">
                解決内容
              </h3>
              <p className="text-sm text-aitetsu whitespace-pre-wrap">
                {claim.resolution}
              </p>
              {claim.resolved_by_name && (
                <p className="text-xs text-ginnezumi mt-2">
                  解決: {claim.resolved_by_name} ({formatDate(claim.resolved_at)})
                </p>
              )}
            </section>
          )}

          {/* アクションボタン */}
          <section className="flex gap-3">
            {claim.status === 'open' && (
              <>
                <button
                  onClick={() => {
                    setShowLogForm(!showLogForm);
                    setShowResolveForm(false);
                  }}
                  className="btn-secondary text-sm"
                >
                  対応ログを追加
                </button>
                <button
                  onClick={() => {
                    setShowResolveForm(!showResolveForm);
                    setShowLogForm(false);
                  }}
                  className="btn-primary text-sm"
                >
                  解決済みにする
                </button>
              </>
            )}
            {claim.status === 'closed' && (
              <button
                onClick={handleReopen}
                className="btn-secondary text-sm"
                disabled={isSubmittingReopen}
              >
                {isSubmittingReopen ? '処理中...' : '再オープン'}
              </button>
            )}
          </section>

          {/* インラインログフォーム */}
          {showLogForm && (
            <section className="p-3 bg-kinari/50 border border-usuzumi/20 space-y-3">
              <h4 className="text-sm font-medium text-sumi">対応ログ追加</h4>
              <textarea
                className="form-input w-full min-h-[80px] resize-y"
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                placeholder="対応内容を記入してください"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowLogForm(false);
                    setLogNote('');
                  }}
                  className="btn-secondary text-sm"
                  disabled={isSubmittingLog}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddLog}
                  className="btn-primary text-sm"
                  disabled={isSubmittingLog || !logNote.trim()}
                >
                  {isSubmittingLog ? '追加中...' : '追加'}
                </button>
              </div>
            </section>
          )}

          {/* 解決フォーム */}
          {showResolveForm && (
            <section className="p-3 bg-oitake/5 border border-oitake/20 space-y-3">
              <h4 className="text-sm font-medium text-sumi">解決内容を入力</h4>
              <textarea
                className="form-input w-full min-h-[80px] resize-y"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="解決内容を記入してください（必須）"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowResolveForm(false);
                    setResolution('');
                  }}
                  className="btn-secondary text-sm"
                  disabled={isSubmittingResolve}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleResolve}
                  className="btn-primary text-sm"
                  disabled={isSubmittingResolve || !resolution.trim()}
                >
                  {isSubmittingResolve ? '処理中...' : '解決済みにする'}
                </button>
              </div>
            </section>
          )}

          {/* ログタイムライン */}
          {logs.length > 0 && (
            <section>
              <h3 className="font-mincho text-sm text-sumi border-b border-usuzumi/20 pb-1 mb-3">
                対応ログ
              </h3>
              <div className="space-y-0">
                {logs.map((log, idx) => (
                  <div
                    key={log.id}
                    className="flex gap-3 py-2 border-b border-usuzumi/10 last:border-b-0"
                  >
                    {/* タイムライン */}
                    <div className="flex flex-col items-center flex-shrink-0 w-3">
                      <div className="w-2 h-2 bg-usuzumi/40 mt-1.5" />
                      {idx < logs.length - 1 && (
                        <div className="w-px flex-1 bg-usuzumi/20" />
                      )}
                    </div>
                    {/* ログ内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-ginnezumi">
                          {formatDateTime(log.created_at)}
                        </span>
                        <span className="text-aitetsu">
                          {log.worker_name}
                        </span>
                        <span
                          className={`badge text-xs ${
                            actionBadgeColors[log.action] || 'bg-ginnezumi/10 text-ginnezumi'
                          }`}
                        >
                          {actionLabels[log.action] || log.action}
                        </span>
                      </div>
                      <p className="text-sm text-aitetsu mt-0.5 whitespace-pre-wrap">
                        {log.note}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}

function getCategoryBadgeColor(category: ClaimCategory): string {
  const colors: Record<ClaimCategory, string> = {
    quality: 'bg-kokiake/10 text-kokiake',
    delivery: 'bg-oudo/10 text-oudo',
    response: 'bg-shu/10 text-shu',
    other: 'bg-ginnezumi/10 text-ginnezumi',
  };
  return colors[category] || 'bg-ginnezumi/10 text-ginnezumi';
}
