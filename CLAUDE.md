# CLAUDE.md

このファイルは、このリポジトリでコードを操作する際のClaude Code (claude.ai/code) への指針を提供します。

## アーキテクチャ概要

Dawnは3つのメインアプリケーションでBluesky AppViewを実装するモノレポです：

- **appview**: XRPCエンドポイント経由でタイムラインとプロフィールデータを提供するAT Protocol AppViewサーバー
- **ingester**: リアルタイムファイアホースデータを取り込み、処理ジョブをキューに送るJetstream WebSocketクライアント
- **worker**: BullMQを使用してレコードをデータベースにインデックスするバックグラウンドジョブプロセッサー

## プロジェクトのコンセプト

システムは選択的データ保存アプローチに従い、「サブスクライバー」（サブスクリプションレコードを作成したユーザー）とそのフォローグラフのレコードのみを保存してデータベースサイズを最小化します。

## 実装ガイド

- **システム仕様**: @docs/spec.md を参照
- **Lexicon実装**: 新しいレコードタイプを追加する場合は @docs/lexicon-implementation-guide.md を参照
- **実装状況**: API実装の進捗については @docs/tasks.md を参照

## 開発コマンド

### 初期セットアップ

```bash
pnpm install
pnpm dev # atprotoサーバー、コンテナ、全アプリを含む完全な開発環境を実行
```

### データベース操作

```bash
pnpm db:migrate # データベースマイグレーションを実行
pnpm studio     # データベース確認用にDrizzle Studioを開く
```

### 開発

```bash
pnpm dev       # TUI付きで開発モードで全サービスを開始
pnpm typecheck # 全パッケージの型チェック
pnpm lint      # 全コードのlintとフォーマットチェック
pnpm format    # コードフォーマットとlint問題の自動修正
```

### 個別アプリ開発

```bash
pnpm start:appview  # マイグレーション付きでappviewのみ開始
pnpm start:ingester # ingesterのみ開始
pnpm start:worker   # マイグレーション付きでworkerのみ開始
```

### 本番環境

```bash
pnpm build # 全パッケージをビルド
pnpm start # 本番モードで全アプリを開始
```

## パッケージ依存関係

モノレポは共有パッケージでワークスペースを使用：

- `@dawn/db` - Drizzle ORMデータベース層
- `@dawn/common` - 共有ユーティリティとBullMQジョブ定義
- `@dawn/client` - AT Protocolクライアントラッパー

## 開発環境

devスクリプトは自動的に：

1. atproto参照実装をダウンロードしてビルド
2. Docker Compose経由でPostgreSQL、Redis、Jetstreamコンテナを開始
3. データベースマイグレーションを実行
4. ホットリロード付きで3つのアプリを全て開始

システムの要件：

- Node.js 22
- pnpm 10.10.0+
- ローカル開発依存関係用のDocker

## コードアーキテクチャ

各アプリはオニオンアーキテクチャパターンに従う：

- `application/` - ユースケースとビジネスロジック
- `infrastructure/` - 外部サービス実装
- `presentation/` - HTTPルートとWebSocketハンドラー
- `shared/` - 環境設定とユーティリティ

レコードインデックスは、ユーザーとそのフォローグラフとのサブスクリプション関係に基づく選択的保存ルールに従います。

## 開発ルール

- ファイルの編集後は最後に必ずpnpm typecheckとpnpm formatを実行し、型エラーかlintエラーが残っていないことを確認してください
- コメントを書く場合はコードの内容から明らかな文章を書かないでください。コードに現れない外部のコンテキストに絞ってコメントをかいてください
- テストケース名は日本語で書いてください
- 重要でないnull/undefinedチェックは@dawn/commonパッケージのrequired関数を使ってください
