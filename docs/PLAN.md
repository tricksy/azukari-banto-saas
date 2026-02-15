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
