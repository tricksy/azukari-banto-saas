import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';
import { logOperation } from '@/lib/log';

/**
 * クレーム詳細取得
 * GET /api/claims/[claimId]
 *
 * claimId は claims テーブルの UUID (id カラム)
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

  // クレーム取得
  const { data: claim, error: claimError } = await supabase
    .from('claims')
    .select('*')
    .eq('tenant_id', session.tenantId)
    .eq('id', claimId)
    .single();

  if (claimError || !claim) {
    return NextResponse.json(
      { error: 'クレームが見つかりません' },
      { status: 404 }
    );
  }

  // ログ取得
  const { data: logs } = await supabase
    .from('claim_logs')
    .select('*')
    .eq('claim_id', claimId)
    .eq('tenant_id', session.tenantId)
    .order('created_at', { ascending: true });

  return NextResponse.json({ claim, logs: logs || [] });
}

/**
 * クレーム更新
 * PATCH /api/claims/[claimId]
 *
 * Body: { status?, description?, category?, assignee_id?, due_date?, resolution? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { claimId } = await params;
  const body = await request.json();
  const supabase = createServiceClient();

  // 現在のクレームを取得
  const { data: currentClaim, error: fetchError } = await supabase
    .from('claims')
    .select('*')
    .eq('tenant_id', session.tenantId)
    .eq('id', claimId)
    .single();

  if (fetchError || !currentClaim) {
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

  // 更新データ構築
  const updateData: Record<string, unknown> = {};
  const allowedFields = ['status', 'description', 'category', 'assignee_id', 'due_date', 'resolution'];

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  // assignee_name の自動解決
  if (body.assignee_id) {
    const { data: assignee } = await supabase
      .from('workers')
      .select('name')
      .eq('id', body.assignee_id)
      .eq('tenant_id', session.tenantId)
      .single();
    updateData.assignee_name = assignee?.name ?? null;
  }

  // ステータスが closed に変わる場合
  const isClosing = body.status === 'closed' && currentClaim.status !== 'closed';
  if (isClosing) {
    updateData.resolved_at = new Date().toISOString();
    updateData.resolved_by = worker.id;
    updateData.resolved_by_name = worker.name;
  }

  // ステータスが再オープンされる場合
  const isReopening = body.status === 'open' && currentClaim.status === 'closed';
  if (isReopening) {
    updateData.resolved_at = null;
    updateData.resolved_by = null;
    updateData.resolved_by_name = null;
    updateData.resolution = null;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: '更新するフィールドが指定されていません' },
      { status: 400 }
    );
  }

  // クレームを更新
  const { data: updatedClaim, error: updateError } = await supabase
    .from('claims')
    .update(updateData)
    .eq('tenant_id', session.tenantId)
    .eq('id', claimId)
    .select('*')
    .single();

  if (updateError) {
    console.error('[Claims] 更新失敗:', updateError);
    return NextResponse.json(
      { error: 'クレームの更新に失敗しました' },
      { status: 500 }
    );
  }

  // ステータス変更時のログと商品フラグ更新
  if (isClosing) {
    // クローズ時: claim_log 追加
    await supabase.from('claim_logs').insert({
      tenant_id: session.tenantId,
      claim_id: claimId,
      item_number: currentClaim.item_number,
      worker_id: worker.id,
      worker_name: worker.name,
      action: 'closed',
      note: body.resolution || '解決済み',
    });

    // 他にオープンなクレームがなければ商品の is_claim_active を false に
    const { count } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', session.tenantId)
      .eq('item_number', currentClaim.item_number)
      .eq('status', 'open')
      .neq('id', claimId);

    if (count === 0) {
      await supabase
        .from('items')
        .update({ is_claim_active: false })
        .eq('tenant_id', session.tenantId)
        .eq('item_number', currentClaim.item_number);
    }
  }

  if (isReopening) {
    // 再オープン時: claim_log 追加
    await supabase.from('claim_logs').insert({
      tenant_id: session.tenantId,
      claim_id: claimId,
      item_number: currentClaim.item_number,
      worker_id: worker.id,
      worker_name: worker.name,
      action: 'reopened',
      note: '再オープン',
    });

    // 商品の is_claim_active を true に
    await supabase
      .from('items')
      .update({ is_claim_active: true })
      .eq('tenant_id', session.tenantId)
      .eq('item_number', currentClaim.item_number);
  }

  // 操作ログ
  await logOperation(
    supabase,
    session.tenantId,
    worker.id,
    'update',
    'item',
    currentClaim.item_number,
    { claim_id: currentClaim.claim_id, action: isClosing ? 'claim_closed' : isReopening ? 'claim_reopened' : 'claim_updated', changes: updateData }
  );

  return NextResponse.json({ success: true, claim: updatedClaim });
}
