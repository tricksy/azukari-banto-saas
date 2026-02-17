# 担当者画面仕様

## 概要

担当者（Worker）はPINコード認証でログインし、預かり品の登録・管理を行う。
全画面にヘッダー（`Header.tsx`）とボトムナビゲーション（`BottomNav.tsx`）が表示される。

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

- アプリタイトル + テナント名（店舗名）の表示
- ユーザーメニュー（担当者名 + ドロップダウン）
- ログアウトボタン
- クリック外検知でメニュー閉じる

---

## ボトムナビゲーション

**ファイル:** `src/components/worker/BottomNav.tsx`
**状態:** 実装済み

### 機能

- 画面下部固定のナビゲーションバー（5項目）
- 各項目: ホーム、受付、発注、返却、返送
- 現在ページのアクティブ表示（朱色）
- SVGアイコン + テキストラベル

---

## ダッシュボード（/dashboard）

**ファイル:** `src/app/(worker)/dashboard/page.tsx`
**状態:** 実装済み

### 構成

- **統計カード**（上段4枚 + 下段2枚）
  - 上段: 業者へ未発送（received + pending_ship合算、朱色）、加工中（processing、墨色）、顧客へ返送待ち（returned + paid_storage、老竹色）、期限超過（shipOverdue + returnOverdue、件数に応じて動的色変更）
  - 下段: 有料預かり（件数に応じて動的色変更、黄土色）、クレーム対応中（件数に応じて動的色変更、濃茜色）
  - 各カードは対応画面へのリンク（期限超過・クレーム対応中を除く）
- **顧客未設定の商品（下書き）セクション**: 受付番号ごとにグループ化して表示（最大5件）。クリックで受付ウィザードへ遷移
- **期限超過の商品セクション**: 発送予定日・返送予定日を超過した商品を超過日数の多い順に表示（最大5件）。クリックで商品詳細モーダル表示
- **クレーム対応中の商品セクション**: `is_claim_active` が true の商品を一覧表示（最大5件）。クリックで商品詳細モーダル表示
- **今週の業者への発送予定**: テーブル形式で今週中に発送予定の商品を一覧表示。今日・明日の行は背景色で強調
- **今週の顧客への返送予定**: テーブル形式で今週中に返送予定の商品を一覧表示。今日・明日の行は背景色で強調
- **取扱説明書リンク**: `/manual` へのリンクカード
- **商品詳細モーダル**（`ItemDetailModal`）: 各アイテムクリック時に表示

### データ取得

- `/api/items?status=draft,received,pending_ship,processing,returned,paid_storage&limit=100` で全アクティブ商品を一括取得
- クライアント側でステータス別フィルタリング、超過日数計算、今週の予定抽出を実行

---

## 預かり登録（/reception）

**ファイル:** `src/app/(worker)/reception/page.tsx`
**コンポーネント:** `src/components/reception/ReceptionWizard.tsx`
**状態:** 実装済み

### ウィザードフロー

内部ロジックは6ステップで構成されるが、画面上のステップインジケーターは4ステップ（短縮ラベル）で表示される。

#### ステップインジケーター（画面表示: 4ステップ）

| 表示番号 | ラベル | 対応する内部ステップ |
| -------- | ------ | -------------------- |
| 1 | 撮影 | photo |
| 2 | 商品 | itemDetails |
| 3 | 顧客 | customer, addMore |
| 4 | 確認 | confirm |

※ `addMore`（追加確認）ステップは `customer` と同じインジケーター位置に表示される。
※ `complete`（完了）ステップはインジケーター外。

#### 内部ステップ詳細（6ステップ）

```
Step 1 (photo):       写真撮影（表面・裏面・追加写真）
Step 2 (itemDetails):  商品情報入力（種別、名前、色、素材、依頼種別、業者選択、発送予定日等）
Step 3 (customer):     顧客紐付け（取引先経由 / 個人）※1点目のみ
Step 4 (addMore):      追加確認（同一顧客に商品追加 or 終了）
Step 5 (confirm):      確認（登録内容確認 + 備考入力）
Step 6 (complete):     完了（受付番号・預かり番号の表示）
```

### 主要コンポーネント

| ファイル | 内容 |
| -------- | ---- |
| `StepPhoto.tsx` | 写真撮影（カメラ / ファイル選択、Blob保持） |
| `StepItemDetails.tsx` | 商品情報入力（業者セレクトボックス含む） |
| `StepCustomer.tsx` | 顧客選択（取引先 / 個人、新規登録） |
| `StepAddMore.tsx` | 追加商品確認 |
| `StepConfirm.tsx` | 登録内容確認 + 備考入力 |
| `StepComplete.tsx` | 完了表示（受付番号・預かり番号） |

### 特記事項

- `StepItemDetails` に業者セレクトボックスを追加済み（`/api/vendors` から取得）
- 写真はBlobとしてクライアント側に保持し、確認ステップでの送信時にR2へアップロード
- 顧客未選択の場合は下書き（draft）として保存可能
- 下書きからの復帰: `?draft={receptionNumber}` パラメータで受付ウィザードに遷移

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
**状態:** 実装済み

### 構成

- **ヘッダー**: 縦棒装飾付きタイトル「発注管理」+ サブタイトル「業者への発送・加工依頼」
- **タブ**: 発送待ち（pending_ship）、再加工（rework）。各タブに件数表示
  - タブ状態はlocalStorageで永続化（`usePersistedState`）
  - 非アクティブタブの件数もバックグラウンドで取得
- **全選択チェックボックス**: 選択数 / 全件数を表示
- **商品リスト**: チェックボックス付き `ItemCard` コンポーネントで表示
  - 再加工タブの商品には左ボーダー（濃茜色）と「再加工」バッジを表示
  - 再加工タブでは元業者名を表示
- **下部固定アクションバー**:
  - 発送登録ボタン（再加工タブでは「再発送登録」ラベルに変更）→ `ShipToVendorModal` を起動
  - 印刷ボタン → 加工依頼書の印刷画面を新規ウィンドウで開く
  - 注文取消ボタン（pending_shipタブのみ）→ `CancelItemModal` を起動

### API

- `GET /api/items?status={pending_ship|rework}&limit=100` — 商品一覧取得

---

## 業者からの返却受入（/returns）

**ファイル:** `src/app/(worker)/returns/page.tsx`
**状態:** 実装済み

### 構成

- **ヘッダー**: 縦棒装飾付きタイトル「業者からの返却」+ サブタイトル「加工後の写真撮影・返送予定日の設定」
- **検索・フィルタ**: 業者セレクトボックス（全業者 / 個別業者）+ テキスト検索（預かり番号・顧客名）
- **商品リスト**: `processing` ステータスの商品をカード形式で一覧表示（タブなし、単一ビュー）
  - カードにはサムネイル、取引先名、顧客名、商品種別、有料預かりバッジ、預かり番号（短縮表示）、業者名を表示
  - **経過日数表示**: 業者への発送日（`ship_to_vendor_date`）からの経過日数を表示
  - **14日超過警告**: 経過日数が14日を超えた商品は濃茜色の左ボーダー + 経過日数を濃茜色で強調表示
  - 個別カードクリックで `ReturnAcceptModal` を起動（バッチ選択ではなく個別操作）
- **件数表示**: フィルタ適用後の全件数を右下に表示

### API

- `GET /api/items?status=processing&limit=100` — 加工中商品一覧取得
- `GET /api/vendors` — 業者一覧取得（フィルタ用）

---

## 顧客への返送（/shipping）

**ファイル:** `src/app/(worker)/shipping/page.tsx`
**状態:** 実装済み

### 構成

- **ヘッダー**: 縦棒装飾付きタイトル「返送管理」+ サブタイトル「顧客への返送処理」
- **タブ**: 返送待ち（pending）、キャンセル（cancelled）、返送済み（completed）
  - タブ状態はlocalStorageで永続化（`usePersistedState`）
- **全選択チェックボックス**: 返送待ちタブ・キャンセルタブで表示
- **商品リスト**: `ItemCard` コンポーネント + チェックボックスで表示

#### タブ別ステータスマッピング

| タブ | 取得するステータス |
| ---- | ------------------ |
| 返送待ち | returned, paid_storage, on_hold, awaiting_customer |
| キャンセル | cancelled |
| 返送済み | completed, cancelled_completed |

#### 返送待ちタブの特記事項

- ステータスごとにグループ表示（returned → paid_storage → on_hold → awaiting_customer の順）
- 各グループにステータスラベルと件数を表示
- `returned` ステータスの商品に「例外」ボタンを表示 → インラインモーダルで例外処理（on_hold / awaiting_customer への遷移）を実行
- 業者返却日（`return_from_vendor_date`）からの経過日数を表示
- 返送予定日超過時は濃茜色で警告表示

#### アクションバー

- **返送待ちタブ**: 「返送登録」ボタン → `ShipToCustomerModal`（targetStatus: completed）、「再加工」ボタン → 再加工モーダル（returned ステータスのみ対象）
- **キャンセルタブ**: 「返送登録」ボタン → `ShipToCustomerModal`（targetStatus: cancelled_completed）
- **返送済みタブ**: アクションバーなし。返送日・伝票番号を表示

### API

- `GET /api/items?status={ステータス}&limit={100|50}` — 商品一覧取得

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

タブ画面で `usePersistedState` フックを使用:

```typescript
import { usePersistedState, STORAGE_KEYS } from '@/hooks/usePersistedState';

const [activeTab, setActiveTab] = usePersistedState<string>(
  STORAGE_KEYS.WORKER_ORDERS_TAB,
  'pending_ship'
);
```

### ストレージキー一覧

| キー | 用途 | 使用状況 |
| ---- | ---- | -------- |
| `WORKER_DASHBOARD_PERIOD` | ダッシュボード期間フィルター | 定義のみ（未使用） |
| `WORKER_ITEMS_TAB` | 商品一覧タブ | 定義のみ（未使用） |
| `WORKER_ORDERS_TAB` | 発注管理タブ | 使用中 |
| `WORKER_SHIPPING_TAB` | 返送管理タブ | 使用中 |
| `WORKER_RETURNS_TAB` | 返却受入タブ | 定義のみ（未使用 -- 返却画面はタブなしの単一ビューに変更済み） |
| `WORKER_PAID_STORAGE_TAB` | 有料預かり管理タブ | 使用中 |
