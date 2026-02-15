# ドキュメント作成計画

## 背景

azukari-banto-saas（預かり番頭 SaaS版）のドキュメントを整備する。
KURATSUGI（単体版）の docs 構成をベースに、SaaS版固有の内容（マルチテナント、Supabase、プラットフォーム管理等）を反映する。

## 現状

### 作成済み

**HTML技術ドキュメント（docs/sections/）**
- [x] overview.html（プロジェクト概要 + 技術スタック）
- [x] architecture.html（システムアーキテクチャ + ディレクトリ構成）
- [x] authentication.html（認証システム）
- [x] database.html（データベーススキーマ + RLS）
- [x] features.html（ステータス管理 + 業務機能フロー）
- [x] development.html（開発ガイド + デプロイ）
- [x] css/docs.css
- [x] js/docs.js

**Claude向けドキュメント（docs/claude/）**
- [x] auth.md
- [x] api-reference.md
- [x] data-schema.md
- [x] development.md
- [x] env-deploy.md
- [x] multi-tenant.md（SaaS固有）
- [x] status-flow.md

### 未作成

| # | ファイル | 分類 | 優先度 | 概要 |
|---|---------|------|--------|------|
| 1 | CLAUDE.md | プロジェクトルート | 高 | AI開発アシスタント向け指示書 |
| 2 | docs/index.html | HTML | 高 | 技術ドキュメントのメインページ |
| 3 | docs/sections/all-sections.js | HTML | 高 | セクション読み込み用（index.htmlの依存） |
| 4 | docs/claude/ui/design-system.md | Claude/UI | 中 | 侘寂デザインシステム仕様 |
| 5 | docs/claude/ui/worker-screens.md | Claude/UI | 中 | 担当者画面仕様 |
| 6 | docs/claude/ui/admin-screens.md | Claude/UI | 中 | 管理者画面仕様 |
| 7 | docs/claude/features/reception.md | Claude/機能 | 中 | 受付ウィザード仕様 |
| 8 | docs/claude/features/orders.md | Claude/機能 | 中 | 発注管理仕様 |
| 9 | docs/claude/features/claims.md | Claude/機能 | 中 | クレーム管理仕様 |
| 10 | docs/claude/features/paid-storage.md | Claude/機能 | 中 | 有料預かり管理仕様 |
| 11 | docs/claude/features/alerts.md | Claude/機能 | 中 | アラート仕様 |
| 12 | docs/claude/features/archive.md | Claude/機能 | 中 | アーカイブ機能仕様 |
| 13 | docs/claude/deployment-guide.md | Claude | 低 | テナント展開ガイド |

---

## 作成方針

### 1. CLAUDE.md（プロジェクトルート）

KURATSUGI版のCLAUDE.mdをベースに、SaaS版の以下を反映:
- 技術スタック（Supabase、@supabase/ssr等）
- マルチテナント構成
- 認証3層構造（Worker / Store Admin / Platform Admin）
- Supabase CLIコマンド
- ディレクトリ構成（supabase/ディレクトリ含む）
- ドキュメントリンク一覧

### 2. docs/index.html + all-sections.js

KURATSUGI版と同じ構造:
- サイドバー + メインコンテンツのレイアウト
- all-sections.js で各セクションHTMLを埋め込み
- SaaS版固有のセクション（マルチテナント、RLS等）を追加
- 既存のdocs.css / docs.js を利用

### 3. Claude向け機能ドキュメント（features/*.md）

KURATSUGI版の構造に合わせつつ、SaaS版の差分を明記:
- データアクセス: Google Sheets → Supabase
- テナント分離の考慮
- APIエンドポイントの変更
- 実装済み / 未実装（TODO）の明記

### 4. Claude向けUIドキュメント（ui/*.md）

KURATSUGI版のデザインシステム・画面仕様をベースに:
- Tailwind CSS v4 対応
- 共通UIコンポーネント一覧（Badge, Button, Card等）
- テナントコンテキストの表示（サブドメイン、店舗名）

### 5. deployment-guide.md

SaaS版のテナント追加手順:
- Supabaseでのテナント登録
- DNS設定（ワイルドカードドメイン）
- 初期データ投入

---

## 作業順序

1. **CLAUDE.md** — 開発の入口。これがないと他の作業効率も下がる
2. **index.html + all-sections.js** — HTML技術ドキュメントの閲覧基盤
3. **ui/design-system.md** — UI実装の基準
4. **ui/worker-screens.md + admin-screens.md** — 画面仕様
5. **features/*.md（6ファイル）** — 機能仕様詳細
6. **deployment-guide.md** — テナント展開手順

---

## 注意事項

- SaaS版では多くの業務機能が未実装（ページのみ存在）のため、ドキュメントには「実装済み/TODO」を明記する
- KURATSUGI版からの移植ではなく、SaaS版の実装に合わせた正確な記述を行う
- 既存のdocs/sections/のHTMLと内容が矛盾しないようにする

---

# テナント分離移行 - 実装計画

## 背景

SaaS版で利用中のテナントが利用増大した場合、専用サーバー（別Supabase + 別Vercel）に移行できる仕組みを実装する。ユーザーは同じテナントIDでログインし、SaaS側が専用サーバーへ透過的にリダイレクトする。

詳細設計: [plans/2026-02-15-tenant-separation-design.md](plans/2026-02-15-tenant-separation-design.md)

## 実装ステップ（SaaS側）

### Step 1: DBマイグレーション

`tenants` テーブルに `redirect_url` カラムを追加する。

- ファイル: `supabase/migrations/20260215000001_add_redirect_url.sql`
- 内容: `ALTER TABLE tenants ADD COLUMN redirect_url TEXT DEFAULT NULL;`
- 本番Supabaseにも適用

### Step 2: `/api/tenant` レスポンス変更

テナント情報APIのレスポンスに `redirect_url` を含める。

- ファイル: `src/app/api/tenant/route.ts`
- 変更: `select` に `redirect_url` を追加
- 変更前: `.select('slug, name, status')`
- 変更後: `.select('slug, name, status, redirect_url')`

### Step 3: ログイン画面のリダイレクト処理

テナントIDを入力後、`redirect_url` がある場合は専用サーバーへリダイレクトする。

- ファイル: `src/app/login/page.tsx`
- 変更箇所: `handleTenantSubmit` 関数内
- ロジック:
  1. `/api/tenant` のレスポンスに `redirect_url` がある場合
  2. `window.location.href = ${redirect_url}/login?tenant=${tenantId}` でリダイレクト
  3. `redirect_url` がない場合は現行どおりPIN入力ステップへ

### Step 4: ビルド・型チェック確認

- `yarn typecheck` が成功すること
- `yarn build` が成功すること

### Step 5: 動作確認

- redirect_url が NULL のテナント → SaaS内でPIN認証（既存動作）
- redirect_url が設定されたテナント → 専用サーバーへリダイレクト

### Step 6: 管理画面からテナント分離を実行

管理画面に「テナント管理」ページを追加し、GUIから `redirect_url` の設定・解除を行えるようにする。

- `src/app/api/admin/tenants/route.ts` — テナント一覧取得(GET) + redirect_url更新(PUT)
- `src/app/admin/(dashboard)/tenants/page.tsx` — テナント管理ページ（テーブル + 編集モーダル）
- `src/components/admin/AdminSidebar.tsx` — navItemsに「テナント管理」追加
