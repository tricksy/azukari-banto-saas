# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**預かり番頭 SaaS — 着物・帯預かり管理 マルチテナントクラウドシステム**

着物店・呉服店向けに、預かった着物・帯の写真撮影、ステータス管理、返却期日のアラートを一元管理するマルチテナントSaaS。各店舗はテナントID（4桁16進数コード）でログインし、データはPostgreSQL RLSで完全分離される。

**単体版（KURATSUGI）との関係:** KURATSUGIは1店舗専用（Google Spreadsheet + Vercel）。本リポジトリはそれを複数店舗対応のSaaSとして新規開発したもの。

## Technology Stack

| レイヤー | 技術 |
| -------- | ---- |
| パッケージマネージャー | yarn |
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript 5.x |
| UI | React 19 |
| スタイリング | Tailwind CSS v4 |
| ホスティング | Vercel |
| データベース | Supabase (PostgreSQL + RLS) |
| ストレージ | Supabase Storage（予定） |
| 認証 | 独自実装（JWT + bcryptjs） |
| メール | 未定（Resend等を検討） |
| 定期実行 | Vercel Cron Jobs（予定） |

---

## Documentation Links

詳細な仕様は以下のドキュメントを参照:

### Core Documentation
| ドキュメント | 内容 | 参照タイミング |
| ------------ | ---- | -------------- |
| [auth.md](docs/claude/auth.md) | 認証システム（Worker PIN / Admin / Platform） | 認証関連の実装・デバッグ時 |
| [multi-tenant.md](docs/claude/multi-tenant.md) | マルチテナントアーキテクチャ | テナント分離・RLS関連の実装時 |
| [env-deploy.md](docs/claude/env-deploy.md) | 環境変数 + Vercelデプロイ設定 | デプロイ・環境設定時 |
| [status-flow.md](docs/claude/status-flow.md) | ステータス遷移 + 番号体系 + ログ | ステータス変更・ログ関連の実装時 |
| [data-schema.md](docs/claude/data-schema.md) | データベーススキーマ + RLS + インデックス | データ操作・スキーマ変更時 |
| [api-reference.md](docs/claude/api-reference.md) | API一覧と認証要件 | API実装・呼び出し時 |
| [development.md](docs/claude/development.md) | 開発ガイドライン + コンポーネント | 開発作業全般 |

### Feature Documentation
| ドキュメント | 内容 |
| ------------ | ---- |
| [features/reception.md](docs/claude/features/reception.md) | 受付ウィザード + 顧客・取引先選択 |
| [features/orders.md](docs/claude/features/orders.md) | 発注管理 |
| [features/claims.md](docs/claude/features/claims.md) | クレーム管理 |
| [features/paid-storage.md](docs/claude/features/paid-storage.md) | 有料預かり管理 |
| [features/alerts.md](docs/claude/features/alerts.md) | アラート機能 |
| [features/archive.md](docs/claude/features/archive.md) | アーカイブ機能 |

### UI Documentation
| ドキュメント | 内容 |
| ------------ | ---- |
| [ui/design-system.md](docs/claude/ui/design-system.md) | 侘寂デザインシステム + UI共通ルール |
| [ui/admin-screens.md](docs/claude/ui/admin-screens.md) | 管理者画面仕様 |
| [ui/worker-screens.md](docs/claude/ui/worker-screens.md) | 担当者画面仕様 |

---

## Quick Reference

### 認証

| ユーザー種別 | 認証方式 | 状態 |
| ------------ | -------- | ---- |
| 担当者（Worker） | PINコード（8桁）+ JWT Cookie | 実装済み |
| 店舗管理者（Store Admin） | メール+パスワード | TODO |
| プラットフォーム管理者 | OAuth 2.0 | TODO |

### マルチテナント

| 項目 | 仕様 |
| ---- | ---- |
| テナント識別 | テナントID（4桁16進数: 0-9, A-F） |
| ログインフロー | テナントID入力 → 店舗名表示 → PIN入力 |
| データ分離 | PostgreSQL RLS（`tenant_id` カラム） |
| テナントAPI | `GET /api/tenant?slug={テナントID}` で店舗名取得 |

### テナントID一覧（開発用）

| テナントID | 店舗名 |
| ---------- | ------ |
| `A3F0` | デモ着物店 |
| `B1C2` | テスト呉服店 |
| `D7E1` | 柴犬屋 |

### ステータス一覧

| コード | 説明 |
| ------ | ---- |
| draft | 顧客未設定（下書き） |
| received | 受付済（通常使用しない） |
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

### 番号体系

- **受付番号**: `{担当者ID}-{YYYYMMDDHHmm}` 例: `T01-202601181430`
- **預かり番号**: `{担当者ID}-{YYYYMMDDHHmmss}-{連番2桁}` 例: `T01-20260118143025-01`

---

## Project Structure

```text
/
├── src/
│   ├── app/
│   │   ├── login/page.tsx           # テナント選択 → PINログイン
│   │   ├── (worker)/                # 担当者用画面（PIN認証）
│   │   │   ├── layout.tsx           # ヘッダー付きレイアウト
│   │   │   ├── dashboard/page.tsx   # ダッシュボード
│   │   │   ├── reception/page.tsx   # 預かり登録（ウィザード形式）
│   │   │   ├── items/page.tsx       # 商品一覧
│   │   │   ├── orders/page.tsx      # 発注管理
│   │   │   ├── returns/page.tsx     # 業者からの返却受入
│   │   │   ├── shipping/page.tsx    # 顧客への返送
│   │   │   ├── paid-storage/page.tsx # 有料預かり管理
│   │   │   └── manual/page.tsx      # 使い方マニュアル
│   │   ├── admin/                   # 管理者用画面
│   │   │   ├── (auth)/              # 認証グループ（サイドバーなし）
│   │   │   │   └── login/page.tsx   # 管理者ログイン
│   │   │   └── (dashboard)/         # ダッシュボードグループ
│   │   │       ├── layout.tsx       # サイドバー付きレイアウト
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── items/page.tsx
│   │   │       ├── statuses/page.tsx
│   │   │       ├── partners/page.tsx
│   │   │       ├── vendors/page.tsx
│   │   │       ├── customers/page.tsx
│   │   │       ├── workers/page.tsx
│   │   │       ├── paid-storage/page.tsx
│   │   │       ├── claims/page.tsx
│   │   │       ├── logs/page.tsx
│   │   │       ├── email-logs/page.tsx
│   │   │       ├── settings/page.tsx
│   │   │       └── manual/page.tsx
│   │   └── api/                     # API Routes
│   │       ├── auth/
│   │       │   ├── worker/route.ts  # PINコード認証
│   │       │   ├── worker/remember/ # 記憶トークン
│   │       │   └── logout/route.ts  # ログアウト
│   │       └── tenant/route.ts      # テナント情報取得
│   ├── components/
│   │   ├── ui/                      # 共通UIコンポーネント
│   │   │   ├── Badge.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Toggle.tsx
│   │   ├── admin/
│   │   │   └── AdminSidebar.tsx     # 管理者サイドバー
│   │   └── worker/
│   │       └── Header.tsx           # 担当者ヘッダー
│   ├── hooks/
│   │   ├── usePersistedState.ts     # localStorage永続化
│   │   └── useFocusTrap.ts          # フォーカストラップ
│   ├── lib/
│   │   ├── auth.ts                  # セッション管理（JWT署名付き）
│   │   ├── tenant.ts                # テナント解決ユーティリティ
│   │   ├── rate-limit.ts            # ログイン試行制限
│   │   ├── date.ts                  # 日付ユーティリティ（JST対応）
│   │   └── supabase/
│   │       ├── client.ts            # ブラウザ用Supabaseクライアント
│   │       └── server.ts            # サーバー用 + Service Roleクライアント
│   ├── types/
│   │   └── index.ts                 # 全型定義（ステータス遷移マップ含む）
│   └── middleware.ts                # 認証ガード + テナント解決
├── supabase/
│   ├── config.toml                  # Supabase CLI設定
│   ├── migrations/
│   │   ├── 20260214000001_initial_schema.sql  # テーブル + インデックス
│   │   └── 20260214000002_rls_policies.sql    # RLSポリシー
│   └── seed.sql                     # 開発用シードデータ
├── docs/
│   ├── index.html                   # 技術ドキュメントトップ
│   ├── sections/                    # HTMLセクション
│   ├── claude/                      # Claude Code用ドキュメント
│   ├── css/docs.css                 # ドキュメント用CSS
│   ├── js/docs.js                   # ドキュメント用JS
│   └── plans/                       # 設計・計画書
├── .env.example                     # 環境変数テンプレート
└── CLAUDE.md
```

---

## 開発コマンド

```bash
# 開発サーバー起動（ポート3001）
yarn dev

# 型チェック
yarn typecheck

# ビルド
yarn build

# Lint
yarn lint
```

### Supabase CLI

```bash
# ローカルSupabase起動（Docker必要）
supabase start

# DB リセット（マイグレーション + シード再適用）
supabase db reset

# 新規マイグレーション作成
supabase migration new {name}

# スキーマ差分確認
supabase db diff

# ローカルSupabase停止
supabase stop
```

---

## Git運用ルール

### コミット禁止

- **ユーザーの明示的な指示がない限り、絶対にコミットしないこと**
- 変更を加えた後も、コミットの指示があるまで待機する
- `git add` や `git commit` は必ずユーザーの許可を得てから実行する

### コミット形式

- コンベンショナルコミット形式を使用（feat:, fix:, docs:, test:, refactor:, chore:）
- **コミットメッセージは日本語で記述**（プレフィックスは英語でも可）
- コミットは原子的で、単一の変更に焦点を当てる

---

## コミット前チェックリスト（必須）

### 1. ビルド・型チェック

- [ ] `yarn typecheck` が成功すること
- [ ] `yarn build` が成功すること
- [ ] `yarn lint` でエラーがないこと

### 2. 動作確認

- [ ] 担当者画面が正常に動作すること
- [ ] 管理者画面が正常に動作すること
- [ ] Supabase との通信が正常に動作すること
- [ ] テナント分離が正しく動作すること

### 3. セキュリティ

- [ ] APIキーやPINがハードコードされていないこと
- [ ] 環境変数が適切に設定されていること
- [ ] SUPABASE_SERVICE_ROLE_KEY がクライアントに露出していないこと

---

## Reference Documentation

- `/docs/index.html` - 技術ドキュメントトップ（ブラウザで閲覧）
- `/docs/claude/ui/design-system.md` - 侘寂デザインシステム（UIデザイン規約）
- 単体版リポジトリ: `/Users/miyoshi/Dropbox/Github/Shibamago/KURATSUGI`
