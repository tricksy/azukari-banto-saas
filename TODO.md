# SaaS化修正 進捗チェックリスト

最終更新: 2026-02-18

参照: [PLAN.md](PLAN.md) / [REVIEW.md](REVIEW.md)

---

## Phase 1: セキュリティ必須対応（P0）

### 1-1. レート制限のSupabase移行
- [x] マイグレーション `login_attempts` テーブル作成
- [x] `src/lib/rate-limit.ts` 書き換え（Supabase永続化）
- [x] `src/app/api/auth/worker/route.ts` の呼び出しインターフェース確認（await追加）

### 1-2. tenant_idフィルタ漏れ修正（3箇所）
- [x] `src/app/api/claims/route.ts` — assignee_id検索にtenant_idフィルタ追加
- [x] `src/app/api/claims/[claimId]/route.ts` — assignee_id検索にtenant_idフィルタ追加
- [x] `src/app/api/receptions/[receptionNumber]/customer/route.ts` — customer_id検索にtenant_idフィルタ追加

### 1-3. R2画像アクセスの保護
- [x] `@aws-sdk/s3-request-presigner` インストール
- [x] `src/lib/r2.ts` に `getPresignedUrl()` 追加
- [ ] 画像URL生成APIエンドポイント新設 → Phase 3へ延期（影響範囲大）
- [ ] `uploadToR2()` の戻り値を内部キーに変更 → Phase 3へ延期
- [ ] フロント側の画像表示をPresigned URL経由に変更 → Phase 3へ延期
- [ ] 既存画像URLの移行対応 → Phase 3へ延期
> 注: getPresignedUrl()インフラは準備済み。フル移行は15ファイル57箇所の変更が必要なため段階的に対応

### 1-4. localStorageキーのテナント分離
- [x] `src/app/login/page.tsx` — 記憶トークンキーにtenantSlugを含める
- [x] `src/components/worker/Header.tsx` — ログアウト時のトークン削除をテナント別に

---

## Phase 2: 多層防御・データ整合性（P1）

### 2-1. 管理者API認証チェック追加（12ファイル）
- [x] `api/admin/tenants/route.ts`
- [x] `api/admin/tenants/[tenantId]/settings/route.ts`
- [x] `api/admin/workers/route.ts`
- [x] `api/admin/partners/route.ts`
- [x] `api/admin/vendors/route.ts`
- [x] `api/admin/customers/route.ts`
- [x] `api/admin/logs/route.ts`
- [x] `api/admin/email-logs/route.ts`
- [x] `api/admin/paid-storage/route.ts`
- [x] `api/admin/items/route.ts`
- [x] `api/admin/claims/route.ts`
- [x] `api/admin/dashboard/route.ts`

### 2-2. email_logs RLSポリシー修正
- [x] マイグレーション作成（service_role_all + missing_ok統一）

### 2-3. CRON_SECRET ガード強化
- [x] `src/app/api/cron/alerts/route.ts` — 未設定時403
- [x] `src/app/api/cron/archive-items/route.ts` — 未設定時403

### 2-4. メール送信ログ記録
- [x] `src/lib/email.ts` — sendEmail()にログ記録処理追加
- [x] `src/app/api/cron/alerts/route.ts` — tenantIdとemailType渡し追加

---

## 検証

- [x] `yarn typecheck` 成功
- [x] `yarn build` 成功
- [ ] `yarn lint` — ESLint設定ファイル未検出（既存の問題、今回の変更とは無関係）
