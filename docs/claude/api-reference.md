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

## 業務系（実装済み）

| エンドポイント | メソッド | 認証 | 説明 |
| -------------- | -------- | ---- | ---- |
| /api/customers | GET/POST | 担当者 | 顧客検索・登録（partner_id対応） |
| /api/partners | GET | 担当者 | 取引先一覧 |
| /api/receptions | GET/POST | 担当者 | 受付情報取得・登録 |
| /api/receptions/draft | POST | 担当者 | 下書き保存（顧客未設定での商品登録） |
| /api/receptions/[receptionNumber]/customer | PATCH | 担当者 | 下書きへの顧客紐付け |
| /api/items | GET/POST | 担当者 | 商品一覧（ページネーション対応）・作成 |
| /api/items/[itemNumber] | GET/PATCH | 担当者 | 商品詳細・更新（ステータス遷移検証あり） |
| /api/vendors | GET | 担当者 | 業者一覧 |
| /api/settings | GET | 担当者 | テナント設定取得 |

---

## 業務API詳細

### PATCH /api/receptions/[receptionNumber]/customer

下書き受付への顧客紐付け。受付レコードに顧客情報を設定し、紐づく全商品の顧客情報を更新、draftステータスの商品をpending_shipに遷移させる。

**認証:** 担当者（JWT Cookie）

**リクエストボディ:**
```json
{
  "customer_id": "uuid",
  "customer_name": "山田太郎",
  "partner_id": "uuid",
  "partner_name": "着物問屋A"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| customer_id | ○ | 顧客UUID |
| customer_name | ○ | 顧客名 |
| partner_id | - | 取引先UUID |
| partner_name | - | 取引先名 |

**成功レスポンス (200):**
```json
{
  "success": true,
  "reception": { "id": "uuid", "reception_number": "T01-202601181430", "customer_id": "uuid", "customer_name": "山田太郎", "..." : "..." }
}
```

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | customer_idとcustomer_nameは必須です | 必須フィールド未指定 |
| 401 | 認証が必要です | 未認証 |
| 404 | 受付が見つかりません | 受付番号不正またはテナント不一致 |
| 500 | 受付の更新に失敗しました | DB更新失敗 |

**副作用:**
- 紐づく全商品の `customer_name`, `customer_name_kana`, `partner_id`, `partner_name` を更新
- `draft` ステータスの商品を `pending_ship` に自動遷移
- 操作ログを記録

### GET /api/items

商品一覧取得。ページネーション対応。

**認証:** 担当者（JWT Cookie）

**クエリパラメータ:**

| パラメータ | 説明 |
| ---------- | ---- |
| status | カンマ区切りで複数ステータス指定可（例: `status=draft,pending_ship`） |
| q | キーワード検索（預かり番号・顧客名・顧客名カナ・取引先名・商品名） |
| includeArchived | `true` でアーカイブ済みを含む（デフォルト: `false`） |
| page | ページ番号（デフォルト: 1） |
| limit | 1ページあたりの件数（デフォルト: 20、最大: 100） |

**成功レスポンス (200):**
```json
{
  "items": [ { "..." : "..." } ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### POST /api/items

商品作成。

**認証:** 担当者（JWT Cookie）

**リクエストボディ:**
```json
{
  "reception_id": "uuid",
  "item_number": "T01-20260118143025-01",
  "product_type": "kimono",
  "product_name": "訪問着"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| reception_id | ○ | 受付UUID |
| item_number | ○ | 預かり番号 |
| product_type | ○ | 商品種別 |
| product_name | ○ | 商品名 |
| customer_name | - | 顧客名 |
| customer_name_kana | - | 顧客名カナ |
| partner_id | - | 取引先UUID |
| partner_name | - | 取引先名 |
| color | - | 色 |
| material | - | 素材 |
| size | - | サイズ |
| condition_note | - | 状態メモ |
| request_type | - | 加工種別 |
| request_detail | - | 加工詳細 |
| status | - | 初期ステータス |
| vendor_id | - | 業者UUID |
| vendor_name | - | 業者名 |
| scheduled_ship_date | - | 発送予定日 |
| scheduled_return_date | - | 返却予定日 |
| photo_front_url | - | 表面写真URL |
| photo_back_url | - | 裏面写真URL |
| photo_front_memo | - | 表面写真メモ |
| photo_back_memo | - | 裏面写真メモ |
| additional_photos | - | 追加写真（JSON配列） |

**成功レスポンス (201):**
```json
{
  "success": true,
  "item": { "..." : "..." }
}
```

### GET /api/items/[itemNumber]

商品詳細取得。操作ログ（最新50件）も同時に返す。

**認証:** 担当者（JWT Cookie）

**成功レスポンス (200):**
```json
{
  "item": { "..." : "..." },
  "logs": [ { "..." : "..." } ]
}
```

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 401 | 認証が必要です | 未認証 |
| 404 | 商品が見つかりません | 商品番号不正またはテナント不一致 |

### PATCH /api/items/[itemNumber]

商品ステータス遷移・フィールド更新。

**認証:** 担当者（JWT Cookie）

**リクエストボディ:** 更新したいフィールドのみ指定

```json
{
  "status": "processing",
  "vendor_id": "uuid",
  "vendor_name": "加工業者A"
}
```

**更新可能フィールド:**

`status`, `customer_name`, `customer_name_kana`, `partner_id`, `partner_name`, `product_type`, `product_name`, `color`, `material`, `size`, `condition_note`, `request_type`, `request_detail`, `vendor_id`, `vendor_name`, `scheduled_ship_date`, `scheduled_return_date`, `ship_to_vendor_date`, `return_from_vendor_date`, `return_to_customer_date`, `vendor_tracking_number`, `vendor_carrier`, `customer_tracking_number`, `customer_carrier`, `photo_front_url`, `photo_back_url`, `photo_after_front_url`, `photo_after_back_url`, `photo_front_memo`, `photo_back_memo`, `photo_after_front_memo`, `photo_after_back_memo`, `additional_photos`, `is_paid_storage`, `paid_storage_start_date`, `is_claim_active`, `ship_history`, `return_history`

**ステータス遷移検証:** 不正なステータス遷移は400エラーで拒否される。許可される遷移は `ALLOWED_STATUS_TRANSITIONS` マップに定義。

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | 更新するフィールドが指定されていません | 空リクエスト |
| 400 | ステータス遷移エラー | 不正なステータス遷移 |
| 401 | 認証が必要です | 未認証 |
| 404 | 商品が見つかりません | 商品番号不正またはテナント不一致 |

---

## クレーム管理系（実装済み）

| エンドポイント | メソッド | 認証 | 説明 |
| -------------- | -------- | ---- | ---- |
| /api/claims | GET | 担当者 | クレーム一覧取得 |
| /api/claims | POST | 担当者 | クレーム新規登録 |
| /api/claims/[claimId] | GET | 担当者 | クレーム詳細取得（ログ含む） |
| /api/claims/[claimId] | PATCH | 担当者 | クレーム更新 |
| /api/claims/[claimId]/logs | GET | 担当者 | 対応ログ一覧取得 |
| /api/claims/[claimId]/logs | POST | 担当者 | 対応ログ追加 |

### GET /api/claims

クレーム一覧取得。テナントスコープ。

**認証:** 担当者（JWT Cookie）

**クエリパラメータ:**

| パラメータ | 説明 |
| ---------- | ---- |
| status | ステータスフィルタ（`open` / `closed`） |
| item_number | 商品番号フィルタ |

**成功レスポンス (200):**
```json
{
  "claims": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "claim_id": "CLM-20260218143025",
      "item_id": "uuid",
      "item_number": "T01-20260118143025-01",
      "customer_name": "山田太郎",
      "status": "open",
      "description": "染みが除去されていない",
      "category": "quality",
      "assignee_id": "uuid",
      "assignee_name": "田中",
      "due_date": "2026-03-01",
      "created_by": "uuid",
      "created_by_name": "田中",
      "resolved_at": null,
      "resolved_by": null,
      "resolved_by_name": null,
      "resolution": null,
      "created_at": "2026-02-18T05:30:25Z"
    }
  ]
}
```

### POST /api/claims

クレーム新規登録。商品の `is_claim_active` を `true` に更新し、初期ログを自動登録する。

**認証:** 担当者（JWT Cookie）

**リクエストボディ:**
```json
{
  "item_number": "T01-20260118143025-01",
  "description": "染みが除去されていない",
  "category": "quality",
  "assignee_id": "uuid",
  "due_date": "2026-03-01"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| item_number | ○ | 対象商品の預かり番号 |
| description | ○ | クレーム内容 |
| category | - | カテゴリ |
| assignee_id | - | 担当者UUID |
| due_date | - | 対応期限（YYYY-MM-DD） |

**成功レスポンス (201):**
```json
{
  "success": true,
  "claim": { "id": "uuid", "claim_id": "CLM-20260218143025", "..." : "..." }
}
```

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | item_number と description は必須です | 必須フィールド未指定 |
| 400 | 担当者情報が取得できません | ワーカー情報取得失敗 |
| 401 | 認証が必要です | 未認証 |
| 404 | 指定された商品が見つかりません | 商品番号不正またはテナント不一致 |

**副作用:**
- クレームID自動生成（`CLM-YYYYMMDDHHmmss` 形式、JST）
- 商品の `is_claim_active` を `true` に更新
- 初期ログ（action: `opened`）を `claim_logs` に自動登録
- 操作ログ記録

### GET /api/claims/[claimId]

クレーム詳細取得。対応ログも同時に返す。`claimId` はクレームのUUID。

**認証:** 担当者（JWT Cookie）

**成功レスポンス (200):**
```json
{
  "claim": { "id": "uuid", "claim_id": "CLM-20260218143025", "..." : "..." },
  "logs": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "claim_id": "uuid",
      "item_number": "T01-20260118143025-01",
      "worker_id": "uuid",
      "worker_name": "田中",
      "action": "opened",
      "note": "染みが除去されていない",
      "created_at": "2026-02-18T05:30:25Z"
    }
  ]
}
```

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 401 | 認証が必要です | 未認証 |
| 404 | クレームが見つかりません | UUID不正またはテナント不一致 |

### PATCH /api/claims/[claimId]

クレーム更新。ステータス変更時は自動で対応ログを記録し、商品の `is_claim_active` フラグを制御する。

**認証:** 担当者（JWT Cookie）

**リクエストボディ:** 更新したいフィールドのみ指定
```json
{
  "status": "closed",
  "resolution": "業者に再加工を依頼し、問題解決済み"
}
```

**更新可能フィールド:**

| フィールド | 説明 |
| ---------- | ---- |
| status | `open` / `closed` |
| description | クレーム内容 |
| category | カテゴリ |
| assignee_id | 担当者UUID（assignee_nameは自動解決） |
| due_date | 対応期限 |
| resolution | 解決内容 |

**ステータス変更時の副作用:**

| 遷移 | 動作 |
| ---- | ---- |
| → closed | `resolved_at`, `resolved_by`, `resolved_by_name` を自動設定。他にオープンなクレームがなければ商品の `is_claim_active` を `false` に。ログ（action: `closed`）自動記録。 |
| closed → open | `resolved_at`, `resolved_by`, `resolved_by_name`, `resolution` をクリア。商品の `is_claim_active` を `true` に。ログ（action: `reopened`）自動記録。 |

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | 更新するフィールドが指定されていません | 空リクエスト |
| 400 | 担当者情報が取得できません | ワーカー情報取得失敗 |
| 401 | 認証が必要です | 未認証 |
| 404 | クレームが見つかりません | UUID不正またはテナント不一致 |

### GET /api/claims/[claimId]/logs

クレーム対応ログ一覧取得。

**認証:** 担当者（JWT Cookie）

**成功レスポンス (200):**
```json
{
  "logs": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "claim_id": "uuid",
      "item_number": "T01-20260118143025-01",
      "worker_id": "uuid",
      "worker_name": "田中",
      "action": "opened",
      "note": "クレーム登録",
      "created_at": "2026-02-18T05:30:25Z"
    }
  ]
}
```

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 401 | 認証が必要です | 未認証 |
| 404 | クレームが見つかりません | UUID不正またはテナント不一致 |

### POST /api/claims/[claimId]/logs

クレーム対応ログ追加。

**認証:** 担当者（JWT Cookie）

**リクエストボディ:**
```json
{
  "action": "updated",
  "note": "業者に確認中、回答待ち"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| action | ○ | `updated` / `resolved` / `closed` / `reopened` |
| note | ○ | 対応内容 |

**成功レスポンス (201):**
```json
{
  "success": true,
  "log": { "id": "uuid", "action": "updated", "note": "業者に確認中、回答待ち", "..." : "..." }
}
```

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | 対応内容（note）は必須です | note未指定 |
| 400 | action は updated, resolved, closed, reopened のいずれかを指定してください | 不正なaction |
| 400 | 担当者情報が取得できません | ワーカー情報取得失敗 |
| 401 | 認証が必要です | 未認証 |
| 404 | クレームが見つかりません | UUID不正またはテナント不一致 |

---

## 写真管理（実装済み）

| エンドポイント | メソッド | 認証 | 説明 |
| -------------- | -------- | ---- | ---- |
| /api/photos/upload | POST | 担当者 | 写真アップロード（Cloudflare R2） |

### POST /api/photos/upload

写真をCloudflare R2にアップロード。WebP形式で保存。

**認証:** 担当者（JWT Cookie）

**リクエスト:** `multipart/form-data`

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| file | ○ | 画像ファイル（JPEG, PNG, WebP, HEIC対応） |
| item_number | ○ | 対象商品の預かり番号 |
| type | ○ | `front` / `back` / `after_front` / `after_back` / `additional` |

**制限:**
- 最大ファイルサイズ: 10MB
- 対応フォーマット: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`

**保存パス:** `{tenantId}/{itemNumber}/{type}_{timestamp}.webp`

**成功レスポンス (200):**
```json
{
  "success": true,
  "url": "https://r2.example.com/tenant-id/T01-20260118143025-01/front_1708234567890.webp"
}
```

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | ファイルが指定されていません | file未指定 |
| 400 | item_numberは必須です | item_number未指定 |
| 400 | typeはfront、back、after_front、after_back、additionalのいずれかを指定してください | type不正 |
| 400 | 画像ファイル（JPEG、PNG、WebP、HEIC）のみアップロード可能です | 非対応フォーマット |
| 400 | ファイルサイズは10MB以下にしてください | サイズ超過 |
| 401 | 認証が必要です | 未認証 |
| 500 | 写真のアップロードに失敗しました | R2アップロード失敗 |

---

## Cron Jobs（実装済み）

| エンドポイント | メソッド | 認証 | 説明 |
| -------------- | -------- | ---- | ---- |
| /api/cron/alerts | GET | CRON_SECRET | デイリーアラート送信 |
| /api/cron/archive-items | GET | CRON_SECRET | 週次アーカイブ |

### GET /api/cron/alerts

毎日 JST 0:00（UTC 15:00）に実行。各テナントの要注意商品を検出し、アラートメールを送信する。

**認証:** `Authorization: Bearer {CRON_SECRET}` ヘッダー

**アラート検出ルール:**

| ステータス | 条件 | alert_type |
| ---------- | ---- | ---------- |
| pending_ship | 3日以上経過 | ship_overdue |
| processing | 14日以上経過 | processing_overdue |
| returned | 7日以上経過 | return_overdue |
| paid_storage | 全件（経過日数付き） | paid_storage |
| on_hold | 3日以上経過 | on_hold_overdue |
| awaiting_customer | 7日以上経過 | awaiting_customer_overdue |

**テナント設定による制御:**
- `alertEmailEnabled`: `false` でスキップ
- `alertEmail`: 送信先メールアドレス（未設定でスキップ）
- `resendApiKey`: テナント固有のResend APIキー（未設定時はグローバルキー使用）
- `emailFrom`: 送信元アドレス

**成功レスポンス (200):**
```json
{
  "success": true,
  "date": "2026-02-18",
  "tenantCount": 3,
  "results": [
    {
      "tenant": "A3F0",
      "alertCount": 5,
      "emailSent": true
    },
    {
      "tenant": "B1C2",
      "alertCount": 0,
      "emailSent": false
    }
  ]
}
```

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 401 | Unauthorized | CRON_SECRET不一致 |
| 500 | エラーメッセージ | 致命的エラー |

### GET /api/cron/archive-items

毎週日曜 JST 0:10（UTC 15:10）に実行。完了・キャンセル済みの古い商品を自動アーカイブし、古い操作ログを削除する。

**認証:** `Authorization: Bearer {CRON_SECRET}` ヘッダー

**アーカイブルール:**
- 対象ステータス: `completed`, `cancelled`, `cancelled_completed`
- デフォルト日数: 90日（テナント設定 `archiveAfterDays` で変更可能）
- `is_archived` を `true` に更新

**ログ削除ルール:**
- アーカイブ済み商品に紐づく `operation_logs` のうち180日以上経過したものを削除

**成功レスポンス (200):**
```json
{
  "success": true,
  "date": "2026-02-18",
  "tenantCount": 3,
  "results": [
    {
      "tenant": "A3F0",
      "archivedCount": 12,
      "logsDeleted": 45
    },
    {
      "tenant": "B1C2",
      "archivedCount": 0,
      "logsDeleted": 0
    }
  ]
}
```

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 401 | Unauthorized | CRON_SECRET不一致 |
| 500 | エラーメッセージ | 致命的エラー |

---

## 管理者専用 — テナント管理（実装済み）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/admin/tenants | GET | テナント一覧取得 |
| /api/admin/tenants | POST | テナント新規作成 |
| /api/admin/tenants | PUT | テナントのプラン・分離URL更新 |
| /api/admin/tenants | PATCH | テナントステータス変更 |
| /api/admin/tenants/[tenantId]/settings | GET | テナント個別設定取得 |
| /api/admin/tenants/[tenantId]/settings | PUT | テナント個別設定保存 |

### GET /api/admin/tenants

全テナント情報を一覧取得する。管理者認証必須。

**成功レスポンス (200):**
```json
{
  "tenants": [
    {
      "id": "uuid",
      "slug": "A3F0",
      "name": "デモ着物店",
      "plan": "standard",
      "status": "active",
      "redirect_url": null,
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

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | 店舗名とテナントIDは必須です | 必須フィールド未指定 |
| 400 | テナントIDは4桁の16進数で入力してください | slug形式不正 |
| 409 | このテナントIDは既に使用されています | slug重複 |

**成功レスポンス (201):**
```json
{
  "success": true,
  "tenant": { "id": "uuid", "name": "新規店舗", "slug": "C4D5", "plan": "standard", "status": "active" }
}
```

### PUT /api/admin/tenants

テナントのプラン・分離先URLを更新する。管理者認証必須。

**リクエストボディ:**
```json
{
  "id": "uuid",
  "plan": "premium",
  "redirect_url": "https://example.com"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| id | ○ | テナントUUID |
| plan | - | `standard` / `premium` |
| redirect_url | - | 分離先URL（`null` または空文字でSaaSに戻す） |

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | id は必須です | id未指定 |
| 400 | plan は standard または premium のみ指定できます | plan不正 |
| 400 | 無効なURL形式です | redirect_url不正 |
| 400 | 更新するフィールドがありません | plan, redirect_urlともに未指定 |

**成功レスポンス (200):**
```json
{
  "success": true,
  "tenant": { "id": "uuid", "plan": "premium", "redirect_url": "https://example.com", "..." : "..." }
}
```

### PATCH /api/admin/tenants

テナントステータスを変更する。管理者認証必須。

**リクエストボディ:**
```json
{
  "id": "uuid",
  "status": "suspended"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| id | ○ | テナントUUID |
| status | ○ | `active` / `suspended` |

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | id と status は必須です | 必須フィールド未指定 |
| 400 | status は active または suspended のみ指定できます | status不正 |
| 400 | 解約済みテナントのステータスは変更できません | cancelled状態のテナント |
| 400 | 既に同じステータスです | 変更なし |
| 404 | テナントが見つかりません | UUID不正 |

**成功レスポンス (200):**
```json
{
  "success": true,
  "tenant": { "id": "uuid", "status": "suspended", "..." : "..." }
}
```

### GET /api/admin/tenants/[tenantId]/settings

テナント個別設定を取得する。プラットフォーム管理者認証必須。

**成功レスポンス (200):**
```json
{
  "settings": {
    "alertEmailEnabled": "true",
    "alertEmail": "shop@example.com",
    "resendApiKey": "re_xxxxx",
    "emailFrom": "noreply@example.com",
    "shipDeadlineDays": "3",
    "returnDeadlineDays": "7"
  }
}
```

### PUT /api/admin/tenants/[tenantId]/settings

テナント個別設定を保存する。プラットフォーム管理者認証必須。

**リクエストボディ:**
```json
{
  "settings": {
    "alertEmailEnabled": "true",
    "alertEmail": "shop@example.com",
    "resendApiKey": "re_xxxxx"
  }
}
```

**保存可能なキー:**

| キー | 説明 |
| ---- | ---- |
| alertEmailEnabled | アラートメール有効/無効 |
| alertEmail | アラート送信先メールアドレス |
| resendApiKey | テナント固有のResend APIキー |
| emailFrom | メール送信元アドレス |
| shipDeadlineDays | 発送期限日数 |
| returnDeadlineDays | 返却期限日数 |
| stagnationThresholdDays | 滞留閾値日数 |
| autoArchiveDays | 自動アーカイブ日数 |
| paidStorageGraceDays | 有料預かり猶予日数 |

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | 設定データが不正です | settings未指定またはオブジェクトでない |
| 500 | 一部の設定の保存に失敗しました | DB書き込み失敗（detailsにキーごとのエラー） |

**成功レスポンス (200):**
```json
{
  "success": true
}
```

---

## 管理者専用 — 担当者管理（実装済み）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/admin/workers | GET | 担当者一覧取得 |
| /api/admin/workers | POST | 担当者新規作成 |
| /api/admin/workers | PUT | 担当者情報更新 |
| /api/admin/workers | PATCH | 担当者ステータス切替 / PIN再設定 |

### GET /api/admin/workers

担当者一覧を取得する。管理者認証必須。テナント名・slugも付与して返す。

**クエリパラメータ:**

| パラメータ | 説明 |
| ---------- | ---- |
| tenant_id | テナントUUIDでフィルタ |

**成功レスポンス (200):**
```json
{
  "workers": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "worker_id": "TK7M",
      "name": "田中",
      "email": "tanaka@example.com",
      "is_active": true,
      "last_login_at": "2026-02-18T05:30:25Z",
      "created_at": "2026-01-01T00:00:00Z",
      "tenant_name": "デモ着物店",
      "tenant_slug": "A3F0"
    }
  ]
}
```

### POST /api/admin/workers

担当者を新規作成する。管理者認証必須。担当者IDはサーバー側で自動生成（`T` + ランダム英数字3文字）。

**リクエストボディ:**
```json
{
  "tenant_id": "uuid",
  "name": "田中",
  "pin": "12345678",
  "email": "tanaka@example.com"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| tenant_id | ○ | テナントUUID |
| name | ○ | 担当者名 |
| pin | ○ | PINコード（8桁数字） |
| email | - | メールアドレス |

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | テナントID、担当者名、PINは必須です | 必須フィールド未指定 |
| 400 | PINコードは8桁の数字で入力してください | PIN形式不正 |
| 500 | 担当者IDの生成に失敗しました | ID衝突が10回連続 |

**成功レスポンス (201):**
```json
{
  "success": true,
  "worker": { "id": "uuid", "worker_id": "TK7M", "name": "田中", "..." : "..." }
}
```

### PUT /api/admin/workers

担当者情報を更新する。管理者認証必須。

**リクエストボディ:**
```json
{
  "id": "uuid",
  "name": "田中太郎",
  "email": "tanaka-taro@example.com"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| id | ○ | 担当者UUID |
| name | ○ | 担当者名 |
| email | - | メールアドレス |

**成功レスポンス (200):**
```json
{
  "success": true,
  "worker": { "id": "uuid", "name": "田中太郎", "..." : "..." }
}
```

### PATCH /api/admin/workers

担当者のステータス切替またはPIN再設定。管理者認証必須。

**リクエストボディ（ステータス切替）:**
```json
{
  "id": "uuid",
  "action": "toggle_active"
}
```

**リクエストボディ（PIN再設定）:**
```json
{
  "id": "uuid",
  "action": "reset_pin",
  "pin": "87654321"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| id | ○ | 担当者UUID |
| action | ○ | `toggle_active` / `reset_pin` |
| pin | reset_pin時○ | 新しいPINコード（8桁数字） |

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | id と action は必須です | 必須フィールド未指定 |
| 400 | PINコードは8桁の数字で入力してください | PIN形式不正（reset_pin時） |
| 400 | 無効なアクションです | 不正なaction |
| 404 | 担当者が見つかりません | UUID不正 |

**成功レスポンス (200):**
```json
{
  "success": true,
  "worker": { "id": "uuid", "is_active": false, "..." : "..." }
}
```

---

## 管理者専用 — 顧客管理（実装済み）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/admin/customers | GET | 顧客一覧取得 |
| /api/admin/customers | POST | 顧客新規作成 |
| /api/admin/customers | PUT | 顧客情報更新 |
| /api/admin/customers | PATCH | 顧客ステータス切替 |

### GET /api/admin/customers

顧客一覧を取得する。管理者認証必須。テナント名・slugも付与して返す。

**クエリパラメータ:**

| パラメータ | 説明 |
| ---------- | ---- |
| tenant_id | テナントUUIDでフィルタ |

**成功レスポンス (200):**
```json
{
  "customers": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "customer_id": "CK7M",
      "partner_id": "uuid",
      "partner_name": "着物問屋A",
      "name": "山田太郎",
      "name_kana": "ヤマダタロウ",
      "phone": "090-1234-5678",
      "email": "yamada@example.com",
      "postal_code": "100-0001",
      "address": "東京都千代田区...",
      "notes": "VIP顧客",
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z",
      "tenant_name": "デモ着物店",
      "tenant_slug": "A3F0"
    }
  ]
}
```

### POST /api/admin/customers

顧客を新規作成する。管理者認証必須。顧客IDはサーバー側で自動生成（`C` + ランダム英数字3文字）。

**リクエストボディ:**
```json
{
  "tenant_id": "uuid",
  "name": "山田太郎",
  "name_kana": "ヤマダタロウ",
  "partner_id": "uuid",
  "partner_name": "着物問屋A",
  "phone": "090-1234-5678",
  "email": "yamada@example.com",
  "postal_code": "100-0001",
  "address": "東京都千代田区...",
  "notes": "VIP顧客"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| tenant_id | ○ | テナントUUID |
| name | ○ | 顧客名 |
| name_kana | - | 顧客名カナ |
| partner_id | - | 取引先UUID |
| partner_name | - | 取引先名 |
| phone | - | 電話番号 |
| email | - | メールアドレス |
| postal_code | - | 郵便番号 |
| address | - | 住所 |
| notes | - | 備考 |

**成功レスポンス (201):**
```json
{
  "success": true,
  "customer": { "id": "uuid", "customer_id": "CK7M", "name": "山田太郎", "..." : "..." }
}
```

### PUT /api/admin/customers

顧客情報を更新する。管理者認証必須。

**リクエストボディ:**
```json
{
  "id": "uuid",
  "name": "山田太郎",
  "name_kana": "ヤマダタロウ"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| id | ○ | 顧客UUID |
| name | ○ | 顧客名 |
| その他 | - | POST と同じオプショナルフィールド（tenant_id除く） |

**成功レスポンス (200):**
```json
{
  "success": true,
  "customer": { "id": "uuid", "name": "山田太郎", "..." : "..." }
}
```

### PATCH /api/admin/customers

顧客のステータスを切り替える。管理者認証必須。

**リクエストボディ:**
```json
{
  "id": "uuid",
  "action": "toggle_active"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| id | ○ | 顧客UUID |
| action | ○ | `toggle_active` |

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | id と action は必須です | 必須フィールド未指定 |
| 400 | 無効なアクションです | 不正なaction |
| 404 | 顧客が見つかりません | UUID不正 |

**成功レスポンス (200):**
```json
{
  "success": true,
  "customer": { "id": "uuid", "is_active": false, "..." : "..." }
}
```

---

## 管理者専用 — 業者管理（実装済み）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/admin/vendors | GET | 業者一覧取得 |
| /api/admin/vendors | POST | 業者新規作成 |
| /api/admin/vendors | PUT | 業者情報更新 |
| /api/admin/vendors | PATCH | 業者ステータス切替 |

### GET /api/admin/vendors

業者一覧を取得する。管理者認証必須。テナント名・slugも付与して返す。

**クエリパラメータ:**

| パラメータ | 説明 |
| ---------- | ---- |
| tenant_id | テナントUUIDでフィルタ |

**成功レスポンス (200):**
```json
{
  "vendors": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "vendor_id": "VK7M",
      "name": "加工業者A",
      "name_kana": "カコウギョウシャエー",
      "phone": "03-1234-5678",
      "email": "vendor@example.com",
      "postal_code": "100-0001",
      "address": "東京都千代田区...",
      "specialty": "しみ抜き",
      "notes": null,
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z",
      "tenant_name": "デモ着物店",
      "tenant_slug": "A3F0"
    }
  ]
}
```

### POST /api/admin/vendors

業者を新規作成する。管理者認証必須。業者IDはサーバー側で自動生成（`V` + ランダム英数字3文字）。

**リクエストボディ:**
```json
{
  "tenant_id": "uuid",
  "name": "加工業者A",
  "name_kana": "カコウギョウシャエー",
  "phone": "03-1234-5678",
  "email": "vendor@example.com",
  "postal_code": "100-0001",
  "address": "東京都千代田区...",
  "specialty": "しみ抜き",
  "notes": null
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| tenant_id | ○ | テナントUUID |
| name | ○ | 業者名 |
| name_kana | - | 業者名カナ |
| phone | - | 電話番号 |
| email | - | メールアドレス |
| postal_code | - | 郵便番号 |
| address | - | 住所 |
| specialty | - | 専門分野 |
| notes | - | 備考 |

**成功レスポンス (201):**
```json
{
  "success": true,
  "vendor": { "id": "uuid", "vendor_id": "VK7M", "name": "加工業者A", "..." : "..." }
}
```

### PUT /api/admin/vendors

業者情報を更新する。管理者認証必須。

**リクエストボディ:**
```json
{
  "id": "uuid",
  "name": "加工業者A（改名）"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| id | ○ | 業者UUID |
| name | ○ | 業者名 |
| その他 | - | POST と同じオプショナルフィールド（tenant_id除く） |

**成功レスポンス (200):**
```json
{
  "success": true,
  "vendor": { "id": "uuid", "name": "加工業者A（改名）", "..." : "..." }
}
```

### PATCH /api/admin/vendors

業者のステータスを切り替える。管理者認証必須。

**リクエストボディ:**
```json
{
  "id": "uuid",
  "action": "toggle_active"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| id | ○ | 業者UUID |
| action | ○ | `toggle_active` |

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | id と action は必須です | 必須フィールド未指定 |
| 400 | 無効なアクションです | 不正なaction |
| 404 | 業者が見つかりません | UUID不正 |

**成功レスポンス (200):**
```json
{
  "success": true,
  "vendor": { "id": "uuid", "is_active": false, "..." : "..." }
}
```

---

## 管理者専用 — 取引先管理（実装済み）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/admin/partners | GET | 取引先一覧取得 |
| /api/admin/partners | POST | 取引先新規作成 |
| /api/admin/partners | PUT | 取引先情報更新 |
| /api/admin/partners | PATCH | 取引先ステータス切替 |

### GET /api/admin/partners

取引先一覧を取得する。管理者認証必須。テナント名・slugも付与して返す。

**クエリパラメータ:**

| パラメータ | 説明 |
| ---------- | ---- |
| tenant_id | テナントUUIDでフィルタ |

**成功レスポンス (200):**
```json
{
  "partners": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "partner_id": "PK7M",
      "partner_code": "A001",
      "partner_name": "着物問屋A",
      "name_kana": "キモノトンヤエー",
      "contact_person": "鈴木",
      "phone": "03-1234-5678",
      "fax": "03-1234-5679",
      "email": "partner@example.com",
      "postal_code": "100-0001",
      "address": "東京都千代田区...",
      "notes": null,
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z",
      "tenant_name": "デモ着物店",
      "tenant_slug": "A3F0"
    }
  ]
}
```

### POST /api/admin/partners

取引先を新規作成する。管理者認証必須。取引先IDはサーバー側で自動生成（`P` + ランダム英数字3文字）。

**リクエストボディ:**
```json
{
  "tenant_id": "uuid",
  "partner_name": "着物問屋A",
  "partner_code": "A001",
  "name_kana": "キモノトンヤエー",
  "contact_person": "鈴木",
  "phone": "03-1234-5678",
  "fax": "03-1234-5679",
  "email": "partner@example.com",
  "postal_code": "100-0001",
  "address": "東京都千代田区...",
  "notes": null
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| tenant_id | ○ | テナントUUID |
| partner_name | ○ | 取引先名 |
| partner_code | - | 取引先コード |
| name_kana | - | 取引先名カナ |
| contact_person | - | 担当者名 |
| phone | - | 電話番号 |
| fax | - | FAX番号 |
| email | - | メールアドレス |
| postal_code | - | 郵便番号 |
| address | - | 住所 |
| notes | - | 備考 |

**成功レスポンス (201):**
```json
{
  "success": true,
  "partner": { "id": "uuid", "partner_id": "PK7M", "partner_name": "着物問屋A", "..." : "..." }
}
```

### PUT /api/admin/partners

取引先情報を更新する。管理者認証必須。

**リクエストボディ:**
```json
{
  "id": "uuid",
  "partner_name": "着物問屋A（改名）"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| id | ○ | 取引先UUID |
| partner_name | ○ | 取引先名 |
| その他 | - | POST と同じオプショナルフィールド（tenant_id除く） |

**成功レスポンス (200):**
```json
{
  "success": true,
  "partner": { "id": "uuid", "partner_name": "着物問屋A（改名）", "..." : "..." }
}
```

### PATCH /api/admin/partners

取引先のステータスを切り替える。管理者認証必須。

**リクエストボディ:**
```json
{
  "id": "uuid",
  "action": "toggle_active"
}
```

| フィールド | 必須 | 説明 |
| ---------- | ---- | ---- |
| id | ○ | 取引先UUID |
| action | ○ | `toggle_active` |

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | id と action は必須です | 必須フィールド未指定 |
| 400 | 無効なアクションです | 不正なaction |
| 404 | 取引先が見つかりません | UUID不正 |

**成功レスポンス (200):**
```json
{
  "success": true,
  "partner": { "id": "uuid", "is_active": false, "..." : "..." }
}
```

---

## 管理者専用 — 商品管理（実装済み）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/admin/items | GET | 商品一覧取得（全テナント横断） |

### GET /api/admin/items

全テナントの商品一覧を取得する（テナントフィルタ可能）。管理者認証必須。テナント名・slugも付与して返す。アーカイブ済みは除外。

**クエリパラメータ:**

| パラメータ | 説明 |
| ---------- | ---- |
| tenant_id | テナントUUIDでフィルタ |
| status | ステータスでフィルタ |
| search | キーワード検索（預かり番号・顧客名・商品名） |
| is_paid_storage | `true` で有料預かり商品のみ |

**成功レスポンス (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "item_number": "T01-20260118143025-01",
      "customer_name": "山田太郎",
      "product_name": "訪問着",
      "status": "processing",
      "tenant_name": "デモ着物店",
      "tenant_slug": "A3F0",
      "...": "..."
    }
  ]
}
```

---

## 管理者専用 — ダッシュボード（実装済み）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/admin/dashboard | GET | ダッシュボード集計データ取得 |

### GET /api/admin/dashboard

ダッシュボード用の集計データを取得する。アラート件数、ワークフロー別件数、最近の操作ログを返す。管理者認証必須。

**クエリパラメータ:**

| パラメータ | 説明 |
| ---------- | ---- |
| tenant_id | テナントUUIDでフィルタ（省略時は全テナント） |

**成功レスポンス (200):**
```json
{
  "alerts": {
    "shipOverdue": 3,
    "returnOverdue": 1,
    "longStagnation": 2,
    "onHold": 0,
    "claimActive": 1
  },
  "workflow": {
    "received": 0,
    "pendingShip": 5,
    "processing": 12,
    "returned": 3,
    "completed": 45,
    "paidStorage": 2
  },
  "recentLogs": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "worker_name": "田中",
      "action": "status_change",
      "target_type": "item",
      "target_id": "T01-20260118143025-01",
      "details": "...",
      "created_at": "2026-02-18T05:30:25Z",
      "tenant_name": "デモ着物店",
      "tenant_slug": "A3F0"
    }
  ]
}
```

**アラート集計ルール:**

| フィールド | 検出条件 |
| ---------- | -------- |
| shipOverdue | `scheduled_ship_date < today` かつ `status = pending_ship` |
| returnOverdue | `scheduled_return_date < today` かつ `status IN (processing, returned)` |
| longStagnation | `status IN (pending_ship, processing)` かつ `updated_at < 30日前` |
| onHold | `status = on_hold` |
| claimActive | `claims.status = open` |

---

## 管理者専用 — 操作ログ（実装済み）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/admin/logs | GET | 操作ログ一覧取得 |

### GET /api/admin/logs

操作ログ一覧を取得する（最大200件）。管理者認証必須。テナント名・slugも付与して返す。

**クエリパラメータ:**

| パラメータ | 説明 |
| ---------- | ---- |
| tenant_id | テナントUUIDでフィルタ |
| date_from | 開始日（YYYY-MM-DD） |
| date_to | 終了日（YYYY-MM-DD、翌日まで含む） |
| target_type | 対象タイプでフィルタ（`all` で全件） |
| tab | `auth` で認証ログのみ、`operations`（デフォルト）で認証以外 |

**成功レスポンス (200):**
```json
{
  "logs": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "worker_id": "uuid",
      "worker_name": "田中",
      "action": "status_change",
      "target_type": "item",
      "target_id": "T01-20260118143025-01",
      "details": "...",
      "created_at": "2026-02-18T05:30:25Z",
      "tenant_name": "デモ着物店",
      "tenant_slug": "A3F0"
    }
  ]
}
```

---

## 管理者専用 — メール送信履歴（実装済み）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/admin/email-logs | GET | メール送信履歴取得 |

### GET /api/admin/email-logs

メール送信履歴を取得する（最大200件）。管理者認証必須。テナント名・slugも付与して返す。

**クエリパラメータ:**

| パラメータ | 説明 |
| ---------- | ---- |
| tenant_id | テナントUUIDでフィルタ |
| email_type | メール種別でフィルタ（`all` で全件） |

**成功レスポンス (200):**
```json
{
  "logs": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "email_type": "alert",
      "to_address": "shop@example.com",
      "subject": "【預かり番頭】デモ着物店 — 5件の確認が必要です",
      "body": "...",
      "status": "sent",
      "error_message": null,
      "sent_at": "2026-02-18T00:00:00Z",
      "created_at": "2026-02-18T00:00:00Z",
      "tenant_name": "デモ着物店",
      "tenant_slug": "A3F0"
    }
  ]
}
```

---

## 管理者専用 — 有料預かり管理（実装済み）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/admin/paid-storage | GET | 有料預かり商品一覧取得 |

### GET /api/admin/paid-storage

有料預かり商品一覧を取得する。`is_paid_storage = true` の非アーカイブ商品が対象。管理者認証必須。テナント名・slugも付与して返す。

**クエリパラメータ:**

| パラメータ | 説明 |
| ---------- | ---- |
| tenant_id | テナントUUIDでフィルタ |
| status | ステータスでフィルタ（例: `paid_storage`, `completed`） |

**成功レスポンス (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "item_number": "T01-20260118143025-01",
      "reception_number": "T01-202601181430",
      "customer_name": "山田太郎",
      "product_name": "訪問着",
      "product_type": "kimono",
      "vendor_name": "加工業者A",
      "status": "paid_storage",
      "paid_storage_start_date": "2026-02-01",
      "created_at": "2026-01-18T05:30:25Z",
      "tenant_name": "デモ着物店",
      "tenant_slug": "A3F0"
    }
  ]
}
```

---

## 管理者専用 — クレーム管理（実装済み）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/admin/claims | GET | クレーム一覧取得（全テナント横断） |

### GET /api/admin/claims

全テナントのクレーム一覧を取得する（テナントフィルタ可能）。管理者認証必須。テナント名・slugも付与して返す。

**クエリパラメータ:**

| パラメータ | 説明 |
| ---------- | ---- |
| tenant_id | テナントUUIDでフィルタ |
| status | ステータスでフィルタ（`open` / `closed`） |
| search | キーワード検索（クレームID・商品番号・顧客名） |

**成功レスポンス (200):**
```json
{
  "claims": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "claim_id": "CLM-20260218143025",
      "item_number": "T01-20260118143025-01",
      "customer_name": "山田太郎",
      "status": "open",
      "description": "染みが除去されていない",
      "tenant_name": "デモ着物店",
      "tenant_slug": "A3F0",
      "...": "..."
    }
  ]
}
```

---

## 管理者専用 — 設定管理（実装済み）

| エンドポイント | メソッド | 説明 |
| -------------- | -------- | ---- |
| /api/admin/settings | GET | テナント設定取得（自テナント） |
| /api/admin/settings | PUT | テナント設定保存（自テナント） |

### GET /api/admin/settings

ログイン中の管理者のテナント設定を取得する。管理者認証必須（`role: admin`）。

**成功レスポンス (200):**
```json
{
  "settings": {
    "alertEmailEnabled": "true",
    "alertEmail": "shop@example.com"
  }
}
```

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 401 | 管理者権限が必要です | 未認証またはadminロール以外 |

### PUT /api/admin/settings

ログイン中の管理者のテナント設定を保存する。管理者認証必須（`role: admin`）。

**リクエストボディ:**
```json
{
  "settings": {
    "alertEmailEnabled": "true",
    "alertEmail": "shop@example.com"
  }
}
```

**保存可能なキー:** `/api/admin/tenants/[tenantId]/settings` と同一（`alertEmailEnabled`, `alertEmail`, `resendApiKey`, `emailFrom`, `shipDeadlineDays`, `returnDeadlineDays`, `stagnationThresholdDays`, `autoArchiveDays`, `paidStorageGraceDays`）

**エラーレスポンス:**

| ステータス | エラー | 条件 |
| ---------- | ------ | ---- |
| 400 | 設定データが不正です | settings未指定またはオブジェクトでない |
| 401 | 管理者権限が必要です | 未認証またはadminロール以外 |
| 500 | 一部の設定の保存に失敗しました | DB書き込み失敗 |

**成功レスポンス (200):**
```json
{
  "success": true
}
```

---

## 共通仕様

### 認証

- 認証系API (`/api/auth/*`, `/api/tenant`): 認証不要
- 担当者用API: JWT署名付きセッションCookie (`kuratsugi_session`) が必須
- 管理者用API (`/api/admin/*`): JWT署名付き管理者セッションCookieが必須（Google OAuth認証で発行）
- Cron API (`/api/cron/*`): `Authorization: Bearer {CRON_SECRET}` ヘッダーが必須
- 未認証時: `{ error: '認証が必要です' }` (HTTP 401)

### テナント分離

全ての業務APIは、セッション内の `tenantId` に基づいてデータをフィルタリングする。テナント横断のデータアクセスは不可。管理者APIは全テナントのデータにアクセス可能（テナントフィルタはオプション）。

### セッション管理

- Cookie名: `kuratsugi_session`
- HttpOnly, Secure（本番環境）, SameSite=Strict
- セッションデータ: workerId, name, role, tenantId, tenantSlug, loginAt

### エラーレスポンス共通形式

```json
{
  "error": "エラーメッセージ（日本語）"
}
```

一部のAPIでは追加情報を返す:
```json
{
  "error": "エラーメッセージ",
  "details": ["キーごとの詳細エラー"]
}
```
