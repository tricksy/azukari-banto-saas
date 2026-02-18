import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';

/**
 * 有料預かり商品一覧取得（管理者API）
 * GET /api/admin/paid-storage?tenant_id=xxx&status=paid_storage|completed
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const status = searchParams.get('status');

  // テナント名マッピング取得
  const { data: tenants } = await supabase.from('tenants').select('id, slug, name');
  const tenantMap = new Map(
    (tenants || []).map((t: { id: string; slug: string; name: string }) => [t.id, t])
  );

  // クエリ構築
  let query = supabase
    .from('items')
    .select('id, tenant_id, item_number, reception_number, customer_name, product_name, product_type, vendor_name, status, paid_storage_start_date, created_at')
    .eq('is_paid_storage', true)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: '有料預かり一覧の取得に失敗しました' },
      { status: 500 }
    );
  }

  // テナント名・slug を付与
  const items = (data || []).map((item: Record<string, unknown>) => ({
    ...item,
    tenant_name: (tenantMap.get(item.tenant_id as string) as { name: string } | undefined)?.name || '不明',
    tenant_slug: (tenantMap.get(item.tenant_id as string) as { slug: string } | undefined)?.slug || '',
  }));

  return NextResponse.json({ items });
}
