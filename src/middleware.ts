/**
 * 認証ミドルウェア（マルチテナント対応）
 *
 * 1. テナント解決（サブドメイン or ヘッダー）
 * 2. 認証ガード（JWT署名検証）
 * 3. テナント情報をリクエストヘッダーに付与
 * 4. admin/workerルート分離
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'kuratsugi_session';

// 認証不要のパス
const PUBLIC_PATHS = ['/login', '/admin/login', '/api/auth/', '/api/tenant'];

/**
 * テナントslugをリクエストから解決
 */
function resolveTenantSlug(request: NextRequest): string | null {
  const host = request.headers.get('host') || '';
  const baseDomain = process.env.BASE_DOMAIN || 'kuratsugi.app';

  // サブドメインから抽出
  if (host.endsWith(`.${baseDomain}`)) {
    return host.replace(`.${baseDomain}`, '');
  }

  // 開発環境: x-tenant-slug ヘッダーから取得
  return request.headers.get('x-tenant-slug');
}

/**
 * JWTセッショントークンを検証
 */
async function verifySession(
  token: string
): Promise<{ valid: boolean; tenantSlug?: string; role?: string }> {
  try {
    const authSecret = process.env.AUTH_SECRET;
    if (!authSecret) {
      console.error('[Middleware] AUTH_SECRET is not set');
      return { valid: false };
    }

    const secret = new TextEncoder().encode(authSecret);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    if (!payload.workerId || !payload.name || !payload.role || !payload.tenantId) {
      console.warn('[Middleware] Invalid session payload');
      return { valid: false };
    }

    return {
      valid: true,
      tenantSlug: payload.tenantSlug as string,
      role: payload.role as string,
    };
  } catch (error) {
    console.warn('[Middleware] Session verification failed:', error);
    return { valid: false };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // テナントslugを解決
  const tenantSlug = resolveTenantSlug(request);

  // 公開パスはテナント情報のみ付与して通過
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    const response = NextResponse.next();
    if (tenantSlug) {
      response.headers.set('x-tenant-slug', tenantSlug);
    }
    return response;
  }

  // セッション取得
  const session = request.cookies.get(SESSION_COOKIE_NAME);

  // --- 管理者ルート ---
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!session?.value) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const result = await verifySession(session.value);
    if (!result.valid || result.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // --- API認証チェック（worker） ---
  if (pathname.startsWith('/api/')) {
    if (!session?.value) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const result = await verifySession(session.value);
    if (!result.valid) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // adminセッションでworker APIへのアクセスを防止
    if (result.role === 'admin') {
      return NextResponse.json(
        { error: '担当者としてログインしてください' },
        { status: 403 }
      );
    }

    const response = NextResponse.next();
    if (tenantSlug) {
      response.headers.set('x-tenant-slug', tenantSlug);
    }
    return response;
  }

  // --- ページ認証チェック（worker） ---
  if (!session?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const result = await verifySession(session.value);
  if (!result.valid) {
    console.warn('[Middleware] Invalid session, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // adminセッションでworkerページへのアクセスを防止
  if (result.role === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // テナント情報をリクエストヘッダーに付与
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  if (tenantSlug) {
    requestHeaders.set('x-tenant-slug', tenantSlug);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
