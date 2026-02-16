# 担当者画面 実装進捗チェックリスト

最終更新: 2026-02-17

---

## Phase 0: 基盤API ✅ 完了

- [x] `src/lib/log.ts` — logOperation ヘルパー関数
- [x] `src/app/api/items/route.ts` — GET (一覧) + POST (作成)
- [x] `src/app/api/items/[itemNumber]/route.ts` — GET (詳細) + PATCH (ステータス遷移)
- [x] `src/app/api/customers/route.ts` — GET (検索) + POST (作成)
- [x] `src/app/api/partners/route.ts` — GET (一覧)
- [x] `src/app/api/vendors/route.ts` — GET (一覧)
- [x] `src/app/api/settings/route.ts` — GET (テナント設定)
- [x] `yarn typecheck` 通過

## Phase 1: ダッシュボード + 商品検索 ✅ 完了

- [x] `src/components/worker/ItemCard.tsx` — 共通商品カード
- [x] `src/components/worker/ItemDetailModal.tsx` — 商品詳細モーダル
- [x] `src/app/(worker)/dashboard/page.tsx` — API連携、ステータス件数、draft商品
- [x] `src/app/(worker)/items/page.tsx` — 検索API連携、結果表示、ページネーション
- [x] `yarn typecheck` 通過

## Phase 2: 受付ウィザード ✅ 完了

- [x] `src/app/api/receptions/route.ts` — POST (受付登録)
- [x] `src/app/api/receptions/draft/route.ts` — POST (下書き保存)
- [x] `src/app/api/receptions/[receptionNumber]/customer/route.ts` — PATCH (顧客紐付け)
- [x] `src/app/api/photos/upload/route.ts` — POST (写真アップロード)
- [x] `src/app/api/photos/upload-temp/route.ts` — POST (一時写真アップロード)
- [x] `src/components/reception/ReceptionWizard.tsx` — ウィザードコンテナ
- [x] `src/components/reception/StepPhoto.tsx` — 写真撮影ステップ
- [x] `src/components/reception/StepItemDetails.tsx` — 商品詳細入力
- [x] `src/components/reception/StepCustomer.tsx` — 顧客選択
- [x] `src/components/reception/StepAddMore.tsx` — 追加登録確認
- [x] `src/components/reception/StepConfirm.tsx` — 確認画面
- [x] `src/components/reception/StepComplete.tsx` — 完了画面
- [x] `src/components/reception/CameraCapture.tsx` — カメラコンポーネント
- [x] `src/components/reception/PartnerSelector.tsx` — 取引先検索
- [x] `src/components/reception/CustomerSelector.tsx` — 顧客検索
- [x] `src/app/(worker)/reception/page.tsx` — ウィザード差し替え
- [ ] Supabase Storage バケット設定（デプロイ時に実施）
- [x] `yarn typecheck` 通過

## Phase 3: 発注管理 ✅ 完了

- [x] `src/components/worker/ShipToVendorModal.tsx` — 業者発送モーダル
- [x] `src/components/worker/CancelItemModal.tsx` — キャンセルモーダル
- [x] `src/app/(worker)/orders/page.tsx` — 全面実装
- [x] `yarn typecheck` 通過

## Phase 4: 返却受入 ✅ 完了

- [x] `src/components/worker/ReturnAcceptModal.tsx` — 返却受入モーダル
- [x] `src/app/(worker)/returns/page.tsx` — 全面実装
- [x] `yarn typecheck` 通過

## Phase 5: 顧客返送 ✅ 完了

- [x] `src/components/worker/ShipToCustomerModal.tsx` — 顧客返送モーダル
- [x] `src/components/worker/StatusChangeModal.tsx` — 汎用ステータス変更モーダル
- [x] `src/app/(worker)/shipping/page.tsx` — 全面実装
- [x] `yarn typecheck` 通過

## Phase 6: 有料預かり + クレーム ✅ 完了

### 6A: 有料預かり
- [x] `src/app/(worker)/paid-storage/page.tsx` — 全面実装

### 6B: クレーム
- [x] `src/app/api/claims/route.ts` — GET + POST
- [x] `src/app/api/claims/[claimId]/route.ts` — GET + PATCH
- [x] `src/app/api/claims/[claimId]/logs/route.ts` — GET + POST
- [x] `src/components/worker/ClaimSection.tsx`
- [x] `src/components/worker/NewClaimModal.tsx`
- [x] `src/components/worker/ClaimDetailModal.tsx`
- [x] `yarn typecheck` 通過

## Phase 7: 印刷ページ ✅ 完了

- [x] `src/app/(worker)/print/layout.tsx` — 印刷用レイアウト
- [x] `src/app/(worker)/print/processing-order/[receptionNumber]/page.tsx` — 加工指示書
- [x] `src/app/(worker)/print/processing-order/[receptionNumber]/PrintActions.tsx` — 印刷アクション
- [x] `yarn typecheck` 通過

## Phase 8: Cron Jobs + メール通知 ✅ 完了

- [x] `src/app/api/cron/alerts/route.ts` — 日次アラートメール
- [x] `src/app/api/cron/archive-items/route.ts` — 週次アーカイブ
- [x] `src/lib/email.ts` — メール送信ユーティリティ（Resend）
- [x] `vercel.json` — Cronスケジュール設定
- [ ] メールサービス設定（デプロイ時にRESEND_API_KEY設定）
- [x] `yarn typecheck` 通過
