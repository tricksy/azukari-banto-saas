# 侘寂（Wabi-Sabi）デザインシステム

預かり番頭β SaaS の UI デザインシステム。日本の伝統美を基調とした和モダンデザイン。
KURATSUGI（単体版）と同一のデザインシステムを使用。

---

## 1. Design Principles（設計原則）

### 三つの美学

| 原則 | 説明 | 実装 |
|------|------|------|
| **間（Ma）** | 余白による呼吸と静寂 | 適切な padding/margin、視覚的余裕 |
| **渋（Shibui）** | 控えめで深みのある美 | 彩度を抑えた伝統色、過剰な装飾の排除 |
| **直線美** | 日本の建築美 | `border-radius: 0`（角丸なし） |

### デザイン方針

- **シンプル**: 必要最小限の要素で構成
- **静謐**: 派手な色や動きを避け、落ち着いた印象
- **機能的**: 見た目より使いやすさを優先
- **一貫性**: 全画面で統一されたデザイン言語

---

## 2. Color Palette（カラーパレット）

### メインカラー

| 色名 | CSS変数 | カラーコード | 用途 |
|------|---------|--------------|------|
| 墨（Sumi） | `--sumi` | `#1A1A1A` | メインテキスト |
| 墨（明） | `--sumi-light` | `#333333` | セカンダリテキスト |
| 胡粉（Gofun） | `--gofun` | `#F8F7F3` | ページ背景 |
| 生成（Kinari） | `--kinari` | `#FBFAF5` | カード背景 |
| 白練（Shironeri） | `--shironeri` | `#F3F3F2` | 入力フィールド背景 |
| 藍鉄（Aitetsu） | `--aitetsu` | `#2F3A46` | サブテキスト、ラベル |
| 銀鼠（Ginnezumi） | `--ginnezumi` | `#91989F` | 無効状態、プレースホルダー |
| 薄墨（Usuzumi） | `--usuzumi` | `#A3A3A2` | ボーダー、区切り線 |

### アクセントカラー（朱系）

| 色名 | CSS変数 | カラーコード | 用途 |
|------|---------|--------------|------|
| 朱（Shu） | `--shu` | `#8B2332` | プライマリ、ボタン、リンク |
| 朱（明） | `--shu-light` | `#A52A3A` | ホバー状態 |
| 朱（暗） | `--shu-dark` | `#6B1A26` | アクティブ状態 |
| 朱（薄） | `--shu-muted` | `rgba(139,35,50,0.1)` | 背景色 |
| 金（Kin） | `--kin` | `#C9A84C` | 特別なアクセント |

### セマンティックカラー

| 意味 | 色名 | CSS変数 | カラーコード |
|------|------|---------|--------------|
| 成功 | 老竹色（Oitake） | `--oitake` | `#5A6650` |
| 警告 | 黄土（Oudo） | `--oudo` | `#B68D40` |
| エラー | 深緋（Kokiake） | `--kokiake` | `#7B2D26` |
| 情報 | 藍鉄（Aitetsu） | `--aitetsu` | `#2F3A46` |

### Tailwindでの使用

```tsx
// 背景色
<div className="bg-gofun" />      // ページ背景
<div className="bg-kinari" />     // カード背景
<div className="bg-shu" />        // プライマリ

// テキスト色
<p className="text-sumi" />       // メインテキスト
<p className="text-aitetsu" />    // サブテキスト
<p className="text-ginnezumi" />  // 無効テキスト
<p className="text-shu" />        // アクセント

// ボーダー
<div className="border-usuzumi/20" />  // 薄いボーダー
<div className="border-shu/30" />      // 朱色ボーダー
```

---

## 3. Typography（タイポグラフィ）

### フォントファミリー

| 用途 | フォント | CSS変数 | クラス |
|------|----------|---------|--------|
| 見出し | Shippori Mincho | `--font-mincho` | `.font-mincho` |
| 本文 | Noto Sans JP | `--font-sans` | `.font-sans` |
| 数字・コード | Inter | `--font-mono` | `.font-mono` |

### フォントサイズスケール

| サイズ | CSS変数 | ピクセル | 用途 |
|--------|---------|----------|------|
| xs | `--text-xs` | 10px | 注釈、ラベル小 |
| sm | `--text-sm` | 12px | バッジ、補助テキスト |
| base | `--text-base` | 14px | 本文 |
| lg | `--text-lg` | 16px | 小見出し |
| xl | `--text-xl` | 18px | 中見出し |
| 2xl | `--text-2xl` | 24px | 大見出し |
| 3xl | `--text-3xl` | 30px | ページタイトル |

---

## 4. Components（コンポーネント）

### 4.1 共通UIコンポーネント（src/components/ui/）

| コンポーネント | ファイル | 用途 |
|---------------|---------|------|
| Badge | `Badge.tsx` | ステータス・セマンティックバッジ |
| Breadcrumb | `Breadcrumb.tsx` | パンくずリスト |
| Button | `Button.tsx` | ボタン（Primary/Secondary/Outline/Ghost/Danger） |
| Card | `Card.tsx` | カードレイアウト |
| ErrorMessage | `ErrorMessage.tsx` | エラーメッセージ表示 |
| Input | `Input.tsx` | テキスト入力 |
| Modal | `Modal.tsx` | モーダルダイアログ |
| Pagination | `Pagination.tsx` | ページネーション |
| Select | `Select.tsx` | セレクトボックス |
| Skeleton | `Skeleton.tsx` | ローディングスケルトン |
| Toast | `Toast.tsx` | トースト通知 |
| Toggle | `Toggle.tsx` | トグルスイッチ |

### 4.2 Buttons（ボタン）

#### バリエーション

| クラス | 用途 | スタイル |
|--------|------|----------|
| `.btn-primary` | メインアクション | 朱色背景、白文字 |
| `.btn-secondary` | 副次アクション | 胡粉背景、墨文字、グレーボーダー |
| `.btn-outline` | 控えめなアクション | 透明背景、朱色文字・ボーダー |
| `.btn-ghost` | 最も控えめ | 透明背景、藍鉄文字 |
| `.btn-danger` | 削除・危険な操作 | 深緋背景、白文字 |

#### サイズ

| クラス | パディング |
|--------|------------|
| `.btn-xs` | 4px 8px |
| `.btn-sm` | 6px 12px |
| （default） | 12px 20px |
| `.btn-lg` | 16px 28px |

### 4.3 Form Elements（フォーム）

硯（すずり）スタイル: 下線を強調したデザイン

```tsx
<label className="form-label form-label-required">顧客名</label>
<input type="text" className="form-input" placeholder="山田太郎" />
<p className="form-help">全角で入力してください</p>

// エラー状態
<input type="text" className="form-input form-input-error" />
<p className="form-error">必須項目です</p>
```

### 4.4 Cards（カード）

襖（ふすま）スタイル: シンプルで清潔感のあるデザイン

```tsx
<div className="card">
  <div className="card-header"><h2>タイトル</h2></div>
  <div className="card-body">コンテンツ</div>
  <div className="card-footer">フッター</div>
</div>
```

バリエーション: `card-bordered`, `card-elevated`, `card-flat`, `card-interactive`

### 4.5 Badges（バッジ）

落款（らっかん）スタイル: 角丸なしの印章風デザイン

#### ステータスバッジ

```tsx
<span className="badge badge-received">受付済</span>
<span className="badge badge-pending_ship">発送待ち</span>
<span className="badge badge-processing">加工中</span>
<span className="badge badge-returned">返却済</span>
<span className="badge badge-completed">完了</span>
<span className="badge badge-cancelled">キャンセル</span>
<span className="badge badge-rework">再加工</span>
<span className="badge badge-paid_storage">有料預かり</span>
```

### 4.6 Tables（テーブル）

巻物（まきもの）スタイル: 和紙のような質感

```tsx
<div className="table-responsive">
  <table className="data-table">...</table>
</div>
```

モバイル: 最初のカラムが sticky 固定

---

## 5. Animations（アニメーション）

| クラス | 効果 | 用途 |
|--------|------|------|
| `.animate-kiri-fade` | 霧のようなフェードイン | ページ遷移、モーダル |
| `.animate-fusuma-in` | 襖のスライドイン | サイドパネル |
| `.animate-fade-in` | シンプルなフェード | 汎用 |
| `.animate-slide-up` | 下からスライド | トースト、通知 |
| `.animate-pulse` | 点滅 | ローディング、スケルトン |

---

## 6. Responsive Design

### ブレークポイント

| 名前 | 幅 | Tailwindプレフィックス |
|------|-----|------------------------|
| Mobile | < 640px | (default) |
| Tablet | >= 640px | `sm:` |
| Desktop | >= 768px | `md:` |
| Large | >= 1024px | `lg:` |

### テーブル/カード切り替え

```tsx
<div className="admin-table-desktop">
  <table>...</table>
</div>
<div className="admin-card-list">
  <div className="card">...</div>
</div>
```

---

## 7. UI共通ルール

### 預かり番号の表示

- 短縮表示: `{担当者ID}-{末尾9文字}`（例: `T01-143025-01`）
- フォント: `font-mono text-xs text-ginnezumi`

### 日付入力

- 発送日・返却日・返送日は**過去〜今日**のみ選択可
- `max`属性で未来日付を制限

### ラベル変換

- ステータス: `ItemStatusLabel`（`src/types/index.ts`）
- 商品種別: `ProductTypeLabel`
- 加工種別: `ProcessingTypeLabel`

---

## 8. File Locations

| ファイル | 内容 |
|----------|------|
| `src/app/globals.css` | CSS変数、コンポーネントクラス、Tailwind v4 テーマ拡張 |
| `src/components/ui/*.tsx` | 共通UIコンポーネント（12種） |
| `src/hooks/useFocusTrap.ts` | フォーカストラップフック |
