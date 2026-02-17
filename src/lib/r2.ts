import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const bucket = getEnv('R2_BUCKET_NAME');
  const publicUrl = getEnv('R2_PUBLIC_URL');

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return `${publicUrl}/${key}`;
}
