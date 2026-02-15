/**
 * 認証ミドルウェア（マルチテナント対応）
 *
 * 1. テナント解決（サブドメイン or ヘッダー）
 * 2. 管理者URL難読化（プレフィックス書き換え）
 * 3. 認証ガード（JWT署名検証）
 * 4. テナント情報をリクエストヘッダーに付与
 * 5. admin/workerルート分離
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { adminPath, getAdminPrefix, isAdminPath } from '@/lib/admin-path';

const SESSION_COOKIE_NAME = 'kuratsugi_session';

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

  const prefix = getAdminPrefix();

  // 直接 /admin/* アクセスをブロック（prefix が 'admin' 以外の場合）
  if (prefix !== 'admin' && (pathname === '/admin' || pathname.startsWith('/admin/'))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // プレフィックス付きURLを /admin/* に正規化
  let normalizedPathname = pathname;
  let needsRewrite = false;
  if (prefix !== 'admin' && isAdminPath(pathname)) {
    normalizedPathname = '/admin' + pathname.slice(`/${prefix}`.length);
    needsRewrite = true;
  }

  // 認証不要のパス
  const publicPaths = ['/login', adminPath('/login'), '/api/auth/', '/api/tenant'];

  // 公開パスはテナント情報のみ付与して通過
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    if (needsRewrite) {
      const url = request.nextUrl.clone();
      url.pathname = normalizedPathname;
      const response = NextResponse.rewrite(url);
      response.headers.set('x-pathname', normalizedPathname);
      return response;
    }
    const response = NextResponse.next();
    if (tenantSlug) {
      response.headers.set('x-tenant-slug', tenantSlug);
    }
    return response;
  }

  // セッション取得
  const session = request.cookies.get(SESSION_COOKIE_NAME);

  // --- 管理者ルート ---
  if (normalizedPathname.startsWith('/admin') || normalizedPathname.startsWith('/api/admin')) {
    if (!session?.value) {
      if (normalizedPathname.startsWith('/api/')) {
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
      }
      return NextResponse.redirect(new URL(adminPath('/login'), request.url));
    }

    const result = await verifySession(session.value);
    if (!result.valid || result.role !== 'admin') {
      if (normalizedPathname.startsWith('/api/')) {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
      }
      return NextResponse.redirect(new URL(adminPath('/login'), request.url));
    }

    if (needsRewrite) {
      const url = request.nextUrl.clone();
      url.pathname = normalizedPathname;
      const response = NextResponse.rewrite(url);
      response.headers.set('x-pathname', normalizedPathname);
      return response;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', normalizedPathname);
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
    return NextResponse.redirect(new URL(adminPath('/dashboard'), request.url));
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
