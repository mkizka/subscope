# Lexiconレコードのインデックス実装ガイド

新しいレコードタイプ（例：`app.bsky.graph.list`）をインデックスする際の手順です。既存の`app.bsky.graph.follow`の実装を参考にしてください。

## データフロー

```
Tap → Ingester → BullMQ Queue → Worker(IndexCommitUseCase) → IndexRecordService → {RecordType}Indexer → {RecordType}Repository → Database
```

## 手順

### 1. Lexicon定義の取得

1. `packages/client/scripts/generate.sh` の`paths`に対象のlexiconファイルパスを追加
2. `pnpm build`や`pnpm typecheck`を実行すると、bluesky-social/atprotoから定義を取得し`@repo/client`のコードを生成する

Lexicon定義ファイルは手動で作成しないでください。

### 2. データベース

- `packages/db/src/schema.ts` にテーブルを追加し、マイグレーションを作成

### 3. ドメインモデル

- `packages/common/src/lib/domain/{record-type}/{record-type}.ts` にドメインモデル（`Follow.from(record)`のようなファクトリ）を作成
- テスト用ファクトリ `{record-type}.factory.ts` を作成
- `packages/common/src/domain.ts` と `packages/common/src/test.ts` からexport
- `packages/common/src/lib/utils/collection.ts` の`SupportedCollectionMap`と`SUPPORTED_COLLECTIONS`に追加

### 4. Repository

- インターフェース: `apps/worker/src/application/interfaces/repositories/{record-type}-repository.ts`
- 実装: `apps/worker/src/infrastructure/repositories/{record-type}-repository/{record-type}-repository.ts`
- テスト用インメモリ実装: 同ディレクトリの `{record-type}-repository.in-memory.ts`

### 5. Indexer

- `apps/worker/src/application/services/indexer/{record-type}-indexer.ts` に`ICollectionIndexer`を実装
  - `upsert`: レコードを保存する。保存するかどうかの判定もここで行う
  - `afterAction`: 集計ジョブのスケジュールなど、保存・削除後の処理
- `apps/worker/src/application/services/index-record-service.ts` のマップに追加

### 6. DI

- `apps/worker/src/shared/registry.ts` にRepositoryとIndexerを登録
- `apps/worker/src/shared/test-utils.ts` でインメモリ実装に差し替え

### 7. テスト

- Indexerのテスト（`{record-type}-indexer.test.ts`）とRepositoryのテストを追加
- `pnpm all` を実行
