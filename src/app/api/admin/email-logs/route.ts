import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * メール送信履歴取得（管理者API）
 * GET /api/admin/email-logs
 * Query params: tenant_id, email_type
 */
export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const emailType = searchParams.get('email_type');

  let query = supabase
    .from('email_logs')
    .select('id, tenant_id, email_type, to_address, subject, body, status, error_message, sent_at, created_at')
    .order('sent_at', { ascending: false })
    .limit(200);

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  if (emailType && emailType !== 'all') {
    query = query.eq('email_type', emailType);
  }

  const { data: logs, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'メール送信履歴の取得に失敗しました' },
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
