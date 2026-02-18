# SaaS化チェック レビューレポート

**実施日:** 2026-02-18
**対象:** 預かり番頭β SaaS 全コードベース
**調査方法:** 6エージェント並列調査（API / DB・RLS / UI・UX / 認証・ミドルウェア / ストレージ・外部連携 / 型定義・ビジネスロジック）

---

## P0: 本番デプロイ前に必須対応

### 1. レート制限がVercel環境で機能しない

- **ファイル:** `src/lib/rate-limit.ts:13`
- **内容:** インメモリ`Map`でログイン試行を管理しているが、Vercelサーバーレス環境ではリクエストごとにインスタンスがリセットされるため、レート制限が事実上無効
- **影響:** PINコードのブルートフォース攻撃が無制限に可能
- **対策:** Upstash Redis / Vercel KV / Supabaseテーブルなど永続ストアに変更

### 2. APIルート3箇所でtenant_idフィルタ漏れ（データ漏洩）

createServiceClient()使用時にルックアップクエリでtenant_idフィルタが欠落。他テナントのUUIDを指定すると情報が漏洩する。

| ファイル | 行 | 漏洩する情報 |
|---|---|---|
| `src/app/api/claims/route.ts` (POST) | 109-114 | 他テナントworker名 |
| `src/app/api/claims/[claimId]/route.ts` (PATCH) | 111-116 | 他テナントworker名 |
| `src/app/api/receptions/[receptionNumber]/customer/route.ts` (PATCH) | 76-80 | 他テナント顧客name_kana |

- **対策:** 各クエリに`.eq('tenant_id', session.tenantId)`を追加

### 3. R2パブリックURL経由で他テナント画像に認証なしアクセス可能

- **ファイル:** `src/lib/r2.ts:46`
- **内容:** R2キーには`tenantId`が含まれている（適切）が、パブリックURLを知っていれば誰でも認証なしでアクセス可能
- **対策:** 署名付きURL（Presigned URL）に変更、またはCloudflare Workerでプロキシ＋テナント検証

### 4. localStorageの記憶トークンがテナント別でない

- **ファイル:** `src/app/login/page.tsx:5-6`, `src/components/worker/Header.tsx:7`
- **内容:** `kuratsugi_remember_token`キーにテナントIDが含まれない。同一ブラウザで複数テナント利用時にトークンが上書きされ、意図しないテナントへのログイン試行が発生
- **対策:** キーにtenantIdを含める（例: `kuratsugi:A3F0:remember_token`）

---

## P1: 早期対応推奨

### 5. 管理者API 12エンドポイントでAPI内認証チェック欠落

- **内容:** ミドルウェアで保護されているが、API関数内に`getSessionFromRequest()`/`getAdminSession()`がない（多層防御の欠如）
- **例外:** `/api/admin/settings`のみ正しく実装済み
- **該当API:**
  - `GET/POST/PUT/PATCH /api/admin/tenants`
  - `GET/PUT /api/admin/tenants/[tenantId]/settings`
  - `GET/POST/PUT/PATCH /api/admin/workers`
  - `GET/POST/PUT/PATCH /api/admin/partners`
  - `GET/POST/PUT/PATCH /api/admin/vendors`
  - `GET/POST/PUT/PATCH /api/admin/customers`
  - `GET /api/admin/logs`
  - `GET /api/admin/email-logs`
  - `GET /api/admin/paid-storage`
  - `GET /api/admin/items`
  - `GET /api/admin/claims`
  - `GET /api/admin/dashboard`
- **対策:** 全admin APIに認証チェックを追加

### 6. email_logsテーブルにservice_roleポリシーなし

- **ファイル:** `supabase/migrations/20260218000001_email_logs.sql`
- **内容:** 他テーブルにある`service_role_all`ポリシーが未定義。サーバーからemail_logsを操作できない可能性
- **対策:** `service_role_all`ポリシーを追加するマイグレーションを作成

### 7. CRON_SECRET未設定時にCron API認証がスキップされる

- **ファイル:** `src/app/api/cron/alerts/route.ts`, `src/app/api/cron/archive-items/route.ts`
- **内容:** `if (cronSecret && authHeader !== ...)` — 環境変数未設定でガードが無効に
- **対策:** 未設定時は403を返すように修正

### 8. FK制約にtenant_idが含まれない（クロステナント参照リスク）

- **内容:** 全FKが`id`のみで参照。service_role使用時やDB直接操作時にテナント間参照が理論的に可能
- **対象テーブル:** customers, receptions, items, claims, claim_logs（全FK）
- **緩和要因:** RLSがバックストップとして機能
- **対策:** 複合FK `(tenant_id, referenced_id)` にするか、アプリ層で厳格に検証

### 9. メール送信ログがDBに記録されない

- **内容:** `email_logs`テーブルは作成済みだが、`sendEmail()`/`sendAlertEmail()`内でINSERT処理がない
- **影響:** 管理者画面の`/admin/email-logs`が常に空
- **対策:** メール送信後にemail_logsへINSERTする処理を追加

---

## P2: 改善推奨

### 10. Tenant型が共通型定義ファイルに未定義

- **ファイル:** `src/types/index.ts`
- **内容:** Tenant, TenantSettings, TenantPlan等の型が共通型定義にない。テナント管理画面（`tenants/page.tsx`）でローカル定義のみ
- **対策:** 共通型定義に追加

### 11. フロントエンド型にtenant_idフィールドなし

- **ファイル:** `src/types/index.ts`
- **内容:** Reception, Item, Customer等の全型にtenant_idフィールドがない。管理者APIが返すtenant_idとTypeScript型が不整合
- **対策:** ベース型に`tenant_id?: string`を追加、または管理者画面向け拡張型を作成

### 12. DBのENUMに廃止済みfreeプランが残存

- **ファイル:** `supabase/migrations/20260214000001_initial_schema.sql`
- **内容:** `tenant_plan` ENUMに`free`が残っている。新規環境構築時にfreeが一旦作成されてから別マイグレーションで削除される（冪等性の問題）
- **対策:** 初期マイグレーションを修正するか、明示的なENUM更新マイグレーションを追加

### 13. 画像削除機能が未実装

- **内容:** R2からの画像削除APIが存在しない。商品削除やアーカイブ時にR2画像が残り続ける
- **影響:** ストレージ肥大化、テナント削除時のクリーンアップ不可
- **対策:** 画像削除APIを実装し、パス先頭のtenantIdがセッションと一致することを検証

### 14. ハードコードドメイン kuratsugi.app

- **ファイル:** `src/lib/tenant.ts:19`, `src/middleware.ts:23`
- **内容:** `BASE_DOMAIN`環境変数のフォールバック値として`kuratsugi.app`がハードコード
- **対策:** 環境変数の必須化、または汎用的なフォールバック

### 15. localStorageキー全般がテナント別でない

- **ファイル:** `src/hooks/usePersistedState.ts:51-66`
- **内容:** `kuratsugi:worker:dashboard:period`等11キーにテナントIDが含まれない。テナント切り替え時に設定値が混在
- **対策:** キーに`tenantId`を含める（例: `kuratsugi:A3F0:worker:dashboard:period`）

---

## P3: 将来対応

### 16. 担当者IDがテナント間で重複可能

- **内容:** `generateWorkerId()`の衝突チェックがテナント内のみ。受付番号・預かり番号が異なるテナントで同一になる理論的可能性
- **影響:** DBのUNIQUE制約は`(tenant_id, xxx_number)`なのでDB上は問題ないが、印刷物や業者連携で番号の曖昧さが生じる
- **対策案:** 担当者IDをテナント横断でユニーク化、または番号体系にテナントslugを含める

### 17. 日付ユーティリティがJST固定

- **ファイル:** `src/lib/date.ts`
- **内容:** `Asia/Tokyo`がハードコード。国内向けSaaSでは問題なし
- **対策:** 将来の海外展開時にテナント設定にtimezoneフィールドを追加

### 18. テナント設定項目が限定的

- **内容:** 現在はメール設定（Resend APIキー、送信元メール）のみ。営業時間・休日・店舗詳細情報の設定項目なし
- **対策:** 段階的に`tenant_settings`テーブルにキーを追加

### 19. platform_admins / tenantsテーブルにRLSなし

- **内容:** 設計意図（ログインフローでslug検索が必要等）だが、anon roleで全データ取得可能
- **対策:** anon roleへのSELECT権限を制限、またはAPI層でのみアクセスするよう徹底

### 20. seed.sqlのテストデータ不十分

- **内容:** B1C2テナントにテストデータがゼロ。CLAUDE.md記載のD7E1（柴犬屋）がseed.sqlに未定義
- **対策:** マルチテナントテストには最低2テナントに同等のテストデータが必要

### 21. 記憶トークンの署名比較がタイミングセーフでない

- **ファイル:** `src/lib/auth.ts:221`
- **内容:** 通常の`!==`比較を使用。タイミング攻撃で署名推測の理論的リスク
- **対策:** `crypto.timingSafeEqual()`に変更

### 22. ログアウト時に記憶トークンのサーバー側無効化なし

- **ファイル:** `src/app/api/auth/logout/route.ts`
- **内容:** セッションCookieは削除されるが、記憶トークンのサーバー側失効機構がない
- **緩和:** 自動ログイン時にテナント・担当者有効性を再検証しているため実害は限定的

### 23. getTenantSlug()がデッドコード

- **ファイル:** `src/lib/tenant.ts`
- **内容:** 定義されているがどこからもimportされていない
- **対策:** 削除

---

## 良好な点（問題なし）

- 全11業務テーブルに`tenant_id`カラムとRLSポリシーが適切に設定済み
- Worker API全般で`session.tenantId`によるデータフィルタリングが実装済み
- JWTに`tenantId`が含まれ、テナントAのトークンでテナントBのデータにはアクセス不可
- R2ストレージキーに`tenantId`プレフィックスが含まれている
- メール送信のテナント別APIキー設計は実装済み（`tenant_settings`から取得）
- ログイン画面はテナントID入力→店舗名確認→PIN入力の正しいフロー
- Cookie設定が適切（httpOnly, secure, sameSite: strict）
- 管理者認証がテナント非依存の設計
- UNIQUEキーが`(tenant_id, business_key)`の複合キーになっている
- テナント名の動的表示が正しく実装されている
- KURATSUGI（単体版）固有のロジック残留なし
