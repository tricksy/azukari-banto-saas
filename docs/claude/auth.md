# 認証システム

## 概要

| ユーザー種別 | 認証方式 | ライブラリ |
| ------------ | -------- | ---------- |
| 担当者（Worker） | PINコード（8桁） | 独自実装（JWT署名付きCookie） |
| 店舗管理者（Store Admin） | メール+パスワード | 独自実装（JWT署名付きCookie）※TODO |
| プラットフォーム管理者 | OAuth 2.0 | 独自実装 ※TODO |

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

## 店舗管理者認証（TODO）

店舗管理者の認証は未実装。今後、メール+パスワード認証を実装予定。

### 想定仕様

- メールアドレス + パスワードによる認証
- 店舗（テナント）に紐付いた管理者アカウント
- 担当者管理、設定変更、レポート閲覧等の管理機能へのアクセス

---

## プラットフォーム管理者認証（TODO）

プラットフォーム管理者の認証は未実装。今後、OAuth認証を実装予定。

### 想定仕様

- Google OAuth 2.0 による認証
- テナント横断の管理機能（テナント作成・停止・プラン変更等）

---

## API認証ミドルウェア

**実装ファイル:** `src/middleware.ts`

### 処理フロー

1. テナントslug解決（サブドメイン or `x-tenant-slug` ヘッダー）
2. 公開パスチェック（認証不要パスはテナント情報のみ付与して通過）
3. JWT署名検証（Cookie内のセッショントークン）
4. テナント情報をリクエストヘッダーに付与

### パス別認証要件

| パス | 認証要件 | 説明 |
| ---- | -------- | ---- |
| `/login` | なし | ログインページ |
| `/api/auth/*` | なし | 認証関連API（ログイン等） |
| `/api/tenant` | なし | テナント情報取得（公開） |
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

- API: `{ error: '認証が必要です' }` (HTTP 401)
- ページ: `/login` へリダイレクト
