import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';
import { isStatusTransitionAllowed, getStatusTransitionErrorMessage } from '@/types';
import { logOperation } from '@/lib/log';

/** 更新可能なフィールド一覧 */
const UPDATABLE_FIELDS = [
  'status',
  'customer_name',
  'customer_name_kana',
  'partner_id',
  'partner_name',
  'product_type',
  'product_name',
  'color',
  'material',
  'size',
  'condition_note',
  'request_type',
  'request_detail',
  'vendor_id',
  'vendor_name',
  'scheduled_ship_date',
  'scheduled_return_date',
  'ship_to_vendor_date',
  'return_from_vendor_date',
  'return_to_customer_date',
  'vendor_tracking_number',
  'vendor_carrier',
  'customer_tracking_number',
  'customer_carrier',
  'photo_front_url',
  'photo_back_url',
  'photo_after_front_url',
  'photo_after_back_url',
  'photo_front_memo',
  'photo_back_memo',
  'photo_after_front_memo',
  'photo_after_back_memo',
  'additional_photos',
  'is_paid_storage',
  'paid_storage_start_date',
  'is_claim_active',
  'ship_history',
  'return_history',
] as const;

/**
 * 商品詳細取得（担当者API）
 * GET /api/items/[itemNumber]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemNumber: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  const { itemNumber } = await params;
  const supabase = createServiceClient();

  const { data: item, error } = await supabase
    .from('items')
    .select('*')
    .eq('tenant_id', session.tenantId)
    .eq('item_number', itemNumber)
    .single();

  if (error || !item) {
    return NextResponse.json(
      { error: '商品が見つかりません' },
      { status: 404 }
    );
  }

  const { data: logs } = await supabase
    .from('operation_logs')
    .select('*')
    .eq('tenant_id', session.tenantId)
    .eq('target_type', 'item')
    .eq('target_id', itemNumber)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ item, logs: logs || [] });
}

/**
 * 商品ステータス遷移・フィールド更新（担当者API）
 * PATCH /api/items/[itemNumber]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemNumber: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  const { itemNumber } = await params;
  const body = await request.json();
  const supabase = createServiceClient();

  // 現在の商品を取得
  const { data: currentItem, error: fetchError } = await supabase
    .from('items')
    .select('*')
    .eq('tenant_id', session.tenantId)
    .eq('item_number', itemNumber)
    .single();

  if (fetchError || !currentItem) {
    return NextResponse.json(
      { error: '商品が見つかりません' },
      { status: 404 }
    );
  }

  // ステータス遷移チェック
  if (body.status && body.status !== currentItem.status) {
    if (!isStatusTransitionAllowed(currentItem.status, body.status)) {
      return NextResponse.json(
        { error: getStatusTransitionErrorMessage(currentItem.status, body.status) },
        { status: 400 }
      );
    }
  }

  // 更新オブジェクトを構築（許可されたフィールドのみ）
  const updateData: Record<string, unknown> = {};
  for (const field of UPDATABLE_FIELDS) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: '更新するフィールドが指定されていません' },
      { status: 400 }
    );
  }

  // 商品を更新
  const { data: updatedItem, error: updateError } = await supabase
    .from('items')
    .update(updateData)
    .eq('tenant_id', session.tenantId)
    .eq('item_number', itemNumber)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: '商品の更新に失敗しました' },
      { status: 500 }
    );
  }

  // 操作ログを記録
  if (body.status && body.status !== currentItem.status) {
    await logOperation(
      supabase,
      session.tenantId,
      null,
      'status_change',
      'item',
      itemNumber,
      { before: { status: currentItem.status }, after: { status: body.status } }
    );
  } else {
    await logOperation(
      supabase,
      session.tenantId,
      null,
      'update',
      'item',
      itemNumber,
      updateData
    );
  }

  return NextResponse.json({ success: true, item: updatedItem });
}
