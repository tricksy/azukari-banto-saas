'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ItemStatus } from '@/types';
import { ProductTypeLabel } from '@/types';
import { ItemDetailModal } from '@/components/worker/ItemDetailModal';
import {
  DashboardStatsSkeleton,
  WeeklyScheduleSkeleton,
} from '@/components/ui/Skeleton';

/** Snake_case item from Supabase API */
interface DashboardItem {
  item_number: string;
  reception_number?: string;
  customer_name?: string;
  customer_name_kana?: string;
  partner_id?: string;
  partner_name?: string;
  product_type: string;
  product_name: string;
  status: ItemStatus;
  is_claim_active?: boolean;
  is_paid_storage?: boolean;
  photo_front_url?: string;
  photo_back_url?: string;
  photo_after_front_url?: string;
  photo_after_back_url?: string;
  additional_photos?: string;
  vendor_id?: string;
  vendor_name?: string;
  scheduled_ship_date?: string;
  scheduled_return_date?: string;
  return_from_vendor_date?: string;
  created_at: string;
}

interface DashboardStats {
  received: number;
  pendingShip: number;
  processing: number;
  returned: number;
  shipOverdue: number;
  returnOverdue: number;
  paidStorage: number;
  claimActive: number;
}

interface OverdueItem {
  type: 'ship' | 'return';
  item: DashboardItem;
  overdueDays: number;
}

export default function WorkerDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    received: 0,
    pendingShip: 0,
    processing: 0,
    returned: 0,
    shipOverdue: 0,
    returnOverdue: 0,
    paidStorage: 0,
    claimActive: 0,
  });
  const [overdueItems, setOverdueItems] = useState<OverdueItem[]>([]);
  const [weekShipItems, setWeekShipItems] = useState<DashboardItem[]>([]);
  const [weekReturnItems, setWeekReturnItems] = useState<DashboardItem[]>([]);
  const [claimActiveItems, setClaimActiveItems] = useState<DashboardItem[]>([]);
  const [draftItems, setDraftItems] = useState<DashboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemNumber, setSelectedItemNumber] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // 1回のAPI呼び出しで全アクティブステータスの商品を取得（limit=100は上限）
      const res = await fetch(
        '/api/items?status=draft,received,pending_ship,processing,returned,paid_storage&limit=100'
      );
      const data = await res.json();
      const allItems: DashboardItem[] = data.items || [];

      // クライアント側でステータス別にフィルタリング
      const draftList = allItems.filter((item) => item.status === 'draft');
      const receivedList = allItems.filter((item) => item.status === 'received');
      const pendingShipList = allItems.filter((item) => item.status === 'pending_ship');
      const processingList = allItems.filter((item) => item.status === 'processing');
      const returnedList = allItems.filter((item) => item.status === 'returned');
      const paidStorageList = allItems.filter(
        (item) => item.is_paid_storage === true || String(item.is_paid_storage).toLowerCase() === 'true'
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 今週末（日曜日）を計算
      const weekEnd = new Date(today);
      const dayOfWeek = today.getDay();
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      weekEnd.setDate(weekEnd.getDate() + daysUntilSunday);
      weekEnd.setHours(23, 59, 59, 999);

      const overdueList: OverdueItem[] = [];

      // 発送予定日超過（received/pending_ship状態で発送予定日を過ぎている）
      const allPendingItems = [...receivedList, ...pendingShipList];
      const shipOverdueItems = allPendingItems.filter((item) => {
        if (!item.scheduled_ship_date) return false;
        const scheduledDate = new Date(item.scheduled_ship_date);
        return scheduledDate < today;
      });

      shipOverdueItems.forEach((item) => {
        const scheduledDate = new Date(item.scheduled_ship_date!);
        const days = Math.floor((today.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24));
        overdueList.push({ type: 'ship', item, overdueDays: days });
      });

      // 返送予定日超過（returned/paid_storage対象で返送予定日を過ぎている）
      const returnPendingNumbers = new Set([
        ...returnedList.map((i) => i.item_number),
        ...paidStorageList.map((i) => i.item_number),
      ]);
      const allReturnPendingItems = allItems.filter((item) =>
        returnPendingNumbers.has(item.item_number)
      );
      const returnOverdueItems = allReturnPendingItems.filter((item) => {
        if (!item.scheduled_return_date) return false;
        const scheduledDate = new Date(item.scheduled_return_date);
        return scheduledDate < today;
      });

      returnOverdueItems.forEach((item) => {
        const scheduledDate = new Date(item.scheduled_return_date!);
        const days = Math.floor((today.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24));
        overdueList.push({ type: 'return', item, overdueDays: days });
      });

      // 超過日数の多い順にソート
      overdueList.sort((a, b) => b.overdueDays - a.overdueDays);

      // 今週の業者への発送予定商品（pending_ship）
      const weekShip = pendingShipList
        .filter((item) => {
          if (!item.scheduled_ship_date) return false;
          const d = new Date(item.scheduled_ship_date);
          d.setHours(0, 0, 0, 0);
          return d >= today && d <= weekEnd;
        })
        .sort((a, b) => new Date(a.scheduled_ship_date!).getTime() - new Date(b.scheduled_ship_date!).getTime());

      // 今週の顧客への返送予定商品（returned + paid_storage）
      const weekReturn = allReturnPendingItems
        .filter((item) => {
          if (!item.scheduled_return_date) return false;
          const d = new Date(item.scheduled_return_date);
          d.setHours(0, 0, 0, 0);
          return d >= today && d <= weekEnd;
        })
        .sort((a, b) => new Date(a.scheduled_return_date!).getTime() - new Date(b.scheduled_return_date!).getTime());

      // クレーム対応中
      const claimItems = allItems.filter(
        (item) => item.is_claim_active === true || String(item.is_claim_active).toLowerCase() === 'true'
      );

      setStats({
        received: receivedList.length,
        pendingShip: pendingShipList.length,
        processing: processingList.length,
        returned: allReturnPendingItems.length,
        shipOverdue: shipOverdueItems.length,
        returnOverdue: returnOverdueItems.length,
        paidStorage: paidStorageList.length,
        claimActive: claimItems.length,
      });

      setOverdueItems(overdueList);
      setWeekShipItems(weekShip);
      setWeekReturnItems(weekReturn);
      setClaimActiveItems(claimItems);
      setDraftItems(draftList);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalOverdue = stats.shipOverdue + stats.returnOverdue;

  // アイテムからサムネイルURLを取得（加工後優先）
  const getThumbnailUrl = (item: DashboardItem): string | undefined => {
    return item.photo_after_front_url || item.photo_front_url;
  };

  // アイテムから全写真を取得
  const getItemPhotos = (item: DashboardItem): { url: string; label: string }[] => {
    const photos: { url: string; label: string }[] = [];
    const front = item.photo_after_front_url || item.photo_front_url;
    const back = item.photo_after_back_url || item.photo_back_url;
    if (front) photos.push({ url: front, label: '表面' });
    if (back) photos.push({ url: back, label: '裏面' });
    if (item.additional_photos) {
      try {
        const arr = JSON.parse(item.additional_photos);
        arr.forEach((p: { url?: string; memo?: string }, idx: number) => {
          if (p.url) photos.push({ url: p.url, label: p.memo || `追加${idx + 1}` });
        });
      } catch { /* ignore */ }
    }
    return photos;
  };

  // 日付ラベル（月/日(曜)形式、今日・明日は特別表示）
  const getDateLabel = (dateStr: string): string => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diff = Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const m = target.getMonth() + 1;
    const d = target.getDate();
    const dw = dayNames[target.getDay()];

    if (diff === 0) return `${m}/${d}(${dw}) 今日`;
    if (diff === 1) return `${m}/${d}(${dw}) 明日`;
    return `${m}/${d}(${dw})`;
  };

  // 預かり番号短縮表示
  const shortenItemNumber = (num: string): string => {
    const parts = num.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-${num.slice(-12)}`;
    }
    return num;
  };

  return (
    <div className="p-4 pb-20 sm:p-6 sm:pb-28">
      {/* 統計カード */}
      {isLoading ? (
        <DashboardStatsSkeleton />
      ) : (
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Link href="/orders" className="card p-4 hover:shadow-md transition-shadow">
              <p className="text-sm text-ginnezumi">業者へ未発送</p>
              <p className="text-3xl font-mincho text-shu mt-1">
                {stats.received + stats.pendingShip}
              </p>
            </Link>
            <Link href="/returns" className="card p-4 hover:shadow-md transition-shadow">
              <p className="text-sm text-ginnezumi">加工中</p>
              <p className="text-3xl font-mincho text-sumi mt-1">
                {stats.processing}
              </p>
            </Link>
            <Link href="/shipping" className="card p-4 hover:shadow-md transition-shadow">
              <p className="text-sm text-ginnezumi">顧客へ返送待ち</p>
              <p className="text-3xl font-mincho text-oitake mt-1">
                {stats.returned}
              </p>
            </Link>
            <div
              className={`card p-4 border-l-4 ${
                totalOverdue > 0
                  ? 'border-l-kokiake bg-kokiake/10'
                  : 'border-l-usuzumi/30'
              }`}
            >
              <p className="text-sm text-ginnezumi">期限超過</p>
              <p className={`text-3xl font-mincho mt-1 ${
                totalOverdue > 0 ? 'text-kokiake' : 'text-sumi'
              }`}>
                {totalOverdue}
              </p>
            </div>
          </div>
          {/* 有料預かり・クレーム対応中 */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/paid-storage"
              className={`card p-4 border-l-4 hover:shadow-md transition-shadow block ${
                stats.paidStorage > 0
                  ? 'border-l-oudo bg-oudo/10'
                  : 'border-l-usuzumi/30'
              }`}
            >
              <p className="text-sm text-ginnezumi">有料預かり</p>
              <p className={`text-3xl font-mincho mt-1 ${
                stats.paidStorage > 0 ? 'text-oudo' : 'text-sumi'
              }`}>
                {stats.paidStorage}
              </p>
            </Link>
            <div
              className={`card p-4 border-l-4 ${
                stats.claimActive > 0
                  ? 'border-l-kokiake bg-kokiake/10'
                  : 'border-l-usuzumi/30'
              }`}
            >
              <p className="text-sm text-ginnezumi">クレーム対応中</p>
              <p className={`text-3xl font-mincho mt-1 ${
                stats.claimActive > 0 ? 'text-kokiake' : 'text-sumi'
              }`}>
                {stats.claimActive}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 顧客未設定の商品（下書き） */}
      {!isLoading && draftItems.length > 0 && (
        <section className="mb-8 bg-oudo/5 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 border-y border-oudo/20">
          <h2 className="text-lg font-mincho mb-4 flex items-center gap-2 text-oudo">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            顧客未設定（{draftItems.length}件）
          </h2>
          <div className="space-y-2">
            {(() => {
              // 受付番号ごとにグループ化
              const grouped = draftItems.reduce((acc, item) => {
                const key = item.reception_number || item.item_number;
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
              }, {} as Record<string, DashboardItem[]>);

              const keys = Object.keys(grouped);
              return keys.slice(0, 5).map((receptionNumber) => {
                const groupItems = grouped[receptionNumber];
                const first = groupItems[0];
                const photos = getItemPhotos(first);
                return (
                  <div
                    key={receptionNumber}
                    onClick={() => router.push(`/reception?draft=${receptionNumber}`)}
                    className="card p-3 block hover:shadow-md transition-shadow border-l-4 border-l-oudo bg-white cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      {/* サムネイル */}
                      {photos.length > 0 && (
                        <div className="flex gap-1 flex-shrink-0 overflow-x-auto max-w-[120px]">
                          {photos.slice(0, 3).map((photo, idx) => (
                            <div
                              key={idx}
                              className="w-10 h-10 bg-white border border-usuzumi/20 overflow-hidden flex-shrink-0"
                            >
                              <img
                                src={photo.url}
                                alt={photo.label}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {photos.length > 3 && (
                            <div className="w-10 h-10 bg-gofun border border-usuzumi/20 flex items-center justify-center text-xs text-ginnezumi flex-shrink-0">
                              +{photos.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-1.5 py-0.5 bg-oudo/20 text-oudo flex-shrink-0">
                            顧客未設定
                          </span>
                          {groupItems.length > 1 && (
                            <span className="text-xs px-1.5 py-0.5 bg-kinari border border-usuzumi/20 text-sumi flex-shrink-0">
                              {groupItems.length}点
                            </span>
                          )}
                          <span className="text-xs px-1.5 py-0.5 bg-gofun border border-usuzumi/20 text-ginnezumi flex-shrink-0">
                            {ProductTypeLabel[first.product_type] || first.product_type}
                          </span>
                        </div>
                        <div className="text-xs text-ginnezumi mt-1 font-mono">
                          {receptionNumber.split('-')[0]}-{receptionNumber.slice(-12)}
                          {first.product_name && <span className="font-sans ml-2">{first.product_name}</span>}
                        </div>
                      </div>
                      <span className="text-oudo text-sm flex-shrink-0">顧客紐付け →</span>
                    </div>
                  </div>
                );
              });
            })()}
            {(() => {
              const grouped = draftItems.reduce((acc, item) => {
                const key = item.reception_number || item.item_number;
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
              }, {} as Record<string, DashboardItem[]>);
              const count = Object.keys(grouped).length;
              return count > 5 && (
                <p className="text-sm text-center text-oudo font-medium">
                  他 {count - 5}件の顧客未設定があります
                </p>
              );
            })()}
          </div>
        </section>
      )}

      {/* 期限超過の商品 */}
      {!isLoading && overdueItems.length > 0 && (
        <section className="mb-8 bg-kokiake/5 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 border-y border-kokiake/20">
          <h2 className="text-lg font-mincho mb-4 flex items-center gap-2 text-kokiake">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            期限超過の商品（{overdueItems.length}件）
          </h2>
          <div className="space-y-3">
            {overdueItems.slice(0, 5).map((overdue) => {
              const photos = getItemPhotos(overdue.item);
              return (
                <div
                  key={`${overdue.type}-${overdue.item.item_number}`}
                  onClick={() => setSelectedItemNumber(overdue.item.item_number)}
                  className="card p-3 block hover:shadow-md transition-shadow border-l-4 border-l-kokiake bg-white cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {/* サムネイル */}
                    {photos.length > 0 && (
                      <div className="flex gap-1 flex-shrink-0 overflow-x-auto max-w-[120px]">
                        {photos.slice(0, 3).map((photo, idx) => (
                          <div
                            key={idx}
                            className="w-10 h-10 bg-white border border-usuzumi/20 overflow-hidden flex-shrink-0"
                          >
                            <img
                              src={photo.url}
                              alt={photo.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {photos.length > 3 && (
                          <div className="w-10 h-10 bg-gofun border border-usuzumi/20 flex items-center justify-center text-xs text-ginnezumi flex-shrink-0">
                            +{photos.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sumi truncate">{overdue.item.customer_name || '顧客未設定'}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-kokiake/10 text-kokiake flex-shrink-0">
                            {overdue.type === 'ship' ? '発送' : '返送'}
                          </span>
                          {overdue.item.status === 'paid_storage' && (
                            <span className="text-xs px-1.5 py-0.5 bg-oudo/20 text-oudo flex-shrink-0">
                              有料預かり
                            </span>
                          )}
                          {(overdue.item.is_claim_active === true || String(overdue.item.is_claim_active).toLowerCase() === 'true') && (
                            <span className="text-xs px-1.5 py-0.5 bg-kokiake/20 text-kokiake border border-kokiake/30 flex-shrink-0">
                              クレーム対応中
                            </span>
                          )}
                          <span className="text-xs px-1.5 py-0.5 bg-gofun border border-usuzumi/20 text-ginnezumi flex-shrink-0">
                            {ProductTypeLabel[overdue.item.product_type] || overdue.item.product_type}
                          </span>
                        </div>
                        <div className="text-xs text-ginnezumi mt-0.5 font-mono">
                          {shortenItemNumber(overdue.item.item_number)}
                          {overdue.item.product_name && <span className="font-sans ml-2">{overdue.item.product_name}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium text-kokiake">
                          {overdue.overdueDays === 0 ? '本日期限' : `${overdue.overdueDays}日超過`}
                        </div>
                        <div className="text-xs text-ginnezumi">
                          {overdue.type === 'ship' ? overdue.item.scheduled_ship_date : overdue.item.scheduled_return_date}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {overdueItems.length > 5 && (
              <p className="text-sm text-center text-kokiake font-medium">
                他 {overdueItems.length - 5}件の超過があります
              </p>
            )}
          </div>
        </section>
      )}

      {/* クレーム対応中の商品 */}
      {!isLoading && claimActiveItems.length > 0 && (
        <section className="mb-8 bg-kokiake/5 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 border-y border-kokiake/20">
          <h2 className="text-lg font-mincho mb-4 flex items-center gap-2 text-kokiake">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            クレーム対応中（{claimActiveItems.length}件）
          </h2>
          <div className="space-y-3">
            {claimActiveItems.slice(0, 5).map((item) => {
              const photos = getItemPhotos(item);
              return (
                <div
                  key={item.item_number}
                  onClick={() => setSelectedItemNumber(item.item_number)}
                  className="card p-3 block hover:shadow-md transition-shadow border-l-4 border-l-kokiake bg-white cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {/* サムネイル */}
                    {photos.length > 0 && (
                      <div className="flex gap-1 flex-shrink-0">
                        {photos.slice(0, 2).map((photo, idx) => (
                          <div
                            key={idx}
                            className="w-12 h-12 bg-gofun border border-usuzumi/10 overflow-hidden"
                          >
                            <img
                              src={photo.url}
                              alt={photo.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {photos.length > 2 && (
                          <div className="w-12 h-12 bg-ginnezumi/20 border border-usuzumi/10 flex items-center justify-center text-xs text-ginnezumi">
                            +{photos.length - 2}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {item.partner_name && (
                        <p className="text-xs text-ginnezumi">{item.partner_name}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sumi truncate">{item.customer_name || '顧客未設定'}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-gofun border border-usuzumi/20 text-ginnezumi flex-shrink-0">
                          {ProductTypeLabel[item.product_type] || item.product_type}
                        </span>
                      </div>
                      <div className="text-xs text-ginnezumi mt-0.5 font-mono">
                        {shortenItemNumber(item.item_number)}
                        {item.product_name && <span className="font-sans ml-2">{item.product_name}</span>}
                      </div>
                    </div>
                    <span className="text-kokiake text-sm flex-shrink-0">→</span>
                  </div>
                </div>
              );
            })}
            {claimActiveItems.length > 5 && (
              <p className="text-sm text-center text-kokiake font-medium">
                他 {claimActiveItems.length - 5}件のクレーム対応中があります
              </p>
            )}
          </div>
        </section>
      )}

      {/* 今週の業者への発送予定 */}
      {isLoading ? (
        <WeeklyScheduleSkeleton title="今週の業者への発送予定" />
      ) : (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-mincho flex items-center gap-2">
              <span className="w-1 h-5 bg-shu"></span>
              今週の業者への発送予定
            </h2>
            <Link href="/orders" className="text-sm text-shu hover:underline">
              発注管理 →
            </Link>
          </div>
          <div className="card overflow-hidden">
            {weekShipItems.length === 0 ? (
              <div className="p-8 text-center text-ginnezumi">今週業者への発送予定の商品はありません</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-shironeri border-b border-usuzumi/20">
                  <tr>
                    <th className="px-3 py-2 text-left text-ginnezumi font-normal">予定</th>
                    <th className="px-3 py-2 text-left text-ginnezumi font-normal">取引先</th>
                    <th className="px-3 py-2 text-left text-ginnezumi font-normal">顧客名</th>
                    <th className="px-3 py-2 text-left text-ginnezumi font-normal">種別</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-usuzumi/10">
                  {weekShipItems.map((item) => {
                    const dateLabel = getDateLabel(item.scheduled_ship_date!);
                    const isToday = dateLabel.includes('今日');
                    const isTomorrow = dateLabel.includes('明日');
                    return (
                      <tr
                        key={item.item_number}
                        onClick={() => setSelectedItemNumber(item.item_number)}
                        className={`cursor-pointer ${isToday ? 'bg-shu/10 hover:bg-shu/20' : isTomorrow ? 'bg-oudo/10 hover:bg-oudo/20' : 'hover:bg-kinari/50'}`}
                      >
                        <td className="px-3 py-2 font-medium whitespace-nowrap text-sumi">
                          {dateLabel}
                        </td>
                        <td className="px-3 py-2 text-ginnezumi truncate max-w-[100px]">
                          {item.partner_name || '-'}
                        </td>
                        <td className="px-3 py-2 text-sumi truncate max-w-[100px]">
                          <span className="flex items-center gap-1">
                            {item.customer_name || '顧客未設定'}
                            {(item.is_claim_active === true || String(item.is_claim_active).toLowerCase() === 'true') && (
                              <span className="text-[10px] px-1 py-0.5 bg-kokiake/20 text-kokiake border border-kokiake/30 flex-shrink-0 whitespace-nowrap">
                                クレーム
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-ginnezumi">
                          {ProductTypeLabel[item.product_type] || item.product_type}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* 今週の顧客への返送予定 */}
      {isLoading ? (
        <WeeklyScheduleSkeleton title="今週の顧客への返送予定" />
      ) : (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-mincho flex items-center gap-2">
              <span className="w-1 h-5 bg-oitake"></span>
              今週の顧客への返送予定
            </h2>
            <Link href="/shipping" className="text-sm text-shu hover:underline">
              返送待ち一覧 →
            </Link>
          </div>
          <div className="card overflow-hidden">
            {weekReturnItems.length === 0 ? (
              <div className="p-8 text-center text-ginnezumi">今週顧客への返送予定の商品はありません</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-shironeri border-b border-usuzumi/20">
                  <tr>
                    <th className="px-3 py-2 text-left text-ginnezumi font-normal">予定</th>
                    <th className="px-3 py-2 text-left text-ginnezumi font-normal">取引先</th>
                    <th className="px-3 py-2 text-left text-ginnezumi font-normal">顧客名</th>
                    <th className="px-3 py-2 text-left text-ginnezumi font-normal">種別</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-usuzumi/10">
                  {weekReturnItems.map((item) => {
                    const dateLabel = getDateLabel(item.scheduled_return_date!);
                    const isToday = dateLabel.includes('今日');
                    const isTomorrow = dateLabel.includes('明日');
                    return (
                      <tr
                        key={item.item_number}
                        onClick={() => setSelectedItemNumber(item.item_number)}
                        className={`cursor-pointer ${isToday ? 'bg-shu/10 hover:bg-shu/20' : isTomorrow ? 'bg-oudo/10 hover:bg-oudo/20' : 'hover:bg-kinari/50'}`}
                      >
                        <td className="px-3 py-2 font-medium whitespace-nowrap text-sumi">
                          {dateLabel}
                        </td>
                        <td className="px-3 py-2 text-ginnezumi truncate max-w-[100px]">
                          {item.partner_name || '-'}
                        </td>
                        <td className="px-3 py-2 text-sumi truncate max-w-[100px]">
                          <span className="flex items-center gap-1">
                            {item.customer_name || '顧客未設定'}
                            {(item.is_claim_active === true || String(item.is_claim_active).toLowerCase() === 'true') && (
                              <span className="text-[10px] px-1 py-0.5 bg-kokiake/20 text-kokiake border border-kokiake/30 flex-shrink-0 whitespace-nowrap">
                                クレーム
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-ginnezumi">
                          {ProductTypeLabel[item.product_type] || item.product_type}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* 取扱説明書リンク */}
      <section className="mb-8">
        <Link
          href="/manual"
          className="p-4 block hover:shadow-lg transition-all bg-oudo/5 border border-oudo/30 border-l-4 border-l-oudo rounded shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-sumi" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-sumi font-medium">取扱説明書</span>
            </div>
            <svg className="w-5 h-5 text-ginnezumi" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </section>

      {/* 商品詳細モーダル */}
      <ItemDetailModal
        itemNumber={selectedItemNumber}
        onClose={() => setSelectedItemNumber(null)}
      />
    </div>
  );
}
