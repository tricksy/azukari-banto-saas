# 開発ガイドライン

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

**注意:** 開発サーバーは `next dev --turbopack -p 3001` で起動される（Turbopack有効、ポート3001）。

---

## 依存パッケージ一覧

### 本番用 (dependencies)

| パッケージ | バージョン | 用途 |
| ---------- | ---------- | ---- |
| next | 16.x | フレームワーク（App Router） |
| react | 19.x | UIライブラリ |
| react-dom | 19.x | React DOM レンダリング |
| @supabase/supabase-js | 2.x | Supabase クライアント |
| @supabase/ssr | 0.8.x | Supabase SSR対応（Cookie管理） |
| jose | 6.x | JWT署名・検証（セッション管理、Remember Token） |
| bcryptjs | 3.x | PINコードのハッシュ化 |

### 開発用 (devDependencies)

| パッケージ | バージョン | 用途 |
| ---------- | ---------- | ---- |
| typescript | 5.x | 型システム |
| tailwindcss | 4.x | CSSフレームワーク |
| @tailwindcss/postcss | 4.x | Tailwind PostCSSプラグイン |
| postcss | 8.x | CSSトランスフォーム |
| eslint | 10.x | コード品質チェック |
| eslint-config-next | 16.x | Next.js用ESLint設定 |
| @types/* | 各種 | TypeScript型定義 |

### パッケージ選定理由

| パッケージ | 選定理由 |
| ---------- | -------- |
| @supabase/supabase-js | PostgreSQL + RLS によるマルチテナントデータ分離 |
| @supabase/ssr | Server Components / Route Handlers でのCookie管理 |
| jose | Node.js標準のcryptoモジュールベースで軽量。jsonwebtokenより依存が少ない |
| bcryptjs | 純JavaScript実装でネイティブバイナリ不要。Vercel Edge対応 |

---

## プロジェクト構造

```text
src/
├── app/
│   ├── (worker)/               # 担当者用画面（PIN認証）
│   │   ├── dashboard/          # ダッシュボード
│   │   ├── reception/          # 預かり登録（ウィザード形式）
│   │   ├── items/              # 商品一覧・詳細
│   │   ├── orders/             # 発注管理
│   │   ├── returns/            # 業者からの返却受入
│   │   ├── shipping/           # 顧客への返送
│   │   ├── paid-storage/       # 有料預かり管理
│   │   ├── manual/             # 使い方マニュアル
│   │   └── layout.tsx          # ヘッダー付きレイアウト
│   ├── admin/                  # 管理者用画面
│   │   ├── (auth)/             # 認証グループ（サイドバーなし）
│   │   └── (dashboard)/        # ダッシュボードグループ（サイドバー付き）
│   │       └── tenants/        # テナント管理
│   ├── api/                    # API Routes
│   │   ├── auth/               # 認証API
│   │   │   ├── admin/          # 管理者OAuth認証
│   │   │   ├── worker/         # 担当者PIN認証
│   │   │   │   └── remember/   # 記憶トークン認証
│   │   │   └── logout/         # ログアウト
│   │   ├── admin/              # 管理者API
│   │   │   └── tenants/        # テナント管理API
│   │   └── tenant/             # テナント情報
│   ├── login/                  # ログインページ
│   ├── globals.css             # 侘寂デザインシステム
│   └── layout.tsx              # ルートレイアウト
├── components/
│   ├── ui/                     # 共通UIコンポーネント
│   ├── admin/                  # 管理者用コンポーネント
│   └── worker/                 # 担当者用コンポーネント
├── hooks/
│   ├── usePersistedState.ts    # ローカルストレージ永続化フック
│   └── useFocusTrap.ts         # フォーカストラップフック
├── lib/
│   ├── admin-path.ts           # 管理者パス生成ユーティリティ（URL難読化対応）
│   ├── auth.ts                 # セッション管理（JWT署名付き）
│   ├── date.ts                 # 日付ユーティリティ（JST対応）
│   ├── rate-limit.ts           # レート制限
│   ├── tenant.ts               # テナント解決
│   └── supabase/
│       ├── server.ts           # サーバーサイドSupabaseクライアント
│       └── client.ts           # ブラウザサイドSupabaseクライアント
├── types/
│   └── index.ts                # 型定義
└── middleware.ts               # 認証ガード + テナント解決
```

---

## カスタムフック

### usePersistedState

ローカルストレージに状態を永続化するカスタムフック。SSR対応。

**ファイル:** `src/hooks/usePersistedState.ts`

```typescript
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';

// 使用例
const [activeTab, setActiveTab] = usePersistedState<string>(
  STORAGE_KEYS.WORKER_ORDERS_TAB,
  'pending_ship'
);
```

**ストレージキー一覧:**

| キー | 用途 |
| ---- | ---- |
| `WORKER_DASHBOARD_PERIOD` | ダッシュボード期間フィルター |
| `WORKER_ITEMS_TAB` | 商品一覧タブ |
| `WORKER_ORDERS_TAB` | 発注管理タブ |
| `WORKER_SHIPPING_TAB` | 返送管理タブ |
| `WORKER_RETURNS_TAB` | 返却受入タブ |
| `WORKER_PAID_STORAGE_TAB` | 有料預かり管理タブ |
| `ADMIN_DASHBOARD_PERIOD` | ダッシュボード期間フィルター |
| `ADMIN_ITEMS_TAB` | 管理者商品一覧タブ |
| `ADMIN_PAID_STORAGE_TAB` | 管理者有料預かりタブ |
| `ADMIN_CLAIMS_TAB` | クレーム管理タブ |
| `ADMIN_LOGS_TAB` | ログ管理タブ |

### useFocusTrap

モーダル等でのフォーカストラップを実現するカスタムフック。

**ファイル:** `src/hooks/useFocusTrap.ts`

---

## UIコンポーネント

### 共通UIコンポーネント（src/components/ui/）

| コンポーネント | 用途 |
| -------------- | ---- |
| Badge | バッジ表示 |
| Breadcrumb | パンくずリスト |
| Button | ボタン |
| Card | カードレイアウト |
| ErrorMessage | エラーメッセージ表示 |
| Input | テキスト入力 |
| Modal | モーダルダイアログ |
| Pagination | ページネーション |
| Select | セレクトボックス |
| Skeleton | ローディングスケルトン |
| Toast | トースト通知 |
| Toggle | トグルスイッチ |

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

## コード品質の基準

- **DRY**: 重複を避け、単一の信頼できる情報源を維持
- **SOLID**: 単一責任、開放閉鎖、リスコフの置換、インターフェース分離、依存性逆転
- **KISS**: シンプルに保つ
- **YAGNI**: 必要になるまで実装しない
- コメントは「なぜ」を説明し、「何を」はコードで表現

---

## エラーハンドリングの原則

- エラーの抑制ではなく、根本原因を修正
- 早期にエラーを検出し、明確なエラーメッセージを提供
- 外部APIやネットワーク通信は必ず失敗する可能性を考慮

---

## セキュリティの考え方

- APIキー、パスワード等は環境変数で管理（ハードコード禁止）
- PINはbcryptjsでハッシュ化して保存
- すべての外部入力を検証
- テナント間のデータアクセスをRLSで完全に分離

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

### 3. セキュリティ

- [ ] APIキーやPINがハードコードされていないこと
- [ ] 環境変数が適切に設定されていること
- [ ] テナント分離が正しく動作すること
