# 環境変数 + デプロイ設定

## 環境変数一覧

| 変数名 | 必須 | サーバー/クライアント | 説明 |
| ------ | ---- | -------------------- | ---- |
| `NEXT_PUBLIC_SUPABASE_URL` | ○ | クライアント | Supabase プロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ○ | クライアント | Supabase 匿名キー（RLS適用） |
| `SUPABASE_SERVICE_ROLE_KEY` | ○ | サーバーのみ | Supabase サービスロールキー（RLSバイパス） |
| `AUTH_SECRET` | ○ | サーバーのみ | JWT署名用シークレット（32文字以上） |
| `BASE_DOMAIN` | ○ | サーバーのみ | ベースドメイン（例: `kuratsugi.app`） |
| `NEXT_PUBLIC_BASE_DOMAIN` | ○ | クライアント | ベースドメイン（クライアント用） |
| `CRON_SECRET` | 本番必須 | サーバーのみ | Cron Job認証用シークレット |
| `NEXT_PUBLIC_BRANCH` | 推奨 | クライアント | ブランチ名（環境識別用ヘッダー色） |
| `NEXT_PUBLIC_ADMIN_PREFIX` | 任意 | クライアント | 管理者URLプレフィックス（例: `ctrl-a3f0`）。未設定時は `admin`。クライアントバンドルにインライン化される。 |

---

## 環境変数の用途

### Supabase接続

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

| キー | RLS | 用途 |
| ---- | --- | ---- |
| anon key | 有効 | ブラウザクライアント、Server Components（テナント内操作） |
| service role key | バイパス | 認証処理、Cronジョブ、テナント横断管理 |

**重要:** `SUPABASE_SERVICE_ROLE_KEY` は絶対に `NEXT_PUBLIC_` プレフィックスを付けないこと。クライアントに露出するとRLSが無効化される。

### 認証

```
AUTH_SECRET=your-auth-secret-min-32-chars-here
```

- JWT署名（HS256）に使用
- 記憶トークン（HMAC-SHA256）の署名にも使用
- **32文字以上**必須
- 生成方法: `openssl rand -base64 32`

### テナント設定

```
BASE_DOMAIN=kuratsugi.app
NEXT_PUBLIC_BASE_DOMAIN=kuratsugi.app
```

- Middleware でサブドメインからテナントslugを抽出する際に使用
- 開発環境ではlocalhostのため、`x-tenant-slug` ヘッダーで代替

### 管理者URL難読化（Admin URL Obfuscation）

`NEXT_PUBLIC_ADMIN_PREFIX` を設定すると、管理者画面のURLパスを変更できる。

```
NEXT_PUBLIC_ADMIN_PREFIX=ctrl-a3f0
```

| 項目 | 説明 |
| ---- | ---- |
| 設定時のURL | `/{prefix}/login`（例: `/ctrl-a3f0/login`） |
| 未設定時のURL | `/admin/login`（デフォルト） |
| `/admin/*` への直接アクセス | 設定時は404を返す |
| URLリライト | Middlewareが透過的に処理 |

**動作の仕組み:**

1. `NEXT_PUBLIC_ADMIN_PREFIX` が設定されている場合、管理者画面は `/{prefix}/*` でのみアクセス可能になる
2. `/admin/*` への直接アクセスは404を返し、管理者画面の存在を隠蔽する
3. Middlewareがリクエストを受け取り、`/{prefix}/*` を内部的に `/admin/*` へリライトする
4. クライアント側のリンクやリダイレクトもプレフィックスを使用する

**本番環境での推奨事項:**

- ボットやスキャナーによる `/admin` パスの自動探索を防止するため、本番環境では必ず設定すること
- プレフィックスには推測されにくい文字列を使用する（例: `ctrl-a3f0`、`mgmt-7b2e`）
- プレフィックスはクライアントバンドルにインライン化されるため、完全な秘匿ではないが、自動スキャンの大半を回避できる

---

## ブランチ別ヘッダー色（環境識別）

開発環境と本番環境を視覚的に区別するため、gitブランチに基づいてヘッダー色を変更する機能。

### 色スキーム

| ブランチ | ヘッダー色 | 用途 | バッジ |
| -------- | ---------- | ---- | ------ |
| `main` / `master` | 通常色（shironeri） | 本番環境 | なし |
| `develop` | 青色（上部ボーダー） | ステージング環境 | DEV |
| `feature/*` | 緑色（上部ボーダー） | 機能開発 | DEV |
| `hotfix/*` | 赤色（上部ボーダー） | 緊急修正 | DEV |
| 未設定 | 紫色（上部ボーダー） | ローカル開発 | DEV |

### ローカルでのテスト

```bash
# 開発環境（青いヘッダー）
NEXT_PUBLIC_BRANCH=develop yarn dev

# 本番環境（通常色）
NEXT_PUBLIC_BRANCH=main yarn dev

# ローカル環境（紫色ヘッダー）
yarn dev
```

---

## ローカル開発環境

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/Shibamago/azukari-banto-saas.git
cd azukari-banto-saas

# 依存関係インストール
yarn install

# 環境変数を設定
cp .env.example .env.local
# .env.local を編集

# 開発サーバー起動
yarn dev
```

### .env.local の設定例

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# 認証
AUTH_SECRET=your-auth-secret-min-32-chars-here

# テナント設定
BASE_DOMAIN=kuratsugi.app
NEXT_PUBLIC_BASE_DOMAIN=kuratsugi.app
```

### 開発環境でのテナント指定

localhost ではサブドメインが使えないため、以下の方法でテナントを指定:

1. クエリパラメータ: `http://localhost:3001?tenant=demo`（localStorageに保存される）
2. ヘッダー: `x-tenant-slug: demo`（Middleware が使用）

詳細は [multi-tenant.md](multi-tenant.md) を参照。

---

## Supabase プロジェクトセットアップ

### 1. プロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. New Project を作成
3. プロジェクトURL と API キーを取得

### 2. データベースセットアップ

1. SQL Editor で ENUM型を作成
2. テーブルを作成（data-schema.md 参照）
3. RLSポリシーを設定
4. インデックスを作成
5. トリガーを設定

### 3. ストレージセットアップ（TODO）

- 写真保存用バケットを作成
- バケットポリシーでテナント分離

---

## Vercel デプロイ設定

### ドメイン構成

| 種別 | ドメイン | 説明 |
| ---- | -------- | ---- |
| ベース | kuratsugi.app | プラットフォームトップ |
| テナント | {slug}.kuratsugi.app | 各店舗のサブドメイン |

### Vercel プロジェクト設定

1. GitHubリポジトリを接続
2. Framework Preset: Next.js
3. Environment Variables を設定
4. Wildcard Domain を設定: `*.kuratsugi.app`

### 環境変数設定

Vercel の Environment Variables に以下を設定:

```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
AUTH_SECRET = （openssl rand -base64 32 で生成）
BASE_DOMAIN = kuratsugi.app
NEXT_PUBLIC_BASE_DOMAIN = kuratsugi.app
NEXT_PUBLIC_BRANCH = main
CRON_SECRET = （openssl rand -base64 32 で生成）
```

### Cron Jobs 設定（TODO）

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/alerts",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/archive-items",
      "schedule": "10 0 * * 0"
    }
  ]
}
```

| Cron Job | スケジュール | 説明 |
| -------- | ------------ | ---- |
| alerts | `0 0 * * *` | 毎日0時UTC（9時JST）にアラートメール送信 |
| archive-items | `10 0 * * 0` | 毎週日曜0:10UTCに古いアイテムをアーカイブ |

---

## Git ブランチ戦略

```
main      → 本番環境
  └── develop → ステージング環境
        └── feature/* → 機能開発ブランチ
```

### 開発フロー

1. `develop` から `feature/xxx` ブランチを作成
2. 実装・テスト
3. `develop` へマージ → ステージングに自動デプロイ
4. ステージングで動作確認
5. `main` へマージ → 本番に自動デプロイ
