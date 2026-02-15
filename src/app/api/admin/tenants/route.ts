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
 * テナントの redirect_url 更新（管理者API）
 * PUT /api/admin/tenants
 * Body: { id: string, redirect_url: string | null }
 */
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, redirect_url } = body;

  if (!id) {
    return NextResponse.json(
      { error: 'id は必須です' },
      { status: 400 }
    );
  }

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

  const supabase = createServiceClient();

  const { data: tenant, error } = await supabase
    .from('tenants')
    .update({ redirect_url: normalizedUrl })
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
