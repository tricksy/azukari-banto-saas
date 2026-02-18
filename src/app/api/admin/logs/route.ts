import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';

/**
 * 操作ログ一覧取得（管理者API）
 * GET /api/admin/logs
 * Query params: tenant_id, date_from, date_to, target_type, tab
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const targetType = searchParams.get('target_type');
  const tab = searchParams.get('tab') || 'operations';

  let query = supabase
    .from('operation_logs')
    .select('id, tenant_id, worker_id, worker_name, action, target_type, target_id, details, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  // タブによるフィルタ
  if (tab === 'auth') {
    query = query.eq('target_type', 'auth');
  } else {
    query = query.neq('target_type', 'auth');
  }

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }

  if (dateTo) {
    // 終了日の翌日まで含める
    const nextDay = new Date(dateTo);
    nextDay.setDate(nextDay.getDate() + 1);
    query = query.lt('created_at', nextDay.toISOString().split('T')[0]);
  }

  if (targetType && targetType !== 'all') {
    query = query.eq('target_type', targetType);
  }

  const { data: logs, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: '操作ログの取得に失敗しました' },
      { status: 500 }
    );
  }

  // テナント情報を取得してマッピング
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, slug, name');

  const tenantMap = new Map(
    (tenants || []).map((t: { id: string; slug: string; name: string }) => [t.id, t])
  );

  const logsWithTenant = (logs || []).map((l: Record<string, unknown>) => ({
    ...l,
    tenant_name: (tenantMap.get(l.tenant_id as string) as { name: string } | undefined)?.name || '',
    tenant_slug: (tenantMap.get(l.tenant_id as string) as { slug: string } | undefined)?.slug || '',
  }));

  return NextResponse.json({ logs: logsWithTenant });
}
