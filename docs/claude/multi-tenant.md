# マルチテナントアーキテクチャ

## 概要

預かり番頭 SaaS は、1つのアプリケーションで複数の店舗（テナント）を運用するマルチテナント構成。データ分離には PostgreSQL の Row Level Security (RLS) を使用する。

| 項目 | 仕様 |
| ---- | ---- |
| テナント識別 | サブドメイン（`{slug}.kuratsugi.app`） |
| データ分離 | PostgreSQL RLS（`tenant_id` カラム） |
| セッション | JWT にテナント情報を含む |
| DB接続 | 共有データベース（RLSで論理分離） |

---

## テナント識別

### 本番環境

サブドメインからテナントslugを抽出:

```
https://demo-kimono.kuratsugi.app → slug: "demo-kimono"
https://matsumoto.kuratsugi.app  → slug: "matsumoto"
```

### 開発環境（localhost:3001）

localhostではサブドメインが使えないため、以下の方法で代替:

1. **クエリパラメータ**: `http://localhost:3001?tenant=demo`
   - 初回アクセス時にlocalStorageに保存
   - 以後はlocalStorageから読み込み
2. **ヘッダー**: `x-tenant-slug: demo`
   - Middleware が読み取り
   - ログインページのフォームからAPIリクエスト時に自動付与

---

## テナント解決の処理フロー

### Middleware（src/middleware.ts）

```text
リクエスト受信
    |
    v
ホスト名からサブドメインを抽出
    |
    +--> {slug}.kuratsugi.app の場合 → slug を取得
    |
    +--> localhost の場合 → x-tenant-slug ヘッダーから取得
    |
    v
テナントslugをレスポンスヘッダー（x-tenant-slug）に付与
    |
    v
認証チェック（JWT検証）
    |
    v
リクエストヘッダーにテナントslugを追加して次へ
```

### Server Components / API Routes（src/lib/tenant.ts）

```typescript
import { getTenantSlug } from '@/lib/tenant';

// リクエストヘッダーからテナントslugを取得
const tenantSlug = await getTenantSlug();
```

**処理順序:**

1. `x-tenant-slug` ヘッダーを確認（Middleware が設定）
2. ホスト名からサブドメインを抽出
3. いずれも取得できない場合は `null`

---

## データ分離（RLS）

### 原則

全ての業務テーブルは `tenant_id` (UUID) カラムを持ち、Row Level Security (RLS) ポリシーで自動的にフィルタリングされる。

### RLSポリシー

```sql
-- テナント分離ポリシー（全業務テーブルに適用）
CREATE POLICY tenant_isolation ON items
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

### テナントIDの設定

Supabase クライアントからリクエストを送信する前に、セッション変数 `app.tenant_id` を設定する:

```typescript
// RLSが有効なクエリの前にテナントIDを設定
const supabase = await createClient();
await supabase.rpc('set_tenant_id', { tenant_id: session.tenantId });
```

---

## Supabase クライアント

### 2種類のクライアント

| 種別 | ファイル | RLS | 用途 |
| ---- | -------- | --- | ---- |
| ブラウザ | `src/lib/supabase/client.ts` | 有効 | クライアントサイドからの操作 |
| サーバー（anon） | `src/lib/supabase/server.ts` - `createClient()` | 有効 | Server Components, Route Handlers |
| サーバー（service_role） | `src/lib/supabase/server.ts` - `createServiceClient()` | バイパス | 認証処理, Cronジョブ, テナント横断管理 |

### ブラウザクライアント

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### サーバーサイドクライアント（RLS有効）

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component からの呼び出し時は set できないため無視
          }
        },
      },
    }
  );
}
```

### サービスロールクライアント（RLSバイパス）

```typescript
// src/lib/supabase/server.ts
export function createServiceClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

**使用場面:**

- 認証API（テナント解決時にslugからテナントを検索）
- Cronジョブ（全テナント横断でアラートチェック等）
- プラットフォーム管理（テナント作成・設定変更等）

---

## テナントコンテキストとJWT

### セッション内のテナント情報

JWTセッショントークンには以下のテナント情報が含まれる:

```typescript
interface SessionData {
  workerId: string;
  name: string;
  role: 'worker' | 'admin';
  tenantId: string;      // テナントUUID（RLSで使用）
  tenantSlug: string;    // テナントslug（URL表示用）
  loginAt: string;
}
```

### 認証時のテナント解決

1. ログインリクエストに `tenantSlug` を含める
2. `tenants` テーブルから slug でテナントを検索
3. テナントの `status` が `active` であることを確認
4. テナント内の担当者を検索しPINを照合
5. セッションに `tenantId` と `tenantSlug` を含めてJWT発行

---

## 開発環境でのテナント切り替え

### 方法1: クエリパラメータ

```
http://localhost:3001?tenant=demo
```

ログインページにアクセスすると、`tenant` パラメータがlocalStorageに保存される。以降のリクエストでは自動的にこのslugが使用される。

### 方法2: localStorageを直接変更

ブラウザの開発者ツールで:

```javascript
localStorage.setItem('kuratsugi:tenant_slug', 'another-tenant');
```

### 方法3: ヘッダー指定（API テスト用）

```bash
curl -H "x-tenant-slug: demo" http://localhost:3001/api/tenant?slug=demo
```

---

## 関連ファイル

| ファイル | 役割 |
| -------- | ---- |
| `src/lib/tenant.ts` | テナントslug取得ユーティリティ |
| `src/middleware.ts` | テナント解決 + 認証ガード |
| `src/lib/supabase/server.ts` | サーバーサイドSupabaseクライアント |
| `src/lib/supabase/client.ts` | ブラウザサイドSupabaseクライアント |
| `src/lib/auth.ts` | セッション管理（テナントID含む） |
| `src/app/api/auth/worker/route.ts` | 認証API（テナント解決） |
| `src/app/api/tenant/route.ts` | テナント情報取得API |

---

## セキュリティ考慮事項

### テナント間のデータ漏洩防止

1. **RLSポリシー**: データベースレベルでテナント分離を強制
2. **JWTテナントID**: セッションにテナントIDを含め、リクエスト毎に検証
3. **サービスロールの制限**: `SUPABASE_SERVICE_ROLE_KEY` はサーバーサイドのみで使用
4. **Middleware検証**: サブドメインとセッション内のテナントslugの整合性チェック

### 禁止事項

- `SUPABASE_SERVICE_ROLE_KEY` をクライアントサイドに露出しない
- `NEXT_PUBLIC_` プレフィックスを `SUPABASE_SERVICE_ROLE_KEY` に付けない
- テナント横断クエリをanon keyで実行しない（RLSにより空の結果が返る）
- セッションの `tenantId` を書き換え可能な場所に保存しない（JWTで署名保護）
