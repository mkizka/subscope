# CLAUDE.md

このファイルは、このリポジトリでコードを操作する際のClaude Code (claude.ai/code) への指針を提供します。

## プロジェクトのコンセプト

AT Protocolを使用したBluesky互換Appviewです。サブスクライバー(サーバー登録ユーザー)とそのフォロイーのレコードのみをTap経由で保存することで、ストレージ容量を最小限に抑えることを目的としています。

## アーキテクチャ

### 概要

Appviewの各機能を複数アプリケーションに分割したmonorepoです。

appsディレクトリ(アプリケーション)

- `@repo/ingester`
  - Firehose(Jetstream)と接続し、送られてきたレコードの処理ジョブをキューに送信
- `@repo/worker`
  - BullMQを使用してレコードをデータベースにインデックスするワーカー
- `@repo/subscope`
  - クライアント・XRPC API・管理画面・画像プロキシを提供するメインサーバー
  - express + react-routerで実装
  - デザインはshadcn/uiを使用

packagesディレクトリ(共通パッケージ)

- `@repo/db` - Drizzle ORMデータベースの定義
- `@repo/common/domain` - ドメインモデル
- `@repo/common/infrastructure` - インフラストラクチャ
- `@repo/common/utils` - 共有ユーティリティ関数
- `@repo/client` - lex-cliで生成したXRPCクライアント実装
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
    - /pages ... parts,blocksを使用したページレイアウト

### 仕様書・資料など

- システム仕様
  - docs/specs 以下を参照
- Lexiconのインデックス実装追加ガイド
  - docs/dev/lexicon-implementation.md
- Identity Event処理
  - docs/dev/identity-event-handling.md
- `@atproto`各種ライブラリやAT Protocol仕様について知りたい時の資料
  - docs/repomix/atproto-repomix-output.xml
- `factory-js/factory`ライブラリについて知りたい時の資料
  - docs/repomix/factoryjs-repomix-output.xml

## 開発コマンド

以下のコマンドを使用します。コードの変更後は**必ず**pnpm allを実行して全ての項目をチェックしてください。

```bash
pnpm install  # 依存パッケージのインストールと`@repo/client`パッケージのコード生成
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
