# CLAUDE.md

このファイルは、このリポジトリでコードを操作する際のClaude Code (claude.ai/code) への指針を提供します。

## プロジェクトのコンセプト

システムは選択的データ保存アプローチに従い、「サブスクライバー」（サブスクリプションレコードを作成したユーザー）とそのフォローグラフのレコードのみを保存してデータベースサイズを最小化します。

## アーキテクチャ

### 概要

AppViewの各機能を複数アプリケーションに分割したmonorepoです。

appsディレクトリ(アプリケーション)

- `@repo/appview` - XRPCを実装したAPIサーバー
- `@repo/ingester` - Firehose(Jetstream)と接続し、送られてきたレコードの処理ジョブをキューに送信
- `@repo/worker` - BullMQを使用してレコードをデータベースにインデックスするワーカー
- `@repo/blob-proxy` - PDSの画像をキャッシュして配信するプロキシサーバー
- `@repo/admin` - 招待コードの発行などを行うAppView管理者向け管理画面

packagesディレクトリ(共通パッケージ)

- `@repo/db` - Drizzle ORMデータベースの定義
- `@repo/common/domain` - ドメインモデル
- `@repo/common/infrastructure` - インフラストラクチャ
- `@repo/common/utils` - 共有ユーティリティ関数
- `@repo/client` - lex-cliで生成したXRPCクライアント実装
- `@repo/test-utils` - テスト用データ生成ファクトリを含むユーティリティ

### 実装パターン

各アプリはオニオンアーキテクチャパターンを参考に以下のような構成で実装しています。

- `application/` - ユースケースとビジネスロジック
- `infrastructure/` - 外部サービス実装
- `presentation/` - HTTPルートとWebSocketハンドラー
- `shared/` - 環境設定とユーティリティ

### 仕様書・資料など

- システム仕様
  - docs/specs 以下を参照
- Lexiconのインデックス実装追加ガイド
  - docs/guide/lexicon-implementation.md
- Identity Event処理
  - docs/guide/identity-event-handling.md
- テストケースの書き方
  - docs/guide/testing.md を参照
- XRPCエンドポイント実装ガイド
  - docs/guide/xrpc-implementation.md
- `@atproto`各種ライブラリやAT Protocol仕様について知りたい時の資料
  - docs/repomix/atproto-repomix-output.xml
- `factory-js/factory`ライブラリについて知りたい時の資料
  - docs/repomix/factoryjs-repomix-output.xml

## 開発コマンド

```bash
pnpm install   # 依存パッケージのインストールと`@repo/client`パッケージのコード生成
pnpm typecheck # 全パッケージの型チェック
pnpm lint      # 全コードのlintとフォーマットチェック
pnpm format    # コードフォーマットとlint問題の自動修正
```

### ファイル編集後の確認項目

ファイルの編集後は最後に必ず以下を確認してください

- リポジトリルートに移動してpnpm typecheckとpnpm formatを実行し、型エラーやlintエラーが残っていないこと
- 変更したファイルがDDD、オニオンアーキテクチャ、単一責任原則に従って適切に分割されていること
- YAGNI原則に従って不要な機能を追加していないこと
- 編集の過程で不要になったファイルや処理を削除で来ていること

## メモリ

- テストケース名は日本語で「(条件)場合、(期待値)」のように書いてください
- テストケースにはarrange-act-assertパターンに基づいたコメントを書いてください
- プロダクションコードにはコメントを追加しないでください
- プロダクションコードに既に存在するコメントは削除しないでください
- テストコードにはコメントを追加することができます
- vitest.config.tsにisolate:falseが指定されていることを考慮してテストにはランダムなデータを使うようにしてください
