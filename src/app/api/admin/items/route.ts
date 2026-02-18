import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * 商品一覧取得（管理者API）
 * GET /api/admin/items?tenant_id=xxx&status=xxx&search=xxx&is_paid_storage=true
 */
export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const isPaidStorage = searchParams.get('is_paid_storage');

  // テナント名マッピング取得
  const { data: tenants } = await supabase.from('tenants').select('id, slug, name');
  type TenantInfo = { id: string; slug: string; name: string };
  const tenantMap = new Map<string, TenantInfo>(
    (tenants || []).map((t: TenantInfo) => [t.id, t])
  );

  // クエリ構築
  let query = supabase
    .from('items')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (isPaidStorage === 'true') {
    query = query.eq('is_paid_storage', true);
  }

  if (search) {
    const sanitized = search.replace(/[,.()"'\\%]/g, '');
    if (sanitized) {
      query = query.or(
        `item_number.ilike.%${sanitized}%,customer_name.ilike.%${sanitized}%,product_name.ilike.%${sanitized}%`
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: '商品一覧の取得に失敗しました' },
      { status: 500 }
    );
  }

  // テナント名・slug を付与
  const items = (data || []).map((item: Record<string, unknown>) => ({
    ...item,
    tenant_name: tenantMap.get(item.tenant_id as string)?.name || '不明',
    tenant_slug: tenantMap.get(item.tenant_id as string)?.slug || '',
  }));

  return NextResponse.json({ items });
}
