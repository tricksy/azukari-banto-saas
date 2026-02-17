import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * テナント一覧取得（管理者API）
 * GET /api/admin/tenants
 */
export async function GET() {
  const supabase = createServiceClient();

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('id, slug, name, plan, status, redirect_url, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: 'テナント一覧の取得に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ tenants });
}

/**
 * テナント新規作成（管理者API）
 * POST /api/admin/tenants
 * Body: { name: string, slug: string, plan?: string }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, slug, plan } = body;

  if (!name || !slug) {
    return NextResponse.json(
      { error: '店舗名とテナントIDは必須です' },
      { status: 400 }
    );
  }

  // slug: 4桁16進数（大文字）
  const normalizedSlug = slug.toUpperCase();
  if (!/^[0-9A-F]{4}$/.test(normalizedSlug)) {
    return NextResponse.json(
      { error: 'テナントIDは4桁の16進数（0-9, A-F）で入力してください' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // 重複チェック
  const { data: existing } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', normalizedSlug)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'このテナントIDは既に使用されています' },
      { status: 409 }
    );
  }

  const { data: tenant, error } = await supabase
    .from('tenants')
    .insert({
      name,
      slug: normalizedSlug,
      plan: plan || 'standard',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'テナントの作成に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, tenant }, { status: 201 });
}

/**
 * テナントのプラン・redirect_url 更新（管理者API）
 * PUT /api/admin/tenants
 * Body: { id: string, plan?: 'standard' | 'premium', redirect_url?: string | null }
 */
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, plan, redirect_url } = body;

  if (!id) {
    return NextResponse.json(
      { error: 'id は必須です' },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};

  // plan
  if (plan !== undefined) {
    if (plan !== 'standard' && plan !== 'premium') {
      return NextResponse.json(
        { error: 'plan は standard または premium のみ指定できます' },
        { status: 400 }
      );
    }
    updateData.plan = plan;
  }

  // redirect_url
  if (redirect_url !== undefined) {
    const normalizedUrl = redirect_url === '' ? null : redirect_url ?? null;
    if (normalizedUrl !== null) {
      try {
        new URL(normalizedUrl);
      } catch {
        return NextResponse.json(
          { error: '無効なURL形式です' },
          { status: 400 }
        );
      }
    }
    updateData.redirect_url = normalizedUrl;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: '更新するフィールドがありません' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: tenant, error } = await supabase
    .from('tenants')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'テナントの更新に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, tenant });
}

/**
 * テナントステータス変更（管理者API）
 * PATCH /api/admin/tenants
 * Body: { id: string, status: 'active' | 'suspended' }
 */
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json(
      { error: 'id と status は必須です' },
      { status: 400 }
    );
  }

  if (status !== 'active' && status !== 'suspended') {
    return NextResponse.json(
      { error: 'status は active または suspended のみ指定できます' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // 現在のテナント取得
  const { data: current, error: fetchError } = await supabase
    .from('tenants')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json(
      { error: 'テナントが見つかりません' },
      { status: 404 }
    );
  }

  if (current.status === 'cancelled') {
    return NextResponse.json(
      { error: '解約済みテナントのステータスは変更できません' },
      { status: 400 }
    );
  }

  if (current.status === status) {
    return NextResponse.json(
      { error: '既に同じステータスです' },
      { status: 400 }
    );
  }

  const { data: tenant, error } = await supabase
    .from('tenants')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'ステータスの変更に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, tenant });
}
