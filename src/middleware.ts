import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const baseDomain = process.env.BASE_DOMAIN || "kuratsugi.app";

  // サブドメインからテナントslugを抽出
  let tenantSlug: string | null = null;

  if (host.endsWith(`.${baseDomain}`)) {
    tenantSlug = host.replace(`.${baseDomain}`, "");
  }

  // 開発環境: x-tenant-slug ヘッダーから取得
  if (!tenantSlug) {
    tenantSlug = request.headers.get("x-tenant-slug");
  }

  const response = NextResponse.next();

  // テナント情報をヘッダーに付与（下流で利用）
  if (tenantSlug) {
    response.headers.set("x-tenant-slug", tenantSlug);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
