import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * 取引先ID生成（P + ランダム3文字）
 * 紛らわしい文字（0/O, 1/I/L）を除外
 */
function generatePartnerId(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 3; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `P${suffix}`;
}

/**
 * 取引先一覧取得（管理者API）
 * GET /api/admin/partners
 */
export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');

  let query = supabase
    .from('partners')
    .select('id, tenant_id, partner_id, partner_code, partner_name, name_kana, contact_person, phone, fax, email, postal_code, address, notes, is_active, created_at')
    .order('created_at', { ascending: true });

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: partners, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: '取引先一覧の取得に失敗しました' },
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

  const partnersWithTenant = (partners || []).map((p: Record<string, unknown>) => ({
    ...p,
    tenant_name: (tenantMap.get(p.tenant_id as string) as { name: string } | undefined)?.name || '',
    tenant_slug: (tenantMap.get(p.tenant_id as string) as { slug: string } | undefined)?.slug || '',
  }));

  return NextResponse.json({ partners: partnersWithTenant });
}

/**
 * 取引先新規作成（管理者API）
 * POST /api/admin/partners
 * Body: { tenant_id, partner_name, partner_code?, name_kana?, contact_person?, phone?, fax?, email?, postal_code?, address?, notes? }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tenant_id, partner_name, partner_code, name_kana, contact_person, phone, fax, email, postal_code, address, notes } = body;

  if (!tenant_id || !partner_name?.trim()) {
    return NextResponse.json(
      { error: 'テナントIDと取引先名は必須です' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // 取引先ID自動生成（衝突時リトライ）
  let partner_id = '';
  for (let i = 0; i < 10; i++) {
    const candidate = generatePartnerId();
    const { data: existing } = await supabase
      .from('partners')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('partner_id', candidate)
      .single();
    if (!existing) {
      partner_id = candidate;
      break;
    }
  }

  if (!partner_id) {
    return NextResponse.json(
      { error: '取引先IDの生成に失敗しました。再度お試しください' },
      { status: 500 }
    );
  }

  const { data: partner, error } = await supabase
    .from('partners')
    .insert({
      tenant_id,
      partner_id,
      partner_code: partner_code?.trim() || null,
      partner_name: partner_name.trim(),
      name_kana: name_kana?.trim() || null,
      contact_person: contact_person?.trim() || null,
      phone: phone?.trim() || null,
      fax: fax?.trim() || null,
      email: email?.trim() || null,
      postal_code: postal_code?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
    })
    .select('id, tenant_id, partner_id, partner_code, partner_name, name_kana, contact_person, phone, fax, email, postal_code, address, notes, is_active, created_at')
    .single();

  if (error) {
    return NextResponse.json(
      { error: '取引先の作成に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, partner }, { status: 201 });
}

/**
 * 取引先情報更新（管理者API）
 * PUT /api/admin/partners
 * Body: { id, partner_name, partner_code?, name_kana?, contact_person?, phone?, fax?, email?, postal_code?, address?, notes? }
 */
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, partner_name, partner_code, name_kana, contact_person, phone, fax, email, postal_code, address, notes } = body;

  if (!id || !partner_name?.trim()) {
    return NextResponse.json(
      { error: 'id と取引先名は必須です' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: partner, error } = await supabase
    .from('partners')
    .update({
      partner_name: partner_name.trim(),
      partner_code: partner_code?.trim() || null,
      name_kana: name_kana?.trim() || null,
      contact_person: contact_person?.trim() || null,
      phone: phone?.trim() || null,
      fax: fax?.trim() || null,
      email: email?.trim() || null,
      postal_code: postal_code?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
    })
    .eq('id', id)
    .select('id, tenant_id, partner_id, partner_code, partner_name, name_kana, contact_person, phone, fax, email, postal_code, address, notes, is_active, created_at')
    .single();

  if (error) {
    return NextResponse.json(
      { error: '取引先の更新に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, partner });
}

/**
 * 取引先ステータス切替（管理者API）
 * PATCH /api/admin/partners
 * Body: { id, action: 'toggle_active' }
 */
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, action } = body;

  if (!id || !action) {
    return NextResponse.json(
      { error: 'id と action は必須です' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // 対象の取引先を取得
  const { data: current, error: fetchError } = await supabase
    .from('partners')
    .select('id, is_active')
    .eq('id', id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json(
      { error: '取引先が見つかりません' },
      { status: 404 }
    );
  }

  if (action === 'toggle_active') {
    const { data: partner, error } = await supabase
      .from('partners')
      .update({ is_active: !current.is_active })
      .eq('id', id)
      .select('id, tenant_id, partner_id, partner_code, partner_name, name_kana, contact_person, phone, fax, email, postal_code, address, notes, is_active, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'ステータスの変更に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, partner });
  }

  return NextResponse.json(
    { error: '無効なアクションです' },
    { status: 400 }
  );
}
