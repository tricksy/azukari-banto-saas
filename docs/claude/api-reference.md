# API リファレンス

## 認証系（実装済み）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/auth/worker | POST | 担当者PIN認証（記憶トークン発行） |
| /api/auth/worker/remember | POST | 記憶トークンによる自動ログイン |
| /api/auth/admin | POST | 管理者Google OAuth認証 |
| /api/auth/logout | POST | ログアウト（Cookie削除） |
| /api/tenant | GET | テナント情報取得（公開API） |

---

## 認証API詳細

### POST /api/auth/worker

担当者のPINコード認証。レート制限あり。

**リクエストボディ:**
```json
{
  "pin": "12345678",
  "tenantSlug": "demo-kimono"
}
```

**成功レスポンス (200):**
```json
{
  "success": true,
  "worker": {
    "workerId": "T01",
    "name": "田中"
  },
  "rememberToken": "base64url-payload.hmac-signature"
}
```

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | PINコードは8桁で入力してください | PIN形式不正 |
| 400 | 店舗情報が取得できません | tenantSlug未指定 |
| 401 | PINコードが正しくありません | PIN不一致 |
| 403 | この店舗は現在利用停止中です | テナント停止中 |
| 404 | 店舗が見つかりません | テナント不存在 |
| 404 | 担当者が登録されていません | 有効な担当者なし |
| 429 | ログイン試行回数の上限に達しました | レート制限発動 |

### POST /api/auth/worker/remember

記憶トークンによる自動ログイン。

**リクエストボディ:**
```json
{
  "token": "base64url-payload.hmac-signature"
}
```

**成功レスポンス (200):**
```json
{
  "success": true
}
```

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | トークンが必要です | token未指定 |
| 401 | トークンが無効または期限切れです | トークン検証失敗 |
| 401 | 担当者が無効です | 担当者無効化済み |
| 403 | 店舗が利用停止中です | テナント停止中 |

### POST /api/auth/admin

管理者のGoogle OAuth認証。Google Sign-Inのcredentialトークンを受け取り、`admin_users`テーブルで許可されたメールか検証し、JWTセッションCookieを発行する。

**リクエストボディ:**
```json
{
  "credential": "google-id-token-string"
}
```

**成功レスポンス (200):**
```json
{
  "success": true
}
```

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | credentialが必要です | credential未指定 |
| 401 | 認証に失敗しました | Googleトークン検証失敗 |
| 403 | 管理者として登録されていません | admin_usersに未登録のメール |

### POST /api/auth/logout

セッションCookieを削除してログアウト。

**レスポンス (200):**
```json
{
  "success": true
}
```

### GET /api/tenant

テナント情報を取得（公開API、認証不要）。

**クエリパラメータ:**

| パラメータ | 必須 | 説明 |
| ---------- | ---- | ---- |
| slug | ○ | テナントslug |

**成功レスポンス (200):**
```json
{
  "tenant": {
    "slug": "demo-kimono",
    "name": "デモ着物店",
    "status": "active"
  }
}
```

---

## 業務系

| エンドポイント | メソッド | 説明 | 状態 |
| -------------- | -------- | ---- | ---- |
| /api/customers | GET/POST | 顧客検索・登録（partner_id対応） | 実装済み |
| /api/partners | GET | 取引先一覧 | 実装済み |
| /api/receptions | GET/POST | 受付情報取得・登録 | 実装済み |
| /api/receptions/draft | POST | 下書き保存（顧客未設定での商品登録） | 実装済み |
| /api/receptions/[receptionNumber]/customer | PATCH | 下書きへの顧客紐付け | TODO - 未実装 |
| /api/items | GET/POST/PUT | 商品管理（ステータスフィルタ対応） | 実装済み |
| /api/items/[itemNumber] | GET/PATCH | 商品詳細・更新（isClaimActive検証あり） | 実装済み |
| /api/vendors | GET | 業者一覧 | 実装済み |
| /api/settings | GET | テナント設定取得 | 実装済み |

---

## クレーム管理系（TODO - 未実装）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/claims | GET/POST | クレーム一覧・新規登録 |
| /api/claims/[claimId] | GET/PATCH | クレーム詳細・更新 |
| /api/claims/[claimId]/logs | GET/POST | 対応ログ一覧・追加 |

---

## 管理者専用 — テナント管理（実装済み）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/admin/tenants | GET | テナント一覧取得 |
| /api/admin/tenants | POST | テナント新規作成 |
| /api/admin/tenants | PUT | テナント分離URL更新 |

### GET /api/admin/tenants

全テナント情報を一覧取得する。管理者認証必須。

**成功レスポンス (200):**
```json
{
  "tenants": [
    {
      "id": "uuid",
      "name": "デモ着物店",
      "slug": "A3F0",
      "status": "active",
      "settings": {},
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/admin/tenants

テナントを新規作成する。管理者認証必須。

**リクエストボディ:**
```json
{
  "name": "新規店舗",
  "slug": "C4D5",
  "plan": "standard"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| name | ○ | 店舗名 |
| slug | ○ | テナントID（4桁16進数: 0-9, A-F） |
| plan | - | プラン（standard/premium、デフォルト: standard） |

**エラーレスポンス:**
- `400` — バリデーションエラー（テナントIDが4桁hexでない等）
- `409` — テナントIDが既に使用されている

**成功レスポンス (201):**
```json
{
  "success": true,
  "tenant": { "id": "uuid", "name": "新規店舗", "slug": "C4D5", "plan": "standard", "status": "active" }
}
```

### PUT /api/admin/tenants

テナントの分離先URLを更新する。管理者認証必須。

**リクエストボディ:**
```json
{
  "id": "uuid",
  "redirect_url": "https://example.com"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| id | ○ | テナントUUID |
| redirect_url | ○ | 分離先URL（null でSaaSに戻す） |

**成功レスポンス (200):**
```json
{
  "success": true,
  "tenant": { "id": "uuid", "redirect_url": "https://example.com" }
}
```

---

## 管理者専用 — その他（TODO - 未実装）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/admin/workers | GET/POST | 担当者管理 |
| /api/admin/vendors | POST/PATCH | 業者登録・更新 |
| /api/admin/settings | GET/PATCH | テナント設定管理 |
| /api/admin/logs | GET | 操作ログ一覧 |
| /api/admin/send-alerts | POST | 手動アラートメール送信 |

---

## 写真管理（TODO - 未実装）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/photos/upload | POST | 写真アップロード（Cloudflare R2） |

---

## Cron Jobs（TODO - 未実装）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/cron/alerts | GET | アラート定期実行 |
| /api/cron/archive-items | GET | 古いデータのアーカイブ |

---

## 共通仕様

### 認証

- 認証系API (`/api/auth/*`, `/api/tenant`): 認証不要
- 担当者用API: JWT署名付きセッションCookie (`kuratsugi_session`) が必須
- 管理者用API (`/api/admin/*`): JWT署名付き管理者セッションCookieが必須（Google OAuth認証で発行）
- 未認証時: `{ error: '認証が必要です' }` (HTTP 401)

### テナント分離

全ての業務APIは、セッション内の `tenantId` に基づいてデータをフィルタリングする。テナント横断のデータアクセスは不可。

### セッション管理

- Cookie名: `kuratsugi_session`
- HttpOnly, Secure（本番環境）, SameSite=Strict
- セッションデータ: workerId, name, role, tenantId, tenantSlug, loginAt

### 商品API仕様（実装時）

#### GET /api/items

**クエリパラメータ:**

| パラメータ | 説明 |
| ---------- | ---- |
| status | カンマ区切りで複数ステータス指定可（例: `status=draft,received,pending_ship`） |

#### PATCH /api/items/[itemNumber]

**isClaimActive検証ルール:**

| 条件 | 結果 |
| ---- | ---- |
| `isClaimActive: true → false` かつオープンなクレームが存在 | 400エラー |
| `isClaimActive: true → false` かつオープンなクレームなし | 成功 |
| その他の変更 | 通常処理 |

**ステータス遷移検証:**

不正なステータス遷移は400エラーで拒否される。許可される遷移は `ALLOWED_STATUS_TRANSITIONS` マップに定義。
