---
version: alpha
name: Subscope
description: 木苺の赤をアクセントにした、線で区切る丸ゴシックのBluesky互換クライアント
colors:
  surface: "color-mix(in srgb, #b8326b 7%, #fff)"
  surface-2: "color-mix(in srgb, #b8326b 13%, #fff)"
  line: "color-mix(in srgb, #b8326b 22%, #fff)"
  ink: "#17191c"
  muted: "color-mix(in srgb, #17191c 62%, transparent)"
  brand: "#b8326b"
  on-brand: "#ffffff"
  brand-soft: "color-mix(in srgb, #b8326b 12%, transparent)"
  danger: "#c62828"
typography:
  title:
    fontFamily: Zen Maru Gothic
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.4
  heading:
    fontFamily: Zen Maru Gothic
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.4
  body-lg:
    fontFamily: Zen Maru Gothic
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: Zen Maru Gothic
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: Zen Maru Gothic
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
  caption:
    fontFamily: Zen Maru Gothic
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
rounded:
  xl: 12px
  full: 9999px
spacing:
  "1": 4px
  "2": 8px
  "3": 12px
  "4": 16px
  "6": 24px
  "8": 32px
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 40px
    padding: 16px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 40px
    padding: 16px
  button-secondary-hover:
    backgroundColor: "{colors.surface-2}"
  button-ghost:
    textColor: "{colors.muted}"
    rounded: "{rounded.full}"
    size: 40px
  button-ghost-hover:
    backgroundColor: "{colors.surface-2}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-brand}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 40px
    padding: 16px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    height: 40px
    padding: 16px
  list-item:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: 12px 16px
  list-item-hover:
    backgroundColor: "{colors.surface-2}"
  list-item-unread:
    backgroundColor: "{colors.brand-soft}"
  tab:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    height: 44px
  tab-selected:
    textColor: "{colors.ink}"
  nav-item:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: 8px 12px
  nav-item-selected:
    backgroundColor: "{colors.surface-2}"
  badge:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 0 8px
  badge-neutral:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 0 8px
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: 16px
    width: 512px
  menu:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.xl}"
  avatar:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.full}"
    size: 40px
---

# Subscope Design System

apps/web の画面はすべてこのファイルに従い、Tailwind CSS だけで書く。UIライブラリは使わない。前半のYAMLは [DESIGN.md形式](https://github.com/google-labs-code/design.md) のデザイントークンで、`app/app.css` の `@theme` と同じ値を持つ。値を変えるときは両方を同時に変える。

## Overview

Blueskyが使えなくなったときに、同じ会話をそのまま続けられる場所。画面の構成はBluesky公式クライアントに寄せて覚え直しをなくし、色・フォント・ロゴは公式と全く違うものにしてクローンではないと分かるようにする。

- 雰囲気: やわらかく落ち着いた、読むことに集中できる画面。飾りは少なく、情報は詰めすぎない
- 色: 木苺の赤をアクセントに1色だけ使い、背景にもうっすら混ぜて白黒の冷たさをなくす
- 形: 角は丸い。押せるものは丸、箱は12pxの角丸
- 奥行き: 影ではなく線と背景色の差で区切る
- ロゴ: 潜望鏡の先端（くさび形のヘッドと丸いレンズ）。ヘッドは墨、レンズは `brand`。`public/favicon.svg` をfaviconとREADMEで共有する

## Colors

色は下のトークンだけを使う。Tailwind標準の色（`gray-500`、`red-600`、`white`、`black` など）は使わない。例外はダイアログの暗幕の `bg-black/40` だけ。

ライト・ダークはOSの設定（`prefers-color-scheme`）で切り替え、トークンの値だけを差し替える。YAMLの値はライトのもので、ダークの値は次の表のとおり。

| トークン     | 使う場所                                                   | ライト             | ダーク                    |
| ------------ | ---------------------------------------------------------- | ------------------ | ------------------------- |
| `surface`    | 画面・ダイアログ・メニューの背景                           | `#B8326B` 7% + 白  | `#E8709F` 9% + `#121314`  |
| `surface-2`  | ホバー、選択中のナビ、アバターや画像の読み込み前           | `#B8326B` 13% + 白 | `#E8709F` 5% + `#0C0D0E`  |
| `line`       | 区切り線、入力欄・枠ボタン・埋め込みの枠                   | `#B8326B` 22% + 白 | `#E8709F` 20% + `#24262A` |
| `ink`        | 本文、名前、見出し                                         | `#17191C`          | `#ECEEF0`                 |
| `muted`      | ハンドル、日時、件数、説明文、選ばれていないタブ           | `ink` の62%        | `ink` の62%               |
| `brand`      | 主ボタン、リンク、いいね済み、選択中タブの下線、フォーカス | `#B8326B`          | `#E8709F`                 |
| `on-brand`   | `brand` と `danger` の上の文字                             | `#FFFFFF`          | `#17191C`                 |
| `brand-soft` | 未読の通知など、目立たせたい行の背景                       | `brand` の12%      | `brand` の16%             |
| `danger`     | 削除・BANなど取り消せない操作、エラーの文字                | `#C62828`          | `#EF6B6B`                 |

- `brand` は1つの領域で一番大事な操作1つにだけ使う。並んだボタンをすべて `brand` にしない
- 文字色は `ink`・`muted`・`brand`・`danger` の4つだけ

## Typography

フォントは丸ゴシックの Zen Maru Gothic だけを使い、太さは400と700の2つだけにする。文字の大きさは下の6段階を `text-{名前}` のクラスで指定する。大きさ・行の高さ・太さが一度に決まるので、`font-bold` や `leading-*` を重ねない。

| 名前      | 大きさ | 太さ | 行の高さ | 使う場所                               |
| --------- | ------ | ---- | -------- | -------------------------------------- |
| `title`   | 20px   | 700  | 1.4      | ページの見出し、プロフィールの表示名   |
| `heading` | 18px   | 700  | 1.4      | セクション・ダイアログの見出し         |
| `body-lg` | 18px   | 400  | 1.6      | スレッドで選んだ投稿の本文             |
| `body`    | 16px   | 400  | 1.6      | 投稿本文、入力欄、ナビ                 |
| `label`   | 14px   | 400  | 1.4      | ボタン、タブ、メニュー、ハンドルや日時 |
| `caption` | 12px   | 400  | 1.4      | バッジ、注記                           |

- 例外として、投稿者の名前、主ボタン、選択中のタブとナビだけは `font-bold` を足してよい
- 入力欄はiOSで拡大されないよう `body` 以上にする
- 長いURLや英単語で崩れないよう、投稿本文には `wrap-break-word whitespace-pre-wrap` を付ける

## Layout

Bluesky公式と同じく、PCは3カラム、スマホは1カラムにする。切り替えは `lg`（1024px）だけを使い、ほかのブレークポイントは使わない。

- PC: 左にナビ（幅240px）、中央に選んだ画面を1つ（最大幅 `max-w-main` = 600px）、右にサーバーの案内（幅320px）。3つを画面の中央に寄せる
- スマホ: 上にヘッダー（左に自分のアバター、中央にロゴ）、下にタブ（ホーム・検索・通知・プロフィール）、右下に投稿ボタン
- 中央の画面の見出しは上に固定（`sticky top-0`）し、背景は `surface`、下に線を引く

余白は4pxを1単位とし、`1`・`2`・`3`・`4`・`6`・`8`（4〜32px）の段階だけを使う。よく使う組み合わせは次のとおり。

| 場所                             | 余白        |
| -------------------------------- | ----------- |
| 一覧の行（投稿・ユーザー・通知） | `px-4 py-3` |
| アバターと本文の間               | `gap-3`     |
| 行の中の要素どうし               | `gap-2`     |
| 投稿のアクションどうし           | `gap-8`     |
| セクション・ダイアログの内側     | `p-4`       |
| セクションどうし                 | `gap-6`     |

## Elevation & Depth

影は使わず、平らな画面にする。重なりや区切りは次の方法で表す。

- 一覧の行やセクションは `border-b border-line` の1pxの線で区切る。カードで囲まない
- ホバーと選択は背景を `surface-2` にする
- 画面の上に浮くもの（メニュー、スマホの投稿ボタン）だけ `shadow-lg` を付ける
- ダイアログは影ではなく暗幕（`backdrop:bg-black/40`）で浮かせる

## Shapes

角丸は2種類だけにする。

- `rounded-full`: 押せる部品（ボタン、1行の入力欄、検索欄、バッジ）とアバター
- `rounded-xl`（12px）: 箱（ダイアログ、メニュー、複数行の入力欄、画像、引用・リンクの埋め込み、ナビの項目）

線はすべて1pxの `border-line`。例外は選択中タブの下線で、3pxの `brand` にする。

## Components

繰り返し使う部品は `app/components/ui/` にReactコンポーネントとして置き、画面ではそれを使う。同じ見た目をその場のクラスで作り直さない。2つ以上のfeatureで使うものだけを `components/ui/` に置き、1つのfeatureでしか使わないものは `features/{feature}/parts/` に置く。部品を足したら下の一覧に追記する。

### 状態

すべての部品で次の表し方をそろえる。

- ホバー: 背景のない部品は `hover:bg-surface-2`、塗りの部品は `hover:opacity-90`
- フォーカス: `app.css` で全要素の `:focus-visible` に `brand` の2pxの輪郭線を付けている。各部品では指定せず、`outline-none` で消さない
- 無効: `disabled:opacity-50 disabled:cursor-not-allowed`
- 送信中: ボタンを無効にし、ラベルの前に lucide の `LoaderCircle` を `animate-spin` で出す
- エラー: 入力欄の枠を `border-danger` にし、下に `text-label text-danger` で理由を出す
- 空の一覧: `py-8 text-center text-label text-muted` で1文を出す
- 動き: スピナーと読み込み中のプログレスバー（`animate-progress`）以外のアニメーションやトランジションは付けない

### 一覧

| 部品     | ファイル     | 使い方                                                                                                                                                                |
| -------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button` | `button.tsx` | 種類は `primary`（塗り）、`secondary`（`line` の枠）、`ghost`（枠なし・アイコンだけ）、`danger`。大きさは高さ40pxと32px（`sm`）。`<Link>` には `buttonClass()` を使う |
| `Input`  | `input.tsx`  | 1行の入力欄。ラベルは上に `text-label` で置く                                                                                                                         |
| `Dialog` | `dialog.tsx` | `<dialog>` で作る。幅は最大512px、見出しは `text-heading`、ボタンは右寄せで主ボタンを右端に置く。暗幕のクリックで閉じる                                               |
| `Menu`   | `menu.tsx`   | `popover` 属性で作るメニュー。項目は `px-4 py-2 text-label`                                                                                                           |
| `Tabs`   | `tabs.tsx`   | URLで切り替えるタブ。均等幅で、選択中は `text-ink font-bold` と下線                                                                                                   |
| `Avatar` | `avatar.tsx` | 大きさは28px（ナビ・小さい一覧）、40px（投稿・ユーザー一覧）、80px（プロフィール）の3つ                                                                               |
| `Badge`  | `badge.tsx`  | 件数は `brand` の塗り、状態は `surface-2` の塗り、エラーの状態は `surface-2` の塗りに `danger` の文字                                                                 |

- チェックボックス・ラジオ・セレクトはブラウザ標準の要素を使う。色は `app.css` の `accent-color` で `brand` になる
- アイコンは lucide-react だけを使う。大きさはボタンや補足の中で `size-4`、投稿のアクションで `size-5`、ナビとタブで `size-6`

## Do's and Don'ts

- Do: 迷ったらこのファイルの値から選び、新しい値を作らない
- Do: 押せる部品は高さ40px以上にして、スマホで押しやすくする
- Do: ライトとダークの両方で見た目を確かめる
- Don't: `text-[15px]`、`p-[10px]`、`rounded-[14px]`、`#fff` のような任意値を書かない
- Don't: Tailwind標準の色、`font-medium`などの中間の太さ、`rounded-md` などほかの角丸を使わない
- Don't: カードを入れ子にしたり、影で区切ったりしない
- Don't: Bluesky公式の青や蝶のロゴに似せない
