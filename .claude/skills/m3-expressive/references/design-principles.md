# M3 Expressiveデザイン原則

## Material 3 Expressiveとは

GoogleがMaterial Design 3の進化として2025年に発表したデザインシステム。46の研究調査、18,000人以上の参加者を経て開発された。フラットデザインの課題を克服し、より表現豊かで感情的なUIを実現する。

### ユーザビリティの改善

- 重要なUI要素の発見が最大**4倍高速化**
- 45歳以上のユーザーが若年層と同等のパフォーマンスを達成
- 18〜24歳の87%がExpressiveデザインを支持

## 5つの基本要素

### 1. Color（色）

- **階層的な色使い**: Primary、Secondary、Tertiaryの3つのアクセントレイヤー
- **Tonal Palette**: 各キーカラーに13のトーン（0〜100）を生成
- **Dynamic Color**: HCT（Hue, Chroma, Tone）カラーシステムに基づく
- **コンテナカラー**: 前景要素のフィル色としてContainerロールを使用

#### このプロジェクトでの適用

- oklchカラースペースを使用（HCTに近い知覚的均一性）
- Hue 270（パープル）をPrimaryに採用
- 透明度による階層表現（`/8`, `/12`, `/50`, `/85`等）

### 2. Shape（形状）

M3 Expressiveでは35種の新しい形状が追加された。

#### Corner Radius Scale

| トークン              | 値     | 用途                         |
| --------------------- | ------ | ---------------------------- |
| None                  | 0dp    | 角丸なし                     |
| Extra Small           | 4dp    | 極小要素                     |
| Small                 | 8dp    | 小さなUI要素                 |
| Medium                | 12dp   | 中程度の要素                 |
| Large                 | 16dp   | 大きめの要素                 |
| Large Increased       | 20dp   | より大きな要素               |
| Extra Large           | 28dp   | カード等の大きな要素         |
| Extra Large Increased | 32dp   | より大きなコンテナ           |
| Extra Extra Large     | 48dp   | 特大コンテナ                 |
| Full                  | 9999dp | ピル形状（ボタン、バッジ等） |

#### Shape Morphing

M3 Expressiveの特徴的な機能。要素がユーザーインタラクションに応じて動的に形状を変化させる（例: 正方形からスクイークルへ）。

#### このプロジェクトでの適用

- `rounded-4xl` = Full（ピル形状）→ Button, Badge, Input
- `rounded-3xl` = Extra Large → Card外側
- `rounded-2xl` = Large Increased → Card内側
- `rounded-xl` = Large → サブ要素

### 3. Size（サイズ）

重要な要素ほど大きく表示する。M3 Expressiveでは主要インタラクションを大きく明示的にコンテインする。

#### このプロジェクトでの適用

- ボタン高さ: h-7(xs) → h-9(sm) → h-10(default) → h-12(lg)
- バッジ高さ: h-6
- 入力フィールド高さ: h-10

### 4. Motion（モーション）

M3 Expressiveはスプリングベースのモーションシステムを採用。

#### Spring Parameters

- **Stiffness**: アニメーションの解決速度
- **Damping Ratio**: バウンスの減衰速度（1.0 = 臨界減衰、< 1.0 = バウンスあり）

#### Motion Schemes

- **Expressive**: 低ダンピング、目立つオーバーシュートとバウンス。ヒーローモーメント向け
- **Standard**: 高ダンピング、控えめなモーション。ユーティリティ向け

#### このプロジェクトでの適用

- `motion-safe:active:scale-[0.97]` - ボタン押下時のスプリング感
- `transition-all duration-200` - ボタン・入力のトランジション
- `transition-colors duration-150` - テーブル行のホバー

### 5. Containment（コンテインメント）

関連コンテンツを論理的なコンテナにグルーピングし、最重要タスクにビジュアルプロミネンスを与える。

#### このプロジェクトでの適用

- Card: `border border-border/40 shadow-sm` で視覚的な分離
- FieldSet / FieldGroup: フォーム要素のグルーピング
- Table: `bg-muted/60` ヘッダーでデータ領域を区分

## Emphasis Levels（強調レベル）

M3 Expressiveでは強調レベルが明確に定義されている:

### ボタンの強調レベル（高→低）

1. **Filled (default)** - 最高の視覚的インパクト。最終的なアクション（保存、確認等）
2. **Tonal (secondary)** - FilledとOutlinedの中間。低優先度だが目立たせたいアクション
3. **Elevated** - Tonalに影を追加。背景との視覚的分離が必要な場合
4. **Outlined** - 中程度の強調。重要だが主アクションではないもの
5. **Text/Ghost** - 最低の強調。複数選択肢を提示する場合
6. **Link** - テキストリンク

## Typography Emphasis

M3 Expressiveには15のtype styleに対してbaseline（標準）とemphasized（強調）の2セットがある:

- Emphasized: より太いフォントウェイトやサイズの微調整で目立たせる
- このプロジェクトでは`font-semibold`を強調に使用

## 注意事項

- M3 Expressiveは感情的・表現的なデザインだが、基本的なインタラクションの仕組みが崩れるとユーザビリティが低下する
- 銀行など一部のコンテキストでは適用を慎重に検討すべき
- アクセシビリティ（`motion-safe:`, `aria-invalid`, `disabled`状態等）を常に考慮する

## 参考リンク

- [Material Design 3](https://m3.material.io/)
- [Material 3 Expressive: Google's UX Research](https://design.google/library/expressive-material-design-google-research)
- [Shape - Corner Radius Scale](https://m3.material.io/styles/shape/corner-radius-scale)
- [Easing and Duration Tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)
- [Typography Type Scale Tokens](https://m3.material.io/styles/typography/type-scale-tokens)
- [Color Roles](https://m3.material.io/styles/color/roles)
- [All Buttons](https://m3.material.io/components/all-buttons)
