/**
 * パンくずリストコンポーネント
 *
 * 現在地を表示し、ナビゲーションを提供
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  /** 表示名 */
  label: string;
  /** リンク先（nullの場合はリンクなし） */
  href: string | null;
}

interface BreadcrumbProps {
  /** パンくずリスト項目 */
  items?: BreadcrumbItem[];
  /** ホームリンク */
  homeHref?: string;
  /** ホームラベル */
  homeLabel?: string;
}

/**
 * パス名からパンくずリストを自動生成
 */
function generateBreadcrumbFromPath(pathname: string, isAdmin: boolean): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];

  // 担当者画面と管理者画面で異なるマッピング
  const workerRouteLabels: Record<string, string> = {
    dashboard: 'ダッシュボード',
    reception: '受付登録',
    items: '商品一覧',
    orders: '発注管理',
    returns: '返却受入',
    shipping: '返送管理',
    'paid-storage': '有料預かり',
  };

  const adminRouteLabels: Record<string, string> = {
    dashboard: 'ダッシュボード',
    items: '商品一覧',
    partners: '取引先管理',
    vendors: '業者管理',
    customers: '顧客管理',
    workers: '担当者管理',
    claims: 'クレーム管理',
    logs: '操作ログ',
    settings: '設定',
  };

  const routeLabels = isAdmin ? adminRouteLabels : workerRouteLabels;
  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // adminプレフィックスはスキップ
    if (segment === 'admin') {
      currentPath += '/admin';
      continue;
    }

    // 動的セグメント（IDなど）はスキップまたは「詳細」に置き換え
    if (segment.match(/^[A-Z][0-9]+-/)) {
      // 商品番号パターン
      items.push({
        label: '詳細',
        href: null, // 現在地なのでリンクなし
      });
      continue;
    }

    currentPath += `/${segment}`;
    const label = routeLabels[segment];

    if (label) {
      // 最後の要素でなければリンクを設定
      const isLast = i === segments.length - 1;
      items.push({
        label,
        href: isLast ? null : currentPath,
      });
    }
  }

  return items;
}

/**
 * パンくずリストコンポーネント
 *
 * @example
 * // 自動生成
 * <Breadcrumb />
 *
 * // カスタム項目
 * <Breadcrumb items={[
 *   { label: '商品一覧', href: '/items' },
 *   { label: '詳細', href: null }
 * ]} />
 */
export function Breadcrumb({
  items,
  homeHref,
  homeLabel = 'ホーム',
}: BreadcrumbProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  // 自動生成または指定されたアイテムを使用
  const breadcrumbItems = items ?? generateBreadcrumbFromPath(pathname, isAdmin);

  // ホームリンクのデフォルト設定
  const resolvedHomeHref = homeHref ?? (isAdmin ? '/admin/dashboard' : '/dashboard');

  // アイテムがない場合は表示しない
  if (breadcrumbItems.length === 0) return null;

  return (
    <nav aria-label="パンくずリスト" className="mb-4">
      <ol className="flex items-center gap-2 text-sm text-ginnezumi">
        {/* ホーム */}
        <li>
          <Link
            href={resolvedHomeHref}
            className="hover:text-shu transition-colors"
          >
            {homeLabel}
          </Link>
        </li>

        {/* 各項目 */}
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="text-usuzumi/50">/</span>
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-shu transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-sumi font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
