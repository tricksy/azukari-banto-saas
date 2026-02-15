import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * テナント情報取得（公開API）
 * GET /api/tenant?slug=xxx
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json(
      { error: 'slug パラメータが必要です' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('slug, name, status, redirect_url')
    .eq('slug', slug)
    .single();

  if (error || !tenant) {
    return NextResponse.json(
      { error: '店舗が見つかりません' },
      { status: 404 }
    );
  }

  return NextResponse.json({ tenant });
}
