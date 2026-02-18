# データベーススキーマ

## 概要

| 項目 | 技術 |
| ---- | ---- |
| データベース | Supabase PostgreSQL |
| データ分離 | Row Level Security (RLS) |
| テナント識別 | `tenant_id` (UUID) |
| サーバー接続 | @supabase/supabase-js + @supabase/ssr |

---

## ENUM型

### item_status（商品ステータス）

| 値 | 説明 |
| -- | ---- |
| draft | 下書き（顧客未設定） |
| received | 受付済 |
| pending_ship | 業者への発送待ち |
| processing | 加工中 |
| returned | 業者からの返却済 |
| paid_storage | 有料預かり |
| completed | 完了 |
| rework | 再加工 |
| on_hold | 顧客への返送保留 |
| awaiting_customer | 顧客確認待ち |
| cancelled | キャンセル |
| cancelled_completed | キャンセル完了 |

### carrier_type（配送業者）

| 値 | 表示名 | 追跡URL |
| -- | ------ | ------- |
| yamato | ヤマト運輸 | `https://member.kms.kuronekoyamato.co.jp/parcel/detail?pno={番号}` |
| sagawa | 佐川急便 | `https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo={番号}` |
| japanpost | 日本郵便 | `https://trackings.post.japanpost.jp/services/srv/search/direct?locale=ja&reqCodeNo1={番号}` |
| other | その他 | リンクなし |

### claim_status（クレームステータス）

| 値 | 説明 |
| -- | ---- |
| open | 対応中 |
| closed | 完了 |

### claim_category（クレームカテゴリ）

| 値 | 表示名 | 説明 |
| -- | ------ | ---- |
| quality | 品質 | 仕上がり品質、加工ミス、汚損など |
| delivery | 納期 | 納期遅延、発送遅延など |
| response | 対応 | 接客対応、連絡不備など |
| other | その他 | 上記に該当しないクレーム |

### claim_log_action（クレーム対応ログアクション）

| 値 | 説明 |
| -- | ---- |
| opened | クレーム新規作成 |
| updated | 対応メモ追加・内容更新 |
| resolved | クレーム解決（後方互換性のため残存） |
| closed | クレームクローズ |
| reopened | クレーム再オープン |

### log_action（操作ログアクション）

| 値 | 説明 |
| -- | ---- |
| create | 作成 |
| update | 更新 |
| delete | 削除 |
| status_change | ステータス変更 |
| login | ログイン |
| logout | ログアウト |

### log_target_type（操作ログ対象種別）

| 値 | 説明 |
| -- | ---- |
| item | 商品 |
| reception | 受付 |
| customer | 顧客 |
| partner | 取引先 |
| vendor | 業者 |
| worker | 担当者 |
| session | セッション |

### tenant_plan（テナントプラン）

| 値 | 説明 |
| -- | ---- |
| standard | スタンダードプラン |
| premium | プレミアムプラン |

> **注記:** `free` プランは `20260217000001_remove_free_plan.sql` で廃止済み。既存の `free` テナントは `standard` に移行された。

### tenant_status（テナントステータス）

| 値 | 説明 |
| -- | ---- |
| active | 有効 |
| suspended | 停止中 |
| cancelled | 解約 |

---

## テーブル一覧

| テーブル名 | 用途 | RLS |
| ---------- | ---- | --- |
| tenants | テナント（店舗）マスタ | - |
| workers | 担当者マスタ | tenant_id |
| partners | 取引先マスタ | tenant_id |
| customers | 顧客マスタ | tenant_id |
| vendors | 加工業者マスタ | tenant_id |
| receptions | 受付データ | tenant_id |
| items | 預かり品データ | tenant_id |
| claims | クレームデータ | tenant_id |
| claim_logs | クレーム対応ログ | tenant_id |
| operation_logs | 操作ログ | tenant_id |
| email_logs | メール送信履歴 | tenant_id |
| tenant_settings | テナント別設定 | tenant_id |
| platform_admins | プラットフォーム管理者 | - |

---

## テーブル詳細

### tenants（テナント）

```sql
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(63) UNIQUE NOT NULL,  -- テナントID（例: A3F0）
  name          VARCHAR(255) NOT NULL,        -- 店舗名
  plan          tenant_plan NOT NULL DEFAULT 'standard',
  status        tenant_status NOT NULL DEFAULT 'active',
  settings      JSONB NOT NULL DEFAULT '{}',  -- テナント別設定（Resend APIキー等）
  redirect_url  TEXT DEFAULT NULL,            -- NULL=SaaS内処理、値あり=専用サーバーへリダイレクト
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> **注記:** 旧ドキュメントにあった `owner_email` は実装に存在しない。

### workers（担当者）

```sql
CREATE TABLE workers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  worker_id     VARCHAR(20) NOT NULL,         -- 担当者ID（例: TK7M）
  name          VARCHAR(100) NOT NULL,        -- 担当者名
  pin_hash      VARCHAR(255) NOT NULL,        -- PINハッシュ（bcryptjs）
  email         VARCHAR(255),                 -- メールアドレス
  is_active     BOOLEAN NOT NULL DEFAULT true,-- 有効フラグ
  last_login_at TIMESTAMPTZ,                  -- 最終ログイン日時
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, worker_id)
);
```

### partners（取引先）

```sql
CREATE TABLE partners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  partner_code    VARCHAR(50) NOT NULL,       -- 取引先コード（ビジネスキー）
  name            VARCHAR(255) NOT NULL,      -- 取引先名
  name_kana       VARCHAR(255),               -- フリガナ
  contact_person  VARCHAR(100),               -- 担当者名
  phone           VARCHAR(50),                -- 電話番号
  fax             VARCHAR(50),                -- FAX
  email           VARCHAR(255),               -- メールアドレス
  postal_code     VARCHAR(10),                -- 郵便番号
  address         TEXT,                       -- 住所
  notes           TEXT,                       -- 備考
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, partner_code)
);
```

> **注記:** 旧ドキュメントにあった `partner_id TEXT`（業務ID）、`partner_name`（カラム名）、`source TEXT` は実装に存在しない。ビジネスキーは `partner_code` が担い、取引先名のカラム名は `name` である。

### customers（顧客）

```sql
CREATE TABLE customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  partner_id    UUID REFERENCES partners(id), -- 紐付け取引先（UUID外部キー）
  name          VARCHAR(255) NOT NULL,        -- 氏名
  name_kana     VARCHAR(255),                 -- フリガナ
  phone         VARCHAR(50),                  -- 電話番号
  email         VARCHAR(255),                 -- メールアドレス
  postal_code   VARCHAR(10),                  -- 郵便番号
  address       TEXT,                         -- 住所
  notes         TEXT,                         -- 備考
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> **注記:** 旧ドキュメントにあった `customer_id TEXT`（業務ID）と `partner_name TEXT` は実装に存在しない。`partner_id` は TEXT ではなく UUID 外部キーで partners テーブルを参照する。

### vendors（加工業者）

```sql
CREATE TABLE vendors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vendor_id     VARCHAR(20) NOT NULL,         -- 業者ID
  name          VARCHAR(255) NOT NULL,        -- 業者名
  name_kana     VARCHAR(255),                 -- フリガナ
  phone         VARCHAR(50),                  -- 電話番号
  email         VARCHAR(255),                 -- メールアドレス
  postal_code   VARCHAR(10),                  -- 郵便番号
  address       TEXT,                         -- 住所
  specialty     VARCHAR(255),                 -- 得意分野（カンマ区切り）
  notes         TEXT,                         -- 備考
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, vendor_id)
);
```

### receptions（受付）

```sql
CREATE TABLE receptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reception_number  VARCHAR(50) NOT NULL,      -- 受付番号: {担当者ID}-{YYYYMMDDHHmm}
  customer_id       UUID REFERENCES customers(id),  -- 顧客（UUID外部キー）
  customer_name     VARCHAR(255),              -- 顧客名（非正規化）
  partner_id        UUID REFERENCES partners(id),   -- 取引先（UUID外部キー）
  partner_name      VARCHAR(255),              -- 取引先名（非正規化）
  received_date     DATE NOT NULL DEFAULT CURRENT_DATE, -- 受付日
  received_by       UUID NOT NULL REFERENCES workers(id), -- 受付担当者（UUID外部キー）
  item_count        INTEGER NOT NULL DEFAULT 0,-- 商品数
  notes             TEXT,                      -- 備考
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, reception_number)
);
```

### items（預かり品）

```sql
CREATE TABLE items (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_number             VARCHAR(50) NOT NULL,          -- 預かり番号
  reception_id            UUID NOT NULL REFERENCES receptions(id), -- 受付（UUID外部キー）
  customer_name           VARCHAR(255),                  -- 顧客名（非正規化）
  customer_name_kana      VARCHAR(255),                  -- 顧客名フリガナ（非正規化）
  partner_id              UUID REFERENCES partners(id),  -- 取引先（UUID外部キー）
  partner_name            VARCHAR(255),                  -- 取引先名（非正規化）
  product_type            VARCHAR(50) NOT NULL,          -- 商品種別
  product_name            VARCHAR(255) NOT NULL,         -- 商品名・品目
  color                   VARCHAR(100),                  -- 色・柄
  material                VARCHAR(100),                  -- 素材
  size                    VARCHAR(100),                  -- サイズ
  condition_note          TEXT,                          -- 状態メモ
  request_type            VARCHAR(100),                  -- 依頼種別
  request_detail          TEXT,                          -- 依頼詳細
  status                  item_status NOT NULL DEFAULT 'draft',
  vendor_id               UUID REFERENCES vendors(id),   -- 業者（UUID外部キー）
  vendor_name             VARCHAR(255),                  -- 業者名（非正規化）
  scheduled_ship_date     DATE,                          -- 発送予定日（業者へ）
  scheduled_return_date   DATE,                          -- 返送予定日（顧客へ）
  ship_to_vendor_date     DATE,                          -- 業者発送日（実績）
  return_from_vendor_date DATE,                          -- 業者返却日（実績）
  return_to_customer_date DATE,                          -- 顧客返送日（実績）
  vendor_tracking_number  VARCHAR(100),                  -- 業者発送送り状番号
  vendor_carrier          carrier_type,                  -- 業者発送配送業者
  customer_tracking_number VARCHAR(100),                 -- 顧客返送送り状番号
  customer_carrier        carrier_type,                  -- 顧客返送配送業者
  photo_front_url         TEXT,                          -- 写真URL（受入時・表面）
  photo_back_url          TEXT,                          -- 写真URL（受入時・裏面）
  photo_after_front_url   TEXT,                          -- 写真URL（加工後・表面）
  photo_after_back_url    TEXT,                          -- 写真URL（加工後・裏面）
  photo_front_memo        TEXT,                          -- 写真メモ（受入時・表面）
  photo_back_memo         TEXT,                          -- 写真メモ（受入時・裏面）
  photo_after_front_memo  TEXT,                          -- 写真メモ（加工後・表面）
  photo_after_back_memo   TEXT,                          -- 写真メモ（加工後・裏面）
  additional_photos       JSONB DEFAULT '[]',            -- 追加写真（JSON配列）
  is_paid_storage         BOOLEAN NOT NULL DEFAULT false,-- 有料預かり対象フラグ
  paid_storage_start_date DATE,                          -- 有料預かり開始日
  is_claim_active         BOOLEAN NOT NULL DEFAULT false,-- クレーム対応中フラグ
  is_archived             BOOLEAN NOT NULL DEFAULT false,-- アーカイブ済みフラグ
  ship_history            JSONB DEFAULT '[]',            -- 業者発送履歴（JSON配列）
  return_history          JSONB DEFAULT '[]',            -- 業者返却履歴（JSON配列）
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, item_number)
);
```

### claims（クレーム）

```sql
CREATE TABLE claims (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  claim_id         VARCHAR(50) NOT NULL,          -- クレームID（例: CLM-20260119120000）
  item_id          UUID NOT NULL REFERENCES items(id), -- 紐付く商品（UUID外部キー）
  item_number      VARCHAR(50) NOT NULL,          -- 紐付く預かり番号（検索用・非正規化）
  customer_name    VARCHAR(255),                  -- 顧客名
  status           claim_status NOT NULL DEFAULT 'open',
  category         claim_category,                -- カテゴリ
  description      TEXT NOT NULL,                 -- クレーム内容
  assignee_id      UUID REFERENCES workers(id),   -- 担当者（UUID外部キー）
  assignee_name    VARCHAR(100),                  -- 担当者名（非正規化）
  due_date         DATE,                          -- 対応期限
  resolution       TEXT,                          -- 解決内容
  created_by       UUID NOT NULL REFERENCES workers(id), -- 登録者（UUID外部キー）
  created_by_name  VARCHAR(100) NOT NULL,         -- 登録者名（非正規化）
  resolved_at      TIMESTAMPTZ,                   -- 解決日時
  resolved_by      UUID REFERENCES workers(id),   -- 解決者（UUID外部キー）
  resolved_by_name VARCHAR(100),                  -- 解決者名（非正規化）
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, claim_id)
);
```

### claim_logs（クレーム対応ログ）

```sql
CREATE TABLE claim_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  claim_id      UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE, -- クレーム（UUID外部キー）
  item_number   VARCHAR(50) NOT NULL,          -- 商品番号（検索用・非正規化）
  worker_id     UUID NOT NULL REFERENCES workers(id), -- 対応者（UUID外部キー）
  worker_name   VARCHAR(100) NOT NULL,         -- 対応者名（非正規化）
  action        claim_log_action NOT NULL,     -- アクション
  note          TEXT NOT NULL,                 -- 対応内容メモ
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> **注記:** 旧ドキュメントにあった `log_id TEXT` と `UNIQUE(tenant_id, log_id)` 制約は実装に存在しない。`timestamp` カラムは実装では `created_at` に統一されている。

### operation_logs（操作ログ）

```sql
CREATE TABLE operation_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  worker_id     UUID REFERENCES workers(id),   -- 担当者（UUID外部キー、SYSTEMの場合はnull）
  action        log_action NOT NULL,           -- アクション（ENUM型）
  target_type   log_target_type NOT NULL,      -- 対象種別（ENUM型）
  target_id     VARCHAR(100) NOT NULL,         -- 対象ID
  changes       JSONB,                         -- 変更内容（JSON）
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> **注記:** 旧ドキュメントの `action TEXT`, `target_type TEXT`, `details TEXT`, `worker_name TEXT`, `is_archived BOOLEAN` は実装に存在しない。`action` と `target_type` は ENUM 型、`details` は `changes JSONB` に置き換わっている。

### email_logs（メール送信履歴）

```sql
CREATE TABLE email_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email_type    TEXT NOT NULL,                 -- メール種別
  to_address    TEXT NOT NULL,                 -- 送信先アドレス
  subject       TEXT NOT NULL,                 -- 件名
  body          TEXT,                          -- 本文
  status        TEXT NOT NULL DEFAULT 'sent',  -- 送信ステータス
  error_message TEXT,                          -- エラーメッセージ
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now(), -- 送信日時
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### tenant_settings（テナント別設定）

```sql
CREATE TABLE tenant_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key           VARCHAR(100) NOT NULL,         -- 設定キー
  value         TEXT NOT NULL,                 -- 設定値
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key)
);
```

### platform_admins（プラットフォーム管理者）

```sql
CREATE TABLE platform_admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,  -- メールアドレス
  name          VARCHAR(100) NOT NULL,         -- 管理者名
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Row Level Security (RLS)

### テナント分離の原則

全ての業務テーブル（workers, partners, customers, vendors, receptions, items, claims, claim_logs, operation_logs, tenant_settings, email_logs）は `tenant_id` カラムを持ち、RLSポリシーによりテナント間のデータを完全に分離する。

### RLSポリシーの仕組み

```sql
-- テナントIDをセッション変数として設定
SET app.tenant_id = 'テナントUUID';

-- RLSポリシーの例（itemsテーブル）
CREATE POLICY tenant_isolation ON items
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

> **注記:** `current_setting('app.tenant_id', true)` の第2引数 `true` により、設定値が存在しない場合に例外ではなく NULL を返す。これにより、セッション変数未設定時はデータが一切返らない（安全側に倒れる）。

### email_logs のRLSポリシー

email_logs テーブルには、他テーブルと異なりテナント分離ポリシーに加えて INSERT 用ポリシーが個別に定義されている:

```sql
CREATE POLICY "tenant_isolation" ON email_logs
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON email_logs
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

### クライアント別のRLS動作

| クライアント種別 | RLS | 用途 |
| ---------------- | --- | ---- |
| anon（ブラウザ） | 有効 | テナント内データのみアクセス可能 |
| service_role | バイパス | テナント横断の管理操作、Cronジョブ、認証処理 |

**重要:** `service_role` キーは絶対にクライアントサイドに露出させないこと。

---

## インデックス

### テナントID基本インデックス

全業務テーブルに `tenant_id` 単体のインデックスを作成:

| テーブル | インデックス名 |
| -------- | -------------- |
| workers | idx_workers_tenant |
| partners | idx_partners_tenant |
| customers | idx_customers_tenant |
| vendors | idx_vendors_tenant |
| receptions | idx_receptions_tenant |
| items | idx_items_tenant |
| claims | idx_claims_tenant |
| claim_logs | idx_claim_logs_tenant |
| operation_logs | idx_operation_logs_tenant |
| tenant_settings | idx_tenant_settings_tenant |
| email_logs | idx_email_logs_tenant |

### 業務検索用インデックス

| インデックス名 | 定義 | 用途 |
| -------------- | ---- | ---- |
| idx_items_status | `items(tenant_id, status) WHERE NOT is_archived` | アクティブ商品のステータス別一覧 |
| idx_items_reception | `items(reception_id)` | 受付に紐づく商品検索 |
| idx_items_archived | `items(tenant_id, is_archived) WHERE is_archived` | アーカイブ済み商品一覧 |
| idx_claims_status | `claims(tenant_id, status)` | クレームステータス別一覧 |
| idx_claim_logs_claim | `claim_logs(claim_id)` | クレーム別対応ログ |
| idx_operation_logs_created | `operation_logs(tenant_id, created_at DESC)` | 時系列ログ検索 |
| idx_customers_partner | `customers(partner_id)` | 取引先別顧客検索 |
| idx_email_logs_sent_at | `email_logs(tenant_id, sent_at DESC)` | 送信日時別メールログ検索 |

---

## 自動更新トリガー

`updated_at` カラムはトリガーにより自動更新される:

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

適用対象テーブル:

| トリガー名 | テーブル |
| ---------- | -------- |
| trg_tenants_updated_at | tenants |
| trg_workers_updated_at | workers |
| trg_partners_updated_at | partners |
| trg_customers_updated_at | customers |
| trg_vendors_updated_at | vendors |
| trg_receptions_updated_at | receptions |
| trg_items_updated_at | items |
| trg_tenant_settings_updated_at | tenant_settings |

> **注記:** claims, claim_logs, operation_logs, email_logs, platform_admins には `updated_at` カラム自体がないため、トリガーは設定されていない。

---

## JSONBフィールド

### additional_photos（追加写真）

```json
[
  { "url": "https://pub-xxxx.r2.dev/...", "memo": "袖口のシミ" },
  { "url": "https://pub-xxxx.r2.dev/...", "memo": "裾のほつれ" }
]
```

### ship_history（業者発送履歴）

```json
[
  {
    "date": "2026-01-15",
    "vendorId": "V001",
    "vendorName": "着物ブレイン",
    "trackingNumber": "1234-5678-9012",
    "carrier": "yamato"
  }
]
```

### return_history（業者返却履歴）

```json
[
  { "date": "2026-01-20" }
]
```

### settings（テナント設定）

```json
{
  "resend_api_key": "re_xxxx...",
  "from_email": "info@example.com"
}
```

### changes（操作ログ変更内容）

```json
{
  "status": { "from": "pending_ship", "to": "processing" },
  "vendor_name": { "from": null, "to": "着物ブレイン" }
}
```

---

## 外部キー参照の設計方針

本スキーマでは、テーブル間の参照はすべて UUID 外部キーで行う。業務ID（`worker_id`, `partner_code`, `vendor_id` 等）はユーザー向け表示用のビジネスキーであり、テーブル間の結合には使用しない。

| テーブル | カラム | 参照先 |
| -------- | ------ | ------ |
| customers | partner_id (UUID) | partners.id |
| receptions | customer_id (UUID) | customers.id |
| receptions | partner_id (UUID) | partners.id |
| receptions | received_by (UUID) | workers.id |
| items | reception_id (UUID) | receptions.id |
| items | partner_id (UUID) | partners.id |
| items | vendor_id (UUID) | vendors.id |
| claims | item_id (UUID) | items.id |
| claims | assignee_id (UUID) | workers.id |
| claims | created_by (UUID) | workers.id |
| claims | resolved_by (UUID) | workers.id |
| claim_logs | claim_id (UUID) | claims.id |
| claim_logs | worker_id (UUID) | workers.id |
| operation_logs | worker_id (UUID) | workers.id |

> **非正規化カラム:** 表示用に `customer_name`, `partner_name`, `vendor_name`, `worker_name`, `assignee_name` 等を非正規化で保持している。JOINを減らし、表示パフォーマンスを優先する設計。

---

## 顧客情報の必須項目

| 区分 | 必須項目 | 備考 |
| ---- | -------- | ---- |
| 取引先経由 | 顧客名 | partner_id（UUID）で取引先に紐付け |
| 個人 | 顧客名、電話番号、住所 | 返送のため連絡先・配送先が必須 |

---

## 日付ユーティリティ（src/lib/date.ts）

日本標準時（JST = UTC+9）での日時処理を提供。

### 関数一覧

```typescript
getJSTTimestamp(date?)         // => '20260119173000' (14桁)
getJSTTimestampMinutes(date?)  // => '202601191730' (12桁)
getJSTDateString(date?)        // => '2026-01-19'
getJSTISOString(date?)         // => '2026-01-19T17:30:00+09:00'
```

### 使用箇所

- 受付番号生成: `getJSTTimestampMinutes()` → `TK7M-202601191730`
- 預かり番号生成: `getJSTTimestamp()` → `TK7M-20260119173000-01`
- 日時記録: `getJSTISOString()` → ISO形式でJST表記

**注意:** Vercel（UTC環境）でも正しく日本時間で処理される。

---

## マイグレーション履歴

| ファイル | 内容 |
| -------- | ---- |
| `20260214000001_initial_schema.sql` | 初期スキーマ（ENUM + テーブル + インデックス + トリガー） |
| `20260214000002_rls_policies.sql` | RLSポリシー（テナント分離 + service_roleバイパス） |
| `20260215000001_add_redirect_url.sql` | tenants に redirect_url カラム追加 |
| `20260217000001_remove_free_plan.sql` | freeプラン廃止、Standard/Premium 2プラン制へ移行 |
| `20260218000001_email_logs.sql` | email_logs テーブル追加 |
