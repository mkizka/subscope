# コンポーネント実装パターン

## 共通ルール

1. `data-slot` 属性を必ず設定する（shadcn/uiの規約）
2. `cn()` ユーティリティで className をマージする
3. `class-variance-authority (cva)` でバリアント管理する
4. `@base-ui/react` のプリミティブを使える場合は使用する
5. Props型は `React.ComponentProps<"要素">` または `PrimitiveProps & VariantProps<typeof variants>` で定義する

## Button

**ファイル**: `apps/subscope/app/components/ui/button.tsx`

- プリミティブ: `@base-ui/react/button`
- 形状: `rounded-4xl`（Full/pill）
- アニメーション: `motion-safe:active:scale-[0.97]`
- トランジション: `transition-all duration-200`

### バリアント

| variant          | スタイル                                       | 用途                 |
| ---------------- | ---------------------------------------------- | -------------------- |
| default (Filled) | `bg-primary text-primary-foreground shadow-sm` | 最も重要なアクション |
| outline          | `border-border bg-transparent`                 | 中程度の強調         |
| secondary        | `bg-secondary text-secondary-foreground`       | 補助的アクション     |
| ghost            | `hover:bg-primary/8`                           | 最低限の強調         |
| destructive      | `bg-destructive/10 text-destructive`           | 破壊的アクション     |
| link             | `text-primary underline-offset-4`              | テキストリンク       |

### サイズ

| size    | 高さ    | 用途                   |
| ------- | ------- | ---------------------- |
| default | h-10    | 標準                   |
| xs      | h-7     | 極小                   |
| sm      | h-9     | 小                     |
| lg      | h-12    | 大（重要なアクション） |
| icon    | size-10 | アイコンのみ           |
| icon-xs | size-7  | 小アイコン             |
| icon-sm | size-9  | 中アイコン             |
| icon-lg | size-12 | 大アイコン             |

### アイコン配置

`data-icon` 属性でアイコンの位置を制御:

- `has-data-[icon=inline-start]:pl-3` - アイコンが左
- `has-data-[icon=inline-end]:pr-3` - アイコンが右

## Card

**ファイル**: `apps/subscope/app/components/ui/card.tsx`

- 形状: 外側 `rounded-3xl`、内側 `rounded-t-2xl` / `rounded-b-2xl`
- ボーダー: `border border-border/40`
- 影: `shadow-sm`
- パディング: `py-6`、内部 `px-6`
- サイズバリアント: `default` / `sm`（`data-size`属性で制御）

### サブコンポーネント

- `CardHeader` - グリッドレイアウト（アクション配置対応）
- `CardTitle` - `text-lg font-semibold tracking-tight`
- `CardDescription` - `text-muted-foreground text-sm`
- `CardAction` - ヘッダー右上配置
- `CardContent` - 本体コンテンツ
- `CardFooter` - フッター

### サイズ別パディング

- default: `py-6`, `px-6`
- sm: `py-4`, `px-4`（`group-data-[size=sm]/card:` で制御）

## Badge

**ファイル**: `apps/subscope/app/components/ui/badge.tsx`

- プリミティブ: `@base-ui/react`の`useRender` + `mergeProps`
- 形状: `rounded-4xl`（pill）
- 高さ: `h-6`
- フォント: `text-xs font-semibold`
- バリアント: Button と同じ6種（default, secondary, destructive, outline, ghost, link）

## Input

**ファイル**: `apps/subscope/app/components/ui/input.tsx`

- プリミティブ: `@base-ui/react/input`
- 形状: `rounded-4xl`（pill）
- 背景: `bg-muted/50`
- ボーダー: `border-border/60`
- 高さ: `h-10`
- フォーカス: `focus-visible:border-primary focus-visible:ring-primary/40`
- トランジション: `transition-all duration-200`

## Table

**ファイル**: `apps/subscope/app/components/ui/table.tsx`

- ヘッダー背景: `bg-muted/60`
- 行ホバー: `hover:bg-primary/5`
- 選択行: `data-[state=selected]:bg-primary/8`
- トランジション: `transition-colors duration-150`
- ヘッダーテキスト: `text-muted-foreground text-xs font-semibold`

## Field

**ファイル**: `apps/subscope/app/components/ui/field.tsx`

- `cva`でorientationバリアント管理（vertical/horizontal/responsive）
- コンテナクエリ対応: `@container/field-group`, `@md/field-group`
- チェック状態のスタイリング: `has-data-checked:bg-primary/5`

### サブコンポーネント

- `FieldSet` - フィールドグループの最外部コンテナ
- `FieldLegend` - フィールドセットの凡例（legend/label variant）
- `FieldGroup` - フィールドグループ
- `Field` - 個別フィールド（orientation: vertical/horizontal/responsive）
- `FieldContent` - フィールドの入力部分
- `FieldLabel` - ラベル
- `FieldTitle` - タイトル（labelなしの場合）
- `FieldDescription` - 説明文
- `FieldSeparator` - 区切り線
- `FieldError` - エラーメッセージ

## 新しいコンポーネントを追加する際のチェックリスト

1. [ ] `data-slot` 属性を設定しているか
2. [ ] M3 Expressiveのシェイプスケールに従った角丸を使用しているか
3. [ ] `cn()` でclassNameをマージしているか
4. [ ] `@base-ui/react` に対応するプリミティブがあれば使用しているか
5. [ ] インタラクティブ要素にフォーカスリング（`focus-visible:ring-[3px]`）を設定しているか
6. [ ] ホバー・アクティブ状態のトランジションを設定しているか
7. [ ] ダークモード対応しているか（`dark:` プレフィックス）
8. [ ] アクセシビリティ属性（`aria-invalid`, `disabled`等）のスタイリングを設定しているか
9. [ ] Storybookファイルを作成しているか
