# SaaS化修正 実装計画

**作成日:** 2026-02-18
**参照:** [REVIEW.md](REVIEW.md) / [TODO.md](TODO.md)

---

## Phase 1: セキュリティ必須対応（P0）

### 1-1. レート制限をSupabaseテーブルに移行

**現状:** インメモリ`Map` → Vercelサーバーレスでリセットされる
**方針:** Supabaseテーブル `login_attempts` を使用（追加依存なし）

- マイグレーション: `login_attempts` テーブル作成（RLSなし、service_roleのみアクセス）
- `src/lib/rate-limit.ts` を全面書き換え
  - `checkLoginAttempt()`: Supabaseからレコード取得 → ロック判定
  - `recordLoginFailure()`: upsertでカウント+1、MAX到達でロック
  - `resetLoginAttempts()`: レコード削除
- 呼び出し側（`src/app/api/auth/worker/route.ts`）のインターフェースは維持

### 1-2. APIルート3箇所のtenant_idフィルタ追加

**変更量:** 各1行追加

| ファイル | 修正内容 |
|---|---|
| `src/app/api/claims/route.ts` L109-113 | `.eq('id', assignee_id)` → `.eq('id', assignee_id).eq('tenant_id', session.tenantId)` |
| `src/app/api/claims/[claimId]/route.ts` L111-115 | 同上 |
| `src/app/api/receptions/[receptionNumber]/customer/route.ts` L76-80 | `.eq('id', customer_id)` → `.eq('id', customer_id).eq('tenant_id', session.tenantId)` |

### 1-3. R2画像アクセスをプロキシAPI経由に変更

**現状:** パブリックURL直接返却
**方針:** 署名付きURL（Presigned URL）を生成

- `@aws-sdk/s3-request-presigner` を追加
- `src/lib/r2.ts` に `getPresignedUrl(key)` を追加（有効期限15分）
- `uploadToR2()` の戻り値をパブリックURLから内部キーに変更
- 画像表示時にPresigned URLを生成するAPIエンドポイント新設
- フロント側の画像表示を新APIエンドポイント経由に変更

**注意:** 影響範囲が広いため、まずP0の他項目を先に対応し、これは最後に着手

### 1-4. localStorageキーのテナント分離

**方針:** 記憶トークンのキーにテナントslugを含める

| ファイル | 修正内容 |
|---|---|
| `src/app/login/page.tsx` | 記憶トークン保存時にキーを `kuratsugi_remember_token_{tenantSlug}` に動的化。自動ログイン時は `LAST_TENANT_ID_KEY` から前回テナントを取得してキーを構築 |
| `src/components/worker/Header.tsx` | ログアウト時に現在テナントの記憶トークンを削除（セッション情報からtenantSlugを取得） |

---

## Phase 2: 多層防御・データ整合性（P1）

### 2-1. 管理者API全12エンドポイントに認証チェック追加

**方針:** `/api/admin/settings/route.ts` のパターンを全APIの各関数冒頭に適用

```typescript
import { getSessionFromRequest } from '@/lib/auth';

// 各関数の冒頭に追加
const session = await getSessionFromRequest(request);
if (!session || session.role !== 'admin') {
  return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 });
}
```

**対象ファイル（12個）:**
1. `api/admin/tenants/route.ts`
2. `api/admin/tenants/[tenantId]/settings/route.ts`
3. `api/admin/workers/route.ts`
4. `api/admin/partners/route.ts`
5. `api/admin/vendors/route.ts`
6. `api/admin/customers/route.ts`
7. `api/admin/logs/route.ts`
8. `api/admin/email-logs/route.ts`
9. `api/admin/paid-storage/route.ts`
10. `api/admin/items/route.ts`
11. `api/admin/claims/route.ts`
12. `api/admin/dashboard/route.ts`

### 2-2. email_logs RLSポリシー修正

- マイグレーション新規作成: `service_role_all` ポリシーを追加
- `current_setting('app.tenant_id', true)` に `missing_ok` パラメータを統一

### 2-3. CRON_SECRET未設定時のガード強化

**対象:**
- `src/app/api/cron/alerts/route.ts` L19
- `src/app/api/cron/archive-items/route.ts` L25

**修正:** `if (cronSecret && authHeader !== ...)` → `if (!cronSecret || authHeader !== ...)`

### 2-4. メール送信ログ記録

- `src/lib/email.ts` の `sendEmail()` 実行後にemail_logsテーブルへINSERT
- tenant_id, to, subject, status, error_message, sent_at を記録

---

## Phase 3: 改善推奨（P2）— 今回のスコープ外

REVIEW.md #10〜#15 は機能改善であり、本番デプロイのブロッカーではない。
Phase 1-2の完了後に別途対応。
