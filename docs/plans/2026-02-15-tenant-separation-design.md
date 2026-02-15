# テナント分離移行設計

## 概要

SaaS版で利用中のテナントが利用増大した場合、専用サーバー（別Supabase + 別Vercel）に移行できる仕組み。

## 要件

- データ（預かり品、顧客、業者等）の完全移行
- 同じテナントID（4桁hex）で引き続きログイン可能
- ダウンタイムなし

## アーキテクチャ

### 全体フロー

```
[ユーザー] → kuratsugi.app/login
              ↓
         テナントID入力（例: D7E1）
              ↓
         GET /api/tenant?slug=D7E1
              ↓
         ┌─ redirect_url が NULL → SaaS内でPIN認証（現行どおり）
         └─ redirect_url が存在 → 専用サーバーへリダイレクト
              ↓
         例: https://shibamago.kuratsugi.app/login?tenant=D7E1
              ↓
         専用サーバーでPIN認証 → ダッシュボード
```

### 構成

| 層 | SaaS側の変更 | 専用サーバー |
|---|---|---|
| DB | `redirect_url` カラム追加 | 同じスキーマ（別Supabase） |
| API | `/api/tenant` にredirect_url追加 | 変更なし |
| ログイン | redirect_url時にリダイレクト | テナントID固定、PIN入力のみ |
| 認証 | 変更なし | 変更なし |
| 移行 | redirect_url設定で切替 | データimportのみ |

## SaaS側の変更（最小限）

### 1. DBマイグレーション

```sql
ALTER TABLE tenants ADD COLUMN redirect_url TEXT DEFAULT NULL;
```

- `NULL` = SaaS内で処理（現行どおり）
- 値あり = そのURLにリダイレクト

### 2. `/api/tenant` レスポンス変更

```json
// 変更後
{
  "tenant": {
    "slug": "D7E1",
    "name": "柴犬屋",
    "status": "active",
    "redirect_url": "https://shibamago.kuratsugi.app"
  }
}
```

### 3. ログイン画面の変更（login/page.tsx）

```
テナントID入力 → 次へ → /api/tenant 呼び出し
  ├─ redirect_url あり → window.location.href = `${redirect_url}/login?tenant=D7E1`
  └─ redirect_url なし → PIN入力ステップへ（現行どおり）
```

## 専用サーバー側（フォーク版）

### リポジトリ

azukari-banto-saas をフォークして別リポジトリとして管理。

### 環境変数の追加

```
FIXED_TENANT_SLUG=D7E1    # このサーバーのテナントID
```

### 変更点

1. **ログイン画面** — テナントID入力ステップを省略
   - `?tenant=D7E1` クエリパラメータがあればそのまま使用
   - なければ `FIXED_TENANT_SLUG` 環境変数を使用
   - ユーザーにはPIN入力画面だけ表示（店舗名は固定表示）
2. **`/api/tenant` は残す** — 起動時に店舗名取得のために使用
3. **認証API・セッション・ミドルウェア** — 変更なし（tenantSlugが固定になるだけ）
4. **Supabase** — 専用プロジェクト、同じスキーマ、RLSそのまま

### デプロイ

専用Vercelプロジェクト（別ドメインまたはサブドメイン）。

## データ移行手順（ダウンタイムなし）

```
1. 専用Supabase準備
   └─ 新プロジェクト作成 → マイグレーション適用

2. データエクスポート（SaaS側）
   └─ 対象テナントのデータをテーブルごとにSQL export
      workers, partners, customers, vendors, receptions,
      items, claims, claim_logs, operation_logs, tenant_settings

3. データインポート（専用側）
   └─ 同じテナントID・slugでtenantレコード作成
   └─ ビジネスデータをinsert

4. 専用サーバーデプロイ
   └─ フォーク版をVercelにデプロイ
   └─ 動作確認（専用サーバー単体でログイン・閲覧可能）

5. SaaS側で切り替え（ゼロダウンタイム）
   └─ UPDATE tenants SET redirect_url = 'https://xxx.vercel.app'
      WHERE slug = 'D7E1';
   └─ この瞬間からユーザーは専用サーバーへリダイレクト

6. SaaS側の旧データ（任意）
   └─ 一定期間後に削除 or アーカイブ
```

### 移行ツール

Supabase CLIの `pg_dump` / `psql` で対象テナントのデータを抽出・投入するスクリプトを用意。
