import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { createSession, PLATFORM_TENANT_ID, PLATFORM_TENANT_SLUG } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

/**
 * 管理者Googleログイン
 * POST /api/auth/admin
 */
export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json(
        { error: '認証情報が不足しています' },
        { status: 400 }
      );
    }

    // Google IDトークンを検証
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return NextResponse.json(
        { error: 'Googleアカウント情報を取得できません' },
        { status: 400 }
      );
    }

    const email = payload.email;
    const name = payload.name || email;

    // platform_adminsテーブルで照合
    const supabase = createServiceClient();
    const { data: admin, error: dbError } = await supabase
      .from('platform_admins')
      .select('id, email, name, is_active')
      .eq('email', email)
      .single();

    if (dbError || !admin) {
      console.warn(`[AdminAuth] Unauthorized login attempt: ${email}`);
      return NextResponse.json(
        { error: 'このアカウントには管理者権限がありません' },
        { status: 403 }
      );
    }

    if (!admin.is_active) {
      return NextResponse.json(
        { error: 'このアカウントは無効化されています' },
        { status: 403 }
      );
    }

    // セッション作成
    await createSession({
      workerId: admin.id,
      name: admin.name || name,
      role: 'admin',
      tenantId: PLATFORM_TENANT_ID,
      tenantSlug: PLATFORM_TENANT_SLUG,
    });

    return NextResponse.json({
      success: true,
      admin: {
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error) {
    console.error('[AdminAuth] Error:', error);
    return NextResponse.json(
      { error: '認証処理でエラーが発生しました' },
      { status: 500 }
    );
  }
}
