import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getJSTTimestampMinutes } from '@/lib/date';
import { logOperation } from '@/lib/log';

/**
 * 下書き保存（担当者API）
 * POST /api/receptions/draft
 *
 * Body:
 *   items: Array<{ item_number, product_type, product_name, ... }>
 *   notes?
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await request.json();
  const { items, notes } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: '商品情報は1件以上必要です' },
      { status: 400 }
    );
  }

  for (const item of items) {
    if (!item.item_number || !item.product_type || !item.product_name) {
      return NextResponse.json(
        { error: '各商品に商品種別と商品名は必須です' },
        { status: 400 }
      );
    }
  }

  const supabase = createServiceClient();

  // 担当者のUUIDを取得
  const { data: worker, error: workerError } = await supabase
    .from('workers')
    .select('id')
    .eq('tenant_id', session.tenantId)
    .eq('worker_id', session.workerId)
    .single();

  if (workerError || !worker) {
    return NextResponse.json(
      { error: '担当者情報の取得に失敗しました' },
      { status: 500 }
    );
  }

  // 受付番号を生成
  const receptionNumber = `${session.workerId}-${getJSTTimestampMinutes()}`;

  // 受付レコードを挿入（顧客なし = 下書き）
  const { data: reception, error: receptionError } = await supabase
    .from('receptions')
    .insert({
      tenant_id: session.tenantId,
      reception_number: receptionNumber,
      customer_id: null,
      customer_name: null,
      partner_id: null,
      partner_name: null,
      received_by: worker.id,
      item_count: items.length,
      notes: notes || null,
    })
    .select('*')
    .single();

  if (receptionError) {
    console.error('[Receptions/Draft] 下書き保存失敗:', receptionError);
    return NextResponse.json(
      { error: '下書きの保存に失敗しました' },
      { status: 500 }
    );
  }

  // 商品レコードを一括挿入（全てdraftステータス）
  const itemInserts = items.map((item: Record<string, unknown>) => ({
    tenant_id: session.tenantId,
    item_number: item.item_number,
    reception_id: reception.id,
    product_type: item.product_type,
    product_name: item.product_name,
    color: item.color || null,
    material: item.material || null,
    size: item.size || null,
    condition_note: item.condition_note || null,
    request_type: item.request_type || null,
    request_detail: item.request_detail || null,
    vendor_id: item.vendor_id || null,
    vendor_name: item.vendor_name || null,
    scheduled_ship_date: item.scheduled_ship_date || null,
    is_paid_storage: item.is_paid_storage || false,
    photo_front_url: item.photo_front_url || null,
    photo_back_url: item.photo_back_url || null,
    photo_front_memo: item.photo_front_memo || null,
    photo_back_memo: item.photo_back_memo || null,
    additional_photos: item.additional_photos || [],
    status: 'draft',
  }));

  const { data: insertedItems, error: itemsError } = await supabase
    .from('items')
    .insert(itemInserts)
    .select('*');

  if (itemsError) {
    console.error('[Receptions/Draft] 商品登録失敗:', itemsError);
    return NextResponse.json(
      { error: '商品の登録に失敗しました' },
      { status: 500 }
    );
  }

  // 操作ログを記録
  await logOperation(
    supabase,
    session.tenantId,
    worker.id,
    'create',
    'reception',
    receptionNumber,
    { item_count: items.length, status: 'draft' }
  );

  return NextResponse.json(
    { success: true, reception, items: insertedItems },
    { status: 201 }
  );
}
