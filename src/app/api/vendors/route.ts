import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';

/**
 * 業者一覧取得（担当者API）
 * GET /api/vendors
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('id, vendor_id, name, name_kana, phone, email, postal_code, address, specialty, notes, is_active')
    .eq('tenant_id', session.tenantId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: '業者一覧の取得に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ vendors: vendors || [] });
}
