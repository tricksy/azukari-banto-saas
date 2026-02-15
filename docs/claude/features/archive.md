# アーカイブ機能

**状態:** TODO（未実装）

古い完了/キャンセル済みデータを自動的にアーカイブし、パフォーマンスを維持する機能。

## 概要

- **目的**: 完了・キャンセル済みデータの蓄積によるパフォーマンス低下を防止
- **対象**: items（商品）とoperation_logs（操作ログ）
- **実行**: Vercel Cron Jobs（毎週日曜0:10 UTC = 9:10 JST）
- **動作**: `is_archived` フラグを `true` に設定（データは削除しない）

---

## アーカイブ条件

### 商品（items）

- `completed`（完了）かつ `return_to_customer_date` からアーカイブ期間経過
- または `cancelled`（キャンセル）かつ `updated_at` からアーカイブ期間経過
- かつ `is_claim_active` が `true` でない（クレーム対応中はアーカイブしない）

### ログ（operation_logs）

- `created_at` からアーカイブ期間経過

---

## テナント設定

| 設定キー | デフォルト | 説明 |
| -------- | ---------- | ---- |
| archiveEnabled | true | アーカイブ機能の有効/無効 |
| autoArchiveDays | 365 | 商品アーカイブ期間（日） |

---

## 画面での表示

アーカイブ済みデータはデフォルトで非表示。「アーカイブ含む」チェックボックスで表示可能。

| 画面 | パス | 対応 |
| ---- | ---- | ---- |
| 管理者商品一覧 | `/admin/items` | 「アーカイブ含む」チェックボックス |
| 操作ログ一覧 | `/admin/logs` | 「アーカイブ含む」チェックボックス |

---

## APIパラメータ

| エンドポイント | パラメータ | 説明 |
| -------------- | ---------- | ---- |
| GET /api/items | `includeArchived=true` | アーカイブ済み商品を含める |
| GET /api/admin/logs | `includeArchived=true` | アーカイブ済みログを含める |

---

## テナント別処理

SaaS版ではCron Jobが全テナントを対象に処理する:

```text
1. 全アクティブテナントを取得
2. 各テナントの設定を確認（archiveEnabled = true のみ）
3. テナント別にアーカイブ対象を抽出
4. is_archived = true に更新
```

---

## Cron Job

**エンドポイント:** `GET /api/cron/archive-items`

**vercel.json設定:**
```json
{
  "crons": [
    {
      "path": "/api/cron/archive-items",
      "schedule": "10 0 * * 0"
    }
  ]
}
```

**レスポンス例:**
```json
{
  "success": true,
  "results": [
    {
      "tenantId": "uuid-1",
      "tenantName": "デモ着物店",
      "itemsArchived": 5,
      "logsArchived": 120
    }
  ]
}
```

---

## データベーステーブル

### items テーブル（関連カラム）

| カラム | 型 | 説明 |
| ------ | -- | ---- |
| is_archived | BOOLEAN | アーカイブ済みフラグ（デフォルト: false） |

### operation_logs テーブル（関連カラム）

| カラム | 型 | 説明 |
| ------ | -- | ---- |
| is_archived | BOOLEAN | アーカイブ済みフラグ（デフォルト: false） |

---

## API

| エンドポイント | メソッド | 説明 | 状態 |
| -------------- | -------- | ---- | ---- |
| /api/cron/archive-items | GET | アーカイブ定期実行 | TODO |

---

## TODO

- [ ] Cron Job実装（テナント別処理）
- [ ] アーカイブ対象クエリ（items + operation_logs）
- [ ] APIの`includeArchived`パラメータ対応
- [ ] 管理画面の「アーカイブ含む」チェックボックス実装
