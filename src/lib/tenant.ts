import { headers } from "next/headers";

/**
 * リクエストのホスト名からテナントのslugを抽出
 * 例: demo-kimono.kuratsugi.app → demo-kimono
 *     localhost:3001 → null（開発環境ではヘッダーから取得）
 */
export async function getTenantSlug(): Promise<string | null> {
  const headersList = await headers();
  const host = headersList.get("host") || "";

  // 開発環境: x-tenant-slug ヘッダーから取得
  const tenantHeader = headersList.get("x-tenant-slug");
  if (tenantHeader) {
    return tenantHeader;
  }

  // 本番: サブドメインから抽出
  const baseDomain = process.env.BASE_DOMAIN || "kuratsugi.app";
  if (host.endsWith(`.${baseDomain}`)) {
    return host.replace(`.${baseDomain}`, "");
  }

  return null;
}
