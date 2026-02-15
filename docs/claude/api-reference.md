# API リファレンス

## 認証系（実装済み）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/auth/worker | POST | 担当者PIN認証（記憶トークン発行） |
| /api/auth/worker/remember | POST | 記憶トークンによる自動ログイン |
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

## 業務系（TODO - 未実装）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/customers | GET/POST | 顧客検索・登録（partner_id対応） |
| /api/partners | GET | 取引先一覧 |
| /api/receptions | GET/POST | 受付情報取得・登録 |
| /api/receptions/draft | POST | 下書き保存（顧客未設定での商品登録） |
| /api/receptions/[receptionNumber]/customer | PATCH | 下書きへの顧客紐付け |
| /api/items | GET/POST/PUT | 商品管理（ステータスフィルタ対応） |
| /api/items/[itemNumber] | GET/PATCH | 商品詳細・更新（isClaimActive検証あり） |
| /api/vendors | GET | 業者一覧 |
| /api/settings | GET | テナント設定取得 |

---

## クレーム管理系（TODO - 未実装）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/claims | GET/POST | クレーム一覧・新規登録 |
| /api/claims/[claimId] | GET/PATCH | クレーム詳細・更新 |
| /api/claims/[claimId]/logs | GET/POST | 対応ログ一覧・追加 |

---

## 管理者専用（TODO - 未実装）

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
| /api/photos/upload | POST | 写真アップロード（Supabase Storage） |
| /api/photos/upload-temp | POST | 写真一時アップロード |

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
- その他のAPI: JWT署名付きセッションCookieが必須
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
