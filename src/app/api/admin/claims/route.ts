import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * クレーム一覧取得（管理者API）
 * GET /api/admin/claims?tenant_id=xxx&status=open|closed&search=xxx
 */
export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  // テナント名マッピング取得
  const { data: tenants } = await supabase.from('tenants').select('id, slug, name');
  const tenantMap = new Map(
    (tenants || []).map((t: { id: string; slug: string; name: string }) => [t.id, t])
  );

  // クエリ構築
  let query = supabase
    .from('claims')
    .select('*')
    .order('created_at', { ascending: false });

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    const sanitized = search.replace(/[,.()"'\\%]/g, '');
    if (sanitized) {
      query = query.or(
        `claim_id.ilike.%${sanitized}%,item_number.ilike.%${sanitized}%,customer_name.ilike.%${sanitized}%`
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'クレーム一覧の取得に失敗しました' },
      { status: 500 }
    );
  }

  // テナント名・slug を付与
  const claims = (data || []).map((claim: Record<string, unknown>) => ({
    ...claim,
    tenant_name: (tenantMap.get(claim.tenant_id as string) as { name: string } | undefined)?.name || '不明',
    tenant_slug: (tenantMap.get(claim.tenant_id as string) as { slug: string } | undefined)?.slug || '',
  }));

  return NextResponse.json({ claims });
}
