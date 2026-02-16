# テナント側（担当者画面）未実装箇所の実装計画

## Context

担当者画面は8ページ中、マニュアルとログインのみが完成済み。他6ページはUIシェル（タブ・スケルトン）のみで、Supabaseデータ連携・業務ロジック・写真撮影が未実装。ワーカー側APIルートも一切存在しない。本計画でこれらを段階的に実装する。

## 現状サマリー

| ページ | ルート | 現状 | 完成度 |
|--------|--------|------|--------|
| ダッシュボード | /dashboard | UIシェル、件数0固定 | 25% |
| 受付登録 | /reception | プレースホルダーのみ | 5% |
| 商品検索 | /items | 検索フォームのみ | 20% |
| 発注管理 | /orders | 2タブシェル | 30% |
| 返却受入 | /returns | 2タブシェル | 25% |
| 顧客返送 | /shipping | 3タブシェル | 30% |
| 有料預かり | /paid-storage | 2タブシェル | 25% |
| マニュアル | /manual | **実装済み** | 95% |

---

## Phase 0: 基盤API（全ページの前提）

### 作成ファイル

| ファイル | 内容 |
|---------|------|
| `src/lib/log.ts` | `logOperation()` ヘルパー関数 |
| `src/app/api/items/route.ts` | GET（ステータス・キーワードフィルタ付き一覧）+ POST（商品作成） |
| `src/app/api/items/[itemNumber]/route.ts` | GET（詳細）+ PATCH（ステータス遷移 + フィールド更新） |
| `src/app/api/customers/route.ts` | GET（検索、partner_idフィルタ対応）+ POST（新規作成） |
| `src/app/api/partners/route.ts` | GET（一覧） |
| `src/app/api/vendors/route.ts` | GET（一覧） |
| `src/app/api/settings/route.ts` | GET（テナント設定） |

---

## Phase 1: ダッシュボード + 商品検索

### 新規ファイル

| ファイル | 用途 |
|---------|------|
| `src/components/worker/ItemCard.tsx` | 共通商品カード |
| `src/components/worker/ItemDetailModal.tsx` | 商品詳細モーダル |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/app/(worker)/dashboard/page.tsx` | ステータス別件数をAPI取得、draft商品セクション追加 |
| `src/app/(worker)/items/page.tsx` | 検索API連携、結果テーブル描画 |

---

## Phase 2: 受付ウィザード（最大の機能）

### 新規API

| ファイル | 内容 |
|---------|------|
| `src/app/api/receptions/route.ts` | POST: 受付登録（商品一括作成） |
| `src/app/api/receptions/draft/route.ts` | POST: 下書き保存 |
| `src/app/api/receptions/[receptionNumber]/customer/route.ts` | PATCH: 顧客紐付け |
| `src/app/api/photos/upload/route.ts` | POST: 写真アップロード |
| `src/app/api/photos/upload-temp/route.ts` | POST: 一時写真アップロード |

### 新規コンポーネント

| ファイル | 用途 |
|---------|------|
| `src/components/reception/ReceptionWizard.tsx` | ウィザードコンテナ |
| `src/components/reception/StepPhoto.tsx` | Step 1: 写真撮影 |
| `src/components/reception/StepItemDetails.tsx` | Step 2: 商品詳細入力 |
| `src/components/reception/StepCustomer.tsx` | Step 3: 顧客選択 |
| `src/components/reception/StepAddMore.tsx` | Step 4: 追加登録確認 |
| `src/components/reception/StepConfirm.tsx` | Step 5: 確認画面 |
| `src/components/reception/StepComplete.tsx` | Step 6: 完了 |
| `src/components/reception/CameraCapture.tsx` | カメラコンポーネント |
| `src/components/reception/PartnerSelector.tsx` | 取引先検索 |
| `src/components/reception/CustomerSelector.tsx` | 顧客検索 |

---

## Phase 3〜8: 後続フェーズ

- Phase 3: 発注管理（ShipToVendorModal, CancelItemModal, orders/page.tsx）
- Phase 4: 返却受入（ReturnAcceptModal, returns/page.tsx）
- Phase 5: 顧客返送（ShipToCustomerModal, StatusChangeModal, shipping/page.tsx）
- Phase 6: 有料預かり + クレーム（paid-storage/page.tsx, Claims API + コンポーネント）
- Phase 7: 印刷ページ（加工指示書）
- Phase 8: Cron Jobs + メール通知

---

## 依存関係図

```
Phase 0 (基盤API)
  ├─→ Phase 1 (ダッシュボード + 検索)
  ├─→ Phase 2 (受付ウィザード)
  ├─→ Phase 3 (発注)       ← Phase 1のItemCard必要
  ├─→ Phase 4 (返却)       ← Phase 2のCameraCapture再利用
  ├─→ Phase 5 (返送)       ← Phase 1のItemCard必要
  ├─→ Phase 6A (有料預かり) ← Phase 1のItemCard必要
  ├─→ Phase 6B (クレーム)   ← Phase 1のItemDetailModal必要
  ├─→ Phase 7 (印刷)       ← Phase 3の後
  └─→ Phase 8 (Cron)       ← 独立
```
