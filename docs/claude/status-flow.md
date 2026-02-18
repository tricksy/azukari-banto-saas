# ステータス遷移 + 番号体系 + 操作ログ

## 番号体系

### 受付番号（Reception Number）

- 形式: `{担当者ID}-{YYYYMMDDHHmm}`
- 例: `T01-202601181430`
- 用途: 1回の受付をグルーピング（親番号）

### 預かり番号（Item Number）

- 形式: `{担当者ID}-{YYYYMMDDHHmmss}-{連番2桁}`
- 例: `T01-20260118143025-01`
- 用途: 個別商品の識別（子番号）
- 受付番号に紐付く

---

## ステータスフロー

```text
=== メインフロー ===

draft（顧客未設定）※写真・商品情報入力後、顧客選択前に自動保存される
    | 顧客情報を紐付け
    v
pending_ship（業者への発送待ち）<---+
    | 業者選択・発送日を登録        |
    v                               |
processing（加工中）<---------------+
    | 業者からの返却受入（写真撮影） |
    v                               |
returned（業者からの返却済）        |
    |                               |
    |---> 顧客への返送日を登録 ---> completed（完了）
    |                                   ^
    |---> 有料預かりに移行 -------> paid_storage（有料預かり）
    |                                   | 顧客への返送日を登録 ---> completed
    |                                   | 差し戻し ------------> returned
    |
    |---> 再加工依頼 ------------> rework（再加工）
    |                                   | 業者への再発送 -------> processing
    |
    |---> 例外処理（保留）-------> on_hold（顧客への返送保留）
    |                                   | 解除 ----------------> returned
    |                                   | 業者への再発送 -------> processing
    |
    +---> 例外処理（顧客確認）---> awaiting_customer（顧客確認待ち）
                                        | 確認済み（差し戻し）--> returned
                                        | 確認済み（完了）-----> completed

=== received（受付済）===
※ 発送予定日が未設定の場合のみ使用。通常は pending_ship で登録されるため使用しない。

received（受付済） → pending_ship
pending_ship → received（差し戻し）も可能

=== キャンセルフロー ===

draft -------> cancelled（キャンセル）
received ----> cancelled
pending_ship -> cancelled
                    | キャンセル品の顧客返送
                    v
                cancelled_completed（キャンセル完了）

=== 例外フロー ===

processing ---> on_hold（加工中からの保留）

=== 最終状態（遷移不可）===

completed, cancelled_completed
```

---

## ステータス一覧

| ステータス | コード | 説明 |
| ---------- | ------ | ---- |
| 顧客未設定 | draft | 下書き状態（顧客未設定） |
| 受付済 | received | 商品を受け付けた初期状態（発送予定日未設定時のみ、通常は使用しない） |
| 業者への発送待ち | pending_ship | 発送予定日を登録済み、業者への発送待ち |
| 加工中 | processing | 加工先へ発送済み |
| 業者からの返却済 | returned | 加工完了、業者から戻り、顧客への返送待ち |
| 有料預かり | paid_storage | 長期保管が必要な商品、手動で有料預かりに移行 |
| 完了 | completed | 顧客への返送完了 |
| 再加工 | rework | 加工品質不良等で再度加工が必要な状態 |
| 顧客への返送保留 | on_hold | 何らかの理由で処理を一時停止している状態 |
| 顧客確認待ち | awaiting_customer | 顧客からの回答・確認待ちの状態 |
| キャンセル | cancelled | 受付取消 |
| キャンセル完了 | cancelled_completed | キャンセル商品を顧客に返送済み |

---

## クレーム対応フラグ（isClaimActive）

クレームは独立したステータスではなく、`is_claim_active` フラグで管理。これにより、どのステータスでもクレーム対応中として追跡可能。

- **is_claim_active: true** → 商品にアクティブなクレームが存在
- クレーム登録時に自動的にON
- クレーム解決/クローズ時に自動的にOFF
- ステータス遷移とは独立して管理

### isClaimActive更新時のバリデーション

| 操作 | 条件 | 結果 |
| ---- | ---- | ---- |
| OFF → ON | - | メモ入力必須（新規クレーム自動作成） |
| ON → OFF | オープンなクレームあり | **API拒否**（400エラー） |
| ON → OFF | オープンなクレームなし | 正常更新 |

**OFFにする際の処理フロー:**

1. フロントエンドで解決理由を入力
2. 全オープンクレームを解決理由付きでクローズ
3. その後、is_claim_active=false で更新

**API保護:**
```json
{
  "error": "オープンなクレームが存在します。先にクレームを解決してください。"
}
```
（HTTP 400）

---

## ステータス遷移と操作ログ

| ステータス遷移 | アクション名 | 操作画面 |
| -------------- | ------------ | -------- |
| received → pending_ship | 発送予定登録 | /orders（受付済タブ）※通常は使用しない |
| pending_ship → processing | 業者への発送 | /orders（業者への発送待ちタブ） |
| pending_ship → cancelled | キャンセル | /orders（キャンセルモーダル） |
| processing → returned | 業者からの返却受入 | /returns |
| returned → completed | 顧客への返送 | /shipping |
| returned → paid_storage | 有料預かり移行 | /paid-storage（手動） |
| returned → rework | 再加工依頼 | /shipping（再加工モーダル） |
| returned → on_hold | 例外処理（保留） | /shipping（例外モーダル） |
| returned → awaiting_customer | 例外処理（顧客確認待ち） | /shipping（例外モーダル） |
| paid_storage → completed | 顧客への返送 | /shipping |
| rework → processing | 業者への再発送 | /orders（再加工タブ） |
| cancelled → cancelled_completed | キャンセル品の顧客返送 | /shipping |

---

## ステータス遷移バリデーション

APIレベルでステータス遷移を検証し、不正な遷移を防止する。

**実装箇所:**

- 型定義: `src/types/index.ts`（`ALLOWED_STATUS_TRANSITIONS`、`isStatusTransitionAllowed()`）
- API: `src/app/api/items/[itemNumber]/route.ts`（PATCHハンドラ）※TODO

### 許可される遷移マップ

| 現在のステータス | 遷移可能なステータス |
| ---------------- | ------------------- |
| draft | pending_ship, cancelled |
| received | pending_ship, cancelled |
| pending_ship | processing, received, cancelled |
| processing | returned, on_hold |
| returned | completed, paid_storage, rework, on_hold, awaiting_customer |
| paid_storage | completed, returned |
| completed | （なし - 最終状態） |
| rework | processing |
| on_hold | returned, processing |
| awaiting_customer | returned, completed |
| cancelled | cancelled_completed（キャンセル品の顧客返送） |
| cancelled_completed | （なし - 最終状態） |

※ クレーム対応は `is_claim_active` フラグで管理（ステータスとは独立）

**エラー時のレスポンス:**
```json
{
  "error": "「受付済」から「加工中」への遷移は許可されていません。遷移可能なステータス: 業者への発送待ち、キャンセル"
}
```
（HTTP 400）

---

## 操作ログ

業務操作は自動的に `operation_logs` テーブルに記録される。

### ログ記録対象

| 操作 | アクション名 | targetType |
| ---- | ------------ | ---------- |
| PINログイン | ログイン | auth |
| 自動ログイン | 自動ログイン | auth |
| 受付登録 | 受付登録 | reception |
| 業者への発送 | 業者への発送 | item |
| 業者からの返却受入 | 業者からの返却受入 | item |
| 顧客への返送 | 顧客への返送 | item |
| 有料預かり移行 | 有料預かり移行 | item |
| 再加工依頼 | 再加工 | item |
| 例外処理（保留/顧客確認待ち） | 例外処理 | item |
| キャンセル | キャンセル | item |
| その他の商品更新 | 商品更新 | item |

**ログイン履歴の詳細:**

- details欄にIPアドレスを記録: `IP: xxx.xxx.xxx.xxx`

---

## エラーログ

処理中断・エラー発生時は自動的にエラーログが記録される。

### エラー種別（action）

| action | 日本語 | 説明 |
| ------ | ------ | ---- |
| error | エラー | 処理中止（致命的エラー） |
| partial_failure | 部分失敗 | 一部のみ失敗 |
| warning | 警告 | 処理は継続 |

### システム系ターゲットタイプ

| targetType | 説明 |
| ---------- | ---- |
| system | Cron Job、バッチ処理 |
| email | メール送信処理 |
| auth | 認証処理 |

---

## ログの記録方法

```typescript
import { createServiceClient } from '@/lib/supabase/server';

const supabase = createServiceClient();

// 通常のログ
await supabase.from('operation_logs').insert({
  tenant_id: session.tenantId,
  worker_id: session.workerId,
  worker_name: session.name,
  action: '受付登録',
  target_type: 'reception',
  target_id: receptionNumber,
  details: `${customerName} 様 / ${itemCount}点`,
});
```

### operation_logsテーブルの構造

```
id | tenant_id | worker_id | worker_name | action | target_type | target_id | details | is_archived | created_at
```
