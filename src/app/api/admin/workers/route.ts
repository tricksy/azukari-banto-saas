import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * 担当者一覧取得（管理者API）
 * GET /api/admin/workers
 */
export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');

  let query = supabase
    .from('workers')
    .select('id, tenant_id, worker_id, name, email, is_active, last_login_at, created_at')
    .order('created_at', { ascending: true });

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: workers, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: '担当者一覧の取得に失敗しました' },
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

  const workersWithTenant = (workers || []).map((w: Record<string, unknown>) => ({
    ...w,
    tenant_name: (tenantMap.get(w.tenant_id as string) as { name: string } | undefined)?.name || '',
    tenant_slug: (tenantMap.get(w.tenant_id as string) as { slug: string } | undefined)?.slug || '',
  }));

  return NextResponse.json({ workers: workersWithTenant });
}

/**
 * 担当者新規作成（管理者API）
 * POST /api/admin/workers
 * Body: { tenant_id, worker_id, name, pin, email? }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tenant_id, worker_id, name, pin, email } = body;

  if (!tenant_id || !worker_id || !name || !pin) {
    return NextResponse.json(
      { error: 'テナントID、担当者ID、担当者名、PINは必須です' },
      { status: 400 }
    );
  }

  if (!/^\d{8}$/.test(pin)) {
    return NextResponse.json(
      { error: 'PINコードは8桁の数字で入力してください' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // 重複チェック
  const { data: existing } = await supabase
    .from('workers')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('worker_id', worker_id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'この担当者IDは既に使用されています' },
      { status: 409 }
    );
  }

  const pin_hash = await bcrypt.hash(pin, 10);

  const { data: worker, error } = await supabase
    .from('workers')
    .insert({
      tenant_id,
      worker_id,
      name,
      pin_hash,
      email: email || null,
    })
    .select('id, tenant_id, worker_id, name, email, is_active, last_login_at, created_at')
    .single();

  if (error) {
    return NextResponse.json(
      { error: '担当者の作成に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, worker }, { status: 201 });
}

/**
 * 担当者情報更新（管理者API）
 * PUT /api/admin/workers
 * Body: { id, name, email? }
 */
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, email } = body;

  if (!id || !name) {
    return NextResponse.json(
      { error: 'id と担当者名は必須です' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: worker, error } = await supabase
    .from('workers')
    .update({ name, email: email || null })
    .eq('id', id)
    .select('id, tenant_id, worker_id, name, email, is_active, last_login_at, created_at')
    .single();

  if (error) {
    return NextResponse.json(
      { error: '担当者の更新に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, worker });
}

/**
 * 担当者ステータス切替 / PIN再設定（管理者API）
 * PATCH /api/admin/workers
 * Body: { id, action: 'toggle_active' | 'reset_pin', pin? }
 */
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, action, pin } = body;

  if (!id || !action) {
    return NextResponse.json(
      { error: 'id と action は必須です' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // 対象の担当者を取得
  const { data: current, error: fetchError } = await supabase
    .from('workers')
    .select('id, is_active')
    .eq('id', id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json(
      { error: '担当者が見つかりません' },
      { status: 404 }
    );
  }

  if (action === 'toggle_active') {
    const { data: worker, error } = await supabase
      .from('workers')
      .update({ is_active: !current.is_active })
      .eq('id', id)
      .select('id, tenant_id, worker_id, name, email, is_active, last_login_at, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'ステータスの変更に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, worker });
  }

  if (action === 'reset_pin') {
    if (!pin || !/^\d{8}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PINコードは8桁の数字で入力してください' },
        { status: 400 }
      );
    }

    const pin_hash = await bcrypt.hash(pin, 10);

    const { data: worker, error } = await supabase
      .from('workers')
      .update({ pin_hash })
      .eq('id', id)
      .select('id, tenant_id, worker_id, name, email, is_active, last_login_at, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'PINの再設定に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, worker });
  }

  return NextResponse.json(
    { error: '無効なアクションです' },
    { status: 400 }
  );
}
