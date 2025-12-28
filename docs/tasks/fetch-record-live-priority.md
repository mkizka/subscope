# fetchRecordジョブにlive優先度を伝播させる

## 概要

tapイベントの`live: true/false`をfetchRecordジョブにも伝播させ、live由来のジョブを優先的に処理する。

## 背景

- commitジョブには既に`live`による優先度設定が実装済み（`apps/ingester/src/application/handle-commit-use-case.ts`）
- fetchRecordジョブはcommitジョブから派生して発生するが、現状は優先度が設定されていない
- live（リアルタイム）イベント由来のfetchRecordも優先的に処理したい

## 方針

`IndexingContext`型を新規作成し、`live`と`depth`を保持。「インデックス処理がどのような状況で発生したか」を表すコンテキストとして扱う。

### なぜIndexingContextか

- `depth`と`live`は両方「元のイベントから発生した状態」
- `depth`は再帰で変化、`live`は不変だが、同じコンテキスト内の属性
- 今後の拡張（例: `source: "firehose" | "backfill"`）にも対応しやすい

## 変更ファイル一覧

### 1. ICollectionIndexerにIndexingContext型を追加

**ファイル**: `apps/worker/src/application/interfaces/services/index-collection-service.ts`

`depth`と同様にインラインで型を扱う。型エイリアスはこのファイルで定義し、各所で`import`する。

```typescript
export type IndexingContext = {
  live: boolean;
  depth: number;
};

export interface ICollectionIndexer {
  upsert: ({
    ctx,
    record,
    indexingCtx,
  }: {
    ctx: TransactionContext;
    record: Record;
    indexingCtx: IndexingContext;
  }) => Promise<void>;
  // afterActionは変更なし
}
```

### 2. FetchRecordDataにliveを追加

**ファイル**: `packages/common/src/lib/domain/interfaces/job-queue.ts`

```typescript
type FetchRecordData = {
  uri: string;
  depth: number;
  live: boolean; // 追加
};
```

### 3. FetchRecordSchedulerを修正

**ファイル**: `apps/worker/src/application/services/scheduler/fetch-record-scheduler.ts`

- フェーズ1で`schedule(uri, depth, live)`に変更済み
- フェーズ2で`schedule(uri, indexingCtx)`に変更
- `priority`を設定（`indexingCtx.live ? 1 : 2`）

### 4. IndexRecordService.upsert()を修正

**ファイル**: `apps/worker/src/application/services/index-record-service.ts`

- 引数を`{ ctx, record, jobLogger, depth }` → `{ ctx, record, jobLogger, indexingCtx }`に変更

### 5. 各Indexer実装を修正

**ファイル**:

- `apps/worker/src/application/services/indexer/post-indexer.ts`
- `apps/worker/src/application/services/indexer/repost-indexer.ts`
- `apps/worker/src/application/services/indexer/like-indexer.ts`
- `apps/worker/src/application/services/indexer/follow-indexer.ts`
- `apps/worker/src/application/services/indexer/profile-indexer.ts`
- `apps/worker/src/application/services/indexer/generator-indexer.ts`

各Indexerの`upsert({ ctx, record, depth })`を`upsert({ ctx, record, indexingCtx })`に変更

### 6. IndexActorServiceを修正

**ファイル**: `apps/worker/src/application/services/index-actor-service.ts`

- `indexingCtx`を受け取り、Schedulerに渡す

### 7. IndexCommitUseCaseを修正

**ファイル**: `apps/worker/src/application/use-cases/commit/index-commit-use-case.ts`

- `CommitEventDto.live`から`IndexingContext`を作成してIndexRecordServiceに渡す

### 8. FetchRecordUseCaseを修正

**ファイル**: `apps/worker/src/application/use-cases/async/fetch-record-use-case.ts`

- `job.data.live`を取得し、`IndexingContext`を作成してIndexRecordServiceに渡す

### 9. テストの修正

以下のテストファイルで`depth`を`indexingCtx`に変更:

- `apps/worker/src/application/services/index-record-service.test.ts`
- `apps/worker/src/application/services/indexer/post-indexer.test.ts`
- `apps/worker/src/application/services/indexer/repost-indexer.test.ts`
- `apps/worker/src/application/services/indexer/like-indexer.test.ts`
- `apps/worker/src/application/services/indexer/follow-indexer.test.ts`
- `apps/worker/src/application/services/indexer/profile-indexer.test.ts`
- `apps/worker/src/application/services/index-actor-service.test.ts`
- `apps/worker/src/application/use-cases/commit/index-commit-use-case.test.ts`

## 変更の流れ図

```
CommitEventDto { live: true }
  ↓
IndexCommitUseCase
  ↓ IndexingContext { live: true, depth: 0 }
IndexRecordService.upsert()
  ↓
PostIndexer / RepostIndexer
  ↓ indexingCtx
FetchRecordScheduler.schedule()
  ↓ priority: 1 (live=true)
fetchRecord queue
  ↓
FetchRecordUseCase
  ↓ IndexingContext { live: true, depth: 1 }
IndexRecordService.upsert() (再帰)
```

## 実装フェーズ

各フェーズ終了時点で`pnpm all`が通ることを前提に分割。

### フェーズ1: FetchRecordDataにliveを追加

`FetchRecordData`に`live`プロパティを追加。既存の呼び出し箇所も修正する。

- [x] `FetchRecordData`に`live`を追加
- [x] `FetchRecordScheduler`で`live`を受け取り、`priority`を設定して渡す
- [x] `FetchRecordUseCase`で`job.data.live`を使用するように修正
- [x] 呼び出し箇所（indexer, index-actor-service）で仮の値`false`を渡すように修正
- [x] `worker.ts`で`job.data.live`を渡すように修正
- [x] 関連テストを修正
- [x] `pnpm all`で検証

**変更ファイル:**

- `packages/common/src/lib/domain/interfaces/job-queue.ts`
- `apps/worker/src/application/services/scheduler/fetch-record-scheduler.ts`
- `apps/worker/src/application/use-cases/async/fetch-record-use-case.ts`
- `apps/worker/src/application/services/indexer/post-indexer.ts`（仮の値`false`）
- `apps/worker/src/application/services/indexer/repost-indexer.ts`（仮の値`false`）
- `apps/worker/src/application/services/index-actor-service.ts`（仮の値`false`）
- `apps/worker/src/presentation/worker.ts`
- `apps/worker/src/application/services/index-actor-service.test.ts`

### フェーズ2: IndexingContext型の導入とICollectionIndexer修正

`IndexingContext`型を定義し、`ICollectionIndexer`のインターフェースを変更。全Indexer実装も同時に修正。
`FetchRecordScheduler`も`indexingCtx`を受け取るように変更。

- [x] `IndexingContext`型を`ICollectionIndexer`に追加
- [x] 各Indexer実装で`depth`を`indexingCtx`に変更
- [x] `FetchRecordScheduler.schedule`を`schedule(uri, indexingCtx)`に変更
- [x] 関連テストを修正
- [x] `pnpm all`で検証

**変更ファイル:**

- `apps/worker/src/application/interfaces/services/index-collection-service.ts`
- `apps/worker/src/application/services/scheduler/fetch-record-scheduler.ts`
- `apps/worker/src/application/services/indexer/post-indexer.ts`
- `apps/worker/src/application/services/indexer/repost-indexer.ts`
- `apps/worker/src/application/services/indexer/post-indexer.test.ts`
- `apps/worker/src/application/services/indexer/repost-indexer.test.ts`

### フェーズ3: IndexRecordService・IndexActorServiceの修正

`IndexRecordService`と`IndexActorService`で`indexingCtx`を受け取るように修正。

- [x] `IndexRecordService.upsert()`の引数を`indexingCtx`に変更
- [x] `IndexActorService`で`indexingCtx`を`FetchRecordScheduler`に渡す
- [x] 関連テストを修正
- [x] `pnpm all`で検証

**変更ファイル:**

- `apps/worker/src/application/services/index-record-service.ts`
- `apps/worker/src/application/services/index-actor-service.ts`
- `apps/worker/src/application/services/index-record-service.test.ts`

### フェーズ4: UseCase層の修正

`IndexCommitUseCase`と`FetchRecordUseCase`で`IndexingContext`を作成して渡す。

- [x] `IndexCommitCommand`に`live`プロパティを追加
- [x] `IndexCommitUseCase`で`live`から`IndexingContext`を作成
- [x] `FetchRecordUseCase`で`live`から`IndexingContext`を作成
- [x] 関連テストを修正
- [x] `pnpm all`で検証

**変更ファイル:**

- `apps/worker/src/application/use-cases/commit/index-commit-command.ts`
- `apps/worker/src/application/use-cases/commit/index-commit-use-case.ts`
- `apps/worker/src/application/use-cases/async/fetch-record-use-case.ts`
- `apps/worker/src/application/use-cases/commit/index-commit-use-case.test.ts`

## 注意事項

- `afterAction`は`fetchRecordScheduler`を呼ばないため、`indexingCtx`を渡す必要なし
- BullMQのpriority値は小さいほど優先度が高い（`live: true` → `priority: 1`）
- 既存の`CommitEventDto.live`は実装済み（ingesterで設定済み）
