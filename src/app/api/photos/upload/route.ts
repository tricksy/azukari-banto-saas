import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * 写真アップロード（担当者API）
 * POST /api/photos/upload
 *
 * FormData:
 *   file: File (image)
 *   item_number: string
 *   type: 'front' | 'back' | 'after_front' | 'after_back' | 'additional'
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const itemNumber = formData.get('item_number') as string | null;
  const type = formData.get('type') as string | null;

  if (!file) {
    return NextResponse.json(
      { error: 'ファイルが指定されていません' },
      { status: 400 }
    );
  }

  if (!itemNumber) {
    return NextResponse.json(
      { error: 'item_numberは必須です' },
      { status: 400 }
    );
  }

  if (!type || !['front', 'back', 'after_front', 'after_back', 'additional'].includes(type)) {
    return NextResponse.json(
      { error: 'typeはfront、back、after_front、after_back、additionalのいずれかを指定してください' },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: '画像ファイル（JPEG、PNG、WebP、HEIC）のみアップロード可能です' },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'ファイルサイズは10MB以下にしてください' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // ストレージパスを生成
  const storagePath = `${session.tenantId}/${itemNumber}/${type}_${Date.now()}.webp`;

  // Supabase Storageにアップロード
  const { error: uploadError } = await supabase.storage
    .from('item-photos')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('[Photos/Upload] アップロード失敗:', uploadError);
    return NextResponse.json(
      { error: '写真のアップロードに失敗しました' },
      { status: 500 }
    );
  }

  // 公開URLを取得
  const { data: urlData } = supabase.storage
    .from('item-photos')
    .getPublicUrl(storagePath);

  return NextResponse.json({
    success: true,
    url: urlData.publicUrl,
  });
}
