/**
 * セッション管理（マルチテナント対応）
 *
 * JWT署名付きセッションによる改ざん防止
 * テナントIDを含むことでテナント分離を保証
 */

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify, errors as JoseErrors } from 'jose';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'kuratsugi_session';
const SESSION_MAX_AGE = 60 * 60 * 8; // 8時間

export const PLATFORM_TENANT_ID = '00000000-0000-0000-0000-000000000000';
export const PLATFORM_TENANT_SLUG = '__platform__';
const REMEMBER_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30日間
const JWT_ALG = 'HS256';

/**
 * AUTH_SECRETをバイト列として取得
 */
function getAuthSecretBytes(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export interface SessionData {
  workerId: string;
  name: string;
  role: 'worker' | 'admin';
  tenantId: string;
  tenantSlug: string;
  loginAt: string;
}

// ============================================
// セッション管理（JWT署名付き）
// ============================================

/**
 * セッションを作成してCookieに保存
 */
export async function createSession(
  data: Omit<SessionData, 'loginAt'>
): Promise<string> {
  const sessionData: SessionData = {
    ...data,
    loginAt: new Date().toISOString(),
  };

  const secret = getAuthSecretBytes();
  const token = await new SignJWT(
    sessionData as unknown as Record<string, unknown>
  )
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return token;
}

/**
 * セッションを取得（Server Components用）
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  return verifySessionToken(sessionCookie.value);
}

/**
 * セッションを取得（API Route用）
 */
export function getSessionFromRequest(
  request: NextRequest
): Promise<SessionData | null> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return Promise.resolve(null);
  }

  return verifySessionToken(sessionCookie.value);
}

/**
 * JWTセッショントークンを検証
 */
async function verifySessionToken(
  token: string
): Promise<SessionData | null> {
  try {
    const secret = getAuthSecretBytes();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });

    const sessionData: SessionData = {
      workerId: payload.workerId as string,
      name: payload.name as string,
      role: payload.role as 'worker' | 'admin',
      tenantId: payload.tenantId as string,
      tenantSlug: payload.tenantSlug as string,
      loginAt: payload.loginAt as string,
    };

    if (
      !sessionData.workerId ||
      !sessionData.name ||
      !sessionData.role ||
      !sessionData.tenantId
    ) {
      console.warn('[Session] Invalid session payload: missing required fields');
      return null;
    }

    return sessionData;
  } catch (error) {
    if (error instanceof JoseErrors.JWTExpired) {
      console.info('[Session] Token expired');
    } else if (error instanceof JoseErrors.JWSSignatureVerificationFailed) {
      console.warn('[Session] Invalid signature - possible tampering attempt');
    } else if (error instanceof JoseErrors.JWTClaimValidationFailed) {
      console.warn('[Session] Claim validation failed');
    } else {
      console.warn('[Session] Token verification failed:', error);
    }
    return null;
  }
}

/**
 * セッションを削除
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// ============================================
// 記憶トークン（Remember Me）
// ============================================

export interface RememberTokenPayload {
  workerId: string;
  name: string;
  tenantId: string;
  tenantSlug: string;
  createdAt: number;
}

/**
 * 記憶トークンを生成（30日間有効）
 */
export function createRememberToken(
  workerId: string,
  name: string,
  tenantId: string,
  tenantSlug: string
): string {
  const payload: RememberTokenPayload = {
    workerId,
    name,
    tenantId,
    tenantSlug,
    createdAt: Date.now(),
  };

  const secret = getAuthSecretBytes();
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString(
    'base64url'
  );
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

/**
 * 記憶トークンを検証
 */
export function verifyRememberToken(
  token: string
): RememberTokenPayload | null {
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) {
      return null;
    }

    const secret = getAuthSecretBytes();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadBase64)
      .digest('base64url');

    if (signature !== expectedSignature) {
      console.warn(
        '[RememberToken] Invalid signature - possible tampering attempt'
      );
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    ) as RememberTokenPayload;

    const age = Date.now() - payload.createdAt;
    if (age > REMEMBER_TOKEN_MAX_AGE * 1000) {
      console.info('[RememberToken] Token expired');
      return null;
    }

    return payload;
  } catch (error) {
    console.warn('[RememberToken] Verification failed:', error);
    return null;
  }
}
