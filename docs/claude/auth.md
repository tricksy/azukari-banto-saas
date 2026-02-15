# 認証システム

## 概要

| ユーザー種別 | 認証方式 | ライブラリ | 状態 |
| ------------ | -------- | ---------- | ---- |
| 担当者（Worker） | PINコード（8桁） | 独自実装（JWT署名付きCookie） | 実装済み |
| 管理者（Admin） | Google OAuth 2.0 | google-auth-library + JWT署名付きCookie | 実装済み |

**ログイン画面は担当者用・管理者用で完全に分離する。**

---

## 担当者認証（独自実装）

### 関連ファイル

- **ログインページ**: `/login`
- **認証API**: `/api/auth/worker`（PINコード認証）
- **自動ログインAPI**: `/api/auth/worker/remember`（記憶トークン認証）
- **セッション管理**: `src/lib/auth.ts`
- **レート制限**: `src/lib/rate-limit.ts`

### 認証フロー

1. テナント解決（サブドメインまたは開発モードのクエリパラメータ）
2. PINコード入力 → `/api/auth/worker` で認証
3. レート制限チェック（IPベース、5回失敗で5分間ロック）
4. テナントの有効性確認（`tenants.status = 'active'`）
5. テナント内の有効な担当者を検索し、bcryptjs で PIN を照合
6. 認証成功時:
   - JWT署名付きセッションCookie発行（8時間有効）
   - 記憶トークン（30日有効）をレスポンスで返却 → クライアントがlocalStorageに保存
7. 次回アクセス時、記憶トークンがあれば `/api/auth/worker/remember` で自動ログイン
8. ログアウト時、セッションCookie削除 + localStorageの記憶トークン削除

### セッション管理（JWT署名付き）

- 形式: JWT（HS256署名）
- 有効期限: 8時間
- Cookie名: `kuratsugi_session`
- ペイロード: workerId, name, role, tenantId, tenantSlug, loginAt
- シークレット: `AUTH_SECRET` 環境変数（必須・32文字以上）
- 検証: Middleware でJWT署名と有効期限を検証

```typescript
// SessionData型（src/lib/auth.ts）
export interface SessionData {
  workerId: string;
  name: string;
  role: 'worker' | 'admin';
  tenantId: string;     // テナントUUID
  tenantSlug: string;   // テナントslug（サブドメイン）
  loginAt: string;      // ISO 8601形式
}
```

### セッション取得方法

```typescript
import { getSession, getSessionFromRequest } from '@/lib/auth';

// Server Components用
const session = await getSession();

// API Route用
const session = await getSessionFromRequest(request);
```

### 記憶トークン（Remember Me）

- 形式: `base64url(payload).signature`（HMAC-SHA256署名）
- 有効期限: 30日
- ペイロード: workerId, name, tenantId, tenantSlug, createdAt
- シークレット: `AUTH_SECRET` 環境変数（必須）
- 保存場所: クライアントのlocalStorage

```typescript
// RememberTokenPayload型（src/lib/auth.ts）
export interface RememberTokenPayload {
  workerId: string;
  name: string;
  tenantId: string;
  tenantSlug: string;
  createdAt: number;    // Date.now()
}
```

### 記憶トークンによる自動ログイン

1. クライアントがlocalStorageから記憶トークンを取得
2. `/api/auth/worker/remember` にPOST
3. トークン署名を検証 + 有効期限チェック
4. テナントの有効性を再確認（`tenants.status = 'active'`）
5. 担当者の有効性を再確認（`workers.is_active = true`）
6. 新しいセッションCookieを発行

---

## レート制限

**実装ファイル:** `src/lib/rate-limit.ts`

| パラメータ | 値 | 説明 |
| ---------- | -- | ---- |
| MAX_ATTEMPTS | 5 | 最大試行回数 |
| LOCK_DURATION_MS | 5分 | ロック期間 |
| ATTEMPT_WINDOW_MS | 15分 | 試行回数リセット期間 |

### 動作

- IPアドレスベースで試行回数を追跡
- 5回失敗で5分間ロック
- ロック解除後はカウンターリセット
- 15分間操作がなければカウンターリセット
- ログイン成功時にカウンターリセット

### メモリ管理

- インメモリのMap（サーバーレス環境では再起動時にリセット）
- 10%の確率で古いエントリをクリーンアップ（パフォーマンス最適化）

---

## 管理者認証（Google OAuth 2.0）

管理者はGoogle OAuth 2.0で認証する。`platform_admins` テーブルに登録されたメールアドレスのみがログイン可能。

### 関連ファイル

- **ログインページ**: `/{prefix}/login`（プレフィックスは `NEXT_PUBLIC_ADMIN_PREFIX` で設定）
- **認証API**: `/api/auth/admin`（Google認証トークン検証）
- **セッション管理**: `src/lib/auth.ts`
- **URL難読化ユーティリティ**: `src/lib/admin-path.ts`

### 認証フロー

1. 管理者が `/{prefix}/login` にアクセス
2. Google Sign-In ボタンをクリック → Google認証画面
3. 認証成功後、Google IDトークン（credential）を取得
4. `POST /api/auth/admin` にcredentialを送信
5. サーバー側で `google-auth-library` を使用してIDトークンを検証
6. `platform_admins` テーブルでメールアドレスを照合
7. `is_active = true` の管理者のみログイン許可
8. 認証成功時: JWT署名付きセッションCookie発行（8時間有効）
   - `role: 'admin'`
   - `tenantId: '00000000-0000-0000-0000-000000000000'`（プラットフォーム専用UUID）
   - `tenantSlug: '__platform__'`

### セッション

管理者セッションは担当者と同じ `SessionData` 型・同じCookie名（`kuratsugi_session`）を使用する。`role` フィールドが `'admin'` に設定される。

- ミドルウェアで `role === 'admin'` をチェックし、管理者ルートへのアクセスを許可
- 管理者セッションで担当者ルートにアクセスした場合、管理者ダッシュボードにリダイレクト
- 担当者セッションで管理者ルートにアクセスした場合、403エラー

### 環境変数

| 変数 | 説明 | 必須 |
| ---- | ---- | ---- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth 2.0 クライアントID | はい |
| `NEXT_PUBLIC_ADMIN_PREFIX` | 管理者URLプレフィックス（デフォルト: `admin`） | いいえ |

---

## 管理者URL難読化

管理者画面のURLを推測しにくくするための仕組み。`NEXT_PUBLIC_ADMIN_PREFIX` 環境変数でURLプレフィックスを変更できる。

### 仕組み

- `NEXT_PUBLIC_ADMIN_PREFIX` に任意の文字列（例: `ctrl-panel-a3f0`）を設定
- ミドルウェアが `/{prefix}/*` へのリクエストを内部的に `/admin/*` にリライト
- プレフィックスが `admin` 以外に設定されている場合、直接 `/admin/*` にアクセスすると404を返す
- アプリケーション内のリンクは `adminPath()` ユーティリティを使用して生成

### ユーティリティ関数

**実装ファイル:** `src/lib/admin-path.ts`

```typescript
// 管理者パスを生成（例: '/ctrl-panel-a3f0/dashboard'）
adminPath('/dashboard')

// 現在のプレフィックスを取得
getAdminPrefix()  // => 'ctrl-panel-a3f0'

// パスが管理者パスかどうか判定
isAdminPath('/ctrl-panel-a3f0/login')  // => true
```

### 設定例

| `NEXT_PUBLIC_ADMIN_PREFIX` | 管理者ログインURL | `/admin/login` のアクセス |
| -------------------------- | ----------------- | ------------------------- |
| 未設定（デフォルト） | `/admin/login` | 通常アクセス可能 |
| `ctrl-panel-a3f0` | `/ctrl-panel-a3f0/login` | 404 Not Found |

---

## API認証ミドルウェア

**実装ファイル:** `src/middleware.ts`

### 処理フロー

1. テナントslug解決（サブドメイン or `x-tenant-slug` ヘッダー）
2. 管理者URL難読化（`/{prefix}/*` → `/admin/*` へのリライト）
3. 直接 `/admin/*` アクセスのブロック（プレフィックスが `admin` 以外の場合）
4. 公開パスチェック（認証不要パスはテナント情報のみ付与して通過）
5. 管理者ルート認証（`role === 'admin'` のJWT検証）
6. 担当者ルート認証（JWT署名検証）
7. テナント情報をリクエストヘッダーに付与

### パス別認証要件

| パス | 認証要件 | 説明 |
| ---- | -------- | ---- |
| `/login` | なし | 担当者ログインページ |
| `/{prefix}/login` | なし | 管理者ログインページ |
| `/api/auth/*` | なし | 認証関連API（ログイン等） |
| `/api/tenant` | なし | テナント情報取得（公開） |
| `/{prefix}/*`（管理者ページ） | 管理者JWT（`role: 'admin'`） | 未認証時は `/{prefix}/login` にリダイレクト |
| `/api/admin/*` | 管理者JWT（`role: 'admin'`） | 管理者権限のJWT検証 |
| `/api/*`（その他） | 担当者JWT | JWT署名検証 |
| `/*`（ページ） | 担当者JWT | 未認証時は `/login` にリダイレクト |

### JWT検証内容

```typescript
// ペイロードの必須フィールド検証
if (!payload.workerId || !payload.name || !payload.role || !payload.tenantId) {
  return { valid: false };
}
```

### セキュリティ強化ポイント

- JWT署名検証による改ざん防止
- 有効期限切れトークンは自動的に無効化
- テナントID必須チェックによるテナント分離保証
- HS256アルゴリズム固定

### ログイン履歴

- 全てのログイン・自動ログインは `operation_logs` テーブルに記録
- 記録内容: テナントID、担当者ID、担当者名、アクション（ログイン）、IPアドレス

**未認証時のレスポンス:**

- 担当者API: `{ error: '認証が必要です' }` (HTTP 401)
- 担当者ページ: `/login` へリダイレクト
- 管理者API: `{ error: '認証が必要です' }` (HTTP 401) / `{ error: '管理者権限が必要です' }` (HTTP 403)
- 管理者ページ: `/{prefix}/login` へリダイレクト
