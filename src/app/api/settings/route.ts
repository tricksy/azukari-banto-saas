import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';

/**
 * テナント設定取得（担当者API）
 * GET /api/settings
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: rows, error } = await supabase
    .from('tenant_settings')
    .select('key, value')
    .eq('tenant_id', session.tenantId);

  if (error) {
    return NextResponse.json(
      { error: '設定の取得に失敗しました' },
      { status: 500 }
    );
  }

  const settings: Record<string, string> = {};
  for (const row of rows || []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json({ settings });
}
