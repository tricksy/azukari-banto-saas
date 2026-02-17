import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';

/**
 * 商品一覧取得（担当者API）
 * GET /api/items
 *
 * Query params:
 *   ?status=draft,pending_ship  — カンマ区切りステータスフィルタ
 *   ?q=keyword                  — キーワード検索（預かり番号・顧客名・取引先名・商品名）
 *   ?includeArchived=true       — アーカイブ済みを含む（デフォルト: 除外）
 *   ?page=1&limit=20            — ページネーション
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const q = searchParams.get('q');
  const includeArchived = searchParams.get('includeArchived') === 'true';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  // --- 件数取得用クエリ ---
  let countQuery = supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', session.tenantId);

  if (!includeArchived) {
    countQuery = countQuery.eq('is_archived', false);
  }

  if (status) {
    const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length > 0) {
      countQuery = countQuery.in('status', statuses);
    }
  }

  if (q) {
    countQuery = countQuery.or(
      `item_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_name_kana.ilike.%${q}%,partner_name.ilike.%${q}%,product_name.ilike.%${q}%`
    );
  }

  // --- データ取得用クエリ ---
  let dataQuery = supabase
    .from('items')
    .select('*')
    .eq('tenant_id', session.tenantId);

  if (!includeArchived) {
    dataQuery = dataQuery.eq('is_archived', false);
  }

  if (status) {
    const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length > 0) {
      dataQuery = dataQuery.in('status', statuses);
    }
  }

  if (q) {
    dataQuery = dataQuery.or(
      `item_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_name_kana.ilike.%${q}%,partner_name.ilike.%${q}%,product_name.ilike.%${q}%`
    );
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  dataQuery = dataQuery.order('created_at', { ascending: false }).range(from, to);

  // 並列実行
  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

  if (countResult.error) {
    return NextResponse.json(
      { error: '商品件数の取得に失敗しました' },
      { status: 500 }
    );
  }

  if (dataResult.error) {
    return NextResponse.json(
      { error: '商品一覧の取得に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    items: dataResult.data || [],
    total: countResult.count ?? 0,
    page,
    limit,
  });
}

/**
 * 商品作成（担当者API）
 * POST /api/items
 *
 * Body (required): reception_id, item_number, product_type, product_name
 * Body (optional): customer_name, customer_name_kana, partner_id, partner_name,
 *   color, material, size, condition_note, request_type, request_detail,
 *   status, vendor_id, vendor_name, scheduled_ship_date, scheduled_return_date,
 *   photo_front_url, photo_back_url, photo_front_memo, photo_back_memo,
 *   additional_photos
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await request.json();
  const { reception_id, item_number, product_type, product_name } = body;

  if (!reception_id || !item_number || !product_type || !product_name) {
    return NextResponse.json(
      { error: '受付ID、商品種別、商品名は必須です' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const insertData: Record<string, unknown> = {
    tenant_id: session.tenantId,
    reception_id,
    item_number,
    product_type,
    product_name,
  };

  // オプショナルフィールド
  const optionalFields = [
    'customer_name',
    'customer_name_kana',
    'partner_id',
    'partner_name',
    'color',
    'material',
    'size',
    'condition_note',
    'request_type',
    'request_detail',
    'status',
    'vendor_id',
    'vendor_name',
    'scheduled_ship_date',
    'scheduled_return_date',
    'photo_front_url',
    'photo_back_url',
    'photo_front_memo',
    'photo_back_memo',
    'additional_photos',
  ];

  for (const field of optionalFields) {
    if (body[field] !== undefined) {
      insertData[field] = body[field];
    }
  }

  const { data: item, error } = await supabase
    .from('items')
    .insert(insertData)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json(
      { error: '商品の作成に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, item }, { status: 201 });
}
