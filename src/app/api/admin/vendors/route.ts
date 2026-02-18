import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';

/**
 * 業者ID生成（V + ランダム3文字）
 * 紛らわしい文字（0/O, 1/I/L）を除外
 */
function generateVendorId(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 3; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `V${suffix}`;
}

/**
 * 業者一覧取得（管理者API）
 * GET /api/admin/vendors
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
    .from('vendors')
    .select('id, tenant_id, vendor_id, name, name_kana, phone, email, postal_code, address, specialty, notes, is_active, created_at')
    .order('created_at', { ascending: true });

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: vendors, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: '業者一覧の取得に失敗しました' },
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

  const vendorsWithTenant = (vendors || []).map((v: Record<string, unknown>) => ({
    ...v,
    tenant_name: (tenantMap.get(v.tenant_id as string) as { name: string } | undefined)?.name || '',
    tenant_slug: (tenantMap.get(v.tenant_id as string) as { slug: string } | undefined)?.slug || '',
  }));

  return NextResponse.json({ vendors: vendorsWithTenant });
}

/**
 * 業者新規作成（管理者API）
 * POST /api/admin/vendors
 * Body: { tenant_id, name, name_kana?, phone?, email?, postal_code?, address?, specialty?, notes? }
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 });
  }

  const body = await request.json();
  const { tenant_id, name, name_kana, phone, email, postal_code, address, specialty, notes } = body;

  if (!tenant_id || !name?.trim()) {
    return NextResponse.json(
      { error: 'テナントIDと業者名は必須です' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // 業者ID自動生成（衝突時リトライ）
  let vendor_id = '';
  for (let i = 0; i < 10; i++) {
    const candidate = generateVendorId();
    const { data: existing } = await supabase
      .from('vendors')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('vendor_id', candidate)
      .single();
    if (!existing) {
      vendor_id = candidate;
      break;
    }
  }

  if (!vendor_id) {
    return NextResponse.json(
      { error: '業者IDの生成に失敗しました。再度お試しください' },
      { status: 500 }
    );
  }

  const { data: vendor, error } = await supabase
    .from('vendors')
    .insert({
      tenant_id,
      vendor_id,
      name: name.trim(),
      name_kana: name_kana?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      postal_code: postal_code?.trim() || null,
      address: address?.trim() || null,
      specialty: specialty?.trim() || null,
      notes: notes?.trim() || null,
    })
    .select('id, tenant_id, vendor_id, name, name_kana, phone, email, postal_code, address, specialty, notes, is_active, created_at')
    .single();

  if (error) {
    return NextResponse.json(
      { error: '業者の作成に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, vendor }, { status: 201 });
}

/**
 * 業者情報更新（管理者API）
 * PUT /api/admin/vendors
 * Body: { id, name, name_kana?, phone?, email?, postal_code?, address?, specialty?, notes? }
 */
export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, name_kana, phone, email, postal_code, address, specialty, notes } = body;

  if (!id || !name?.trim()) {
    return NextResponse.json(
      { error: 'id と業者名は必須です' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: vendor, error } = await supabase
    .from('vendors')
    .update({
      name: name.trim(),
      name_kana: name_kana?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      postal_code: postal_code?.trim() || null,
      address: address?.trim() || null,
      specialty: specialty?.trim() || null,
      notes: notes?.trim() || null,
    })
    .eq('id', id)
    .select('id, tenant_id, vendor_id, name, name_kana, phone, email, postal_code, address, specialty, notes, is_active, created_at')
    .single();

  if (error) {
    return NextResponse.json(
      { error: '業者の更新に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, vendor });
}

/**
 * 業者ステータス切替（管理者API）
 * PATCH /api/admin/vendors
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

  // 対象の業者を取得
  const { data: current, error: fetchError } = await supabase
    .from('vendors')
    .select('id, is_active')
    .eq('id', id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json(
      { error: '業者が見つかりません' },
      { status: 404 }
    );
  }

  if (action === 'toggle_active') {
    const { data: vendor, error } = await supabase
      .from('vendors')
      .update({ is_active: !current.is_active })
      .eq('id', id)
      .select('id, tenant_id, vendor_id, name, name_kana, phone, email, postal_code, address, specialty, notes, is_active, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'ステータスの変更に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, vendor });
  }

  return NextResponse.json(
    { error: '無効なアクションです' },
    { status: 400 }
  );
}
