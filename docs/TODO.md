# ドキュメント作成 TODO

最終更新: 2026-02-15

---

## Phase 1: 基盤（高優先度）

- [x] **1. CLAUDE.md** — プロジェクトルートのAI向け指示書 ✅ 2026-02-15
- [x] **2. docs/index.html** — HTML技術ドキュメントのメインページ ✅ 2026-02-14
- [x] **3. docs/sections/all-sections.js** — セクション埋め込み用JS ✅ 2026-02-14

## Phase 2: UI仕様（中優先度）

- [x] **4. docs/claude/ui/design-system.md** — 侘寂デザインシステム ✅ 2026-02-15
- [x] **5. docs/claude/ui/worker-screens.md** — 担当者画面仕様 ✅ 2026-02-15
- [x] **6. docs/claude/ui/admin-screens.md** — 管理者画面仕様 ✅ 2026-02-15

## Phase 3: 機能仕様（中優先度）

- [x] **7. docs/claude/features/reception.md** — 受付ウィザード ✅ 2026-02-15
- [x] **8. docs/claude/features/orders.md** — 発注管理 ✅ 2026-02-15
- [x] **9. docs/claude/features/claims.md** — クレーム管理 ✅ 2026-02-15
- [x] **10. docs/claude/features/paid-storage.md** — 有料預かり管理 ✅ 2026-02-15
- [x] **11. docs/claude/features/alerts.md** — アラート機能 ✅ 2026-02-15
- [x] **12. docs/claude/features/archive.md** — アーカイブ機能 ✅ 2026-02-15

## Phase 4: 運用（低優先度）

- [x] **13. docs/claude/deployment-guide.md** — テナント展開ガイド ✅ 2026-02-15

---

## 進捗サマリ

| Phase | 完了 | 合計 | 進捗 |
|-------|------|------|------|
| Phase 1: 基盤 | 3 | 3 | 100% |
| Phase 2: UI仕様 | 3 | 3 | 100% |
| Phase 3: 機能仕様 | 6 | 6 | 100% |
| Phase 4: 運用 | 1 | 1 | 100% |
| **合計** | **13** | **13** | **100%** |

---

# テナント分離移行 - 進捗管理

設計書: [plans/2026-02-15-tenant-separation-design.md](plans/2026-02-15-tenant-separation-design.md)

## Phase A: SaaS側の変更（コード実装済み）

- [x] マイグレーションSQL作成 (`supabase/migrations/20260215000001_add_redirect_url.sql`)
- [x] `/api/tenant` レスポンスに `redirect_url` 追加 (`src/app/api/tenant/route.ts`)
- [x] ログイン画面のリダイレクト処理 (`src/app/login/page.tsx`)
- [x] typecheck・build 確認

### 残作業（手動）

- [ ] **本番Supabaseに `redirect_url` カラム追加**
  - URL: https://supabase.com/dashboard/project/slfsupdgapacwobavvdd/sql
  - 実行SQL: `ALTER TABLE tenants ADD COLUMN redirect_url TEXT DEFAULT NULL;`
- [ ] **SaaS版をVercelにデプロイ**（コード変更を反映）
- [ ] **動作確認**: redirect_url が NULL のテナントで既存動作が壊れていないこと

## Phase A-2: 管理画面テナント管理（コード実装済み）

- [x] テナント管理API作成 (`src/app/api/admin/tenants/route.ts`) ✅ 2026-02-15
  - GET: テナント一覧取得（RLSバイパス）
  - PUT: redirect_url 更新（URLバリデーション付き）
- [x] テナント管理ページ作成 (`src/app/admin/(dashboard)/tenants/page.tsx`) ✅ 2026-02-15
  - テーブル表示（ID・店舗名・プラン・ステータス・分離状態）
  - 編集モーダル（redirect_url 設定・クリア）
- [x] サイドバーにナビゲーション追加 (`src/components/admin/AdminSidebar.tsx`) ✅ 2026-02-15
- [x] typecheck・build 確認 ✅ 2026-02-15

## Phase B: 専用サーバー準備（テナント移行時に実施）

### B-1. リポジトリ準備

- [ ] azukari-banto-saas をフォークして別リポジトリ作成
- [ ] 環境変数 `FIXED_TENANT_SLUG` を追加（`.env.example` に記載）
- [ ] ログイン画面を変更:
  - `?tenant=XXXX` クエリパラメータがあればそのslugを使用
  - なければ `FIXED_TENANT_SLUG` 環境変数を使用
  - テナントID入力ステップを省略し、PIN入力画面のみ表示
  - 店舗名は `/api/tenant` から取得して固定表示

### B-2. 専用Supabase準備

- [ ] Supabaseで新規プロジェクト作成
- [ ] マイグレーション適用（`supabase/migrations/` の全ファイル）
- [ ] 環境変数を設定:
  - `NEXT_PUBLIC_SUPABASE_URL` → 専用プロジェクトのURL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → 専用プロジェクトのanon key
  - `SUPABASE_SERVICE_ROLE_KEY` → 専用プロジェクトのservice role key
  - `AUTH_SECRET` → 新しいシークレットを生成
  - `FIXED_TENANT_SLUG` → 移行するテナントのID（例: `D7E1`）

### B-3. データ移行

- [ ] SaaS側Supabaseから対象テナントのデータをエクスポート:
  ```
  対象テーブル（順序重要、外部キー依存順）:
  1. tenants（対象テナント1件）
  2. workers
  3. partners
  4. customers
  5. vendors
  6. receptions
  7. items
  8. claims
  9. claim_logs
  10. operation_logs
  11. tenant_settings
  ```
- [ ] 専用側Supabaseにインポート
- [ ] データ整合性を確認（件数照合）

### B-4. 専用サーバーデプロイ

- [ ] Vercelで新規プロジェクト作成
- [ ] フォーク版リポジトリを接続
- [ ] 環境変数を設定（B-2で準備した値）
- [ ] デプロイ実行
- [ ] 動作確認:
  - ログイン画面にPIN入力が表示される
  - PIN入力でログインできる
  - ダッシュボード・一覧画面でデータが表示される

### B-5. 切り替え（ゼロダウンタイム）

- [ ] SaaS側のSupabaseで対象テナントの `redirect_url` を設定:
  ```sql
  UPDATE tenants SET redirect_url = 'https://専用サーバーURL'
  WHERE slug = '対象テナントID';
  ```
- [ ] 切り替え確認:
  - SaaS側でテナントIDを入力 → 専用サーバーにリダイレクトされる
  - 専用サーバーでPIN入力 → ログイン成功
  - remember tokenで自動ログインが専用サーバーで動作する

### B-6. 後処理（任意）

- [ ] SaaS側の旧データ削除 or アーカイブ（一定期間後）
- [ ] データ移行スクリプトの汎用化（次回以降の移行用）
