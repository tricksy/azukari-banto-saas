import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createSession, createRememberToken } from '@/lib/auth';
import { checkLoginAttempt, recordLoginFailure, resetLoginAttempts } from '@/lib/rate-limit';
import { createServiceClient } from '@/lib/supabase/server';

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * 担当者PINコード認証
 * POST /api/auth/worker
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const { pin, tenantSlug } = await request.json();

    // レート制限チェック
    const attemptCheck = checkLoginAttempt(clientIP);
    if (attemptCheck.isLocked) {
      return NextResponse.json(
        {
          error: `ログイン試行回数の上限に達しました。${attemptCheck.lockExpiresIn}秒後に再試行してください`,
          isLocked: true,
          lockExpiresIn: attemptCheck.lockExpiresIn,
        },
        { status: 429 }
      );
    }

    if (!pin || typeof pin !== 'string' || pin.length !== 8) {
      return NextResponse.json(
        { error: 'PINコードは8桁で入力してください' },
        { status: 400 }
      );
    }

    if (!tenantSlug) {
      return NextResponse.json(
        { error: '店舗情報が取得できません' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // テナントを解決
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, status')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: '店舗が見つかりません' },
        { status: 404 }
      );
    }

    if (tenant.status !== 'active') {
      return NextResponse.json(
        { error: 'この店舗は現在利用停止中です' },
        { status: 403 }
      );
    }

    // テナントの有効な担当者を取得
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('worker_id, name, pin_hash, is_active')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true);

    if (workersError || !workers || workers.length === 0) {
      return NextResponse.json(
        { error: '担当者が登録されていません' },
        { status: 404 }
      );
    }

    // PINを照合
    let matchedWorker: (typeof workers)[0] | null = null;
    for (const worker of workers) {
      if (!worker.pin_hash) continue;
      const isMatch = await bcrypt.compare(pin, worker.pin_hash);
      if (isMatch) {
        matchedWorker = worker;
        break;
      }
    }

    if (!matchedWorker) {
      const failureResult = recordLoginFailure(clientIP);

      if (failureResult.isLocked) {
        return NextResponse.json(
          {
            error: `ログイン試行回数の上限に達しました。${failureResult.lockExpiresIn}秒後に再試行してください`,
            isLocked: true,
            lockExpiresIn: failureResult.lockExpiresIn,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: 'PINコードが正しくありません',
          remainingAttempts: failureResult.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // ログイン成功
    resetLoginAttempts(clientIP);

    // セッション作成（テナント情報を含む）
    await createSession({
      workerId: matchedWorker.worker_id,
      name: matchedWorker.name,
      role: 'worker',
      tenantId: tenant.id,
      tenantSlug,
    });

    // 記憶トークンを生成
    const rememberToken = createRememberToken(
      matchedWorker.worker_id,
      matchedWorker.name,
      tenant.id,
      tenantSlug
    );

    // ログイン履歴を記録（非同期、エラーは無視）
    supabase
      .from('operation_logs')
      .insert({
        tenant_id: tenant.id,
        worker_id: matchedWorker.worker_id,
        worker_name: matchedWorker.name,
        action: 'ログイン',
        target_type: 'auth',
        target_id: matchedWorker.worker_id,
        details: `IP: ${clientIP}`,
      })
      .then((res: { error: unknown }) => {
        if (res.error) console.error('Login log failed:', res.error);
      });

    return NextResponse.json({
      success: true,
      worker: {
        workerId: matchedWorker.worker_id,
        name: matchedWorker.name,
      },
      rememberToken,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: '認証処理でエラーが発生しました' },
      { status: 500 }
    );
  }
}
