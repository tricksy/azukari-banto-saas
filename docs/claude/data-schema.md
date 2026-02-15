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
| auth | 認証 |
| system | システム |
| email | メール |

### tenant_plan（テナントプラン）

| 値 | 説明 |
| -- | ---- |
| free | 無料プラン |
| standard | スタンダードプラン |
| premium | プレミアムプラン |

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
| tenant_settings | テナント別設定 | tenant_id |
| platform_admins | プラットフォーム管理者 | - |

---

## テーブル詳細

### tenants（テナント）

```sql
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,     -- サブドメイン（例: demo-kimono）
  name          TEXT NOT NULL,            -- 店舗名
  plan          tenant_plan DEFAULT 'free',
  status        tenant_status DEFAULT 'active',
  owner_email   TEXT,                     -- オーナーメールアドレス
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
```

### workers（担当者）

```sql
CREATE TABLE workers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  worker_id     TEXT NOT NULL,            -- 担当者ID（例: T01）
  name          TEXT NOT NULL,            -- 担当者名
  pin_hash      TEXT NOT NULL,            -- PINハッシュ（bcryptjs）
  email         TEXT,                     -- メールアドレス
  is_active     BOOLEAN DEFAULT true,     -- 有効フラグ
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, worker_id)
);
```

### partners（取引先）

```sql
CREATE TABLE partners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  partner_id    TEXT NOT NULL,            -- 取引先ID
  partner_code  TEXT,                     -- 取引先コード
  partner_name  TEXT NOT NULL,            -- 取引先名
  name_kana     TEXT,                     -- フリガナ
  contact_person TEXT,                    -- 担当者名
  phone         TEXT,                     -- 電話番号
  fax           TEXT,                     -- FAX
  email         TEXT,                     -- メールアドレス
  postal_code   TEXT,                     -- 郵便番号
  address       TEXT,                     -- 住所
  notes         TEXT,                     -- 備考
  is_active     BOOLEAN DEFAULT true,
  source        TEXT DEFAULT 'local',     -- データソース（local/external）
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, partner_id)
);
```

### customers（顧客）

```sql
CREATE TABLE customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  customer_id   TEXT NOT NULL,            -- 顧客ID
  partner_id    TEXT,                     -- 紐付け取引先ID
  partner_name  TEXT,                     -- 紐付け取引先名
  name          TEXT NOT NULL,            -- 氏名
  name_kana     TEXT,                     -- フリガナ
  phone         TEXT,                     -- 電話番号
  email         TEXT,                     -- メールアドレス
  postal_code   TEXT,                     -- 郵便番号
  address       TEXT,                     -- 住所
  notes         TEXT,                     -- 備考
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, customer_id)
);
```

### vendors（加工業者）

```sql
CREATE TABLE vendors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  vendor_id     TEXT NOT NULL,            -- 業者ID
  name          TEXT NOT NULL,            -- 業者名
  name_kana     TEXT,                     -- フリガナ
  phone         TEXT,                     -- 電話番号
  email         TEXT,                     -- メールアドレス
  postal_code   TEXT,                     -- 郵便番号
  address       TEXT,                     -- 住所
  specialty     TEXT,                     -- 得意分野（カンマ区切り）
  notes         TEXT,                     -- 備考
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, vendor_id)
);
```

### receptions（受付）

```sql
CREATE TABLE receptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  reception_number  TEXT NOT NULL,         -- 受付番号: {担当者ID}-{YYYYMMDDHHmm}
  customer_id       TEXT,                  -- 顧客ID
  customer_name     TEXT,                  -- 顧客名
  partner_id        TEXT,                  -- 取引先ID
  partner_name      TEXT,                  -- 取引先名
  received_date     DATE,                 -- 受付日
  received_by       TEXT,                  -- 受付担当者ID
  item_count        INTEGER DEFAULT 0,     -- 商品数
  notes             TEXT,                  -- 備考
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, reception_number)
);
```

### items（預かり品）

```sql
CREATE TABLE items (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  item_number             TEXT NOT NULL,         -- 預かり番号
  reception_number        TEXT NOT NULL,         -- 受付番号（親番号）
  customer_name           TEXT,                  -- 顧客名（非正規化）
  customer_name_kana      TEXT,                  -- 顧客名フリガナ（非正規化）
  partner_id              TEXT,                  -- 取引先ID
  partner_name            TEXT,                  -- 取引先名
  product_type            TEXT,                  -- 商品種別
  product_name            TEXT NOT NULL,         -- 商品名・品目
  color                   TEXT,                  -- 色・柄
  material                TEXT,                  -- 素材
  size                    TEXT,                  -- サイズ
  condition_note          TEXT,                  -- 状態メモ
  request_type            TEXT,                  -- 依頼種別
  request_detail          TEXT,                  -- 依頼詳細
  status                  item_status DEFAULT 'draft',
  vendor_id               TEXT,                  -- 業者ID
  vendor_name             TEXT,                  -- 業者名
  scheduled_ship_date     DATE,                  -- 発送予定日（業者へ）
  scheduled_return_date   DATE,                  -- 返送予定日（顧客へ）
  ship_to_vendor_date     DATE,                  -- 業者発送日（実績）
  return_from_vendor_date DATE,                  -- 業者返却日（実績）
  return_to_customer_date DATE,                  -- 顧客返送日（実績）
  vendor_tracking_number  TEXT,                  -- 業者発送送り状番号
  vendor_carrier          carrier_type,          -- 業者発送配送業者
  customer_tracking_number TEXT,                 -- 顧客返送送り状番号
  customer_carrier        carrier_type,          -- 顧客返送配送業者
  photo_front_url         TEXT,                  -- 写真URL（受入時・表面）
  photo_back_url          TEXT,                  -- 写真URL（受入時・裏面）
  photo_after_front_url   TEXT,                  -- 写真URL（加工後・表面）
  photo_after_back_url    TEXT,                  -- 写真URL（加工後・裏面）
  photo_front_memo        TEXT,                  -- 写真メモ（受入時・表面）
  photo_back_memo         TEXT,                  -- 写真メモ（受入時・裏面）
  photo_after_front_memo  TEXT,                  -- 写真メモ（加工後・表面）
  photo_after_back_memo   TEXT,                  -- 写真メモ（加工後・裏面）
  additional_photos       JSONB,                 -- 追加写真（JSON配列）
  is_paid_storage         BOOLEAN DEFAULT false, -- 有料預かり対象フラグ
  paid_storage_start_date DATE,                  -- 有料預かり開始日
  is_claim_active         BOOLEAN DEFAULT false, -- クレーム対応中フラグ
  is_archived             BOOLEAN DEFAULT false, -- アーカイブ済みフラグ
  ship_history            JSONB,                 -- 業者発送履歴（JSON配列）
  return_history          JSONB,                 -- 業者返却履歴（JSON配列）
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, item_number)
);
```

### claims（クレーム）

```sql
CREATE TABLE claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  claim_id        TEXT NOT NULL,           -- クレームID（例: CLM-20260119120000）
  item_number     TEXT NOT NULL,           -- 紐付く預かり番号
  customer_name   TEXT,                    -- 顧客名
  status          claim_status DEFAULT 'open',
  category        claim_category,          -- カテゴリ
  description     TEXT NOT NULL,           -- クレーム内容
  assignee_id     TEXT,                    -- 担当者ID
  assignee_name   TEXT,                    -- 担当者名
  due_date        DATE,                    -- 対応期限
  resolution      TEXT,                    -- 解決内容
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      TEXT,                    -- 登録者ID
  created_by_name TEXT,                    -- 登録者名
  resolved_at     TIMESTAMPTZ,             -- 解決日時
  resolved_by     TEXT,                    -- 解決者ID
  resolved_by_name TEXT,                   -- 解決者名
  UNIQUE(tenant_id, claim_id)
);
```

### claim_logs（クレーム対応ログ）

```sql
CREATE TABLE claim_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  log_id        TEXT NOT NULL,             -- ログID
  claim_id      TEXT NOT NULL,             -- 紐付くクレームID
  item_number   TEXT NOT NULL,             -- 商品番号（検索用）
  timestamp     TIMESTAMPTZ DEFAULT now(),
  worker_id     TEXT,                      -- 対応者ID
  worker_name   TEXT,                      -- 対応者名
  action        claim_log_action NOT NULL, -- アクション
  note          TEXT,                      -- 対応内容メモ
  UNIQUE(tenant_id, log_id)
);
```

### operation_logs（操作ログ）

```sql
CREATE TABLE operation_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  worker_id     TEXT,                      -- 担当者ID（SYSTEMの場合はnull）
  worker_name   TEXT,                      -- 担当者名
  action        TEXT NOT NULL,             -- アクション名（日本語）
  target_type   TEXT NOT NULL,             -- 対象種別
  target_id     TEXT,                      -- 対象ID
  details       TEXT,                      -- 詳細情報
  is_archived   BOOLEAN DEFAULT false,     -- アーカイブ済み
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### tenant_settings（テナント別設定）

```sql
CREATE TABLE tenant_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  key           TEXT NOT NULL,             -- 設定キー
  value         TEXT,                      -- 設定値
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, key)
);
```

### platform_admins（プラットフォーム管理者）

```sql
CREATE TABLE platform_admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,      -- メールアドレス
  name          TEXT NOT NULL,             -- 管理者名
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
```

---

## Row Level Security (RLS)

### テナント分離の原則

全ての業務テーブル（workers, partners, customers, vendors, receptions, items, claims, claim_logs, operation_logs, tenant_settings）は `tenant_id` カラムを持ち、RLSポリシーによりテナント間のデータを完全に分離する。

### RLSポリシーの仕組み

```sql
-- テナントIDをセッション変数として設定
SET app.tenant_id = 'テナントUUID';

-- RLSポリシーの例（itemsテーブル）
CREATE POLICY tenant_isolation ON items
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### クライアント別のRLS動作

| クライアント種別 | RLS | 用途 |
| ---------------- | --- | ---- |
| anon（ブラウザ） | 有効 | テナント内データのみアクセス可能 |
| service_role | バイパス | テナント横断の管理操作、Cronジョブ、認証処理 |

**重要:** `service_role` キーは絶対にクライアントサイドに露出させないこと。

---

## インデックス

パフォーマンス最適化のため、以下のカラムにインデックスを作成:

| テーブル | カラム | 用途 |
| -------- | ------ | ---- |
| items | tenant_id, status | ステータス別一覧取得 |
| items | tenant_id, item_number | 預かり番号検索 |
| items | tenant_id, reception_number | 受付番号紐付け |
| items | tenant_id, is_archived | アーカイブ済み除外 |
| receptions | tenant_id, reception_number | 受付番号検索 |
| customers | tenant_id, partner_id | 取引先別顧客検索 |
| claims | tenant_id, item_number | 商品別クレーム検索 |
| operation_logs | tenant_id, created_at | 時系列ログ検索 |
| workers | tenant_id, worker_id | 担当者検索 |

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

-- 各テーブルに適用
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

## JSONBフィールド

### additional_photos（追加写真）

```json
[
  { "url": "https://xxx.supabase.co/storage/...", "memo": "袖口のシミ" },
  { "url": "https://xxx.supabase.co/storage/...", "memo": "裾のほつれ" }
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

---

## 顧客情報の必須項目

| 区分 | 必須項目 | 備考 |
| ---- | -------- | ---- |
| 取引先経由 | 顧客名 | partner_id/partner_nameで取引先に紐付け |
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

- 受付番号生成: `getJSTTimestampMinutes()` → `T01-202601191730`
- 預かり番号生成: `getJSTTimestamp()` → `T01-20260119173000-01`
- 日時記録: `getJSTISOString()` → ISO形式でJST表記

**注意:** Vercel（UTC環境）でも正しく日本時間で処理される。
