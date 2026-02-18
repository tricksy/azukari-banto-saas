import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';

/**
 * 顧客ID生成（C + ランダム3文字）
 * 紛らわしい文字（0/O, 1/I/L）を除外
 */
function generateCustomerId(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 3; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `C${suffix}`;
}

/**
 * 顧客一覧取得（管理者API）
 * GET /api/admin/customers
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');

  let query = supabase
    .from('customers')
    .select('id, tenant_id, customer_id, partner_id, partner_name, name, name_kana, phone, email, postal_code, address, notes, is_active, created_at')
    .order('created_at', { ascending: true });

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: customers, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: '顧客一覧の取得に失敗しました' },
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

  const customersWithTenant = (customers || []).map((c: Record<string, unknown>) => ({
    ...c,
    tenant_name: (tenantMap.get(c.tenant_id as string) as { name: string } | undefined)?.name || '',
    tenant_slug: (tenantMap.get(c.tenant_id as string) as { slug: string } | undefined)?.slug || '',
  }));

  return NextResponse.json({ customers: customersWithTenant });
}

/**
 * 顧客新規作成（管理者API）
 * POST /api/admin/customers
 * Body: { tenant_id, name, name_kana?, partner_id?, partner_name?, phone?, email?, postal_code?, address?, notes? }
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 });
  }

  const body = await request.json();
  const { tenant_id, name, name_kana, partner_id, partner_name, phone, email, postal_code, address, notes } = body;

  if (!tenant_id || !name?.trim()) {
    return NextResponse.json(
      { error: 'テナントIDと顧客名は必須です' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // 顧客ID自動生成（衝突時リトライ）
  let customer_id = '';
  for (let i = 0; i < 10; i++) {
    const candidate = generateCustomerId();
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('customer_id', candidate)
      .single();
    if (!existing) {
      customer_id = candidate;
      break;
    }
  }

  if (!customer_id) {
    return NextResponse.json(
      { error: '顧客IDの生成に失敗しました。再度お試しください' },
      { status: 500 }
    );
  }

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      tenant_id,
      customer_id,
      name: name.trim(),
      name_kana: name_kana?.trim() || null,
      partner_id: partner_id || null,
      partner_name: partner_name?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      postal_code: postal_code?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
    })
    .select('id, tenant_id, customer_id, partner_id, partner_name, name, name_kana, phone, email, postal_code, address, notes, is_active, created_at')
    .single();

  if (error) {
    return NextResponse.json(
      { error: '顧客の作成に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, customer }, { status: 201 });
}

/**
 * 顧客情報更新（管理者API）
 * PUT /api/admin/customers
 * Body: { id, name, name_kana?, partner_id?, partner_name?, phone?, email?, postal_code?, address?, notes? }
 */
export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, name_kana, partner_id, partner_name, phone, email, postal_code, address, notes } = body;

  if (!id || !name?.trim()) {
    return NextResponse.json(
      { error: 'id と顧客名は必須です' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: customer, error } = await supabase
    .from('customers')
    .update({
      name: name.trim(),
      name_kana: name_kana?.trim() || null,
      partner_id: partner_id || null,
      partner_name: partner_name?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      postal_code: postal_code?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
    })
    .eq('id', id)
    .select('id, tenant_id, customer_id, partner_id, partner_name, name, name_kana, phone, email, postal_code, address, notes, is_active, created_at')
    .single();

  if (error) {
    return NextResponse.json(
      { error: '顧客の更新に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, customer });
}

/**
 * 顧客ステータス切替（管理者API）
 * PATCH /api/admin/customers
 * Body: { id, action: 'toggle_active' }
 */
export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 });
  }

  const body = await request.json();
  const { id, action } = body;

  if (!id || !action) {
    return NextResponse.json(
      { error: 'id と action は必須です' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // 対象の顧客を取得
  const { data: current, error: fetchError } = await supabase
    .from('customers')
    .select('id, is_active')
    .eq('id', id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json(
      { error: '顧客が見つかりません' },
      { status: 404 }
    );
  }

  if (action === 'toggle_active') {
    const { data: customer, error } = await supabase
      .from('customers')
      .update({ is_active: !current.is_active })
      .eq('id', id)
      .select('id, tenant_id, customer_id, partner_id, partner_name, name, name_kana, phone, email, postal_code, address, notes, is_active, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'ステータスの変更に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, customer });
  }

  return NextResponse.json(
    { error: '無効なアクションです' },
    { status: 400 }
  );
}
