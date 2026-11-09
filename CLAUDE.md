# CLAUDE.md

このファイルは、このリポジトリでコードを操作する際のClaude Code (claude.ai/code) への指針を提供します。

## プロジェクトのコンセプト

AT Protocolを使用したBluesky互換AppViewです。メンバー(招待コードでサーバーに登録したアカウント)とそのフォロー先のレコードのみをTap経由で保存することで、ストレージ容量を最小限に抑えることを目的としています。

## アーキテクチャ

### 概要

AppViewの各機能を複数アプリケーションに分割したmonorepoです。

appsディレクトリ(アプリケーション)

- `@repo/worker`
  - Tapとモデレーションサービスに接続し、受け取ったレコードとラベルをデータベースにインデックスするワーカー
- `@repo/web`
  - Webクライアント・管理画面を提供するサーバー
  - React Router(framework mode)で実装
  - デザインはapps/web/DESIGN.mdのルールに従いTailwind CSSで実装
- `@repo/appview`
  - XRPC APIを提供するAppViewサーバー
  - PDS経由のクライアントリクエストはここに `atproto-proxy` ヘッダで転送される

packagesディレクトリ(共通パッケージ)

- `@repo/db` - Drizzle ORMデータベースの定義
- `@repo/common/interface` - インターフェース定義
- `@repo/common/infrastructure` - インフラストラクチャ
- `@repo/common/utils` - 共有ユーティリティ関数
- `@repo/client` - `@atproto/lex`で生成したlexiconスキーマ
- `@repo/test-utils` - テスト用データ生成ファクトリを含むユーティリティ
- `@repo/eslint-config` - 全パッケージ共通のESLint設定

e2eディレクトリ

- `@repo/e2e`
  - PDS・worker・appview・webを全て起動し、Webクライアントを操作してシステム全体を検証するPlaywrightのE2Eテスト
  - `tests/{仕様書名}/` にテスト、`helpers/` にPDS操作やログインなどの共通処理を置く

### 実装パターン(サーバー)

各アプリはオニオンアーキテクチャパターンを参考に以下のような構成で実装しています。

- `application/` - ユースケースとビジネスロジック
- `infrastructure/` - 外部サービス実装
- `presentation/` - HTTPルートとWebSocketハンドラー
- `shared/` - 環境設定とユーティリティ

### 実装パターン(クライアント)

Reactコンポーネントは以下の方針で実装しています。

- Presentational/ContainerパターンでロジックとUIを可能な限り分離
- PresentationalはXXX、ContainerはXXXContainerの形式で命名
  - ファイル名はxxx.tsx, xxx-container.tsxとする
- UIはfeaturesディレクトリ以下に配置して次の構成にする
  - features/{feature}
    - 種別ごとのサブディレクトリは作らず、feature直下に `xxx.tsx` / `xxx-container.tsx` / `xxx.stories.tsx` を並べる
    - 複数のfeatureから使う投稿の部品は `features/post`、アカウントの部品は `features/account` に置く
- ページはpages/admin(管理画面)かpages/client(クライアント)に{name}-page.tsxとして配置し、storyを書く
  - routesはloader/actionを持ち、表示はpagesのページコンポーネントに任せる
- 見た目が変わるUI変更や新規UIでは、同じPRで該当コンポーネントのstoryを追加・更新する
  - 読み込み中・エラー・空など、状態ごとの見た目もstoryにする
  - pages配下のstoryはVRT(e2e/vrt)の対象なので、スナップショットも更新する

### 仕様書・資料など

- システム仕様
  - docs/specs 以下を参照
- プロジェクトのゴール
  - docs/goal.md
- 用語集
  - docs/glossary.md
- Webクライアントの構成
  - docs/dev/web-architecture.md
- Webクライアントのデザインルール
  - apps/web/DESIGN.md
- Lexiconのインデックス実装追加ガイド
  - docs/dev/lexicon-implementation.md
- Identity Event処理
  - docs/dev/identity-event-handling.md
- リポジトリとクエリサービスの使い分け
  - docs/dev/repository-and-query.md
- appviewのビュー生成(ViewContext、*Views)
  - docs/dev/view-pipeline.md
- Railwayへのデプロイ(IaC)
  - docs/dev/railway.md

## 開発の進め方(仕様駆動)

機能の追加・変更は、必ず以下の順序で進めてください。

1. docs/specs の仕様書に、IDを振った仕様項目を追加・変更する
2. 各仕様項目を検証するテストを追加・変更する
   - webは、画面単体で検証できる項目はStorybookのplayテスト(storyの`name`を`"{仕様名}-s{番号}: {仕様項目の文}"`にする)、ページ遷移やサーバー連携を含む項目はE2Eテスト(テスト名を`"{仕様名}-e{番号}: {仕様項目の文}"`にする)にする。番号はそれぞれ1から振る
   - それ以外はできるだけ終端に近いテスト(appviewならXRPCのAPIテスト)にする
   - テスト名(webのstoryは`name`)は`"{ID}: {仕様項目の文}"`とし、仕様項目とテストを1対1で対応させる
3. テストが通るように実装する

### 仕様書の書き方

- docs/specs には web-client.md、web-admin.md、appview.md、worker.md のみを置き、1ファイルで1アプリの振る舞いを定める
- webの仕様項目のIDは`{見出しの短い名前}-s{連番}`(Storybookのplayテストで検証)か`{見出しの短い名前}-e{連番}`(E2Eで検証)とし、連番は見出しごとにsとeそれぞれ1から振る(例: backfillBanner-s1, backfillBanner-e1)。webの既存項目(`{見出しの短い名前}-{連番}`)は、見出しごとにStorybookへ移すときにs/eへ改める
- 見出しはAPIの名前か機能・画面の名前とし、直後にその機能が何をするかを1〜2文で書く
- 仕様項目は「〜の場合、〜を返す」というテストの条件ではなく、「〜する」「〜は含めない」という振る舞いのルールを1つだけ書く
- IDは`{見出しの短い名前}-{連番}`とする(例: getTimeline-1)
- 理由や補足などテストできない記述はIDなしの地の文にする

## PRの作成

PRを作成・更新する前に、必ず `.claude/skills/pr-review/SKILL.md` の手順で差分をレビューしてください。

## 開発コマンド

以下のコマンドを使用します。コードの変更後は**必ず**pnpm allを実行して全ての項目をチェックしてください。

```bash
pnpm install                                             # 依存パッケージのインストール
pnpm all                                                 # 型チェック、フォーマット、全テストを実行
pnpm all:unit                                            # 型チェック、フォーマット、unitテストを実行(Dockerが使えない環境向け)
pnpm --filter @repo/web exec playwright install chromium # pnpm allでStorybookのテストを動かすために初回だけ必要
```

特定パッケージだけを対象にしたい場合は、型チェック・フォーマットには`--filter`、テストには`--project`を付与してください。`pnpm all --filter`はvitestに`--filter`が渡りエラーになります。

```bash
pnpm typecheck --filter @repo/appview
pnpm test run --project 'appview:*'
```

特定のテストだけを対象にしたい場合は、allコマンドの後ろにテストファイル名を付与してください。

```bash
pnpm all post-indexer
```

turboが`Exec format error`で失敗する場合は、`npm i -g pnpm@12.15.0`で`package.json`の`packageManager`と同じバージョンのpnpmを入れてください。
