# テナント展開ガイド

新規テナント（店舗）を追加する手順を記載する。

## 概要

預かり番頭 SaaS では、1つのアプリケーション + 1つのデータベースで複数の店舗を運用する。
テナントの追加はデータベースへのレコード追加とDNS設定のみで完了する。

---

## 新規テナント追加手順

### 1. テナント情報の決定

| 項目 | 説明 | 例 |
| ---- | ---- | -- |
| slug | サブドメイン用の識別子（英数字+ハイフン） | `matsumoto-gofuku` |
| name | 店舗名（表示用） | `松本呉服店` |
| plan | プラン（free/standard/premium） | `standard` |
| owner_email | オーナーのメールアドレス | `owner@matsumoto.example.com` |

### 2. テナントレコードの作成

Supabase Dashboard の SQL Editor または Supabase CLI で実行:

```sql
INSERT INTO tenants (slug, name, plan, status, owner_email)
VALUES ('matsumoto-gofuku', '松本呉服店', 'standard', 'active', 'owner@matsumoto.example.com');
```

テナントIDを取得:
```sql
SELECT id FROM tenants WHERE slug = 'matsumoto-gofuku';
-- => 例: 'b1234567-89ab-cdef-0123-456789abcdef'
```

### 3. 初期担当者の登録

担当者のPINコードをbcryptでハッシュ化して登録:

```sql
INSERT INTO workers (tenant_id, worker_id, name, pin_hash, email)
VALUES (
  'b1234567-89ab-cdef-0123-456789abcdef',
  'T01',
  '担当者名',
  '$2a$10$ハッシュ値',
  'worker@example.com'
);
```

**PINハッシュの生成方法:**

```javascript
// Node.js で生成
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('12345678', 10);
console.log(hash);
```

### 4. 初期設定の投入

```sql
INSERT INTO tenant_settings (tenant_id, key, value) VALUES
  ('b1234567-89ab-cdef-0123-456789abcdef', 'company_name', '松本呉服店'),
  ('b1234567-89ab-cdef-0123-456789abcdef', 'alertEmailEnabled', 'false'),
  ('b1234567-89ab-cdef-0123-456789abcdef', 'alertEmailTo', ''),
  ('b1234567-89ab-cdef-0123-456789abcdef', 'shipDeadlineDays', '7'),
  ('b1234567-89ab-cdef-0123-456789abcdef', 'returnDeadlineDays', '14'),
  ('b1234567-89ab-cdef-0123-456789abcdef', 'staleWarningDays', '30'),
  ('b1234567-89ab-cdef-0123-456789abcdef', 'autoArchiveDays', '365'),
  ('b1234567-89ab-cdef-0123-456789abcdef', 'paidStorageGraceDays', '7');
```

### 5. DNS設定（不要な場合あり）

**ワイルドカードドメインを使用している場合:**

Vercel に `*.kuratsugi.app` のワイルドカードドメインが設定されていれば、個別のDNS設定は不要。全てのサブドメインが自動的にルーティングされる。

**個別ドメインの場合:**

1. DNS プロバイダーで CNAME レコードを追加:
   ```
   matsumoto-gofuku.kuratsugi.app → cname.vercel-dns.com
   ```
2. Vercel Dashboard で Custom Domain を追加:
   - Domain: `matsumoto-gofuku.kuratsugi.app`
   - SSL: 自動発行

---

## テナントの動作確認

### ローカル環境での確認

```bash
# テナントを指定して開発サーバーにアクセス
open "http://localhost:3001?tenant=matsumoto-gofuku"
```

### 本番環境での確認

```
https://matsumoto-gofuku.kuratsugi.app
```

### 確認項目

- [ ] ログイン画面で店舗名が正しく表示される
- [ ] PINコードでログインできる
- [ ] ダッシュボードが表示される
- [ ] 他テナントのデータが見えないことを確認

---

## テナントの停止

テナントを一時停止する場合:

```sql
UPDATE tenants SET status = 'suspended' WHERE slug = 'matsumoto-gofuku';
```

**停止時の動作:**
- ログイン時にエラー: 「この店舗は現在利用停止中です」（HTTP 403）
- 既存セッションは有効（Middleware で停止チェックする場合は即座に無効化）
- データは保持される

### 再開

```sql
UPDATE tenants SET status = 'active' WHERE slug = 'matsumoto-gofuku';
```

---

## テナントの解約

```sql
UPDATE tenants SET status = 'cancelled' WHERE slug = 'matsumoto-gofuku';
```

**注意:** データ削除は別途対応が必要。解約後もデータは保持される。

---

## Supabase Storage のテナント分離

写真保存用のストレージバケットは、パスプレフィックスでテナントを分離する:

```
photos/
  ├── {tenant_id}/
  │   ├── {year}/
  │   │   ├── {monthday}/
  │   │   │   ├── {item_number}/
  │   │   │   │   ├── front.webp
  │   │   │   │   ├── back.webp
  │   │   │   │   ├── after_front.webp
  │   │   │   │   ├── after_back.webp
  │   │   │   │   └── additional/
  │   │   │   │       ├── 1.webp
  │   │   │   │       └── 2.webp
```

### バケットポリシー（TODO）

```sql
-- テナント別にアクセス制御するRLSポリシー
CREATE POLICY tenant_photos ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'photos' AND
    (storage.foldername(name))[1] = current_setting('app.tenant_id')
  );
```

---

## Supabase CLI でのマイグレーション

### 新規テナント向けの一括セットアップ

```bash
# ローカルSupabase環境でテスト
supabase start
supabase db reset  # マイグレーション + シード再適用

# リモートSupabaseに適用
supabase db push
```

### マイグレーションファイル

```
supabase/migrations/
  ├── 20260214000001_initial_schema.sql  # テーブル + インデックス
  └── 20260214000002_rls_policies.sql    # RLSポリシー
```

---

## チェックリスト

### 新規テナント追加

- [ ] テナントslugを決定（英数字+ハイフン、一意であること）
- [ ] `tenants` テーブルにレコード追加
- [ ] 初期担当者を `workers` テーブルに追加（PINハッシュ生成済み）
- [ ] `tenant_settings` に初期設定を投入
- [ ] DNS設定（ワイルドカード未使用の場合のみ）
- [ ] ログイン動作確認
- [ ] テナント間データ分離の確認

### テナント停止

- [ ] `tenants.status` を `suspended` に更新
- [ ] ログイン不可を確認
- [ ] 復旧手順を記録

---

## 関連ドキュメント

- [multi-tenant.md](multi-tenant.md) — マルチテナントアーキテクチャ
- [env-deploy.md](env-deploy.md) — 環境変数 + Vercelデプロイ設定
- [data-schema.md](data-schema.md) — データベーススキーマ
- [auth.md](auth.md) — 認証システム
