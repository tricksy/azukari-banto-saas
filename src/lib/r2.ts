import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let client: S3Client | null = null;

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getClient(): S3Client {
  if (client) return client;

  const accountId = getEnv('R2_ACCOUNT_ID');
  const accessKeyId = getEnv('R2_ACCESS_KEY_ID');
  const secretAccessKey = getEnv('R2_SECRET_ACCESS_KEY');

  client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return client;
}

/**
 * R2にファイルをアップロードし、パブリックURLを返す
 *
 * 注意: パブリックURLはURL推測による認証なしアクセスのリスクがある。
 * 将来的にgetPresignedUrl()への移行を推奨。
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const bucket = getEnv('R2_BUCKET_NAME');
  const publicUrl = process.env.R2_PUBLIC_URL;

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  // パブリックURLが設定されている場合はそれを返す（後方互換性）
  // 未設定の場合はキーのみ返す（署名付きURLで後からアクセス）
  return publicUrl ? `${publicUrl}/${key}` : key;
}

/**
 * R2オブジェクトの署名付きURLを生成する
 *
 * @param key R2オブジェクトのキー
 * @param expiresIn 有効期限（秒）デフォルト15分
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 900,
): Promise<string> {
  const bucket = getEnv('R2_BUCKET_NAME');

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(getClient(), command, { expiresIn });
}
