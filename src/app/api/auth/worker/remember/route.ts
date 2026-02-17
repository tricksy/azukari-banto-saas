import { NextRequest, NextResponse } from 'next/server';
import { createSession, verifyRememberToken } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * 記憶トークンによる自動ログイン
 * POST /api/auth/worker/remember
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'トークンが必要です' },
        { status: 400 }
      );
    }

    // トークンを検証
    const payload = verifyRememberToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'トークンが無効または期限切れです' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();

    // テナントが有効か確認
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, name, status')
      .eq('id', payload.tenantId)
      .single();

    if (!tenant || tenant.status !== 'active') {
      return NextResponse.json(
        { error: '店舗が利用停止中です' },
        { status: 403 }
      );
    }

    // 担当者がまだ有効か確認
    const { data: worker } = await supabase
      .from('workers')
      .select('worker_id, name, is_active')
      .eq('tenant_id', payload.tenantId)
      .eq('worker_id', payload.workerId)
      .eq('is_active', true)
      .single();

    if (!worker) {
      return NextResponse.json(
        { error: '担当者が無効です' },
        { status: 401 }
      );
    }

    // セッション作成
    await createSession({
      workerId: worker.worker_id,
      name: worker.name,
      role: 'worker',
      tenantId: payload.tenantId,
      tenantSlug: payload.tenantSlug,
      tenantName: tenant.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remember token auth error:', error);
    return NextResponse.json(
      { error: '認証処理でエラーが発生しました' },
      { status: 500 }
    );
  }
}
