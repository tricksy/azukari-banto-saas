/**
 * スケルトンUIコンポーネント
 *
 * ローディング状態を視覚的に表示し、体感速度を向上させる
 * 侘寂デザインシステムに準拠したスタイリング
 */

interface SkeletonProps {
  className?: string;
}

/**
 * 基本スケルトン
 * animate-pulseでやわらかな点滅アニメーション
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-usuzumi/10 rounded ${className}`} />
  );
}

/**
 * 統計カード用スケルトン
 * ダッシュボードの数値表示カードに使用
 */
export function StatCardSkeleton() {
  return (
    <div className="card p-4">
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-12" />
    </div>
  );
}

/**
 * 強調表示付き統計カード用スケルトン
 * ボーダー付きの警告・強調カードに使用
 */
export function StatCardWithBorderSkeleton() {
  return (
    <div className="card p-4 border-l-4 border-l-usuzumi/30">
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-12" />
    </div>
  );
}

/**
 * テーブル行用スケルトン
 * 一覧表示のローディング時に使用
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-3 py-2">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/**
 * テーブル用スケルトン
 * 一覧テーブル全体のローディング表示
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-shironeri border-b border-usuzumi/20">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-3 py-2 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-usuzumi/10">
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  );
}

/**
 * アラートカード用スケルトン
 * 期限超過やクレーム対応中のアラート表示に使用
 */
export function AlertCardSkeleton() {
  return (
    <div className="card p-3 border-l-4 border-l-usuzumi/30 bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-3 w-32 mt-1" />
        </div>
        <div className="text-right flex-shrink-0">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-20 mt-1" />
        </div>
      </div>
    </div>
  );
}

/**
 * ダッシュボード統計セクション用スケルトン
 * 4カードグリッド + 2カードグリッドのセット
 */
export function DashboardStatsSkeleton() {
  return (
    <section className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardWithBorderSkeleton />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <StatCardWithBorderSkeleton />
        <StatCardWithBorderSkeleton />
      </div>
    </section>
  );
}

/**
 * 週間予定テーブルセクション用スケルトン
 */
export function WeeklyScheduleSkeleton({ title }: { title: string }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-1 h-5" />
          <h2 className="text-lg font-mincho">{title}</h2>
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="card overflow-hidden">
        <TableSkeleton rows={3} columns={4} />
      </div>
    </section>
  );
}
