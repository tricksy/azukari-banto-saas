import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getJSTDateString } from '@/lib/date';

/**
 * ダッシュボード集計データ取得（管理者API）
 * GET /api/admin/dashboard?tenant_id=xxx
 */
export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');

  // テナント名マッピング取得
  const { data: tenants } = await supabase.from('tenants').select('id, slug, name');
  type TenantInfo = { id: string; slug: string; name: string };
  const tenantMap = new Map<string, TenantInfo>(
    (tenants || []).map((t: TenantInfo) => [t.id, t])
  );

  // 今日の日付（JST）
  const today = getJSTDateString();
  // 30日前
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // --- アラート集計（並列実行） ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyTenantFilter = (query: any) => {
    if (tenantId) {
      return query.eq('tenant_id', tenantId);
    }
    return query;
  };

  const [
    shipOverdueRes,
    returnOverdueRes,
    longStagnationRes,
    onHoldRes,
    claimActiveRes,
    workflowRes,
    recentLogsRes,
  ] = await Promise.all([
    // 発送予定超過: scheduled_ship_date < today AND status = 'pending_ship'
    applyTenantFilter(
      supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .lt('scheduled_ship_date', today)
        .eq('status', 'pending_ship')
        .eq('is_archived', false)
    ),
    // 返送予定超過: scheduled_return_date < today AND status IN ('processing', 'returned')
    applyTenantFilter(
      supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .lt('scheduled_return_date', today)
        .in('status', ['processing', 'returned'])
        .eq('is_archived', false)
    ),
    // 長期滞留: status IN ('pending_ship','processing') AND updated_at < 30 days ago
    applyTenantFilter(
      supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending_ship', 'processing'])
        .lt('updated_at', thirtyDaysAgo)
        .eq('is_archived', false)
    ),
    // 返送保留: status = 'on_hold'
    applyTenantFilter(
      supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'on_hold')
        .eq('is_archived', false)
    ),
    // クレーム対応中: claims WHERE status = 'open'
    applyTenantFilter(
      supabase
        .from('claims')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open')
    ),
    // ワークフロー: items grouped by status (non-archived)
    applyTenantFilter(
      supabase
        .from('items')
        .select('status')
        .eq('is_archived', false)
    ),
    // 最近の操作ログ: ORDER BY created_at DESC LIMIT 20
    (() => {
      let q = supabase
        .from('operation_logs')
        .select('id, tenant_id, worker_name, action, target_type, target_id, details, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      if (tenantId) {
        q = q.eq('tenant_id', tenantId);
      }
      return q;
    })(),
  ]);

  // エラーチェック
  if (workflowRes.error || recentLogsRes.error) {
    return NextResponse.json(
      { error: 'ダッシュボードデータの取得に失敗しました' },
      { status: 500 }
    );
  }

  // ワークフロー集計
  const workflowData = workflowRes.data || [];
  const statusCounts: Record<string, number> = {};
  for (const item of workflowData) {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
  }

  // 操作ログにテナント名を付与
  const recentLogs = (recentLogsRes.data || []).map((log: {
    id: string;
    tenant_id: string;
    worker_name: string;
    action: string;
    target_type: string;
    target_id: string;
    details: string;
    created_at: string;
  }) => ({
    ...log,
    tenant_name: tenantMap.get(log.tenant_id)?.name || '不明',
    tenant_slug: tenantMap.get(log.tenant_id)?.slug || '',
  }));

  return NextResponse.json({
    alerts: {
      shipOverdue: shipOverdueRes.count || 0,
      returnOverdue: returnOverdueRes.count || 0,
      longStagnation: longStagnationRes.count || 0,
      onHold: onHoldRes.count || 0,
      claimActive: claimActiveRes.count || 0,
    },
    workflow: {
      received: statusCounts['received'] || 0,
      pendingShip: statusCounts['pending_ship'] || 0,
      processing: statusCounts['processing'] || 0,
      returned: statusCounts['returned'] || 0,
      completed: statusCounts['completed'] || 0,
      paidStorage: statusCounts['paid_storage'] || 0,
    },
    recentLogs,
  });
}
