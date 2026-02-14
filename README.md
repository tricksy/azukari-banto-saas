# 預かり番頭 SaaS（azukari-banto-saas）

着物・帯の預かり品管理をクラウドで提供するマルチテナントSaaS。

## 概要

着物店・呉服店向けに、取引先や個人から預かった着物・帯の写真撮影、ステータス管理、返却期日のアラートを一元管理するクラウドサービス。各店舗がサブドメイン（`店舗名.kuratsugi.app`）でアクセスし、データは完全に分離されます。

## 主な機能

- 預かり品の受付・登録（ウィザード形式）
- ステータス管理（受付 → 発送 → 加工 → 返却 → 完了）
- 商品写真の撮影・管理
- 返却期日アラートの自動送信
- 発注書の作成・印刷
- 有料預かり・クレーム管理
- プラットフォーム管理（テナント管理・課金管理）

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フレームワーク | Next.js (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| DB | Supabase (PostgreSQL + RLS) |
| ストレージ | Supabase Storage |
| 認証 | Supabase Auth |
| メール | Resend |
| ホスティング | Vercel |
| 定期実行 | Vercel Cron Jobs |

## マルチテナント設計

- サブドメイン方式でテナント識別
- PostgreSQL Row Level Security (RLS) でデータ分離
- 全業務テーブルに `tenant_id` カラム

## セットアップ

```bash
yarn install
yarn dev
```

http://localhost:3001 でアクセスできます（既存KURATSUGIは3000番ポート）。

## 関連リポジトリ

- [KURATSUGI](https://github.com/Shibamago/KURATSUGI) - 単店舗版（オリジナル）

## ライセンス

Private
