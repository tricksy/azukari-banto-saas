import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';
import { logOperation } from '@/lib/log';

/**
 * 顧客紐付け（担当者API）
 * PATCH /api/receptions/[receptionNumber]/customer
 *
 * Body:
 *   customer_id: string
 *   customer_name: string
 *   partner_id?: string
 *   partner_name?: string
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ receptionNumber: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { receptionNumber } = await params;
  const body = await request.json();
  const { customer_id, customer_name, partner_id, partner_name } = body;

  if (!customer_id || !customer_name) {
    return NextResponse.json(
      { error: 'customer_idとcustomer_nameは必須です' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // 受付レコードを取得
  const { data: reception, error: fetchError } = await supabase
    .from('receptions')
    .select('*')
    .eq('tenant_id', session.tenantId)
    .eq('reception_number', receptionNumber)
    .single();

  if (fetchError || !reception) {
    return NextResponse.json(
      { error: '受付が見つかりません' },
      { status: 404 }
    );
  }

  // 受付レコードを更新
  const { data: updatedReception, error: updateError } = await supabase
    .from('receptions')
    .update({
      customer_id,
      customer_name,
      partner_id: partner_id || null,
      partner_name: partner_name || null,
    })
    .eq('tenant_id', session.tenantId)
    .eq('reception_number', receptionNumber)
    .select('*')
    .single();

  if (updateError) {
    console.error('[Receptions/Customer] 受付更新失敗:', updateError);
    return NextResponse.json(
      { error: '受付の更新に失敗しました' },
      { status: 500 }
    );
  }

  // 顧客情報を取得（name_kana用）
  const { data: customer } = await supabase
    .from('customers')
    .select('name_kana')
    .eq('id', customer_id)
    .eq('tenant_id', session.tenantId)
    .single();

  // 紐づく商品を一括更新: 顧客情報設定 + draft → pending_ship
  const itemUpdateData: Record<string, unknown> = {
    customer_name,
    customer_name_kana: customer?.name_kana || null,
    partner_id: partner_id || null,
    partner_name: partner_name || null,
  };

  // まず全商品の顧客情報を更新
  const { error: itemUpdateError } = await supabase
    .from('items')
    .update(itemUpdateData)
    .eq('tenant_id', session.tenantId)
    .eq('reception_id', reception.id);

  if (itemUpdateError) {
    console.error('[Receptions/Customer] 商品顧客情報更新失敗:', itemUpdateError);
    return NextResponse.json(
      { error: '商品の顧客情報更新に失敗しました' },
      { status: 500 }
    );
  }

  // draftステータスの商品をpending_shipに更新
  const { error: statusUpdateError } = await supabase
    .from('items')
    .update({ status: 'pending_ship' })
    .eq('tenant_id', session.tenantId)
    .eq('reception_id', reception.id)
    .eq('status', 'draft');

  if (statusUpdateError) {
    console.error('[Receptions/Customer] ステータス更新失敗:', statusUpdateError);
    return NextResponse.json(
      { error: '商品ステータスの更新に失敗しました' },
      { status: 500 }
    );
  }

  // 操作ログを記録
  await logOperation(
    supabase,
    session.tenantId,
    null,
    'update',
    'reception',
    receptionNumber,
    { customer_id, customer_name, partner_id, partner_name }
  );

  return NextResponse.json({ success: true, reception: updatedReception });
}
