import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';

/**
 * 取引先一覧取得（担当者API）
 * GET /api/partners
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: partners, error } = await supabase
    .from('partners')
    .select('id, partner_code, name, name_kana, contact_person, phone, email, postal_code, address, notes, is_active')
    .eq('tenant_id', session.tenantId)
    .eq('is_active', true)
    .order('name_kana', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: '取引先一覧の取得に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ partners: partners || [] });
}
