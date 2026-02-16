'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClaimStatusLabel, ClaimCategoryLabel } from '@/types';
import type { ClaimStatus, ClaimCategory } from '@/types';
import { NewClaimModal } from './NewClaimModal';
import { ClaimDetailModal } from './ClaimDetailModal';

interface ClaimSummary {
  id: string;
  claim_id: string;
  status: ClaimStatus;
  category?: ClaimCategory;
  description: string;
  created_at: string;
  due_date?: string;
}

interface ClaimSectionProps {
  itemNumber: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'short',
    day: 'numeric',
  });
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

export function ClaimSection({ itemNumber }: ClaimSectionProps) {
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/claims?item_number=${encodeURIComponent(itemNumber)}`
      );
      if (!res.ok) throw new Error('クレームの取得に失敗しました');
      const data = await res.json();
      setClaims(data.claims || []);
    } catch (err) {
      console.error('Failed to fetch claims:', err);
    } finally {
      setIsLoading(false);
    }
  }, [itemNumber]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const activeClaims = claims.filter((c) => c.status === 'open');
  const closedClaims = claims.filter(
    (c) => c.status === 'closed' || c.status === 'resolved'
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mincho text-sm text-sumi border-b border-usuzumi/20 pb-1 flex-1">
          クレーム
          {activeClaims.length > 0 && (
            <span className="ml-2 badge bg-shu/10 text-shu text-xs">
              {activeClaims.length}件対応中
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowNewClaim(true)}
          className="btn-secondary text-xs ml-3"
        >
          クレーム登録
        </button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <div className="h-10 bg-shironeri animate-pulse" />
          <div className="h-10 bg-shironeri animate-pulse" />
        </div>
      )}

      {!isLoading && claims.length === 0 && (
        <p className="text-sm text-ginnezumi py-2">クレームはありません</p>
      )}

      {!isLoading && claims.length > 0 && (
        <div className="space-y-2">
          {/* アクティブなクレーム */}
          {activeClaims.map((claim) => (
            <button
              key={claim.id}
              onClick={() => setSelectedClaimId(claim.id)}
              className="w-full text-left p-2 bg-shu/5 border border-shu/10 hover:bg-shu/10 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="badge bg-shu/10 text-shu text-xs">
                  {ClaimStatusLabel[claim.status]}
                </span>
                {claim.category && (
                  <span
                    className={`badge text-xs ${getCategoryBadgeColor(
                      claim.category
                    )}`}
                  >
                    {ClaimCategoryLabel[claim.category]}
                  </span>
                )}
                <span className="text-xs text-ginnezumi ml-auto">
                  {formatDate(claim.created_at)}
                </span>
              </div>
              <p className="text-sm text-aitetsu truncate">
                {claim.description}
              </p>
            </button>
          ))}

          {/* 完了済みクレーム */}
          {closedClaims.map((claim) => (
            <button
              key={claim.id}
              onClick={() => setSelectedClaimId(claim.id)}
              className="w-full text-left p-2 bg-shironeri border border-usuzumi/10 hover:bg-kinari/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="badge bg-oitake/10 text-oitake text-xs">
                  {ClaimStatusLabel[claim.status]}
                </span>
                {claim.category && (
                  <span
                    className={`badge text-xs ${getCategoryBadgeColor(
                      claim.category
                    )}`}
                  >
                    {ClaimCategoryLabel[claim.category]}
                  </span>
                )}
                <span className="text-xs text-ginnezumi ml-auto">
                  {formatDate(claim.created_at)}
                </span>
              </div>
              <p className="text-sm text-ginnezumi truncate">
                {claim.description}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* 新規クレームモーダル */}
      <NewClaimModal
        isOpen={showNewClaim}
        onClose={() => setShowNewClaim(false)}
        itemNumber={itemNumber}
        onSuccess={fetchClaims}
      />

      {/* クレーム詳細モーダル */}
      <ClaimDetailModal
        isOpen={selectedClaimId !== null}
        onClose={() => setSelectedClaimId(null)}
        claimId={selectedClaimId}
        onUpdate={fetchClaims}
      />
    </section>
  );
}
