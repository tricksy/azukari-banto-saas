import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';

/**
 * 顧客検索（担当者API）
 * GET /api/customers?q=keyword&partner_id=UUID
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const partnerId = searchParams.get('partner_id');

  let query = supabase
    .from('customers')
    .select('id, partner_id, name, name_kana, phone, email, postal_code, address, notes')
    .eq('tenant_id', session.tenantId)
    .eq('is_active', true);

  if (q) {
    query = query.or(`name.ilike.%${q}%,name_kana.ilike.%${q}%`);
  }

  if (partnerId) {
    query = query.eq('partner_id', partnerId);
  }

  const { data: customers, error } = await query.order('name_kana', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: '顧客一覧の取得に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ customers: customers || [] });
}

/**
 * 顧客新規作成（担当者API）
 * POST /api/customers
 * Body: { name, partner_id?, name_kana?, phone?, email?, postal_code?, address?, notes? }
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await request.json();
  const { name, partner_id, name_kana, phone, email, postal_code, address, notes } = body;

  if (!name) {
    return NextResponse.json(
      { error: '顧客名は必須です' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      tenant_id: session.tenantId,
      name,
      partner_id: partner_id || null,
      name_kana: name_kana || null,
      phone: phone || null,
      email: email || null,
      postal_code: postal_code || null,
      address: address || null,
      notes: notes || null,
    })
    .select('id, partner_id, name, name_kana, phone, email, postal_code, address, notes')
    .single();

  if (error) {
    return NextResponse.json(
      { error: '顧客の作成に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, customer }, { status: 201 });
}
