import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * 一時写真アップロード（担当者API）
 * POST /api/photos/upload-temp
 *
 * 商品レコード作成前に写真をアップロードする場合に使用。
 * temp/ プレフィックスパスに保存される。
 *
 * FormData:
 *   file: File (image)
 *   session_id: string (一時セッション識別子)
 *   type: 'front' | 'back' | 'additional'
 *   index: string (連番)
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const sessionId = formData.get('session_id') as string | null;
  const type = formData.get('type') as string | null;
  const index = formData.get('index') as string | null;

  if (!file) {
    return NextResponse.json(
      { error: 'ファイルが指定されていません' },
      { status: 400 }
    );
  }

  if (!sessionId) {
    return NextResponse.json(
      { error: 'session_idは必須です' },
      { status: 400 }
    );
  }

  if (!type || !['front', 'back', 'additional'].includes(type)) {
    return NextResponse.json(
      { error: 'typeはfront、back、additionalのいずれかを指定してください' },
      { status: 400 }
    );
  }

  if (!index) {
    return NextResponse.json(
      { error: 'indexは必須です' },
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

  // 一時ストレージパスを生成
  const storagePath = `${session.tenantId}/temp/${sessionId}/${type}_${index}_${Date.now()}.webp`;

  // Supabase Storageにアップロード
  const { error: uploadError } = await supabase.storage
    .from('item-photos')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('[Photos/UploadTemp] アップロード失敗:', uploadError);
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
