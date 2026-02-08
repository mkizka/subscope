---
name: m3-expressive
description: Material 3 Expressiveデザインシステムに基づくUIコンポーネントの実装ガイド。新しいUIコンポーネントを追加・修正する際に参照する。
---

## 概要

このプロジェクトのUIコンポーネント（`apps/subscope/app/components/ui/`）はMaterial 3 Expressiveデザインに基づいて実装されている。新しいコンポーネントを追加する際は、このガイドに従って一貫したデザインを維持すること。

## M3 Expressiveの5つの基本要素

1. **Color** - 鮮やかで階層的な色使い
2. **Shape** - 大きな角丸とピル形状
3. **Size** - 重要な要素を大きく表示
4. **Motion** - スプリングベースの自然なアニメーション
5. **Containment** - 関連コンテンツの論理的なグルーピング

## 技術スタック

- **Tailwind CSS v4** - ユーティリティクラス（`@theme inline`でカスタムプロパティを定義）
- **shadcn/ui** - コンポーネントの基盤（`shadcn/tailwind.css`をインポート）
- **@base-ui/react** - ヘッドレスUIプリミティブ（Button, Input, Separator等）
- **class-variance-authority (cva)** - バリアント管理
- **oklch** - カラースペース

## Shape（角丸）

このプロジェクトでは以下のTailwind角丸クラスをM3 Expressiveのシェイプスケールにマッピングしている:

| M3 Shape Scale | Tailwindクラス | 用途                                          |
| -------------- | -------------- | --------------------------------------------- |
| Full (pill)    | `rounded-4xl`  | Button, Badge, Input（インタラクティブ要素）  |
| Extra Large    | `rounded-3xl`  | Card外側                                      |
| Large          | `rounded-2xl`  | Card内側（画像、ヘッダー、フッター）          |
| Medium         | `rounded-xl`   | ネストされたサブ要素（FieldLabel内のField等） |
| Small          | `rounded-lg`   | 小さなUI要素                                  |

**重要**: M3 Expressiveではインタラクティブ要素（ボタン、入力フィールド、バッジ）にFull（ピル）形状を使用する。これはフラットデザインからの脱却を意味する。

## Color

### カラーロール

oklchカラースペースを使用。プライマリのhueは**270**（パープル/インディゴ）。

| ロール             | Light                    | Dark                    | 用途                             |
| ------------------ | ------------------------ | ----------------------- | -------------------------------- |
| primary            | `oklch(0.49 0.205 270)`  | `oklch(0.735 0.12 270)` | メインアクション、アクティブ状態 |
| primary-foreground | `oklch(0.98 0.005 270)`  | `oklch(0.2 0.04 270)`   | primary上のテキスト              |
| secondary          | `oklch(0.935 0.02 270)`  | `oklch(0.28 0.03 270)`  | 低強調コンポーネント             |
| muted              | `oklch(0.95 0.01 270)`   | `oklch(0.235 0.02 270)` | 背景、非アクティブ要素           |
| destructive        | `oklch(0.58 0.24 25)`    | `oklch(0.7 0.19 22)`    | エラー、削除アクション           |
| background         | `oklch(0.985 0.004 270)` | `oklch(0.155 0.02 270)` | ページ背景                       |
| card               | `oklch(0.995 0.002 270)` | `oklch(0.2 0.025 270)`  | カード背景                       |
| border             | `oklch(0.91 0.01 270)`   | `oklch(1 0 0 / 12%)`    | ボーダー                         |

### 透明度パターン

M3 Expressiveでは色の透明度を使って階層を表現する:

- `bg-primary/8` - ゴースト/アウトラインのホバー状態
- `bg-primary/12` - ダークモードでのゴーストホバー
- `bg-primary/85` - Filledボタンのホバー
- `bg-primary/5` - テーブル行のホバー
- `bg-destructive/10` - destructiveの背景（ライト）
- `bg-destructive/20` - destructiveの背景（ダーク）
- `border-border/40` - カードの薄いボーダー
- `bg-muted/50` - 入力フィールドの背景
- `bg-muted/60` - テーブルヘッダー

## Typography

フォント: **Noto Sans JP Variable**（`@fontsource-variable/noto-sans-jp`）

| 用途                       | クラス                                        |
| -------------------------- | --------------------------------------------- |
| カードタイトル             | `text-lg font-semibold tracking-tight`        |
| ラベル・フィールドタイトル | `text-sm font-semibold`                       |
| 説明文                     | `text-muted-foreground text-sm`               |
| テーブルヘッダー           | `text-muted-foreground text-xs font-semibold` |
| 本文                       | `text-sm`（デフォルト）                       |

## Motion

### アクティブプレス

```
motion-safe:active:scale-[0.97]
```

ボタン等のインタラクティブ要素にスプリングベースの押下感を与える。`motion-safe:`プレフィックスでモーション低減設定を尊重する。

### トランジション

| 要素         | クラス                           |
| ------------ | -------------------------------- |
| ボタン・入力 | `transition-all duration-200`    |
| テーブル行   | `transition-colors duration-150` |

## Elevation（影）

M3 Expressiveではフラットなデザインを基本とし、影は控えめに使用:

- `shadow-sm` - カード、Filledボタン
- `hover:shadow-md` - Filledボタンのホバー時

## Focus・バリデーション

すべてのインタラクティブ要素に共通:

```
focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40
aria-invalid:border-destructive dark:aria-invalid:border-destructive/50
```

## 詳細ガイド

- **コンポーネント実装パターン**: [references/components.md](references/components.md)を参照
- **M3 Expressiveデザイン原則**: [references/design-principles.md](references/design-principles.md)を参照
