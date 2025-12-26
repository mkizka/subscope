# Transactional Outbox パターン導入

## 概要

汎用的なTransactional Outboxパターンを導入し、TAP登録など外部処理をアトミックに実行できるようにする。

## 現状の問題

| 箇所                   | ファイル                                                            | 問題                                               |
| ---------------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| SubscribeServerUseCase | `apps/appview/src/application/subscribe-server-use-case.ts:91`      | Transaction完了後に`tapClient.addRepo()`を呼び出し |
| FollowIndexer          | `apps/worker/src/application/services/indexer/follow-indexer.ts:43` | Transaction内で`tapClient.addRepo()`を呼び出し     |

## 設計

```
┌─────────────────────────────────────────────────────────────────┐
│ Transaction                                                      │
│  ┌──────────────┐    ┌──────────────┐                           │
│  │ Business     │    │ Outbox       │                           │
│  │ Logic        │───▶│ Table        │                           │
│  │ (DB保存)     │    │ (イベント記録)│                           │
│  └──────────────┘    └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ processOutbox    │
                    │ Worker           │
                    └────────┬─────────┘
                             │
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
    ┌────────────┐   ┌────────────┐   ┌────────────┐
    │ tapAddRepo │   │ (将来)     │   │ (将来)     │
    │ Job        │   │            │   │            │
    └────────────┘   └────────────┘   └────────────┘
```

---

## Phase 1: スキーマとドメイン層

- [x] `packages/db/src/schema.ts` にoutboxテーブル定義を追加
- [x] `pnpm db:generate` でマイグレーション生成
- [x] `packages/common/src/lib/domain/outbox-event/outbox-event.ts` エンティティ作成
- [x] `packages/common/src/lib/domain/interfaces/outbox-repository.ts` インターフェース作成
- [x] `packages/common/src/domain.ts` にエクスポート追加

### Outboxテーブル定義

```typescript
export const outbox = pgTable("outbox", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});
```

### OutboxEventエンティティ

```typescript
export type TapAddRepoPayload = {
  actorDid: Did;
};

export type OutboxEventData = {
  eventType: "tap_add_repo";
  payload: TapAddRepoPayload;
};

export class OutboxEvent<T extends OutboxEventData = OutboxEventData> {
  private constructor(
    readonly id: string,
    readonly eventType: T["eventType"],
    readonly payload: T["payload"],
    readonly createdAt: Date,
    private _processedAt: Date | null,
  ) {}

  get processedAt(): Date | null {
    return this._processedAt;
  }

  static create<T extends OutboxEventData>(data: T): OutboxEvent<T> {
    return new OutboxEvent(
      randomUUID(),
      data.eventType,
      data.payload,
      new Date(),
      null,
    );
  }

  static reconstruct<T extends OutboxEventData>(params: {
    id: string;
    eventType: T["eventType"];
    payload: T["payload"];
    createdAt: Date;
    processedAt: Date | null;
  }): OutboxEvent<T> {
    return new OutboxEvent(
      params.id,
      params.eventType,
      params.payload,
      params.createdAt,
      params.processedAt,
    );
  }

  markAsProcessed(): void {
    if (this._processedAt !== null) {
      throw new Error("Event is already processed");
    }
    this._processedAt = new Date();
  }
}
```

---

## Phase 2: インフラ層

- [ ] `packages/common/src/lib/infrastructure/outbox-repository/outbox-repository.ts` 作成
- [ ] `packages/common/src/lib/infrastructure/outbox-repository/outbox-repository.in-memory.ts` 作成
- [ ] `packages/common/src/infrastructure.ts` にエクスポート追加
- [ ] `packages/common/src/test.ts` にエクスポート追加
- [ ] `packages/common/src/lib/domain/interfaces/job-queue.ts` に`processOutbox`と`tapAddRepo`追加
- [ ] `packages/common/src/lib/infrastructure/job-queue/job-queue.ts` にキュー追加
- [ ] `packages/common/src/lib/infrastructure/job-queue/job-queue.in-memory.ts` にキュー追加

### IOutboxRepositoryインターフェース

```typescript
export interface IOutboxRepository {
  // upsert: idが存在すれば更新、なければ挿入
  save<T extends OutboxEventData>(params: {
    ctx: TransactionContext;
    event: OutboxEvent<T>;
  }): Promise<void>;

  findUnprocessed(): Promise<OutboxEvent[]>;

  deleteProcessed(params: { olderThan: Date }): Promise<number>;
}
```

### JobData型拡張

```typescript
export type JobData = {
  // ... 既存
  processOutbox: Record<string, never>;
  tapAddRepo: Did;
};
```

---

## Phase 3: ユースケース作成

- [ ] `apps/worker/src/application/use-cases/async/process-outbox-use-case.ts` 作成
- [ ] `apps/worker/src/application/use-cases/async/tap-add-repo-use-case.ts` 作成
- [ ] `apps/worker/src/application/use-cases/async/process-outbox-use-case.test.ts` 作成
- [ ] `apps/worker/src/application/use-cases/async/tap-add-repo-use-case.test.ts` 作成

### ProcessOutboxUseCase

```typescript
export class ProcessOutboxUseCase {
  static inject = [
    "outboxRepository",
    "jobQueue",
    "transactionManager",
  ] as const;

  async execute(): Promise<void> {
    const events = await this.outboxRepository.findUnprocessed();
    for (const event of events) {
      await this.dispatch(event);
      await this.transactionManager.transaction(async (ctx) => {
        event.markAsProcessed();
        await this.outboxRepository.save({ ctx, event });
      });
    }
  }

  private async dispatch(event: OutboxEvent): Promise<void> {
    switch (event.eventType) {
      case "tap_add_repo": {
        const payload = event.payload as TapAddRepoPayload;
        await this.jobQueue.add({
          queueName: "tapAddRepo",
          jobName: "tapAddRepo",
          data: payload.actorDid,
        });
        break;
      }
    }
  }
}
```

### TapAddRepoUseCase

```typescript
export class TapAddRepoUseCase {
  static inject = ["tapClient"] as const;

  async execute(did: Did): Promise<void> {
    await this.tapClient.addRepo(did);
  }
}
```

---

## Phase 4: Worker拡張とDI設定

- [ ] `apps/worker/src/presentation/worker.ts` にprocessOutbox/tapAddRepoワーカー追加
- [ ] `apps/worker/src/worker.ts` DI設定更新
- [ ] `apps/worker/src/shared/test-utils.ts` にInMemoryOutboxRepository追加

### SyncWorker修正

```typescript
this.workers = [
  // ... 既存のワーカー

  createWorker("processOutbox", async () => {
    await processOutboxUseCase.execute();
  }),

  createWorker("tapAddRepo", async (job) => {
    await tapAddRepoUseCase.execute(job.data);
  }),
];
```

---

## Phase 5: FollowIndexer Outbox化

- [ ] `apps/worker/src/application/services/indexer/follow-indexer.ts` のtapClient依存をoutboxRepositoryに変更
- [ ] `apps/worker/src/application/use-cases/commit/index-commit-use-case.ts` にjobQueue依存追加、processOutboxジョブスケジュール
- [ ] `apps/worker/src/application/services/indexer/follow-indexer.test.ts` 修正
- [ ] `apps/worker/src/application/use-cases/commit/index-commit-use-case.test.ts` 修正

### FollowIndexer修正

```typescript
// Before
await this.tapClient.addRepo(follow.subjectDid);

// After
const outboxEvent = OutboxEvent.create({
  eventType: "tap_add_repo",
  payload: { actorDid: follow.subjectDid },
});
await this.outboxRepository.save({ ctx, event: outboxEvent });
```

### IndexCommitUseCase修正

```typescript
async doIndexCommit({ commit, jobLogger }: IndexCommitCommand) {
  await this.transactionManager.transaction(async (ctx) => {
    // ... 既存のロジック
  });

  // Transaction完了後にOutbox処理をスケジュール
  await this.jobQueue.add({
    queueName: "processOutbox",
    jobName: "processOutbox",
    data: {},
    options: { jobId: "processOutbox" },
  });
}
```

---

## Phase 6: SubscribeServerUseCase Outbox化

- [ ] `apps/appview/src/application/subscribe-server-use-case.ts` のtapClient依存をoutboxRepository+jobQueueに変更
- [ ] `apps/appview/src/appview.ts` DI設定更新
- [ ] `apps/appview/src/shared/test-utils.ts` にInMemoryOutboxRepository追加
- [ ] `apps/appview/src/application/subscribe-server-use-case.test.ts` 修正

### SubscribeServerUseCase修正

```typescript
// Before
await this.tapClient.addRepo(actorDid);

// After
await this.transactionManager.transaction(async (ctx) => {
  // ... 既存の保存処理 ...

  const outboxEvent = OutboxEvent.create({
    eventType: "tap_add_repo",
    payload: { actorDid },
  });
  await this.outboxRepository.save({ ctx, event: outboxEvent });
});

await this.jobQueue.add({
  queueName: "processOutbox",
  jobName: "processOutbox",
  data: {},
  options: { jobId: "processOutbox" },
});
```

---

## スコープ外

- CleanupOutboxUseCase（処理済みレコードの定期削除）
- cronジョブ設定
- fetchRecordのOutbox化

## 将来の拡張方法

新しいイベント種別を追加する場合：

1. `OutboxEventData`にUnionを追加

   ```typescript
   | { eventType: "new_event"; payload: NewEventPayload }
   ```

2. `ProcessOutboxUseCase.dispatch()`にcase追加

3. 対応するジョブをJobQueueに追加（既存ジョブを使う場合は不要）
