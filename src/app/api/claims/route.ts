import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';
import { logOperation } from '@/lib/log';

/**
 * クレーム一覧取得
 * GET /api/claims
 *
 * Query params:
 *   ?status=open       — ステータスフィルタ (open | closed)
 *   ?item_number=xxx   — 商品番号フィルタ
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const itemNumber = searchParams.get('item_number');

  let query = supabase
    .from('claims')
    .select('*')
    .eq('tenant_id', session.tenantId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (itemNumber) {
    query = query.eq('item_number', itemNumber);
  }

  const { data: claims, error } = await query;

  if (error) {
    console.error('[Claims] 一覧取得失敗:', error);
    return NextResponse.json(
      { error: 'クレーム一覧の取得に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ claims: claims || [] });
}

/**
 * クレーム新規登録
 * POST /api/claims
 *
 * Body: { item_number, description, category?, assignee_id?, due_date? }
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await request.json();
  const { item_number, description, category, assignee_id, due_date } = body;

  if (!item_number || !description) {
    return NextResponse.json(
      { error: 'item_number と description は必須です' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // 商品の存在確認 + テナント一致チェック
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('id, tenant_id, customer_name')
    .eq('tenant_id', session.tenantId)
    .eq('item_number', item_number)
    .single();

  if (itemError || !item) {
    return NextResponse.json(
      { error: '指定された商品が見つかりません' },
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

  // アサイン担当者名取得（指定がある場合）
  let assigneeName: string | null = null;
  if (assignee_id) {
    const { data: assignee } = await supabase
      .from('workers')
      .select('name')
      .eq('id', assignee_id)
      .single();
    assigneeName = assignee?.name ?? null;
  }

  // クレームID生成: CLM-YYYYMMDDHHmmss
  const now = new Date();
  const jst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const claimId = `CLM-${jst.getFullYear()}${String(jst.getMonth() + 1).padStart(2, '0')}${String(jst.getDate()).padStart(2, '0')}${String(jst.getHours()).padStart(2, '0')}${String(jst.getMinutes()).padStart(2, '0')}${String(jst.getSeconds()).padStart(2, '0')}`;

  // クレーム登録
  const insertData: Record<string, unknown> = {
    tenant_id: session.tenantId,
    claim_id: claimId,
    item_id: item.id,
    item_number,
    customer_name: item.customer_name ?? null,
    status: 'open',
    description,
    created_by: worker.id,
    created_by_name: worker.name,
  };

  if (category) insertData.category = category;
  if (assignee_id) {
    insertData.assignee_id = assignee_id;
    insertData.assignee_name = assigneeName;
  }
  if (due_date) insertData.due_date = due_date;

  const { data: claim, error: claimError } = await supabase
    .from('claims')
    .insert(insertData)
    .select('*')
    .single();

  if (claimError) {
    console.error('[Claims] 登録失敗:', claimError);
    return NextResponse.json(
      { error: 'クレームの登録に失敗しました' },
      { status: 500 }
    );
  }

  // 商品の is_claim_active を true に更新
  await supabase
    .from('items')
    .update({ is_claim_active: true })
    .eq('id', item.id);

  // 初期ログ登録
  await supabase.from('claim_logs').insert({
    tenant_id: session.tenantId,
    claim_id: claim.id,
    item_number,
    worker_id: worker.id,
    worker_name: worker.name,
    action: 'opened',
    note: description,
  });

  // 操作ログ
  await logOperation(
    supabase,
    session.tenantId,
    worker.id,
    'create',
    'item',
    item_number,
    { claim_id: claimId, action: 'claim_opened' }
  );

  return NextResponse.json({ success: true, claim }, { status: 201 });
}
