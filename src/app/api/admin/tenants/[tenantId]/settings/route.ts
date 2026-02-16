import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/** 保存可能な設定キー */
const ALLOWED_KEYS = [
  'alertEmailEnabled',
  'alertEmail',
  'resendApiKey',
  'emailFrom',
  'shipDeadlineDays',
  'returnDeadlineDays',
  'stagnationThresholdDays',
  'autoArchiveDays',
  'paidStorageGraceDays',
];

/**
 * テナント個別設定取得（プラットフォーム管理者API）
 * GET /api/admin/tenants/[tenantId]/settings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;

  const supabase = createServiceClient();

  const { data: rows, error } = await supabase
    .from('tenant_settings')
    .select('key, value')
    .eq('tenant_id', tenantId);

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

/**
 * テナント個別設定保存（プラットフォーム管理者API）
 * PUT /api/admin/tenants/[tenantId]/settings
 * Body: { settings: Record<string, string> }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;

  const body = await request.json();
  const incoming = body.settings as Record<string, string> | undefined;

  if (!incoming || typeof incoming !== 'object') {
    return NextResponse.json(
      { error: '設定データが不正です' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const errors: string[] = [];

  for (const [key, value] of Object.entries(incoming)) {
    if (!ALLOWED_KEYS.includes(key)) {
      continue;
    }

    const { error } = await supabase
      .from('tenant_settings')
      .upsert(
        { tenant_id: tenantId, key, value: String(value) },
        { onConflict: 'tenant_id,key' }
      );

    if (error) {
      errors.push(`${key}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: '一部の設定の保存に失敗しました', details: errors },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
