# 担当者画面をKURATSUGI（単体版）と完全統一

## Context

ユーザーから「担当者の処理はSaaS版じゃない方と全く同じにしてほしい」という指示。
受付・発注・返却・返送の4処理画面 + ダッシュボードのUI/UX/機能をKURATSUGIに合わせる。
SaaS固有のアーキテクチャ（R2、マルチテナント、コンポーネント分割、バッチ操作）は維持する。

## 変更しないもの（SaaSアーキテクチャ固有）

- Blob + R2アップロード（KURATSUGIはbase64）
- マルチテナント構造
- コンポーネント分割（ReceptionWizard → Step*.tsx）
- バッチ操作（複数商品同時処理）
- BottomNav（SaaS版のみ）
- `@/lib/auth` のセッション管理

---

## Track A: ダッシュボード強化

**対象ファイル:** `src/app/(worker)/dashboard/page.tsx`

### A1. 統計カードにリンク追加 + 動的色
- Linkコンポーネントでラップ + 動的色（超過時にkokiake）

### A2. 期限超過セクション追加
- SVGアイコン付きヘッダー、サムネイル + 超過日数、5件まで表示

### A3. クレーム対応中セクション追加
- アイコン付きヘッダー、サムネイル2枚 + 顧客名 + 種別

### A4. 今週のスケジュールテーブル追加
- 業者への発送予定 / 顧客への返送予定テーブル

### A5. 顧客未設定セクション強化
- bg-oudo/5背景、受付番号グループ化、サムネイル表示

---

## Track B: 発注管理 + 業者へ発送モーダル

**対象ファイル:** `orders/page.tsx`, `ShipToVendorModal.tsx`

### B1. 発注管理画面
- 説明テキスト、チェックボックス全選択、タブ別ボタンラベル、印刷ボタン、再加工マーク

### B2. 業者へ発送モーダル
- activeTab prop、タイトル分岐、説明文、再発送注記、送り状セクション区切り

---

## Track C: 返却受入 + 返却受入モーダル

**対象ファイル:** `returns/page.tsx`, `ReturnAcceptModal.tsx`

### C1. 返却受入画面
- 説明テキスト、業者フィルタ + テキスト検索、経過日数表示、件数表示

### C2. 返却受入モーダル
- タイトル・ラベル変更、max制約、色変更、有料預かり対応、備考削除

---

## Track D: 返送 + 返送モーダル

**対象ファイル:** `shipping/page.tsx`, `ShipToCustomerModal.tsx`

### D1. 返送画面
- 説明テキスト、チェックボックス全選択、返送登録(N)ボタン、例外・再加工ボタン、経過日数

### D2. 返送モーダル
- タイトル分岐、有料預かり背景色、ボタンラベル

---

## Track E: 受付ウィザード

**対象ファイル:** `StepPhoto.tsx`, `StepItemDetails.tsx`, `StepAddMore.tsx`, `StepConfirm.tsx`, `StepComplete.tsx`, `ReceptionWizard.tsx`

### E1-E6. 各ステップのUI/ラベル統一
- 詳細は元計画ファイル参照
