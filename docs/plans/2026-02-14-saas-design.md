# クラウド版 預かり番頭（SaaS）設計書

## Context

既存の預かり番頭（KURATSUGI）は1店舗専用のシステム（Google Spreadsheet + Vercel）。これを着物業界の複数店舗が利用できるマルチテナントSaaSとして、別リポジトリで新規開発する。

**規模**: 数十店舗
**課金**: フリーミアム（無料枠 → 有料、閾値は検討中）
**オンボーディング**: 手動プロビジョニング

---

## 1. 技術スタック

| レイヤー | 技術 | 理由 |
|----------|------|------|
| フレームワーク | Next.js (App Router) | 既存ノウハウ活用 |
| 言語 | TypeScript | 既存と同じ |
| スタイリング | Tailwind CSS v4 | 侘寂デザインシステム移植 |
| DB | Supabase (PostgreSQL) | RLSでテナント分離、無料枠あり |
| ストレージ | Supabase Storage | DB統一管理、テナント分離容易 |
| 認証 | Supabase Auth | テナント対応の認証基盤 |
| メール | Resend | Vercelとの親和性、テンプレート管理 |
| ホスティング | Vercel | 既存ノウハウ |
| Cron | Vercel Cron Jobs | アラート・アーカイブ処理 |

---

## 2. マルチテナント設計

### テナント識別
- **サブドメイン方式**: `{tenant-slug}.kuratsugi.app`
- Middleware でサブドメインからテナントを解決
- API リクエストにはテナントコンテキストを付与

### データ分離（RLS）
- 全業務テーブルに `tenant_id` カラムを持つ
- PostgreSQL の Row Level Security で自動フィルタリング
- アプリケーション側でテナントIDを意識する必要が最小限

```sql
-- 例: items テーブルの RLS ポリシー
CREATE POLICY tenant_isolation ON items
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### テナント管理テーブル
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(63) UNIQUE NOT NULL,        -- サブドメイン用
  name VARCHAR(255) NOT NULL,              -- 店舗名
  plan VARCHAR(20) DEFAULT 'free',         -- free / standard / premium
  status VARCHAR(20) DEFAULT 'active',     -- active / suspended / cancelled
  settings JSONB DEFAULT '{}',             -- 店舗別設定
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. データベース設計（主要テーブル）

既存のSpreadsheetシート構造をRDB化。全テーブルに `tenant_id` を追加。

### 業務テーブル
| テーブル | 既存シート | 概要 |
|----------|-----------|------|
| tenants | (新規) | テナント管理 |
| receptions | 受付 | 受付情報 |
| items | 商品 | 預かり品 |
| customers | 顧客 | 顧客マスタ |
| partners | 取引先 | 取引先マスタ |
| vendors | 業者 | 加工業者マスタ |
| workers | 担当者 | 担当者マスタ |
| claims | クレーム | クレーム管理 |
| logs | ログ | 操作ログ |
| settings | 設定 | テナント別設定 |

### SaaS管理テーブル（テナント横断）
| テーブル | 概要 |
|----------|------|
| tenants | テナント情報 |
| subscriptions | 課金・プラン情報 |
| platform_admins | プラットフォーム管理者 |

---

## 4. 認証設計

### 3層の認証

| ユーザー種別 | 認証方式 | スコープ |
|-------------|----------|---------|
| 担当者（Worker） | PIN + テナントslug | テナント内のみ |
| 店舗管理者（Admin） | メール+パスワード or OAuth | テナント内管理 |
| プラットフォーム管理者 | OAuth | 全テナント横断 |

### ログインフロー
1. `{slug}.kuratsugi.app/login` にアクセス
2. テナントslugから店舗を特定
3. 担当者はPIN入力、管理者はメール/OAuth
4. JWTに `tenant_id` を含めて発行
5. 全APIリクエストでJWTからテナントIDを抽出 → RLS適用

---

## 5. 写真ストレージ

### 構造
```
supabase-storage/
└── photos/
    └── {tenant_id}/
        └── {reception_id}/
            ├── {item_id}_1.webp
            ├── {item_id}_2.webp
            └── ...
```

- アップロード: クライアント → Next.js API → Supabase Storage
- 配信: Supabase Storage の署名付きURL or CDN
- RLS: Storage にもテナント分離ポリシー適用

---

## 6. 既存コードからの移植

### 移植するもの
- **侘寂デザインシステム** (`globals.css`, UIコンポーネント)
- **ビジネスロジック** (ステータス遷移、番号採番、アラート条件)
- **UIコンポーネント** (受付ウィザード、一覧画面、詳細画面)
- **印刷機能** (発注書印刷)

### 作り直すもの
- **データアクセス層** (Google Sheets → Supabase Client)
- **認証** (独自JWT + NextAuth → Supabase Auth)
- **写真アップロード** (GAS + Drive → Supabase Storage)
- **メール送信** (GAS + Gmail → Resend)
- **Cron処理** (テナントイテレーション追加)

---

## 7. フリーミアム設計

### プラン構成（案）
| | Free | Standard | Premium |
|--|------|----------|---------|
| 預かり品数 | 〜X件 | 〜Y件 | 無制限 |
| 写真保存容量 | 〜Z GB | 〜W GB | 無制限 |
| 担当者数 | 〜N人 | 〜M人 | 無制限 |
| アラートメール | 基本 | カスタム | カスタム |
| サポート | コミュニティ | メール | 優先 |

※閾値は検討中のため、設定変更可能な構造にする

---

## 8. 新リポジトリ構成

```
kuratsugi-cloud/
├── src/
│   ├── app/
│   │   ├── (tenant)/              # テナント向け画面
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── reception/
│   │   │   ├── items/
│   │   │   └── ...               # 既存と同様の画面群
│   │   ├── (platform)/           # プラットフォーム管理画面
│   │   │   ├── tenants/          # テナント管理
│   │   │   ├── subscriptions/    # 課金管理
│   │   │   └── ...
│   │   ├── api/
│   │   │   ├── tenant/           # テナント向けAPI
│   │   │   ├── platform/         # プラットフォームAPI
│   │   │   └── webhooks/         # 決済Webhook等
│   │   └── ...
│   ├── components/
│   │   ├── ui/                   # 侘寂デザインシステム（移植）
│   │   ├── tenant/               # テナント向けコンポーネント
│   │   └── platform/             # プラットフォーム管理コンポーネント
│   ├── lib/
│   │   ├── supabase/             # Supabaseクライアント・ヘルパー
│   │   ├── tenant.ts             # テナント解決ロジック
│   │   ├── auth.ts               # 認証
│   │   └── ...
│   ├── middleware.ts             # テナント解決 + 認証ガード
│   └── types/
├── supabase/
│   ├── migrations/               # DBマイグレーション
│   └── seed.sql                  # 初期データ
├── docs/
│   └── plans/
└── ...
```

---

## 9. 開発フェーズ（概要）

### Phase 1: 基盤構築
- リポジトリ作成、Supabase プロジェクト作成
- DBスキーマ設計・マイグレーション
- テナント解決 Middleware
- 認証（Worker PIN + Admin）

### Phase 2: コア機能移植
- 受付ウィザード
- 商品一覧・詳細
- ステータス管理
- 写真アップロード

### Phase 3: SaaS機能
- プラットフォーム管理画面
- テナント管理（手動プロビジョニング）
- フリーミアム制御（使用量チェック）

### Phase 4: 運用機能
- アラートメール（Resend）
- Cron ジョブ（テナントイテレーション）
- アーカイブ処理

---

## 検証方法

1. ローカルで Supabase CLI を使い開発環境を構築
2. テナントA/Bの2テナントでデータ分離を確認
3. RLSが正しく機能し、テナント間のデータ漏洩がないことをテスト
4. 既存の業務フロー（受付→発送→加工→返却→完了）が動作することを確認
