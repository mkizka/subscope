# CLAUDE.md

このファイルは、このリポジトリでコードを操作する際のClaude Code (claude.ai/code) への指針を提供します。

## プロジェクトのコンセプト

AT Protocolを使用したBluesky互換AppViewです。サブスクライバー(サーバー登録ユーザー)とそのフォロイーのレコードのみをTap経由で保存することで、ストレージ容量を最小限に抑えることを目的としています。

## アーキテクチャ

### 概要

AppViewの各機能を複数アプリケーションに分割したmonorepoです。

appsディレクトリ(アプリケーション)

- `@repo/ingester`
  - Tapと接続し、送られてきたイベントの処理ジョブをキューに送信
- `@repo/worker`
  - BullMQを使用してレコードをデータベースにインデックスするワーカー
- `@repo/web`
  - Webクライアント・管理画面を提供するサーバー
  - React Router(framework mode)で実装
  - デザインはdaisyUIを使用
- `@repo/appview`
  - XRPC APIを提供するAppViewサーバー
  - PDS経由のクライアントリクエストはここに `atproto-proxy` ヘッダで転送される

packagesディレクトリ(共通パッケージ)

- `@repo/db` - Drizzle ORMデータベースの定義
- `@repo/common/domain` - ドメインモデル
- `@repo/common/infrastructure` - インフラストラクチャ
- `@repo/common/utils` - 共有ユーティリティ関数
- `@repo/client` - `@atproto/lex`で生成したlexiconスキーマ
- `@repo/test-utils` - テスト用データ生成ファクトリを含むユーティリティ

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
    - /parts ... components/uiなどを使用した最小のUI。単体で意味を持たない
    - /blocks ... partsを使用したUIのまとまり。単体で意味を持つ
- ページはpagesディレクトリに{name}-page.tsxとして配置し、storyを書く
  - routesはloader/actionを持ち、表示はpagesのページコンポーネントに任せる

### 仕様書・資料など

- システム仕様
  - docs/specs 以下を参照
- Lexiconのインデックス実装追加ガイド
  - docs/dev/lexicon-implementation.md
- Identity Event処理
  - docs/dev/identity-event-handling.md

## 開発の進め方(仕様駆動)

機能の追加・変更は、必ず以下の順序で進めてください。

1. docs/specs の仕様書に、IDを振った仕様項目を追加・変更する
2. 各仕様項目を検証するAPIテスト(apps/appview)またはE2Eテスト(apps/web)を追加・変更する
   - テスト名の先頭に仕様項目のIDを書き、仕様項目とテストを1対1で対応させる
3. テストが通るように実装する

## 開発コマンド

以下のコマンドを使用します。コードの変更後は**必ず**pnpm allを実行して全ての項目をチェックしてください。

```bash
pnpm install  # 依存パッケージのインストール
pnpm all      # 型チェック、フォーマット、全テストを実行
pnpm all:unit # 型チェック、フォーマット、unitテストを実行(Dockerが使えない環境向け)
```

特定パッケージだけを対象にしたい場合は、コマンドの後ろに`--filter`オプションを付与してください。

```bash
pnpm typecheck --filter @repo/appview
```

特定のテストだけを対象にしたい場合は、allコマンドの後ろにテストファイル名を付与してください。

```bash
pnpm all post-indexer
```
