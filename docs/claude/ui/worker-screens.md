# 担当者画面仕様

## 概要

担当者（Worker）はPINコード認証でログインし、預かり品の登録・管理を行う。
全画面にヘッダー（`Header.tsx`）が表示される。

**レイアウトファイル:** `src/app/(worker)/layout.tsx`

---

## ログインページ（/login）

**ファイル:** `src/app/login/page.tsx`
**状態:** 実装済み

### 機能

- テナント解決（サブドメイン or `?tenant=` パラメータ）
- テナント情報の表示（店舗名）
- PINコード入力（8桁、仮想テンキー）
- レート制限表示（残り試行回数、ロック時カウントダウン）
- 記憶トークンによる自動ログイン（localStorage）
- ログイン成功 → `/dashboard` へリダイレクト

### API

- `GET /api/tenant?slug={slug}` — テナント情報取得
- `POST /api/auth/worker` — PIN認証
- `POST /api/auth/worker/remember` — 自動ログイン

---

## ヘッダー

**ファイル:** `src/components/worker/Header.tsx`
**状態:** 実装済み

### 機能

- アプリタイトル + テナント名の表示
- ユーザーメニュー（担当者名 + ドロップダウン）
- ログアウトボタン
- クリック外検知でメニュー閉じる

---

## ダッシュボード（/dashboard）

**ファイル:** `src/app/(worker)/dashboard/page.tsx`
**状態:** UIシェル（データ連携TODO）

### 構成

- **ステータスカード**（6枚）: 受付済、発送待ち、加工中、返却済、有料預かり、クレーム対応中
  - 各カード: 件数 + ラベル（現在はすべて0）
- **クイックアクション**（4ボタン）: 預かり登録、発注管理、返却受入、顧客返送

### TODO

- Supabase からステータス別件数を取得
- クリックでフィルタ付き一覧画面へ遷移

---

## 預かり登録（/reception）

**ファイル:** `src/app/(worker)/reception/page.tsx`
**状態:** プレースホルダー（TODO）

### 想定フロー（KURATSUGI版と同様）

```
Step 1: 写真撮影（表面・裏面・追加写真）
Step 2: 商品情報入力（種別、名前、色、素材、依頼種別等）
Step 3: 顧客紐付け（取引先経由 / 個人）※1点目のみ
Step 4: 追加確認（同一顧客に商品追加 or 終了）
Step 5: 確認（登録内容確認）
Step 6: 完了（受付番号・預かり番号の表示）
```

### TODO

- ウィザードUIの実装
- 写真アップロード（Cloudflare R2）
- 顧客検索・新規登録API
- 受付番号・預かり番号の自動採番

---

## 商品一覧（/items）

**ファイル:** `src/app/(worker)/items/page.tsx`
**状態:** UIシェル（検索フォームのみ）

### 構成

- キーワード検索（預かり番号、顧客名）
- ステータスフィルタ（全て、受付済、発送待ち、加工中、返却済、有料預かり、完了）
- 検索結果一覧（未実装）

### TODO

- Supabase からの商品検索API
- 検索結果テーブル表示
- 商品詳細画面への遷移

---

## 発注管理（/orders）

**ファイル:** `src/app/(worker)/orders/page.tsx`
**状態:** UIシェル（タブのみ）

### 構成

- **タブ**: 業者への発送待ち（pending_ship）、再加工（rework）
- タブ状態はlocalStorageで永続化（`usePersistedState`）
- 商品リスト（未実装）

### TODO

- pending_ship/rework の商品一覧取得
- 業者選択・発送情報入力
- ステータス遷移（pending_ship → processing, rework → processing）

---

## 業者からの返却受入（/returns）

**ファイル:** `src/app/(worker)/returns/page.tsx`
**状態:** UIシェル（タブのみ）

### 構成

- **タブ**: 加工中（processing）、返却済（returned）
- タブ状態はlocalStorageで永続化

### TODO

- processing の商品一覧取得
- 返却受入処理（写真撮影、ステータス更新）
- ステータス遷移（processing → returned）

---

## 顧客への返送（/shipping）

**ファイル:** `src/app/(worker)/shipping/page.tsx`
**状態:** UIシェル（タブのみ）

### 構成

- **タブ**: 返送待ち（pending）、キャンセル（cancelled）、完了（completed）
- タブ状態はlocalStorageで永続化

### TODO

- returned/awaiting_customer の商品一覧
- 返送情報入力（送り状番号、配送業者）
- ステータス遷移（returned → completed 等）

---

## 有料預かり管理（/paid-storage）

**ファイル:** `src/app/(worker)/paid-storage/page.tsx`
**状態:** UIシェル（タブのみ）

### 構成

- **タブ**: 登録（register）、保管中（active）
- タブ状態はlocalStorageで永続化

### TODO

- 有料預かり対象の商品一覧
- 有料預かり登録・解除
- ステータス遷移（returned → paid_storage → completed）

---

## 使い方マニュアル（/manual）

**ファイル:** `src/app/(worker)/manual/page.tsx`
**状態:** 実装済み

### 内容

- 重要な注意事項・コツ
- 用語説明（発注・返却受入・返送の違い）
- 番号体系リファレンス
- ステータス早見表
- メニューと操作の対応表
- 基本フロー（4ステップ）
- 特殊ケース（5パターン: 再加工、長期保管、保留、クレーム、キャンセル）
- FAQ（8項目）

---

## 共通パターン

### タブの永続化

全タブ画面で `usePersistedState` フックを使用:

```typescript
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';

const [activeTab, setActiveTab] = usePersistedState<string>(
  STORAGE_KEYS.WORKER_ORDERS_TAB,
  'pending_ship'
);
```

### ストレージキー一覧

| キー | 用途 |
| ---- | ---- |
| `WORKER_DASHBOARD_PERIOD` | ダッシュボード期間フィルター |
| `WORKER_ITEMS_TAB` | 商品一覧タブ |
| `WORKER_ORDERS_TAB` | 発注管理タブ |
| `WORKER_SHIPPING_TAB` | 返送管理タブ |
| `WORKER_RETURNS_TAB` | 返却受入タブ |
| `WORKER_PAID_STORAGE_TAB` | 有料預かり管理タブ |
