import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';

/**
 * クレーム対応ログ一覧取得
 * GET /api/claims/[claimId]/logs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { claimId } = await params;
  const supabase = createServiceClient();

  // クレームの存在 + テナント確認
  const { data: claim, error: claimError } = await supabase
    .from('claims')
    .select('id')
    .eq('tenant_id', session.tenantId)
    .eq('id', claimId)
    .single();

  if (claimError || !claim) {
    return NextResponse.json(
      { error: 'クレームが見つかりません' },
      { status: 404 }
    );
  }

  const { data: logs, error } = await supabase
    .from('claim_logs')
    .select('*')
    .eq('claim_id', claimId)
    .eq('tenant_id', session.tenantId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[ClaimLogs] 一覧取得失敗:', error);
    return NextResponse.json(
      { error: 'ログの取得に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ logs: logs || [] });
}

/**
 * クレーム対応ログ追加
 * POST /api/claims/[claimId]/logs
 *
 * Body: { action, note }
 * action: 'updated' | 'resolved' | 'closed' | 'reopened'
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { claimId } = await params;
  const body = await request.json();
  const { action, note } = body;

  if (!note) {
    return NextResponse.json(
      { error: '対応内容（note）は必須です' },
      { status: 400 }
    );
  }

  const validActions = ['updated', 'resolved', 'closed', 'reopened'];
  if (!action || !validActions.includes(action)) {
    return NextResponse.json(
      { error: `action は ${validActions.join(', ')} のいずれかを指定してください` },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // クレームの存在 + テナント確認
  const { data: claim, error: claimError } = await supabase
    .from('claims')
    .select('id, item_number')
    .eq('tenant_id', session.tenantId)
    .eq('id', claimId)
    .single();

  if (claimError || !claim) {
    return NextResponse.json(
      { error: 'クレームが見つかりません' },
      { status: 404 }
    );
  }

  // ワーカーUUID取得
  const { data: worker } = await supabase
    .from('workers')
    .select('id, name')
    .eq('tenant_id', session.tenantId)
    .eq('worker_id', session.workerId)
    .single();

  if (!worker) {
    return NextResponse.json(
      { error: '担当者情報が取得できません' },
      { status: 400 }
    );
  }

  // ログ登録
  const { data: log, error: logError } = await supabase
    .from('claim_logs')
    .insert({
      tenant_id: session.tenantId,
      claim_id: claimId,
      item_number: claim.item_number,
      worker_id: worker.id,
      worker_name: worker.name,
      action,
      note,
    })
    .select('*')
    .single();

  if (logError) {
    console.error('[ClaimLogs] 登録失敗:', logError);
    return NextResponse.json(
      { error: 'ログの登録に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, log }, { status: 201 });
}
