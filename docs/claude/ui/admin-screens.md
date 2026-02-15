# 管理者画面仕様

## 概要

管理者（Admin）は店舗の設定・マスタ管理・ログ閲覧を行う。
サイドバー（`AdminSidebar.tsx`）付きレイアウトで構成。

**認証グループ:**
- `admin/(auth)/` — 認証ページ（サイドバーなし）
- `admin/(dashboard)/` — 管理画面（サイドバー付き）

---

## 管理者ログイン（/admin/login）

**ファイル:** `src/app/admin/(auth)/login/page.tsx`
**状態:** UIシェル（TODO）

### TODO

- メール+パスワード認証の実装
- 管理者セッション管理

---

## サイドバー

**ファイル:** `src/components/admin/AdminSidebar.tsx`
**状態:** 実装済み

### メニュー構成

| 順序 | メニュー | パス | アイコン |
|------|---------|------|---------|
| 1 | ダッシュボード | /admin/dashboard | 📊 |
| 2 | ステータス一覧 | /admin/statuses | 📋 |
| 3 | クレーム管理 | /admin/claims | ⚠️ |
| 4 | 有料預かり | /admin/paid-storage | 📦 |
| 5 | 取引先管理 | /admin/partners | 🏢 |
| 6 | 業者管理 | /admin/vendors | 🏭 |
| 7 | 顧客管理 | /admin/customers | 👥 |
| 8 | 担当者管理 | /admin/workers | 👤 |
| 9 | 操作ログ | /admin/logs | 📝 |
| 10 | メール送信ログ | /admin/email-logs | ✉️ |
| 11 | 使い方マニュアル | /admin/manual | 📖 |
| 12 | システム設定 | /admin/settings | ⚙️ |

### レスポンシブ

- デスクトップ: 固定サイドバー（左側）
- モバイル: ハンバーガーメニュー + オーバーレイ
- アクティブリンクのハイライト（パスベース）
- ダークテーマ（床の間スタイル）

---

## ダッシュボード（/admin/dashboard）

**ファイル:** `src/app/admin/(dashboard)/dashboard/page.tsx`
**状態:** UIシェル（データ連携TODO）

### 構成

- **アラートサマリ**（5枚）: 発送期限超過、返送期限超過、長期滞留、保留中、クレーム対応中
- **ワークフローステータス**（6枚）: 受付済、発送待ち、加工中、返却済、完了、有料預かり
- 有料預かりサマリカード
- 最近の操作ログ（プレースホルダー）

### TODO

- Supabase からアラート・ステータス集計取得
- リアルタイム更新

---

## 商品一覧（/admin/items）

**ファイル:** `src/app/admin/(dashboard)/items/page.tsx`
**状態:** UIシェル（TODO）

### 構成

- 検索バー
- **タブ**: 全件（all）、アラート（alerts）、スケジュール（schedule）
- タブ状態はlocalStorageで永続化

---

## ステータス一覧（/admin/statuses）

**ファイル:** `src/app/admin/(dashboard)/statuses/page.tsx`
**状態:** 実装済み（リファレンス）

### 内容

- ステータスフロー可視化
- 全11ステータスの説明（色分け、コード、説明）
- 読み取り専用のリファレンスページ

---

## マスタ管理

### 取引先管理（/admin/partners）

**ファイル:** `src/app/admin/(dashboard)/partners/page.tsx`
**状態:** UIシェル（TODO）

- 新規登録フォーム（折りたたみ式）: 取引先名、郵便番号、電話番号、住所
- 取引先リスト（プレースホルダー）

### 業者管理（/admin/vendors）

**ファイル:** `src/app/admin/(dashboard)/vendors/page.tsx`
**状態:** UIシェル（TODO）

- 新規登録フォーム: 業者名、得意分野、郵便番号、電話番号、住所
- 業者リスト（プレースホルダー）

### 顧客管理（/admin/customers）

**ファイル:** `src/app/admin/(dashboard)/customers/page.tsx`
**状態:** UIシェル（TODO）

- 新規登録フォーム: 顧客名、フリガナ、取引先（ドロップダウン）、郵便番号、電話番号、住所
- 顧客リスト（プレースホルダー）

### 担当者管理（/admin/workers）

**ファイル:** `src/app/admin/(dashboard)/workers/page.tsx`
**状態:** UIシェル（TODO）

- 新規登録フォーム: 担当者ID（例: T01）、担当者名、PINコード（8桁）
- 担当者リスト（プレースホルダー）

---

## クレーム管理（/admin/claims）

**ファイル:** `src/app/admin/(dashboard)/claims/page.tsx`
**状態:** UIシェル（TODO）

### 構成

- **タブ**: 対応中（active）、解決済（resolved）
- タブ状態はlocalStorageで永続化

---

## 有料預かり管理（/admin/paid-storage）

**ファイル:** `src/app/admin/(dashboard)/paid-storage/page.tsx`
**状態:** UIシェル（TODO）

### 構成

- **タブ**: 登録（register）、保管中（active）、完了（completed）
- タブ状態はlocalStorageで永続化

---

## 操作ログ（/admin/logs）

**ファイル:** `src/app/admin/(dashboard)/logs/page.tsx`
**状態:** UIシェル（TODO）

### 構成

- 日付範囲フィルタ（開始日・終了日）
- **タブ**: 操作ログ（operations）、認証ログ（auth）
- タブ・フィルタ状態はlocalStorageで永続化

---

## メール送信ログ（/admin/email-logs）

**ファイル:** `src/app/admin/(dashboard)/email-logs/page.tsx`
**状態:** UIシェル（TODO）

### 構成

- 種別フィルタ: 全て、アラート、有料預かり、クレーム、カスタム
- メール送信履歴一覧（プレースホルダー）

---

## システム設定（/admin/settings）

**ファイル:** `src/app/admin/(dashboard)/settings/page.tsx`
**状態:** UIシェル（保存機能TODO）

### 設定項目

| カテゴリ | 項目 | デフォルト値 |
|---------|------|-------------|
| アラート | メール通知有効/無効 | OFF |
| アラート | 通知先メールアドレス | — |
| 期限 | 業者発送期限（日） | 7 |
| 期限 | 顧客返送期限（日） | 14 |
| 期限 | 滞留警告しきい値（日） | 30 |
| 期限 | 自動アーカイブ（日） | 365 |
| 有料預かり | 猶予日数 | 7 |

### TODO

- Supabase tenant_settings テーブルとの連携
- 保存API実装

---

## 使い方マニュアル（/admin/manual）

**ファイル:** `src/app/admin/(dashboard)/manual/page.tsx`
**状態:** 実装済み

### 内容

- 管理者の役割概要（監視、管理、サポート、設定の4セクション）
- メニューと操作の対応表
- マスタ管理の手順（取引先、業者、顧客、担当者）
- クレーム管理ワークフロー
- 有料預かり管理
- 操作ログの見方
- メールログの確認方法
- システム設定の詳細ガイド
- 日次確認ワークフロー
- ステータス早見表
- FAQ（8項目）

---

## 共通パターン

### タブの永続化

```typescript
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';

const [activeTab, setActiveTab] = usePersistedState<string>(
  STORAGE_KEYS.ADMIN_ITEMS_TAB,
  'all'
);
```

### ストレージキー一覧

| キー | 用途 |
| ---- | ---- |
| `ADMIN_DASHBOARD_PERIOD` | ダッシュボード期間フィルター |
| `ADMIN_ITEMS_TAB` | 管理者商品一覧タブ |
| `ADMIN_PAID_STORAGE_TAB` | 管理者有料預かりタブ |
| `ADMIN_CLAIMS_TAB` | クレーム管理タブ |
| `ADMIN_LOGS_TAB` | ログ管理タブ |

### 実装ステータスサマリ

| 画面 | 状態 |
|------|------|
| サイドバー | 実装済み |
| ステータス一覧 | 実装済み |
| マニュアル | 実装済み |
| 設定 | UIシェル（保存未実装） |
| その他全画面 | UIシェル（データ連携TODO） |
