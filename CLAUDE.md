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
- **Identity Event処理**: Identity Eventの処理仕様については @docs/identity-event-handling.md を参照
- **実装状況**: API実装の進捗については @docs/tasks.md を参照
- **AT Protocolコードベース**: @docs/atproto-repomix-output.xml を参照

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

## コードのコメントについて

コメントはWhyやWhy notを表すもののみ記載してください。コードが何をしているかが明らかな場合は、コメントを書かないでください。以下に例を示しますが、必要に応じて形式は変更してください。

悪いコメントの例：

```
// xxxにデータを保存
await ctx.db.insert(schema.xxx).values({
  ...
});

// actorが存在しない場合は作成
await this.indexActorService.createIfNotExists({
  ctx,
  did: record.actorDid,
});

// ユーザーを取得
const user = await userRepository.findById(userId);
```

良いコメントの例：

```
// yyyのためにxxxにデータを保存
await ctx.db.insert(schema.xxx).values({
  ...
});

// Postgresには`\u0000`を含む文字列を保存できないため
if (!isValidRecord(record)) {
  return;
}

// レート制限を回避するため1秒待機
await sleep(1000);
```

コメントを書くべき場合：

- 特殊な制約や理由がある場合（例：データベースの制限、外部APIの仕様）
- 一見不要に見える処理の理由を説明する場合
- パフォーマンスやセキュリティ上の理由で特定の実装を選んだ場合
- TODOやFIXMEなどの将来の改善点を記録する場合

## メモリ

- ファイルの編集後は最後に必ずリポジトリルートに移動してpnpm typecheckとpnpm formatを実行し、型エラーかlintエラーが残っていないことを確認してください
- テストケース名は日本語で書いてください
- 重要でないnull/undefinedチェックは@dawn/commonパッケージのrequired関数を使ってください
- 私が指示するまでコミットしないでください
- テストケースにはarrange-act-assertパターンに基づいたコメントを書いてください
- arrange-act-assertのまとまりごとに1行空行を書いて、テストケースごとに空行が2行になるようにしてください
- string型のdid文字列を扱うときはasDid関数でチェックする
- テストを書くときはモックは原則禁止。JobQueueクラスのみモックを使用して良いが、vite-mock-extendedを使用する必要がある
