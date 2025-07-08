# CLAUDE.md

このファイルは、このリポジトリでコードを操作する際のClaude Code (claude.ai/code) への指針を提供します。

## プロジェクトのコンセプト

システムは選択的データ保存アプローチに従い、「サブスクライバー」（サブスクリプションレコードを作成したユーザー）とそのフォローグラフのレコードのみを保存してデータベースサイズを最小化します。

## アーキテクチャ

### 概要

3つのアプリケーションでBluesky AppViewを実装するmonorepoになっています。

appsディレクトリ(アプリケーション)

- `@repo/appview` - XRPCエンドポイント経由でタイムラインやプロフィールなどを提供するAT ProtocolのAppViewサーバー
- `@repo/ingester` - Firehose(Jetstream)と接続し、送られてきたレコードの処理ジョブをキューに送るWebSocketクライアント
- `@repo/worker` - BullMQを使用してレコードをデータベースにインデックスするバックグラウンドジョブプロセッサー

packagesディレクトリ(共通パッケージ)

- `@repo/db` - Drizzle ORMデータベース層
- `@repo/common` - 共有ユーティリティとBullMQジョブ定義
- `@repo/client` - AT Protocolクライアントラッパー

### 実装パターン

各アプリはオニオンアーキテクチャパターンを参考に実装しています。

- `application/` - ユースケースとビジネスロジック
- `infrastructure/` - 外部サービス実装
- `presentation/` - HTTPルートとWebSocketハンドラー
- `shared/` - 環境設定とユーティリティ

## サポートコレクション

インデックス可能なレコードタイプは `packages/common/src/lib/utils/collection.ts` の `SUPPORTED_COLLECTIONS` で定義されています。

新しいレコードタイプを追加する場合は[Lexicon実装ガイド](docs/lexicon-implementation-guide.md)に従って実装してください。

### 仕様書・資料など

- システム仕様
  - @docs/spec.md を参照
- XRPC実装状況
  - @docs/tasks.md
- Lexiconのインデックス実装追加ガイド
  - @docs/guide/lexicon-implementation.md
- Identity Event処理
  - @docs/guide/identity-event-handling.md
- テストケースの書き方
  - @docs/guide/testing.md を参照
- `@atproto`各種ライブラリやAT Protocol仕様について知りたい時の資料
  - docs/repomix/atproto-repomix-output.xml
- `factory-js/factory`ライブラリについて知りたい時の資料
  - docs/repomix/factoryjs-repomix-output.xml

## 開発コマンド

### 初期セットアップ

```bash
pnpm install
```

### データベース操作

```bash
pnpm db:migrate # データベースマイグレーションを実行
pnpm studio     # データベース確認用にDrizzle Studioを開く
```

### 開発

```bash
pnpm typecheck # 全パッケージの型チェック
pnpm lint      # 全コードのlintとフォーマットチェック
pnpm format    # コードフォーマットとlint問題の自動修正
```

## 開発ガイド

### コードのコメントについて

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

### ファイル編集後の確認項目

ファイルの編集後は最後に必ず以下を確認してください

- リポジトリルートに移動してpnpm typecheckとpnpm formatを実行し、型エラーかlintエラーが残っていないこと
- 変更したファイルがDDD、オニオンアーキテクチャ、単一責任原則に従って適切に分割されていること
- YAGNI原則に従って不要な機能を追加していないこと
- 編集の過程で不要になったファイルや処理を削除で来ていること

## AT Protocolのレコード定義について

実装中にレコード定義を確認する必要がある場合は、`packages/client/lexicons`ディレクトリ以下にあるjsonファイルを確認してください。

## メモリ

- テストケース名は日本語で「～の場合、～する」のように条件と期待値を明確に書いてください
- テストケース名には「正しい」のような曖昧な単語の使用を避けてください
- 重要でないnull/undefinedチェックは@repo/commonパッケージのrequired関数を使ってください
- 私が指示するまでコミットしないでください
- テストケースにはarrange-act-assertパターンに基づいたコメントを書いてください
- arrange-act-assertのまとまりごとに1行空行を書いてください
- asの使用は避けてください
- テストを書くときはモックは禁止。使いたいモックがある場合は許可を得てください
- DBマイグレーションファイルの作成は不要です
- try-catchの範囲は必要な最小限になるようにしてください
- 関数の引数が長さ2かそれ以上のときは単一のオブジェクトにしてください
- テストケース内でifやオプショナルチェインを使うことは避け、toMatchObjectで代替してください
- generatedディレクトリ以下は編集しないでください
